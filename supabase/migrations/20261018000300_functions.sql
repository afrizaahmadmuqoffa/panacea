create or replace function private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.slugify(p_value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p_value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_name text;
  v_alias text;
begin
  v_name := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, 'Anggota'), '@', 1));
  v_alias := coalesce(nullif(new.raw_user_meta_data ->> 'alias', ''), v_name);

  insert into public.profiles (id, full_name, alias)
  values (new.id, v_name, v_alias)
  on conflict (id) do nothing;

  insert into private.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid());
$$;

create or replace function private.current_role_is(p_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from private.user_roles r
    where r.user_id = auth.uid() and r.role = p_role
  );
$$;

create or replace function public.get_my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(
    (select r.role from private.user_roles r where r.user_id = auth.uid()),
    'user'::public.user_role
  );
$$;

create or replace function private.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_window timestamptz;
  v_count integer;
begin
  if auth.uid() is null then
    return false;
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into private.rate_limits (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = private.rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

create or replace function public.claim_rate_limit(p_limit integer, p_window_seconds integer)
returns boolean
language sql
security definer
set search_path = public, private
as $$
  select private.consume_rate_limit('claim:' || auth.uid()::text, p_limit, p_window_seconds);
$$;

create or replace function public.route_claim_report(p_report_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user uuid := auth.uid();
  v_report record;
  v_count integer := 0;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select r.id, r.claim_id, r.reporter_id, r.status, c.category_id
  into v_report
  from public.claim_reports r
  join public.claims c on c.id = r.claim_id
  where r.id = p_report_id
  for update;

  if not found then
    raise exception 'Report not found';
  end if;
  if v_report.reporter_id <> v_user and not private.current_role_is('admin') then
    raise exception 'Not allowed';
  end if;
  if v_report.status <> 'waiting_assignment' then
    return 0;
  end if;

  insert into public.claim_review_assignments (report_id, reviewer_id)
  select p_report_id, rv.id
  from public.reviewers rv
  where rv.is_available = true
    and rv.id <> v_report.reporter_id
    and (
      v_report.category_id is null
      or exists (
        select 1 from public.reviewer_categories rc
        where rc.reviewer_id = rv.id and rc.category_id = v_report.category_id
      )
    )
  on conflict (report_id, reviewer_id) do nothing;

  get diagnostics v_count = row_count;

  if v_count > 0 then
    update public.claim_reports set status = 'assigned', updated_at = now() where id = p_report_id;
  end if;

  insert into private.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (v_user, 'route_claim_report', 'claim_report', p_report_id::text, jsonb_build_object('assignments', v_count));

  return v_count;
end;
$$;

create or replace function public.submit_expert_review(
  p_report_id uuid,
  p_verdict public.verdict,
  p_summary_id text,
  p_summary_en text,
  p_limitations_id text,
  p_limitations_en text,
  p_expert_note_id text,
  p_expert_note_en text,
  p_evidence jsonb,
  p_public_title_id text,
  p_public_title_en text,
  p_confirm boolean
)
returns table (feed_id uuid, canonical boolean, conflict boolean)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user uuid := auth.uid();
  v_report record;
  v_assignment_id uuid;
  v_existing uuid;
  v_review_id uuid;
  v_feed_id uuid;
  v_canonical boolean;
  v_conflict boolean := false;
  v_slug text;
  v_canonical_verdict public.verdict;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  if p_confirm is not true then
    raise exception 'Publication confirmation required';
  end if;
  if jsonb_typeof(p_evidence) <> 'array' or jsonb_array_length(p_evidence) < 1 then
    raise exception 'At least one evidence item is required';
  end if;

  select r.id, r.claim_id, r.reporter_id, r.status, c.category_id, c.original_text, c.user_id
  into v_report
  from public.claim_reports r
  join public.claims c on c.id = r.claim_id
  where r.id = p_report_id
  for update;

  if not found then
    raise exception 'Report not found';
  end if;

  select a.id into v_assignment_id
  from public.claim_review_assignments a
  where a.report_id = p_report_id and a.reviewer_id = v_user;

  if v_assignment_id is null then
    raise exception 'Reviewer assignment required';
  end if;

  select er.id into v_existing
  from public.expert_reviews er
  where er.report_id = p_report_id and er.reviewer_id = v_user;

  if v_existing is not null then
    raise exception 'Review already submitted';
  end if;

  select exists (
    select 1 from public.expert_reviews er
    where er.report_id = p_report_id and er.is_canonical = true
  ) into v_canonical;

  insert into public.expert_reviews (
    report_id, assignment_id, reviewer_id, verdict,
    summary_id, summary_en, limitations_id, limitations_en,
    expert_note_id, expert_note_en, evidence, is_canonical, conflict
  )
  values (
    p_report_id, v_assignment_id, v_user, p_verdict,
    p_summary_id, p_summary_en, p_limitations_id, p_limitations_en,
    p_expert_note_id, p_expert_note_en, p_evidence, not v_canonical, false
  )
  returning id into v_review_id;

  if v_assignment_id is not null then
    update public.claim_review_assignments
    set status = case when v_canonical then 'submitted_supplemental'::public.assignment_status else 'submitted_primary'::public.assignment_status end,
        submitted_at = now()
    where id = v_assignment_id;
  end if;

  if not v_canonical then
    v_slug := private.slugify(coalesce(nullif(p_public_title_en, ''), p_summary_en)) || '-' || left(p_report_id::text, 8);

    insert into public.verified_feed (
      slug, title_id, title_en, public_claim_text_id, public_claim_text_en,
      verdict, summary_id, summary_en, expert_note_id, expert_note_en,
      limitations_id, limitations_en, evidence, category_id, methodology_version,
      status, reviewer_count, canonical_review_id, created_by
    )
    values (
      v_slug, p_public_title_id, p_public_title_en, v_report.original_text, v_report.original_text,
      p_verdict, p_summary_id, p_summary_en, p_expert_note_id, p_expert_note_en,
      p_limitations_id, p_limitations_en, p_evidence, v_report.category_id, 'RAG-2026.10',
      'visible', 1, v_review_id, v_user
    )
    returning id into v_feed_id;

    insert into private.feed_internal_links (feed_id, claim_id, report_id, review_id)
    values (v_feed_id, v_report.claim_id, p_report_id, v_review_id);

    update public.claim_reports set status = 'finalized', updated_at = now() where id = p_report_id;
    update public.claims set status = 'finalized', updated_at = now() where id = v_report.claim_id;

    insert into public.notifications (user_id, type, title_id, title_en, body_id, body_en, href)
    values (
      v_report.reporter_id, 'expert_result',
      'Putusan pakar tersedia', 'Expert verdict available',
      'Klaimmu sudah ditinjau dan masuk ke feed terverifikasi.', 'Your claim has been reviewed and published in the verified feed.',
      '/feed-terverifikasi/' || v_slug
    );

    insert into private.audit_logs (actor_id, action, target_type, target_id, metadata)
    values (v_user, 'submit_canonical_review', 'claim_report', p_report_id::text, jsonb_build_object('feed_id', v_feed_id));
  else
    select er.verdict into v_canonical_verdict
    from public.expert_reviews er
    where er.report_id = p_report_id and er.is_canonical = true;

    select f.id into v_feed_id
    from public.verified_feed f
    join private.feed_internal_links l on l.feed_id = f.id
    where l.report_id = p_report_id;

    update public.verified_feed
    set reviewer_count = reviewer_count + 1, updated_at = now()
    where id = v_feed_id;

    if v_canonical_verdict is distinct from p_verdict then
      v_conflict := true;
      update public.claim_reports set status = 'needs_admin_review', updated_at = now() where id = p_report_id;
      update public.verified_feed set status = 'hidden', updated_at = now() where id = v_feed_id;
      update public.expert_reviews set conflict = true where id = v_review_id;
      insert into public.review_disputes (report_id, feed_id, opened_by, status, note)
      values (p_report_id, v_feed_id, v_user, 'open', 'Verdict reviewer berbeda dengan putusan kanonis.');
      insert into public.notifications (user_id, type, title_id, title_en, body_id, body_en, href)
      values (
        v_report.reporter_id, 'report',
        'Review pakar perlu peninjauan admin', 'Expert review needs admin review',
        'Ada perbedaan putusan reviewer. Admin akan meninjau sebelum publikasi.', 'Reviewers disagree. An admin will review before publication.',
        '/riwayat-klaim'
      );
    end if;

    insert into private.audit_logs (actor_id, action, target_type, target_id, metadata)
    values (v_user, 'submit_supplemental_review', 'claim_report', p_report_id::text, jsonb_build_object('feed_id', v_feed_id, 'conflict', v_conflict));
  end if;

  return query select v_feed_id, not v_canonical, v_conflict;
end;
$$;

create or replace function public.match_kb_chunks(
  p_query_embedding extensions.vector(768),
  p_query_text text,
  p_top_k integer default 8,
  p_min_score double precision default 0.55
)
returns table (chunk_id uuid, source_id uuid, content text, similarity double precision, rrf_score double precision)
language sql
stable
security definer
set search_path = public, private, extensions
as $$
  with vector_hits as (
    select c.id,
           1 - (c.embedding <=> p_query_embedding) as similarity,
           row_number() over (order by c.embedding <=> p_query_embedding) as rank
    from private.kb_chunks c
    where c.status = 'ingested' and c.embedding is not null
    order by c.embedding <=> p_query_embedding
    limit greatest(p_top_k * 3, 12)
  ),
  text_hits as (
    select c.id,
           ts_rank_cd(c.search_vector, plainto_tsquery('simple', p_query_text)) as text_rank,
           row_number() over (order by ts_rank_cd(c.search_vector, plainto_tsquery('simple', p_query_text)) desc) as rank
    from private.kb_chunks c
    where c.status = 'ingested'
      and c.search_vector @@ plainto_tsquery('simple', p_query_text)
    limit greatest(p_top_k * 3, 12)
  ),
  combined as (
    select coalesce(v.id, t.id) as id,
           coalesce(v.similarity, 0) as similarity,
           coalesce(1.0 / (60 + v.rank), 0) + coalesce(1.0 / (60 + t.rank), 0) as rrf_score
    from vector_hits v
    full join text_hits t on v.id = t.id
  )
  select c.id, k.source_id, k.content, c.similarity, c.rrf_score
  from combined c
  join private.kb_chunks k on k.id = c.id
  where c.similarity >= p_min_score or c.rrf_score > 0
  order by c.rrf_score desc, c.similarity desc
  limit p_top_k;
$$;

create or replace function public.match_kb_chunks_array(
  p_query_embedding double precision[],
  p_query_text text,
  p_top_k integer default 8,
  p_min_score double precision default 0.55
)
returns table (chunk_id uuid, source_id uuid, content text, similarity double precision, rrf_score double precision)
language sql
stable
security definer
set search_path = public, private, extensions
as $$
  select *
  from public.match_kb_chunks(
    ('[' || array_to_string(p_query_embedding, ',') || ']')::extensions.vector,
    p_query_text,
    p_top_k,
    p_min_score
  );
$$;

create or replace function public.set_kb_embedding(
  p_chunk_id uuid,
  p_embedding double precision[]
)
returns void
language sql
security definer
set search_path = public, private, extensions
as $$
  update private.kb_chunks
  set embedding = ('[' || array_to_string(p_embedding, ',') || ']')::extensions.vector,
      status = 'ingested',
      updated_at = now()
  where id = p_chunk_id;
$$;

create or replace function public.leaderboard_entries(p_period text default 'weekly')
returns table (rank integer, alias text, xp integer, streak integer, is_current_user boolean, inactive boolean)
language sql
stable
security definer
set search_path = public, private
as $$
  with scores as (
    select p.id, p.alias, p.streak, p.last_active_at,
           case
             when p_period = 'weekly' then coalesce(sum(e.amount), 0)::integer
             else p.xp
           end as xp
    from public.profiles p
    left join public.xp_events e
      on p_period = 'weekly' and e.user_id = p.id and e.created_at >= now() - interval '7 days'
    where p.show_on_leaderboard = true
    group by p.id, p.alias, p.xp, p.streak, p.last_active_at
  )
  select row_number() over (order by xp desc, alias)::integer as rank,
         alias,
         xp,
         streak,
         id = auth.uid() as is_current_user,
         coalesce(last_active_at < now() - interval '180 days', true) as inactive
  from scores
  order by xp desc, alias
  limit 100;
$$;

create or replace function public.start_game_session()
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user uuid := auth.uid();
  v_allowed boolean;
  v_session_id uuid;
  v_statement_ids uuid[];
  v_questions jsonb;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  v_allowed := private.consume_rate_limit('game:' || v_user::text, 5, 86400);
  if not v_allowed then
    raise exception 'Daily game limit reached';
  end if;

  select array_agg(id) into v_statement_ids
  from (
    select id from public.game_statements
    where is_active = true
    order by random()
    limit 10
  ) picked;

  if coalesce(array_length(v_statement_ids, 1), 0) = 0 then
    raise exception 'No active game statements';
  end if;

  insert into public.game_sessions (user_id, statement_ids)
  values (v_user, v_statement_ids)
  returning id into v_session_id;

  select jsonb_agg(jsonb_build_object(
    'id', g.id,
    'statementId', g.id,
    'statement', g.statement_id,
    'statementEn', g.statement_en,
    'categorySlug', c.slug
  ) order by g.id)
  into v_questions
  from public.game_statements g
  left join public.categories c on c.id = g.category_id
  where g.id = any(v_statement_ids);

  return jsonb_build_object('sessionId', v_session_id, 'questions', v_questions);
end;
$$;

create or replace function public.submit_game_answer(
  p_session_id uuid,
  p_statement_id uuid,
  p_answer_is_fact boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user uuid := auth.uid();
  v_session record;
  v_statement record;
  v_existing record;
  v_correct boolean;
  v_streak integer;
  v_xp integer;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_session
  from public.game_sessions
  where id = p_session_id and user_id = v_user and status = 'active'
  for update;

  if not found then
    raise exception 'Active game session not found';
  end if;
  if not (p_statement_id = any(v_session.statement_ids)) then
    raise exception 'Statement is not part of this session';
  end if;

  select id, is_fact, explanation_id, explanation_en, source_url
  into v_statement
  from public.game_statements
  where id = p_statement_id;

  select * into v_existing
  from public.game_answers
  where session_id = p_session_id and statement_id = p_statement_id;

  if found then
    return jsonb_build_object(
      'isCorrect', v_existing.is_correct,
      'xpAwarded', 0,
      'isFact', v_statement.is_fact,
      'explanationId', v_statement.explanation_id,
      'explanationEn', v_statement.explanation_en,
      'sourceUrl', v_statement.source_url,
      'alreadyAnswered', true
    );
  end if;

  v_correct := v_statement.is_fact = p_answer_is_fact;
  select count(*)::integer into v_streak
  from public.game_answers
  where session_id = p_session_id and is_correct = true;

  v_xp := case
    when v_correct then 10 + least(v_streak, 3) * 5
    else 0
  end;

  insert into public.game_answers (session_id, statement_id, answer_is_fact, is_correct, xp_awarded)
  values (p_session_id, p_statement_id, p_answer_is_fact, v_correct, v_xp);

  if v_xp > 0 then
    update public.profiles set xp = xp + v_xp, updated_at = now() where id = v_user;
    insert into public.xp_events (user_id, amount, source, source_id)
    values (v_user, v_xp, 'game_answer', p_statement_id::text);
  end if;

  return jsonb_build_object(
    'isCorrect', v_correct,
    'xpAwarded', v_xp,
    'isFact', v_statement.is_fact,
    'explanationId', v_statement.explanation_id,
    'explanationEn', v_statement.explanation_en,
    'sourceUrl', v_statement.source_url,
    'alreadyAnswered', false
  );
end;
$$;

create or replace function public.finish_game_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user uuid := auth.uid();
  v_session record;
  v_correct integer;
  v_xp integer;
  v_new_badges jsonb := '[]'::jsonb;
  v_badge record;
  v_total_correct integer;
  v_streak integer;
  v_last_active date;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_session
  from public.game_sessions
  where id = p_session_id and user_id = v_user
  for update;

  if not found then
    raise exception 'Game session not found';
  end if;
  if v_session.status = 'finished' then
    return jsonb_build_object(
      'sessionId', p_session_id,
      'correctCount', v_session.correct_count,
      'xpEarned', v_session.xp_earned,
      'badges', '[]'::jsonb
    );
  end if;

  select count(*)::integer, coalesce(sum(xp_awarded), 0)::integer
  into v_correct, v_xp
  from public.game_answers
  where session_id = p_session_id;

  update public.game_sessions
  set status = 'finished', correct_count = v_correct, xp_earned = v_xp, finished_at = now()
  where id = p_session_id;

  select count(*)::integer into v_total_correct
  from public.game_answers a
  join public.game_sessions s on s.id = a.session_id
  where s.user_id = v_user and a.is_correct = true;

  select last_active_at::date into v_last_active from public.profiles where id = v_user;
  v_streak := case
    when v_last_active = current_date then (select streak from public.profiles where id = v_user)
    when v_last_active = current_date - 1 then (select streak from public.profiles where id = v_user) + 1
    else 1
  end;

  update public.profiles
  set streak = greatest(streak, v_streak), last_active_at = now(), updated_at = now()
  where id = v_user;

  for v_badge in
    select b.code, b.name_id, b.name_en, b.description_id, b.description_en
    from public.badges b
    where b.is_active = true
      and (
        (b.type = 'verification_count' and b.threshold <= v_total_correct)
        or (b.type = 'streak' and b.threshold <= v_streak)
      )
      and not exists (
        select 1 from public.user_badges ub where ub.user_id = v_user and ub.badge_code = b.code
      )
  loop
    insert into public.user_badges (user_id, badge_code)
    values (v_user, v_badge.code);

    insert into public.notifications (user_id, type, title_id, title_en, body_id, body_en, href)
    values (
      v_user, 'badge',
      'Badge baru: ' || v_badge.name_id, 'New badge: ' || v_badge.name_en,
      v_badge.description_id, v_badge.description_en, '/badge'
    );

    v_new_badges := v_new_badges || jsonb_build_array(jsonb_build_object('code', v_badge.code));
  end loop;

  insert into private.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (v_user, 'finish_game_session', 'game_session', p_session_id::text, jsonb_build_object('correct', v_correct, 'xp', v_xp));

  return jsonb_build_object(
    'sessionId', p_session_id,
    'correctCount', v_correct,
    'xpEarned', v_xp,
    'badges', v_new_badges
  );
end;
$$;

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
  values (date_trunc('week', now() - interval '1 week'), date_trunc('week', now()), v_entries);
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function private.touch_updated_at();
create trigger categories_touch before update on public.categories for each row execute function private.touch_updated_at();
create trigger reviewers_touch before update on public.reviewers for each row execute function private.touch_updated_at();
create trigger claims_touch before update on public.claims for each row execute function private.touch_updated_at();
create trigger analyses_touch before update on public.claim_analyses for each row execute function private.touch_updated_at();
create trigger reports_touch before update on public.claim_reports for each row execute function private.touch_updated_at();
create trigger feed_touch before update on public.verified_feed for each row execute function private.touch_updated_at();
create trigger threads_touch before update on public.forum_threads for each row execute function private.touch_updated_at();
create trigger kb_sources_touch before update on private.kb_sources for each row execute function private.touch_updated_at();
create trigger kb_chunks_touch before update on private.kb_chunks for each row execute function private.touch_updated_at();
create trigger kb_suggestions_touch before update on private.kb_suggestions for each row execute function private.touch_updated_at();
create trigger game_statements_touch before update on public.game_statements for each row execute function private.touch_updated_at();
create trigger jobs_touch before update on private.ai_jobs for each row execute function private.touch_updated_at();
