-- Public reviewer name for verified feed entries.

alter table public.verified_feed add column if not exists reviewer_name text;

create or replace function private.set_feed_reviewer_name()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.reviewer_name is null and new.created_by is not null then
    select p.full_name into new.reviewer_name
    from public.profiles p
    where p.id = new.created_by;
  end if;
  return new;
end;
$$;

drop trigger if exists feed_set_reviewer_name on public.verified_feed;
create trigger feed_set_reviewer_name
  before insert on public.verified_feed
  for each row execute function private.set_feed_reviewer_name();

update public.verified_feed f
set reviewer_name = p.full_name
from public.profiles p
where p.id = f.created_by and f.reviewer_name is null;
