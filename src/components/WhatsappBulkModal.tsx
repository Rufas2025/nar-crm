import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Phone, Paperclip, X, Image as ImageIcon, FileText, CheckCircle2, XCircle, Link2, MinusCircle, Building2 } from "lucide-react";
import type { Lead } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/evolution";
import {
  ATTACHMENT_ACCEPT,
  formatBytes,
  uploadWhatsAppAttachment,
  validateAttachment,
  type UploadedAttachment,
} from "@/lib/whatsappAttachment";

type Status = "pending" | "sending" | "sent" | "error" | "skipped";

type Row = {
  lead: Lead;
  status: Status;
  message: string;
  error?: string;
};

function firstName(nome: string | null | undefined): string {
  return (nome ?? "").trim().split(/\s+/)[0] || "";
}

function buildGreeting(template: string, nome: string): string {
  const first = firstName(nome);
  if (!template.includes("{{nome}}")) return template;
  if (!first) return "Olá, tudo bem?";
  return template.split("{{nome}}").join(first);
}

function renderTemplate(template: string, vars: { nome: string; link: string }) {
  const first = firstName(vars.nome);
  return template
    .split("{{nome}}").join(first || "")
    .split("{{link}}").join(vars.link || "");
}

export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const d = phone.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 13;
}

export function formatPhone(phone: string | null | undefined): string {
  const d = (phone ?? "").replace(/\D/g, "");
  if (!d) return "—";
  const withCc = d.length <= 11 ? `55${d}` : d;
  const cc = withCc.slice(0, 2);
  const ddd = withCc.slice(2, 4);
  const rest = withCc.slice(4);
  if (!rest) return `+${withCc}`;
  const mid = rest.length > 4 ? rest.slice(0, rest.length - 4) : rest;
  const end = rest.length > 4 ? rest.slice(-4) : "";
  return `+${cc} (${ddd}) ${mid}${end ? `-${end}` : ""}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}min ${s}s` : `${s}s`;
}

export default function WhatsappBulkModal({
  leads,
  open,
  onOpenChange,
  onDone,
}: {
  leads: Lead[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}) {
  const eligibleLeads = useMemo(() => leads.filter((l) => isValidPhone(l.telefone)), [leads]);
  const invalidLeads = useMemo(() => leads.filter((l) => !isValidPhone(l.telefone)), [leads]);

  const [greeting, setGreeting] = useState("Olá, {{nome}}, tudo bem?");
  const [body, setBody] = useState("Quero compartilhar este link:\n{{link}}");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [intervalSeconds, setIntervalSeconds] = useState(90);

  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [sending, setSending] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [doneSummary, setDoneSummary] = useState<
    { total: number; sent: number; failed: number; skipped: number; elapsedMs: number } | null
  >(null);
  const [showAllPreviews, setShowAllPreviews] = useState(false);

  useEffect(() => {
    if (open) {
      setRows([]);
      setDoneSummary(null);
      setCurrentIndex(null);
    }
  }, [open]);

  function buildMessageFor(lead: Lead): string {
    const g = buildGreeting(greeting, lead.nome ?? "");
    const b = renderTemplate(body, { nome: lead.nome ?? "", link });
    const trimmedG = g.trim();
    const trimmedB = b.trim();
    if (!trimmedG) return trimmedB;
    if (!trimmedB) return trimmedG;
    return `${trimmedG}\n\n${trimmedB}`;
  }

  const previewLeads = showAllPreviews ? eligibleLeads : eligibleLeads.slice(0, 3);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const v = validateAttachment(f);
    if (!v.ok) {
      toast.error(v.error || "Arquivo inválido");
      return;
    }
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachment(f);
    setAttachmentPreview(v.kind === "image" ? URL.createObjectURL(f) : null);
  }

  function removeAttachment() {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachment(null);
    setAttachmentPreview(null);
  }

  function handleInsertLinkInBody() {
    const url = window.prompt("Cole o link (https://...)", link || "https://");
    if (!url) return;
    const trimmed = url.trim();
    if (!/^https?:\/\/\S+/i.test(trimmed)) {
      toast.error("Link inválido. Use http:// ou https://");
      return;
    }
    setLink(trimmed);
    setLinkError(null);
    if (!body.includes("{{link}}")) {
      setBody((prev) => (prev ? `${prev.replace(/\s+$/, "")}\n{{link}}` : "{{link}}"));
    }
    toast.success("Link adicionado");
  }

  async function handleSendAll() {
    if (eligibleLeads.length === 0) {
      toast.error("Nenhum lead com telefone válido.");
      return;
    }
    if (link && !/^https?:\/\/\S+/i.test(link.trim())) {
      setLinkError("Link inválido. Use http:// ou https://");
      return;
    }
    const firstMsg = buildMessageFor(eligibleLeads[0]);
    if (firstMsg.trim().length < 5) {
      toast.error("Mensagem muito curta. Escreva pelo menos 5 caracteres.");
      return;
    }

    setSending(true);
    setDoneSummary(null);
    const startedAt = Date.now();

    let uploaded: UploadedAttachment | null = null;
    if (attachment) {
      try {
        uploaded = await uploadWhatsAppAttachment(attachment);
      } catch (e: any) {
        toast.error(e?.message || "Falha no upload do anexo");
        setSending(false);
        return;
      }
    }

    // Ordem: elegíveis primeiro, ignorados marcados no fim
    const initial: Row[] = [
      ...eligibleLeads.map((l) => ({ lead: l, status: "pending" as Status, message: buildMessageFor(l) })),
      ...invalidLeads.map((l) => ({
        lead: l,
        status: "skipped" as Status,
        message: "",
        error: "Telefone ausente ou inválido",
      })),
    ];
    setRows(initial);

    let sent = 0;
    let failed = 0;
    let deferredOnce = false;
    const delayMs = Math.max(0, Math.round(intervalSeconds * 1000));

    for (let i = 0; i < eligibleLeads.length; i++) {
      const row = initial[i];
      setCurrentIndex(i);
      setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "sending" } : r)));

      let result: Awaited<ReturnType<typeof sendWhatsAppMessage>>;
      try {
        result = await sendWhatsAppMessage({
          leadId: row.lead.id,
          phone: row.lead.telefone!,
          message: row.message,
          media: uploaded
            ? { url: uploaded.signedUrl, type: uploaded.kind, fileName: uploaded.fileName }
            : null,
        });
      } catch (e: any) {
        result = { ok: false, error: String(e?.message ?? e) };
      }

      if (result.ok) {
        sent++;
        if (result.attachmentDeferred) deferredOnce = true;
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "sent" } : r)));
      } else {
        failed++;
        setRows((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: "error", error: result.error || "Erro" } : r))
        );
      }

      if (i < eligibleLeads.length - 1) await sleep(delayMs);
    }

    setCurrentIndex(null);
    setSending(false);
    setDoneSummary({
      total: leads.length,
      sent,
      failed,
      skipped: invalidLeads.length,
      elapsedMs: Date.now() - startedAt,
    });

    if (deferredOnce && uploaded) {
      toast.message("Upload realizado, mas envio de anexo ainda depende do deploy da função de mídia.");
    }
    if (sent > 0 && failed === 0) {
      toast.success(`${sent} mensagem(ns) enviada(s) com sucesso.`);
    } else if (sent > 0 && failed > 0) {
      toast.warning(`${sent} enviada(s), ${failed} com erro.`);
    } else {
      toast.error(`Nenhuma mensagem enviada (${failed} erro${failed !== 1 ? "s" : ""}).`);
    }

    onDone?.();
  }

  function handleClose(open: boolean) {
    if (sending) return;
    if (!open) {
      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
      setAttachment(null);
      setAttachmentPreview(null);
      setRows([]);
      setDoneSummary(null);
      setLinkError(null);
      setShowAllPreviews(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Enviar WhatsApp em lote</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contadores */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-muted/40 border border-border/60 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Selecionados</p>
              <p className="text-lg font-semibold text-foreground">{leads.length}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Telefone válido</p>
              <p className="text-lg font-semibold text-emerald-400">{eligibleLeads.length}</p>
            </div>
            <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Sem telefone</p>
              <p className="text-lg font-semibold text-yellow-400">{invalidLeads.length}</p>
            </div>
          </div>

          {/* Saudação */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Saudação (use <code className="text-primary">{"{{nome}}"}</code>)
            </p>
            <input
              type="text"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="w-full h-10 px-3 rounded-xl text-sm bg-background border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Olá, {{nome}}, tudo bem?"
            />
          </div>

          {/* Corpo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Corpo (use <code className="text-primary">{"{{nome}}"}</code> e <code className="text-primary">{"{{link}}"}</code>)
              </p>
              <button
                type="button"
                onClick={handleInsertLinkInBody}
                className="text-[11px] px-2 py-1 rounded-lg border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center gap-1"
              >
                <Link2 className="w-3 h-3" strokeWidth={2} /> Inserir link
              </button>
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="rounded-xl text-sm resize-none"
              placeholder="Quero compartilhar este link: {{link}}"
            />
          </div>

          {/* Link */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Link (opcional, substitui <code className="text-primary">{"{{link}}"}</code>)</p>
            <input
              type="url"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setLinkError(null);
              }}
              className="w-full h-10 px-3 rounded-xl text-sm bg-background border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="https://exemplo.com"
            />
            {linkError && <p className="text-xs text-destructive">{linkError}</p>}
          </div>

          {/* Intervalo entre envios */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Intervalo entre envios (segundos)</p>
            <input
              type="number"
              min={0}
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(Math.max(0, Number(e.target.value) || 0))}
              disabled={sending}
              className="w-32 h-10 px-3 rounded-xl text-sm bg-background border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-[11px] text-muted-foreground/70">
              Envio sequencial (1 por vez). Estimativa: ~{formatDuration(Math.max(0, eligibleLeads.length - 1) * intervalSeconds * 1000)} de espera.
            </p>
          </div>

          {/* Anexo */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Anexo (opcional — JPG, PNG, WEBP ou PDF, máx 10 MB)</p>
            {!attachment ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 px-3 rounded-xl border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center gap-2"
              >
                <Paperclip className="w-3.5 h-3.5" /> Anexar arquivo
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-2">
                {attachmentPreview ? (
                  <img src={attachmentPreview} alt={attachment.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    {attachment.type.startsWith("image/") ? <ImageIcon className="w-5 h-5 text-muted-foreground" /> : <FileText className="w-5 h-5 text-muted-foreground" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{attachment.name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatBytes(attachment.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="p-1 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                  aria-label="Remover anexo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Preview personalizado por lead */}
          {previewLeads.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Pré-visualização ({previewLeads.length} de {eligibleLeads.length})
                </p>
                {eligibleLeads.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllPreviews((v) => !v)}
                    className="text-[11px] px-2 py-1 rounded-lg border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAllPreviews ? "Mostrar menos" : "Ver todos"}
                  </button>
                )}
              </div>
              <div className="grid gap-2 max-h-72 overflow-y-auto">
                {previewLeads.map((l) => (
                  <div key={l.id} className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3">
                    <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-muted-foreground" /> {l.empresa || "(sem instituição)"}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 mb-1.5">
                      <Phone className="w-3 h-3" /> Destinatário: {l.nome || "(sem contato)"} · {formatPhone(l.telefone)}
                    </p>
                    <p className="text-sm whitespace-pre-wrap text-foreground">{buildMessageFor(l)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ignorados */}
          {invalidLeads.length > 0 && rows.length === 0 && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 space-y-1">
              <p className="text-xs text-yellow-400">
                {invalidLeads.length} lead(s) serão ignorados por telefone ausente/inválido:
              </p>
              {invalidLeads.slice(0, 5).map((l) => (
                <p key={l.id} className="text-[11px] text-muted-foreground truncate">
                  · {l.empresa || "(sem instituição)"} — {l.nome || "(sem contato)"}
                </p>
              ))}
              {invalidLeads.length > 5 && (
                <p className="text-[11px] text-muted-foreground/70">+ {invalidLeads.length - 5} outro(s)</p>
              )}
            </div>
          )}

          {/* Progresso */}
          {rows.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Progresso{currentIndex !== null ? ` — enviando ${currentIndex + 1} de ${eligibleLeads.length}` : ""}
              </p>
              <div className="rounded-xl border border-border/60 bg-muted/20 max-h-64 overflow-y-auto divide-y divide-border/40">
                {rows.map((r) => (
                  <div key={r.lead.id} className="px-3 py-2 flex items-center gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{r.lead.empresa || "(sem instituição)"}</p>
                      <p className="text-muted-foreground/70 truncate">
                        {r.lead.nome || "(sem contato)"} · {formatPhone(r.lead.telefone)}
                      </p>
                      {r.error && <p className={r.status === "skipped" ? "text-yellow-400 truncate" : "text-destructive truncate"}>{r.error}</p>}
                    </div>
                    {r.status === "pending" && <span className="text-muted-foreground/60">Pendente</span>}
                    {r.status === "sending" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    {r.status === "sent" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                    {r.status === "error" && <XCircle className="w-4 h-4 text-destructive" />}
                    {r.status === "skipped" && <MinusCircle className="w-4 h-4 text-yellow-400" />}
                  </div>
                ))}
              </div>
              {doneSummary && (
                <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                  <p>Total selecionado: <span className="text-foreground font-medium">{doneSummary.total}</span></p>
                  <p>Enviados: <span className="text-green-400 font-medium">{doneSummary.sent}</span></p>
                  <p>Falhas: <span className="text-destructive font-medium">{doneSummary.failed}</span></p>
                  <p>Ignorados: <span className="text-yellow-400 font-medium">{doneSummary.skipped}</span></p>
                  <p>Tempo total: <span className="text-foreground font-medium">{formatDuration(doneSummary.elapsedMs)}</span></p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleClose(false)}
            disabled={sending}
            className="h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {doneSummary ? "Fechar" : "Cancelar"}
          </Button>
          <Button
            type="button"
            onClick={handleSendAll}
            disabled={sending || eligibleLeads.length === 0 || !!doneSummary}
            className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" strokeWidth={2} />
                Enviar para {eligibleLeads.length}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
