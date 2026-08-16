# NAR Product UX — Especificação completa

Texto de referência integral das regras de produto do CRM NAR. O `SKILL.md` traz o resumo
operacional; este arquivo é a fonte de detalhe para citação literal ou casos de borda.

## 1. Gatilhos de ativação

Aciona automaticamente sempre que a tarefa envolver: nova feature no CRM NAR, alteração de UX,
fluxo de usuário, Email Studio, campanhas, cadências, destinatários, lotes, personalização,
saudação, templates, imported_html, previews, drafts Gmail, batch, formulários, modais,
seletores, estados vazios, feedback de erro/sucesso, navegação, decisões de produto.

## 2. Relação com outras skills

Quando a tarefa envolver UI/UX ou frontend, consultar também `ui-ux-pro-max` e `frontend-design`.
Se `web-quality-skills` estiver disponível, consultar também quando houver: responsividade,
acessibilidade, performance, formulários, modais, scroll, foco, teclado, qualidade web.

`nar-product-ux` define as regras de domínio do NAR. As outras skills definem boas práticas
genéricas. Em conflito: as regras específicas e explícitas do produto NAR têm prioridade sobre
recomendações genéricas, desde que não violem segurança, acessibilidade ou requisitos técnicos
obrigatórios.

## 3. Princípios de UX do NAR

Mínimo esforço do usuário; defaults inteligentes; override manual quando a decisão importa;
progressive disclosure; preview antes de ação relevante; esconder complexidade técnica; feedback
curto e acionável; consistência entre fluxos; reutilizar padrões já existentes; evitar telas e
controles duplicados; evitar etapas desnecessárias; preservar contexto do usuário; não expor
detalhes internos do sistema.

Antes de implementar a primeira solução tecnicamente válida, perguntar internamente: "Existe uma
UX mais simples, previsível ou inteligente?"

## 4. Default inteligente + controle

O NAR pode sugerir decisões automaticamente, mas não deve retirar controle quando a decisão
altera comunicação, destinatários ou resultado final.

Exemplo oficial — Saudação:

```
Informal: Olá, Nathalia!
Formal:   Olá, Diretora Nathalia!
```

Default: influente → Informal; decisor com cargo formal elegível → Formal; situação ambígua →
Informal. Usuário pode trocar com 1 clique.

## 5. Regras de saudação

Contrato interno: `{{SAUDACAO}}`. Não expor esse placeholder na UX final.

```
Informal: Olá, <strong>PrimeiroNome</strong>!
Formal:   Olá, [CARGO FORMAL] <strong>PrimeiroNome</strong>!
```

Cargos formais elegíveis nesta fase: Diretor, Diretora, Mantenedor, Mantenedora.

Não usar automaticamente: Coordenador, Coordenadora, Coordenador de TI, Coordenadora de TI,
Vice-Diretor, Vice-Diretora, Direção, cargos compostos, cargos técnicos.

`cargo_original` nunca deve ser despejado diretamente na saudação.

Exemplos proibidos:
```
Olá, Diretora TI Nathalia!
Olá, Diretor / Vice-Diretor Adriana!
```

Não inferir gênero pelo primeiro nome.

## 6. Decisor vs. influente

Classificação de produto importante.

Influente: default de saudação = Informal; não aplicar formalidade automaticamente apenas por
`cargo_original`.

Decisor: se houver Diretor/Diretora/Mantenedor/Mantenedora validado, pode sugerir Formal;
usuário ainda pode escolher Informal.

Nunca tratar cargo isoladamente como prova suficiente de papel decisório se a classificação
existente disser o contrário.

## 7. Preview = resultado final

O que o usuário vê no preview deve ser o que chega ao resultado final. Aplicar a: Email Studio,
HTML importado, structured templates, draft individual, draft de teste, batch. Não manter um
resolvedor para preview e outro diferente para envio quando puder existir uma única fonte de
verdade.

## 8. Individual = batch

Toda lógica de personalização deve ter paridade entre: preview, draft de teste, draft individual,
lote/batch. Cada destinatário usa seus próprios dados. Nunca permitir vazamento de nome, cargo,
escola, artigo, saudação ou email entre destinatários.

## 9. imported_html

Templates `imported_html` fazem parte do produto e devem reutilizar o contrato oficial de
personalização. Placeholders oficiais existentes incluem `{{SAUDACAO}}`, `{{NOME}}`, `{{CARGO}}`,
`{{ARTIGO}}`, `{{COLEGIO}}` e aliases já suportados pelo sistema. Não criar placeholders novos se
já houver equivalente oficial.

Imported HTML deve continuar sandboxed. Não enfraquecer sandbox para resolver problema de UX.
Não inserir JavaScript ou mecanismos inseguros.

## 10. Instituição

Quando o nome da instituição/escola for personalizado no conteúdo, preservar o padrão visual
aprovado de instituição em negrito quando aplicável. Não deixar placeholder literal no HTML
final.

## 11. Não expor detalhes técnicos

A UX não deve exigir que o usuário entenda: placeholder, `cargo_original`, ID interno, código
interno de lote, edge function, payload, schema, nomes de coluna, lógica de fallback.

Exemplo: se houver colisão de código de lote, o CRM deve gerar automaticamente um próximo código
seguro quando possível. Não mostrar "Use outro código." Resolver internamente.

## 12. Lotes

Preservar lotes existentes. Nunca sobrescrever lote anterior quando o conjunto de destinatários
for diferente. Se houver colisão técnica de código: gerar novo código automaticamente, manter
lote anterior intacto, não pedir intervenção manual. A UI deve usar uma única fonte de verdade
para quantidade e conjunto de destinatários.

## 13. Email Studio — prioridades

Preview confiável; personalização compreensível; importação de HTML simples; Gmail-safe;
controle do usuário antes de criar rascunhos; lote sem complexidade técnica exposta; feedback
claro; evitar estados inconsistentes. Se um detalhe técnico aparecer diretamente na interface,
avaliar se ele pode ser escondido ou traduzido para linguagem de produto.

## 14. Gmail/OAuth

Tratar Gmail/OAuth como área protegida. Não alterar OAuth, tokens, escopos, fluxo de
autenticação, integração Gmail — a menos que a tarefa explicitamente dependa disso. Uma feature
de UX não deve virar alteração de autenticação sem necessidade comprovada.

## 15. Supabase / Edge Functions

Mudanças em Edge Functions devem preservar autenticação existente, contratos atuais e paridade
client/server. Existe automação de deploy para mudanças em `supabase/functions/**`. Não
recomendar deploy manual quando o workflow automático puder fazer o trabalho. Migrations, RLS e
schema: não alterar sem necessidade comprovada.

## 16. Segurança

Nunca resolver problema de experiência enfraquecendo sandbox, RLS, auth, validação server-side,
guardrails contra sobrescrita, isolamento entre contatos. Se um guardrail seguro tiver UX ruim:
preservar a proteção e melhorar a experiência por cima.

## 17. Padrão de implementação

Antes de criar componente/helper/estado novo: procurar solução existente; verificar se pode ser
reutilizada; evitar lógica paralela; manter fonte única de verdade; manter individual e batch em
paridade. Preferir evolução incremental. Evitar reescrever áreas já aprovadas sem necessidade.

## 18. UX visual

Limpo, minimalista, profissional, denso apenas quando necessário, confortável em desktop,
responsivo, sem excesso de cards, labels ou controles. Usar progressive disclosure. Exemplo: se
uma opção avançada só importa quando "Formal" está selecionado, mostrar apenas nesse estado. Não
manter campos irrelevantes sempre visíveis.

## 19. Modais

Largura adequada ao conteúdo; não ficar excessivamente estreitos e altos; usar scroll interno
quando necessário; manter ações claras; evitar scroll horizontal; preservar foco e teclado; usar
hierarquia visual clara. Não usar fullscreen em desktop sem necessidade.

## 20. Mensagens e erros

Mensagens devem explicar o que aconteceu, o que o sistema fez, se o usuário precisa agir. Se o
sistema puder resolver automaticamente com segurança: resolver automaticamente. Não mostrar erro
técnico quando um feedback de produto simples for suficiente.

## 21. Processo para novas features

A. entender objetivo real do usuário
B. identificar fluxo atual
C. consultar nar-product-ux
D. consultar ui-ux-pro-max
E. consultar frontend-design
F. consultar web-quality-skills quando aplicável
G. propor a UX mínima necessária
H. só então implementar

Antes de codificar, responder internamente: qual problema do usuário isso resolve? qual é o
default inteligente? onde o usuário precisa de controle? o preview representa o resultado?
existe complexidade técnica exposta? existe fluxo/componente já reutilizável? individual e batch
continuam consistentes? existe risco de regressão em Gmail/OAuth, sandbox, RLS ou auth?

## 22. Anti-padrões

Solução tecnicamente correta mas UX ruim; hardcode de regras que já existem no CRM; inferência
de gênero pelo nome; `cargo_original` direto na comunicação; placeholders expostos; IDs técnicos
expostos; códigos internos gerenciados manualmente; fluxos paralelos para a mesma operação;
preview diferente do envio; comportamento diferente entre individual e batch; modal estreito com
conteúdo comprimido; excesso de opções sem progressive disclosure; reauditar áreas já validadas
sem motivo concreto.

## 23. Saída esperada da skill

A skill não deve gerar respostas enormes por padrão. Ao analisar uma feature, deve orientar
Claude a produzir: decisão de UX recomendada; motivo curto; impacto no fluxo existente; riscos
reais; implementação mínima; o que deve ser preservado.

Se a tarefa for implementação, seguir diretamente para código após essa análise interna, sem
criar ciclos desnecessários de revisão.
