create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  alias text not null,
  show_on_leaderboard boolean not null default true,
  ui_language text not null default 'id' check (ui_language in ('id', 'en')),
  xp integer not null default 0 check (xp >= 0),
  streak integer not null default 0 check (streak >= 0),
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name_id text not null,
  name_en text not null,
  description_id text not null,
  description_en text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviewers (
  id uuid primary key references auth.users (id) on delete cascade,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviewer_categories (
  reviewer_id uuid not null references public.reviewers (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (reviewer_id, category_id)
);

create table public.claims (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  input_type public.input_type not null,
  original_text text not null,
  source_url text,
  image_path text,
  language text not null default 'unknown' check (language in ('id', 'en', 'unknown')),
  category_id uuid references public.categories (id) on delete set null,
  status public.claim_status not null default 'queued',
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index claims_user_created_idx on public.claims (user_id, created_at desc);
create index claims_status_idx on public.claims (status, created_at);

create table public.claim_analyses (
  id uuid primary key default extensions.gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  status public.analysis_status not null default 'queued',
  verdict public.verdict,
  confidence public.confidence,
  summary_id text,
  summary_en text,
  limitations_id text,
  limitations_en text,
  used_kb boolean not null default false,
  used_europe_pmc boolean not null default false,
  model_name text,
  prompt_version text,
  retrieval_metadata jsonb not null default '{}'::jsonb,
  error_code text,
  analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index claim_analyses_claim_idx on public.claim_analyses (claim_id, created_at desc);

create table public.claim_evidence (
  id uuid primary key default extensions.gen_random_uuid(),
  analysis_id uuid not null references public.claim_analyses (id) on delete cascade,
  title text not null,
  publisher text not null,
  year integer not null check (year between 1800 and 2200),
  identifier text,
  url text,
  snippet_id text not null,
  snippet_en text not null,
  source_type text not null check (source_type in ('kb', 'europe_pmc')),
  relevance text not null check (relevance in ('high', 'medium', 'low')),
  source_record_id text,
  created_at timestamptz not null default now()
);

create index claim_evidence_analysis_idx on public.claim_evidence (analysis_id);

create table private.europe_pmc_cache (
  query_hash text primary key,
  query text not null,
  response jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table private.kb_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  type public.kb_source_type not null,
  title text not null,
  author text not null,
  year integer not null check (year between 1800 and 2200),
  category_id uuid references public.categories (id) on delete set null,
  status public.kb_source_status not null default 'draft',
  file_path text,
  file_type text,
  source_url text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.kb_chunks (
  id uuid primary key default extensions.gen_random_uuid(),
  source_id uuid not null references private.kb_sources (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_count integer not null check (token_count > 0),
  status public.kb_chunk_status not null default 'draft',
  embedding extensions.vector(768),
  search_vector tsvector generated always as (to_tsvector('simple', content)) stored,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, chunk_index)
);

create index kb_chunks_source_idx on private.kb_chunks (source_id, chunk_index);
create index kb_chunks_status_idx on private.kb_chunks (status);
create index kb_chunks_search_idx on private.kb_chunks using gin (search_vector);
create index kb_chunks_embedding_idx on private.kb_chunks using hnsw (embedding extensions.vector_cosine_ops);

create table private.kb_suggestions (
  id uuid primary key default extensions.gen_random_uuid(),
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  note text not null,
  target_source_id uuid references private.kb_sources (id) on delete set null,
  status public.suggestion_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.kb_suggestion_chunks (
  id uuid primary key default extensions.gen_random_uuid(),
  suggestion_id uuid not null references private.kb_suggestions (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_count integer not null check (token_count > 0),
  status public.kb_chunk_status not null default 'draft',
  created_at timestamptz not null default now(),
  unique (suggestion_id, chunk_index)
);

create table public.claim_reports (
  id uuid primary key default extensions.gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  reference_urls text[] not null default '{}'::text[],
  attachment_path text,
  publication_ack boolean not null default false,
  status public.report_status not null default 'waiting_assignment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index claim_reports_claim_idx on public.claim_reports (claim_id, created_at desc);
create index claim_reports_status_idx on public.claim_reports (status, created_at);

create table public.claim_review_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.claim_reports (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  status public.assignment_status not null default 'assigned',
  assigned_at timestamptz not null default now(),
  opened_at timestamptz,
  submitted_at timestamptz,
  unique (report_id, reviewer_id)
);

create index assignments_reviewer_idx on public.claim_review_assignments (reviewer_id, status, assigned_at);

create table public.expert_reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.claim_reports (id) on delete cascade,
  assignment_id uuid not null references public.claim_review_assignments (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  verdict public.verdict not null,
  summary_id text not null,
  summary_en text not null,
  limitations_id text not null,
  limitations_en text not null,
  expert_note_id text not null,
  expert_note_en text not null,
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  is_canonical boolean not null default false,
  conflict boolean not null default false,
  created_at timestamptz not null default now()
);

create index expert_reviews_report_idx on public.expert_reviews (report_id, created_at);

create table public.verified_feed (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  title_id text not null,
  title_en text not null,
  public_claim_text_id text not null,
  public_claim_text_en text not null,
  verdict public.verdict not null,
  summary_id text not null,
  summary_en text not null,
  expert_note_id text not null,
  expert_note_en text not null,
  limitations_id text not null,
  limitations_en text not null,
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  category_id uuid references public.categories (id) on delete set null,
  methodology_version text not null,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status public.feed_status not null default 'visible',
  reviewer_count integer not null default 1 check (reviewer_count > 0),
  canonical_review_id uuid references public.expert_reviews (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  revision_note text
);

create index verified_feed_status_idx on public.verified_feed (status, published_at desc);
create index verified_feed_category_idx on public.verified_feed (category_id, status);

create table private.feed_internal_links (
  feed_id uuid primary key references public.verified_feed (id) on delete cascade,
  claim_id uuid not null references public.claims (id) on delete cascade,
  report_id uuid not null references public.claim_reports (id) on delete cascade,
  review_id uuid not null references public.expert_reviews (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.feed_revisions (
  id uuid primary key default extensions.gen_random_uuid(),
  feed_id uuid not null references public.verified_feed (id) on delete cascade,
  revision_note text not null,
  snapshot jsonb not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.review_disputes (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.claim_reports (id) on delete cascade,
  feed_id uuid references public.verified_feed (id) on delete set null,
  opened_by uuid references auth.users (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  note text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.forum_threads (
  id uuid primary key default extensions.gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_alias text not null,
  title text not null,
  body text not null,
  category_id uuid references public.categories (id) on delete set null,
  is_locked boolean not null default false,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index forum_threads_created_idx on public.forum_threads (created_at desc);

create table private.forum_thread_claim_links (
  thread_id uuid primary key references public.forum_threads (id) on delete cascade,
  claim_id uuid not null references public.claims (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.forum_comments (
  id uuid primary key default extensions.gen_random_uuid(),
  thread_id uuid not null references public.forum_threads (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_alias text not null,
  body text not null,
  status public.comment_status not null default 'pending_moderation',
  linked_feed_id uuid references public.verified_feed (id) on delete set null,
  moderation_note_id text,
  moderation_note_en text,
  created_at timestamptz not null default now()
);

create index forum_comments_thread_idx on public.forum_comments (thread_id, created_at);
create index forum_comments_status_idx on public.forum_comments (status, created_at);

create table private.moderation_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  comment_id uuid references public.forum_comments (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.game_statements (
  id uuid primary key default extensions.gen_random_uuid(),
  statement_id text not null unique,
  statement_en text not null,
  is_fact boolean not null,
  explanation_id text not null,
  explanation_en text not null,
  source_url text not null,
  category_id uuid references public.categories (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  statement_ids uuid[] not null,
  status public.game_session_status not null default 'active',
  correct_count integer not null default 0,
  xp_earned integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index game_sessions_user_idx on public.game_sessions (user_id, started_at desc);

create table public.game_answers (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  statement_id uuid not null references public.game_statements (id) on delete cascade,
  answer_is_fact boolean not null,
  is_correct boolean not null,
  xp_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  unique (session_id, statement_id)
);

create table public.xp_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  source text not null,
  source_id text,
  created_at timestamptz not null default now()
);

create index xp_events_user_idx on public.xp_events (user_id, created_at desc);

create table public.leaderboard_archives (
  id uuid primary key default extensions.gen_random_uuid(),
  period_start timestamptz not null,
  period_end timestamptz not null,
  entries jsonb not null,
  created_at timestamptz not null default now()
);

create table public.badges (
  code text primary key,
  name_id text not null,
  name_en text not null,
  description_id text not null,
  description_en text not null,
  type public.badge_type not null,
  threshold integer not null check (threshold > 0),
  icon_key text not null,
  is_active boolean not null default true
);

create table public.user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_code text not null references public.badges (code) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_code)
);

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.notification_type not null,
  title_id text not null,
  title_en text not null,
  body_id text not null,
  body_en text not null,
  href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

create table private.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);

create table private.ai_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  type public.job_type not null,
  payload jsonb not null default '{}'::jsonb,
  status public.job_status not null default 'queued',
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_jobs_ready_idx on private.ai_jobs (status, run_after, created_at);

create table private.audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on private.audit_logs (created_at desc);
