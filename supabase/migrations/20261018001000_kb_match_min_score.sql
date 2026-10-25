-- Perbaikan filter relevansi pencarian chunk KB.
--
-- Masalah: filter `similarity >= p_min_score or rrf_score > 0` selalu benar untuk
-- hit vektor karena rrf_score selalu punya kontribusi 1/(60+rank). Akibatnya
-- p_min_score tidak pernah menyaring apa pun dan fungsi selalu mengembalikan
-- p_top_k chunk teratas, sek relevance.
--
-- Perbaikan: bedakan asal hit. Hit vektor wajib melewati p_min_score; hit
-- full-text lolos karena kecocokan kata eksak dianggap sinyal kuat.

create or replace function public.match_kb_chunks(
  p_query_embedding extensions.vector(768),
  p_query_text text,
  p_top_k integer default 8,
  p_min_score double precision default 0.70
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
           coalesce(1.0 / (60 + v.rank), 0) + coalesce(1.0 / (60 + t.rank), 0) as rrf_score,
           v.id is not null as from_vector,
           t.id is not null as from_text
    from vector_hits v
    full join text_hits t on v.id = t.id
  )
  select c.id, k.source_id, k.content, c.similarity, c.rrf_score
  from combined c
  join private.kb_chunks k on k.id = c.id
  where (c.from_vector and c.similarity >= p_min_score) or c.from_text
  order by c.rrf_score desc, c.similarity desc
  limit p_top_k;
$$;

create or replace function public.match_kb_chunks_array(
  p_query_embedding double precision[],
  p_query_text text,
  p_top_k integer default 8,
  p_min_score double precision default 0.70
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