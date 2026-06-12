## Plano: Envio em lote + Anexos (Fase 1) no WhatsApp

### Objetivo 1 — Envio em lote personalizado (3+ leads)

**Onde**: nova ação em `src/pages/LeadsPage.tsx` (já existe seleção em massa de leads conforme memória "Bulk Actions Leads").

1. Adicionar botão "Enviar WhatsApp em lote" na barra de ações em massa, ativo quando 1+ leads com telefone estiverem selecionados.
2. Criar componente `src/components/WhatsappBulkModal.tsx`:
   - Campo de saudação (default `Olá, {{nome}}, tudo bem?`).
   - Campo de corpo da mensagem com suporte a `{{nome}}` e `{{link}}`.
   - Campo opcional de link (mesma validação `https?://` já usada no modal individual).
   - Lista de leads selecionados (com telefone válido); leads sem telefone são descartados com aviso.
   - Preview individual rotativo (ao menos os 3 primeiros leads renderizados lado a lado em cards).
   - Função `renderTemplate(lead, template)`:
     - `{{nome}}` → primeiro nome do lead; se ausente, saudação vira `Olá, tudo bem?`.
     - `{{link}}` → URL informada.
3. Envio sequencial (loop `for...of` com `await`) reutilizando a função existente `sendWhatsAppMessage` (não tocar em `evolution-send-message`). Pequeno `sleep(800ms)` entre envios para não saturar a Evolution GO.
4. Progresso em tempo real no modal: lista com status por lead (Pendente / Enviando / ✅ Enviado / ❌ Erro + motivo).
5. Cada envio bem-sucedido já registra interação via Edge Function atual (mantém histórico por lead).
6. Ao final: toast com `X de Y enviados` e botão "Fechar". Não fecha automaticamente se houver erros.

### Objetivo 2 — Anexos Fase 1 (imagem + PDF)

**Storage**:
- Criar bucket privado `whatsapp-attachments` via tool de storage.
- Policy RLS em `storage.objects`: usuário autenticado pode INSERT/SELECT apenas em arquivos sob `{auth.uid()}/...`.

**Frontend** (`LeadDetailPage.tsx` modal individual + bulk modal):
- Substituir botão "Anexo (em breve)" por `<Input type="file" accept="image/jpeg,image/png,image/webp,application/pdf">`.
- Limite 10 MB; validar mime + tamanho.
- Mostrar nome, tamanho e (para imagens) preview via `URL.createObjectURL`.
- Botão X para remover antes de enviar.
- Upload via `supabase.storage.from("whatsapp-attachments").upload(...)` no momento do envio; gera path `{userId}/{uuid}.{ext}` e signed URL de 1h.

**Edge Function** (`evolution-send-message`):
- Aceitar campos opcionais `mediaUrl`, `mediaType` (`image` | `document`), `fileName`.
- Se `mediaUrl` presente:
  - Tentar `POST /send/image` (image) ou `POST /send/document` (document) na Evolution GO com body `{ number, image|document: mediaUrl, caption: message, fileName }`.
  - Se a Evolution GO retornar 404/endpoint não encontrado: marcar `attachmentDeferred: true` no response e ainda assim enviar o texto via `/send/text` para não perder a mensagem.
- Resposta inclui `attachmentDeferred` para o frontend exibir toast: "Upload realizado, mas envio de anexo ainda depende do deploy da função de mídia."
- Sem expor API Key (continua só no backend, como hoje).

### Não-mudanças
- Não tocar no envio individual de texto (já validado).
- Não fazer merge do PR #1.
- Layout dos modais preservado, apenas adiciona campo de anexo + (no bulk) lista de preview.

### Arquivos previstos
- `src/components/WhatsappBulkModal.tsx` (novo)
- `src/pages/LeadsPage.tsx` (botão na bulk bar + abrir modal)
- `src/pages/LeadDetailPage.tsx` (input de anexo no modal individual)
- `src/lib/evolution.ts` (parâmetros opcionais de mídia no `sendWhatsAppMessage`)
- `supabase/functions/evolution-send-message/index.ts` (mídia + fallback)
- Nova migration para policies do bucket `whatsapp-attachments`
- Storage bucket criado via tool

### Teste
- Envio de texto+link em lote para 3 leads de teste, conferindo personalização do nome e histórico em cada lead.
- Upload de 1 PNG e 1 PDF; se endpoint de mídia falhar, conferir toast informativo + texto entregue.

Confirma para eu implementar?
