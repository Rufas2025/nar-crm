# Método de descoberta de sinal público

## Princípio central

O objetivo é encontrar **fato verificável**, não impressão geral de "essa escola parece estar crescendo". Uma foto de reforma sem data, sem fonte nomeável e sem confirmação institucional é `READING` no máximo, nunca `FACT`.

## Onde procurar

- Site institucional — página de notícias, "sobre nós", anúncios de matrícula/nova unidade.
- Instagram/LinkedIn institucional — posts recentes sobre obra, inauguração, expansão.
- Imprensa local — veículos regionais frequentemente cobrem inauguração de escola/campus antes de veículos nacionais.
- Portais educacionais — notícias do setor, rankings, eventos.
- Mantenedora/rede — quando a instituição pertence a um grupo maior, o movimento pode ser anunciado no nível da rede, não da unidade.
- Fornecedores/parceiros — anúncios de fornecedores (construtoras, integradoras) às vezes citam o cliente antes da própria instituição anunciar.
- Anúncios públicos da própria instituição — comunicados oficiais, editais, matrícula aberta para nova unidade.

## Como registrar o achado

1. Nomear a fonte exata (URL, veículo, perfil) — nunca "encontrei em algum lugar".
2. Extrair o `FACT` literal — o que a fonte de fato afirma, sem adjetivo adicionado.
3. Separar a `READING` — o que esse fato provavelmente significa em contexto (ex.: "abriu matrícula para nova unidade" → provavelmente já concluiu ou está concluindo a obra).
4. Separar a `COMMERCIAL_HYPOTHESIS` — o que isso pode significar para a NAR especificamente (ex.: "nova unidade pode precisar de infraestrutura/tecnologia nova").
5. Registrar a data encontrada (`signal_date`/`publication_date`/`source_date`) exatamente como a fonte apresenta — nunca aproximar ou inferir uma data plausível.

## Quando a busca não encontra nada

Ausência de resultado não é `NOT_ELIGIBLE` automático — é falta de evidência. Se a missão de descoberta partiu de um sinal razoável (ex.: uma pista de rede social mencionando a instituição) mas a pesquisa aprofundada não confirma, o candidato vai para `REVIEW_REQUIRED` (não `NOT_ELIGIBLE`), com `eligibility_reason` explicando a lacuna especificamente.

## Anti-padrões

- Declarar "instituição em expansão" só porque o site tem fotos de obra sem data.
- Assumir que um Instagram ativo e bonito implica investimento recente.
- Preencher `signal_date` com a data de hoje quando a fonte não data o evento.
- Tratar "não achei nada de negativo" como "confirmado que está tudo bem" — a ausência de sinal contrário não é evidência positiva.
