import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  EDU,
  TEMPLATE_LABELS,
  WHATSAPP_URL,
  type EmailData,
  type TemplateType,
  defaultsFor,
  renderEmail,
  renderPlainText,
} from "@/lib/email-templates";
import {
  isEmailStorageUrl,
  isUnsafeImageUrl,
  prepareEmailForExport,
  uploadFromUrl,
  uploadImage,
  type PreparedEmail,
} from "@/lib/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import GmailDraftActions from "@/components/GmailDraftActions";
import classroomImg from "@/assets/edu-classroom.jpg";
import receptionImg from "@/assets/edu-reception.jpg";
import techImg from "@/assets/edu-tech.jpg";
import convivenciaImg from "@/assets/edu-convivencia.jpg";

const DEFAULT_HERO = convivenciaImg;

const EDU_LIBRARY: { category: string; items: { label: string; url: string }[] }[] = [
  { category: "Área de convivência", items: [{ label: "Espaço de convivência", url: convivenciaImg }] },
  { category: "Sala Maker", items: [{ label: "Sala maker (placeholder)", url: classroomImg }] },
  { category: "Biblioteca", items: [{ label: "Biblioteca (placeholder)", url: classroomImg }] },
  { category: "Espaço multiuso", items: [{ label: "Multiuso (placeholder)", url: convivenciaImg }] },
  { category: "Tecnologia educacional", items: [{ label: "Sala tecnológica", url: techImg }] },
  { category: "Recepção", items: [{ label: "Recepção acolhedora", url: receptionImg }] },
  { category: "Sala de regulação", items: [{ label: "Regulação (placeholder)", url: receptionImg }] },
];

const HERO_PRESETS = EDU_LIBRARY.flatMap((c) => c.items);

type LeadPrefill = {
  nomeContato?: string;
  nomeEscola?: string;
  email?: string;
};

function makeInitial(t: TemplateType, prefill?: LeadPrefill): EmailData {
  const d = defaultsFor(t);
  return {
    template: t,
    tratamento: "Diretora",
    artigo: "a",
    nomeContato: prefill?.nomeContato || "",
    nomeEscola: prefill?.nomeEscola || "",
    title: d.title ?? "",
    subtitle: d.subtitle ?? "",
    body: d.body ?? "",
    cta: d.cta ?? "Planejar melhorias agora",
    ctaUrl: WHATSAPP_URL,
    heroImage: DEFAULT_HERO,
    cards: d.cards ?? [],
    contato: "(11) 93278-9123",
    site: "www.eduinfo.com.br",
  };
}

export default function EmailStudioPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefill = (location.state as { leadPrefill?: LeadPrefill } | null)?.leadPrefill;

  const [data, setData] = useState<EmailData>(() => makeInitial("campanha", prefill));
  const [preparingAction, setPreparingAction] = useState<
    "preview" | "download" | "copy" | "manual" | null
  >(null);

  const html = useMemo(() => renderEmail(data), [data]);
  const text = useMemo(() => renderPlainText(data), [data]);

  function changeTemplate(t: TemplateType) {
    const d = defaultsFor(t);
    setData((prev) => ({
      ...prev,
      template: t,
      title: d.title ?? prev.title,
      subtitle: d.subtitle ?? prev.subtitle,
      body: d.body ?? prev.body,
      cta: d.cta ?? prev.cta,
      cards: d.cards ?? prev.cards,
    }));
  }

  function patch<K extends keyof EmailData>(k: K, v: EmailData[K]) {
    setData((p) => ({ ...p, [k]: v }));
  }

  function patchCard(i: number, key: "title" | "text" | "image", v: string) {
    setData((p) => {
      const cards = [...p.cards];
      cards[i] = { ...cards[i], [key]: v };
      return { ...p, cards };
    });
  }

  const validation = useMemo(() => {
    const imgs = [
      { label: "Hero", url: data.heroImage },
      ...data.cards.map((c, i) => ({ label: `Bloco ${i + 1}`, url: c.image ?? "" })),
    ].filter((i) => i.url);
    const unsafe = imgs.filter((i) => isUnsafeImageUrl(i.url));
    const sizeKB = +(new Blob([html]).size / 1024).toFixed(1);
    const hasBase64 = /data:image|;base64,/i.test(html);
    const hasBlob = /\bblob:/i.test(html);
    const hasLocalhost = /localhost|127\.0\.0\.1/i.test(html);
    const hasSrcAssets = /\/src\/assets/i.test(html);
    const storageUrls = imgs.filter((i) => isEmailStorageUrl(i.url));
    const needsStorage = imgs.filter((i) => !isEmailStorageUrl(i.url));
    return {
      imgs,
      unsafe,
      needsStorage,
      sizeKB,
      hasBase64,
      hasBlob,
      hasLocalhost,
      hasSrcAssets,
      storageUrls,
      ok:
        needsStorage.length === 0 &&
        unsafe.length === 0 &&
        !hasBase64 &&
        !hasBlob &&
        !hasLocalhost &&
        !hasSrcAssets,
    };
  }, [data.heroImage, data.cards, html]);

  function applyPreparedReplacements(prepared: PreparedEmail) {
    if (prepared.replacements.length === 0) return;
    const replacementMap = new Map(prepared.replacements.map((r) => [r.src, r.public_url]));
    setData((prev) => ({
      ...prev,
      heroImage: replacementMap.get(prev.heroImage) ?? prev.heroImage,
      cards: prev.cards.map((card) => ({
        ...card,
        image: card.image ? replacementMap.get(card.image) ?? card.image : card.image,
      })),
    }));
  }

  async function prepareForExport(action: "preview" | "download" | "copy" | "manual") {
    setPreparingAction(action);
    try {
      const prepared = await prepareEmailForExport(html, `${data.template}-${data.nomeEscola || "eduinfo"}`);
      applyPreparedReplacements(prepared);
      if (prepared.uploaded_count > 0) {
        toast({
          title: `${prepared.uploaded_count} imagem(ns) enviada(s) para Storage`,
          description: "HTML atualizado com URL assinada pronta para Gmail.",
        });
      }
      return prepared.html;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Falha ao preparar imagens", description: msg, variant: "destructive" });
      return null;
    } finally {
      setPreparingAction(null);
    }
  }

  async function copyText(payload: string, label: string, guarded = false) {
    let finalPayload = payload;
    if (guarded) {
      const preparedHtml = await prepareForExport("copy");
      if (!preparedHtml) return;
      finalPayload = preparedHtml;
    }
    try {
      await navigator.clipboard.writeText(finalPayload);
      toast({ title: `${label} copiado com sucesso` });
    } catch {
      toast({ title: `Não foi possível copiar ${label.toLowerCase()}`, variant: "destructive" });
    }
  }

  async function openPreview() {
    const preparedHtml = await prepareForExport("preview");
    if (!preparedHtml) return;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (w) {
      w.document.write(preparedHtml);
      w.document.close();
    } else {
      toast({ title: "Permita pop-ups para abrir o preview", variant: "destructive" });
    }
  }

  async function downloadHtml() {
    const preparedHtml = await prepareForExport("download");
    if (!preparedHtml) return;
    const blob = new Blob([preparedHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eduinfo-${data.template}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Arquivo HTML baixado" });
  }

  async function copyPlainText() {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Texto puro copiado com sucesso" });
    } catch {
      toast({ title: "Não foi possível copiar texto puro", variant: "destructive" });
    }
  }

  const isPreparing = preparingAction !== null;

  function exportButtonText(action: "preview" | "download" | "copy", label: string) {
    return preparingAction === action ? "Preparando..." : label;
  }

  function actionButtonDisabled(action: "preview" | "download" | "copy") {
    return isPreparing && preparingAction !== action;
  }

  function sendImagesToStorage() {
    void prepareForExport("manual");
  }

  function storageStatusUrl() {
    return validation.storageUrls[0]?.url ?? "";
  }

  function manualStorageButton() {
    if (validation.needsStorage.length === 0) return null;
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full"
        disabled={isPreparing}
        onClick={sendImagesToStorage}
      >
        {preparingAction === "manual" ? "Enviando..." : "Enviar imagem para Storage"}
      </Button>
    );
  }

  function ActionButtons() {
    return (
      <>
        <Button variant="outline" size="sm" disabled={actionButtonDisabled("preview")} onClick={openPreview}>
          {exportButtonText("preview", "Abrir preview")}
        </Button>
        <Button variant="outline" size="sm" disabled={actionButtonDisabled("download")} onClick={downloadHtml}>
          {exportButtonText("download", "Baixar HTML")}
        </Button>
        <Button variant="outline" size="sm" disabled={isPreparing} onClick={copyPlainText}>
          Copiar texto puro
        </Button>
        <Button
          size="sm"
          disabled={actionButtonDisabled("copy")}
          onClick={() => copyText(html, "HTML", true)}
          style={{ backgroundColor: EDU.graphite }}
          className="text-white hover:opacity-90"
        >
          {exportButtonText("copy", "Copiar HTML")}
        </Button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--edu-light)]">
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#333333] hover:bg-[var(--edu-light)]"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight text-[#333333]">
                eduinfo <span className="font-normal text-[#6B7280]">Email Studio</span>
              </div>
              <div className="text-[10px] uppercase tracking-[1.4px] text-[#6B7280]">
                Templates · Gmail-safe
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButtons />
          </div>
        </div>
        {prefill && (
          <div className="mx-auto max-w-[1400px] px-6 pb-3 text-xs text-[#6B7280]">
            Pré-preenchido a partir do lead: <strong className="text-[#333333]">{prefill.nomeContato || "—"}</strong>
            {prefill.nomeEscola ? ` · ${prefill.nomeEscola}` : ""}
            {prefill.email ? ` · ${prefill.email}` : ""}
          </div>
        )}
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-6 px-6 py-6 lg:grid-cols-[420px_1fr]">
        <aside className="space-y-4">
          <Section title="Tipo de template" hint="Cada opção muda a estrutura visual do e-mail.">
            <Select value={data.template} onValueChange={(v) => changeTemplate(v as TemplateType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TEMPLATE_LABELS) as TemplateType[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {TEMPLATE_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Section title="Personalização de saudação" hint="Sem 'Prezado/Cara'. Usa tratamento + nome.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tratamento / Cargo">
                <Input
                  placeholder="Diretora, Mantenedora, Professor…"
                  value={data.tratamento}
                  onChange={(e) => patch("tratamento", e.target.value)}
                />
              </Field>
              <Field label="Artigo / referência">
                <Select
                  value={data.artigo || "none"}
                  onValueChange={(v) => patch("artigo", v === "none" ? "" : (v as "a" | "o"))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">a (diretora / da escola)</SelectItem>
                    <SelectItem value="o">o (diretor / do colégio)</SelectItem>
                    <SelectItem value="none">sem artigo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Nome do contato">
              <Input value={data.nomeContato} onChange={(e) => patch("nomeContato", e.target.value)} />
            </Field>
            <Field label="Nome da escola">
              <Input value={data.nomeEscola} onChange={(e) => patch("nomeEscola", e.target.value)} />
            </Field>
            <div className="rounded-md bg-[var(--edu-light)] px-3 py-2 text-xs text-muted-foreground">
              Saudação gerada:{" "}
              <strong className="text-foreground">
                {data.tratamento && data.nomeContato
                  ? `${data.tratamento}, ${data.nomeContato},`
                  : data.nomeContato
                  ? `Olá, ${data.nomeContato},`
                  : data.tratamento
                  ? `${data.tratamento},`
                  : "—"}
              </strong>
            </div>
          </Section>

          <Section title="Conteúdo principal">
            <Field label="Título principal (35px, bold)">
              <Textarea rows={2} value={data.title} onChange={(e) => patch("title", e.target.value)} />
            </Field>
            <Field label="Subtítulo (25px, seminegrito)">
              <Textarea rows={2} value={data.subtitle} onChange={(e) => patch("subtitle", e.target.value)} />
            </Field>
            <Field label="Texto de apoio">
              <Textarea rows={4} value={data.body} onChange={(e) => patch("body", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CTA (texto)">
                <Input value={data.cta} onChange={(e) => patch("cta", e.target.value)} />
              </Field>
              <Field label="Link do CTA (WhatsApp)">
                <Input value={data.ctaUrl} onChange={(e) => patch("ctaUrl", e.target.value)} />
              </Field>
            </div>
            <button
              type="button"
              onClick={() => patch("ctaUrl", WHATSAPP_URL)}
              className="text-[11px] font-medium text-[var(--edu-coral)] hover:underline"
            >
              ↻ Restaurar link padrão (WhatsApp Anderson Rufino)
            </button>
          </Section>

          <ValidationPanel validation={validation} storageUrl={storageStatusUrl()}>
            {manualStorageButton()}
          </ValidationPanel>

          <GmailDraftActions
            subject={data.title || `Eduinfo · ${TEMPLATE_LABELS[data.template]}`}
            htmlBody={html}
            plainTextBody={text}
            templateType={data.template}
            prepareHtml={async () => {
              const preparedHtml = await prepareForExport("copy");
              if (!preparedHtml) return null;
              return { html: preparedHtml, text };
            }}
          />

          <Section title="Imagem principal (hero)" hint="Foto principal exibida no topo do e-mail.">
            <ImagePicker
              value={data.heroImage}
              defaultValue={DEFAULT_HERO}
              presets={HERO_PRESETS}
              onChange={(url) => patch("heroImage", url)}
            />
          </Section>

          {data.cards.length > 0 && (
            <Section title={`Blocos / Ambientes (${data.cards.length})`} hint="Cada bloco pode ter texto e imagem própria.">
              {data.cards.map((c, i) => (
                <div key={i} className="space-y-2 rounded-md border bg-white p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--edu-coral)]">
                    Bloco {String(i + 1).padStart(2, "0")}
                  </div>
                  <Input
                    value={c.title}
                    onChange={(e) => patchCard(i, "title", e.target.value)}
                    placeholder="Título do bloco"
                  />
                  <Textarea
                    rows={2}
                    value={c.text}
                    onChange={(e) => patchCard(i, "text", e.target.value)}
                    placeholder="Texto do bloco"
                  />
                  <div className="pt-1">
                    <Label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Imagem do bloco (opcional)
                    </Label>
                    <ImagePicker
                      compact
                      value={c.image ?? ""}
                      defaultValue=""
                      presets={HERO_PRESETS}
                      onChange={(url) => patchCard(i, "image", url)}
                    />
                  </div>
                </div>
              ))}
            </Section>
          )}

          <Section title="Imagens Eduinfo" hint="Biblioteca visual por categoria.">
            <div className="space-y-3">
              {EDU_LIBRARY.map((cat) => (
                <div key={cat.category}>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat.category}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {cat.items.map((it) => (
                      <button
                        key={it.label}
                        type="button"
                        title={it.label}
                        onClick={() => patch("heroImage", it.url)}
                        className="overflow-hidden rounded border border-transparent hover:border-[var(--edu-coral)]"
                      >
                        <img src={it.url} alt={it.label} className="h-12 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Rodapé / Contato">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone">
                <Input value={data.contato} onChange={(e) => patch("contato", e.target.value)} />
              </Field>
              <Field label="Site">
                <Input value={data.site} onChange={(e) => patch("site", e.target.value)} />
              </Field>
            </div>
          </Section>
        </aside>

        <section className="min-w-0">
          <Tabs defaultValue="preview" className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="html">Código HTML</TabsTrigger>
                <TabsTrigger value="text">Texto puro</TabsTrigger>
              </TabsList>
              <div className="flex flex-wrap gap-2">
                <ActionButtons />
              </div>
            </div>

            <TabsContent value="preview">
              <div className="rounded-xl border bg-white p-4">
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Largura fixa de 600px · Gmail-safe</span>
                  <span className="rounded-full bg-[var(--edu-light)] px-3 py-1 font-medium text-foreground">
                    {TEMPLATE_LABELS[data.template]}
                  </span>
                </div>
                <PreviewFrame html={html} />
              </div>
            </TabsContent>

            <TabsContent value="html">
              <div className="rounded-xl border bg-[#0f1115] p-4">
                <pre className="max-h-[78vh] overflow-auto text-xs leading-relaxed text-emerald-200">
                  {html}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="text">
              <div className="rounded-xl border bg-white p-4">
                <pre className="max-h-[78vh] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {text}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ImagePicker({
  value,
  defaultValue,
  presets,
  onChange,
  compact = false,
}: {
  value: string;
  defaultValue: string;
  presets: { label: string; url: string }[];
  onChange: (url: string) => void;
  compact?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const unsafe = isUnsafeImageUrl(value);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande (máx 5MB).", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const publicUrl = await uploadImage(f, f.name.replace(/\.[^.]+$/, ""));
      onChange(publicUrl);
      toast({ title: "Imagem enviada para o Storage", description: "URL pronta para uso no Gmail." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Falha ao enviar imagem", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function promoteToStorage() {
    if (!value) return;
    setUploading(true);
    try {
      const publicUrl = await uploadFromUrl(value, "preset");
      onChange(publicUrl);
      toast({ title: "Imagem enviada para o Storage" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Falha ao enviar para o Storage", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function pickPreset(url: string) {
    if (!url) {
      onChange("");
      return;
    }
    if (isUnsafeImageUrl(url)) {
      setUploading(true);
      try {
        const publicUrl = await uploadFromUrl(url, "preset");
        onChange(publicUrl);
        toast({ title: "Preset enviado para o Storage" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast({ title: "Falha ao enviar preset", description: msg, variant: "destructive" });
      } finally {
        setUploading(false);
      }
    } else {
      onChange(url);
    }
  }

  return (
    <div className="space-y-2">
      <div className={`overflow-hidden rounded-md border bg-[var(--edu-light)] ${compact ? "h-20" : "h-32"}`}>
        {value ? (
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">
            Sem imagem
          </div>
        )}
      </div>

      {unsafe && value && (
        <div className="space-y-1.5 rounded-md border border-[var(--edu-coral)] bg-[#FFEEF0] px-2 py-1.5 text-[10px] leading-snug text-[var(--edu-graphite)]">
          <div>
            <strong>Imagem local detectada.</strong> O app tentará enviar automaticamente para o Storage antes de exportar para o Gmail.
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 w-full text-[11px]"
            disabled={uploading}
            onClick={promoteToStorage}
          >
            {uploading ? "Enviando…" : "↑ Enviar esta imagem para o Storage"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-1.5">
        {presets.slice(0, 8).map((p) => (
          <button
            key={p.url + p.label}
            type="button"
            onClick={() => pickPreset(p.url)}
            disabled={uploading}
            title={p.label}
            className={`overflow-hidden rounded border-2 transition ${
              value === p.url ? "border-[var(--edu-coral)]" : "border-transparent hover:border-muted-foreground/40"
            }`}
          >
            <img src={p.url} alt={p.label} className="h-10 w-full object-cover" />
          </button>
        ))}
      </div>

      <Input
        placeholder="Cole uma URL pública https://…"
        value={isUnsafeImageUrl(value) ? "" : value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Enviando…" : "⬆ Upload"}
        </Button>
        {value && (
          <Button type="button" size="sm" variant="outline" onClick={() => onChange("")}>
            ✕ Remover
          </Button>
        )}
        {defaultValue !== undefined && value !== defaultValue && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={uploading}
            onClick={() => pickPreset(defaultValue)}
          >
            ↻ Restaurar padrão
          </Button>
        )}
      </div>
    </div>
  );
}

type Validation = {
  imgs: { label: string; url: string }[];
  unsafe: { label: string; url: string }[];
  needsStorage: { label: string; url: string }[];
  sizeKB: number;
  hasBase64: boolean;
  hasBlob: boolean;
  hasLocalhost: boolean;
  hasSrcAssets: boolean;
  storageUrls: { label: string; url: string }[];
  ok: boolean;
};

function ValidationPanel({
  validation: v,
  storageUrl,
  children,
}: {
  validation: Validation;
  storageUrl: string;
  children?: React.ReactNode;
}) {
  const sizeOk = v.sizeKB < 90;
  const hasLocalImage =
    v.needsStorage.length > 0 || v.unsafe.length > 0 || v.hasBase64 || v.hasBlob || v.hasLocalhost || v.hasSrcAssets;
  return (
    <div
      className={`space-y-2 rounded-xl border p-3 text-[12px] ${
        v.ok ? "border-[var(--edu-green)] bg-[#EAFBEC]" : "border-[var(--edu-coral)] bg-[#FFEEF0]"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Validação Gmail-safe</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            v.ok ? "bg-[var(--edu-green)] text-white" : "bg-[var(--edu-coral)] text-white"
          }`}
        >
          {v.ok ? "Gmail-safe" : "Ação necessária"}
        </span>
      </div>
      <div className="space-y-1 rounded-md bg-white/60 p-2 text-[11px] text-[var(--edu-graphite)]">
        <div>
          <strong>Status:</strong> {hasLocalImage ? "Imagem local detectada" : "Imagem pública pronta para Gmail"}
        </div>
        {hasLocalImage ? (
          <div>
            <strong>Ação disponível:</strong> Enviar imagem para Storage
          </div>
        ) : storageUrl ? (
          <div className="break-all">
            <strong>URL:</strong> {storageUrl.replace(/^https?:\/\//, "")}
          </div>
        ) : null}
      </div>
      <ul className="grid grid-cols-2 gap-1">
        <Check ok={!v.hasBase64} label="Sem base64" />
        <Check ok={!v.hasBlob} label="Sem blob:" />
        <Check ok={!v.hasLocalhost} label="Sem localhost" />
        <Check ok={!v.hasSrcAssets} label="Sem /src/assets" />
        <Check
          ok={v.needsStorage.length === 0}
          label={`Storage (${v.imgs.length - v.needsStorage.length}/${v.imgs.length})`}
        />
        <Check ok={sizeOk} warnOnly={!sizeOk} label={`HTML ${v.sizeKB} KB`} />
      </ul>
      {v.needsStorage.length > 0 && (
        <div className="rounded-md bg-white/60 p-2 text-[11px] text-[var(--edu-graphite)]">
          Imagens que precisam de Storage: <strong>{v.needsStorage.map((i) => i.label).join(", ")}</strong>.
        </div>
      )}
      {children}
    </div>
  );
}

function Check({ ok, label, warnOnly = false }: { ok: boolean; label: string; warnOnly?: boolean }) {
  const color = ok
    ? "text-[var(--edu-green)]"
    : warnOnly
    ? "text-[var(--edu-yellow)]"
    : "text-[var(--edu-coral)]";
  return (
    <li className={`flex items-center gap-1.5 rounded bg-white/60 px-2 py-1 ${color}`}>
      <span className="font-bold">{ok ? "✓" : warnOnly ? "!" : "✕"}</span>
      <span className="text-[var(--edu-graphite)]">{label}</span>
    </li>
  );
}

function PreviewFrame({ html }: { html: string }) {
  const [height, setHeight] = useState(800);
  useEffect(() => {
    setHeight(800);
  }, [html]);

  return (
    <div className="overflow-hidden rounded-lg border bg-[var(--edu-light)]">
      <iframe
        title="Email preview"
        srcDoc={html}
        className="block w-full"
        style={{ height, border: 0 }}
        onLoad={(e) => {
          const f = e.currentTarget;
          try {
            const h = f.contentDocument?.documentElement?.scrollHeight;
            if (h && Math.abs(h - height) > 4) setHeight(h + 24);
          } catch {
            /* ignore cross-origin issues */
          }
        }}
      />
    </div>
  );
}
