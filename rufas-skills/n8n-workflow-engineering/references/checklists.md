# Checklists operacionais

## 1. Diagnóstico de node

- [ ] Confirmar exatamente qual node falhou (nome, posição no fluxo, tipo).
- [ ] Confirmar versão real do n8n e versão do node instalado — nunca assumir a versão da documentação genérica.
- [ ] Ler o erro completo, não só a primeira linha — a evidência real geralmente está no meio/fim do stack.
- [ ] Classificar a categoria do erro: transporte, configuração, lógica, autenticação, ou dados — antes de propor qualquer correção.
- [ ] Verificar se o mesmo tipo de erro já foi visto e resolvido antes (não repetir investigação já concluída).
- [ ] Confirmar se o erro é determinístico (sempre reproduz) ou intermitente — muda a estratégia de teste.

## 2. Alteração segura

- [ ] Fazer backup do workflow antes de qualquer mudança estrutural.
- [ ] Confirmar que IDs, credentials e connections existentes serão preservados pela mudança planejada.
- [ ] Definir explicitamente a mudança mínima necessária — resistir à tentação de "aproveitar e melhorar" outras partes.
- [ ] Confirmar que a mudança ataca a causa raiz classificada no diagnóstico, não um sintoma.

## 3. Testes isolados

- [ ] Testar o node isolado antes de testar o workflow completo.
- [ ] Usar dados de teste mínimos e não sensíveis quando possível.
- [ ] Testar sem HMAC/assinatura primeiro quando o objetivo é validar transporte, separando essa camada da camada de autenticação (ver playbook).
- [ ] Registrar a evidência real do teste (resposta, log, status) — não apenas "rodou sem erro visível".

## 4. Testes end-to-end

- [ ] Só avançar para end-to-end depois que os nodes isolados relevantes passaram.
- [ ] Testar o caminho completo com um dado real (ou realista) único antes de qualquer lote.
- [ ] Confirmar que o resultado final bate com o esperado em cada etapa intermediária observável, não só no output final.
- [ ] Verificar que a execução não teve efeito colateral em fila/watermark/dedupe além do esperado.

## 5. Rollback

- [ ] Confirmar que existe um checkpoint/backup válido antes de iniciar a mudança.
- [ ] Ter o procedimento de rollback definido **antes** de aplicar a mudança, não descoberto depois que algo deu errado.
- [ ] Rollback restaura o workflow para o estado do checkpoint — nunca uma tentativa de "consertar para frente" sob pressão.
- [ ] Confirmar pós-rollback que o comportamento voltou ao estado conhecido (não assumir).

## 6. Validação pós-deploy

- [ ] Confirmar que o workflow está ativo e processando (não só "salvo").
- [ ] Rodar smoke test mínimo no ambiente real.
- [ ] Verificar logs/execuções reais nos primeiros ciclos após o deploy.
- [ ] Confirmar que nenhum workflow vizinho foi afetado (credentials compartilhadas, filas compartilhadas).

## 7. Documentação mínima da mudança

- [ ] O que mudou (resumo de uma frase).
- [ ] Por que mudou (causa raiz identificada).
- [ ] O que foi testado (isolado + end-to-end).
- [ ] Como reverter, se necessário.
- [ ] Data e quem aplicou a mudança.

Sem essas cinco linhas registradas, a mudança não está documentada o suficiente para outra pessoa (ou o próprio Rufas em uma sessão futura) entender o que aconteceu sem depender de memória de conversa.
