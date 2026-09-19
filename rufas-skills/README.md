# rufas-skills

Fonte canônica (source-of-authoring) das skills do agente **Rufas**. Este diretório vive no repositório de projeto, não no runtime — ele é onde skills são escritas, revisadas e versionadas antes de irem para o runtime real do Hermes.

## Governança — SOURCE vs. RUNTIME

```
SOURCE
rufas-skills/
  → review
  → version
  → approval
  → install

RUNTIME
/home/hermes/.hermes/skills/
```

**Nunca editar o runtime diretamente como método normal de autoria.** Toda mudança de skill nasce aqui, passa por revisão e versionamento, recebe aprovação explícita, e só então é instalada no runtime — nunca o caminho inverso. Uma edição feita direto no runtime, sem passar por `rufas-skills/`, é dívida técnica desde o momento em que é escrita (fica sem histórico, sem review, e diverge da fonte na primeira sincronização).

## O que toda skill deve declarar

Cada skill em `rufas-skills/` tem, no seu `SKILL.md` ou em metadata associada:

- **owner** — quem é responsável por essa skill.
- **purpose** — o que ela resolve, em uma frase.
- **scope** — o que está dentro e fora do seu domínio.
- **allowed tools** — o que ela pode usar/executar.
- **prohibited tools** — o que ela nunca deve usar/executar.
- **entry conditions** — quando ela deve ativar.
- **exit conditions** — quando ela deve considerar a tarefa concluída.
- **rollback/abort conditions** — quando aplicável (skills operacionais quase sempre têm; skills de pesquisa nem sempre).
- **version** — versão da skill.
- **last reviewed** — data da última revisão humana.

Toda nova skill deve ter description curta (<60 caracteres), usada apenas como trigger de roteamento. Detalhamento pertence ao corpo do `SKILL.md`.

## Princípios — não duplicar o SOUL

As skills **referenciam** os princípios centrais do agente (constituição/SOUL do Rufas) — elas nunca copiam ou reescrevem esses princípios dentro de si. Se uma skill precisa de um princípio geral do agente, ela aponta para onde ele vive, não o transcreve. Isso evita que a constituição do agente fique fragmentada e divergente entre skills.

## O que nunca vai dentro de uma skill

`USER`, `MEMORY`, secrets, credentials, ou qualquer estado operacional (dados de uma conta/proposta/conversa real) nunca são colocados dentro de uma skill. Skills são **comportamento reutilizável**, não armazenamento de dado real — dado real vive em memória/CRM/banco, referenciado pela skill quando necessário, nunca copiado para dentro dela.

## Estrutura deste diretório

```
rufas-skills/
├── README.md                          — este arquivo
├── SKILLS_REGISTRY.md                 — registro de todas as skills, status e escopo de execução
├── runtime-audit-report.md            — último relatório de auditoria do runtime (somente leitura)
├── audit_hermes_skills.sh             — script de auditoria read-only do runtime
├── n8n-workflow-engineering/          — skill: engenharia segura de workflows n8n
├── automation-incident-recovery/      — skill: diagnóstico e recovery de incidentes operacionais
├── educational-opportunity-discovery-brazil/  — skill: descoberta e qualificação de sinal comercial (DRAFT)
└── _archive/                          — skills descontinuadas ou substituídas, preservadas por histórico
```

## Formato real de skill (compatível com o runtime Hermes)

Confirmado a partir de skills reais inspecionadas como referência de formato (`nar-eco-n8n-ops`, `rufino-linkedin-n8n-ops`): frontmatter YAML com **apenas** `name` e `description` — sem campos de schema/manifest adicionais inventados. `description` é o mecanismo real de ativação: precisa ser específico o bastante para disparar a skill certa e citar explicitamente o que a skill NÃO cobre, para não competir com skills vizinhas.

Estrutura de arquivos de apoio observada nas skills reais (usada apenas quando agrega valor real, nunca por padrão obrigatório):

```
<skill-name>/
├── SKILL.md              — obrigatório; controlador enxuto
├── CHANGELOG.md           — opcional; histórico de versões da skill
├── references/            — opcional; detalhe extenso, carregado sob demanda (progressive disclosure)
├── examples/               — opcional; exemplos concretos de input/output
├── schemas/                — opcional; contratos JSON/OpenAPI quando a skill define contratos de dados
└── templates/              — opcional; checklists e templates reutilizáveis
```

`n8n-workflow-engineering`, `automation-incident-recovery` e `educational-opportunity-discovery-brazil` seguem esse formato exatamente — nenhum campo de manifest, metadata JSON, ou schema de skill foi inventado além do que já existe nas skills reais observadas.

## Skills planejadas (não criadas nesta etapa)

Registradas aqui para não perder o contexto, mas **não implementadas ainda**:

- `integration-composio-operator`
- `commercial-outreach-preparation`

Cada uma exige seu próprio ciclo de definição → revisão → aprovação antes de virar código, seguindo o mesmo processo SOURCE→RUNTIME descrito acima.

## Próximo passo recomendado

Rodar `audit_hermes_skills.sh` na VPS onde o runtime real existe (`/home/hermes/.hermes/skills`), revisar `runtime-audit-report.md` gerado, e só depois decidir quais skills antigas/duplicadas devem ser arquivadas em `_archive/` ou substituídas pelas versões canônicas daqui.
