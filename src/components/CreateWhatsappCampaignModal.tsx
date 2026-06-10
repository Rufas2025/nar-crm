import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2, Megaphone, Paperclip, Send, X } from "lucide-react";
import {
  DEFAULT_WHATSAPP_TEMPLATES,
  WHATSAPP_TEMPLATE_VARIABLES,
  validateAttachment,
  getEdgeFunctionError,
} from "@/lib/whatsapp";

type StoredTemplate = { id: string; name: string; content: string };

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em Contato" },
  { value: "qualificado", label: "Qualificado" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const PRODUCT_OPTIONS = [
  { value: "eduinfo", label: "EduInfo" },
  { value: "gennera", label: "Gennera" },
  { value: "ecoclear", label: "EcoClear" },
  { value: "vibeflow", label: "VibeFlow" },
];

type FilterState = { cidade: string; uf: string; lead_status: string; produto: string };
const EMPTY_FILTERS: FilterState = { cidade: "", uf: "", lead_status: "", produto: "" };

const FIELD_CLASS = "h-10 rounded-xl bg-input border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary";

async function countMatchingLeads(filters: FilterState): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  let query = supabase.from("leads").select("id").eq("user_id", user.id);
  if (filters.cidade.trim()) query = query.ilike("cidade", filters.cidade.trim());
  if (filters.uf) query = query.eq("uf", filters.uf);
  if (filters.lead_status) query = query.eq("lead_status", filters.lead_status);

  const { data: leads, error } = await query;
  if (error || !leads) return 0;
  if (!filters.produto) return leads.length;

  const leadIds = leads.map((l) => l.id as string);
  if (leadIds.length === 0) return 0;

  const { data: prods } = await supabase
    .from("lead_products")
    .select("lead_id")
    .eq("produto", filters.produto)
    .in("lead_id", leadIds);

  const idsWithProduct = new Set((prods ?? []).map((p: { lead_id: string }) => p.lead_id));
  return leadIds.filter((id) => idsWithProduct.has(id)).length;
}

export function CreateWhatsappCampaignModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("__custom__");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState("10");
  const [delayMessages, setDelayMessages] = useState("5");
  const [delayBatches, setDelayBatches] = useState("60");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setFilters(EMPTY_FILTERS);
    setMatchCount(null);
    setSelectedTemplate("__custom__");
    setMessage("");
    setLink("");
    setLinkError(null);
    setFile(null);
    setFileError(null);
    setBatchSize("10");
    setDelayMessages("5");
    setDelayBatches("60");

    (async () => {
      const { data } = await supabase
        .from("whatsapp_message_templates")
        .select("id, name, content")
        .order("created_at", { ascending: true });
      setTemplates(data ?? []);
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCountLoading(true);
    countMatchingLeads(filters).then((count) => {
      if (!cancelled) {
        setMatchCount(count);
        setCountLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [open, filters.cidade, filters.uf, filters.lead_status, filters.produto]);

  function applyTemplate(value: string) {
    setSelectedTemplate(value);
    if (value === "__custom__") return;
    if (value.startsWith("__default__:")) {
      const name = value.slice("__default__:".length);
      const tpl = DEFAULT_WHATSAPP_TEMPLATES.find((t) => t.name === name);
      if (tpl) setMessage(tpl.content);
      return;
    }
    const custom = templates.find((t) => t.id === value);
    if (custom) setMessage(custom.content);
  }

  function handleLinkChange(value: string) {
    setLink(value);
    if (!value.trim()) {
      setLinkError(null);
      return;
    }
    try {
      const url = new URL(value.trim());
      setLinkError(["http:", "https:"].includes(url.protocol) ? null : "O link deve começar com http:// ou https://");
    } catch {
      setLinkError("Link inválido.");
    }
  }

  function handleFileChange(f: File | null) {
    setFile(null);
    setFileError(null);
    if (!f) return;
    const result = validateAttachment(f);
    if (result.ok === false) {
      setFileError(result.error);
      return;
    }
    setFile(f);
  }

  const canCreate =
    !creating &&
    name.trim().length > 0 &&
    (message.trim().length > 0 || link.trim().length > 0 || !!file) &&
    !linkError &&
    !fileError &&
    (matchCount ?? 0) > 0;

  async function handleCreate() {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const filtersPayload: Record<string, string> = {};
      if (filters.cidade.trim()) filtersPayload.cidade = filters.cidade.trim();
      if (filters.uf) filtersPayload.uf = filters.uf;
      if (filters.lead_status) filtersPayload.lead_status = filters.lead_status;
      if (filters.produto) filtersPayload.produto = filters.produto;

      const { data: campaign, error: campErr } = await supabase
        .from("whatsapp_campaigns")
        .insert({
          user_id: user.id,
          name: name.trim(),
          message_template: message.trim(),
          link: link.trim() || null,
          filters: filtersPayload,
          batch_size: Math.max(1, parseInt(batchSize, 10) || 10),
          delay_between_messages_seconds: Math.max(0, parseInt(delayMessages, 10) || 0),
          delay_between_batches_seconds: Math.max(0, parseInt(delayBatches, 10) || 0),
        })
        .select()
        .single();
      if (campErr) throw campErr;

      if (file) {
        const result = validateAttachment(file);
        if (result.ok === false) throw new Error(result.error);

        const ext = file.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

        const { error: uploadErr } = await supabase.storage
          .from("whatsapp-attachments")
          .upload(path, file, { contentType: file.type });
        if (uploadErr) throw uploadErr;

        const { error: attErr } = await supabase.from("whatsapp_message_attachments").insert({
          user_id: user.id,
          campaign_id: campaign.id,
          file_name: file.name,
          file_path: path,
          file_type: result.type,
          mime_type: file.type,
          file_size: file.size,
        });
        if (attErr) throw attErr;
      }

      const { data: startData, error: startErr } = await supabase.functions.invoke("process-whatsapp-campaign", {
        body: { campaignId: campaign.id },
      });

      if (startErr || !startData?.ok) {
        const msg = await getEdgeFunctionError(startData, startErr);
        toast.error(`Campanha criada como rascunho, mas houve um erro ao iniciar: ${msg}`);
        onCreated();
        onClose();
        return;
      }

      const total = startData.campaign?.total_recipients ?? startData.totalRecipients ?? 0;
      toast.success(`Campanha criada e iniciada para ${total} lead${total !== 1 ? "s" : ""}.`);
      onCreated();
      onClose();
    } catch (e) {
      toast.error("Erro ao criar campanha: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl rounded-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-emerald-500" /> Nova Campanha de WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Nome da campanha</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Reativação SP - Junho/2026"
              className="h-10 rounded-xl bg-input border-border text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Filtros de leads</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                value={filters.cidade}
                onChange={(e) => setFilters({ ...filters, cidade: e.target.value })}
                placeholder="Cidade"
                className={FIELD_CLASS}
              />
              <select
                value={filters.uf}
                onChange={(e) => setFilters({ ...filters, uf: e.target.value })}
                className={FIELD_CLASS}
              >
                <option value="">UF (todas)</option>
                {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
              <select
                value={filters.lead_status}
                onChange={(e) => setFilters({ ...filters, lead_status: e.target.value })}
                className={FIELD_CLASS}
              >
                <option value="">Status (todos)</option>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select
                value={filters.produto}
                onChange={(e) => setFilters({ ...filters, produto: e.target.value })}
                className={FIELD_CLASS}
              >
                <option value="">Produto (todos)</option>
                {PRODUCT_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              {countLoading ? (
                <span className="inline-flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Calculando leads correspondentes…</span>
              ) : (
                <span className={matchCount === 0 ? "text-destructive" : ""}>
                  {matchCount ?? 0} lead{matchCount !== 1 ? "s" : ""} correspondem aos filtros
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => applyTemplate(e.target.value)}
              className={FIELD_CLASS}
            >
              <option value="__custom__">Mensagem personalizada</option>
              <optgroup label="Templates padrão">
                {DEFAULT_WHATSAPP_TEMPLATES.map((t) => (
                  <option key={t.name} value={`__default__:${t.name}`}>{t.name}</option>
                ))}
              </optgroup>
              {templates.length > 0 && (
                <optgroup label="Meus templates">
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Mensagem</label>
            <Textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); setSelectedTemplate("__custom__"); }}
              rows={6}
              className="rounded-xl bg-input border-border text-sm resize-none"
              placeholder="Digite a mensagem… use {{variavel}} para personalizar por lead"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {WHATSAPP_TEMPLATE_VARIABLES.map((v) => (
              <span
                key={v.key}
                title={v.label}
                className="text-[10px] font-mono bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded"
              >
                {`{{${v.key}}}`}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Link (opcional)</label>
            <Input
              value={link}
              onChange={(e) => handleLinkChange(e.target.value)}
              placeholder="https://..."
              className="h-10 rounded-xl bg-input border-border text-sm"
            />
            {linkError && <p className="text-xs text-destructive">{linkError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Anexo (opcional, enviado para todos os destinatários)</label>
            {file ? (
              <div className="flex items-center justify-between gap-2 h-10 px-3 rounded-xl bg-input border border-border text-sm">
                <span className="truncate flex items-center gap-2 min-w-0">
                  <Paperclip className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </span>
                <button type="button" onClick={() => handleFileChange(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="text-sm text-muted-foreground file:mr-3 file:h-9 file:px-3 file:rounded-xl file:border-0 file:bg-secondary file:text-foreground file:text-xs file:font-medium"
              />
            )}
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Configurações de envio</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho do lote</label>
                <input
                  type="number"
                  min="1"
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Entre msgs (s)</label>
                <input
                  type="number"
                  min="0"
                  value={delayMessages}
                  onChange={(e) => setDelayMessages(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Entre lotes (s)</label>
                <input
                  type="number"
                  min="0"
                  value={delayBatches}
                  onChange={(e) => setDelayBatches(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Envie mensagens apenas para leads que autorizaram contato via WhatsApp. Volumes elevados ou
              mensagens não solicitadas podem causar o bloqueio do número conectado à Evolution API.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
          >
            Cancelar
          </button>
          <Button
            onClick={handleCreate}
            disabled={!canCreate}
            className="h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-all flex items-center gap-2"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" />Criar e iniciar campanha</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
