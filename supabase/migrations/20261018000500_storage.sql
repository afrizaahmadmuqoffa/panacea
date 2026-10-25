insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('claim-images', 'claim-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('report-attachments', 'report-attachments', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('kb-documents', 'kb-documents', false, 10485760, array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "claim_images_owner_read" on storage.objects
for select to authenticated
using (bucket_id = 'claim-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "claim_images_owner_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'claim-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "claim_images_owner_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'claim-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "report_attachments_owner_read" on storage.objects
for select to authenticated
using (bucket_id = 'report-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "report_attachments_owner_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'report-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "report_attachments_owner_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'report-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
