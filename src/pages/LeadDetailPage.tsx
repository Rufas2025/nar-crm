import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, Lead, Interaction, LeadProduct } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Mail,
  Plus,
  Loader2,
  Building2,
  Package2,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em Contato" },
  { value: "qualificado", label: "Qualificado" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

const INTERACTION_TYPES = [
  { value: "ligacao", label: "Ligação" },
  { value: "email", label: "E-mail" },
  { value: "reuniao", label: "Reunião" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "outro", label: "Outro" },
];

const PRODUCTS = [
  { value: "eduinfo", label: "EduInfo" },
  { value: "gennera", label: "Gennera" },
  { value: "ecoclear", label: "EcoClear" },
  { value: "vibeflow", label: "VibeFlow" },
];

const PRODUCT_COLORS: Record<string, string> = {
  eduinfo:  "text-blue-400 bg-blue-400/10 border-blue-400/25",
  gennera:  "text-violet-400 bg-violet-400/10 border-violet-400/25",
  ecoclear: "text-green-400 bg-green-400/10 border-green-400/25",
  vibeflow: "text-orange-400 bg-orange-400/10 border-orange-400/25",
};

const statusColor: Record<string, string> = {
  novo: "text-primary bg-primary/10",
  em_contato: "text-yellow-400 bg-yellow-400/10",
  qualificado: "text-blue-400 bg-blue-400/10",
  fechado: "text-green-400 bg-green-400/10",
  perdido: "text-destructive bg-destructive/10",
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [products, setProducts] = useState<LeadProduct[]>([]);
  const [togglingProduct, setTogglingProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newType, setNewType] = useState("ligacao");
  const [savingNote, setSavingNote] = useState(false);

  async function fetchData() {
    const [leadRes, intRes, prodRes] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id!).single(),
      supabase.from("interactions").select("*").eq("lead_id", id!).order("created_at", { ascending: false }),
      supabase.from("lead_products").select("*").eq("lead_id", id!),
    ]);
    if (leadRes.data) { setLead(leadRes.data); setStatus(leadRes.data.lead_status); }
    if (intRes.data) setInteractions(intRes.data);
    if (prodRes.data) setProducts(prodRes.data);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [id]);

  async function handleStatusUpdate(newStatus: string) {
    setUpdatingStatus(true);
    await supabase.from("leads").update({ lead_status: newStatus }).eq("id", id!);
    setStatus(newStatus);
    setUpdatingStatus(false);
  }

  async function handleToggleProduct(produto: string) {
    setTogglingProduct(produto);
    const already = products.find((p) => p.produto === produto);
    if (already) {
      await supabase.from("lead_products").delete().eq("id", already.id);
      setProducts((prev) => prev.filter((p) => p.id !== already.id));
    } else {
      const { data } = await supabase
        .from("lead_products")
        .insert({ lead_id: id, produto })
        .select()
        .single();
      if (data) setProducts((prev) => [...prev, data]);
    }
    setTogglingProduct(null);
  }

  async function handleAddInteraction(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);
    await supabase.from("interactions").insert({
      lead_id: id,
      user_id: user?.id,
      type: newType,
      note: newNote.trim(),
    });
    setNewNote("");
    fetchData();
    setSavingNote(false);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Lead não encontrado.</p>
      </div>
    );
  }

  const linkedProducts = products.map((p) => p.produto);

  return (
    <div className="flex-1 p-8 max-w-4xl">
      {/* Back */}
      <button
        onClick={() => navigate("/leads")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Voltar para Leads
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left */}
        <div className="flex flex-col gap-5">
          {/* Lead card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">{lead.nome}</h1>
                {lead.empresa && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3.5 h-3.5" strokeWidth={1.5} />{lead.empresa}
                  </p>
                )}
                {/* Product tags */}
                {linkedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {linkedProducts.map((p) => {
                      const prod = PRODUCTS.find((x) => x.value === p);
                      return (
                        <span
                          key={p}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PRODUCT_COLORS[p] || "text-muted-foreground bg-muted border-border"}`}
                        >
                          {prod?.label || p}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[status] || "text-muted-foreground bg-muted"}`}>
                {STATUS_OPTIONS.find((s) => s.value === status)?.label || status}
              </span>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              {lead.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />{lead.email}
                </p>
              )}
              {lead.telefone && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />{lead.telefone}
                </p>
              )}
              {lead.valor != null && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    R$ {Number(lead.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </p>
              )}
            </div>

            {lead.notas && (
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5">Notas</p>
                <p className="text-sm text-foreground">{lead.notas}</p>
              </div>
            )}
          </div>

          {/* Interactions */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold text-foreground">Interações</h2>
              <span className="ml-auto text-xs text-muted-foreground">{interactions.length}</span>
            </div>
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 py-6 text-center">Sem interações registradas.</p>
              ) : (
                interactions.map((int) => (
                  <div key={int.id} className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {INTERACTION_TYPES.find((t) => t.value === int.type)?.label || int.type}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(int.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{int.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">
          {/* Status update */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Atualizar Status</p>
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusUpdate(s.value)}
                  disabled={updatingStatus}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${status === s.value
                      ? "bg-primary text-primary-foreground shadow-[0_4px_12px_hsl(var(--primary)/0.3)]"
                      : "bg-secondary/50 text-foreground hover:bg-secondary"
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products multi-select */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2 mb-3">
              <Package2 className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Produtos</p>
            </div>
            <div className="flex flex-col gap-2">
              {PRODUCTS.map((prod) => {
                const active = linkedProducts.includes(prod.value);
                const isToggling = togglingProduct === prod.value;
                return (
                  <button
                    key={prod.value}
                    onClick={() => handleToggleProduct(prod.value)}
                    disabled={isToggling}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200
                      ${active
                        ? `${PRODUCT_COLORS[prod.value]} shadow-sm`
                        : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                      }`}
                  >
                    <span>{prod.label}</span>
                    {isToggling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin opacity-60" />
                    ) : active ? (
                      <span className="w-4 h-4 rounded-full bg-current opacity-20 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-current opacity-100" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add interaction */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Nova Interação</p>
            <form onSubmit={handleAddInteraction} className="flex flex-col gap-3">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="h-10 rounded-xl bg-input border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {INTERACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Descreva a interação…"
                rows={3}
                className="rounded-xl bg-input border-border text-sm resize-none"
              />
              <Button
                type="submit"
                disabled={savingNote || !newNote.trim()}
                className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all flex items-center gap-2"
              >
                {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" strokeWidth={1.5} />Registrar</>}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
