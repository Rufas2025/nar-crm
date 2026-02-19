import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, Lead } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "convertido", label: "Convertido" },
  { value: "perdido", label: "Perdido" },
];

const statusColor: Record<string, string> = {
  novo: "text-primary bg-primary/10",
  em_andamento: "text-yellow-400 bg-yellow-400/10",
  convertido: "text-green-400 bg-green-400/10",
  perdido: "text-destructive bg-destructive/10",
};

export default function LeadsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "novo",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function fetchLeads() {
    setLoading(true);
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setLeads(data);
      setFiltered(data);
    }
    setLoading(false);
  }

  useEffect(() => { fetchLeads(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      leads.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.company ?? "").toLowerCase().includes(q) ||
          (l.email ?? "").toLowerCase().includes(q)
      )
    );
  }, [search, leads]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("leads").insert({
      ...form,
      user_id: user?.id,
    });
    if (error) { setError(error.message); setSaving(false); return; }
    setShowModal(false);
    setForm({ name: "", email: "", phone: "", company: "", status: "novo", notes: "" });
    fetchLeads();
    setSaving(false);
  }

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">{leads.length} lead{leads.length !== 1 ? "s" : ""} cadastrado{leads.length !== 1 ? "s" : ""}</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-all duration-200 shadow-[0_4px_16px_hsl(var(--primary)/0.3)] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Novo Lead
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        <Input
          placeholder="Buscar por nome, empresa ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 rounded-xl bg-input border-border text-sm focus-visible:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
        <div className="grid grid-cols-[1fr_1fr_1fr_120px_40px] px-6 py-3 border-b border-border">
          {["Nome", "Empresa", "E-mail", "Status", ""].map((h) => (
            <span key={h} className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <p className="text-sm text-muted-foreground px-6 py-10 text-center">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-10 text-center">Nenhum lead encontrado.</p>
          ) : (
            filtered.map((lead) => (
              <div
                key={lead.id}
                className="grid grid-cols-[1fr_1fr_1fr_120px_40px] px-6 py-4 items-center hover:bg-accent/40 transition-colors duration-150 cursor-pointer group"
                onClick={() => navigate(`/leads/${lead.id}`)}
              >
                <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                <p className="text-sm text-muted-foreground truncate">{lead.company || "—"}</p>
                <p className="text-sm text-muted-foreground truncate">{lead.email || "—"}</p>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${statusColor[lead.status] || "text-muted-foreground bg-muted"}`}>
                  {STATUS_OPTIONS.find((s) => s.value === lead.status)?.label || lead.status}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
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
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="h-10 rounded-xl bg-input border-border text-sm" placeholder="Nome completo" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">E-mail</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-10 rounded-xl bg-input border-border text-sm" placeholder="nome@empresa.com" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Telefone</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-10 rounded-xl bg-input border-border text-sm" placeholder="(11) 99999-9999" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Empresa</label>
                  <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="h-10 rounded-xl bg-input border-border text-sm" placeholder="Empresa Ltda." />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="h-10 rounded-xl bg-input border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs text-muted-foreground">Notas</label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl bg-input border-border text-sm resize-none" rows={3} placeholder="Observações sobre o lead…" />
                </div>
              </div>

              {error && <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</p>}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1 h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground">
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all">
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
