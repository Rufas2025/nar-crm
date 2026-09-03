# Tentativa inválida — evidência de infraestrutura, não resultado

Esta pasta preserva a tentativa de RUN_01 do benchmark v0.2 bloqueada por plan mode
herdado por subagentes (ver `reports/plan-mode-probe.md` e o histórico de commits).

- 28 de 34 casos foram disparados; 27 computaram resposta mas não persistiram (plan mode);
  apenas `V-08.json` gravou de fato.
- 6 casos (V-28, V-29, V-30, V-31, V-33, V-34) nunca chegaram a ser disparados
  (limite de concorrência de subagentes).
- **Nenhum arquivo aqui deve ser usado como resultado do benchmark.** Preservado só como
  evidência da falha de infraestrutura diagnosticada e corrigida (probes PASS/PASS).

O RUN_01 válido vive em `../v02-run-01/`, iniciado do zero após os dois probes de
persistência aprovarem.
