# Diagnóstico de Roteamento — Material_de_Apoio_Comercial

**Arquivo analisado:** `/home/user/nar-crm/.claude/skills/nar-knowledge-curator/evals/fixtures/caso5_material_apoio_comercial.md`
**Pasta atual declarada:** `00_Governanca_e_Arquitetura`
**Data da análise:** 2026-08-08
**Origem do material:** anotações de reuniões comerciais (documento não curado)

---

## 1. Veredito geral

O documento é um **agregado heterogêneo**: um único arquivo que carrega seis blocos de conhecimento
com donos diferentes dentro do NAR ECO. Ele está classificado em `00_Governanca_e_Arquitetura`,
mas **apenas ~2 dos 6 blocos pertencem de fato a essa pasta**. Os demais são conhecimento de marca
(EduInfo, Gennera, Eco Clear) e deveriam estar na base do subagente especialista correspondente.

Consequência prática se nada for feito: o orquestrador (Nathalia Serrano) passa a carregar
conteúdo específico de marca que não é da sua camada, e os subagentes de marca **não encontram**
o material que deveria ser deles (case, link institucional, posicionamento). Isso gera respostas
genéricas do orquestrador e lacunas nos especialistas.

**Recomendação:** dividir (split) o arquivo em 5 destinos, mantendo em
`00_Governanca_e_Arquitetura` apenas o que é transversal ao ecossistema.

---

## 2. Mapa de destino — bloco a bloco

| # | Bloco (linhas) | Natureza | Destino recomendado | Dono |
|---|---|---|---|---|
| 1 | `## Sobre a EduInfo` (6–12) | Posicionamento + ICP + argumento de venda | Base de conhecimento **EduInfo** | Subagente EduInfo |
| 2 | `## Link Gennera` (14–19) | Ativo comercial (URL) + regra de uso do ativo | Base de conhecimento **Gennera** | Subagente Gennera |
| 3 | `## Case Eco Clear` (21–26) | Case de sucesso com números e autorização | Base de conhecimento **Eco Clear** | Subagente Eco Clear |
| 4 | `## Regra comercial NAR ECO` (28–33) | Regra transversal / política de alçada | **Permanece** em `00_Governanca_e_Arquitetura` | Orquestrador (Nathalia) |
| 5 | `## Agendamento` (35–39) | Processo comercial transversal | Governança — processo comercial | Orquestrador (Nathalia) |
| 6 | Regra de cancelamento (41) | Regra operacional de CRM | Segue junto do bloco 5 | Orquestrador (Nathalia) |

---

## 3. Detalhamento por bloco

### Bloco 1 — Sobre a EduInfo → base EduInfo

**Conteúdo:** ICP (escolas de educação básica), posicionamento (solução complementar, não
substitutiva), persona (coordenação pedagógica e secretaria) e o argumento de maior conversão
(implantação sem migração obrigatória de histórico).

**Por que sai da governança:** é discurso de uma marca específica. Não descreve arquitetura do
ecossistema nem regra que valha para as outras marcas. É exatamente o tipo de conteúdo que o
subagente EduInfo precisa ter em memória para responder a um lead.

**Sugestão de arquivo de destino:** algo como `EduInfo/posicionamento-e-icp.md`
(nome exato depende da convenção de pastas já adotada — ver seção 5).

**Cuidado:** a frase "o argumento que mais converte" é uma afirmação empírica vinda de anotação de
reunião, sem fonte. Marcar como *hipótese comercial* até validação, para não virar dado duro.

---

### Bloco 2 — Link Gennera → base Gennera

**Conteúdo:** URL da apresentação institucional 2025 + regra de uso ("enviar somente após a
primeira reunião de diagnóstico, nunca no primeiro contato").

**Por que sai da governança:** é um ativo de marca. A regra de uso viaja **junto com o ativo** —
separar o link da condição de envio é o principal risco deste bloco, porque um link solto sem a
regra vira envio prematuro no primeiro contato.

**Sugestão de destino:** `Gennera/ativos-comerciais.md` (link + regra no mesmo bloco, nunca
separados).

**Atenção — dado perecível:** a URL contém `2025`. Estamos em 2026. **Verificar se a apresentação
institucional 2025 ainda é a versão vigente** antes de promover esse link para a base do subagente.
Se houver versão 2026, o link atual está obsoleto e não deve ser migrado como está.

---

### Bloco 3 — Case Eco Clear → base Eco Clear

**Conteúdo:** Rede Semear, 4 unidades, 2.300 alunos, programa de gestão de resíduos implantado em
2024, redução de 38% em resíduos não recicláveis no 1º ano, selo de certificação ambiental, e a
informação de que **o uso em material comercial foi autorizado**.

**Por que sai da governança:** case de marca, insumo de prova social do subagente Eco Clear.

**Sugestão de destino:** `Eco_Clear/cases/rede-semear.md`.

**Preservar obrigatoriamente na migração:** a linha de autorização de uso. Sem ela, o case vira
material de risco jurídico/reputacional (cliente nomeado + números). A autorização é metadado
crítico, não texto acessório.

**Lacuna a registrar:** não há data nem responsável pela autorização, nem se ela cobre uso público
(site, redes) ou apenas material comercial 1:1. Recomendo anotar como pendência.

---

### Bloco 4 — Regra comercial NAR ECO → PERMANECE em `00_Governanca_e_Arquitetura`

**Conteúdo:** nenhuma proposta sai sem aprovação do responsável comercial da conta; desconto acima
da alçada padrão exige diretoria; vale para EduInfo, Gennera, Eco Clear, Educbank e Vibe Flow.

**Por que fica:** é a única parte do documento que é genuinamente **transversal ao ecossistema**.
O próprio texto se declara aplicável às cinco marcas. Regra de alçada é governança pura e pertence
à camada do orquestrador.

**Recomendação adicional:** essa regra deve ser **referenciada** (não duplicada) pelas bases de
marca. Se cada subagente copiar o texto, cria-se cinco versões que divergem na primeira alteração
de alçada. O padrão correto é: regra mora na governança, subagentes apontam para ela.

**Lacuna a registrar:** "alçada padrão" nunca é quantificada no documento. A regra é inacionável
sem o percentual/valor de corte. É a lacuna mais grave do arquivo inteiro.

---

### Blocos 5 e 6 — Agendamento e cancelamento → governança (processo comercial)

**Conteúdo:** reunião de diagnóstico = 30 min, seg–sex, 9h–18h; reunião de proposta = 60 min,
condicionada a diagnóstico realizado **e registrado**; cancelamento com menos de 4h exige
justificativa no CRM.

**Por que fica na camada transversal:** não há nenhuma menção a marca. É o processo do funil
comercial do ecossistema como um todo, e é operacional para o orquestrador, que é quem agenda.

**Sugestão:** separar do bloco 4 em um documento próprio de **processo comercial / agendamento**,
ainda dentro de `00_Governanca_e_Arquitetura`. Motivo: regra de alçada e regra de agenda têm ciclos
de revisão e donos diferentes; misturá-las no mesmo arquivo repete o erro que gerou este caso.

**Dependência a explicitar:** o bloco 2 (link Gennera só após diagnóstico) depende deste bloco 5
para fazer sentido. Ao migrar o bloco 2 para Gennera, incluir uma referência cruzada ao processo
de agendamento, senão a condição "após a primeira reunião de diagnóstico" fica sem definição.

---

## 4. Ordem de execução sugerida

1. Criar `00_Governanca_e_Arquitetura/regra-comercial-aprovacao-e-alcada.md` (bloco 4).
2. Criar `00_Governanca_e_Arquitetura/processo-comercial-agendamento.md` (blocos 5 e 6).
3. Migrar bloco 1 para a base EduInfo; marcar o argumento de conversão como hipótese.
4. Migrar bloco 2 para a base Gennera **após** validar a vigência da URL 2025.
5. Migrar bloco 3 para a base Eco Clear, preservando a linha de autorização.
6. Só então **aposentar** o arquivo original. Recomendo não deletar de imediato: substituir o
   conteúdo por um índice de redirecionamento apontando os 5 destinos, por um ciclo, para não
   quebrar quem já referencia este caminho.

---

## 5. Ressalvas sobre nomes de pastas

Os caminhos de destino acima são **propostas baseadas no padrão `00_Governanca_e_Arquitetura`**
(prefixo numérico + nome). Não localizei, na inspeção do repositório, a árvore real de pastas da
base de conhecimento — o único indício estrutural encontrado foi o registro de marcas em
`/home/user/nar-crm/src/lib/brands.ts`, que confirma o conjunto de marcas
(`eduinfo`, `gennera`, `ecoclear`, `educbank`, `nareco`), mas não a taxonomia de pastas
documentais. **Confirmar os nomes exatos das pastas de marca antes de executar a migração.**

Observação: `brands.ts` lista `nareco` mas **não** lista Vibe Flow Educacional, enquanto o bloco 4
do documento cita Vibe Flow como marca do ecossistema. Vale checar se Vibe Flow tem base de
conhecimento própria ou se ainda não foi incorporada às estruturas do CRM.

---

## 6. Pendências abertas (para o responsável comercial)

| Pendência | Bloco | Criticidade |
|---|---|---|
| Qual é o valor/percentual da "alçada padrão" de desconto? | 4 | Alta |
| A apresentação institucional Gennera "2025" ainda é a vigente em 2026? | 2 | Alta |
| Data, responsável e escopo da autorização do case Rede Semear | 3 | Média |
| Validar empiricamente o "argumento que mais converte" da EduInfo | 1 | Baixa |
| Vibe Flow Educacional tem base de conhecimento própria? | 4 | Média |

---

*Nenhuma alteração foi feita no arquivo de origem.*
