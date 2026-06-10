import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase, Lead } from "@/lib/supabase";
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
import { Loader2, Paperclip, Send, X } from "lucide-react";
import {
  buildLeadTemplateVariables,
  renderTemplate,
  DEFAULT_WHATSAPP_TEMPLATES,
  WHATSAPP_TEMPLATE_VARIABLES,
  validateAttachment,
  normalizePhoneForWhatsapp,
} from "@/lib/whatsapp";

type StoredTemplate = { id: string; name: string; content: string };

const DEFAULT_TEMPLATE_NAME = "Mensagem de teste";

export function WhatsappSendModal({
  open,
  onClose,
  lead,
  produtos,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  produtos: string[];
  onSent: () => void;
}) {
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(`__default__:${DEFAULT_TEMPLATE_NAME}`);
  const [vendedor, setVendedor] = useState("Equipe NAR");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const variables = useMemo(() => buildLeadTemplateVariables(lead, produtos, vendedor), [lead, produtos, vendedor]);

  useEffect(() => {
    if (!open) return;

    setLink("");
    setLinkError(null);
    setFile(null);
    setFileError(null);
    setSelectedTemplate(`__default__:${DEFAULT_TEMPLATE_NAME}`);

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const meta = user?.user_metadata as Record<string, unknown> | undefined;
      const fullName = (meta?.full_name ?? meta?.name) as string | undefined;
      const senderName = fullName?.trim() || user?.email?.split("@")[0] || "Equipe NAR";
      setVendedor(senderName);

      const vars = buildLeadTemplateVariables(lead, produtos, senderName);
      const def = DEFAULT_WHATSAPP_TEMPLATES.find((t) => t.name === DEFAULT_TEMPLATE_NAME);
      setMessage(renderTemplate(def?.content ?? "", vars));

      const { data } = await supabase
        .from("whatsapp_message_templates")
        .select("id, name, content")
        .order("created_at", { ascending: true });
      setTemplates(data ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function applyTemplate(value: string) {
    setSelectedTemplate(value);
    if (value === "__custom__") return;
    if (value.startsWith("__default__:")) {
      const name = value.slice("__default__:".length);
      const tpl = DEFAULT_WHATSAPP_TEMPLATES.find((t) => t.name === name);
      if (tpl) setMessage(renderTemplate(tpl.content, variables));
      return;
    }
    const custom = templates.find((t) => t.id === value);
    if (custom) setMessage(renderTemplate(custom.content, variables));
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

  const phone = normalizePhoneForWhatsapp(lead.telefone);
  const canSend = !sending && !!phone && (!!message.trim() || !!link.trim() || !!file) && !linkError && !fileError;

  async function handleSend() {
    if (!phone) {
      toast.error("Lead sem telefone válido para envio de WhatsApp.");
      return;
    }
    setSending(true);

    try {
      let attachmentId: string | null = null;

      if (file) {
        const result = validateAttachment(file);
        if (result.ok === false) {
          toast.error(result.error);
          setSending(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado.");

        const ext = file.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

        const { error: uploadErr } = await supabase.storage
          .from("whatsapp-attachments")
          .upload(path, file, { contentType: file.type });
        if (uploadErr) throw uploadErr;

        const { data: attRow, error: attErr } = await supabase
          .from("whatsapp_message_attachments")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_path: path,
            file_type: result.type,
            mime_type: file.type,
            file_size: file.size,
          })
          .select("id")
          .single();
        if (attErr) throw attErr;
        attachmentId = attRow.id;
      }

      const templateId = selectedTemplate.startsWith("__") ? null : selectedTemplate;

      const { data, error } = await supabase.functions.invoke("send-whatsapp-message", {
        body: {
          leadId: lead.id,
          phone,
          message: message.trim() || null,
          link: link.trim() || null,
          attachmentId,
          templateId,
        },
      });

      if (error || !data?.ok) {
        let errMsg = data?.error as string | undefined;
        if (!errMsg && error && "context" in error) {
          const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
          errMsg = body?.error;
        }
        errMsg = errMsg || error?.message || "Erro ao enviar mensagem.";
        toast.error(
          errMsg.includes("não configurada")
            ? `${errMsg} Acesse Configurações para conectar a Evolution API.`
            : `Erro ao enviar WhatsApp: ${errMsg}`
        );
        setSending(false);
        return;
      }

      toast.success("Mensagem enviada via WhatsApp e interação registrada com sucesso.");
      onSent();
      onClose();
    } catch (e) {
      toast.error("Erro ao enviar: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg rounded-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-500" /> Enviar WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-1">
          <p className="text-xs text-muted-foreground">
            Para: <span className="font-medium text-foreground">{lead.nome || lead.empresa}</span>
            {" · "}
            {phone ? `+${phone}` : "telefone inválido"}
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => applyTemplate(e.target.value)}
              className="h-10 rounded-xl bg-input border border-border text-sm text-foreground px-3 focus:outline-none focus:ring-1 focus:ring-primary"
            >
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
              <option value="__custom__">Mensagem personalizada</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Mensagem</label>
            <Textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); setSelectedTemplate("__custom__"); }}
              rows={6}
              className="rounded-xl bg-input border-border text-sm resize-none"
              placeholder="Digite a mensagem…"
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
            <label className="text-xs text-muted-foreground">Anexo (opcional)</label>
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
            onClick={handleSend}
            disabled={!canSend}
            className="h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-all flex items-center gap-2"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" />Enviar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
