-- View thread tidak pernah dihitung: kolom forum_threads.views ada dan dipetakan
-- ke UI, tetapi tidak ada kode atau RPC yang menaikkannya.
create or replace function public.increment_thread_views(p_thread_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_views integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.forum_threads
  set views = views + 1
  where id = p_thread_id
  returning views into v_views;

  return coalesce(v_views, 0);
end;
$$;

grant execute on function public.increment_thread_views(uuid) to authenticated;

-- Hitung view tidak boleh mengubah updated_at, kalau tidak thread melompat ke
-- atas daftar yang diurutkan updated_at desc.
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  if (to_jsonb(new) - 'views' - 'updated_at') is distinct from
     (to_jsonb(old) - 'views' - 'updated_at') then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

-- Saran reviewer tidak membawa metadata sumber. Formulir admin punya kategori,
-- penulis, tahun, dan URL; saran perlu menyimpannya agar ketika disetujui
-- sumber KB yang dibuat membawa metadata itu, bukan nilai hardcode.
alter table private.kb_suggestions
  add column if not exists category_id uuid references public.categories (id) on delete set null,
  add column if not exists author text,
  add column if not exists year integer check (year between 1800 and 2200),
  add column if not exists source_url text;