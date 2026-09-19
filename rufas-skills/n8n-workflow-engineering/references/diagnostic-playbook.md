# Playbook de diagnóstico — erro de transporte/serialização em HTTP Request

Este playbook nasceu de um caso real: o node **HTTP Request** nativo do n8n retornando `Converting circular structure to JSON`, com o stack envolvendo `TLSSocket` e, em investigação posterior, `Socket`/`EnvProxyHttpAgent`. **Não é uma regra absoluta** — é um procedimento de diagnóstico reutilizável para a *classe* de problema (erro de serialização/transporte em chamada HTTP dentro de n8n), a ser adaptado ao caso real em mãos.

## Procedimento

1. **Não assumir que TLS é a causa só porque `TLSSocket` aparece no erro** — a presença de um objeto TLS no stack de serialização circular é um sintoma de que *algo* tentou serializar o socket inteiro, não necessariamente que o problema é de handshake/certificado.
2. Testar o caminho HTTP interno (sem TLS) quando possível, para isolar se o problema é específico da camada segura.
3. Se o erro persistir aparecendo como `Socket` (não mais `TLSSocket`), tratar como problema de **serialização/agente HTTP**, não mais como hipótese de TLS.
4. Criar um **Code node isolado** para reproduzir a chamada fora do node HTTP Request nativo — isso separa "o node tem um bug/limitação" de "a chamada em si está malformada".
5. Testar o transporte **sem HMAC** primeiro — remove a variável de assinatura da equação de diagnóstico.
6. Permitir uso de módulo built-in (ex.: `require('http')`) no Code node **somente se necessário** para o teste de isolamento — não como primeira tentativa.
7. Em ambiente self-hosted, verificar a variável `NODE_FUNCTION_ALLOW_BUILTIN` — sem ela configurada corretamente, o Code node pode falhar por restrição de ambiente, não pelo problema original.
8. Quando o n8n usa task runner externo, garantir que o **ambiente do runner também alcança** o destino da chamada — um teste que "funciona no editor" mas falha em execução real pode ser isso, não o código em si.
9. Testar `require('http')` diretamente no Code node para confirmar que o ambiente consegue fazer uma chamada HTTP crua, sem a camada do node nativo.
10. Enviar um `POST` **sem assinatura**, esperando `HTTP 401` quando o endpoint exige HMAC — isso testa reachability, não autenticação.
11. **Considerar `HTTP 401` como `PASS` de transporte** quando HMAC é obrigatório — 401 significa que a requisição chegou, foi processada, e foi corretamente rejeitada por falta de assinatura. Isso é evidência positiva de que a camada de transporte funciona, não uma falha.
12. Só depois de confirmado o transporte (passos 1–11), substituir o node de produção pela solução validada — nunca aplicar a correção antes de ter essa evidência.
13. Preservar o **raw body exatamente como foi assinado** ao migrar a chamada de um node para outro — reformatação do body (mesmo aparentemente inofensiva, como reordenar chaves JSON) invalida a assinatura HMAC calculada sobre o body original.
14. **Não gastar retries reais em testes manuais desnecessários** — cada chamada de teste contra um sistema real tem custo (rate limit, fila, efeito colateral); preferir os testes de isolamento (Code node, sem HMAC) antes de testar contra produção real.

## Quando esse playbook não se aplica

Se o erro não envolve serialização circular nem objetos de socket/TLS no stack, este não é o playbook certo — voltar para a classificação geral de erro (transporte/configuração/lógica/autenticação/dados) em `references/checklists.md` — "1. Diagnóstico de node" e escolher a linha de investigação apropriada ao sintoma real observado.
