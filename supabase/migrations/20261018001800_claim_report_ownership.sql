-- 01800:Ownership laporan dihitung lewat fungsi security definer.
--
-- Policy insert claim_reports yang mengecek `exists (select 1 from claims ...)`
-- memicu infinite recursion: policy claim_reports membaca claims, sementara
-- policy claims untuk reviewer membaca claim_reports. Fungsi di bawah
-- dijalankan sebagai pemilik tabel sehingga RLS tidak ikut ter Evaluasi.

create or replace function private.user_owns_claim(p_claim_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.claims c
    where c.id = p_claim_id and c.user_id = auth.uid()
  );
$$;

revoke execute on function private.user_owns_claim(uuid) from public, anon;
grant execute on function private.user_owns_claim(uuid) to authenticated;

drop policy if exists reports_reporter_insert on public.claim_reports;
create policy reports_reporter_insert on public.claim_reports for insert
  with check (
    reporter_id = auth.uid()
    and publication_ack = true
    and status = 'waiting_assignment'
    and char_length(reason) between 1 and 3000
    and coalesce(array_length(reference_urls, 1), 0) <= 10
    and (attachment_path is null or attachment_path like auth.uid()::text || '/%')
    and private.user_owns_claim(claim_id)
  );
