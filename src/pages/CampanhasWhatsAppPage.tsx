import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Megaphone,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { getEdgeFunctionError } from "@/lib/whatsapp";
import { CreateWhatsappCampaignModal } from "@/components/CreateWhatsappCampaignModal";

type CampaignStatus = "draft" | "running" | "paused" | "completed" | "cancelled";

type Campaign = {
  id: string;
  name: string;
  message_template: string;
  link: string | null;
  status: CampaignStatus;
  filters: { cidade?: string; uf?: string; lead_status?: string; produto?: string } | null;
  batch_size: number;
  delay_between_messages_seconds: number;
  delay_between_batches_seconds: number;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

type Recipient = {
  id: string;
  lead_id: string | null;
  phone: string;
  message_content: string | null;
  status: "pending" | "sent" | "failed" | "skipped";
  error_message: string | null;
  sent_at: string | null;
};

const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "text-muted-foreground bg-muted border-border" },
  running: { label: "Em andamento", className: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  paused: { label: "Pausada", className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  completed: { label: "Concluída", className: "text-green-400 bg-green-400/10 border-green-400/20" },
  cancelled: { label: "Cancelada", className: "text-destructive bg-destructive/10 border-destructive/20" },
};

const RECIPIENT_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "text-muted-foreground bg-muted border-border" },
  sent: { label: "Enviado", className: "text-green-400 bg-green-400/10 border-green-400/20" },
  failed: { label: "Falhou", className: "text-destructive bg-destructive/10 border-destructive/20" },
  skipped: { label: "Ignorado", className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
};

const PRODUCT_LABELS: Record<string, string> = {
  eduinfo: "EduInfo",
  gennera: "Gennera",
  ecoclear: "EcoClear",
  vibeflow: "VibeFlow",
};

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  em_contato: "Em Contato",
  qualificado: "Qualificado",
  fechado: "Fechado",
  perdido: "Perdido",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export default function CampanhasWhatsAppPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [runningLoops, setRunningLoops] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [recipientsMap, setRecipientsMap] = useState<Record<string, Recipient[]>>({});
  const [recipientsLoading, setRecipientsLoading] = useState<Set<string>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  const expandedIdRef = useRef<string | null>(null);
  const autoResumedRef = useRef<Set<string>>(new Set());

  async function fetchCampaigns() {
    setLoading(true);
    const { data, error } = await supabase
      .from("whatsapp_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar campanhas: " + error.message);
    setCampaigns(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchCampaigns(); }, []);

  // Retoma automaticamente campanhas que ficaram "running" (ex.: página recarregada).
  useEffect(() => {
    for (const c of campaigns) {
      if (c.status === "running" && !runningLoops.has(c.id) && !autoResumedRef.current.has(c.id)) {
        autoResumedRef.current.add(c.id);
        runCampaignLoop(c.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns]);

  function updateCampaignInState(updated: Campaign) {
    setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function fetchRecipients(campaignId: string) {
    setRecipientsLoading((prev) => new Set(prev).add(campaignId));
    const { data, error } = await supabase
      .from("whatsapp_campaign_recipients")
      .select("id, lead_id, phone, message_content, status, error_message, sent_at")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });
    if (error) toast.error("Erro ao carregar destinatários: " + error.message);
    setRecipientsMap((prev) => ({ ...prev, [campaignId]: data ?? [] }));
    setRecipientsLoading((prev) => {
      const next = new Set(prev);
      next.delete(campaignId);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => {
      const next = prev === id ? null : id;
      expandedIdRef.current = next;
      if (next) fetchRecipients(next);
      return next;
    });
  }

  async function runCampaignLoop(campaignId: string) {
    setRunningLoops((prev) => new Set(prev).add(campaignId));
    try {
      while (true) {
        const { data, error } = await supabase.functions.invoke("send-whatsapp-campaign-batch", {
          body: { campaignId },
        });
        if (error || !data?.ok) {
          const msg = await getEdgeFunctionError(data, error);
          toast.error(`Erro ao processar campanha: ${msg}`);
          break;
        }
        if (data.campaign) updateCampaignInState(data.campaign);
        if (expandedIdRef.current === campaignId) fetchRecipients(campaignId);
        if (data.done || data.campaign?.status !== "running") break;
        await sleep((data.campaign.delay_between_batches_seconds ?? 60) * 1000);
      }
    } finally {
      setRunningLoops((prev) => {
        const next = new Set(prev);
        next.delete(campaignId);
        return next;
      });
      autoResumedRef.current.delete(campaignId);
    }
  }

  async function handleStart(campaign: Campaign) {
    const { data, error } = await supabase.functions.invoke("process-whatsapp-campaign", {
      body: { campaignId: campaign.id },
    });
    if (error || !data?.ok) {
      const msg = await getEdgeFunctionError(data, error);
      toast.error(`Erro ao iniciar campanha: ${msg}`);
      return;
    }
    updateCampaignInState(data.campaign);
    toast.success(campaign.status === "paused" ? "Campanha retomada." : "Campanha iniciada.");
    runCampaignLoop(campaign.id);
  }

  async function handlePause(campaign: Campaign) {
    const { data, error } = await supabase
      .from("whatsapp_campaigns")
      .update({ status: "paused", updated_at: new Date().toISOString() })
      .eq("id", campaign.id)
      .select()
      .single();
    if (error) { toast.error("Erro ao pausar: " + error.message); return; }
    updateCampaignInState(data);
    toast.success("Campanha pausada. O envio em andamento será concluído antes de parar.");
  }

  async function handleCancel(campaign: Campaign) {
    const { data, error } = await supabase
      .from("whatsapp_campaigns")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", campaign.id)
      .select()
      .single();
    setCancelTarget(null);
    if (error) { toast.error("Erro ao cancelar: " + error.message); return; }
    updateCampaignInState(data);
    toast.success("Campanha cancelada.");
  }

  async function handleReprocessFailed(campaign: Campaign) {
    const { error: resetErr, count } = await supabase
      .from("whatsapp_campaign_recipients")
      .update({ status: "pending", error_message: null }, { count: "exact" })
      .eq("campaign_id", campaign.id)
      .eq("status", "failed");
    if (resetErr) { toast.error("Erro ao reprocessar: " + resetErr.message); return; }
    if (!count) { toast.info("Nenhum envio com falha para reprocessar."); return; }

    const { data, error } = await supabase
      .from("whatsapp_campaigns")
      .update({ status: "running", failed_count: 0, completed_at: null, updated_at: new Date().toISOString() })
      .eq("id", campaign.id)
      .select()
      .single();
    if (error) { toast.error("Erro ao reiniciar campanha: " + error.message); return; }
    updateCampaignInState(data);
    toast.success(`${count} envio(s) com falha movido(s) para reprocessamento.`);
    runCampaignLoop(campaign.id);
  }

  async function handleDelete(campaign: Campaign) {
    const { error } = await supabase.from("whatsapp_campaigns").delete().eq("id", campaign.id);
    setDeleteTarget(null);
    if (error) { toast.error("Erro ao excluir: " + error.message); return; }
    setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
    toast.success("Campanha excluída.");
  }

  return (
    <div className="flex-1 p-6 min-w-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Campanhas WhatsApp</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {campaigns.length} campanha{campaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-[0_4px_16px_hsl(var(--primary)/0.3)] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nova Campanha
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando…</span>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 flex flex-col items-center gap-3 text-center">
          <Megaphone className="w-8 h-8 text-muted-foreground" strokeWidth={1.3} />
          <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) => {
            const total = campaign.total_recipients || 0;
            const processed = campaign.sent_count + campaign.failed_count;
            const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
            const statusInfo = CAMPAIGN_STATUS_LABELS[campaign.status];
            const isRunning = runningLoops.has(campaign.id);
            const isExpanded = expandedId === campaign.id;
            const recipients = recipientsMap[campaign.id] ?? [];
            const f = campaign.filters ?? {};
            const hasFilters = !!(f.cidade || f.uf || f.lead_status || f.produto);

            return (
              <div key={campaign.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground">{campaign.name}</h3>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.className}`}>
                          {isRunning && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Criada em {formatDateTime(campaign.created_at)}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {f.cidade && <span className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded">Cidade: {f.cidade}</span>}
                        {f.uf && <span className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded">UF: {f.uf}</span>}
                        {f.lead_status && <span className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded">Status: {STATUS_LABELS[f.lead_status] || f.lead_status}</span>}
                        {f.produto && <span className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded">Produto: {PRODUCT_LABELS[f.produto] || f.produto}</span>}
                        {!hasFilters && (
                          <span className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded">Sem filtros (todos os leads)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {campaign.status === "draft" && (
                        <Button size="sm" className="h-8 rounded-lg text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white" onClick={() => handleStart(campaign)}>
                          <Play className="w-3.5 h-3.5" /> Iniciar
                        </Button>
                      )}
                      {campaign.status === "running" && (
                        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1.5" onClick={() => handlePause(campaign)}>
                          <Pause className="w-3.5 h-3.5" /> Pausar
                        </Button>
                      )}
                      {campaign.status === "paused" && (
                        <Button size="sm" className="h-8 rounded-lg text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white" onClick={() => handleStart(campaign)}>
                          <Play className="w-3.5 h-3.5" /> Retomar
                        </Button>
                      )}
                      {(campaign.status === "draft" || campaign.status === "running" || campaign.status === "paused") && (
                        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1.5 text-destructive hover:text-destructive" onClick={() => setCancelTarget(campaign)}>
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </Button>
                      )}
                      {(campaign.status === "completed" || campaign.status === "cancelled") && campaign.failed_count > 0 && (
                        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1.5" onClick={() => handleReprocessFailed(campaign)}>
                          <RotateCcw className="w-3.5 h-3.5" /> Reprocessar falhas ({campaign.failed_count})
                        </Button>
                      )}
                      {(campaign.status === "draft" || campaign.status === "completed" || campaign.status === "cancelled") && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(campaign)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {total > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>{processed}/{total} processados</span>
                        <span className="text-green-400">{campaign.sent_count} enviados</span>
                        {campaign.failed_count > 0 && <span className="text-destructive">{campaign.failed_count} falhas</span>}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">{campaign.message_template}</p>
                  {campaign.link && <p className="text-xs text-primary truncate">{campaign.link}</p>}

                  {total > 0 && (
                    <button
                      onClick={() => toggleExpand(campaign.id)}
                      className="self-start flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpanded ? "Ocultar destinatários" : "Ver destinatários"}
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-border max-h-72 overflow-y-auto">
                    {recipientsLoading.has(campaign.id) ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Carregando…</span>
                      </div>
                    ) : recipients.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-4 py-4 text-center">Nenhum destinatário.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {recipients.map((r) => {
                          const rs = RECIPIENT_STATUS_LABELS[r.status];
                          return (
                            <div key={r.id} className="px-4 py-2 flex items-center justify-between gap-3 text-xs">
                              <span className="text-foreground font-mono">+{r.phone}</span>
                              <div className="flex items-center gap-2 min-w-0">
                                {r.status === "failed" && r.error_message && (
                                  <span className="text-muted-foreground truncate max-w-[260px]" title={r.error_message}>{r.error_message}</span>
                                )}
                                <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${rs.className}`}>
                                  {rs.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateWhatsappCampaignModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchCampaigns}
      />

      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) setCancelTarget(null); }}>
        <AlertDialogContent className="rounded-2xl bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Os destinatários ainda pendentes não receberão a mensagem. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelTarget && handleCancel(cancelTarget)}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar campanha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              A campanha "{deleteTarget?.name}" e seu histórico de destinatários serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
