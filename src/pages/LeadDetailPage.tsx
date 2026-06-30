import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase, Lead, LeadProduct } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/evolution";
import {
  ATTACHMENT_ACCEPT,
  formatBytes,
  uploadWhatsAppAttachment,
  validateAttachment,
} from "@/lib/whatsappAttachment";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Video,
  FileText,
  Plus,
  Loader2,
  MapPin,
  Package2,
  Pencil,
  Send,
  Paperclip,
  Link2,
  X,
  Image as ImageIcon,
} from "lucide-react";


// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em Contato" },
  { value: "qualificado", label: "Qualificado" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

const INTERACTION_TYPES = [
  { value: "ligacao", label: "Ligação", icon: Phone },
  { value: "email", label: "E-mail", icon: Mail },
  { value: "reuniao", label: "Reunião", icon: Video },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "outro", label: "Outro", icon: FileText },
];

const PRODUCTS = [
  { value: "eduinfo", label: "EduInfo" },
  { value: "gennera", label: "Gennera" },
  { value: "ecoclear", label: "EcoClear" },
  { value: "vibeflow", label: "VibeFlow" },
];

const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const PRODUCT_COLORS: Record<string, string> = {
  eduinfo:  "text-blue-400/90 bg-blue-400/8 border-blue-400/20",
  gennera:  "text-violet-400/90 bg-violet-400/8 border-violet-400/20",
  ecoclear: "text-emerald-400/90 bg-emerald-400/8 border-emerald-400/20",
  vibeflow: "text-amber-400/90 bg-amber-400/8 border-amber-400/20",
};

const statusColor: Record<string, string> = {
  novo: "text-primary bg-primary/10",
  em_contato: "text-yellow-400 bg-yellow-400/10",
  qualificado: "text-blue-400 bg-blue-400/10",
  fechado: "text-green-400 bg-green-400/10",
  perdido: "text-destructive bg-destructive/10",
};

const INPUT_CLASS = "h-10 rounded-xl bg-input/80 border border-border/60 text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 placeholder:text-muted-foreground/50 w-full";
const SELECT_CLASS = "h-10 rounded-xl bg-input/80 border border-border/60 text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 w-full";

// ─── Types ────────────────────────────────────────────────────────────────────

type Activity = {
  id: string;
  lead_id: string;
  user_id: string;
  tipo: string;
  descricao: string;
  created_at: string;
};

// ─── Próximo Passo helpers ────────────────────────────────────────────────────

function proximoPassoStatus(at: string | null): { label: string; sub: string; color: string } | null {
  if (!at) return null;
  const now = new Date();
  const target = new Date(at);
  const diffMs = target.getTime() - now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays < 0) return { label: "Atrasado", sub: `há ${Math.abs(diffDays)} dia${Math.abs(diffDays) !== 1 ? "s" : ""}`, color: "text-destructive bg-destructive/10 border-destructive/25" };
  if (diffDays === 0) return { label: "Em dia", sub: "Hoje", color: "text-green-400 bg-green-400/10 border-green-400/25" };
  if (diffDays === 1) return { label: "Em dia", sub: "Amanhã", color: "text-green-400 bg-green-400/10 border-green-400/25" };
  return { label: "Em dia", sub: `Em ${diffDays} dias`, color: "text-green-400 bg-green-400/10 border-green-400/25" };
}

type EditLeadForm = {
  nome: string;
  email: string;
  telefone: string;
  telefone_tipo: string;
  empresa: string;
  inep: string;
  cidade: string;
  uf: string;
  lead_status: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatActivityDate(iso: string) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
  const month2 = month.charAt(0).toUpperCase() + month.slice(1);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${month2} · ${hours}:${minutes}`;
}

function getInteractionIcon(tipo: string) {
  const found = INTERACTION_TYPES.find((t) => t.value === tipo);
  return found ? found.icon : FileText;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [products, setProducts] = useState<LeadProduct[]>([]);
  const [togglingProduct, setTogglingProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newType, setNewType] = useState("ligacao");
  const [savingNote, setSavingNote] = useState(false);

  // Nova interação — próximo passo fields
  const [newProximoPasso, setNewProximoPasso] = useState("");
  const [newProximoPassoAt, setNewProximoPassoAt] = useState("");

  // Edit activity modal state
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editTipo, setEditTipo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit lead modal state
  const [showEditLead, setShowEditLead] = useState(false);
  const [editForm, setEditForm] = useState<EditLeadForm>({
    nome: "", email: "", telefone: "", telefone_tipo: "celular", empresa: "",
    inep: "", cidade: "", uf: "", lead_status: "novo",
  });
  const [savingLead, setSavingLead] = useState(false);
  const [editLeadError, setEditLeadError] = useState<string | null>(null);

  async function fetchActivities() {
    const { data } = await supabase
      .from("activities")
      .select("*")
      .eq("lead_id", id!)
      .order("created_at", { ascending: false })
      .limit(3);
    if (data) setActivities(data);
  }

  async function fetchData() {
    const [leadRes, prodRes] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id!).single(),
      supabase.from("lead_products").select("*").eq("lead_id", id!),
    ]);
    if (leadRes.data) { setLead(leadRes.data); }
    if (prodRes.data) setProducts(prodRes.data);
    await fetchActivities();
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [id]);

  function openEditLead(l: Lead) {
    setEditForm({
      nome: l.nome ?? "",
      email: l.email ?? "",
      telefone: l.telefone ?? "",
      telefone_tipo: l.telefone_tipo ?? "celular",
      empresa: l.empresa ?? "",
      inep: l.inep ?? "",
      cidade: l.cidade ?? "",
      uf: l.uf ?? "",
      lead_status: l.lead_status,
    });
    setEditLeadError(null);
    setShowEditLead(true);
  }

  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault();
    if (!lead) return;
    setSavingLead(true);
    setEditLeadError(null);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    const payload = {
      nome: editForm.nome,
      email: editForm.email || null,
      telefone: editForm.telefone || null,
      telefone_tipo: editForm.telefone_tipo || "celular",
      empresa: editForm.empresa || null,
      inep: editForm.inep || null,
      cidade: editForm.cidade || null,
      uf: editForm.uf || null,
      lead_status: editForm.lead_status,
    };
    console.log("[LEAD_UPDATE_DEBUG] === handleSaveLead ===");
    console.log("[LEAD_UPDATE_DEBUG] authUser:", authUser?.id);
    console.log("[LEAD_UPDATE_DEBUG] lead.id:", lead.id, "lead.user_id:", lead.user_id);
    console.log("[LEAD_UPDATE_DEBUG] payload:", payload);

    const { data: updated, error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", lead.id)
      .select("*")
      .single();

    console.log("[LEAD_UPDATE_DEBUG] handleSaveLead result - error:", error);
    console.log("[LEAD_UPDATE_DEBUG] handleSaveLead result - data:", updated);

    if (error) {
      console.warn("[LEAD_UPDATE_DEBUG] ⚠️ handleSaveLead falhou. authUser.id:", authUser?.id, "lead.user_id:", lead.user_id, "match:", authUser?.id === lead.user_id);
      setEditLeadError(error.message);
      setSavingLead(false);
      return;
    }

    if (!updated) {
      console.warn("[LEAD_UPDATE_DEBUG] ⚠️ handleSaveLead 0 linhas. Possível RLS block.");
      setEditLeadError("Nenhuma linha atualizada. Verifique permissões.");
      setSavingLead(false);
      return;
    }

    // Refetch explícito
    const { data: refreshed } = await supabase.from("leads").select("*").eq("id", lead.id).single();
    console.log("[LEAD_UPDATE_DEBUG] handleSaveLead refetch:", refreshed?.lead_status);

    setLead(refreshed || updated);
    setShowEditLead(false);
    setSavingLead(false);

    window.dispatchEvent(new CustomEvent("leads:refresh"));
  }

  async function updateLeadStatus(leadId: string, newStatus: string) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    console.log("[LEAD_UPDATE_DEBUG] === updateLeadStatus ===");
    console.log("[LEAD_UPDATE_DEBUG] authUser:", authUser?.id);
    console.log("[LEAD_UPDATE_DEBUG] lead state id:", lead?.id, "lead state user_id:", lead?.user_id);
    console.log("[LEAD_UPDATE_DEBUG] payload:", { lead_status: newStatus });
    console.log("[LEAD_UPDATE_DEBUG] filter: .eq('id',", leadId, ")");

    const { data, error } = await supabase
      .from("leads")
      .update({ lead_status: newStatus })
      .eq("id", leadId)
      .select();

    console.log("[LEAD_UPDATE_DEBUG] update result - error:", error);
    console.log("[LEAD_UPDATE_DEBUG] update result - data:", data);
    console.log("[LEAD_UPDATE_DEBUG] update result - rows returned:", data?.length ?? 0);

    if (data?.length === 0) {
      console.warn("[LEAD_UPDATE_DEBUG] ⚠️ 0 linhas atualizadas! Possível RLS/policy bloqueando. authUser.id:", authUser?.id, "lead.user_id:", lead?.user_id, "match:", authUser?.id === lead?.user_id);
    }

    if (error) {
      console.error("[LEAD_UPDATE_DEBUG] Erro completo:", JSON.stringify(error));
      return;
    }

    // Refetch explícito
    const { data: refreshed, error: refetchErr } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    console.log("[LEAD_UPDATE_DEBUG] refetch result:", refreshed?.lead_status, "error:", refetchErr);

    if (refreshed) setLead(refreshed);

    window.dispatchEvent(new CustomEvent("leads:refresh"));
  }

  async function handleToggleProduct(produto: string) {
    setTogglingProduct(produto);
    const already = products.find((p) => p.produto === produto);

    if (already) {
      console.log("[handleToggleProduct] Removendo produto:", { id: already.id, lead_id: id, produto });
      const { error, count } = await supabase
        .from("lead_products")
        .delete({ count: "exact" })
        .eq("id", already.id)
        .eq("lead_id", id!);

      console.log("[handleToggleProduct] Resultado delete:", { error, count });

      if (error) {
        console.error("[handleToggleProduct] Erro ao remover produto:", error);
      }
    } else {
      console.log("[handleToggleProduct] Adicionando produto:", { lead_id: id, produto });
      const { data, error } = await supabase
        .from("lead_products")
        .insert({ lead_id: id, produto })
        .select()
        .single();

      console.log("[handleToggleProduct] Resultado insert:", { data, error });

      if (error) {
        console.error("[handleToggleProduct] Erro ao adicionar produto:", error);
      }
    }

    // Refetch do banco para garantir fonte de verdade
    const { data: refreshedProducts } = await supabase
      .from("lead_products")
      .select("*")
      .eq("lead_id", id!);
    if (refreshedProducts) setProducts(refreshedProducts);

    setTogglingProduct(null);
  }

  async function handleAddInteraction(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);

    // 1. Inserir atividade
    const { error: actErr } = await supabase.from("activities").insert({
      lead_id: id,
      user_id: user?.id,
      tipo: newType,
      descricao: newNote.trim(),
    });

    if (actErr) {
      console.error("[handleAddInteraction] Erro ao inserir atividade:", actErr);
      setSavingNote(false);
      return;
    }

    // 2. Montar payload de atualização do lead
    const leadUpdate: Record<string, unknown> = {
      ultimo_contato_at: new Date().toISOString(),
      proximo_passo: newNote.trim(),
    };

    if (newProximoPasso.trim()) {
      leadUpdate.proximo_passo_descricao = newProximoPasso.trim();
    }

    // Sempre incluir proximo_passo_at — se vazio, mantém null explicitamente
    if (newProximoPassoAt) {
      leadUpdate.proximo_passo_at = new Date(newProximoPassoAt).toISOString();
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    console.log("[LEAD_UPDATE_DEBUG] === handleAddInteraction (lead update) ===");
    console.log("[LEAD_UPDATE_DEBUG] authUser:", authUser?.id);
    console.log("[LEAD_UPDATE_DEBUG] lead.id:", id, "lead.user_id:", lead?.user_id);
    console.log("[LEAD_UPDATE_DEBUG] payload:", leadUpdate);

    // 3. Persistir no banco com verificação de rowCount
    const updateRes = await supabase
      .from("leads")
      .update(leadUpdate)
      .eq("id", id!)
      .select("id");

    console.log("[LEAD_UPDATE_DEBUG] handleAddInteraction result - error:", updateRes.error);
    console.log("[LEAD_UPDATE_DEBUG] handleAddInteraction result - data:", updateRes.data);
    console.log("[LEAD_UPDATE_DEBUG] handleAddInteraction result - rows:", updateRes.data?.length ?? 0);

    if (updateRes.error) {
      console.error("[LEAD_UPDATE_DEBUG] Erro ao atualizar lead:", updateRes.error);
    } else if (!updateRes.data || updateRes.data.length === 0) {
      console.warn("[LEAD_UPDATE_DEBUG] ⚠️ handleAddInteraction 0 linhas. authUser.id:", authUser?.id, "lead.user_id:", lead?.user_id, "match:", authUser?.id === lead?.user_id);
    }

    // 4. Refetch do lead para garantir que o estado local reflete o banco
    const { data: refreshed } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id!)
      .single();

    if (refreshed) {
      setLead(refreshed);
    }

    // 5. Notificar pipeline para atualizar
    window.dispatchEvent(new CustomEvent("leads:refresh"));

    setNewNote("");
    setNewProximoPasso("");
    setNewProximoPassoAt("");
    await fetchActivities();
    setSavingNote(false);
  }

  function openEditModal(act: Activity) {
    setEditingActivity(act);
    setEditTipo(act.tipo);
    setEditDescricao(act.descricao);
  }

  function closeEditModal() {
    setEditingActivity(null);
    setEditTipo("");
    setEditDescricao("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingActivity || !editDescricao.trim()) return;
    setSavingEdit(true);

    const { error } = await supabase
      .from("activities")
      .update({ tipo: editTipo, descricao: editDescricao.trim() })
      .eq("id", editingActivity.id);

    if (!error) {
      setActivities((prev) =>
        prev.map((a) =>
          a.id === editingActivity.id
            ? { ...a, tipo: editTipo, descricao: editDescricao.trim() }
            : a
        )
      );
    }

    closeEditModal();
    setSavingEdit(false);
  }

  // ── WhatsApp send modal ──────────────────────────────────────────────────
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppGreeting, setWhatsAppGreeting] = useState("");
  const [whatsAppBody, setWhatsAppBody] = useState("");
  const [whatsAppError, setWhatsAppError] = useState<string | null>(null);
  const [whatsAppAttachment, setWhatsAppAttachment] = useState<File | null>(null);
  const [whatsAppAttachmentPreview, setWhatsAppAttachmentPreview] = useState<string | null>(null);
  const whatsAppFileRef = useRef<HTMLInputElement>(null);

  function handleWhatsAppFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const v = validateAttachment(f);
    if (!v.ok) {
      toast.error(v.error || "Arquivo inválido");
      return;
    }
    if (whatsAppAttachmentPreview) URL.revokeObjectURL(whatsAppAttachmentPreview);
    setWhatsAppAttachment(f);
    setWhatsAppAttachmentPreview(v.kind === "image" ? URL.createObjectURL(f) : null);
  }

  function removeWhatsAppAttachment() {
    if (whatsAppAttachmentPreview) URL.revokeObjectURL(whatsAppAttachmentPreview);
    setWhatsAppAttachment(null);
    setWhatsAppAttachmentPreview(null);
  }


  const DEFAULT_WHATSAPP_BODY =
    "Aqui é da NAR ECO. Estou entrando em contato sobre as soluções para sua escola.";

  function buildGreeting(name?: string | null) {
    const trimmed = (name ?? "").trim();
    return trimmed ? `Olá, ${trimmed}, tudo bem?` : "Olá, tudo bem?";
  }

  function getLeadVars() {
    const linkedProds = products.map(
      (p) => PRODUCTS.find((x) => x.value === p.produto)?.label || p.produto
    );
    return {
      nome: lead?.nome || "",
      escola: lead?.empresa || "",
      cidade: lead?.cidade || "",
      uf: lead?.uf || "",
      cidadeUf:
        lead?.cidade && lead?.uf ? `${lead.cidade}/${lead.uf}` : lead?.cidade || lead?.uf || "",
      produtos: linkedProds.join(", "),
      status: STATUS_OPTIONS.find((s) => s.value === lead?.lead_status)?.label || "",
    };
  }

  const WHATSAPP_TEMPLATES = [
    {
      label: "Primeiro contato",
      build: (v: ReturnType<typeof getLeadVars>) =>
        `Aqui é da NAR ECO. Vi o cadastro da sua escola${
          v.escola ? ` (${v.escola}${v.cidadeUf ? `, em ${v.cidadeUf}` : ""})` : ""
        } e gostaria de apresentar algumas soluções que podem ajudar vocês.`,
    },
    {
      label: "Apresentação de soluções",
      build: () =>
        "Aqui é da NAR ECO. Trabalhamos com soluções para escolas, incluindo EduInfo, Gennera, EcoClear e VibeFlow. Gostaria de entender melhor a necessidade de vocês.",
    },
    {
      label: "Follow-up",
      build: (v: ReturnType<typeof getLeadVars>) =>
        `Passando para dar continuidade ao nosso contato sobre as soluções da NAR ECO para sua escola${
          v.escola ? ` (${v.escola})` : ""
        }.`,
    },
    {
      label: "Agendamento",
      build: () =>
        "Podemos agendar uma conversa rápida para eu entender melhor a necessidade da escola e apresentar a melhor solução?",
    },
  ];

  function whatsAppVariableChips() {
    const v = getLeadVars();
    return [
      { label: "Escola", value: v.escola },
      { label: "Cidade/UF", value: v.cidadeUf },
      { label: "Produtos", value: v.produtos },
      { label: "Status", value: v.status },
    ].filter((c) => c.value);
  }

  function buildFinalWhatsAppMessage() {
    const g = whatsAppGreeting.trim();
    const b = whatsAppBody.trim();
    if (!g) return b;
    if (!b) return g;
    return `${g}\n\n${b}`;
  }

  function openWhatsAppModal() {
    if (!lead?.telefone) {
      toast.error("Telefone inválido");
      return;
    }
    setWhatsAppGreeting(buildGreeting(lead?.nome));
    setWhatsAppBody(DEFAULT_WHATSAPP_BODY);
    setWhatsAppError(null);
    removeWhatsAppAttachment();
    setShowWhatsAppModal(true);
  }


  function handleInsertLink() {
    const url = window.prompt("Cole o link (https://...)", "https://");
    if (!url) return;
    const trimmed = url.trim();
    if (!/^https?:\/\/\S+/i.test(trimmed)) {
      toast.error("Link inválido. Use http:// ou https://");
      return;
    }
    setWhatsAppBody((prev) => (prev ? `${prev.replace(/\s+$/, "")} ${trimmed}` : trimmed));
  }

  async function handleConfirmSendWhatsApp() {
    if (!lead?.telefone) {
      setWhatsAppError("Telefone inválido");
      return;
    }
    const finalMessage = buildFinalWhatsAppMessage();
    if (!finalMessage) {
      setWhatsAppError("Escreva uma mensagem antes de enviar.");
      return;
    }
    if (finalMessage.length < 5) {
      setWhatsAppError("A mensagem deve ter pelo menos 5 caracteres.");
      return;
    }

    setWhatsAppError(null);
    setSendingWhatsApp(true);

    // Upload do anexo (se houver) antes de chamar a Edge Function
    let uploaded: Awaited<ReturnType<typeof uploadWhatsAppAttachment>> | null = null;
    if (whatsAppAttachment) {
      try {
        uploaded = await uploadWhatsAppAttachment(whatsAppAttachment);
      } catch (e: any) {
        setWhatsAppError(e?.message || "Falha no upload do anexo.");
        setSendingWhatsApp(false);
        return;
      }
    }

    // O backend normaliza o telefone (adiciona 55 quando necessário) e
    // busca a configuração da Evolution na tabela evolution_config.
    const result = await sendWhatsAppMessage({
      leadId: id,
      phone: lead.telefone,
      message: finalMessage,
      media: uploaded
        ? { url: uploaded.signedUrl, type: uploaded.kind, fileName: uploaded.fileName }
        : null,
    });

    if (!result.ok) {
      // Mantém o modal aberto e mostra o erro real (sem expor dados sensíveis)
      setWhatsAppError(result.error || "Erro ao enviar mensagem.");
      setSendingWhatsApp(false);
      return;
    }

    setShowWhatsAppModal(false);
    removeWhatsAppAttachment();
    const { data: refreshed } = await supabase.from("leads").select("*").eq("id", lead.id).single();
    if (refreshed) setLead(refreshed);
    await fetchActivities();
    window.dispatchEvent(new CustomEvent("leads:refresh"));
    if (result.attachmentDeferred) {
      toast.message("Upload realizado, mas envio de anexo ainda depende do deploy da função de mídia.");
    }
    toast.success("Mensagem enviada via WhatsApp e interação registrada com sucesso.");
    setSendingWhatsApp(false);
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

  const cidadeUf = [lead.inep ? `INEP ${lead.inep}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex-1 p-8 max-w-4xl">
      {/* Back + Edit */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/leads")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Voltar para Leads
        </button>
        <Button
          onClick={() => openEditLead(lead)}
          variant="ghost"
          className="h-8 px-3 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-border/60 flex items-center gap-1.5 transition-all duration-150"
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
          Editar Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-5">

          {/* Lead header card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.25)]">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0">
                <h1 className="text-[22px] font-semibold text-foreground tracking-tight leading-tight truncate">
                  {lead.empresa || lead.nome}
                </h1>

                {cidadeUf && (
                  <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" strokeWidth={1.5} />
                    {cidadeUf}
                  </p>
                )}

                {lead.empresa && lead.nome && (
                  <p className="text-sm text-muted-foreground mt-1.5">{lead.nome}</p>
                )}

                {linkedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {linkedProducts.map((p) => {
                      const prod = PRODUCTS.find((x) => x.value === p);
                      return (
                        <span
                          key={p}
                          className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${PRODUCT_COLORS[p] || "text-muted-foreground bg-muted border-border"}`}
                        >
                          {prod?.label || p}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[lead.lead_status] || "text-muted-foreground bg-muted"}`}>
                {STATUS_OPTIONS.find((s) => s.value === lead.lead_status)?.label || lead.lead_status}
              </span>
            </div>

            {/* Contact info */}
            <div className="flex flex-col gap-1.5">
              {lead.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />{lead.email}
                </p>
              )}
              {lead.telefone && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  {lead.telefone}
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                    {(lead.telefone_tipo ?? "celular") === "celular" ? "Celular" : "Telefone"}
                  </span>
                </p>
              )}
              {lead.cidade && lead.uf && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  {lead.cidade} / {lead.uf}
                </p>
              )}
            </div>

            {/* WhatsApp action */}
            <div className="mt-5 pt-5 border-t border-border/40">
              <button
                onClick={openWhatsAppModal}
                disabled={sendingWhatsApp || !lead.telefone}
                className="w-full sm:w-auto h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
              >
                {sendingWhatsApp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" strokeWidth={2} />
                    Enviar WhatsApp
                  </>
                )}
              </button>
              {!lead.telefone && (
                <p className="text-[11px] text-muted-foreground/60 mt-2">
                  Cadastre um telefone para habilitar.
                </p>
              )}
            </div>

            {/* Email Studio action */}
            <div className="mt-3">
              <button
                onClick={() =>
                  navigate("/email-studio", {
                    state: {
                      leadPrefill: {
                        nomeContato: lead.nome || "",
                        nomeEscola: lead.empresa || "",
                        email: lead.email || "",
                      },
                    },
                  })
                }
                className="w-full sm:w-auto h-10 px-5 rounded-xl bg-[hsl(var(--primary))] hover:opacity-90 text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" strokeWidth={2} />
                Abrir no Email Studio
              </button>
            </div>

          </div>

          {/* ── Activities block ── */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.25)]">
            <div className="px-6 pt-5 pb-4 border-b border-border/60">
              <h2 className="text-sm font-semibold text-foreground">Últimas Interações</h2>
            </div>

            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 px-6 py-8 text-center">
                Nenhuma interação registrada ainda.
              </p>
            ) : (
              <div className="px-6 py-4 flex flex-col gap-5">
                {activities.map((act, idx) => {
                  const Icon = getInteractionIcon(act.tipo);
                  const typeLabel = INTERACTION_TYPES.find((t) => t.value === act.tipo)?.label || act.tipo;
                  return (
                    <div key={act.id}>
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="mt-0.5 w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground/80">{typeLabel}</span>
                            <span className="text-[11px] text-muted-foreground/60">{formatActivityDate(act.created_at)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{act.descricao}</p>
                        </div>
                        {/* Edit button */}
                        <button
                          onClick={() => openEditModal(act)}
                          className="mt-0.5 shrink-0 p-1 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary/60 transition-all duration-150"
                          title="Editar interação"
                        >
                          <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                      {idx < activities.length - 1 && (
                        <div className="mt-5 h-px bg-border/40" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="flex flex-col gap-5">

          {/* Status update */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.25)]">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest mb-3">Atualizar Status</p>
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateLeadStatus(lead.id, s.value)}
                  disabled={lead.lead_status === s.value}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${lead.lead_status === s.value
                      ? "bg-primary text-primary-foreground shadow-[0_4px_12px_hsl(var(--primary)/0.25)]"
                      : "bg-secondary/40 text-foreground/70 hover:bg-secondary hover:text-foreground"
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>





          {/* Products */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-2 mb-3">
              <Package2 className="w-3.5 h-3.5 text-muted-foreground/60" strokeWidth={1.5} />
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">Produtos</p>
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
                        : "bg-secondary/40 text-muted-foreground border-border/60 hover:bg-secondary hover:text-foreground"
                      }`}
                  >
                    <span>{prod.label}</span>
                    {isToggling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin opacity-60" />
                    ) : active ? (
                      <div className="w-4 h-4 rounded-full bg-current opacity-20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-current opacity-100" />
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add interaction */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.25)]">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest mb-3">Nova Interação</p>
            <form onSubmit={handleAddInteraction} className="flex flex-col gap-3">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="h-10 rounded-xl bg-input border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
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

              {/* Próximo passo opcional */}
              <div className="border-t border-border/40 pt-3 flex flex-col gap-2">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-medium">Próximo Passo (opcional)</p>
                <input
                  value={newProximoPasso}
                  onChange={(e) => setNewProximoPasso(e.target.value.slice(0, 120))}
                  placeholder="O que fazer depois? (máx. 120 caracteres)"
                  maxLength={120}
                  className="h-9 w-full rounded-xl bg-input/80 border border-border/60 text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                />
                <input
                  type="datetime-local"
                  value={newProximoPassoAt}
                  onChange={(e) => setNewProximoPassoAt(e.target.value)}
                  onKeyDown={(e) => e.preventDefault()}
                  className="h-9 w-full rounded-xl bg-input/80 border border-border/60 text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={savingNote || !newNote.trim()}
                className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all flex items-center gap-2"
              >
                {savingNote
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <><Plus className="w-3.5 h-3.5" strokeWidth={1.5} />Registrar</>
                }
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Edit Activity Modal ── */}
      <Dialog open={!!editingActivity} onOpenChange={(open) => { if (!open) closeEditModal(); }}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Editar Interação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-3 mt-1">
            <select
              value={editTipo}
              onChange={(e) => setEditTipo(e.target.value)}
              className="h-10 rounded-xl bg-input border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {INTERACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <Textarea
              value={editDescricao}
              onChange={(e) => setEditDescricao(e.target.value)}
              placeholder="Descrição da interação…"
              rows={4}
              className="rounded-xl bg-input border-border text-sm resize-none"
            />
            <DialogFooter className="mt-1">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
              >
                Cancelar
              </button>
              <Button
                type="submit"
                disabled={savingEdit || !editDescricao.trim()}
                className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all flex items-center gap-2"
              >
                {savingEdit
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : "Salvar"
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Lead Modal ── */}
      {showEditLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-blue-500/20 shadow-[0_8px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(59,130,246,0.08),0_0_40px_rgba(59,130,246,0.06)] p-6"
            style={{ background: "rgba(17,24,39,0.85)", backdropFilter: "blur(16px)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-foreground tracking-wide">Editar Lead</h2>
              <button onClick={() => setShowEditLead(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <FileText className="w-4 h-4 hidden" />
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs text-muted-foreground">Nome *</label>
                  <input
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    required
                    className={INPUT_CLASS}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">E-mail</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className={INPUT_CLASS}
                    placeholder="nome@empresa.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Tipo de Contato</label>
                  <select
                    value={editForm.telefone_tipo}
                    onChange={(e) => setEditForm({ ...editForm, telefone_tipo: e.target.value })}
                    className={SELECT_CLASS}
                  >
                    <option value="celular">Celular</option>
                    <option value="telefone">Telefone</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Telefone</label>
                  <input
                    value={editForm.telefone}
                    onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                    className={INPUT_CLASS}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Instituição de Ensino</label>
                  <input
                    value={editForm.empresa}
                    onChange={(e) => setEditForm({ ...editForm, empresa: e.target.value })}
                    className={INPUT_CLASS}
                    placeholder="Nome da instituição"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">INEP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editForm.inep}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      setEditForm({ ...editForm, inep: v });
                    }}
                    className={INPUT_CLASS}
                    placeholder="Código INEP"
                    minLength={7}
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <select
                    value={editForm.lead_status}
                    onChange={(e) => setEditForm({ ...editForm, lead_status: e.target.value })}
                    className={SELECT_CLASS}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Cidade</label>
                  <input
                    value={editForm.cidade}
                    onChange={(e) => setEditForm({ ...editForm, cidade: e.target.value })}
                    className={INPUT_CLASS}
                    placeholder="Ex: Campinas"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">UF</label>
                  <select
                    value={editForm.uf}
                    onChange={(e) => setEditForm({ ...editForm, uf: e.target.value })}
                    className={SELECT_CLASS}
                  >
                    <option value="">Selecionar</option>
                    {UF_LIST.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editLeadError && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">{editLeadError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowEditLead(false)}
                  className="flex-1 h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingLead}
                  className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all duration-200"
                >
                  {savingLead ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── WhatsApp send modal ── */}
      <Dialog
        open={showWhatsAppModal}
        onOpenChange={(open) => {
          if (!sendingWhatsApp) setShowWhatsAppModal(open);
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Enviar mensagem no WhatsApp</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Lead info */}
            <div className="rounded-xl bg-muted/40 border border-border/60 px-4 py-3 space-y-0.5">
              <p className="text-sm font-medium text-foreground">{lead?.nome}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3 h-3" strokeWidth={1.5} />
                {lead?.telefone}
              </p>
            </div>

            {/* Templates (preenchem o corpo da mensagem) */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Modelos de mensagem</p>
              <div className="flex flex-wrap gap-1.5">
                {WHATSAPP_TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => {
                      setWhatsAppBody(t.build(getLeadVars()));
                      setWhatsAppError(null);
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Variable chips (inserem no corpo) */}
            {whatsAppVariableChips().length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Inserir dados do lead no corpo</p>
                <div className="flex flex-wrap gap-1.5">
                  {whatsAppVariableChips().map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() =>
                        setWhatsAppBody((prev) =>
                          prev ? `${prev.replace(/\s+$/, "")} ${c.value}` : c.value
                        )
                      }
                      className="text-[11px] px-2 py-1 rounded-full border border-primary/25 bg-primary/8 text-primary/90 hover:bg-primary/15 transition-colors"
                    >
                      + {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Saudação */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Saudação</p>
              <input
                type="text"
                value={whatsAppGreeting}
                onChange={(e) => {
                  setWhatsAppGreeting(e.target.value);
                  if (whatsAppError) setWhatsAppError(null);
                }}
                className="w-full h-10 px-3 rounded-xl text-sm bg-background border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Olá, {nome}, tudo bem?"
              />
            </div>

            {/* Corpo da mensagem */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Corpo da mensagem</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleInsertLink}
                    className="text-[11px] px-2 py-1 rounded-lg border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center gap-1"
                  >
                    <Link2 className="w-3 h-3" strokeWidth={2} /> Inserir link
                  </button>
                  <button
                    type="button"
                    onClick={() => whatsAppFileRef.current?.click()}
                    className="text-[11px] px-2 py-1 rounded-lg border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center gap-1"
                  >
                    <Paperclip className="w-3 h-3" strokeWidth={2} /> Anexar arquivo
                  </button>
                  <input
                    ref={whatsAppFileRef}
                    type="file"
                    accept={ATTACHMENT_ACCEPT}
                    className="hidden"
                    onChange={handleWhatsAppFileChange}
                  />
                </div>
              </div>
              <Textarea
                value={whatsAppBody}
                onChange={(e) => {
                  setWhatsAppBody(e.target.value);
                  if (whatsAppError) setWhatsAppError(null);
                }}
                rows={5}
                className="rounded-xl text-sm resize-none"
                placeholder="Escreva o corpo da mensagem. Você pode incluir links (https://...)."
              />
              {whatsAppAttachment && (
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-2">
                  {whatsAppAttachmentPreview ? (
                    <img
                      src={whatsAppAttachmentPreview}
                      alt={whatsAppAttachment.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      {whatsAppAttachment.type.startsWith("image/") ? (
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{whatsAppAttachment.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatBytes(whatsAppAttachment.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeWhatsAppAttachment}
                    className="p-1 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                    aria-label="Remover anexo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>


            {/* Preview */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Pré-visualização</p>
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 text-sm whitespace-pre-wrap text-foreground min-h-[60px]">
                {buildFinalWhatsAppMessage() || (
                  <span className="text-muted-foreground italic">A mensagem final aparecerá aqui…</span>
                )}
              </div>
            </div>

            {whatsAppError && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                {whatsAppError}
              </p>
            )}
          </div>


          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowWhatsAppModal(false)}
              disabled={sendingWhatsApp}
              className="h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSendWhatsApp}
              disabled={sendingWhatsApp || buildFinalWhatsAppMessage().trim().length < 5}
              className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
            >
              {sendingWhatsApp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1.5" strokeWidth={2} />
                  Enviar agora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
