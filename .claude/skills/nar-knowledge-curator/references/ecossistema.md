# Ecossistema NAR ECO — fronteiras de propriedade

Este arquivo define quem é dono do quê. Consulte-o sempre que a atribuição de propriedade
de um bloco de informação não for imediatamente óbvia — que é a maioria dos casos reais,
porque documentos legados foram escritos antes desta arquitetura existir.

## Topologia

```
                    ┌─────────────────────────────────┐
                    │   ORQUESTRADOR                  │
                    │   NAR ECO Soluções              │
                    │   persona: Nathalia Serrano     │
                    └────────────┬────────────────────┘
                                 │  roteia
        ┌───────────┬────────────┼────────────┬──────────────────┐
        │           │            │            │                  │
   ┌────▼───┐  ┌────▼────┐  ┌────▼─────┐ ┌────▼─────┐  ┌─────────▼──────────┐
   │EduInfo │  │ Gennera │  │Eco Clear │ │ Educbank │  │ Vibe Flow          │
   │        │  │         │  │          │ │          │  │ Educacional        │
   └────────┘  └─────────┘  └──────────┘ └──────────┘  └────────────────────┘
        SUBAGENTES DE MARCA
                                 │
                    ┌────────────▼────────────┐
                    │  SUBAGENTE TRANSVERSAL  │
                    │  Agenda                 │
                    └─────────────────────────┘
```

**NAR ECO Soluções não é uma marca.** É a camada de orquestração. Quando um documento diz
"regra comercial NAR ECO", pergunte se a regra vale para todas as marcas (então é global e
pertence ao orquestrador) ou se é uma regra de uma marca específica que por acaso foi escrita
em um documento do NAR ECO (então pertence à marca). Essa distinção é a fonte de erro mais
comum de toda a curadoria.

**Agenda não é uma marca.** É um subagente transversal que atende todas as marcas. Regras de
agendamento da EduInfo e da Gennera vivem ambas na Agenda — não nos subagentes de marca.

**Eco Clear** — sempre em duas palavras. Nunca "EcoClear".

## O que pertence ao orquestrador (NAR ECO / Nathalia)

O orquestrador precisa do mapa, não do território. Ele carrega:

- Identidade e papel da Nathalia; persona e tom de voz global
- Compreensão de quem é o usuário e do contexto da conversa
- Classificação de intenção e **roteamento**: qual especialista atende qual domínio
- Regras globais de conversa (idioma, formalidade, limites, o que nunca dizer)
- Governança e segurança global: LGPD, dados sensíveis, escalonamento para humano
- Regras comerciais que valem para **todas** as marcas

O que ele explicitamente **não** carrega: catálogos de produto, tabelas de preço, FAQs de
marca, tratamento de objeções, cases, links sociais de marca, argumentos de venda específicos,
detalhes de integração. Nada disso é necessário para *decidir quem atende* — só para
*responder*, e responder é trabalho de quem tem o domínio.

Teste prático: se o orquestrador consegue rotear corretamente sem a informação, a informação
não é dele.

## O que pertence a um subagente de marca

Para cada uma das cinco marcas, o respectivo subagente é dono de:

- Posicionamento, proposta de valor e diferenciais da marca
- Catálogo de produtos e soluções, capacidades e limitações
- Preços e condições comerciais **específicas daquela marca**
- FAQ, objeções e respostas
- Cases, provas sociais e depoimentos
- Tom de voz específico, quando diverge do global
- Canais oficiais: site, redes sociais, materiais
- Documentação técnica e de integração da marca

**Isolamento**: nenhum desses blocos deve ser recuperável por outro subagente de marca sem
justificativa explícita. Um case da Eco Clear não deve aparecer para quem pergunta sobre a
Gennera — não é só ruído de recuperação, é risco de a resposta atribuir a uma marca algo que
pertence a outra.

## O que pertence ao subagente Agenda

Todo conteúdo transversal de agendamento, independentemente da marca de origem:

- Disponibilidade de calendário e janelas de atendimento
- Booking, reagendamento, cancelamento
- Regras de reunião e tipos de reunião
- Qualificação prévia ao agendamento
- Links de agendamento
- Responsáveis por cada tipo de reunião
- Restrições de agenda
- Regras de confirmação e lembrete
- Follow-up relacionado a reuniões

Quando encontrar regras de agendamento dentro de um documento de marca ou de governança, isso
é candidato forte a MOVE ou SPLIT para a Agenda. O sinal típico: o documento fala de "o que
vendemos" por dez parágrafos e de repente explica como marcar a demonstração.

Exceção que vale registrar em vez de mover cegamente: quando o *critério de qualificação* para
agendar é específico da marca (ex.: só agenda demo quem tem mais de X alunos), o critério é da
marca e a mecânica de agendamento é da Agenda. Nesse caso, SPLIT com dependência documentada.

## Conhecimento genuinamente global

Permanece global apenas o que é verdadeiro para o ecossistema inteiro:

- Identidade e institucional do NAR ECO enquanto orquestrador
- Governança, compliance, LGPD, política de dados
- Regras de conversa e escalonamento válidas para todos os agentes
- Índice mestre e mapa da arquitetura de conhecimento
- Convenções de nomenclatura e versionamento

Critério de decisão: se a informação mudar quando uma marca sair do ecossistema, ela não é
global — é da marca.

## Casos ambíguos e como resolvê-los

**Documento institucional que descreve todas as marcas.** O institucional do NAR ECO é global;
as descrições de cada marca são resumos para roteamento. Mantenha no orquestrador apenas o
suficiente para rotear (uma linha por marca: domínio que ela cobre). O detalhe vai para a marca.

**Pitch ou playbook que mistura discurso global e argumentos por marca.** SPLIT: a estrutura do
pitch e as regras de condução são globais; os argumentos, provas e objeções por marca vão para
cada subagente.

**Informação que serve a duas marcas.** Verifique se é realmente a mesma informação ou duas
informações parecidas. Se for a mesma e for genuinamente compartilhada, promova a global e faça
as marcas referenciarem. Se for parecida mas não idêntica, são duas informações com donos
distintos — e provavelmente havia um conflito latente ali.

**Documento sem dono claro.** Não force. Registre como gap de arquitetura e marque para
validação humana: quase sempre significa que falta um documento canônico que ninguém escreveu.
