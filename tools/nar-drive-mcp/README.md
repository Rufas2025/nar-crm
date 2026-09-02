# nar_drive — MCP read-only do Google Drive para Hermes/Rufas

MCP local (stdio, Python) que dá ao agente acesso **somente leitura** à pasta
autorizada do Google Drive `Eduinfo_2026_nar`
(`1WcIuTx8ydx-8umN3PiFQ9OPJGtnG6EpL`) e a **tudo que for descendente dela**, em
qualquer profundidade. Sem n8n, sem banco, sem servidor web, sem OAuth
interativo em runtime.

## Garantias de segurança

| Garantia | Como é aplicada |
| --- | --- |
| Read-only absoluto | Credencial pedida apenas com o escopo `drive.readonly`; o cliente implementa somente `files.get`, `files.list` e `files.get_media`. Não existe código de upload, delete, move, share ou permissões. |
| Escopo por ancestralidade | Todo `folder_id`/`file_id` é validado subindo a cadeia de pais até a raiz autorizada (`nar_drive_mcp/scope.py`) antes de qualquer leitura. |
| Fail closed | Id desconhecido, erro de rede, item na lixeira, item órfão, ciclo de pais ou profundidade excedida ⇒ **DENIED**. |
| Sem exposição pública | Nada de `permissions.create`; o arquivo é baixado para um diretório privado local. |
| Arquivos temporários seguros | Diretório `0700`, nome aleatório (`secrets.token_hex(16)`), arquivo `0600`, expiração por TTL e limpeza no encerramento do processo. |
| Sem segredos em log | Logs vão para stderr, sem tokens/credenciais; erros retornados ao agente são genéricos. |
| Credenciais fora do código | Somente via env (`NAR_DRIVE_CREDENTIALS_FILE`) ou arquivo `.env` privado. |

## Árvore de arquivos

```
tools/nar-drive-mcp/
├── README.md
├── requirements.txt
├── requirements-dev.txt
├── .env.example
├── .gitignore
├── nar_drive_mcp/
│   ├── __init__.py
│   ├── config.py       # env/config, sem segredos hardcoded
│   ├── scope.py        # ancestralidade + fail closed (lógica pura, testável)
│   ├── drive.py        # cliente Drive v3 read-only
│   ├── assets.py       # storage temporário privado + cleanup
│   ├── service.py      # regras das 3 tools
│   └── server.py       # MCP stdio
├── scripts/
│   ├── mcp_selftest.py # sobe o MCP e valida as tools (não usa o Drive)
│   └── smoke_test.py   # teste de aceite real contra o Drive
└── tests/
    ├── conftest.py
    ├── fakes.py
    ├── test_scope.py   # escopo/ancestralidade
    └── test_service.py # list/search/get_asset + storage temporário
```

## Tools expostas

### `eduinfo_list(folder_id?, page_size?)`
Sem `folder_id`, lista os filhos da raiz autorizada. Com `folder_id`, valida
primeiro que ele é a raiz ou descendente dela. Retorna, por item:
`id`, `name`, `mime_type`, `is_folder`, `parents` e `size` (quando disponível).

### `eduinfo_search(query, folder_id?, page_size?)`
Busca recursiva por nome/conteúdo dentro da árvore autorizada; com `folder_id`
limita ao subtree indicado. Cada resultado é revalidado por ancestralidade —
itens fora da raiz nunca são retornados. Retorna `id`, `name`, `mime_type`,
`parents`, `size` e `path` (caminho a partir da raiz).

### `eduinfo_get_asset(file_id)`
Valida a ancestralidade, obtém metadados e baixa o arquivo para um caminho
temporário privado. Retorna JSON com `local_path`, `bytes`, `mime_type`,
`path` e `expires_in_seconds`; imagens até `NAR_DRIVE_INLINE_IMAGE_MAX_BYTES`
também voltam inline como `ImageContent` (consumível direto pelo Rufas).
PDFs e vídeos são entregues pelo `local_path` (menor complexidade operacional
que URLs assinadas: nada é publicado no Drive e nada precisa de servidor HTTP).
Google Docs/Sheets/Slides nativos retornam `unsupported_native_google_doc`
(fora do escopo da V1).

Erros e negações voltam como JSON: `{"status": "denied" | "invalid_request" |
"drive_error" | "error", "error": "..."}`.

## Instalação (host do Hermes, usuário `hermes`)

```bash
# 1. copiar o diretório do MCP para o host
sudo -u hermes mkdir -p /home/hermes/.hermes/mcp
sudo -u hermes cp -r tools/nar-drive-mcp /home/hermes/.hermes/mcp/nar-drive-mcp

# 2. venv isolada + dependências
sudo -u hermes python3 -m venv /home/hermes/.hermes/mcp/nar-drive-mcp/.venv
sudo -u hermes /home/hermes/.hermes/mcp/nar-drive-mcp/.venv/bin/pip install \
  -r /home/hermes/.hermes/mcp/nar-drive-mcp/requirements.txt

# 3. credenciais da service account (escopo drive.readonly), fora do repositório
sudo -u hermes mkdir -p -m 700 /home/hermes/.hermes/secrets
sudo -u hermes install -m 600 /caminho/do/download/nar_drive_sa.json \
  /home/hermes/.hermes/secrets/nar_drive_sa.json

# 4. arquivo de ambiente privado
sudo -u hermes cp /home/hermes/.hermes/mcp/nar-drive-mcp/.env.example \
  /home/hermes/.hermes/secrets/nar_drive.env
sudo -u hermes chmod 600 /home/hermes/.hermes/secrets/nar_drive.env
sudo -u hermes vi /home/hermes/.hermes/secrets/nar_drive.env   # ajustar caminhos
```

No Google Cloud: crie uma service account, habilite a Google Drive API e
**compartilhe apenas a pasta `Eduinfo_2026_nar`** (leitor) com o e-mail da
service account. Não é necessário domain-wide delegation; se usar, defina
`NAR_DRIVE_IMPERSONATE_SUBJECT`.

## Testes

```bash
cd /home/hermes/.hermes/mcp/nar-drive-mcp

# unitários (escopo/ancestralidade, sem rede)
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest tests -q

# o MCP sobe e publica as 3 tools (sem rede)
NAR_DRIVE_CREDENTIALS_FILE=/home/hermes/.hermes/secrets/nar_drive_sa.json \
  .venv/bin/python scripts/mcp_selftest.py

# smoke test real (aceite): BANCO SHINE -> STORIE BANCO SHINE.png -> download
NAR_DRIVE_ENV_FILE=/home/hermes/.hermes/secrets/nar_drive.env \
  .venv/bin/python scripts/smoke_test.py
```

O smoke test imprime `ROOT_SCOPE_TEST`, `SEARCH_TEST`, `ASSET_DOWNLOAD_TEST`
(mime `image/png`, bytes > 0) e `OUT_OF_SCOPE_DENY_TEST`.

## Registrar no Hermes

```bash
hermes mcp add nar_drive \
  --transport stdio \
  --command /home/hermes/.hermes/mcp/nar-drive-mcp/.venv/bin/python \
  --arg -m --arg nar_drive_mcp.server \
  --cwd /home/hermes/.hermes/mcp/nar-drive-mcp \
  --env NAR_DRIVE_ENV_FILE=/home/hermes/.hermes/secrets/nar_drive.env \
  --env NAR_DRIVE_CREDENTIALS_FILE=/home/hermes/.hermes/secrets/nar_drive_sa.json
```

Se a sua build do Hermes usa arquivo de configuração em vez de subcomando,
adicione **apenas** este bloco em `$HERMES_HOME/mcp.json` (sem tocar nos outros
servidores):

```json
{
  "mcpServers": {
    "nar_drive": {
      "command": "/home/hermes/.hermes/mcp/nar-drive-mcp/.venv/bin/python",
      "args": ["-m", "nar_drive_mcp.server"],
      "cwd": "/home/hermes/.hermes/mcp/nar-drive-mcp",
      "env": {
        "NAR_DRIVE_ENV_FILE": "/home/hermes/.hermes/secrets/nar_drive.env",
        "NAR_DRIVE_CREDENTIALS_FILE": "/home/hermes/.hermes/secrets/nar_drive_sa.json"
      }
    }
  }
}
```

Validar:

```bash
hermes mcp test nar_drive
```

## Rollback completo

```bash
# 1. remover o registro no Hermes
hermes mcp remove nar_drive
#    (ou apagar apenas a chave "nar_drive" de $HERMES_HOME/mcp.json)

# 2. apagar código e venv
rm -rf /home/hermes/.hermes/mcp/nar-drive-mcp

# 3. apagar assets temporários e credenciais
rm -rf /home/hermes/.hermes/cache/nar_drive
shred -u /home/hermes/.hermes/secrets/nar_drive_sa.json \
        /home/hermes/.hermes/secrets/nar_drive.env

# 4. revogar a chave da service account no Google Cloud e remover o
#    compartilhamento da pasta Eduinfo_2026_nar com a service account

# 5. reiniciar o Hermes
systemctl --user restart hermes   # ou o comando usado no host
```

Nada fora de `tools/nar-drive-mcp/` (repo) e de
`/home/hermes/.hermes/mcp/nar-drive-mcp` + a entrada `nar_drive` no registro de
MCPs (host) é tocado: outros MCPs, gateway, provider/model, skills, memória e
agentes NAR permanecem intactos.

## Aceite (dados reais da árvore autorizada)

| Item | Valor real |
| --- | --- |
| Root autorizada | `Eduinfo_2026_nar` — `1WcIuTx8ydx-8umN3PiFQ9OPJGtnG6EpL` |
| Pasta | `BANCO SHINE` — `1YnUv4uTMeaNm0AMBng29T_lrd61lVT48` (filha direta da root) |
| Asset | ` STORIE BANCO SHINE.png` — `1DZnAIBCDw9uF1RC4JXqKfO9SCWvI96ww`, `image/png`, 1.174.390 bytes |
| Gêmeo fora da root (deve ser DENIED) | `1NX2Qdpqn-qa84uo3cZndIrszqQ4dCKkD` (pasta `19-4rpHGaD_nJKiVutaLmbs0YZa0NHWNp`) |

Existem várias cópias de `STORIE BANCO SHINE.png` no Drive; apenas a que está
sob a root autorizada pode ser retornada. `tests/test_acceptance_replay.py`
reexecuta essa topologia real offline; a execução ao vivo é:

```bash
NAR_DRIVE_ENV_FILE=/home/hermes/.hermes/secrets/nar_drive.env \
  .venv/bin/python scripts/smoke_test.py \
  --out-of-scope-id 1NX2Qdpqn-qa84uo3cZndIrszqQ4dCKkD
```
