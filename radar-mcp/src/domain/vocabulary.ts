/**
 * Vocabulário auxiliar para CONTRAPROVA léxica.
 *
 * Este arquivo NÃO é o classificador. A classificação semântica é feita pelo
 * agente e entra via `radar.classify_construction`. O que está aqui serve para
 * (a) apontar evidência textual concreta e (b) sinalizar divergência quando o
 * agente afirma algo que o texto não sustenta.
 */

import type { ConstructionStage, ConstructionType } from '../types.js';

/** Termos que sugerem obra/intervenção física. */
export const CONSTRUCTION_TERMS: readonly string[] = [
  'reforma',
  'reformando',
  'reformas',
  'obra',
  'obras',
  'obra em andamento',
  'ampliação',
  'ampliacao',
  'expansão',
  'expansao',
  'novo prédio',
  'novo predio',
  'novo bloco',
  'novo anexo',
  'nova unidade',
  'novo campus',
  'modernização',
  'modernizacao',
  'revitalização',
  'revitalizacao',
  'infraestrutura',
  'nova estrutura',
  'novos espaços',
  'novos espacos',
  'estamos crescendo',
  'um novo capítulo',
  'um novo capitulo',
  'em construção',
  'em construcao',
  'inauguração',
  'inauguracao',
  'nova sede',
];

/** Termos que sugerem contexto de instituição de ensino. */
export const EDUCATION_TERMS: readonly string[] = [
  'colégio',
  'colegio',
  'escola',
  'educação infantil',
  'educacao infantil',
  'ensino fundamental',
  'ensino médio',
  'ensino medio',
  'campus',
  'unidade',
  'alunos',
];

/**
 * Pistas de estágio. Deliberadamente conservador: a ausência de pista não
 * significa ausência de estágio — significa que o texto não permite afirmar.
 */
export const STAGE_HINTS: Record<ConstructionStage, readonly string[]> = {
  S0_VAGUE_SIGNAL: ['novidade', 'vem aí', 'vem ai', 'aguardem', 'em breve'],
  S1_ANNOUNCED: [
    'vamos construir',
    'anunciamos',
    'projeto',
    'será construído',
    'sera construido',
    'aprovado',
    'novo capítulo',
    'novo capitulo',
  ],
  S2_STARTED: [
    'início das obras',
    'inicio das obras',
    'começaram as obras',
    'comecaram as obras',
    'demolição',
    'demolicao',
    'fundação',
    'fundacao',
    'canteiro de obras',
  ],
  S3_CONSTRUCTION_IN_PROGRESS: [
    'obra em andamento',
    'em construção',
    'em construcao',
    'andamento das obras',
    'evolução da obra',
    'evolucao da obra',
    'estrutura levantada',
  ],
  S4_FINISHING: [
    'acabamento',
    'acabamentos',
    'fase final',
    'últimos detalhes',
    'ultimos detalhes',
    'reta final',
    'pintura final',
  ],
  S5_OPENING_SOON: [
    'inauguração em breve',
    'inauguracao em breve',
    'abertura em breve',
    'matrículas abertas para a nova',
    'matriculas abertas para a nova',
    'em breve inauguramos',
  ],
  S6_COMPLETED: [
    'inauguramos',
    'inaugurada',
    'inaugurado',
    'obra concluída',
    'obra concluida',
    'entregue',
    'já está funcionando',
    'ja esta funcionando',
    'pronta para receber',
  ],
};

/** Pistas de tipo de obra. */
export const TYPE_HINTS: Record<ConstructionType, readonly string[]> = {
  renovation: ['reforma', 'reformando', 'reformas', 'revitalização', 'revitalizacao'],
  expansion: ['ampliação', 'ampliacao', 'expansão', 'expansao', 'estamos crescendo'],
  new_building: ['novo prédio', 'novo predio', 'nova sede', 'em construção', 'em construcao'],
  new_block: ['novo bloco', 'novo anexo', 'nova ala'],
  new_unit: ['nova unidade', 'novo campus', 'nova filial'],
  modernization: ['modernização', 'modernizacao', 'nova estrutura', 'novos espaços', 'novos espacos'],
  maintenance: ['manutenção', 'manutencao', 'pintura', 'reparo', 'conserto', 'dedetização', 'dedetizacao'],
  unknown: [],
};

/**
 * Termos que sugerem uso METAFÓRICO de "construir" (projeto pedagógico,
 * construção de conhecimento). Presença aqui derruba a confiança léxica.
 */
export const METAPHOR_TERMS: readonly string[] = [
  'construir conhecimento',
  'construindo conhecimento',
  'construção do conhecimento',
  'construcao do conhecimento',
  'construir o futuro',
  'construindo o futuro',
  'construir cidadania',
  'construção de valores',
  'construcao de valores',
  'construir sonhos',
  'construindo sonhos',
  'projeto pedagógico',
  'projeto pedagogico',
  'construção coletiva',
  'construcao coletiva',
];
