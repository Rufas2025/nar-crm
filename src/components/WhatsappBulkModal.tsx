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
import {
  Loader2,
  Send,
  Phone,
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  XCircle,
  Link2,
  MinusCircle,
  Building2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import type { Lead } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/evolution";
import {
  ATTACHMENT_ACCEPT,
  formatBytes,
  uploadWhatsAppAttachment,
  validateAttachment,
  type UploadedAttachment,
} from "@/lib/whatsappAttachment";

type TextStatus = "pending" | "sending" | "sent" | "failed" | "skipped" | "not_sent";
type MediaStatus =
  | "not_requested"
  | "uploading"
  | "pending"
  | "sending"
  | "sent"
  | "failed";

type Row = {
  lead: Lead;
  message: string;
  textStatus: TextStatus;
  mediaStatus: MediaStatus;
  error?: string;
  mediaError?: string;
};

type UploadState = "idle" | "uploading" | "ready" | "error";

function clean(v: string | null | undefined): string {
  return (v ?? "").replace(/\s+/g, " ").trim();
}

function firstName(nome: string | null | undefined): string {
  return clean(nome).split(" ")[0] || "";
}

/** Variáveis suportadas. `nome` = Decisor/Contato (lead.nome); `instituicao` = lead.empresa. */
export const TEMPLATE_VARS = ["nome", "primeiro_nome", "instituicao", "link"] as const;

export function leadVars(lead: Lead, link: string): Record<string, string> {
  const nome = clean(lead.nome);
  return {
    nome,
    primeiro_nome: firstName(nome),
    instituicao: clean(lead.empresa),
    link: clean(link),
  };
}

/** Substituição única usada tanto no preview quanto no envio real. */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key: string) => {
    const value = vars[key.toLowerCase()];
    return value !== undefined && value !== null ? value : match;
  });
}

/** Retorna os placeholders que continuariam sem valor após a renderização. */
export function unresolvedPlaceholders(template: string, vars: Record<string, string>): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([^{}]*?)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template))) {
    const key = m[1].trim();
    const value = vars[key.toLowerCase()];
    if (!value) found.add(`{{${key}}}`);
  }
  return [...found];
}

function buildGreeting(template: string, vars: Record<string, string>): string {
  const hasName = Boolean(vars.nome);
  if (!hasName && /\{\{\s*(nome|primeiro_nome)\s*\}\}/i.test(template)) {
    return "Olá, tudo bem?";
  }
  return renderTemplate(template, vars);
}


/** Detecta URLs indevidamente envolvidas por chaves, ex: {{https://exemplo.com}} */
const WRAPPED_URL_RE = /\{\{\s*(https?:\/\/[^{}\s]+)\s*\}\}/gi;

export function hasWrappedUrl(text: string): boolean {
  WRAPPED_URL_RE.lastIndex = 0;
  return WRAPPED_URL_RE.test(text);
}

export function unwrapUrls(text: string): string {
  return text.replace(WRAPPED_URL_RE, "$1");
}

/** Normaliza o telefone apenas para comparação — nunca altera o valor salvo no banco. */
export function normalizePhone(phone: string | null | undefined): string {
  const d = (phone ?? "").replace(/\D/g, "");
  if (!d) return "";
  const withCc = d.length <= 11 ? `55${d}` : d;
  return withCc.replace(/^55(\d{2})9(\d{8})$/, "55$19$2");
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

function finalLabel(r: Row): { label: string; tone: string } {
  if (r.textStatus === "skipped") return { label: "Ignorado", tone: "text-yellow-400" };
  if (r.textStatus === "pending") return { label: "Pendente", tone: "text-muted-foreground/60" };
  if (r.textStatus === "not_sent") return { label: "Não enviado", tone: "text-muted-foreground/60" };
  if (r.textStatus === "sending" || r.mediaStatus === "sending" || r.mediaStatus === "uploading")
    return { label: "Enviando", tone: "text-primary" };
  const mediaOk = r.mediaStatus === "not_requested" || r.mediaStatus === "sent";
  if (r.textStatus === "sent" && mediaOk) return { label: "Enviado", tone: "text-green-400" };
  if (r.textStatus === "sent" && r.mediaStatus === "failed")
    return { label: "Parcial", tone: "text-amber-400" };
  return { label: "Falhou", tone: "text-destructive" };
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
  const validPhoneLeads = useMemo(() => leads.filter((l) => isValidPhone(l.telefone)), [leads]);
  const invalidLeads = useMemo(() => leads.filter((l) => !isValidPhone(l.telefone)), [leads]);

  /** Deduplicação por telefone normalizado: mantém apenas o primeiro lead de cada número. */
  const { eligibleLeads, duplicateGroups, duplicateLeads } = useMemo(() => {
    const byPhone = new Map<string, Lead[]>();
    for (const l of validPhoneLeads) {
      const key = normalizePhone(l.telefone);
      const arr = byPhone.get(key);
      if (arr) arr.push(l);
      else byPhone.set(key, [l]);
    }
    const kept: Lead[] = [];
    const dupes: Lead[] = [];
    const groups: { phone: string; leads: Lead[] }[] = [];
    for (const [phone, group] of byPhone) {
      kept.push(group[0]);
      if (group.length > 1) {
        dupes.push(...group.slice(1));
        groups.push({ phone, leads: group });
      }
    }
    return { eligibleLeads: kept, duplicateGroups: groups, duplicateLeads: dupes };
  }, [validPhoneLeads]);


  const [greeting, setGreeting] = useState("Olá, {{primeiro_nome}}, tudo bem?");
  const [body, setBody] = useState("Quero compartilhar este link:\n{{link}}");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [intervalSeconds, setIntervalSeconds] = useState(90);

  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [sending, setSending] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [doneSummary, setDoneSummary] = useState<
    {
      total: number;
      textsSent: number;
      mediasSent: number;
      complete: number;
      partial: number;
      failed: number;
      skipped: number;
      notSent: number;
      duplicatesIgnored: number;
      elapsedMs: number;
    } | null
  >(null);
  const [showAllPreviews, setShowAllPreviews] = useState(false);

  useEffect(() => {
    if (open) {
      setRows([]);
      setDoneSummary(null);
      setCurrentIndex(null);
    }
  }, [open]);

  const wrappedUrlWarning = hasWrappedUrl(body) || hasWrappedUrl(greeting);

  function buildMessageFor(lead: Lead): string {
    const vars = leadVars(lead, link);
    const g = buildGreeting(greeting, vars);
    const b = renderTemplate(body, vars);
    const trimmedG = g.trim();
    const trimmedB = b.trim();
    if (!trimmedG) return trimmedB;
    if (!trimmedB) return trimmedG;
    return `${trimmedG}\n\n${trimmedB}`;
  }

  /** Destinatários com placeholders sem valor (bloqueiam o envio). */
  const unresolvedByLead = useMemo(() => {
    return eligibleLeads
      .map((lead) => {
        const vars = leadVars(lead, link);
        const nameless =
          !vars.nome && /\{\{\s*(nome|primeiro_nome)\s*\}\}/i.test(greeting) && !body.match(/\{\{\s*(nome|primeiro_nome)\s*\}\}/i);
        const missing = new Set<string>([
          ...(nameless ? [] : unresolvedPlaceholders(greeting, vars)),
          ...unresolvedPlaceholders(body, vars),
        ]);
        return { lead, missing: [...missing] };
      })
      .filter((r) => r.missing.length > 0);
  }, [eligibleLeads, greeting, body, link]);

  const unresolvedNames = useMemo(
    () => [...new Set(unresolvedByLead.flatMap((r) => r.missing))],
    [unresolvedByLead]
  );

  const previewLeads = showAllPreviews ? eligibleLeads : eligibleLeads.slice(0, 3);


  async function startUpload(file: File) {
    setUploadState("uploading");
    setUploadError(null);
    setUploaded(null);
    try {
      const result = await uploadWhatsAppAttachment(file);
      setUploaded(result);
      setUploadState("ready");
    } catch (e: unknown) {
      setUploadState("error");
      setUploadError((e as Error)?.message || "Falha no upload do anexo.");
    }
  }

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
    void startUpload(f);
  }

  function removeAttachment() {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachment(null);
    setAttachmentPreview(null);
    setUploaded(null);
    setUploadState("idle");
    setUploadError(null);
  }

  function handleInsertLinkInBody() {
    const url = window.prompt("Cole o link (https://...)", link || "https://");
    if (!url) return;
    const trimmed = unwrapUrls(url.trim());
    if (!/^https?:\/\/\S+/i.test(trimmed)) {
      toast.error("Link inválido. Use http:// ou https://");
      return;
    }
    setLink(trimmed);
    setLinkError(null);
    // Insere sempre o placeholder literal {{link}} no corpo — nunca a URL crua.
    if (!body.includes("{{link}}")) {
      setBody((prev) => (prev ? `${prev.replace(/\s+$/, "")}\n{{link}}` : "{{link}}"));
    }
    toast.success("Link adicionado ao campo Link. O corpo usa {{link}}.");
  }

  function autoFixWrappedUrls() {
    const foundInBody = body.match(WRAPPED_URL_RE);
    WRAPPED_URL_RE.lastIndex = 0;
    const firstUrl = foundInBody?.[0]?.replace(/^\{\{\s*|\s*\}\}$/g, "");
    setBody((prev) => unwrapUrls(prev));
    setGreeting((prev) => unwrapUrls(prev));
    if (firstUrl && !link) setLink(firstUrl);
    toast.success("Chaves removidas da URL.");
  }

  async function handleSendAll() {
    if (eligibleLeads.length === 0) {
      toast.error("Nenhum lead com telefone válido.");
      return;
    }
    if (wrappedUrlWarning) {
      toast.error("Use {{link}} no texto e informe a URL no campo Link.");
      return;
    }
    if (unresolvedByLead.length > 0) {
      toast.error(`Existem campos de personalização não resolvidos: ${unresolvedNames.join(", ")}`);
      return;
    }

    if (link && !/^https?:\/\/\S+/i.test(link.trim())) {
      setLinkError("Link inválido. Use http:// ou https://");
      return;
    }
    if (attachment && uploadState !== "ready") {
      toast.error(
        uploadState === "uploading"
          ? "Aguarde o upload do anexo terminar."
          : "O anexo não foi enviado ao storage. Tente novamente."
      );
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

    const media = uploaded;

    const initial: Row[] = [
      ...eligibleLeads.map((l) => ({
        lead: l,
        message: buildMessageFor(l),
        textStatus: "pending" as TextStatus,
        mediaStatus: (media ? "pending" : "not_requested") as MediaStatus,
      })),
      ...duplicateLeads.map((l) => ({
        lead: l,
        message: "",
        textStatus: "skipped" as TextStatus,
        mediaStatus: "not_requested" as MediaStatus,
        error: "Ignorado por telefone duplicado",
      })),
      ...invalidLeads.map((l) => ({
        lead: l,
        message: "",
        textStatus: "skipped" as TextStatus,
        mediaStatus: "not_requested" as MediaStatus,
        error: "Telefone ausente ou inválido",
      })),
    ];
    setRows(initial);

    let textsSent = 0;
    let mediasSent = 0;
    let complete = 0;
    let partial = 0;
    let failed = 0;
    const delayMs = Math.max(0, Math.round(intervalSeconds * 1000));

    for (let i = 0; i < eligibleLeads.length; i++) {
      const row = initial[i];
      setCurrentIndex(i);
      setRows((prev) =>
        prev.map((r, idx) =>
          idx === i
            ? { ...r, textStatus: "sending", mediaStatus: media ? "sending" : r.mediaStatus }
            : r
        )
      );

      let result: Awaited<ReturnType<typeof sendWhatsAppMessage>>;
      try {
        result = await sendWhatsAppMessage({
          leadId: row.lead.id,
          phone: row.lead.telefone!,
          message: row.message,
          media: media ? { url: media.signedUrl, type: media.kind, fileName: media.fileName } : null,
        });
      } catch (e: unknown) {
        result = { ok: false, error: String((e as Error)?.message ?? e) };
      }

      const textOk = result.textSent === true || (result.ok === true && result.textSent !== false);
      const mediaOk = media ? result.mediaSent === true : false;

      if (textOk) textsSent++;
      if (mediaOk) mediasSent++;
      if (textOk && (!media || mediaOk)) complete++;
      else if (textOk && media && !mediaOk) partial++;
      else failed++;

      setRows((prev) =>
        prev.map((r, idx) =>
          idx === i
            ? {
                ...r,
                textStatus: textOk ? "sent" : "failed",
                mediaStatus: media ? (mediaOk ? "sent" : "failed") : "not_requested",
                error: textOk ? undefined : result.error || "Erro no envio do texto",
                mediaError:
                  media && !mediaOk
                    ? result.mediaError || "Texto enviado, mas o anexo falhou"
                    : undefined,
              }
            : r
        )
      );

      if (i < eligibleLeads.length - 1) await sleep(delayMs);
    }

    setCurrentIndex(null);
    setSending(false);
    setDoneSummary({
      total: leads.length,
      textsSent,
      mediasSent,
      complete,
      partial,
      failed,
      skipped: invalidLeads.length + duplicateLeads.length,
      notSent: 0,
      duplicatesIgnored: duplicateLeads.length,
      elapsedMs: Date.now() - startedAt,
    });

    if (partial > 0) {
      toast.warning(`${partial} envio(s) parcial(is): texto entregue, anexo falhou.`);
    } else if (failed === 0) {
      toast.success(`${complete} mensagem(ns) enviada(s) com sucesso.`);
    } else if (complete > 0) {
      toast.warning(`${complete} enviada(s), ${failed} com erro.`);
    } else {
      toast.error(`Nenhuma mensagem enviada (${failed} erro${failed !== 1 ? "s" : ""}).`);
    }

    onDone?.();
  }

  /** Reenvia SOMENTE o anexo para um destinatário cujo texto já foi entregue. */
  async function retryMediaFor(leadId: string) {
    if (!uploaded) return;
    const row = rows.find((r) => r.lead.id === leadId);
    if (!row) return;
    setRetryingId(leadId);
    setRows((prev) => prev.map((r) => (r.lead.id === leadId ? { ...r, mediaStatus: "sending" } : r)));
    let result: Awaited<ReturnType<typeof sendWhatsAppMessage>>;
    try {
      result = await sendWhatsAppMessage({
        leadId: row.lead.id,
        phone: row.lead.telefone!,
        message: row.message,
        skipText: true,
        media: { url: uploaded.signedUrl, type: uploaded.kind, fileName: uploaded.fileName },
      });
    } catch (e: unknown) {
      result = { ok: false, error: String((e as Error)?.message ?? e) };
    }
    const ok = result.mediaSent === true;
    setRows((prev) =>
      prev.map((r) =>
        r.lead.id === leadId
          ? {
              ...r,
              mediaStatus: ok ? "sent" : "failed",
              mediaError: ok ? undefined : result.mediaError || result.error || "Anexo falhou novamente",
            }
          : r
      )
    );
    setDoneSummary((prev) =>
      prev && ok
        ? { ...prev, mediasSent: prev.mediasSent + 1, complete: prev.complete + 1, partial: Math.max(0, prev.partial - 1) }
        : prev
    );
    setRetryingId(null);
    if (ok) toast.success("Anexo reenviado.");
    else toast.error("O anexo falhou novamente.");
  }

  function handleClose(open: boolean) {
    if (sending) return;
    if (!open) {
      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
      setAttachment(null);
      setAttachmentPreview(null);
      setUploaded(null);
      setUploadState("idle");
      setUploadError(null);
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

          {/* Destinatários */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Destinatários ({leads.length})</p>
            <div className="rounded-xl border border-border/60 bg-muted/20 divide-y divide-border/40 max-h-48 overflow-y-auto">
              {leads.map((l) => (
                <div key={l.id} className="px-3 py-2 flex items-center gap-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">{l.empresa || "(sem instituição)"}</p>
                    <p className="text-muted-foreground/70 truncate">
                      {l.nome || "(sem contato)"} · {formatPhone(l.telefone)}
                    </p>
                  </div>
                  {isValidPhone(l.telefone) ? (
                    <span className="text-[10px] text-emerald-400 shrink-0">válido</span>
                  ) : (
                    <span className="text-[10px] text-yellow-400 shrink-0">inválido</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legenda de variáveis */}
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 space-y-0.5">
            <p className="text-[11px] text-muted-foreground/80">Variáveis disponíveis:</p>
            <p className="text-[11px] text-muted-foreground"><code className="text-primary">{"{{nome}}"}</code> — nome completo do contato</p>
            <p className="text-[11px] text-muted-foreground"><code className="text-primary">{"{{primeiro_nome}}"}</code> — primeiro nome do contato</p>
            <p className="text-[11px] text-muted-foreground"><code className="text-primary">{"{{instituicao}}"}</code> — nome da escola</p>
            <p className="text-[11px] text-muted-foreground"><code className="text-primary">{"{{link}}"}</code> — link informado</p>
          </div>

          {/* Saudação */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Saudação (use <code className="text-primary">{"{{primeiro_nome}}"}</code>)
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
            {unresolvedByLead.length > 0 && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 space-y-1">
                <p className="text-[11px] text-destructive">
                  Existem campos de personalização não resolvidos: {unresolvedNames.join(", ")}
                </p>
                <ul className="text-[11px] text-muted-foreground space-y-0.5 max-h-28 overflow-y-auto">
                  {unresolvedByLead.map(({ lead, missing }) => (
                    <li key={lead.id}>
                      {lead.empresa || lead.nome || "(lead sem dados)"} — falta {missing.join(", ")}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted-foreground/70">
                  Corrija o texto ou remova o placeholder para liberar o envio.
                </p>
              </div>
            )}
            {wrappedUrlWarning && (

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] text-amber-400">
                    Use <code>{"{{link}}"}</code> no texto e informe a URL no campo Link.
                  </p>
                  <button
                    type="button"
                    onClick={autoFixWrappedUrls}
                    className="mt-1 text-[11px] px-2 py-1 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                  >
                    Corrigir automaticamente
                  </button>
                </div>
              </div>
            )}
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
                  {uploadState === "uploading" && (
                    <p className="text-[11px] text-primary flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Enviando arquivo...
                    </p>
                  )}
                  {uploadState === "ready" && (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Arquivo pronto
                    </p>
                  )}
                  {uploadState === "error" && (
                    <p className="text-[11px] text-destructive">Falha no upload{uploadError ? `: ${uploadError}` : ""}</p>
                  )}
                </div>
                {uploadState === "error" && (
                  <button
                    type="button"
                    onClick={() => attachment && startUpload(attachment)}
                    className="p-1 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                    aria-label="Tentar upload novamente"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={removeAttachment}
                  disabled={sending}
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
                {rows.map((r) => {
                  const fl = finalLabel(r);
                  return (
                    <div key={r.lead.id} className="px-3 py-2 flex items-center gap-2 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate">{r.lead.empresa || "(sem instituição)"}</p>
                        <p className="text-muted-foreground/70 truncate">
                          {r.lead.nome || "(sem contato)"} · {formatPhone(r.lead.telefone)}
                        </p>
                        {r.error && (
                          <p className={r.textStatus === "skipped" ? "text-yellow-400 truncate" : "text-destructive truncate"}>
                            {r.error}
                          </p>
                        )}
                        {r.mediaStatus === "failed" && (
                          <div className="space-y-1">
                            <p className="text-amber-400 truncate">
                              Texto enviado, mas o anexo falhou{r.mediaError ? ` — ${r.mediaError}` : ""}
                            </p>
                            <button
                              type="button"
                              disabled={sending || retryingId === r.lead.id || !uploaded}
                              onClick={() => retryMediaFor(r.lead.id)}
                              className="text-[11px] px-2 py-1 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
                            >
                              {retryingId === r.lead.id ? "Reenviando..." : "Reenviar somente o anexo"}
                            </button>
                          </div>
                        )}
                      </div>
                      <span className={`shrink-0 ${fl.tone}`}>{fl.label}</span>
                      {fl.label === "Enviando" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      {fl.label === "Enviado" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      {fl.label === "Parcial" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      {fl.label === "Falhou" && <XCircle className="w-4 h-4 text-destructive" />}
                      {fl.label === "Ignorado" && <MinusCircle className="w-4 h-4 text-yellow-400" />}
                    </div>
                  );
                })}
              </div>
              {doneSummary && (
                <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                  <p>Total selecionado: <span className="text-foreground font-medium">{doneSummary.total}</span></p>
                  <p>Textos enviados: <span className="text-green-400 font-medium">{doneSummary.textsSent}</span></p>
                  <p>Anexos enviados: <span className="text-green-400 font-medium">{doneSummary.mediasSent}</span></p>
                  <p>Envios completos: <span className="text-green-400 font-medium">{doneSummary.complete}</span></p>
                  <p>Envios parciais: <span className="text-amber-400 font-medium">{doneSummary.partial}</span></p>
                  <p>Falhas totais: <span className="text-destructive font-medium">{doneSummary.failed}</span></p>
                  <p>Ignorados: <span className="text-yellow-400 font-medium">{doneSummary.skipped}</span></p>
                  <p>Duplicados ignorados: <span className="text-yellow-400 font-medium">{doneSummary.duplicatesIgnored}</span></p>
                  <p>Não enviados: <span className="text-foreground font-medium">{doneSummary.notSent}</span></p>
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
            disabled={
              sending ||
              eligibleLeads.length === 0 ||
              !!doneSummary ||
              wrappedUrlWarning ||
              unresolvedByLead.length > 0 ||

              (!!attachment && uploadState !== "ready")
            }
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
