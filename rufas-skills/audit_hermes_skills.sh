#!/usr/bin/env bash
#
# audit_hermes_skills.sh — auditoria SOMENTE LEITURA do runtime de skills do Hermes.
#
# NUNCA exclui, move, aprova ou modifica nada. Não escreve dentro de
# HERMES_HOME/skills sob nenhuma circunstância. Lê arquivos de estado/ledger
# do curator (se existirem) apenas para diagnóstico — nunca imprime seu
# conteúdo integral nem qualquer secret, só paths/contagens/classificações.
#
# Uso:
#   ./audit_hermes_skills.sh [SKILLS_DIR] [HERMES_HOME]
#
# Padrões:
#   SKILLS_DIR  = /home/hermes/.hermes/skills
#   HERMES_HOME = /home/hermes/.hermes
#
# Saída: relatório em texto no stdout. Para salvar no local canônico deste
# projeto:
#   ./audit_hermes_skills.sh > rufas-skills/runtime-audit-report.md

set -euo pipefail

SKILLS_DIR="${1:-/home/hermes/.hermes/skills}"
HERMES_HOME="${2:-/home/hermes/.hermes}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "# Runtime audit report — Hermes skills"
echo
echo "Gerado em: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "SKILLS_DIR: \`${SKILLS_DIR}\`"
echo "HERMES_HOME: \`${HERMES_HOME}\`"
echo
echo "> Este relatório é somente leitura. Nenhum arquivo foi criado, movido,"
echo "> excluído, aprovado ou modificado por este script. Nenhum secret ou"
echo "> conteúdo integral de ledger é impresso — apenas paths, contagens e"
echo "> classificações."
echo

if [ ! -d "$SKILLS_DIR" ]; then
  echo "## ERRO"
  echo
  echo "O diretório \`${SKILLS_DIR}\` não existe ou não é acessível a partir deste ambiente."
  echo
  echo "Isso é esperado quando o script roda fora da VPS onde o runtime real do Hermes vive."
  echo "Para executar de verdade, rode este script diretamente na VPS:"
  echo
  echo '```bash'
  echo "bash audit_hermes_skills.sh /home/hermes/.hermes/skills /home/hermes/.hermes > rufas-skills/runtime-audit-report.md"
  echo '```'
  echo
  exit 0
fi

echo "## INSTALLED_SKILLS"
echo
find "$SKILLS_DIR" -maxdepth 1 -mindepth 1 -type d | sort | while read -r d; do
  name=$(basename "$d")
  has_skill_md="NO"
  [ -f "$d/SKILL.md" ] && has_skill_md="YES"
  echo "- ${name} (SKILL.md presente: ${has_skill_md})"
done
echo

echo "## PENDING_ENTRIES"
echo
{
  find "$SKILLS_DIR" -maxdepth 2 -iname "*pending*" 2>/dev/null
  [ -d "$HERMES_HOME" ] && find "$HERMES_HOME" -maxdepth 2 -iname "*pending*" 2>/dev/null
} | sort -u | sed 's/^/- /' > "$TMP_DIR/pending.txt" || true
if [ -s "$TMP_DIR/pending.txt" ]; then
  cat "$TMP_DIR/pending.txt"
else
  echo "(nenhuma entrada pendente encontrada em SKILLS_DIR ou HERMES_HOME)"
fi
echo

echo "## DUPLICATE_NAMES"
echo
find "$SKILLS_DIR" -maxdepth 1 -mindepth 1 -type d -printf "%f\n" 2>/dev/null | \
  sed -E 's/-v[0-9]+(\.[0-9]+)*$//; s/-(copy|old|bak|backup|deprecated)$//i' | \
  sort | uniq -d | sed 's/^/- possível duplicata de base name: /' || echo "(nenhuma detectada por heurística de nome)"
echo

echo "## DUPLICATE_CONTENT_HASHES"
echo
find "$SKILLS_DIR" -type f -name "SKILL.md" -exec sha256sum {} \; 2>/dev/null > "$TMP_DIR/hashes.txt" || true
awk '{print $1}' "$TMP_DIR/hashes.txt" | sort | uniq -d > "$TMP_DIR/dup_hashes.txt" || true
if [ -s "$TMP_DIR/dup_hashes.txt" ]; then
  while read -r h; do
    echo "- hash duplicado: ${h}"
    grep "^${h}" "$TMP_DIR/hashes.txt" | awk '{print "  - " $2}'
  done < "$TMP_DIR/dup_hashes.txt"
else
  echo "(nenhum SKILL.md com conteúdo idêntico detectado)"
fi
echo

echo "## EMPTY_OR_BROKEN"
echo
find "$SKILLS_DIR" -maxdepth 1 -mindepth 1 -type d | sort | while read -r d; do
  name=$(basename "$d")
  if [ ! -f "$d/SKILL.md" ]; then
    echo "- ${name}: sem SKILL.md"
  elif [ ! -s "$d/SKILL.md" ]; then
    echo "- ${name}: SKILL.md vazio"
  fi
done
echo

echo "## POSSIBLE_OBSOLETE"
echo
echo "(heurística: pastas cujo SKILL.md não foi modificado há mais de 180 dias)"
find "$SKILLS_DIR" -maxdepth 2 -name "SKILL.md" -mtime +180 2>/dev/null | sort | sed 's/^/- /' || echo "(nenhuma encontrada, ou 'find -mtime' não suportado neste filesystem)"
echo

echo "## CURATOR_LEDGER_COUNT"
echo
# Procurar em HERMES_HOME (não só SKILLS_DIR) — o ledger pode viver fora da pasta de skills.
ledger_files=$( { [ -d "$HERMES_HOME" ] && find "$HERMES_HOME" -maxdepth 3 -iname ".curator_ledger.jsonl" 2>/dev/null; find "$SKILLS_DIR" -maxdepth 2 -iname ".curator_ledger.jsonl" 2>/dev/null; } | sort -u )
if [ -n "$ledger_files" ]; then
  echo "$ledger_files" | while read -r lf; do
    [ -f "$lf" ] || continue
    count=$(wc -l < "$lf" | tr -d ' ')
    echo "- Arquivo: \`${lf}\` — linhas (entradas): ${count}"
  done
else
  echo "(.curator_ledger.jsonl não encontrado em HERMES_HOME nem em SKILLS_DIR — nada a reportar)"
fi
echo

echo "## PENDING_WRITE_COUNT"
echo
state_files=$( { [ -d "$HERMES_HOME" ] && find "$HERMES_HOME" -maxdepth 3 -iname ".curator_state" 2>/dev/null; find "$SKILLS_DIR" -maxdepth 2 -iname ".curator_state" 2>/dev/null; } | sort -u )
if [ -n "$state_files" ]; then
  echo "$state_files" | while read -r sf; do
    [ -f "$sf" ] || continue
    echo "- Arquivo: \`${sf}\`"
    if command -v jq >/dev/null 2>&1 && head -c1 "$sf" | grep -q '[{[]'; then
      pending=$(jq '[.[]? | select(.status? == "pending")] | length' "$sf" 2>/dev/null || echo "N/A")
      echo "  Entradas pendentes (heurística via jq): ${pending}"
    else
      pending_lines=$(grep -ci "pending" "$sf" 2>/dev/null || echo 0)
      echo "  Ocorrências da palavra 'pending' (heurística de texto): ${pending_lines}"
    fi
  done
else
  echo "(.curator_state não encontrado em HERMES_HOME nem em SKILLS_DIR — nada a reportar)"
fi
echo

echo "## OTHER_CURATOR_PENDING_FILES"
echo
{
  [ -d "$HERMES_HOME" ] && find "$HERMES_HOME" -maxdepth 3 \( -iname "*.curator*" -o -iname "*usage*" -o -iname "*state*.db" \) -type f 2>/dev/null
} | sort -u | grep -v -E "curator_ledger.jsonl|curator_state" | sed 's/^/- /' > "$TMP_DIR/other.txt" || true
if [ -s "$TMP_DIR/other.txt" ]; then
  cat "$TMP_DIR/other.txt"
else
  echo "(nenhum outro arquivo de estado/curator/usage detectado em HERMES_HOME)"
fi
echo

echo "---"
echo
echo "Fim do relatório. Nenhuma ação de escrita foi executada em \`${SKILLS_DIR}\` ou \`${HERMES_HOME}\`."
