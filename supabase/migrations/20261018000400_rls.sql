revoke all on all tables in schema public from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;

alter table public.profiles enable row level security;
alter table private.user_roles enable row level security;
alter table private.system_settings enable row level security;
alter table public.categories enable row level security;
alter table public.reviewers enable row level security;
alter table public.reviewer_categories enable row level security;
alter table public.claims enable row level security;
alter table public.claim_analyses enable row level security;
alter table public.claim_evidence enable row level security;
alter table private.europe_pmc_cache enable row level security;
alter table private.kb_sources enable row level security;
alter table private.kb_chunks enable row level security;
alter table private.kb_suggestions enable row level security;
alter table private.kb_suggestion_chunks enable row level security;
alter table public.claim_reports enable row level security;
alter table public.claim_review_assignments enable row level security;
alter table public.expert_reviews enable row level security;
alter table public.verified_feed enable row level security;
alter table private.feed_internal_links enable row level security;
alter table public.feed_revisions enable row level security;
alter table public.review_disputes enable row level security;
alter table public.forum_threads enable row level security;
alter table private.forum_thread_claim_links enable row level security;
alter table public.forum_comments enable row level security;
alter table private.moderation_logs enable row level security;
alter table public.game_statements enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_answers enable row level security;
alter table public.xp_events enable row level security;
alter table public.leaderboard_archives enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.notifications enable row level security;
alter table private.rate_limits enable row level security;
alter table private.ai_jobs enable row level security;
alter table private.audit_logs enable row level security;

grant select on public.categories to anon, authenticated;
grant select on public.verified_feed to anon, authenticated;
grant select on public.badges to anon, authenticated;

create policy categories_public_read on public.categories for select using (is_active = true);
create policy feed_public_read on public.verified_feed for select using (status = 'visible');
create policy badges_public_read on public.badges for select using (is_active = true);

grant select on public.profiles to authenticated;
grant update (full_name, alias, show_on_leaderboard, ui_language) on public.profiles to authenticated;
create policy profiles_self_read on public.profiles for select using (id = auth.uid());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

grant select on public.reviewers to authenticated;
grant update (is_available) on public.reviewers to authenticated;
create policy reviewers_self_read on public.reviewers for select using (id = auth.uid());
create policy reviewers_self_update on public.reviewers for update using (id = auth.uid()) with check (id = auth.uid());

grant select on public.reviewer_categories to authenticated;
create policy reviewer_categories_self_read on public.reviewer_categories for select using (reviewer_id = auth.uid());

grant select, insert on public.claims to authenticated;
create policy claims_owner_read on public.claims for select using (user_id = auth.uid());
create policy claims_reviewer_read on public.claims for select using (
  exists (
    select 1
    from public.claim_review_assignments a
    join public.claim_reports r on r.id = a.report_id
    where r.claim_id = claims.id and a.reviewer_id = auth.uid()
  )
);
create policy claims_owner_insert on public.claims for insert with check (user_id = auth.uid());

grant select on public.claim_analyses to authenticated;
create policy analyses_claim_read on public.claim_analyses for select using (
  exists (
    select 1 from public.claims c
    where c.id = claim_analyses.claim_id
      and (
        c.user_id = auth.uid()
        or exists (
          select 1
          from public.claim_review_assignments a
          join public.claim_reports r on r.id = a.report_id
          where r.claim_id = c.id and a.reviewer_id = auth.uid()
        )
      )
  )
);

grant select on public.claim_evidence to authenticated;
create policy evidence_claim_read on public.claim_evidence for select using (
  exists (
    select 1
    from public.claim_analyses a
    join public.claims c on c.id = a.claim_id
    where a.id = claim_evidence.analysis_id
      and (
        c.user_id = auth.uid()
        or exists (
          select 1
          from public.claim_review_assignments ar
          join public.claim_reports r on r.id = ar.report_id
          where r.claim_id = c.id and ar.reviewer_id = auth.uid()
        )
      )
  )
);

grant select, insert on public.claim_reports to authenticated;
create policy reports_reporter_read on public.claim_reports for select using (reporter_id = auth.uid());
create policy reports_reviewer_read on public.claim_reports for select using (
  exists (
    select 1 from public.claim_review_assignments a
    where a.report_id = claim_reports.id and a.reviewer_id = auth.uid()
  )
);
create policy reports_reporter_insert on public.claim_reports for insert with check (
  reporter_id = auth.uid() and publication_ack = true
);

grant select on public.claim_review_assignments to authenticated;
create policy assignments_reviewer_read on public.claim_review_assignments for select using (reviewer_id = auth.uid());

grant select on public.expert_reviews to authenticated;
create policy reviews_reader_read on public.expert_reviews for select using (reviewer_id = auth.uid());
create policy reviews_reporter_read on public.expert_reviews for select using (
  exists (
    select 1 from public.claim_reports r
    where r.id = expert_reviews.report_id and r.reporter_id = auth.uid()
  )
);

grant select, insert on public.forum_threads to authenticated;
create policy threads_member_read on public.forum_threads for select using (private.current_user_is_active());
create policy threads_member_insert on public.forum_threads for insert with check (
  author_id = auth.uid() and private.current_user_is_active()
);

grant select, insert on public.forum_comments to authenticated;
create policy comments_visible_read on public.forum_comments for select using (
  private.current_user_is_active()
  and (status = 'visible' or author_id = auth.uid())
);
create policy comments_member_insert on public.forum_comments for insert with check (
  author_id = auth.uid()
  and status = 'pending_moderation'
  and private.current_user_is_active()
  and exists (
    select 1 from public.forum_threads t
    where t.id = forum_comments.thread_id and t.is_locked = false
  )
);

grant select on public.game_sessions to authenticated;
create policy game_sessions_owner_read on public.game_sessions for select using (user_id = auth.uid());

grant select on public.game_answers to authenticated;
create policy game_answers_owner_read on public.game_answers for select using (
  exists (
    select 1 from public.game_sessions s
    where s.id = game_answers.session_id and s.user_id = auth.uid()
  )
);

grant select on public.xp_events to authenticated;
create policy xp_owner_read on public.xp_events for select using (user_id = auth.uid());

grant select on public.user_badges to authenticated;
create policy user_badges_owner_read on public.user_badges for select using (user_id = auth.uid());

grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;
create policy notifications_owner_read on public.notifications for select using (user_id = auth.uid());
create policy notifications_owner_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

grant execute on function public.get_my_role() to authenticated;
grant execute on function public.claim_rate_limit(integer, integer) to authenticated;
grant execute on function public.route_claim_report(uuid) to authenticated;
grant execute on function public.submit_expert_review(
  uuid, public.verdict, text, text, text, text, text, text, jsonb, text, text, boolean
) to authenticated;
grant execute on function public.match_kb_chunks(extensions.vector, text, integer, double precision) to authenticated;
grant execute on function public.match_kb_chunks_array(double precision[], text, integer, double precision) to authenticated, service_role;
grant execute on function public.leaderboard_entries(text) to authenticated;
grant execute on function public.start_game_session() to authenticated;
grant execute on function public.submit_game_answer(uuid, uuid, boolean) to authenticated;
grant execute on function public.finish_game_session(uuid) to authenticated;

revoke all on function public.archive_leaderboard() from public, anon, authenticated;
grant execute on function public.archive_leaderboard() to service_role;
revoke all on function public.set_kb_embedding(uuid, double precision[]) from public, anon, authenticated;
grant execute on function public.set_kb_embedding(uuid, double precision[]) to service_role;
revoke all on function private.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.touch_updated_at() from public, anon, authenticated;
revoke all on function private.current_user_is_active() from public, anon;
revoke all on function private.current_role_is(public.user_role) from public, anon;
grant execute on function private.current_user_is_active() to authenticated;
grant execute on function private.current_role_is(public.user_role) to authenticated;
