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

  insert into private.kb_chunks (source_id, chunk_index, content, token_count, status)
  select
    p_source_id,
    coalesce((item->>'index')::integer, ordinality::integer - 1),
    coalesce(item->>'content', ''),
    greatest(coalesce((item->>'tokenCount')::integer, 1), 1),
    'approved'
  from jsonb_array_elements(p_chunks) with ordinality as t(item, ordinality);

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.admin_replace_kb_chunks(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.admin_replace_kb_chunks(uuid, jsonb) to service_role;
