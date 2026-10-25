-- 01900: Game berbasis spaced repetition.
--
-- Aturan baru:
--   1. Soal baru (belum pernah dimainkan) selalu didahulukan. Soal yang sudah
--      dijawab benar disembunyikan 30 hari, soal yang dijawab salah masuk lagi
--      1 hari kemudian sampai dijawab benar.
--   2. Skor leaderboard hanya dari soal baru.
--   3. Satu id soal maksimal menyumbang 1 poin per akun.
--   4. Kuota 2 sesi per hari, masing-masing 10 soal (20 soal per hari).
--
-- Data lama dihitung ulang sesuai aturan baru: satu xp_event per soal yang
-- pernah dijawab benar, amount 1, dan profiles.xp dihitung ulang dari situ.

-- 1) Progres belajar per pengguna per soal.
create table if not exists public.game_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  statement_id uuid not null references public.game_statements (id) on delete cascade,
  attempts integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  first_correct_at timestamptz,
  last_answered_at timestamptz,
  next_review_at timestamptz,
  primary key (user_id, statement_id)
);

create index if not exists game_progress_due_idx
  on public.game_progress (user_id, next_review_at);

alter table public.game_progress enable row level security;

drop policy if exists game_progress_owner_read on public.game_progress;
create policy game_progress_owner_read on public.game_progress for select
  using (user_id = auth.uid());

grant select on public.game_progress to authenticated;

-- 2) Penanda soal review pada jawaban dan sesi.
alter table public.game_answers
  add column if not exists is_review boolean not null default false;

alter table public.game_sessions
  add column if not exists review_ids uuid[] not null default '{}';

-- 3) Hitung ulang XP lama supaya satu soal = satu poin, baru kunci unik.
with kept as (
  select distinct on (user_id, source_id) id, user_id, source_id
  from public.xp_events
  where source = 'game_answer' and source_id is not null
  order by user_id, source_id, created_at
)
delete from public.xp_events e
where e.source = 'game_answer'
  and e.source_id is not null
  and not exists (select 1 from kept k where k.id = e.id);

update public.xp_events
set amount = 1
where source = 'game_answer';

update public.profiles p
set xp = coalesce((
  select sum(e.amount)::integer
  from public.xp_events e
  where e.user_id = p.id
), 0), updated_at = now();

create unique index if not exists xp_events_game_statement_uidx
  on public.xp_events (user_id, source_id)
  where source = 'game_answer';

-- 4) Backfill progres dari jawaban yang sudah ada.
insert into public.game_progress (
  user_id, statement_id, attempts, correct_count, wrong_count,
  first_correct_at, last_answered_at, next_review_at
)
select
  s.user_id,
  a.statement_id,
  count(*)::integer,
  count(*) filter (where a.is_correct)::integer,
  count(*) filter (where not a.is_correct)::integer,
  min(a.created_at) filter (where a.is_correct),
  max(a.created_at),
  case
    when bool_or(a.is_correct) then now() + interval '30 days'
    else now() + interval '1 day'
  end
from public.game_answers a
join public.game_sessions s on s.id = a.session_id
group by s.user_id, a.statement_id
on conflict (user_id, statement_id) do nothing;

-- 5) Sesi game: 2 per hari, 10 soal, soal baru didahulukan.
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
  v_new_ids uuid[];
  v_review_ids uuid[];
  v_statement_ids uuid[];
  v_questions jsonb;
  v_new_available integer;
  v_due_reviews integer;
  v_new_count integer;
  v_review_count integer;
  v_sessions_per_day constant integer := 2;
  v_questions_per_session constant integer := 10;
  v_review_reserve constant integer := 3;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  v_allowed := private.consume_rate_limit(
    'game:' || v_user::text,
    v_sessions_per_day,
    86400
  );
  if not v_allowed then
    raise exception 'Daily game limit reached';
  end if;

  -- Soal baru didahulukan, tapi maksimal 3 slot dipakai review jatuh tempo
  -- supaya soal yang dijawab salah tidak tertunda hanya karena soal baru banyak.
  select count(*)::integer into v_new_available
  from public.game_statements s
  where s.is_active = true
    and not exists (
      select 1 from public.game_progress g
      where g.user_id = v_user and g.statement_id = s.id
    );

  select count(*)::integer into v_due_reviews
  from public.game_progress g
  join public.game_statements s on s.id = g.statement_id
  where g.user_id = v_user
    and s.is_active = true
    and g.next_review_at is not null
    and g.next_review_at <= now();

  v_new_count := least(v_new_available, v_questions_per_session - least(v_due_reviews, v_review_reserve));
  v_review_count := least(v_due_reviews, v_questions_per_session - v_new_count);

  select coalesce(array_agg(id), '{}'::uuid[]) into v_new_ids
  from (
    select s.id
    from public.game_statements s
    where s.is_active = true
      and not exists (
        select 1 from public.game_progress g
        where g.user_id = v_user and g.statement_id = s.id
      )
    order by random()
    limit v_new_count
  ) picked;

  select coalesce(array_agg(statement_id), '{}'::uuid[]) into v_review_ids
  from (
    select g.statement_id
    from public.game_progress g
    join public.game_statements s on s.id = g.statement_id
    where g.user_id = v_user
      and s.is_active = true
      and g.next_review_at is not null
      and g.next_review_at <= now()
      and not (g.statement_id = any(v_new_ids))
    order by g.next_review_at asc
    limit v_review_count
  ) due;

  v_statement_ids := (
    select coalesce(array_agg(id), '{}'::uuid[])
    from (
      select unnest(v_new_ids) as id
      union
      select unnest(v_review_ids) as id
    ) merged
  );

  if coalesce(array_length(v_statement_ids, 1), 0) = 0 then
    raise exception 'No game statements available right now';
  end if;

  insert into public.game_sessions (user_id, statement_ids, review_ids)
  values (v_user, v_statement_ids, v_review_ids)
  returning id into v_session_id;

  select jsonb_agg(jsonb_build_object(
    'id', g.id,
    'statementId', g.id,
    'statement', g.statement_id,
    'statementEn', g.statement_en,
    'categorySlug', c.slug,
    'isReview', (g.id = any(v_review_ids))
  ) order by g.id)
  into v_questions
  from public.game_statements g
  left join public.categories c on c.id = g.category_id
  where g.id = any(v_statement_ids);

  return jsonb_build_object(
    'sessionId', v_session_id,
    'questions', v_questions,
    'newCount', coalesce(array_length(v_new_ids, 1), 0),
    'reviewCount', coalesce(array_length(v_review_ids, 1), 0),
    'sessionsPerDay', v_sessions_per_day,
    'questionsPerSession', v_questions_per_session
  );
end;
$$;

revoke execute on function public.start_game_session() from public, anon;
grant execute on function public.start_game_session() to authenticated;

-- 6) Menjawab: satu poin per soal, jeda 30 hari / 1 hari.
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
  v_progress_first_correct timestamptz;
  v_is_review boolean := false;
  v_correct boolean;
  v_points integer := 0;
  v_inserted integer := 0;
  v_next_review_at timestamptz;
  v_first_correct_at timestamptz;
  v_correct_days constant integer := 30;
  v_wrong_days constant integer := 1;
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
      'alreadyAnswered', true,
      'isReview', v_existing.is_review,
      'pointsAwarded', 0
    );
  end if;

  select g.first_correct_at into v_progress_first_correct
  from public.game_progress g
  where g.user_id = v_user and g.statement_id = p_statement_id;

  v_is_review := found;
  v_correct := v_statement.is_fact = p_answer_is_fact;

  if v_correct then
    v_next_review_at := now() + make_interval(days => v_correct_days);
    v_first_correct_at := coalesce(v_progress_first_correct, now());

    -- Poin hanya sekali per soal: unik (user_id, source_id) yang menjaminnya.
    insert into public.xp_events (user_id, amount, source, source_id)
    values (v_user, 1, 'game_answer', p_statement_id::text)
    on conflict (user_id, source_id) where source = 'game_answer' do nothing;
    get diagnostics v_inserted = row_count;

    if v_inserted > 0 then
      v_points := 1;
      update public.profiles set xp = xp + 1, updated_at = now() where id = v_user;
    end if;
  else
    v_next_review_at := now() + make_interval(days => v_wrong_days);
    v_first_correct_at := v_progress_first_correct;
  end if;

  insert into public.game_progress (
    user_id, statement_id, attempts, correct_count, wrong_count,
    first_correct_at, last_answered_at, next_review_at
  )
  values (
    v_user, p_statement_id, 1,
    case when v_correct then 1 else 0 end,
    case when v_correct then 0 else 1 end,
    v_first_correct_at, now(), v_next_review_at
  )
  on conflict (user_id, statement_id) do update
  set attempts = public.game_progress.attempts + 1,
      correct_count = public.game_progress.correct_count + case when v_correct then 1 else 0 end,
      wrong_count = public.game_progress.wrong_count + case when v_correct then 0 else 1 end,
      first_correct_at = coalesce(public.game_progress.first_correct_at, excluded.first_correct_at),
      last_answered_at = now(),
      next_review_at = excluded.next_review_at;

  insert into public.game_answers (
    session_id, statement_id, answer_is_fact, is_correct, xp_awarded, is_review
  )
  values (
    p_session_id, p_statement_id, p_answer_is_fact, v_correct, v_points, v_is_review
  );

  return jsonb_build_object(
    'isCorrect', v_correct,
    'xpAwarded', v_points,
    'isFact', v_statement.is_fact,
    'explanationId', v_statement.explanation_id,
    'explanationEn', v_statement.explanation_en,
    'sourceUrl', v_statement.source_url,
    'alreadyAnswered', false,
    'isReview', v_is_review,
    'isNewQuestion', not v_is_review,
    'pointsAwarded', v_points,
    'nextReviewAt', v_next_review_at
  );
end;
$$;

revoke execute on function public.submit_game_answer(uuid, uuid, boolean) from public, anon;
grant execute on function public.submit_game_answer(uuid, uuid, boolean) to authenticated;

-- 7) Selesai sesi: badge berbasis jumlah soal unik yang pernah dijawab benar.
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

  select count(*) filter (where is_correct)::integer, coalesce(sum(xp_awarded), 0)::integer
  into v_correct, v_xp
  from public.game_answers
  where session_id = p_session_id;

  update public.game_sessions
  set status = 'finished', correct_count = v_correct, xp_earned = v_xp, finished_at = now()
  where id = p_session_id;

  -- Badge memakai jumlah soal unik yang pernah dijawab benar, bukan jumlah jawaban.
  select count(*)::integer into v_total_correct
  from public.game_progress
  where user_id = v_user and first_correct_at is not null;

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

revoke execute on function public.finish_game_session(uuid) from public, anon;
grant execute on function public.finish_game_session(uuid) to authenticated;

-- 8) Ringkasan progres untuk lobi: kuota, soal baru, review jatuh tempo.
create or replace function public.game_progress_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  v_user uuid := auth.uid();
  v_sessions_today integer;
  v_new_available integer;
  v_due_reviews integer;
  v_next_review_at timestamptz;
  v_sessions_per_day constant integer := 2;
  v_questions_per_session constant integer := 10;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select count(*)::integer into v_sessions_today
  from public.game_sessions
  where user_id = v_user and started_at::date = current_date;

  select count(*)::integer into v_new_available
  from public.game_statements s
  where s.is_active = true
    and not exists (
      select 1 from public.game_progress g
      where g.user_id = v_user and g.statement_id = s.id
    );

  select count(*)::integer into v_due_reviews
  from public.game_progress g
  join public.game_statements s on s.id = g.statement_id
  where g.user_id = v_user
    and s.is_active = true
    and g.next_review_at is not null
    and g.next_review_at <= now();

  select min(g.next_review_at) into v_next_review_at
  from public.game_progress g
  join public.game_statements s on s.id = g.statement_id
  where g.user_id = v_user
    and s.is_active = true
    and g.next_review_at is not null
    and g.next_review_at > now();

  return jsonb_build_object(
    'sessionsToday', v_sessions_today,
    'sessionsPerDay', v_sessions_per_day,
    'questionsPerSession', v_questions_per_session,
    'newAvailable', v_new_available,
    'dueReviews', v_due_reviews,
    'nextReviewAt', v_next_review_at
  );
end;
$$;

revoke execute on function public.game_progress_summary() from public, anon;
grant execute on function public.game_progress_summary() to authenticated;
