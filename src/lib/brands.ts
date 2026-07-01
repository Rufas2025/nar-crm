// Brand system for Email Studio.
// Each brand exposes palette, copy defaults and CTAs used by the generic templates.

import type { TemplateType } from "./email-templates";

export type BrandId = "eduinfo" | "gennera" | "ecoclear" | "educbank" | "nareco";

export interface BrandPalette {
  primary: string;   // main brand color (headers, CTAs)
  secondary: string; // supporting accent
  accent: string;    // tertiary accent (cards, badges)
  graphite: string;  // main text
  light: string;     // background
  white: string;
}

export interface BrandTemplateOverride {
  title?: string;
  subtitle?: string;
  body?: string;
  cta?: string;
  cards?: { title: string; text: string }[];
}

export interface BrandConfig {
  id: BrandId;
  name: string;
  logoText: string;
  tagline: string;
  palette: BrandPalette;
  contato: string;
  site: string;
  whatsappUrl: string;
  defaultCTAs: string[];
  templateOverrides: Partial<Record<TemplateType, BrandTemplateOverride>>;
}

const WHATSAPP_RUFINO =
  "https://wa.me/5511932789123?text=Ol%C3%A1%2C%20Rufino!%20Gostaria%20de%20conversar.";

export const BRANDS: Record<BrandId, BrandConfig> = {
  eduinfo: {
    id: "eduinfo",
    name: "Eduinfo",
    logoText: "eduinfo",
    tagline: "Arquitetura · Mobiliário · Tecnologia · Estratégia · Formação",
    palette: {
      primary: "#FE455C",
      secondary: "#0098C7",
      accent: "#38D64D",
      graphite: "#333333",
      light: "#F5F6F8",
      white: "#FFFFFF",
    },
    contato: "(11) 93278-9123",
    site: "www.eduinfo.com.br",
    whatsappUrl: WHATSAPP_RUFINO,
    defaultCTAs: [
      "Planejar melhorias agora",
      "Conversar sobre prioridades",
      "Ver possibilidades para minha escola",
      "Preparar minha escola para o próximo ciclo",
    ],
    templateOverrides: {
      campanha: {
        title: "Prepare sua escola para o próximo ciclo de matrículas",
        subtitle:
          "Ambientes bem planejados comunicam valor, acolhimento e inovação antes da primeira conversa com a família.",
        body:
          "A Eduinfo conecta arquitetura, mobiliário, tecnologia e estratégia para que cada espaço fortaleça a percepção institucional.",
        cta: "Planejar melhorias agora",
        cards: [
          { title: "Sala Maker", text: "Ambiente para criatividade, experimentação e aprendizagem prática." },
          { title: "Biblioteca", text: "Espaço de leitura e pesquisa que fortalece repertório e concentração." },
          { title: "Espaço multiuso", text: "Ambiente versátil para convivência, projetos e apresentações." },
        ],
      },
      consultivo: {
        title: "Ambientes escolares também comunicam posicionamento",
        subtitle: "Uma leitura rápida para mantenedores, diretores e gestores.",
        body:
          "Nem sempre a resposta está em uma grande reforma. Uma recepção acolhedora, uma sala de regulação bem planejada ou uma comunicação visual mais clara já geram impacto real na percepção das famílias.",
        cta: "Conversar sobre prioridades",
      },
      solucao: {
        title: "5 frentes que fazem a Eduinfo ser diferente",
        subtitle: "Soluções integradas que fortalecem aprendizagem, posicionamento e experiência.",
        body: "Decisões integradas geram resultado real — em campanha, em rotina e em percepção institucional.",
        cta: "Planejar próximas melhorias",
        cards: [
          { title: "Arquitetura & Comunicação Visual", text: "Espaços que fortalecem identidade e acolhimento." },
          { title: "Mobiliário Educacional", text: "Ambientes confortáveis, flexíveis e preparados." },
          { title: "Tecnologia Educacional", text: "Displays, notebooks, Chromebooks e integração CEU." },
          { title: "Plano Diretor & Estratégia", text: "Prioriza o que gera mais impacto agora." },
          { title: "Formação & Experiência", text: "Cultura e pessoas conectadas ao espaço." },
        ],
      },
      projeto: {
        title: "Antes e depois: como um ambiente muda a percepção da escola",
        subtitle: "Um recorte visual do que uma intervenção bem planejada é capaz de transformar.",
        body:
          "Nem toda transformação exige uma obra grande. Muitas vezes, uma frente pontual — recepção, biblioteca, sala de regulação — já reposiciona a escola no imaginário das famílias.",
        cta: "Ver possibilidades para minha escola",
        cards: [
          { title: "Antes", text: "Espaço subutilizado, sem identidade e sem função clara." },
          { title: "Depois", text: "Ambiente acolhedor, funcional e alinhado ao posicionamento institucional." },
        ],
      },
      convite: {
        title: "Podemos conversar 20 minutos sobre a sua escola?",
        subtitle: "Uma conversa curta, sem compromisso, para entender o momento e o que faria sentido no próximo ciclo.",
        body: "Se fizer sentido, posso preparar uma leitura personalizada dos ambientes e prioridades da sua instituição.",
        cta: "Marcar uma conversa",
      },
    },
  },

  gennera: {
    id: "gennera",
    name: "Gennera",
    logoText: "gennera",
    tagline: "Gestão escolar · Dados · Secretaria · Financeiro",
    palette: {
      primary: "#1E3A8A",
      secondary: "#0EA5E9",
      accent: "#22D3EE",
      graphite: "#1F2937",
      light: "#F3F6FB",
      white: "#FFFFFF",
    },
    contato: "(11) 93278-9123",
    site: "www.gennera.com.br",
    whatsappUrl: WHATSAPP_RUFINO,
    defaultCTAs: [
      "Conversar sobre gestão escolar",
      "Ver como simplificar relatórios",
      "Avaliar a rotina da escola",
      "Conhecer possibilidades com dados",
    ],
    templateOverrides: {
      campanha: {
        title: "Sua escola tomando decisões com dados, não com achismo",
        subtitle: "Um sistema de gestão que conecta secretaria, financeiro, pedagógico e famílias.",
        body: "A Gennera organiza a operação da escola em uma única plataforma, com relatórios que ajudam a tomar decisão rápida.",
        cta: "Conhecer possibilidades com dados",
        cards: [
          { title: "Secretaria", text: "Matrículas, documentação e histórico em um só fluxo." },
          { title: "Financeiro", text: "Mensalidades, inadimplência e conciliação sob controle." },
          { title: "Relatórios", text: "Indicadores prontos para reunião com mantenedor." },
        ],
      },
      consultivo: {
        title: "Quanto tempo sua equipe gasta juntando planilhas?",
        subtitle: "Um recorte para diretores, mantenedores e responsáveis pela operação.",
        body: "Boa parte das escolas ainda opera com informação espalhada. O custo não aparece na conta, mas aparece na velocidade de decisão.",
        cta: "Avaliar a rotina da escola",
      },
      solucao: {
        title: "Frentes onde a Gennera reduz atrito operacional",
        subtitle: "Cada módulo pensado para tirar peso da equipe e clareza para a gestão.",
        body: "Módulos integrados que conversam entre si — não são sistemas separados costurados por planilha.",
        cta: "Ver como simplificar relatórios",
        cards: [
          { title: "Secretaria digital", text: "Documentos, matrículas e histórico centralizados." },
          { title: "Financeiro escolar", text: "Régua de cobrança, boletos e conciliação." },
          { title: "Pedagógico", text: "Notas, faltas, boletim e comunicação com famílias." },
          { title: "Comunicação", text: "Mensagens, avisos e portal do responsável." },
          { title: "BI & Relatórios", text: "Dashboards prontos para reunião." },
        ],
      },
      projeto: {
        title: "Antes e depois de organizar a gestão em uma única plataforma",
        subtitle: "Recorte de uma escola que consolidou operação em 60 dias.",
        body: "O que antes era planilha, whatsapp e e-mail virou fluxo. Menos retrabalho, mais visibilidade.",
        cta: "Conversar sobre gestão escolar",
        cards: [
          { title: "Antes", text: "Planilhas paralelas, retrabalho e decisão lenta." },
          { title: "Depois", text: "Indicadores em tempo real e equipe alinhada." },
        ],
      },
      convite: {
        title: "20 minutos para olhar a operação da sua escola",
        subtitle: "Sem compromisso. Só para entender onde há atrito e o que faria diferença agora.",
        body: "Se fizer sentido, preparamos uma leitura da rotina da sua escola e mostramos onde a Gennera encaixa.",
        cta: "Marcar uma conversa",
      },
    },
  },

  ecoclear: {
    id: "ecoclear",
    name: "EcoClear",
    logoText: "ecoclear",
    tagline: "Limpeza profissional · Cuidado · Rotina segura",
    palette: {
      primary: "#0F766E",
      secondary: "#14B8A6",
      accent: "#5EEAD4",
      graphite: "#1F2937",
      light: "#F1FAF8",
      white: "#FFFFFF",
    },
    contato: "(11) 93278-9123",
    site: "www.ecoclear.com.br",
    whatsappUrl: WHATSAPP_RUFINO,
    defaultCTAs: [
      "Conversar sobre rotina de limpeza",
      "Avaliar ambientes da escola",
      "Planejar uma operação mais segura",
      "Cuidar melhor dos espaços",
    ],
    templateOverrides: {
      campanha: {
        title: "Ambientes limpos comunicam cuidado antes de qualquer palavra",
        subtitle: "Uma operação de limpeza pensada para escolas, com padrão visível e rotina previsível.",
        body: "A EcoClear cuida da rotina de limpeza e conservação da sua escola com equipe treinada, insumos certos e supervisão contínua.",
        cta: "Conversar sobre rotina de limpeza",
        cards: [
          { title: "Salas de aula", text: "Higienização diária com produtos seguros para crianças." },
          { title: "Banheiros", text: "Ciclos de vistoria ao longo do dia, com controle de reposição." },
          { title: "Áreas comuns", text: "Recepção, pátio e corredores sempre apresentáveis." },
        ],
      },
      consultivo: {
        title: "A percepção de limpeza é a primeira coisa que a família nota",
        subtitle: "Uma leitura para diretores e responsáveis pela operação predial.",
        body: "Escola limpa não é sobre passar pano. É sobre método, frequência, treino e supervisão. Quando um desses pilares falha, aparece.",
        cta: "Avaliar ambientes da escola",
      },
      solucao: {
        title: "Frentes onde a EcoClear atua na sua escola",
        subtitle: "Operação estruturada, não terceirização informal.",
        body: "Cada frente com protocolo, cronograma e responsável.",
        cta: "Planejar uma operação mais segura",
        cards: [
          { title: "Limpeza diária", text: "Rotina fixa por ambiente." },
          { title: "Higienização profunda", text: "Ciclos programados de sanitização." },
          { title: "Vidros e fachada", text: "Aparência externa preservada." },
          { title: "Áreas técnicas", text: "Cozinha, refeitório e sanitários." },
          { title: "Supervisão", text: "Checklists e presença de líder." },
        ],
      },
      projeto: {
        title: "Antes e depois de uma operação de limpeza estruturada",
        subtitle: "Diferença aparece nos primeiros 15 dias.",
        body: "Padronização, insumos corretos e supervisão mudam a percepção do espaço.",
        cta: "Cuidar melhor dos espaços",
        cards: [
          { title: "Antes", text: "Rotina inconsistente, insumos variados, sem checklist." },
          { title: "Depois", text: "Padrão visível, previsível e auditável." },
        ],
      },
      convite: {
        title: "Podemos passar 20 minutos avaliando a rotina de limpeza?",
        subtitle: "Uma conversa direta para entender onde a operação atual pode melhorar.",
        body: "Se fizer sentido, mostramos como seria uma proposta ajustada para sua escola.",
        cta: "Marcar uma conversa",
      },
    },
  },

  educbank: {
    id: "educbank",
    name: "Educbank",
    logoText: "educbank",
    tagline: "Previsibilidade financeira · Mensalidades · Sustentabilidade",
    palette: {
      primary: "#0B3B7A",
      secondary: "#10B981",
      accent: "#60A5FA",
      graphite: "#1F2937",
      light: "#F4F7FB",
      white: "#FFFFFF",
    },
    contato: "(11) 93278-9123",
    site: "www.educbank.com.br",
    whatsappUrl: WHATSAPP_RUFINO,
    defaultCTAs: [
      "Conversar sobre previsibilidade financeira",
      "Avaliar impacto da inadimplência",
      "Entender possibilidades para sua escola",
      "Planejar o financeiro com mais clareza",
    ],
    templateOverrides: {
      campanha: {
        title: "Sua escola recebendo 100% da mensalidade, todo mês",
        subtitle: "Previsibilidade financeira para focar no pedagógico, não no boleto.",
        body: "O Educbank garante o recebimento das mensalidades e assume a régua de cobrança, dando fôlego e clareza para a gestão.",
        cta: "Conversar sobre previsibilidade financeira",
        cards: [
          { title: "Receita garantida", text: "Escola recebe integralmente, sem depender do pagamento." },
          { title: "Cobrança profissional", text: "Comunicação com a família com padrão e tom institucional." },
          { title: "Foco no pedagógico", text: "Equipe deixa de operar cobrança e volta para o core." },
        ],
      },
      consultivo: {
        title: "Quanto a inadimplência custa para sua escola por ano?",
        subtitle: "Uma leitura financeira para mantenedores e diretores.",
        body: "Inadimplência não aparece só no caixa. Aparece na relação com a família, no clima interno e na capacidade de planejar.",
        cta: "Avaliar impacto da inadimplência",
      },
      solucao: {
        title: "Como o Educbank sustenta a saúde financeira da escola",
        subtitle: "Módulos que substituem uma operação de cobrança informal.",
        body: "Cada frente pensada para escolas que querem crescer sem depender do boleto individual.",
        cta: "Planejar o financeiro com mais clareza",
        cards: [
          { title: "Garantia de recebimento", text: "Mensalidades pagas independentemente da inadimplência." },
          { title: "Régua de cobrança", text: "Comunicação padronizada com a família." },
          { title: "Portal do responsável", text: "Transparência de boletos e histórico." },
          { title: "Antecipação", text: "Capital de giro sem depender de banco." },
          { title: "Relatórios financeiros", text: "Visão consolidada para o mantenedor." },
        ],
      },
      projeto: {
        title: "Antes e depois: uma escola que virou a chave financeira",
        subtitle: "Recorte real de reorganização de caixa em um ciclo.",
        body: "Sair de operação artesanal de cobrança para um fluxo previsível muda a estratégia inteira.",
        cta: "Entender possibilidades para sua escola",
        cards: [
          { title: "Antes", text: "Caixa oscilante, cobrança ad hoc, tensão com famílias." },
          { title: "Depois", text: "Receita previsível, cobrança institucional, foco no pedagógico." },
        ],
      },
      convite: {
        title: "Podemos conversar sobre o financeiro da sua escola?",
        subtitle: "20 minutos para entender o momento atual e o que faria diferença.",
        body: "Se fizer sentido, preparamos uma leitura personalizada com base no perfil da instituição.",
        cta: "Marcar uma conversa",
      },
    },
  },

  nareco: {
    id: "nareco",
    name: "NAR ECO",
    logoText: "NAR ECO",
    tagline: "Diagnóstico · Crescimento · Estratégia comercial",
    palette: {
      primary: "#1F2937",
      secondary: "#B08D57",
      accent: "#065F46",
      graphite: "#1F2937",
      light: "#F5F5F2",
      white: "#FFFFFF",
    },
    contato: "(11) 93278-9123",
    site: "www.nareco.com.br",
    whatsappUrl: WHATSAPP_RUFINO,
    defaultCTAs: [
      "Conversar sobre crescimento",
      "Diagnosticar oportunidades",
      "Avaliar próximos passos",
      "Organizar uma estratégia comercial",
    ],
    templateOverrides: {
      campanha: {
        title: "Sua escola crescendo com método, não com sorte",
        subtitle: "Consultoria de captação, retenção e inteligência comercial para instituições de ensino.",
        body: "A NAR ECO atua ao lado da gestão para transformar oportunidades soltas em uma máquina comercial previsível.",
        cta: "Organizar uma estratégia comercial",
        cards: [
          { title: "Captação", text: "Funil comercial estruturado, do primeiro contato à matrícula." },
          { title: "Retenção", text: "Redução de evasão com processos claros de acompanhamento." },
          { title: "Parcerias", text: "Ecossistema de fornecedores e frentes complementares." },
        ],
      },
      consultivo: {
        title: "Sua escola está crescendo por método ou por acaso?",
        subtitle: "Reflexão para mantenedores e diretores que respondem por resultado.",
        body: "Muitas escolas crescem por reputação. O problema é depender de algo que não se controla. Método comercial é sobre repetir com previsibilidade.",
        cta: "Diagnosticar oportunidades",
      },
      solucao: {
        title: "Frentes onde a NAR ECO acelera crescimento",
        subtitle: "Consultoria com foco em resultado, não em relatório.",
        body: "Cada frente pensada para escolas que querem previsibilidade, não experimentação.",
        cta: "Avaliar próximos passos",
        cards: [
          { title: "Diagnóstico comercial", text: "Leitura do funil, conversões e gargalos." },
          { title: "Captação", text: "Processo de matrícula com etapas claras." },
          { title: "Retenção", text: "Régua de acompanhamento e satisfação." },
          { title: "Parcerias", text: "Frentes complementares com Eduinfo, Gennera, EcoClear, Educbank." },
          { title: "Time comercial", text: "Formação e ritual de gestão." },
        ],
      },
      projeto: {
        title: "Antes e depois de estruturar a operação comercial da escola",
        subtitle: "Recorte de um projeto de 90 dias de reposicionamento.",
        body: "De atendimento reativo para funil estruturado. De campanha isolada para calendário comercial.",
        cta: "Conversar sobre crescimento",
        cards: [
          { title: "Antes", text: "Captação reativa, sem visibilidade de funil." },
          { title: "Depois", text: "Processo comercial repetível, com metas e ritual." },
        ],
      },
      convite: {
        title: "Podemos conversar 20 minutos sobre a sua escola?",
        subtitle: "Uma leitura rápida para entender o momento e onde há oportunidade.",
        body: "Se fizer sentido, monto um recorte inicial de diagnóstico para você.",
        cta: "Marcar uma conversa",
      },
    },
  },
};

export const BRAND_LIST: BrandConfig[] = [
  BRANDS.eduinfo,
  BRANDS.gennera,
  BRANDS.ecoclear,
  BRANDS.educbank,
  BRANDS.nareco,
];

export function getBrand(id?: BrandId | string | null): BrandConfig {
  if (id && (id as BrandId) in BRANDS) return BRANDS[id as BrandId];
  return BRANDS.eduinfo;
}
