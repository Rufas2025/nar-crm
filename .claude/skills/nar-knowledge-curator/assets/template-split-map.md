# Template — SPLIT MAP

Use quando a decisão for SPLIT. Toda seção do documento de origem precisa aparecer aqui: se
alguma sobrar sem destino, isso é um achado de arquitetura (conteúdo órfão), e deve ser
registrado explicitamente em vez de silenciosamente descartado.

```
SPLIT MAP
<seção de origem>  ->  <documento de destino>  ->  <agente/pasta de destino>  ->  <camada>
```

Exemplo:

```
SPLIT MAP
Regra global de abertura      -> NAR_ECO_Regras_Globais_de_Atendimento -> NAR ECO (orquestrador) -> SYSTEM
Posicionamento EduInfo        -> EduInfo_Identidade_e_Posicionamento   -> EduInfo               -> RAG
Cases Eco Clear               -> Eco_Clear_Cases_e_Provas              -> Eco Clear             -> RAG
Regras de reagendamento       -> Agenda_Regras_de_Reagendamento        -> Agenda                -> WORKFLOW
Material comercial (PDF)      -> Gennera_Apresentacao_Comercial        -> Gennera               -> ASSET
```

Regras que o mapa precisa respeitar:

- Nenhuma seção de marca migra para outra marca.
- Conteúdo transversal de agendamento vai para a Agenda, independentemente da marca de origem.
- Quando duas seções carregam o mesmo fato, apenas uma vira fonte canônica; a outra referencia.
- Dependências entre destinos ficam registradas no relatório, não duplicadas no conteúdo.
