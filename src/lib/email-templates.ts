// Eduinfo Email Studio — template generators
// Gmail-safe: tables, inline CSS, max-width 600px, no scripts, no animations.

export const EDU = {
  graphite: "#333333",
  coral: "#FE455C",
  yellow: "#FEBD5F",
  blue: "#009BCE",
  green: "#38D64D",
  white: "#FFFFFF",
  light: "#F5F6F8",
};

export const FONT = `'Poppins', Arial, Helvetica, sans-serif`;

export const WHATSAPP_URL =
  "https://wa.me/5511932789123?text=Ol%C3%A1%2C%20Rufino!%20Gostaria%20de%20conversar%20sobre%20melhorias%20para%20a%20minha%20escola.";

export type TemplateType =
  | "campanha"
  | "consultivo"
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
  // greeting
  tratamento: string; // e.g. "Diretora", or empty
  artigo: "a" | "o" | "";
  nomeContato: string;
  // school
  nomeEscola: string;
  // content
  title: string;
  subtitle: string;
  body: string;
  cta: string;
  ctaUrl: string;
  heroImage: string;
  cards: Card[];
  // brand
  contato: string;
  site: string;
}

export const TEMPLATE_LABELS: Record<TemplateType, string> = {
  campanha: "Campanha de Impacto",
  consultivo: "Conteúdo Consultivo",
  newsletter: "Newsletter em Blocos",
  frentes: "5 Frentes Eduinfo",
  tecnologia: "Tecnologia Educacional",
  reforma: "Reforma Rápida / Ambientes",
};

export function defaultsFor(t: TemplateType): Partial<EmailData> {
  switch (t) {
    case "campanha":
      return {
        title: "Prepare sua escola para o próximo ciclo de matrículas",
        subtitle:
          "Ambientes bem planejados comunicam valor, acolhimento e inovação antes mesmo da primeira conversa com a família.",
        body:
          "A Eduinfo conecta arquitetura, mobiliário, tecnologia e estratégia para que cada espaço da escola fortaleça a percepção institucional e a experiência educacional.",
        cta: "Planejar melhorias agora",
        cards: [
          { title: "Sala Maker", text: "Ambiente pensado para criatividade, experimentação, colaboração e aprendizagem prática." },
          { title: "Biblioteca", text: "Espaço de leitura, pesquisa e acolhimento que fortalece repertório, concentração e experiência do aluno." },
          { title: "Espaço multiuso", text: "Ambiente versátil para convivência, projetos, apresentações e diferentes dinâmicas da rotina escolar." },
        ],
      };
    case "consultivo":
      return {
        title: "Ambientes escolares também comunicam posicionamento",
        subtitle: "Uma leitura rápida para mantenedores, diretores e gestores.",
        body:
          "Neste período do ano, muitas instituições começam a avaliar o que ainda dá tempo de melhorar antes da próxima campanha de matrículas. Nem sempre a resposta está em uma grande reforma. Às vezes, uma recepção mais acolhedora, uma sala de regulação bem planejada, uma área de convivência reorganizada ou uma comunicação visual mais clara já geram grande impacto na percepção das famílias.",
        cta: "Conversar sobre prioridades",
        cards: [],
      };
    case "newsletter":
      return {
        title: "O que a sua escola pode revisar agora",
        subtitle: "Três frentes que costumam gerar mais percepção de valor.",
        body: "Selecionamos três blocos que ajudam a planejar melhorias com método e propósito.",
        cta: "Ver possibilidades para minha escola",
        cards: [
          { title: "Ambientes que acolhem", text: "Recepção, convivência e salas de apoio podem reforçar cuidado, organização e pertencimento." },
          { title: "Soluções que conectam", text: "Mobiliário, tecnologia e comunicação visual precisam dialogar com a rotina da escola." },
          { title: "Planejamento que gera resultado", text: "O plano diretor ajuda a priorizar investimentos, organizar etapas e evitar decisões isoladas." },
        ],
      };
    case "frentes":
      return {
        title: "5 frentes que fazem a Eduinfo ser diferente no mercado educacional",
        subtitle: "Soluções integradas que fortalecem aprendizagem, posicionamento e experiência dentro da escola.",
        body: "Por que isso importa agora? Porque decisões integradas geram resultado real — em campanha, em rotina e em percepção institucional.",
        cta: "Planejar próximas melhorias",
        cards: [
          { title: "Arquitetura & Comunicação Visual", text: "Transforma espaços em experiências que fortalecem identidade, acolhimento e posicionamento institucional." },
          { title: "Mobiliário Educacional", text: "Cria ambientes mais confortáveis, flexíveis e preparados para novas dinâmicas de aprendizagem." },
          { title: "Tecnologia Educacional", text: "Integra displays interativos, notebooks, Chromebooks, tablets, carrinhos de carregamento e licença CEU." },
          { title: "Plano Diretor & Estratégia", text: "Ajuda a escola a priorizar o que pode ser feito agora, o que fica para depois e o que gera mais impacto." },
          { title: "Formação & Experiência", text: "Conecta espaços, cultura e pessoas para gerar pertencimento e transformação real na rotina escolar." },
        ],
      };
    case "tecnologia":
      return {
        title: "Tecnologia educacional para ambientes mais conectados",
        subtitle: "Soluções para tornar o ensino mais fluido, moderno e eficiente.",
        body:
          "A tecnologia precisa funcionar dentro da rotina da escola. Por isso, a Eduinfo apoia a escolha, integração e implantação de soluções que fazem sentido para alunos, educadores e gestão.",
        cta: "Conhecer soluções de tecnologia",
        cards: [
          { title: "Display Interativo", text: "Aulas mais dinâmicas e colaborativas." },
          { title: "Notebooks", text: "Mobilidade e produtividade para equipes e alunos." },
          { title: "Chromebooks", text: "Gestão simplificada e custo otimizado." },
          { title: "Tablets", text: "Aprendizagem interativa em qualquer ambiente." },
          { title: "Carrinhos de carregamento", text: "Organização e segurança para os dispositivos." },
          { title: "Licença CEU", text: "Ambiente educacional integrado e seguro." },
        ],
      };
    case "reforma":
      return {
        title: "Melhore a experiência física da sua escola",
        subtitle: "Pequenas melhorias bem planejadas podem gerar grande percepção para famílias, alunos e equipe.",
        body: "Selecionamos cinco frentes que costumam ser viáveis em janelas curtas — férias, recessos e pré-matrícula.",
        cta: "Entender o que ainda dá tempo de fazer",
        cards: [
          { title: "Recepção", text: "Primeira impressão mais acolhedora e alinhada ao posicionamento da escola." },
          { title: "Áreas de convivência", text: "Espaços mais funcionais, confortáveis e preparados para interação." },
          { title: "Sala de regulação", text: "Ambiente pensado para acolhimento, cuidado e apoio à rotina escolar." },
          { title: "Comunicação visual", text: "Identidade mais clara, organizada e coerente com a proposta da instituição." },
          { title: "Mobiliário", text: "Soluções que melhoram uso, conforto e flexibilidade dos espaços." },
        ],
      };
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

function shell(inner: string, d: EmailData): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(d.title)}</title></head>
<body style="margin:0;padding:0;background:${EDU.light};font-family:${FONT};color:${EDU.graphite};-webkit-text-size-adjust:100%;">
<center style="width:100%;background:${EDU.light};padding:24px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:${EDU.white};border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(51,51,51,0.06);">
${inner}
${footerBlock(d)}
</table>
</center></body></html>`;
}

function headerBar(): string {
  return `<tr><td style="padding:20px 28px;background:${EDU.white};border-bottom:1px solid ${EDU.light};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="left" style="font-family:${FONT};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle" style="padding-right:10px;">
            <div style="width:28px;height:28px;border-radius:7px;background:${EDU.coral};color:${EDU.white};font-weight:800;font-size:15px;text-align:center;line-height:28px;font-family:${FONT};">E</div>
          </td>
          <td valign="middle" style="font-family:${FONT};font-weight:700;font-size:18px;color:${EDU.graphite};letter-spacing:.3px;">
            eduinfo
          </td>
        </tr></table>
      </td>
      <td align="right" style="font-family:${FONT};font-size:10px;text-transform:uppercase;letter-spacing:1.4px;color:${EDU.graphite};opacity:.55;">
        Arquitetura · Formação · Mobiliário · Tecnologia
      </td>
    </tr></table>
  </td></tr>`;
}

function footerBlock(d: EmailData): string {
  return `<tr><td style="background:${EDU.white};padding:24px 28px;border-top:1px solid ${EDU.light};font-family:${FONT};color:${EDU.graphite};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="font-weight:700;font-size:18px;letter-spacing:.3px;color:${EDU.graphite};">eduinfo</td>
      <td align="right" style="font-size:12px;font-weight:500;line-height:1.55;color:${EDU.graphite};">
        Anderson Rufino &nbsp;·&nbsp; ${esc(d.contato)}<br/>
        <a href="https://${esc(d.site)}" style="color:${EDU.graphite};text-decoration:underline;">${esc(d.site)}</a>
      </td>
    </tr></table>
    <div style="margin-top:10px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:${EDU.graphite};opacity:.55;">
      Ambientes · Mobiliário · Tecnologia · Estratégia · Formação
    </div>
  </td></tr>`;
}

function greetingRow(d: EmailData): string {
  const g = buildGreeting(d);
  if (!g) return "";
  return `<tr><td style="padding:22px 28px 0;font-family:${FONT};font-size:14px;font-weight:500;color:${EDU.graphite};">${esc(g)}</td></tr>`;
}

function ctaButton(d: EmailData, color = EDU.coral): string {
  if (!d.cta) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0;">
    <tr><td style="border-radius:999px;background:${color};">
      <a href="${esc(d.ctaUrl || "#")}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-weight:600;font-size:13px;color:${EDU.white};text-decoration:none;letter-spacing:.3px;">
        ${esc(d.cta)} →
      </a>
    </td></tr>
  </table>`;
}

function microLabel(text: string, color: string): string {
  return `<div style="display:inline-block;padding:6px 12px;border-radius:999px;background:${color}22;color:${color};font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${esc(text)}</div>`;
}

// ---------- TEMPLATES ----------

function tplCampanha(d: EmailData): string {
  const cardColors = [EDU.coral, EDU.blue, EDU.green];
  const cardLabels = ["Ambiente 01", "Ambiente 02", "Ambiente 03"];
  const items = d.cards.slice(0, 3);
  // Pad to 3 to keep layout balanced
  while (items.length < 3) items.push({ title: "", text: "" });

  const cardCell = (c: Card, i: number) => {
    const color = cardColors[i];
    const imgBlock = c.image
      ? `<tr><td style="padding:0;"><img src="${esc(c.image)}" width="100%" alt="${esc(c.title)}" style="display:block;width:100%;height:110px;object-fit:cover;border-top-left-radius:14px;border-top-right-radius:14px;border:0;"/></td></tr>`
      : "";
    const minH = c.image ? 220 : 200;
    return `<td valign="top" width="33.33%" style="width:33.33%;padding:0 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${color};border-radius:14px;overflow:hidden;">
        ${imgBlock}
        <tr><td valign="top" style="padding:18px 18px 20px;color:${EDU.white};font-family:${FONT};min-height:${minH}px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;opacity:.85;">${cardLabels[i]}</div>
          <div style="font-size:17px;font-weight:700;margin-top:8px;line-height:1.2;letter-spacing:-.2px;">${esc(c.title)}</div>
          <div style="height:2px;width:28px;background:${EDU.white};opacity:.6;margin:8px 0 10px;"></div>
          <div style="font-size:12px;font-weight:300;line-height:1.55;opacity:.96;">${esc(c.text)}</div>
        </td></tr>
      </table>
    </td>`;
  };

  const cards = items.map((c, i) => cardCell(c, i)).join("");

  const inner = `${headerBar()}
  <tr><td style="padding:0;background:linear-gradient(135deg,${EDU.coral} 0%, ${EDU.yellow} 100%);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:52px 36px 44px;text-align:center;color:${EDU.white};font-family:${FONT};">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;opacity:.9;">Eduinfo · Campanha Institucional</div>
      <h1 style="margin:16px 0 12px;font-size:35px;line-height:1.12;font-weight:800;letter-spacing:-.6px;">${esc(d.title)}</h1>
      <p style="margin:0 auto;max-width:460px;font-size:14px;font-weight:300;line-height:1.65;opacity:.95;">${esc(d.subtitle)}</p>
    </td></tr></table>
  </td></tr>
  ${greetingRow(d)}
  <tr><td style="padding:22px 32px 6px;font-family:${FONT};font-size:12px;font-weight:300;line-height:1.75;color:${EDU.graphite};">${esc(d.body)}</td></tr>
  ${d.heroImage ? `<tr><td style="padding:14px 32px 6px;"><img src="${esc(d.heroImage)}" width="536" alt="${esc(d.nomeEscola || "Eduinfo")}" style="width:100%;max-width:536px;display:block;border-radius:14px;border:0;"/></td></tr>` : ""}
  <tr><td style="padding:18px 32px 6px;font-family:${FONT};">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${EDU.coral};">Ambientes Eduinfo</div>
    <div style="margin-top:4px;font-size:15px;font-weight:600;color:${EDU.graphite};line-height:1.3;">Três frentes que costumam transformar a percepção da escola</div>
  </td></tr>
  <tr><td style="padding:14px 26px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;"><tr>${cards}</tr></table>
  </td></tr>
  <tr><td align="center" style="padding:22px 32px 36px;">${ctaButton(d, EDU.coral)}</td></tr>`;
  return shell(inner, d);
}

function tplConsultivo(d: EmailData): string {
  const inner = `${headerBar()}
  <tr><td style="padding:0;">
    ${d.heroImage ? `<img src="${esc(d.heroImage)}" width="600" alt="${esc(d.nomeEscola || "Eduinfo")}" style="width:100%;display:block;border:0;"/>` : `<div style="height:8px;background:${EDU.blue};"></div>`}
  </td></tr>
  <tr><td style="padding:28px 32px 8px;font-family:${FONT};">
    ${microLabel("Conteúdo Consultivo", EDU.blue)}
    <h1 style="margin:14px 0 6px;font-size:35px;font-weight:700;line-height:1.15;color:${EDU.graphite};letter-spacing:-.5px;">${esc(d.title)}</h1>
    <h2 style="margin:0 0 16px;font-size:16px;font-weight:500;line-height:1.4;color:${EDU.graphite};opacity:.7;">${esc(d.subtitle)}</h2>
  </td></tr>
  ${greetingRow(d)}
  <tr><td style="padding:14px 32px;font-family:${FONT};font-size:13px;font-weight:300;line-height:1.75;color:${EDU.graphite};">${esc(d.body)}</td></tr>
  <tr><td style="padding:6px 32px 18px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EDU.light};border-left:4px solid ${EDU.coral};border-radius:8px;">
      <tr><td style="padding:18px 20px;font-family:${FONT};font-size:13px;line-height:1.6;color:${EDU.graphite};">
        <strong style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:${EDU.coral};margin-bottom:6px;">Insight</strong>
        A percepção das famílias começa antes da matrícula — ela começa quando elas entram pela primeira vez na escola.
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="left" style="padding:6px 32px 32px;">${ctaButton(d, EDU.blue)}</td></tr>`;
  return shell(inner, d);
}

function tplNewsletter(d: EmailData): string {
  const blocks = d.cards
    .map((c, i) => {
      const reversed = i % 2 === 1;
      const img = c.image || d.heroImage;
      const imgCell = `<td valign="top" width="42%" style="padding:0 12px;">
        ${img ? `<img src="${esc(img)}" width="220" alt="${esc(c.title)}" style="width:100%;display:block;border-radius:10px;border:0;"/>` : ""}
      </td>`;
      const txtCell = `<td valign="top" style="padding:6px 12px;font-family:${FONT};">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${EDU.coral};">Bloco 0${i + 1}</div>
        <h3 style="margin:6px 0 8px;font-size:18px;font-weight:600;color:${EDU.graphite};line-height:1.25;">${esc(c.title)}</h3>
        <p style="margin:0;font-size:13px;font-weight:300;line-height:1.65;color:${EDU.graphite};">${esc(c.text)}</p>
      </td>`;
      return `<tr><td style="padding:14px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          ${reversed ? txtCell + imgCell : imgCell + txtCell}
        </tr></table>
      </td></tr>
      <tr><td style="padding:0 32px;"><div style="height:1px;background:${EDU.light};"></div></td></tr>`;
    })
    .join("");

  const inner = `${headerBar()}
  <tr><td style="padding:36px 32px 8px;font-family:${FONT};text-align:center;">
    ${microLabel("Newsletter", EDU.green)}
    <h1 style="margin:14px 0 6px;font-size:35px;font-weight:700;line-height:1.15;color:${EDU.graphite};">${esc(d.title)}</h1>
    <p style="margin:0 auto;max-width:480px;font-size:14px;font-weight:300;line-height:1.6;color:${EDU.graphite};opacity:.75;">${esc(d.subtitle)}</p>
  </td></tr>
  ${greetingRow(d)}
  <tr><td style="padding:14px 32px 6px;font-family:${FONT};font-size:13px;font-weight:300;line-height:1.7;color:${EDU.graphite};">${esc(d.body)}</td></tr>
  ${blocks}
  <tr><td align="center" style="padding:22px 32px 32px;">${ctaButton(d, EDU.green)}</td></tr>`;
  return shell(inner, d);
}

function tplFrentes(d: EmailData): string {
  const colors = [EDU.coral, EDU.yellow, EDU.blue, EDU.green, EDU.graphite];
  const cards = d.cards
    .map((c, i) => {
      const color = colors[i % colors.length];
      return `<tr><td style="padding:8px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EDU.white};border:1px solid ${EDU.light};border-radius:12px;">
          <tr>
            <td valign="top" width="56" style="padding:18px 0 18px 18px;">
              <div style="width:44px;height:44px;border-radius:10px;background:${color};color:${EDU.white};font-family:${FONT};font-weight:800;font-size:18px;text-align:center;line-height:44px;">0${i + 1}</div>
            </td>
            <td style="padding:16px 20px;font-family:${FONT};">
              <div style="font-size:15px;font-weight:700;color:${EDU.graphite};">${esc(c.title)}</div>
              <div style="margin-top:4px;font-size:12px;font-weight:300;line-height:1.6;color:${EDU.graphite};opacity:.8;">${esc(c.text)}</div>
            </td>
          </tr>
        </table>
      </td></tr>`;
    })
    .join("");

  const inner = `${headerBar()}
  <tr><td style="padding:40px 32px 18px;font-family:${FONT};text-align:center;">
    ${microLabel("Ecossistema Eduinfo", EDU.coral)}
    <h1 style="margin:14px 0 8px;font-size:35px;font-weight:700;line-height:1.15;color:${EDU.graphite};">${esc(d.title)}</h1>
    <p style="margin:0 auto;max-width:480px;font-size:14px;font-weight:300;line-height:1.6;color:${EDU.graphite};opacity:.75;">${esc(d.subtitle)}</p>
  </td></tr>
  ${greetingRow(d)}
  ${cards}
  <tr><td style="padding:18px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EDU.graphite};border-radius:12px;">
      <tr><td style="padding:22px 24px;font-family:${FONT};color:${EDU.white};">
        <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${EDU.yellow};">Por que isso importa agora?</div>
        <div style="margin-top:8px;font-size:13px;font-weight:300;line-height:1.6;">${esc(d.body)}</div>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:8px 28px 32px;">${ctaButton(d, EDU.coral)}</td></tr>`;
  return shell(inner, d);
}

function tplTecnologia(d: EmailData): string {
  const cards = [];
  for (let i = 0; i < d.cards.length; i += 2) {
    const a = d.cards[i];
    const b = d.cards[i + 1];
    const cell = (c?: Card) =>
      c
        ? `<td valign="top" width="50%" style="padding:6px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EDU.light};border-radius:10px;">
              <tr><td style="padding:16px;font-family:${FONT};">
                <div style="width:32px;height:32px;border-radius:8px;background:${EDU.blue};color:${EDU.white};text-align:center;line-height:32px;font-weight:800;font-size:14px;">✓</div>
                <div style="margin-top:10px;font-size:14px;font-weight:600;color:${EDU.graphite};">${esc(c.title)}</div>
                <div style="margin-top:4px;font-size:12px;font-weight:300;line-height:1.5;color:${EDU.graphite};opacity:.75;">${esc(c.text)}</div>
              </td></tr>
            </table>
          </td>`
        : `<td width="50%" style="padding:6px;"></td>`;
    cards.push(`<tr>${cell(a)}${cell(b)}</tr>`);
  }

  const inner = `${headerBar()}
  <tr><td style="padding:0;background:linear-gradient(135deg,${EDU.blue} 0%, #003F66 100%);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:44px 32px 36px;color:${EDU.white};font-family:${FONT};">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:700;opacity:.85;">Tecnologia Educacional</div>
      <h1 style="margin:12px 0 10px;font-size:35px;font-weight:800;line-height:1.15;letter-spacing:-.5px;">${esc(d.title)}</h1>
      <p style="margin:0;max-width:480px;font-size:14px;font-weight:300;line-height:1.6;opacity:.95;">${esc(d.subtitle)}</p>
    </td></tr></table>
  </td></tr>
  ${d.heroImage ? `<tr><td style="padding:0;"><img src="${esc(d.heroImage)}" width="600" alt="Tecnologia educacional" style="width:100%;display:block;border:0;"/></td></tr>` : ""}
  ${greetingRow(d)}
  <tr><td style="padding:14px 28px 4px;font-family:${FONT};font-size:13px;font-weight:300;line-height:1.7;color:${EDU.graphite};">${esc(d.body)}</td></tr>
  <tr><td style="padding:10px 22px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cards.join("")}</table>
  </td></tr>
  <tr><td align="left" style="padding:14px 28px 32px;">${ctaButton(d, EDU.blue)}</td></tr>`;
  return shell(inner, d);
}

function tplReforma(d: EmailData): string {
  const colors = [EDU.coral, EDU.yellow, EDU.blue, EDU.green, EDU.graphite];
  const cards = d.cards
    .map(
      (c, i) => `<td valign="top" width="50%" style="padding:6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EDU.white};border:1px solid ${EDU.light};border-radius:10px;">
          <tr><td style="padding:16px;font-family:${FONT};">
            <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${colors[i % colors.length]};">Frente ${String(i + 1).padStart(2, "0")}</div>
            <div style="margin-top:6px;font-size:15px;font-weight:600;color:${EDU.graphite};">${esc(c.title)}</div>
            <div style="margin-top:6px;font-size:12px;font-weight:300;line-height:1.55;color:${EDU.graphite};opacity:.78;">${esc(c.text)}</div>
          </td></tr>
        </table>
      </td>`
    )
    .reduce<string[][]>((rows, cell, i) => {
      const r = Math.floor(i / 2);
      rows[r] = rows[r] || [];
      rows[r].push(cell);
      return rows;
    }, [])
    .map((r) => `<tr>${r.join("")}${r.length === 1 ? `<td width="50%"></td>` : ""}</tr>`)
    .join("");

  const inner = `${headerBar()}
  <tr><td style="padding:36px 32px 18px;font-family:${FONT};">
    ${microLabel("Reforma Rápida · Ambientes", EDU.coral)}
    <h1 style="margin:14px 0 8px;font-size:35px;font-weight:700;line-height:1.1;color:${EDU.graphite};letter-spacing:-.5px;border:2px solid ${EDU.coral};padding:14px 16px;border-radius:10px;display:inline-block;">${esc(d.title)}</h1>
    <p style="margin:14px 0 0;font-size:14px;font-weight:300;line-height:1.6;color:${EDU.graphite};opacity:.8;">${esc(d.subtitle)}</p>
  </td></tr>
  ${d.heroImage ? `<tr><td style="padding:12px 28px;"><img src="${esc(d.heroImage)}" width="544" alt="Ambientes" style="width:100%;max-width:544px;display:block;border-radius:12px;border:0;"/></td></tr>` : ""}
  ${greetingRow(d)}
  <tr><td style="padding:14px 28px 4px;font-family:${FONT};font-size:13px;font-weight:300;line-height:1.7;color:${EDU.graphite};">${esc(d.body)}</td></tr>
  <tr><td style="padding:8px 22px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cards}</table>
  </td></tr>
  <tr><td align="left" style="padding:16px 28px 32px;">${ctaButton(d, EDU.coral)}</td></tr>`;
  return shell(inner, d);
}

export function renderEmail(d: EmailData): string {
  switch (d.template) {
    case "campanha": return tplCampanha(d);
    case "consultivo": return tplConsultivo(d);
    case "newsletter": return tplNewsletter(d);
    case "frentes": return tplFrentes(d);
    case "tecnologia": return tplTecnologia(d);
    case "reforma": return tplReforma(d);
  }
}

export function renderPlainText(d: EmailData): string {
  const g = buildGreeting(d);
  const lines: string[] = [];
  if (g) lines.push(g, "");
  lines.push(d.title.toUpperCase(), "");
  if (d.subtitle) lines.push(d.subtitle, "");
  if (d.body) lines.push(d.body, "");
  if (d.cards?.length) {
    d.cards.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.title}`);
      lines.push(`   ${c.text}`, "");
    });
  }
  if (d.cta) lines.push(`${d.cta}: ${d.ctaUrl || ""}`.trim(), "");
  lines.push("---", "eduinfo", `Anderson Rufino · ${d.contato} · ${d.site}`);
  return lines.join("\n");
}
