import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, Lead } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, ChevronRight, X, Loader2,
  CheckCircle2, AlertTriangle, AlertCircle,
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

// ─── Quick views ─────────────────────────────────────────────────────────────

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
    filter: (l: Lead) => !!l.data_decisao_prevista && isOverdue(l.data_decisao_prevista),
  },
  {
    id: "sem_passo",
    label: "🟡 Sem Próximo Passo",
    dot: "bg-yellow-400",
    filter: (l: Lead) => !l.proximo_passo || l.proximo_passo.trim() === "",
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
  stakeholders: string; // "all" | "true" | "false"
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

export default function LeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState("all");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", empresa: "",
    lead_status: "novo", inep: "", notas: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function fetchLeads() {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setLoading(false); return; }
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", authUser.id)
      .order("score_estrategico", { ascending: false, nullsFirst: false })
      .order("data_decisao_prevista", { ascending: true, nullsFirst: false });
    if (data) setLeads(data);
    setLoading(false);
  }

  useEffect(() => { fetchLeads(); }, []);

  // Apply all filters + quick view + search
  const filtered = useMemo(() => {
    const qv = QUICK_VIEWS.find((v) => v.id === activeView)!;
    const q = search.toLowerCase();

    return leads.filter((l) => {
      if (!qv.filter(l)) return false;

      if (q && !(
        l.nome.toLowerCase().includes(q) ||
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
    if (!authUser) {
      setError("Usuário não autenticado.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("leads").insert({
      nome: form.nome,
      email: form.email || null,
      telefone: form.telefone || null,
      empresa: form.empresa || null,
      inep: form.inep || null,
      lead_status: form.lead_status,
      notas: form.notas || null,
      user_id: authUser.id,
    });
    if (error) { setError(error.message); setSaving(false); return; }
    setShowModal(false);
    setForm({ nome: "", email: "", telefone: "", empresa: "", lead_status: "novo", inep: "", notas: "" });
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
        <Button
          onClick={() => setShowModal(true)}
          className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-[0_4px_16px_hsl(var(--primary)/0.3)] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Novo Lead
        </Button>
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
          {/* Status */}
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

          {/* Maturidade */}
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

          {/* Score mínimo */}
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

          {/* Data início */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Decisão de</label>
            <input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
              className="h-9 rounded-lg bg-input border border-border text-xs text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Data fim */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Decisão até</label>
            <input
              type="date"
              value={filters.dataFim}
              onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
              className="h-9 rounded-lg bg-input border border-border text-xs text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Stakeholders */}
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
        <div className="grid grid-cols-[minmax(160px,1.5fr)_minmax(120px,1fr)_100px_90px_60px_minmax(120px,1.5fr)_90px_90px_36px] px-4 py-3 border-b border-border">
          {["Nome", "Empresa", "Status", "Maturidade", "Score", "Próximo Passo", "Decisão", "Contato", ""].map((h) => (
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
              const semPasso = !lead.proximo_passo || lead.proximo_passo.trim() === "";
              const contactDays = daysSince(lead.ultimo_contato_at);
              const semContato = contactDays === null || contactDays >= 7;

              return (
                <div
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="grid grid-cols-[minmax(160px,1.5fr)_minmax(120px,1fr)_100px_90px_60px_minmax(120px,1.5fr)_90px_90px_36px] px-4 py-3.5 items-center hover:bg-accent/30 transition-colors duration-150 cursor-pointer group"
                >
                  {/* Nome */}
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{lead.nome}</p>
                  </div>

                  {/* Empresa */}
                  <p className="text-xs text-muted-foreground truncate">{lead.empresa || "—"}</p>

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
                  <div className="flex items-center gap-1.5 min-w-0">
                    {semPasso ? (
                      <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full font-medium">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Sem próximo passo
                      </span>
                    ) : (
                      <p className="text-xs text-muted-foreground truncate">{truncate(lead.proximo_passo, 60)}</p>
                    )}
                  </div>

                  {/* Data decisão */}
                  <div>
                    {lead.data_decisao_prevista ? (
                      <span className={`text-xs font-medium ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                        {overdue && <AlertCircle className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
                        {formatDate(lead.data_decisao_prevista)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </div>

                  {/* Último contato */}
                  <div className="flex items-center gap-1">
                    <span className={`text-xs ${semContato ? "text-destructive" : "text-muted-foreground"}`}>
                      {lead.ultimo_contato_at ? (
                        contactDays === 0 ? "Hoje" :
                        contactDays === 1 ? "1d" :
                        `${contactDays}d`
                      ) : "—"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-[0_8px_60px_rgba(0,0,0,0.6)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-foreground">Novo Lead</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs text-muted-foreground">Nome *</label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required className="h-10 rounded-xl bg-input border-border text-sm" placeholder="Nome completo" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">E-mail</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-10 rounded-xl bg-input border-border text-sm" placeholder="nome@empresa.com" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Telefone</label>
                  <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="h-10 rounded-xl bg-input border-border text-sm" placeholder="(11) 99999-9999" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Instituição de Ensino</label>
                  <Input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} className="h-10 rounded-xl bg-input border-border text-sm" placeholder="Nome da instituição" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">INEP</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={form.inep}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      setForm({ ...form, inep: v });
                    }}
                    className="h-10 rounded-xl bg-input border-border text-sm"
                    placeholder="Digite o código INEP da escola"
                    minLength={7}
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <select
                    value={form.lead_status}
                    onChange={(e) => setForm({ ...form, lead_status: e.target.value })}
                    className="h-10 rounded-xl bg-input border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs text-muted-foreground">Notas</label>
                  <Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="rounded-xl bg-input border-border text-sm resize-none" rows={3} placeholder="Observações sobre o lead…" />
                </div>
              </div>

              {error && <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</p>}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1 h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground">
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
