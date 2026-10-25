-- Bank soal game belum pernah diberi grant/policy sehingga halaman hasil sesi
-- gagal render: getGameStatements() memakai client anon dan kena error permission.
-- Grant hanya untuk authenticated; halaman hasil berada di area member.
grant select on public.game_statements to authenticated;

create policy game_statements_read on public.game_statements
  for select to authenticated
  using (true);

-- finish_game_session menghitung v_correct dengan count(*) sehingga correct_count
-- selalu sama dengan jumlah jawaban. Hitung hanya jawaban yang benar.
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

  select count(*) filter (where a.is_correct)::integer, coalesce(sum(a.xp_awarded), 0)::integer
  into v_correct, v_xp
  from public.game_answers a
  where a.session_id = p_session_id;

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

-- Sesi lama yang selesai sebelum perbaikan ini menyimpan correct_count = jumlah jawaban.
update public.game_sessions s
set correct_count = (
  select count(*) filter (where a.is_correct)
  from public.game_answers a
  where a.session_id = s.id
)
where s.status = 'finished';