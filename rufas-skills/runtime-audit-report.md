# Runtime audit report — Hermes skills

**Status**: não executado contra o runtime real. Este ambiente não tem acesso a `/home/hermes/.hermes/skills` (a VPS onde o Hermes roda de fato é uma máquina diferente deste ambiente de desenvolvimento).

## Como gerar o relatório real

Na VPS onde o Hermes roda:

```bash
bash rufas-skills/audit_hermes_skills.sh /home/hermes/.hermes/skills > rufas-skills/runtime-audit-report.md
```

Isso sobrescreve este arquivo com o relatório real, contendo:

- `INSTALLED_SKILLS`
- `PENDING_ENTRIES`
- `DUPLICATE_NAMES`
- `DUPLICATE_CONTENT_HASHES`
- `EMPTY_OR_BROKEN`
- `POSSIBLE_OBSOLETE`
- `CURATOR_LEDGER_COUNT`
- `PENDING_WRITE_COUNT`

## Garantias do script

`audit_hermes_skills.sh` é somente leitura: não exclui, não move, não aprova, não modifica, e não escreve dentro de `/home/hermes/.hermes/skills` em nenhuma circunstância. Arquivos de estado do curator (`.curator_ledger.jsonl`, `.curator_state`, se existirem) são lidos apenas para contagem/diagnóstico.

## Próximo passo

Depois de gerar o relatório real, usar os achados (`DUPLICATE_NAMES`, `DUPLICATE_CONTENT_HASHES`, `POSSIBLE_OBSOLETE`) para decidir, com aprovação humana, quais skills antigas movem para `_archive/` e quais viram a versão canônica publicada a partir de `rufas-skills/`.
