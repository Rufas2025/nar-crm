# Conflito de informação comercial — Gennera

**Data da análise:** 2026-08-08
**Documentos analisados:**
- A: `/home/user/nar-crm/.claude/skills/nar-knowledge-curator/evals/fixtures/caso2a_gennera_condicoes_comerciais.md` — "Gennera_Condicoes_Comerciais", pasta `03_Gennera`, **sem data de vigência**
- B: `/home/user/nar-crm/.claude/skills/nar-knowledge-curator/evals/fixtures/caso2b_gennera_tabela_comercial_2025.md` — "Gennera_Tabela_Comercial_2025", pasta `00_Governanca_e_Arquitetura`, cabeçalho "Tabela vigente — revisão comercial 2025"

Nenhum arquivo de origem foi modificado.

---

## 1. Diagnóstico rápido

Não é um "errinho de número". São **dois documentos comerciais completos e mutuamente incompatíveis** sobre a mesma marca, ambos vivos na base de conhecimento que alimenta o NAR ECO. Divergem em preço, em custo de entrada, em desconto, em prazo de entrega, em escopo de suporte e — o mais grave — em **cláusula de cancelamento**.

Enquanto os dois coexistirem indexados, o subagente Gennera (e a Nathalia Serrano, ao orquestrar) pode responder a uma escola com qualquer uma das duas versões, de forma não determinística. O risco não é de "informação desatualizada": é de **compromisso comercial e contratual errado dito a um cliente em nome da marca**.

---

## 2. Inventário de divergências

| Dimensão | A — Condições Comerciais (sem data) | B — Tabela Comercial 2025 ("vigente") | Gravidade |
|---|---|---|---|
| Até 500 alunos | R$ 4,90 /aluno/mês | R$ 5,40 /aluno/mês | Alta |
| 501–1.500 alunos | R$ 4,20 /aluno/mês | R$ 4,70 /aluno/mês | Alta |
| Acima de 1.500 alunos | "sob consulta" | R$ 3,90 /aluno/mês | Alta |
| Taxa de implantação | R$ 3.500,00, em até 3x | Isenta para contratos do 1º semestre | Alta |
| Desconto pagamento antecipado | 10% | 15% | Média |
| **Cancelamento** | **Multa de 30% do saldo remanescente** | **Aviso prévio de 60 dias, sem multa** | **Crítica** |
| Prazo de implantação | 45 dias, com migração e treinamento | 60 dias (não menciona migração/treinamento) | Média |
| Suporte telefônico | Só acima de 1.500 alunos | Todas as faixas | Média |
| Contrato semestral (piloto) | Não previsto | Previsto | Baixa |
| Prazo mínimo / reajuste | 12 meses / IPCA | 12 meses / IPCA | Convergente |

Pontos convergentes (12 meses, IPCA, assinatura anual com faturamento mensal, suporte 8h–18h seg–sex) podem ser tratados como estáveis desde já.

---

## 3. Leitura da evidência: qual documento vale?

**A hipótese mais provável é que B seja a versão mais recente**, por três sinais:

1. B se autodeclara "Tabela vigente — revisão comercial 2025"; A não tem nenhuma marca de vigência.
2. B fecha a lacuna de A (a faixa "sob consulta" vira preço tabelado) — típico de uma revisão que amadurece a tabela anterior.
3. O reajuste de preço de A para B (+10% e +12% nas duas primeiras faixas) é coerente com uma revisão anual sob IPCA.

**Mas essa hipótese não é suficiente para publicar como verdade, por quatro motivos:**

1. **B também pode estar vencido.** Hoje é agosto de 2026. B é uma revisão de **2025** — pode ter mais de um ano. Se houve revisão 2026, nenhum dos dois documentos é a fonte válida e a resposta certa é buscar um terceiro.
2. **A isenção de implantação em B é ambígua e provavelmente expirada.** "Isenta para contratos fechados no primeiro semestre" não diz *de qual ano*. Se era o 1º semestre de 2025, a condição já caducou — e o agente estaria oferecendo gratuidade inexistente.
3. **B está na pasta errada.** `00_Governanca_e_Arquitetura` é pasta de governança do ecossistema, não de conteúdo comercial de marca. Um documento comercial em pasta de governança é sinal de arquivo solto/rascunho, o que **enfraquece** sua autoridade — ou, na melhor hipótese, indica que ele foi colocado ali para revisão e nunca voltou para `03_Gennera`.
4. **A direção das mudanças é internamente estranha.** B sobe preço e ao mesmo tempo afrouxa tudo (implantação isenta, desconto maior, cancelamento sem multa, telefone para todos) — mas piora o prazo de implantação e deixa de citar migração e treinamento. Pode ser uma estratégia deliberada de aquisição; pode também ser um documento montado por outra área sem validação jurídica. A cláusula de cancelamento sem multa, em particular, é do tipo que não se assume por inferência.

**Conclusão:** há um favorito (B), mas **não há autoridade documental suficiente para decidir sozinho**. Isto precisa de uma confirmação humana do dono comercial da Gennera antes de virar fonte única.

---

## 4. O que fazer — plano em três tempos

### Tempo 1 — Contenção (fazer hoje, antes de qualquer outra coisa)

Objetivo: parar o sangramento, sem destruir evidência.

1. **Suspender os dois documentos do índice de recuperação (RAG)** do subagente Gennera. Enquanto a dúvida existir, é melhor o agente dizer "vou confirmar a condição comercial com o time" do que arriscar um número errado.
2. **Não apagar nada.** Marcar, não deletar — os dois são evidência do histórico de precificação.
3. **Marcar A explicitamente como suspeito de obsolescência**, com um cabeçalho de status (ver Tempo 3), sem alterar seu conteúdo.
4. **Instruir o orquestrador (Nathalia)**: qualquer pergunta sobre preço, implantação, desconto ou cancelamento da Gennera vira handoff para validação humana até o Tempo 2 fechar. Se for preciso responder algo agora, responder **apenas os pontos convergentes** da tabela acima (12 meses, IPCA, assinatura anual com faturamento mensal, suporte 8h–18h seg–sex).

### Tempo 2 — Validação humana (a pergunta certa para a pessoa certa)

Levar ao responsável comercial da Gennera **uma pergunta fechada, não um "qual está certo?"**. Sugestão de mensagem:

> Encontramos duas tabelas comerciais da Gennera na base do NAR ECO com números incompatíveis. Antes de liberar o agente para responder sobre preço, preciso de cinco confirmações:
> 1. A tabela vigente hoje (ago/2026) é a "revisão comercial 2025" (R$ 5,40 / R$ 4,70 / R$ 3,90)? Ou existe uma revisão 2026 que não está na base?
> 2. A taxa de implantação hoje é isenta, R$ 3.500 parcelável, ou outra coisa? A isenção "do primeiro semestre" referia-se a qual ano e ainda está de pé?
> 3. Cancelamento: multa de 30% sobre saldo remanescente, ou aviso prévio de 60 dias sem multa? (Esta é a divergência mais crítica — precisa de confirmação jurídica, não só comercial.)
> 4. Desconto de pagamento antecipado: 10% ou 15%?
> 5. Prazo de implantação: 45 ou 60 dias — e migração de dados e treinamento estão inclusos no escopo padrão?
>
> Ideal: apontar o documento-fonte oficial (link/arquivo) e quem é o dono dele daqui pra frente.

Registrar a resposta com data e nome de quem confirmou. Essa confirmação vira o lastro do documento canônico.

### Tempo 3 — Consolidação (o que fica valendo)

1. **Um único documento canônico por tema por marca.** Criar `03_Gennera/Gennera_Tabela_Comercial_VIGENTE.md` com o conteúdo validado no Tempo 2. Nada de dois arquivos "quase iguais" convivendo.
2. **Arquivar os antigos, não excluí-los**: mover A (e a versão 2025, se superada) para `03_Gennera/_historico/`, com sufixo de ano. Pasta `_historico` fica **fora** do índice do RAG.
3. **Corrigir a pasta de B**: conteúdo comercial de marca não mora em `00_Governanca_e_Arquitetura`. Move para `03_Gennera`.
4. **Cabeçalho de metadados obrigatório** em todo documento comercial da base, para que este problema seja detectável por inspeção:

```yaml
---
marca: Gennera
tipo: tabela_comercial
status: vigente            # vigente | historico | rascunho
vigencia_inicio: AAAA-MM-DD
vigencia_fim: AAAA-MM-DD   # ou "indeterminada"
versao: 2026.1
substitui: Gennera_Tabela_Comercial_2025
fonte: <link/origem oficial>
responsavel: <nome do dono comercial>
validado_em: AAAA-MM-DD
validado_por: <nome>
---
```

Regra prática: **documento comercial sem `vigencia_inicio` e `validado_por` não entra no índice do RAG.** Foi exatamente a ausência disso que criou o caso.

5. **Reindexar e testar.** Depois de publicar o canônico, rodar perguntas de verificação no subagente Gennera ("quanto custa para uma escola de 300 alunos?", "qual a multa se a escola cancelar no 6º mês?", "a implantação tem custo?") e conferir se as respostas batem com o documento validado — e se não aparece resquício da versão antiga no índice.

---

## 5. Prevenção — a causa raiz não é a Gennera

Este caso é sintoma de três lacunas de curadoria que vão se repetir com as outras marcas:

| Lacuna | Correção |
|---|---|
| Documentos sem vigência nem dono | Front-matter obrigatório (seção 4, Tempo 3) |
| Conteúdo de marca solto em pasta de governança | Regra de pastas: `00_Governanca_e_Arquitetura` só para regras do ecossistema; conteúdo comercial sempre em `NN_<Marca>` |
| Versões antigas convivendo com as novas no índice | Pasta `_historico/` por marca, excluída do RAG; nunca dois arquivos com status `vigente` no mesmo tema |

Sugestão adicional: uma **revisão trimestral de vigência** das tabelas comerciais de todas as marcas — quem é o dono, quando foi validado pela última vez, e se a data de vigência ainda faz sentido. Um documento de 2025 ainda rotulado "vigente" em agosto de 2026 é exatamente o alarme que essa rotina pegaria.

---

## 6. Resumo executivo

- Os dois documentos são incompatíveis em 9 dimensões, incluindo **preço** e **cláusula de cancelamento**.
- **B (Tabela 2025) é o candidato mais provável a vigente**, mas está em pasta errada, é de 2025 (pode já ter sido superado por uma revisão 2026) e traz uma isenção de implantação com prazo ambíguo e provavelmente expirado.
- **Não dá para decidir por inferência.** Ação imediata: tirar ambos do índice do RAG e bloquear respostas comerciais da Gennera.
- Ação seguinte: validação humana com o dono comercial, usando as 5 perguntas fechadas da seção 4.
- Ação final: um único documento canônico em `03_Gennera`, com metadados de vigência e dono, antigos arquivados em `_historico/` fora do índice, e reteste do subagente.
