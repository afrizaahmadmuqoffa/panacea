-- Komentar forum belum bisa dibalas, diedit, atau dihapus penulisnya.
-- Balasan butuh parent_id; status edit butuh updated_at; autorisasi edit/hapus
-- butuh policy update untuk authenticated (policy lama hanya select dan insert).
alter type public.notification_type add value if not exists 'mention';

alter table public.forum_comments
  add column if not exists parent_id uuid references public.forum_comments (id) on delete cascade,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists forum_comments_parent_idx on public.forum_comments (parent_id, created_at);

grant update on public.forum_comments to authenticated;

-- Edit memaksa balik ke pending_moderation karena isi berubah. Soft delete
-- memakai status 'removed' agar balasan orang lain tidak ikut terhapus cascade.
create policy comments_author_update on public.forum_comments for update
  using (
    author_id = auth.uid()
    and private.current_user_is_active()
    and status <> 'removed'
  )
  with check (
    author_id = auth.uid()
    and status in ('pending_moderation', 'removed')
  );
