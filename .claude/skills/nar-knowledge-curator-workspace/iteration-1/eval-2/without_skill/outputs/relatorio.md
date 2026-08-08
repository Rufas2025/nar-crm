# Diagnóstico do system prompt da Nathalia Serrano

**Arquivo analisado:** `/home/user/nar-crm/.claude/skills/nar-knowledge-curator/evals/fixtures/caso3_base_de_prompt_do_agente.md`
**Tamanho atual:** 115 linhas / ~5,1 KB, 11 seções
**Data:** 2026-08-08

---

## 1. Resumo executivo

O documento não está apenas "grande" — ele está **misturando quatro tipos de conteúdo que têm ciclos de vida, donos e destinos diferentes**:

1. **Identidade e comportamento do orquestrador** (quem é a Nathalia, como fala, o que nunca faz)
2. **Conhecimento de marca** (5 marcas, com produtos, condições, objeções, cases, canais)
3. **Regras operacionais de agenda** (dias, durações, no-show, confirmação)
4. **Contrato técnico de integração** (Evolution GO, n8n, campos de payload, fila de retry)

Só o item 1 é, de fato, system prompt. Os itens 2, 3 e 4 são conhecimento consultável — devem ser recuperados sob demanda (subagente de marca, doc de agenda, doc técnico), não carregados em todo turno.

**Efeito prático hoje:** o agente carrega ~100% do conhecimento de 5 marcas para responder uma pergunta que envolve 1 marca. Isso explica os dois sintomas relatados:

- **Lentidão** — todo turno paga o custo de contexto integral, inclusive turnos triviais ("atendem qual região?").
- **Mistura de marcas** — as 5 marcas estão no mesmo contexto, no mesmo nível hierárquico, com vocabulário fortemente sobreposto ("escola", "implantação", "educacional", "migração"). Sem fronteira explícita entre elas, o modelo recupera por similaridade e cruza atributos entre marcas vizinhas.

---

## 2. A causa raiz da mistura de marcas

Não é "prompt longo" — é **ausência de fronteira de marca**. Três agravantes concretos no texto atual:

**a) Atributos genéricos e colidentes lado a lado.**
"Implantação em 30 dias" (EduInfo, linha 31) e "Implantação com migração de dados e treinamento" (Gennera, linha 42) são o mesmo campo semântico com valores diferentes, separados só por um cabeçalho `###`. É exatamente o tipo de par que vaza — o agente responde "implantação em 30 dias" para Gennera.

**b) Objeções escritas de forma intercambiável.**
EduInfo tem `"já temos sistema"` → *integra, não substitui* (linha 35). Gennera tem `"já investimos no sistema atual"` → *comparar custo total* (linha 47). São a mesma objeção do cliente com respostas **opostas em posicionamento** (complementa × substitui). Enquanto as duas convivem no mesmo contexto, o agente vai escolher a errada com frequência.

**c) Regras globais sem escopo declarado.**
Só a seção REGRAS COMERCIAIS diz explicitamente "vale para todas as marcas" (linha 103). Por contraste, isso sugere que as demais **não** valem — mas nenhuma delas declara escopo. Em especial:
- FAQ "Qual o menor porte atendido?" (linha 77) responde citando EduInfo. É resposta de marca vestida de resposta do ecossistema.
- "Escolas com menos de 100 alunos recebem material gravado" (linha 93) está escrito como regra universal. Se for regra só de uma marca, é um erro de negócio; se for universal, precisa dizer isso.

**Conclusão:** enquanto as 5 marcas estiverem no mesmo prompt, encurtá-lo reduz a lentidão mas **não** resolve a mistura. A separação por subagente é o que resolve.

---

## 3. Decisão seção por seção

| # | Seção (linhas) | Decisão | Destino | Por quê |
|---|---|---|---|---|
| 1 | IDENTIDADE (8–12) | **FICA** | System prompt | Define o papel do orquestrador. Sempre relevante. |
| 2 | TOM DE VOZ (14–18) | **FICA** | System prompt | Guardrails de comportamento. Precisam valer em 100% dos turnos, inclusive nos subagentes (herdar). |
| 3 | COMO CLASSIFICAR A INTENÇÃO (20–24) | **FICA** (reforçar) | System prompt | É a função central do orquestrador. Hoje está subdesenvolvida: classifica intenção mas **não** roteia por marca. |
| 4 | SOLUÇÕES DO ECOSSISTEMA (26–66) | **QUEBRA** | 1 linha de roteamento por marca fica; todo o resto vai para `01_EduInfo` … `05_Vibe_Flow_Educacional` | Maior bloco do documento e origem direta da mistura de marcas. |
| 5 | FAQ GERAL (68–78) | **QUEBRA** | 3 perguntas ficam; "menor porte" vai para a marca | Perguntas sobre o ecossistema são do orquestrador; a que responde citando EduInfo não é. |
| 6 | REDES SOCIAIS E CANAIS (80–87) | **QUEBRA** | Só NAR ECO fica; os demais vão para o doc de cada marca | Canal é atributo de marca. Também está duplicado (EduInfo aparece nas linhas 33 e 83 — fonte dupla, risco de divergir). |
| 7 | REGRAS DE AGENDAMENTO (89–98) | **SAI** | `06_Agenda` | Domínio próprio, dono próprio, muda por conta própria (horários, durações, política de no-show). Consultado só quando a intenção é agendamento. |
| 8 | REGRAS COMERCIAIS (100–103) | **FICA** | System prompt | Curto, transversal e é um **freio**: "nenhuma proposta sem aprovação". Freio não pode depender de recuperação — se falhar a busca, o agente age sem ele. |
| 9 | INTEGRAÇÃO OPERACIONAL (105–109) | **SAI** | Documentação técnica do workflow n8n / runbook | O agente conversacional não escolhe campos de payload nem opera fila de retry. Isso é contrato de sistema, não instrução de conversa. Único resíduo útil: "toda conversa encerrada precisa registrar motivo e classificação" — e mesmo isso é melhor como schema da tool de encerramento. |
| 10 | GOVERNANÇA E LGPD (111–115) | **FICA** | System prompt | Compliance. Mesma lógica do item 8: é freio, precisa ser incondicional. Parcialmente duplicado com TOM DE VOZ (linhas 17–18) — consolidar em um lugar só. |

---

## 4. O que sobra: esqueleto do system prompt enxuto

Ordem sugerida — identidade, freios, roteamento. Estimativa: **~35 linhas** contra as 115 atuais (redução de ~70%), e o que sai não é perdido, é realocado.

```
## IDENTIDADE
[linhas 10–12, sem alteração]

## TOM DE VOZ E LIMITES
[linhas 16–18, consolidado com o trecho de LGPD que repete o mesmo]

## FREIOS INVIOLÁVEIS  (sempre ativos, valem para todas as marcas)
- Nenhuma proposta sem aprovação do responsável comercial da conta.
- Desconto acima da alçada padrão exige aprovação de diretoria.
- Não solicitar dados pessoais de alunos ou responsáveis em pré-venda.
- Pedido de exclusão de dados → encarregado de dados.
- Reclamação formal ou menção a órgão regulador → escalar para humano, imediatamente.
- Nunca prometer prazo, preço ou capacidade não confirmados.

## CLASSIFICAÇÃO E ROTEAMENTO
Passo 1 — intenção: informação | proposta | agendamento | suporte a cliente | reclamação.
Passo 2 — domínio:
  - Gestão pedagógica, secretaria digital, escola que já tem sistema e quer complementar → EduInfo
  - ERP educacional completo, substituição integral do sistema de gestão, rede → Gennera
  - Resíduos, certificação ambiental, sustentabilidade → Eco Clear
  - Inadimplência, garantia de mensalidade, antecipação de recebíveis → Educbank
  - Formação de professores, clima organizacional, liderança pedagógica → Vibe Flow Educacional
  - Agendamento de demo, diagnóstico ou proposta → regras de Agenda
Passo 3 — acionar o especialista do domínio. Não responder detalhe de produto,
condição comercial, prazo, objeção ou canal de marca a partir deste prompt.
Se dois domínios forem plausíveis, perguntar antes de assumir.

## FAQ DO ECOSSISTEMA (só o que é do NAR ECO)
- "Vocês são uma empresa só?" → [linha 70–71]
- "Atendem qual região?" → [linha 73]
- "Trabalham com escola pública?" → [linha 75]
- Canal institucional: naareco.com.br, LinkedIn NAR ECO Soluções
```

**A regra do Passo 3 é o item mais importante desta reescrita.** É a proibição explícita que impede o orquestrador de improvisar sobre marca a partir de memória residual — sem ela, encurtar o prompt tende a *piorar* a precisão, porque o agente responde de qualquer jeito com o pouco que sobrou.

---

## 5. Critério reutilizável: os três filtros

Para decidir o que fica em qualquer system prompt do NAR ECO daqui pra frente:

1. **Filtro da frequência** — isso é necessário em ≥80% dos turnos? Identidade, tom e freios: sim. Prazo de implantação da Gennera: não.
2. **Filtro do dono** — quem aprova mudanças neste trecho? Se o dono não é a governança do orquestrador, o trecho pertence ao doc do dono (marca, agenda, técnico).
3. **Filtro do freio** — se o agente *não* tivesse esta informação, ele erraria ou apenas ficaria sem saber? "Sem saber" é aceitável e recuperável (o subagente responde). **Errar com confiança não é** — freios e regras de compliance ficam no prompt mesmo sendo pouco frequentes.

Notar que os filtros 1 e 3 se opõem de propósito: REGRAS COMERCIAIS é rara, mas fica, porque o custo do erro é alto.

---

## 6. Riscos e pontos de atenção na migração

- **Duplicação a resolver antes de mover.** EduInfo aparece em dois lugares (linhas 33 e 83) e LGPD/dados pessoais em dois (linhas 17–18 e 113). Mover sem consolidar cria duas fontes que vão divergir.
- **Regra dos 100 alunos (linha 93) precisa de decisão de negócio**, não de curadoria: é regra do ecossistema ou de uma marca? Está ambígua hoje e vai continuar ambígua depois da divisão se ninguém decidir.
- **Demo × diagnóstico × proposta** têm janelas diferentes (terça/quinta 9–17 × seg-sex 9–18 × só após diagnóstico). Não é contradição, mas o orquestrador precisa distinguir os três tipos de reunião antes de encaminhar à Agenda — vale explicitar isso no roteamento.
- **Herança de guardrails.** Tom de voz, freios comerciais e LGPD precisam valer também dentro de cada subagente de marca. Se cada subagente tiver system prompt próprio, esses blocos precisam ser herdados/replicados de forma controlada — senão o vazamento some, mas aparece um problema pior: subagente vendendo sem freio.
- **Não transformar isto em corte cego.** O ganho vem de *realocar* com destino e dono definidos. Deletar 70% do prompt sem criar os docs de marca troca "agente confuso" por "agente que não sabe nada".

---

## 7. Ordem de execução sugerida

1. Consolidar as duplicações (EduInfo/canais, LGPD) — decisão de fonte única.
2. Extrair os 5 blocos de marca para `01_EduInfo` … `05_Vibe_Flow_Educacional`, cada um levando: posicionamento, produtos/módulos, condições, objeções, cases, canais, FAQ de marca.
3. Extrair REGRAS DE AGENDAMENTO para `06_Agenda`.
4. Extrair INTEGRAÇÃO OPERACIONAL para a documentação técnica do workflow.
5. Reescrever o system prompt no formato da seção 4, com o Passo 3 (proibição de responder marca) explícito.
6. Validar com casos de teste cruzados — perguntar prazo de implantação da Gennera, objeção "já temos sistema" sem dizer a marca, porte mínimo — e conferir se o agente roteia em vez de responder.
