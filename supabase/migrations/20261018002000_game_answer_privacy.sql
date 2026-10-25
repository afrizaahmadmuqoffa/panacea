-- Lock down game_statements: answers only revealed via submit/result RPCs
drop policy if exists game_statements_read on public.game_statements;
revoke select on public.game_statements from authenticated;

create or replace function public.get_finished_game_statements(p_session_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', g.id,
    'statement', g.statement_id,
    'statementEn', g.statement_en,
    'isFact', g.is_fact,
    'explanationId', g.explanation_id,
    'explanationEn', g.explanation_en,
    'sourceUrl', g.source_url,
    'categorySlug', c.slug,
    'isActive', g.is_active
  ) order by array_position(s.statement_ids, g.id)), '[]'::jsonb)
  from public.game_sessions s
  join public.game_statements g on g.id = any(s.statement_ids)
  left join public.categories c on c.id = g.category_id
  where s.id = p_session_id
    and s.user_id = auth.uid()
    and s.status = 'finished';
$$;

revoke execute on function public.get_finished_game_statements(uuid) from public, anon;
grant execute on function public.get_finished_game_statements(uuid) to authenticated;
