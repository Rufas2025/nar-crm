import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, Lead, LeadProduct } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";

import {
  Plus, Search, ChevronRight, X, Loader2,
  CheckCircle2, AlertTriangle, AlertCircle, Upload,
} from "lucide-react";

// ─── Enums ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em Contato" },
  { value: "qualificado", label: "Qualificado" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

const MATURIDADE_OPTIONS = [
  { value: "inicial", label: "Inicial" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
  { value: "decisao", label: "Decisão" },
];

const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

// ─── Colors ──────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  novo: "text-primary bg-primary/10 border-primary/20",
  em_contato: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  qualificado: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  fechado: "text-green-400 bg-green-400/10 border-green-400/20",
  perdido: "text-destructive bg-destructive/10 border-destructive/20",
};

const maturidadeColor: Record<string, string> = {
  inicial: "text-muted-foreground bg-muted border-border",
  intermediario: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  avancado: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  decisao: "text-green-400 bg-green-400/10 border-green-400/20",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function isOverdue(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) < new Date(new Date().toDateString());
}

function daysSince(iso: string | null) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function truncate(str: string | null, n: number) {
  if (!str) return null;
  return str.length > n ? str.slice(0, n) + "…" : str;
}

type ProximoPassoStatus = { label: string; sub: string; variant: "atrasado" | "emdia" };

function getProximoPassoStatus(at: string | null): ProximoPassoStatus | null {
  if (!at) return null;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const target = new Date(at);
  const diffDays = Math.ceil((target.getTime() - todayStart.getTime()) / 86400000);
  if (diffDays < 0) return { label: "Atrasado", sub: `há ${Math.abs(diffDays)}d`, variant: "atrasado" };
  if (diffDays === 0) return { label: "Em dia", sub: "Hoje", variant: "emdia" };
  if (diffDays === 1) return { label: "Em dia", sub: "Amanhã", variant: "emdia" };
  return { label: "Em dia", sub: `Em ${diffDays} dias`, variant: "emdia" };
}

// ─── Quick views ─────────────────────────────────────────────────────────────

function isProximoPassoAtrasadoOuHoje(at: string | null): boolean {
  if (!at) return false;
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  return new Date(at) <= todayEnd;
}

const QUICK_VIEWS = [
  {
    id: "all",
    label: "Todos",
    dot: null,
    filter: (_: Lead) => true,
  },
  {
    id: "atencao",
    label: "🔴 Atenção Hoje",
    dot: "bg-destructive",
    filter: (l: Lead) => isProximoPassoAtrasadoOuHoje(l.proximo_passo_at ?? null),
  },
  {
    id: "sem_passo",
    label: "🟡 Sem Próximo Passo",
    dot: "bg-yellow-400",
    filter: (l: Lead) => !l.proximo_passo_at,
  },
  {
    id: "sem_contato",
    label: "🔵 Sem Contato 7+ dias",
    dot: "bg-blue-400",
    filter: (l: Lead) => {
      const d = daysSince(l.ultimo_contato_at);
      return d === null || d >= 7;
    },
  },
  {
    id: "qualificados",
    label: "🟢 Qualificados",
    dot: "bg-green-400",
    filter: (l: Lead) => l.lead_status === "qualificado",
  },
];

// ─── Filter state ─────────────────────────────────────────────────────────────

type Filters = {
  status: string;
  maturidade: string;
  scoreMin: string;
  dataInicio: string;
  dataFim: string;
  stakeholders: string;
};

const DEFAULT_FILTERS: Filters = {
  status: "",
  maturidade: "",
  scoreMin: "",
  dataInicio: "",
  dataFim: "",
  stakeholders: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

const PRODUCTS_MAP: Record<string, { label: string; color: string }> = {
  eduinfo:  { label: "EduInfo",  color: "text-blue-400 bg-blue-400/10 border-blue-400/25" },
  gennera:  { label: "Gennera",  color: "text-violet-400 bg-violet-400/10 border-violet-400/25" },
  ecoclear: { label: "EcoClear", color: "text-green-400 bg-green-400/10 border-green-400/25" },
  vibeflow: { label: "VibeFlow", color: "text-orange-400 bg-orange-400/10 border-orange-400/25" },
};

// ─── Shared form fields ───────────────────────────────────────────────────────

type LeadForm = {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  lead_status: string;
  inep: string;
  cidade: string;
  uf: string;
};

const EMPTY_FORM: LeadForm = {
  nome: "", email: "", telefone: "", empresa: "",
  lead_status: "novo", inep: "", cidade: "", uf: "",
};

// ─── Modal shared component ───────────────────────────────────────────────────

const INPUT_CLASS = "h-10 rounded-xl bg-input/80 border border-border/60 text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 placeholder:text-muted-foreground/50";
const SELECT_CLASS = "h-10 rounded-xl bg-input/80 border border-border/60 text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200";

function LeadFormModal({
  title,
  form,
  setForm,
  onSubmit,
  onClose,
  saving,
  error,
}: {
  title: string;
  form: LeadForm;
  setForm: (f: LeadForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-blue-500/20 shadow-[0_8px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(59,130,246,0.08),0_0_40px_rgba(59,130,246,0.06)] p-6"
        style={{ background: "rgba(17,24,39,0.85)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-foreground tracking-wide">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs text-muted-foreground">Nome *</label>
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
                className={INPUT_CLASS}
                placeholder="Nome completo"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={INPUT_CLASS}
                placeholder="nome@empresa.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Telefone</label>
              <input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className={INPUT_CLASS}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Instituição de Ensino</label>
              <input
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                className={INPUT_CLASS}
                placeholder="Nome da instituição"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">INEP</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.inep}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, inep: v });
                }}
                className={INPUT_CLASS}
                placeholder="Código INEP"
                minLength={7}
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                value={form.lead_status}
                onChange={(e) => setForm({ ...form, lead_status: e.target.value })}
                className={SELECT_CLASS}
              >
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Cidade</label>
              <input
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                className={INPUT_CLASS}
                placeholder="Ex: Campinas"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">UF</label>
              <select
                value={form.uf}
                onChange={(e) => setForm({ ...form, uf: e.target.value })}
                className={SELECT_CLASS}
              >
                <option value="">Selecionar</option>
                {UF_LIST.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all duration-200"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

type ImportReport = { created: number; ignored: number; errors: number };

const VALID_PRODUCTS = ["eduinfo", "gennera", "ecoclear", "vibeflow"];

function ImportLeadsModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function handleFile(file: File) {
    setImportError(null);
    setReport(null);
    setRows(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
        if (!parsed.length) { setImportError("Arquivo vazio ou sem dados."); return; }
        setRows(parsed);
      } catch {
        setImportError("Erro ao ler arquivo. Use .xlsx ou .csv.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    if (!rows) return;
    setImporting(true);
    setImportError(null);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setImportError("Usuário não autenticado."); setImporting(false); return; }

    // Fetch existing emails to deduplicate
    const { data: existingLeads } = await supabase
      .from("leads")
      .select("email")
      .eq("user_id", authUser.id);
    const existingEmails = new Set(
      (existingLeads ?? []).map((l: { email: string | null }) => (l.email ?? "").toLowerCase().trim()).filter(Boolean)
    );

    let created = 0, ignored = 0, errors = 0;

    for (const row of rows) {
      const email = String(row["email"] ?? "").toLowerCase().trim() || null;
      const nome = String(row["nome_contato"] ?? "").trim();
      const empresa = String(row["instituicao"] ?? "").trim() || null;
      const telefone = String(row["telefone"] ?? "").trim() || null;
      const inep = String(row["inep"] ?? "").replace(/\D/g, "") || null;
      const cidade = String(row["cidade"] ?? "").trim() || null;
      const uf = String(row["uf"] ?? "").trim().toUpperCase() || null;
      const rawStatus = String(row["status"] ?? "").trim().toLowerCase();
      const lead_status = ["novo","em_contato","qualificado","fechado","perdido"].includes(rawStatus) ? rawStatus : "novo";
      const produtosRaw = String(row["produtos"] ?? "").trim();

      if (!nome) { errors++; continue; }
      if (email && existingEmails.has(email)) { ignored++; continue; }

      const importPayload = { nome, email, telefone, empresa, inep, cidade, uf, lead_status, user_id: authUser.id };
      console.log("[LEAD_CREATE_DEBUG] import payload:", importPayload);
      const { data: inserted, error: insertErr } = await supabase
        .from("leads")
        .insert(importPayload)
        .select("id")
        .single();
      console.log("[LEAD_CREATE_DEBUG] import result:", { data: inserted, error: insertErr });

      if (insertErr || !inserted) { errors++; continue; }

      if (email) existingEmails.add(email);

      // Insert products
      if (produtosRaw) {
        const produtos = produtosRaw.split(",").map((p) => p.trim().toLowerCase()).filter((p) => VALID_PRODUCTS.includes(p));
        if (produtos.length > 0) {
          await supabase.from("lead_products").insert(
            produtos.map((produto) => ({ lead_id: inserted.id, produto }))
          );
        }
      }

      created++;
    }

    setReport({ created, ignored, errors });
    setImporting(false);
    if (created > 0) onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-md rounded-2xl border border-blue-500/20 shadow-[0_8px_60px_rgba(0,0,0,0.6)] p-6 flex flex-col gap-5"
        style={{ background: "rgba(17,24,39,0.92)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground tracking-wide flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Importar Leads
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Column reference */}
        <div className="bg-muted/40 rounded-xl px-4 py-3 border border-border/60">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Colunas esperadas</p>
          <div className="flex flex-wrap gap-1">
            {["instituicao","nome_contato","email","telefone","inep","cidade","uf","status","produtos"].map((c) => (
              <span key={c} className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">{c}</span>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Coluna <span className="font-mono">produtos</span>: valores separados por vírgula (eduinfo, gennera, ecoclear, vibeflow).</p>
        </div>

        {/* Drop / pick file */}
        {!report && (
          <div
            className="border-2 border-dashed border-border/60 rounded-xl py-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <Upload className="w-7 h-7 text-muted-foreground" strokeWidth={1.3} />
            {fileName ? (
              <p className="text-sm text-foreground font-medium">{fileName}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Clique ou arraste o arquivo aqui</p>
            )}
            <p className="text-xs text-muted-foreground/70">.xlsx ou .csv</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        )}

        {rows && !report && (
          <p className="text-xs text-muted-foreground text-center">{rows.length} linha{rows.length !== 1 ? "s" : ""} detectada{rows.length !== 1 ? "s" : ""}.</p>
        )}

        {importError && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">{importError}</p>
        )}

        {/* Report */}
        {report && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Importação concluída</p>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xl font-bold text-green-400">{report.created}</span>
                <span className="text-[10px] text-muted-foreground">criados</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xl font-bold text-yellow-400">{report.ignored}</span>
                <span className="text-[10px] text-muted-foreground">ignorados</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xl font-bold text-destructive">{report.errors}</span>
                <span className="text-[10px] text-muted-foreground">erros</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {report ? "Fechar" : "Cancelar"}
          </Button>
          {!report && (
            <Button
              onClick={handleImport}
              disabled={!rows || importing}
              className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all duration-200"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Importar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadProductsMap, setLeadProductsMap] = useState<Record<string, string[]>>({});
  // Map: lead_id -> latest activity description (or null)
  const [latestActivityMap, setLatestActivityMap] = useState<Record<string, string | null>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState("all");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  async function fetchLeads() {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setLoading(false); return; }
    const [leadsRes, prodsRes] = await Promise.all([
      supabase
        .from("leads")
        .select("*")
        .eq("user_id", authUser.id)
        .order("score_estrategico", { ascending: false, nullsFirst: false })
        .order("data_decisao_prevista", { ascending: true, nullsFirst: false }),
      supabase.from("lead_products").select("lead_id, produto"),
    ]);
    if (leadsRes.data) {
      setLeads(leadsRes.data);
      // Fetch latest activity for each lead in one query
      const leadIds = leadsRes.data.map((l) => l.id);
      if (leadIds.length > 0) {
        await fetchLatestActivities(leadIds);
      }
    }
    if (prodsRes.data) {
      const map: Record<string, string[]> = {};
      (prodsRes.data as Pick<LeadProduct, "lead_id" | "produto">[]).forEach(({ lead_id, produto }) => {
        if (!map[lead_id]) map[lead_id] = [];
        map[lead_id].push(produto);
      });
      setLeadProductsMap(map);
    }
    setLoading(false);
  }

  async function fetchLatestActivities(leadIds: string[]) {
    // Fetch the latest activity per lead using a single query
    const { data } = await supabase
      .from("activities")
      .select("lead_id, descricao, created_at")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false });

    if (data) {
      // Keep only the first (latest) entry per lead_id
      const map: Record<string, string | null> = {};
      for (const row of data) {
        if (!(row.lead_id in map)) {
          map[row.lead_id] = row.descricao;
        }
      }
      setLatestActivityMap(map);
    }
  }

  useEffect(() => { fetchLeads(); }, []);

  // Refetch when a lead detail page dispatches "leads:refresh" (e.g. after saving próximo passo)
  useEffect(() => {
    const handler = () => fetchLeads();
    window.addEventListener("leads:refresh", handler);
    return () => window.removeEventListener("leads:refresh", handler);
  }, []);

  // Apply all filters + quick view + search
  const filtered = useMemo(() => {
    const qv = QUICK_VIEWS.find((v) => v.id === activeView)!;
    const q = search.toLowerCase();

    // Remove leads sem nenhum identificador útil
    const validLeads = leads.filter((l) => {
      const hasIdentifier =
        (l.empresa ?? "").trim().length > 0 ||
        (l.nome ?? "").trim().length > 0 ||
        (l.email ?? "").trim().length > 0 ||
        (l.telefone ?? "").trim().length > 0;
      return hasIdentifier;
    });

    console.log("[PIPELINE_LEADS_RENDER_COUNT] total recebido:", leads.length, "| total após filtro de válidos:", validLeads.length);

    return validLeads.filter((l) => {
      if (!qv.filter(l)) return false;

      if (q && !(
        (l.nome ?? "").toLowerCase().includes(q) ||
        (l.empresa ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.inep ?? "").toLowerCase().includes(q)
      )) return false;

      if (filters.status && l.lead_status !== filters.status) return false;
      if (filters.maturidade && l.maturidade_decisao !== filters.maturidade) return false;
      if (filters.scoreMin && (l.score_estrategico ?? 0) < Number(filters.scoreMin)) return false;
      if (filters.dataInicio && l.data_decisao_prevista && l.data_decisao_prevista < filters.dataInicio) return false;
      if (filters.dataFim && l.data_decisao_prevista && l.data_decisao_prevista > filters.dataFim) return false;
      if (filters.stakeholders === "true" && !l.stakeholders_mapeados) return false;
      if (filters.stakeholders === "false" && l.stakeholders_mapeados) return false;

      return true;
    });
  }, [leads, search, activeView, filters]);

  // Badge counts for quick views
  const viewCounts = useMemo(() =>
    Object.fromEntries(
      QUICK_VIEWS.map((v) => [v.id, leads.filter(v.filter).length])
    ), [leads]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    console.log("[LEAD_CREATE_AUTH] authUser:", authUser?.id ?? "NÃO AUTENTICADO");
    if (!authUser) {
      console.error("[LEAD_CREATE_AUTH] Bloqueando insert: usuário não autenticado");
      setError("Usuário não autenticado.");
      setSaving(false);
      return;
    }
    const payload = {
      nome: form.nome,
      email: form.email || null,
      telefone: form.telefone || null,
      empresa: form.empresa || null,
      inep: form.inep || null,
      lead_status: form.lead_status,
      cidade: form.cidade || null,
      uf: form.uf || null,
      user_id: authUser.id,
    };
    console.log("[LEAD_CREATE_DEBUG] payload:", payload);
    const { data: insertedData, error } = await supabase.from("leads").insert(payload).select();
    console.log("[LEAD_CREATE_DEBUG] result:", { data: insertedData, error, rows: insertedData?.length ?? 0 });
    if (error) { setError(error.message); setSaving(false); return; }
    setShowModal(false);
    setForm(EMPTY_FORM);
    fetchLeads();
    setSaving(false);
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex-1 p-6 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Pipeline de Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} de {leads.length} lead{leads.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowImport(true)}
            variant="outline"
            className="h-9 px-4 rounded-xl border-border text-muted-foreground hover:text-foreground font-medium text-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4" strokeWidth={1.5} />
            Importar Leads
          </Button>
          <Button
            onClick={() => setShowModal(true)}
            className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-[0_4px_16px_hsl(var(--primary)/0.3)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Quick Views */}
      <div className="flex gap-2 flex-wrap mb-5">
        {QUICK_VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
              activeView === v.id
                ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_8px_hsl(var(--primary)/0.3)]"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
            }`}
          >
            {v.label}
            {v.id !== "all" && viewCounts[v.id] > 0 && (
              <span className={`text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[18px] text-center ${
                activeView === v.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {viewCounts[v.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Filters toggle */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <Input
            placeholder="Buscar por nome, empresa ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-input border-border text-sm focus-visible:ring-primary"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`h-10 px-4 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${
            showFilters || activeFiltersCount > 0
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Filtros
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
        {activeFiltersCount > 0 && (
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="h-10 px-3 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="h-9 rounded-lg bg-input border border-border text-xs text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Maturidade</label>
            <select
              value={filters.maturidade}
              onChange={(e) => setFilters({ ...filters, maturidade: e.target.value })}
              className="h-9 rounded-lg bg-input border border-border text-xs text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Todas</option>
              {MATURIDADE_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Score ≥</label>
            <input
              type="number"
              min="0" max="100"
              value={filters.scoreMin}
              onChange={(e) => setFilters({ ...filters, scoreMin: e.target.value })}
              placeholder="0"
              className="h-9 rounded-lg bg-input border border-border text-xs text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Decisão de</label>
            <input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
              className="h-9 rounded-lg bg-input border border-border text-xs text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Decisão até</label>
            <input
              type="date"
              value={filters.dataFim}
              onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
              className="h-9 rounded-lg bg-input border border-border text-xs text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Stakeholders</label>
            <select
              value={filters.stakeholders}
              onChange={(e) => setFilters({ ...filters, stakeholders: e.target.value })}
              className="h-9 rounded-lg bg-input border border-border text-xs text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Todos</option>
              <option value="true">Mapeados</option>
              <option value="false">Não mapeados</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
        {/* Header row */}
        <div className="grid grid-cols-[minmax(180px,1.8fr)_minmax(140px,1.2fr)_100px_90px_60px_minmax(120px,1.5fr)_110px_36px] px-4 py-3 border-b border-border">
          {["Instituição de Ensino", "Decisor / Contato", "Status", "Maturidade", "Score", "Próximo Passo", "Decisão", ""].map((h) => (
            <span key={h} className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest truncate">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Carregando…</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-12 text-center">Nenhum lead encontrado.</p>
          ) : (
            filtered.map((lead) => {
              const overdue = isOverdue(lead.data_decisao_prevista);
              const ppStatus = getProximoPassoStatus(lead.proximo_passo_at ?? null);
              const ppDescricao = lead.proximo_passo_descricao;

              return (
                <div
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="grid grid-cols-[minmax(180px,1.8fr)_minmax(140px,1.2fr)_100px_90px_60px_minmax(120px,1.5fr)_110px_36px] px-4 py-5 items-center hover:bg-accent/30 transition-colors duration-150 cursor-pointer group"
                >
                  {/* Coluna 1 — Instituição de Ensino + produtos */}
                  <div className="flex flex-col gap-1 min-w-0 pr-2">
                    <p className="text-[15px] font-semibold text-foreground truncate leading-snug">
                      {lead.empresa || "—"}
                    </p>
                    {leadProductsMap[lead.id]?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {leadProductsMap[lead.id].map((p) => {
                          const meta = PRODUCTS_MAP[p];
                          return (
                            <span
                              key={p}
                              className={`text-[9px] font-semibold px-1.5 py-px rounded-full border ${meta?.color || "text-muted-foreground bg-muted border-border"}`}
                            >
                              {meta?.label || p}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Coluna 2 — Decisor / Contato */}
                  <p className="text-xs text-muted-foreground truncate pr-2">{lead.nome || "—"}</p>

                  {/* Status badge */}
                  <div>
                    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor[lead.lead_status] || "text-muted-foreground bg-muted border-border"}`}>
                      {STATUS_OPTIONS.find((s) => s.value === lead.lead_status)?.label || lead.lead_status}
                    </span>
                  </div>

                  {/* Maturidade badge */}
                  <div>
                    {lead.maturidade_decisao ? (
                      <span className={`inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded border ${maturidadeColor[lead.maturidade_decisao] || "text-muted-foreground bg-muted border-border"}`}>
                        {MATURIDADE_OPTIONS.find((m) => m.value === lead.maturidade_decisao)?.label || lead.maturidade_decisao}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50">—</span>
                    )}
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-center">
                    {lead.score_estrategico != null ? (
                      <span className={`text-sm font-bold tabular-nums ${
                        lead.score_estrategico >= 70 ? "text-green-400" :
                        lead.score_estrategico >= 40 ? "text-yellow-400" : "text-muted-foreground"
                      }`}>
                        {lead.score_estrategico}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </div>

                  {/* Próximo passo */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {!ppStatus ? (
                      <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full font-medium w-fit">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Sem próximo passo
                      </span>
                    ) : (
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border w-fit ${ppStatus.variant === "atrasado" ? "text-destructive bg-destructive/10 border-destructive/25" : "text-green-400 bg-green-400/10 border-green-400/25"}`}>
                          {ppStatus.label} · {ppStatus.sub}
                        </span>
                        {ppDescricao && (
                          <p className="text-[11px] text-muted-foreground truncate">{truncate(ppDescricao, 55)}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Decisão — data + decisor */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {lead.data_decisao_prevista ? (
                      <span className={`text-xs font-medium ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                        {overdue && <AlertCircle className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
                        {formatDate(lead.data_decisao_prevista)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                    <span className="text-[11px] text-muted-foreground/60 truncate">
                      {lead.nome || "—"}
                    </span>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" strokeWidth={1.5} />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Novo Lead */}
      {showModal && (
        <LeadFormModal
          title="Novo Lead"
          form={form}
          setForm={setForm}
          onSubmit={handleCreate}
          onClose={() => { setShowModal(false); setError(null); setForm(EMPTY_FORM); }}
          saving={saving}
          error={error}
        />
      )}

      {/* Modal Importar Leads */}
      {showImport && (
        <ImportLeadsModal
          onClose={() => setShowImport(false)}
          onDone={() => { fetchLeads(); }}
        />
      )}
    </div>
  );
}
