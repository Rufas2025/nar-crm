# Análise de Curadoria — 02_Playbook_Omnichannel_NAR_ECO

**Arquivo analisado:** `/home/user/nar-crm/.claude/skills/nar-knowledge-curator/evals/fixtures/caso1_playbook_omnichannel.md`
**Pasta declarada no documento:** `00_Governanca_e_Arquitetura`
**Data de análise:** 08/08/2026
**Última atualização informada no documento:** março/2025

---

## Veredito resumido

O documento **está parcialmente no lugar certo**. Ele é, na prática, **três documentos misturados em um só**:

1. Um documento de **governança omnichannel** (correto em `00_Governanca_e_Arquitetura`, pertence ao orquestrador Nathalia Serrano).
2. Um **playbook comercial de produto da EduInfo** (não pertence à governança — deve ir para o agente especialista EduInfo).
3. Um **SOP operacional de agendamento de demonstrações** (não pertence à governança — é processo comercial/agenda).

Recomendação: **manter o arquivo na pasta, mas fatiá-lo (split)**, deixando na governança apenas o que é transversal ao ecossistema e movendo o conteúdo específico de marca/produto e de processo comercial para os agentes donos.

---

## Análise seção a seção

| Seção | Conteúdo | Natureza | Dono correto | Ação |
|---|---|---|---|---|
| 1. Princípios de atendimento omnichannel | Regras válidas em WhatsApp, e-mail e site; SLA de 15 min; LGPD; escalada para humano; persona | **Governança transversal** | Orquestrador (Nathalia Serrano) | **Manter** em `00_Governanca_e_Arquitetura` |
| 2. Roteamento por domínio | Mapa de qual marca atende qual assunto | **Arquitetura de roteamento** | Orquestrador | **Manter** — é o núcleo do papel do orquestrador |
| 3. EduInfo — posicionamento e argumentação | Proposta de valor, módulos, diferenciais, objeções, canais, tom de voz da marca | **Conhecimento de produto/marca** | **Agente especialista EduInfo** | **Mover** |
| 4. Agendamento de demonstrações | Janelas de agenda, critérios de qualificação, no-show, confirmações | **SOP comercial/operacional** | Agente comercial/agendamento (com regra de qualificação possivelmente compartilhada) | **Mover** (ver ressalva abaixo) |
| 5. Encerramento de atendimento | Registro de motivo no CRM e classificação do lead | **Governança de dados/CRM** | Orquestrador (ou agente de CRM, se existir) | **Manter** (transversal a todos os canais e marcas) |

---

## Problemas identificados

### 1. Conteúdo de marca dentro de documento de governança (crítico)

A seção 3 é um **playbook de vendas da EduInfo completo** — proposta de valor, lista de módulos, diferenciais competitivos, três objeções com respostas prontas, canais oficiais e tom de voz próprio. Nada disso é transversal ao ecossistema.

Consequências de manter aqui:

- **Assimetria entre marcas:** a seção 2 cita cinco marcas (EduInfo, Gennera, Eco Clear, Educbank, Vibe Flow Educacional), mas só a EduInfo tem argumentação detalhada. Isso cria a impressão falsa de que a governança é o lugar de detalhar produtos — e convida as outras quatro marcas a inflarem o mesmo documento.
- **Risco de fonte duplicada:** se o agente EduInfo já tem (ou vier a ter) sua própria base de objeções e módulos, passa a existir duas versões da mesma verdade, com atualização em ritmos diferentes.
- **Ruído de recuperação (RAG):** uma consulta sobre governança de atendimento traz junto tabela de módulos e objeções da EduInfo; uma consulta sobre EduInfo pode não achar esse conteúdo, porque ele está indexado sob "governança".

### 2. Conflito de tom de voz entre seções

- Seção 1: "tom cordial e objetivo, **sem uso de emojis** em contexto institucional", conduzido pela persona Nathalia Serrano em **todos** os canais.
- Seção 3: "Tom de voz EduInfo: **mais próximo e didático** que o institucional NAR ECO".

O documento não diz como as duas regras se combinam: a persona muda de tom ao entrar em assunto EduInfo? A proibição de emojis continua valendo? Isso precisa de decisão explícita. A regra de persona/tom **do ecossistema** é governança; a **variação por marca** é do agente da marca — e a governança deveria declarar apenas que variações por marca são permitidas e quais limites são inegociáveis (ex.: LGPD, ausência de emojis institucionais).

### 3. Seção 4 mistura regra geral com responsabilidade de marca

O bloco de agendamento é quase todo genérico (terças e quintas, blocos de 45 min, qualificação obrigatória, corte de 100 alunos, política de no-show, confirmações D-1 e H-1) — mas termina com "Responsável pelas demonstrações de gestão pedagógica: equipe comercial EduInfo", que é atribuição específica de marca.

Além disso, não está claro se as janelas de agenda valem para **todas** as marcas do ecossistema ou só para a EduInfo. Como está escrito no documento da EduInfo em diante, a leitura mais provável é que seja regra EduInfo — mas está redigida como se fosse global. **Essa ambiguidade precisa ser resolvida antes do split**, porque ela determina o destino da seção.

### 4. Conteúdo potencialmente desatualizado

O documento declara última atualização em **março/2025** — cerca de 17 meses antes da data desta análise. Itens de alto risco de defasagem:

- Faixa de entrada "até 300 alunos" e política de preço.
- Lista de módulos disponíveis.
- Prazo de "implantação em 30 dias".
- Canais oficiais (`@eduinfo.oficial`).
- SLA de 15 minutos (é sustentável hoje?).

Nada disso deve ser migrado para o agente EduInfo sem revalidação com a área responsável.

### 5. Nome do arquivo não reflete o conteúdo

O título é "Playbook Omnichannel", mas quase metade do corpo é playbook comercial de produto. Depois do split, o nome passa a ser fiel.

---

## Plano de split recomendado

### A) Permanece em `00_Governanca_e_Arquitetura` — dono: orquestrador (Nathalia Serrano)

Documento enxuto, mantendo o mesmo nome `02_Playbook_Omnichannel_NAR_ECO`:

- Seção 1 — Princípios de atendimento omnichannel (integral).
- Seção 2 — Roteamento por domínio (integral; é a matriz de decisão do orquestrador).
- Seção 5 — Encerramento de atendimento e classificação de lead no CRM.
- **Adicionar:** uma regra explícita sobre precedência entre tom institucional e tom de marca.
- **Adicionar:** ponteiros ("ver base do agente EduInfo") no lugar do conteúdo removido, para não perder a rastreabilidade.

### B) Vai para o agente especialista **EduInfo**

Toda a seção 3, preservada como está, mais o item de responsabilidade de demonstração da seção 4:

- Posicionamento e público-alvo.
- Proposta de valor.
- Módulos disponíveis.
- Diferenciais competitivos.
- Objeções frequentes e respostas.
- Canais oficiais.
- Tom de voz EduInfo (declarado como *variação* sobre o tom institucional, não como regra independente).
- "Responsável pelas demonstrações de gestão pedagógica: equipe comercial EduInfo".

### C) Vai para o agente comercial / de agendamento

Seção 4, menos a atribuição de responsabilidade da EduInfo:

- Janelas e duração das demonstrações.
- Checklist de qualificação obrigatória (alunos, sistema atual, poder de decisão).
- Regra de corte para escolas com menos de 100 alunos.
- Política de reagendamento, cancelamento e no-show.
- Cadência de confirmação (D-1 e H-1) e liberação da agenda.

**Se não existir um agente comercial/agendamento dedicado no ecossistema**, a seção 4 deve ir integralmente para o agente EduInfo (escopo mais estreito e verificável) e **não** permanecer na governança — a governança só deveria guardar a regra se ela for comprovadamente válida para as cinco marcas.

---

## Perguntas a resolver antes de executar o split

1. As janelas de agendamento (terças/quintas, 45 min) e a política de no-show valem para **todo** o ecossistema ou apenas para a EduInfo?
2. Existe um agente comercial/de agendamento separado, ou o agendamento é atribuição de cada agente de marca?
3. O tom de voz por marca sobrepõe ou apenas ajusta o tom institucional definido na seção 1? Qual regra vence em conflito?
4. As demais quatro marcas (Gennera, Eco Clear, Educbank, Vibe Flow) já possuem base própria com o mesmo nível de detalhe da EduInfo? Se sim, este conteúdo é duplicata; se não, há lacuna a preencher.
5. O conteúdo de março/2025 foi revalidado? Especificamente preço/faixa, módulos, prazo de implantação e SLA.

---

## Resposta direta à pergunta

**Está no lugar certo?** Parcialmente. Cerca de **metade** do documento é governança legítima e deve ficar onde está. A outra metade — seção 3 (EduInfo) e seção 4 (agendamento) — é conteúdo de agente especialista alojado indevidamente na camada de governança.

**Ação recomendada:** fatiar o documento em três, mantendo em `00_Governanca_e_Arquitetura` apenas princípios omnichannel, roteamento por domínio e encerramento/CRM; mover o bloco EduInfo para o agente da marca; mover o SOP de agendamento para o agente comercial (ou, na ausência dele, para a EduInfo). Revalidar datas e números antes de publicar as novas versões.

*O arquivo de origem não foi modificado.*
