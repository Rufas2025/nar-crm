# Registro de alterações — NAR-DRIVE-MCP-V1

Gerado antes da implantação, como registro/backup do estado original.

- Repositório: rufas2025/nar-crm
- Branch de trabalho: claude/nar-drive-mcp-v1-zpdsz9
- Commit base (estado original): 0edef4eb1a5e280df6e7af51315e8c8370211f97
- Data: 2026-09-02T21:55:03Z

## Arquivos pré-existentes modificados

Nenhum. Todo o trabalho é **aditivo**, restrito ao diretório novo
`tools/nar-drive-mcp/`. Não foram tocados: outros MCPs, gateway,
provider/model, skills, memória, agentes NAR, código do CRM
(`src/`, `supabase/`, configs da raiz).

Verificação:

```bash
git diff --name-only 0edef4eb1a5e280df6e7af51315e8c8370211f97..HEAD   # após o commit
# deve listar apenas caminhos sob tools/nar-drive-mcp/
```

## Backup / rollback no repositório

```bash
# desfazer tudo no repositório
git rm -r --cached tools/nar-drive-mcp && rm -rf tools/nar-drive-mcp
# ou voltar ao commit base
git checkout 0edef4eb1a5e280df6e7af51315e8c8370211f97 -- .
```

## Backup no host do Hermes (antes de registrar o MCP)

```bash
sudo -u hermes cp -a $HERMES_HOME/mcp.json \
  $HERMES_HOME/mcp.json.bak.$(date +%Y%m%d%H%M%S)
```

Restauração: `mv $HERMES_HOME/mcp.json.bak.<timestamp> $HERMES_HOME/mcp.json`
e reiniciar o Hermes. O rollback completo está no README.
