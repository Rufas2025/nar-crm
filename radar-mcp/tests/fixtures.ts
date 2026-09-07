/**
 * Os 9 cenários exigidos pela especificação de testes.
 * Textos sintéticos, escritos para o teste — não são publicações reais de
 * nenhuma instituição identificável.
 */

import type { AgentClaim } from '../src/domain/classification.js';

export interface Fixture {
  id: string;
  label: string;
  raw_text: string;
  /** O que o agente afirmaria ao analisar este texto. */
  claim: AgentClaim;
  /** Divergências que a contraprova léxica DEVE apontar. */
  expect_disagreements: 'none' | 'some';
}

export const FIXTURES: Fixture[] = [
  {
    id: 'f1_new_block_announced',
    label: 'escola anunciando novo bloco',
    raw_text:
      'Estamos muito felizes em anunciar: nosso colégio vai construir um novo bloco ' +
      'para o ensino fundamental. O projeto foi aprovado e as obras começam no próximo semestre. ' +
      'Mais espaço e conforto para nossos alunos!',
    claim: {
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'new_block',
      construction_stage: 'S1_ANNOUNCED',
      confidence: 0.9,
    },
    expect_disagreements: 'none',
  },
  {
    id: 'f2_renovation_in_progress',
    label: 'escola em reforma real',
    raw_text:
      'A reforma da nossa escola segue em ritmo acelerado! Obra em andamento no pátio ' +
      'e nas salas de educação infantil. Acompanhem a evolução da obra pelas nossas redes.',
    claim: {
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'renovation',
      construction_stage: 'S3_CONSTRUCTION_IN_PROGRESS',
      confidence: 0.88,
    },
    expect_disagreements: 'none',
  },
  {
    id: 'f3_simple_maintenance',
    label: 'manutenção/pintura simples',
    raw_text:
      'Durante as férias fizemos a manutenção anual: pintura das salas e pequenos reparos. ' +
      'Tudo pronto para receber nossos alunos no retorno às aulas.',
    claim: {
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'maintenance',
      construction_stage: 'S6_COMPLETED',
      confidence: 0.75,
    },
    expect_disagreements: 'none',
  },
  {
    id: 'f4_pedagogical_metaphor',
    label: 'projeto pedagógico usando a palavra construir',
    raw_text:
      'No nosso colégio acreditamos em construir conhecimento junto com as famílias. ' +
      'O projeto pedagógico deste ano tem como tema construir o futuro que queremos ver, ' +
      'com foco na construção de valores e cidadania entre os alunos.',
    // O agente ERRA aqui de propósito: o teste valida que a contraprova pega.
    claim: {
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'new_building',
      construction_stage: 'S1_ANNOUNCED',
      confidence: 0.7,
    },
    expect_disagreements: 'some',
  },
  {
    id: 'f5_completed',
    label: 'obra já concluída',
    raw_text:
      'Inauguramos nosso novo prédio! A obra foi concluída e a nova ala já está funcionando, ' +
      'pronta para receber as turmas do ensino médio.',
    claim: {
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'new_building',
      construction_stage: 'S6_COMPLETED',
      confidence: 0.92,
    },
    expect_disagreements: 'none',
  },
  {
    id: 'f6_contractor_unclear_school',
    label: 'construtora mencionando escola sem identificação clara',
    raw_text:
      'Mais uma entrega da nossa equipe: obra de ampliação finalizada dentro do prazo. ' +
      'Orgulho de participar de projetos que transformam espaços.',
    // Agente afirma que é instituição de ensino sem base textual.
    claim: {
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'expansion',
      construction_stage: 'S6_COMPLETED',
      confidence: 0.6,
    },
    expect_disagreements: 'some',
  },
  {
    id: 'f7_duplicate_signal',
    label: 'sinal duplicado',
    raw_text:
      'A reforma da nossa escola segue em ritmo acelerado! Obra em andamento no pátio ' +
      'e nas salas de educação infantil. Acompanhem a evolução da obra pelas nossas redes.',
    claim: {
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'renovation',
      construction_stage: 'S3_CONSTRUCTION_IN_PROGRESS',
      confidence: 0.88,
    },
    expect_disagreements: 'none',
  },
  {
    id: 'f8_url_only_no_text',
    label: 'sinal só com URL, sem texto',
    raw_text: '',
    claim: {
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'expansion',
      construction_stage: 'S2_STARTED',
      confidence: 0.85,
    },
    expect_disagreements: 'some',
  },
  {
    id: 'f9_stage_not_supported',
    label: 'estágio afirmado sem sustentação textual',
    raw_text:
      'Nosso colégio está em obras: inauguramos em breve a nova unidade. ' +
      'Aguardem novidades sobre a inauguração.',
    // Afirma "em andamento" quando o texto aponta "opening soon".
    claim: {
      is_educational_institution: true,
      construction_detected: true,
      construction_type: 'new_unit',
      construction_stage: 'S3_CONSTRUCTION_IN_PROGRESS',
      confidence: 0.8,
    },
    expect_disagreements: 'some',
  },
];

/** Cenários de contato para os testes de verificação (itens 8 e 9). */
export const CONTACT_FIXTURES = [
  {
    id: 'c1_no_source',
    label: 'contato sem fonte',
    contact: {
      name: 'Fulano da Silva',
      role: 'Diretor',
      email: 'diretor@exemplo-colegio.com.br',
      verification_status: 'public_source' as const,
      source_url: '',
    },
    expect_rejected: true,
    expect_reason: 'source_url_invalido_ou_ausente',
  },
  {
    id: 'c2_inferred_email',
    label: 'email inferido marcado como verified',
    contact: {
      name: 'Beltrano Souza',
      role: 'Coordenador',
      email: null,
      phone: null,
      verification_status: 'verified' as const,
      source_url: 'https://exemplo-colegio.com.br/contato',
    },
    expect_rejected: true,
    expect_reason: 'verified_exige_email_ou_telefone_real',
  },
];
