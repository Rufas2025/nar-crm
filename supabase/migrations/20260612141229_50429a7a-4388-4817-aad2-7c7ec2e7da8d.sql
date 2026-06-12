
-- Authenticated users manage only their own folder (user_id as first path segment)
CREATE POLICY "wa_attachments_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'whatsapp-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "wa_attachments_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'whatsapp-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "wa_attachments_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'whatsapp-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "wa_attachments_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'whatsapp-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
