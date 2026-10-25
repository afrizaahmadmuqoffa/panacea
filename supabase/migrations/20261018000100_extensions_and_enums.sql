create extension if not exists pgcrypto with schema extensions;
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create schema if not exists private;

create type public.user_role as enum ('user', 'reviewer', 'admin');
create type public.verdict as enum ('supported', 'partly_supported', 'contradicted', 'insufficient_evidence');
create type public.confidence as enum ('low', 'medium', 'high');
create type public.claim_status as enum ('queued', 'analyzing', 'analyzed', 'analysis_failed', 'reported', 'finalized', 'archived');
create type public.analysis_status as enum ('queued', 'running', 'succeeded', 'failed');
create type public.input_type as enum ('text', 'url', 'image');
create type public.report_status as enum ('waiting_assignment', 'assigned', 'finalized', 'needs_admin_review', 'closed');
create type public.comment_status as enum ('pending_moderation', 'visible', 'held', 'hidden', 'removed');
create type public.kb_source_type as enum ('article', 'document');
create type public.kb_source_status as enum ('draft', 'chunked', 'ingested', 'failed', 'archived');
create type public.kb_chunk_status as enum ('draft', 'approved', 'rejected', 'ingested');
create type public.suggestion_status as enum ('pending', 'approved', 'rejected', 'needs_changes');
create type public.feed_status as enum ('visible', 'hidden');
create type public.notification_type as enum ('analysis', 'report', 'expert_result', 'moderation', 'badge', 'suggestion', 'system');
create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed');
create type public.job_type as enum ('analyze_claim', 'moderate_comment', 'embed_kb', 'archive_leaderboard');
create type public.assignment_status as enum ('assigned', 'opened', 'submitted_primary', 'submitted_supplemental', 'conflict');
create type public.badge_type as enum ('verification_count', 'streak');
create type public.game_session_status as enum ('active', 'finished');
