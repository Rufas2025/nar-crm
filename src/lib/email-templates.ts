// Email Studio — brand-aware, responsive, Gmail-safe generators.
// Tables + inline CSS, max-width 600px. Media queries scoped in <style> in <head>.

import { BRANDS, getBrand, type BrandConfig, type BrandId } from "./brands";

// Legacy Eduinfo palette kept for existing imports (EmailStudioPage still references EDU.*).
export const EDU = BRANDS.eduinfo.palette;

export const FONT = `'Poppins', Arial, Helvetica, sans-serif`;

// Legacy default WhatsApp URL for backward compatibility with existing callers.
export const WHATSAPP_URL = BRANDS.eduinfo.whatsappUrl;

// New template categories (5) + legacy aliases kept so old data still renders.
export type TemplateType =
  | "campanha"
  | "consultivo"
  | "solucao"
  | "projeto"
  | "convite"
  // legacy aliases (kept out of the UI dropdown, still handled by render):
  | "newsletter"
  | "frentes"
  | "tecnologia"
  | "reforma";

export interface Card {
  title: string;
  text: string;
  image?: string;
}

export interface EmailData {
  template: TemplateType;
  brand?: BrandId;
  tratamento: string;
  artigo: "a" | "o" | "";
  nomeContato: string;
  nomeEscola: string;
  title: string;
  subtitle: string;
  body: string;
  cta: string;
  ctaUrl: string;
  heroImage: string;
  cards: Card[];
  contato: string;
  site: string;
  // optional context fields
  cidade?: string;
  momento?: string;
  objetivo?: string;
  relacionamento?: string;
  tomVoz?: string;
  observacoes?: string;
}

export const TEMPLATE_LABELS: Record<TemplateType, string> = {
  campanha: "Campanha de Impacto",
  consultivo: "Conteúdo Consultivo",
  solucao: "Solução por Frente",
  projeto: "Antes e Depois / Projeto",
  convite: "Convite para Conversa",
  // legacy aliases:
  newsletter: "Newsletter (legado)",
  frentes: "5 Frentes (legado)",
  tecnologia: "Tecnologia (legado)",
  reforma: "Reforma (legado)",
};

// Visible in the picker; legacy aliases hidden.
export const TEMPLATE_ORDER: TemplateType[] = [
  "campanha",
  "consultivo",
  "solucao",
  "projeto",
  "convite",
];

function normalizeTemplate(t: TemplateType): TemplateType {
  switch (t) {
    case "frentes":
    case "tecnologia":
      return "solucao";
    case "reforma":
      return "projeto";
    case "newsletter":
      return "consultivo";
    default:
      return t;
  }
}

export function defaultsFor(t: TemplateType, brandId: BrandId = "eduinfo"): Partial<EmailData> {
  const brand = getBrand(brandId);
  const norm = normalizeTemplate(t);
  const o = brand.templateOverrides[norm] ?? {};
  return {
    title: o.title,
    subtitle: o.subtitle,
    body: o.body,
    cta: o.cta ?? brand.defaultCTAs[0],
    cards: o.cards ?? defaultCardsFor(norm),
  };
}

function defaultCardsFor(t: TemplateType): Card[] {
  switch (t) {
    case "campanha":
      return [
        { title: "Frente 01", text: "Descrição breve da primeira frente." },
        { title: "Frente 02", text: "Descrição breve da segunda frente." },
        { title: "Frente 03", text: "Descrição breve da terceira frente." },
      ];
    case "solucao":
      return [
        { title: "Módulo 01", text: "Descrição." },
        { title: "Módulo 02", text: "Descrição." },
        { title: "Módulo 03", text: "Descrição." },
      ];
    case "projeto":
      return [
        { title: "Antes", text: "Situação anterior à intervenção." },
        { title: "Depois", text: "Resultado após a intervenção." },
      ];
    default:
      return [];
  }
}

// ---------- helpers ----------
function esc(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildGreeting(d: EmailData): string {
  const nome = d.nomeContato?.trim();
  const trat = d.tratamento?.trim();
  if (!nome && !trat) return "";
  if (trat && nome) return `${trat}, ${nome},`;
  if (nome) return `Olá, ${nome},`;
  return `${trat},`;
}

// ---------- responsive shell ----------

function responsiveStyle(brand: BrandConfig): string {
  const p = brand.palette;
  return `
  <style>
    /* Base — desktop */
    .eml-h1{font-size:32px;line-height:1.15;font-weight:800;letter-spacing:-.4px;margin:0;}
    .eml-h2{font-size:18px;line-height:1.35;font-weight:500;margin:0;}
    .eml-body{font-size:15px;line-height:1.7;font-weight:400;}
    .eml-cta{font-size:15px;font-weight:600;}
    .eml-container{width:100%;max-width:600px;}
    .eml-pad{padding:32px;}
    .eml-pad-x{padding-left:32px;padding-right:32px;}
    .eml-card{padding:20px;}
    .eml-img{display:block;width:100%;height:auto;border:0;}
    a{color:${p.primary};}
    /* Mobile */
    @media only screen and (max-width:600px){
      .eml-h1{font-size:28px !important;line-height:1.18 !important;}
      .eml-h2{font-size:16px !important;}
      .eml-body{font-size:15px !important;line-height:1.65 !important;}
      .eml-cta{font-size:15px !important;padding:14px 22px !important;}
      .eml-pad{padding:24px 20px !important;}
      .eml-pad-x{padding-left:20px !important;padding-right:20px !important;}
      .eml-card{padding:18px !important;}
      .eml-stack{display:block !important;width:100% !important;padding:6px 0 !important;}
      .eml-stack-cell{display:block !important;width:100% !important;}
      .eml-hide-mobile{display:none !important;}
      .eml-container{width:100% !important;}
    }
  </style>`;
}

function shell(inner: string, d: EmailData, brand: BrandConfig): string {
  const p = brand.palette;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>${esc(d.title)}</title>
${responsiveStyle(brand)}
</head>
<body style="margin:0;padding:0;background:${p.light};font-family:${FONT};color:${p.graphite};-webkit-text-size-adjust:100%;">
<center style="width:100%;background:${p.light};padding:24px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="eml-container" style="max-width:600px;width:100%;background:${p.white};border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.05);">
${headerBar(brand)}
${inner}
${footerBlock(d, brand)}
</table>
</center></body></html>`;
}

function headerBar(brand: BrandConfig): string {
  const p = brand.palette;
  return `<tr><td style="padding:22px 28px;background:${p.white};border-bottom:1px solid ${p.light};" class="eml-pad-x">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="left" style="font-family:${FONT};font-weight:700;font-size:18px;color:${p.graphite};letter-spacing:.2px;">
        ${esc(brand.logoText)}
      </td>
      <td align="right" class="eml-hide-mobile" style="font-family:${FONT};font-size:10px;text-transform:uppercase;letter-spacing:1.4px;color:${p.graphite};opacity:.55;">
        ${esc(brand.tagline)}
      </td>
    </tr></table>
  </td></tr>`;
}

function footerBlock(d: EmailData, brand: BrandConfig): string {
  const p = brand.palette;
  return `<tr><td class="eml-pad" style="background:${p.white};padding:26px 28px;border-top:1px solid ${p.light};font-family:${FONT};color:${p.graphite};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="font-weight:700;font-size:18px;letter-spacing:.2px;color:${p.graphite};">${esc(brand.logoText)}</td>
      <td align="right" style="font-size:12px;font-weight:500;line-height:1.55;color:${p.graphite};">
        Anderson Rufino &nbsp;·&nbsp; ${esc(d.contato)}<br/>
        <a href="https://${esc(d.site)}" style="color:${p.graphite};text-decoration:underline;">${esc(d.site)}</a>
      </td>
    </tr></table>
    <div style="margin-top:12px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:${p.graphite};opacity:.55;">
      ${esc(brand.tagline)}
    </div>
  </td></tr>`;
}

function greetingRow(d: EmailData, brand: BrandConfig): string {
  const g = buildGreeting(d);
  if (!g) return "";
  return `<tr><td class="eml-pad-x" style="padding:22px 32px 0;font-family:${FONT};font-size:15px;font-weight:500;color:${brand.palette.graphite};">${esc(g)}</td></tr>`;
}

function ctaButton(d: EmailData, brand: BrandConfig, color?: string): string {
  if (!d.cta) return "";
  const bg = color ?? brand.palette.primary;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0;">
    <tr><td style="border-radius:999px;background:${bg};">
      <a href="${esc(d.ctaUrl || "#")}" target="_blank" rel="noopener noreferrer" class="eml-cta" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-weight:600;font-size:15px;color:${brand.palette.white};text-decoration:none;letter-spacing:.2px;">
        ${esc(d.cta)} →
      </a>
    </td></tr>
  </table>`;
}

function microLabel(text: string, color: string): string {
  return `<div style="display:inline-block;padding:6px 12px;border-radius:999px;background:${color}22;color:${color};font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${esc(text)}</div>`;
}

// ---------- TEMPLATES ----------

function tplCampanha(d: EmailData, brand: BrandConfig): string {
  const p = brand.palette;
  const items = d.cards.slice(0, 3);
  while (items.length < 3) items.push({ title: "", text: "" });

  const cardCell = (c: Card, i: number) => {
    const colors = [p.primary, p.secondary, p.accent];
    const color = colors[i] ?? p.primary;
    const imgBlock = c.image
      ? `<tr><td style="padding:0;"><img src="${esc(c.image)}" alt="${esc(c.title)}" class="eml-img" style="display:block;width:100%;height:120px;object-fit:cover;border-top-left-radius:14px;border-top-right-radius:14px;border:0;"/></td></tr>`
      : "";
    return `<td valign="top" width="33.33%" class="eml-stack" style="width:33.33%;padding:0 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${color};border-radius:14px;overflow:hidden;">
        ${imgBlock}
        <tr><td valign="top" class="eml-card" style="padding:20px;color:${p.white};font-family:${FONT};">
          <div style="font-size:10px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;opacity:.85;">Frente 0${i + 1}</div>
          <div style="font-size:17px;font-weight:700;margin-top:8px;line-height:1.25;letter-spacing:-.2px;">${esc(c.title)}</div>
          <div style="height:2px;width:28px;background:${p.white};opacity:.6;margin:10px 0 10px;"></div>
          <div style="font-size:13px;font-weight:400;line-height:1.6;opacity:.96;">${esc(c.text)}</div>
        </td></tr>
      </table>
    </td>`;
  };

  const cards = items.map((c, i) => cardCell(c, i)).join("");

  const inner = `
  <tr><td style="padding:0;background:linear-gradient(135deg,${p.primary} 0%, ${p.secondary} 100%);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="eml-pad" style="padding:56px 36px 48px;text-align:center;color:${p.white};font-family:${FONT};">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:700;opacity:.9;">${esc(brand.name)} · Campanha</div>
      <h1 class="eml-h1" style="margin:18px 0 14px;font-size:34px;line-height:1.12;font-weight:800;letter-spacing:-.5px;color:${p.white};">${esc(d.title)}</h1>
      <p class="eml-h2" style="margin:0 auto;max-width:480px;font-size:17px;font-weight:400;line-height:1.55;opacity:.95;color:${p.white};">${esc(d.subtitle)}</p>
    </td></tr></table>
  </td></tr>
  ${greetingRow(d, brand)}
  <tr><td class="eml-pad-x" style="padding:22px 32px 6px;font-family:${FONT};" ><p class="eml-body" style="margin:0;font-size:15px;line-height:1.7;color:${p.graphite};">${esc(d.body)}</p></td></tr>
  ${d.heroImage ? `<tr><td class="eml-pad-x" style="padding:16px 32px 6px;"><img src="${esc(d.heroImage)}" alt="${esc(d.nomeEscola || brand.name)}" class="eml-img" style="width:100%;display:block;border-radius:14px;border:0;"/></td></tr>` : ""}
  <tr><td class="eml-pad-x" style="padding:22px 32px 6px;font-family:${FONT};">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${p.primary};">Frentes ${esc(brand.name)}</div>
    <div style="margin-top:6px;font-size:17px;font-weight:600;color:${p.graphite};line-height:1.3;">O que costuma transformar a percepção</div>
  </td></tr>
  <tr><td class="eml-pad-x" style="padding:14px 26px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;"><tr>${cards}</tr></table>
  </td></tr>
  <tr><td align="center" class="eml-pad" style="padding:26px 32px 36px;">${ctaButton(d, brand)}</td></tr>`;
  return shell(inner, d, brand);
}

function tplConsultivo(d: EmailData, brand: BrandConfig): string {
  const p = brand.palette;
  const inner = `
  ${d.heroImage ? `<tr><td style="padding:0;"><img src="${esc(d.heroImage)}" alt="${esc(d.nomeEscola || brand.name)}" class="eml-img" style="width:100%;display:block;border:0;"/></td></tr>` : `<tr><td style="height:6px;background:${p.secondary};"></td></tr>`}
  <tr><td class="eml-pad" style="padding:32px 32px 8px;font-family:${FONT};">
    ${microLabel("Conteúdo Consultivo", p.secondary)}
    <h1 class="eml-h1" style="margin:16px 0 8px;font-size:32px;font-weight:700;line-height:1.18;color:${p.graphite};letter-spacing:-.4px;">${esc(d.title)}</h1>
    <h2 class="eml-h2" style="margin:0 0 12px;font-size:17px;font-weight:500;line-height:1.4;color:${p.graphite};opacity:.7;">${esc(d.subtitle)}</h2>
  </td></tr>
  ${greetingRow(d, brand)}
  <tr><td class="eml-pad-x" style="padding:14px 32px;font-family:${FONT};"><p class="eml-body" style="margin:0;font-size:15px;font-weight:400;line-height:1.75;color:${p.graphite};">${esc(d.body)}</p></td></tr>
  <tr><td class="eml-pad-x" style="padding:12px 32px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${p.light};border-left:4px solid ${p.primary};border-radius:8px;">
      <tr><td class="eml-card" style="padding:20px 22px;font-family:${FONT};font-size:14px;line-height:1.65;color:${p.graphite};">
        <strong style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:${p.primary};margin-bottom:8px;">Insight</strong>
        Boas decisões começam por uma leitura honesta do que já está funcionando e do que ainda não.
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="left" class="eml-pad" style="padding:8px 32px 36px;">${ctaButton(d, brand, p.secondary)}</td></tr>`;
  return shell(inner, d, brand);
}

function tplSolucao(d: EmailData, brand: BrandConfig): string {
  const p = brand.palette;
  const colors = [p.primary, p.secondary, p.accent, p.primary, p.secondary];
  const cards = d.cards
    .map((c, i) => {
      const color = colors[i % colors.length];
      return `<tr><td class="eml-pad-x" style="padding:8px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${p.white};border:1px solid ${p.light};border-radius:12px;">
          <tr>
            <td valign="top" width="60" class="eml-stack-cell" style="padding:20px 0 20px 20px;">
              <div style="width:44px;height:44px;border-radius:10px;background:${color};color:${p.white};font-family:${FONT};font-weight:800;font-size:18px;text-align:center;line-height:44px;">0${i + 1}</div>
            </td>
            <td class="eml-card" style="padding:18px 22px;font-family:${FONT};">
              <div style="font-size:16px;font-weight:700;color:${p.graphite};">${esc(c.title)}</div>
              <div style="margin-top:6px;font-size:14px;font-weight:400;line-height:1.6;color:${p.graphite};opacity:.8;">${esc(c.text)}</div>
            </td>
          </tr>
        </table>
      </td></tr>`;
    })
    .join("");

  const inner = `
  <tr><td class="eml-pad" style="padding:40px 32px 18px;font-family:${FONT};text-align:center;">
    ${microLabel(`Soluções ${brand.name}`, p.primary)}
    <h1 class="eml-h1" style="margin:16px 0 10px;font-size:32px;font-weight:800;line-height:1.15;color:${p.graphite};letter-spacing:-.4px;">${esc(d.title)}</h1>
    <p class="eml-h2" style="margin:0 auto;max-width:460px;font-size:17px;font-weight:400;line-height:1.5;color:${p.graphite};opacity:.75;">${esc(d.subtitle)}</p>
  </td></tr>
  ${greetingRow(d, brand)}
  ${d.heroImage ? `<tr><td class="eml-pad-x" style="padding:16px 32px 6px;"><img src="${esc(d.heroImage)}" alt="${esc(brand.name)}" class="eml-img" style="width:100%;display:block;border-radius:12px;border:0;"/></td></tr>` : ""}
  ${cards}
  <tr><td class="eml-pad-x" style="padding:20px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${p.graphite};border-radius:12px;">
      <tr><td class="eml-card" style="padding:24px 26px;font-family:${FONT};color:${p.white};">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${p.accent};">Por que isso importa agora</div>
        <div style="margin-top:10px;font-size:14px;font-weight:400;line-height:1.65;">${esc(d.body)}</div>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" class="eml-pad" style="padding:10px 28px 36px;">${ctaButton(d, brand)}</td></tr>`;
  return shell(inner, d, brand);
}

function tplProjeto(d: EmailData, brand: BrandConfig): string {
  const p = brand.palette;
  const items = d.cards.length >= 2 ? d.cards.slice(0, 2) : [{ title: "Antes", text: "" }, { title: "Depois", text: "" }];
  const labels = ["Antes", "Depois"];
  const colors = [p.graphite, p.primary];

  const cell = (c: Card, i: number) => `
    <td valign="top" width="50%" class="eml-stack" style="width:50%;padding:6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${p.white};border:1px solid ${p.light};border-radius:12px;overflow:hidden;">
        ${c.image ? `<tr><td style="padding:0;"><img src="${esc(c.image)}" alt="${esc(labels[i])}" class="eml-img" style="width:100%;height:200px;object-fit:cover;display:block;border:0;"/></td></tr>` : ""}
        <tr><td class="eml-card" style="padding:20px;font-family:${FONT};">
          <div style="display:inline-block;padding:5px 12px;border-radius:999px;background:${colors[i]};color:${p.white};font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">${labels[i]}</div>
          <div style="margin-top:10px;font-size:16px;font-weight:700;color:${p.graphite};line-height:1.3;">${esc(c.title)}</div>
          <div style="margin-top:6px;font-size:14px;font-weight:400;line-height:1.6;color:${p.graphite};opacity:.8;">${esc(c.text)}</div>
        </td></tr>
      </table>
    </td>`;

  const inner = `
  <tr><td class="eml-pad" style="padding:36px 32px 12px;font-family:${FONT};">
    ${microLabel("Projeto · Transformação", p.primary)}
    <h1 class="eml-h1" style="margin:16px 0 10px;font-size:32px;font-weight:800;line-height:1.18;color:${p.graphite};letter-spacing:-.4px;">${esc(d.title)}</h1>
    <p class="eml-h2" style="margin:0;font-size:17px;font-weight:400;line-height:1.5;color:${p.graphite};opacity:.75;">${esc(d.subtitle)}</p>
  </td></tr>
  ${greetingRow(d, brand)}
  <tr><td class="eml-pad-x" style="padding:14px 32px;font-family:${FONT};"><p class="eml-body" style="margin:0;font-size:15px;line-height:1.7;color:${p.graphite};">${esc(d.body)}</p></td></tr>
  <tr><td class="eml-pad-x" style="padding:8px 26px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;"><tr>
      ${cell(items[0], 0)}
      ${cell(items[1], 1)}
    </tr></table>
  </td></tr>
  <tr><td align="center" class="eml-pad" style="padding:26px 32px 36px;">${ctaButton(d, brand)}</td></tr>`;
  return shell(inner, d, brand);
}

function tplConvite(d: EmailData, brand: BrandConfig): string {
  const p = brand.palette;
  const inner = `
  <tr><td class="eml-pad" style="padding:44px 36px 12px;font-family:${FONT};">
    ${microLabel("Convite", p.primary)}
    <h1 class="eml-h1" style="margin:18px 0 12px;font-size:32px;font-weight:700;line-height:1.2;color:${p.graphite};letter-spacing:-.4px;">${esc(d.title)}</h1>
    <p class="eml-h2" style="margin:0;font-size:17px;font-weight:400;line-height:1.55;color:${p.graphite};opacity:.75;">${esc(d.subtitle)}</p>
  </td></tr>
  ${greetingRow(d, brand)}
  <tr><td class="eml-pad-x" style="padding:16px 36px;font-family:${FONT};"><p class="eml-body" style="margin:0;font-size:15px;line-height:1.75;color:${p.graphite};">${esc(d.body)}</p></td></tr>
  <tr><td align="left" class="eml-pad" style="padding:20px 36px 44px;">${ctaButton(d, brand)}</td></tr>`;
  return shell(inner, d, brand);
}

export function renderEmail(d: EmailData): string {
  const brand = getBrand(d.brand);
  const norm = normalizeTemplate(d.template);
  switch (norm) {
    case "campanha": return tplCampanha(d, brand);
    case "consultivo": return tplConsultivo(d, brand);
    case "solucao": return tplSolucao(d, brand);
    case "projeto": return tplProjeto(d, brand);
    case "convite": return tplConvite(d, brand);
    default: return tplCampanha(d, brand);
  }
}

export function renderPlainText(d: EmailData): string {
  const brand = getBrand(d.brand);
  const g = buildGreeting(d);
  const lines: string[] = [];
  if (g) lines.push(g, "");
  lines.push(d.title.toUpperCase(), "");
  if (d.subtitle) lines.push(d.subtitle, "");
  if (d.body) lines.push(d.body, "");
  if (d.cards?.length) {
    d.cards.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.title}`);
      if (c.text) lines.push(`   ${c.text}`);
      lines.push("");
    });
  }
  if (d.cta) lines.push(`${d.cta}: ${d.ctaUrl || ""}`.trim(), "");
  lines.push("---", brand.logoText, `Anderson Rufino · ${d.contato} · ${d.site}`);
  return lines.join("\n");
}
