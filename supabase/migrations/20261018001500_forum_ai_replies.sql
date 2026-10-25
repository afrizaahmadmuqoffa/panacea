-- AI assistant replies to forum comments: flag the bot profile and link each AI reply to the comment it clarifies.
alter table public.profiles
  add column if not exists is_bot boolean not null default false;

alter table public.forum_comments
  add column if not exists ai_reply_to uuid references public.forum_comments (id) on delete cascade;

create unique index if not exists forum_comments_ai_reply_uidx on public.forum_comments (ai_reply_to);
