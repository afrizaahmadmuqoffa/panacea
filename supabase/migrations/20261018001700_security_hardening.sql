-- 01700: hardening keamanan, guard forum, rate limit aksi, dan helper RPC.
--
-- Latar: audit 4 pilar. Data existing sudah dicek sebelum migration ini:
--   - 0 laporan aktif duplikat per klaim (aman untuk unique index).
--   - 0 baris forum dengan alias berbeda dari profil (aman untuk trigger).
--   - leaderboard_archives kosong (aman untuk unique period_start).

-- 1) Fungsi tidak boleh dieksekusi role PUBLIC/anon.
--
-- Postgres memberi EXECUTE ke PUBLIC saat CREATE FUNCTION. Grant "to authenticated"
-- di 00400 hanya menambah grant, tidak mencabut PUBLIC, sehingga match_kb_chunks
-- sempat bisa dipanggil tanpa login. Semua fungsi dikunci di sini, lalu grant
-- eksplisit hanya untuk yang benar-benar dipakai klien.
revoke execute on all functions in schema public from public, anon;
revoke execute on all functions in schema private from public, anon;

grant execute on function public.get_my_role() to authenticated;
grant execute on function public.claim_rate_limit(integer, integer) to authenticated;
grant execute on function public.route_claim_report(uuid) to authenticated;
grant execute on function public.submit_expert_review(
  uuid, public.verdict, text, text, text, text, text, text, jsonb, text, text, boolean
) to authenticated;
grant execute on function public.increment_thread_views(uuid) to authenticated;
grant execute on function public.start_game_session() to authenticated;
grant execute on function public.submit_game_answer(uuid, uuid, boolean) to authenticated;
grant execute on function public.finish_game_session(uuid) to authenticated;
grant execute on function public.leaderboard_entries(text) to authenticated;

-- Pencarian KB hanya dipakai pipeline analisis di server.
revoke execute on function public.match_kb_chunks(extensions.vector, text, integer, double precision)
  from public, anon, authenticated;
grant execute on function public.match_kb_chunks(extensions.vector, text, integer, double precision)
  to service_role;
revoke execute on function public.match_kb_chunks_array(double precision[], text, integer, double precision)
  from public, anon, authenticated;
grant execute on function public.match_kb_chunks_array(double precision[], text, integer, double precision)
  to service_role;

-- 2) claim_reports: hanya boleh dibuat untuk klaim sendiri, status awal tetap
--    waiting_assignment, alasan dibatasi, dan satu laporan aktif per klaim.
drop policy if exists reports_reporter_insert on public.claim_reports;
create policy reports_reporter_insert on public.claim_reports for insert
  with check (
    reporter_id = auth.uid()
    and publication_ack = true
    and status = 'waiting_assignment'
    and char_length(reason) between 1 and 3000
    and coalesce(array_length(reference_urls, 1), 0) <= 10
    and (attachment_path is null or attachment_path like auth.uid()::text || '/%')
    and exists (
      select 1 from public.claims c
      where c.id = claim_reports.claim_id and c.user_id = auth.uid()
    )
  );

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'claim_reports_reason_len'
  ) then
    alter table public.claim_reports
      add constraint claim_reports_reason_len check (char_length(reason) <= 3000);
  end if;
end;
$$;

create unique index if not exists claim_reports_active_claim_uidx
  on public.claim_reports (claim_id) where status <> 'closed';

-- 3) claims: user hanya boleh membuat klaim berstatus queued.
drop policy if exists claims_owner_insert on public.claims;
create policy claims_owner_insert on public.claims for insert
  with check (
    user_id = auth.uid()
    and status = 'queued'
    and (image_path is null or image_path like auth.uid()::text || '/%')
  );

-- 4) Forum: alias dan kolom identitas tidak boleh dipalsukan penulis sendiri.
create or replace function private.set_forum_author_alias()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
declare
  v_alias text;
begin
  select p.alias into v_alias from public.profiles p where p.id = new.author_id;
  if v_alias is not null then
    new.author_alias := v_alias;
  end if;
  if tg_table_name = 'forum_threads' then
    new.views := 0;
    new.is_locked := false;
  end if;
  return new;
end;
$$;

revoke execute on function private.set_forum_author_alias() from public, anon, authenticated;

drop trigger if exists forum_comments_author_alias on public.forum_comments;
create trigger forum_comments_author_alias
  before insert on public.forum_comments
  for each row execute function private.set_forum_author_alias();

drop trigger if exists forum_threads_author_alias on public.forum_threads;
create trigger forum_threads_author_alias
  before insert on public.forum_threads
  for each row execute function private.set_forum_author_alias();

-- Penulis boleh mengubah isi, tapi tidak boleh memindahkan komentar, mengganti
-- alias, menautkan feed lain, atau menandai komentar sebagai balasan AI.
create or replace function private.guard_forum_comment_identity()
returns trigger
language plpgsql
set search_path = private, public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.author_alias is distinct from old.author_alias
    or new.thread_id is distinct from old.thread_id
    or new.linked_feed_id is distinct from old.linked_feed_id
    or new.ai_reply_to is distinct from old.ai_reply_to
    or new.author_id is distinct from old.author_id
  then
    raise exception 'Kolom identitas komentar tidak dapat diubah.';
  end if;
  return new;
end;
$$;

revoke execute on function private.guard_forum_comment_identity() from public, anon, authenticated;

drop trigger if exists forum_comments_identity_guard on public.forum_comments;
create trigger forum_comments_identity_guard
  before update on public.forum_comments
  for each row execute function private.guard_forum_comment_identity();

-- 5) View thread dibatasi satu kali per pengguna per thread per hari.
create or replace function public.increment_thread_views(p_thread_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_views integer;
  v_allowed boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  v_allowed := private.consume_rate_limit(
    'view:' || auth.uid()::text || ':' || p_thread_id::text,
    1,
    86400
  );
  if not v_allowed then
    select views into v_views from public.forum_threads where id = p_thread_id;
    return coalesce(v_views, 0);
  end if;

  update public.forum_threads
  set views = views + 1
  where id = p_thread_id
  returning views into v_views;

  return coalesce(v_views, 0);
end;
$$;

revoke execute on function public.increment_thread_views(uuid) from public, anon;
grant execute on function public.increment_thread_views(uuid) to authenticated;

-- 6) Arsip leaderboard tidak boleh dobel untuk periode yang sama.
create unique index if not exists leaderboard_archives_period_uidx
  on public.leaderboard_archives (period_start);

create or replace function public.archive_leaderboard()
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_entries jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) into v_entries
  from public.leaderboard_entries('weekly') l;

  insert into public.leaderboard_archives (period_start, period_end, entries)
  values (date_trunc('week', now() - interval '1 week'), date_trunc('week', now()), v_entries)
  on conflict (period_start) do nothing;
end;
$$;

revoke execute on function public.archive_leaderboard() from public, anon, authenticated;
grant execute on function public.archive_leaderboard() to service_role;

-- 7) Rate limit untuk aksi yang belum dibatasi (thread, komentar, laporan).
create or replace function public.action_rate_limit(
  p_scope text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language sql
security definer
set search_path = public, private
as $$
  select private.consume_rate_limit(
    p_scope || ':' || auth.uid()::text,
    p_limit,
    p_window_seconds
  );
$$;

revoke execute on function public.action_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.action_rate_limit(text, integer, integer) to authenticated;

-- 8) Bukti analisis ditulis atomik: delete + insert dalam satu transaksi.
create or replace function public.replace_claim_evidence(
  p_analysis_id uuid,
  p_evidence jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_inserted integer;
begin
  delete from public.claim_evidence where analysis_id = p_analysis_id;

  insert into public.claim_evidence (
    analysis_id, title, publisher, year, identifier, url,
    snippet_id, snippet_en, source_type, relevance, source_record_id
  )
  select
    p_analysis_id,
    coalesce(item->>'title', ''),
    coalesce(item->>'publisher', ''),
    coalesce(nullif(item->>'year', '')::integer, extract(year from now())::integer),
    nullif(item->>'identifier', ''),
    nullif(item->>'url', ''),
    coalesce(item->>'snippetId', ''),
    coalesce(item->>'snippetEn', ''),
    coalesce(item->>'sourceType', 'kb'),
    coalesce(item->>'relevance', 'high'),
    nullif(item->>'sourceRecordId', '')
  from jsonb_array_elements(coalesce(p_evidence, '[]'::jsonb)) as item;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke execute on function public.replace_claim_evidence(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_claim_evidence(uuid, jsonb) to service_role;

-- 9) Chunk KB ditulis atomik dan menghormati status per chunk.
--    Signature tetap (uuid, jsonb) supaya pemanggil lama tidak berubah.
create or replace function public.admin_replace_kb_chunks(
  p_source_id uuid,
  p_chunks jsonb
)
returns integer
language plpgsql
security definer
set search_path = private, public
as $$
declare
  inserted_count integer;
begin
  delete from private.kb_chunks where source_id = p_source_id;

  insert into private.kb_chunks (
    source_id, chunk_index, content, token_count, status, approved_by, approved_at
  )
  select
    p_source_id,
    coalesce((item->>'index')::integer, ordinality::integer - 1),
    coalesce(item->>'content', ''),
    greatest(coalesce((item->>'tokenCount')::integer, 1), 1),
    coalesce(nullif(item->>'status', '')::public.kb_chunk_status, 'approved'::public.kb_chunk_status),
    nullif(item->>'approvedBy', '')::uuid,
    case
      when coalesce(nullif(item->>'status', '')::public.kb_chunk_status, 'approved'::public.kb_chunk_status) = 'approved'
        then now()
      else null
    end
  from jsonb_array_elements(p_chunks) with ordinality as t(item, ordinality);

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke execute on function public.admin_replace_kb_chunks(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.admin_replace_kb_chunks(uuid, jsonb) to service_role;

-- 10) Chunk saran reviewer ditulis atomik.
create or replace function public.replace_kb_suggestion_chunks(
  p_suggestion_id uuid,
  p_chunks jsonb
)
returns integer
language plpgsql
security definer
set search_path = private, public
as $$
declare
  inserted_count integer;
begin
  delete from private.kb_suggestion_chunks where suggestion_id = p_suggestion_id;

  insert into private.kb_suggestion_chunks (suggestion_id, chunk_index, content, token_count, status)
  select
    p_suggestion_id,
    coalesce((item->>'index')::integer, ordinality::integer - 1),
    coalesce(item->>'content', ''),
    greatest(coalesce((item->>'tokenCount')::integer, 1), 1),
    'draft'::public.kb_chunk_status
  from jsonb_array_elements(p_chunks) with ordinality as t(item, ordinality);

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke execute on function public.replace_kb_suggestion_chunks(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_kb_suggestion_chunks(uuid, jsonb) to service_role;
