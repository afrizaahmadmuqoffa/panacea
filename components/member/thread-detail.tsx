"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  CircleAlert,
  CornerDownRight,
  Eye,
  LoaderCircle,
  Lock,
  MessageCircle,
  MessageSquarePlus,
  MessageSquareX,
  Pencil,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { createCommentAction, deleteCommentAction, incrementThreadViewAction, updateCommentAction } from "@/lib/actions/member";
import { ThreadDetailSkeleton } from "@/components/skeletons/member";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/input";
import { VerdictBadge } from "@/components/panacea/verdict-badge";
import { categoryName } from "@/lib/data/categories";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import type { CommentStatus, ForumComment } from "@/lib/types";

type ModerationOutcome = { status?: CommentStatus; moderationNote?: string };

export function ThreadDetail({ threadId }: { threadId: string }) {
  const { locale, tr } = useI18n();
  const { hydrated, findThread, findFeed, refresh } = usePanacea();
  const thread = findThread(threadId);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [moderating, setModerating] = useState(false);
  const [moderationNotice, setModerationNotice] = useState<ModerationOutcome | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<ForumComment | null>(null);
  const countedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || countedRef.current) return;
    countedRef.current = true;
    void incrementThreadViewAction(locale, threadId).then(() => refresh());
  }, [hydrated, locale, threadId, refresh]);

  if (!hydrated) return <ThreadDetailSkeleton />;

  if (!thread) {
    return (
      <EmptyState
        icon={MessageSquareX}
        state="none"
        title={tr("Diskusi tidak ditemukan", "Discussion not found")}
        description={tr("Thread mungkin sudah dipindahkan atau tidak tersedia.", "The thread may have been moved or is unavailable.")}
        action={
          <Link href={`/${locale}/forum`} className={buttonVariants({ variant: "cozy" })}>
            {tr("Kembali ke forum", "Back to forum")}
          </Link>
        }
      />
    );
  }

  const visibleComments = thread.comments
    .filter((comment) => comment.status === "visible")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const visibleIds = new Set(visibleComments.map((comment) => comment.id));
  const roots = visibleComments.filter(
    (comment) => !comment.parentId || !visibleIds.has(comment.parentId),
  );
  const repliesOf = (parentId: string) =>
    visibleComments.filter((comment) => comment.parentId === parentId);

  function applyModerationResult(result: ModerationOutcome, visibleMessage: string) {
    if (result.status === "visible" || !result.status) {
      toast.success(visibleMessage);
      return;
    }
    setModerationNotice(result);
  }

  function moderationTitle(status?: CommentStatus) {
    if (status === "removed") return tr("Komentar dihapus", "Comment removed");
    if (status === "held") return tr("Komentar ditahan", "Comment held");
    return tr("Komentar menunggu moderasi", "Comment awaiting moderation");
  }

  function moderationDescription(status?: CommentStatus) {
    if (status === "removed") {
      return tr(
        "Komentar ini dihapus karena melanggar aturan komunitas. Kamu bisa menulis ulang dengan cara yang lebih sopan.",
        "This comment was removed because it broke the community rules. You can rewrite it in a more respectful way.",
      );
    }
    if (status === "held") {
      return tr(
        "Komentar ini ditahan dan belum tampil untuk pengguna lain. Admin akan meninjaunya lebih lanjut.",
        "This comment is held and is not visible to other users yet. An admin will review it further.",
      );
    }
    return tr(
      "Moderasi otomatis belum selesai. Komentar ini akan ditinjau admin dan belum tampil untuk pengguna lain.",
      "Automated moderation has not finished. An admin will review this comment, and it is not visible to other users yet.",
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!thread) return;
    setError("");
    if (body.trim().length < 3) {
      setError(tr("Komentar minimal 3 karakter.", "Comment must be at least 3 characters."));
      return;
    }
    if (body.length > 1000) {
      setError(tr("Komentar maksimal 1.000 karakter.", "Comment must be 1,000 characters or less."));
      return;
    }
    setModerating(true);
    const payload = new FormData();
    payload.set("threadId", thread.id);
    payload.set("body", body.trim());
    const result = await createCommentAction(locale, payload);
    setModerating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setBody("");
    await refresh();
    applyModerationResult(
      result,
      tr("Komentar tayang.", "Your comment is now visible."),
    );
  }

  function startReply(comment: ForumComment) {
    setReplyTo(comment.id);
    setReplyBody(`@${comment.authorAlias} `);
    setEditingId(null);
    setError("");
  }

  async function submitReply(event: FormEvent, comment: ForumComment) {
    event.preventDefault();
    if (!thread) return;
    setError("");
    if (replyBody.trim().length < 3) {
      setError(tr("Balasan minimal 3 karakter.", "The reply must be at least 3 characters."));
      return;
    }
    setBusyId(comment.id);
    const payload = new FormData();
    payload.set("threadId", thread.id);
    payload.set("body", replyBody.trim());
    payload.set("parentId", comment.parentId ?? comment.id);
    const result = await createCommentAction(locale, payload);
    setBusyId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setReplyTo(null);
    setReplyBody("");
    await refresh();
    applyModerationResult(result, tr("Balasan tayang.", "Your reply is now visible."));
  }

  async function saveEdit(event: FormEvent, comment: ForumComment) {
    event.preventDefault();
    setError("");
    if (editBody.trim().length < 3) {
      setError(tr("Komentar minimal 3 karakter.", "The comment must be at least 3 characters."));
      return;
    }
    setBusyId(comment.id);
    const payload = new FormData();
    payload.set("commentId", comment.id);
    payload.set("body", editBody.trim());
    const result = await updateCommentAction(locale, payload);
    setBusyId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    setEditBody("");
    await refresh();
    applyModerationResult(
      result,
      tr("Komentar diperbarui dan tayang.", "Your comment was updated and is now visible."),
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setError("");
    setBusyId(deleteTarget.id);
    const result = await deleteCommentAction(locale, deleteTarget.id);
    setBusyId(null);
    setDeleteTarget(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    await refresh();
    toast.success(tr("Komentar dihapus.", "Comment deleted."));
  }

  function renderComment(comment: ForumComment, depth: 0 | 1) {
    const feed = comment.linkedFeedSlug ? findFeed(comment.linkedFeedSlug) : undefined;
    const replies = depth === 0 ? repliesOf(comment.id) : [];
    const isExpanded = expanded[comment.id] ?? false;
    const shownReplies = isExpanded ? replies : replies.slice(0, 2);
    const hiddenCount = replies.length - shownReplies.length;
    const busy = busyId === comment.id;
    return (
      <div key={comment.id} className={depth === 1 ? "ml-8 border-l border-dashed border-[#e8e2d5] pl-4 sm:ml-10" : undefined}>
        <article className="rounded-[18px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover">
          <div className="flex items-start gap-3">
            <Avatar name={comment.authorAlias} size="sm" tone="warm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-extrabold text-bark-900">{comment.authorAlias}</p>
                {comment.isAi ? (
                  <Badge variant="sage">
                    <Sparkles className="size-3" aria-hidden="true" />
                    {tr("Asisten AI", "AI assistant")}
                  </Badge>
                ) : null}
                {comment.authorIsReviewer ? (
                  <Badge variant="sky">
                    <Stethoscope className="size-3" aria-hidden="true" />
                    {tr("Reviewer", "Reviewer")}
                  </Badge>
                ) : null}
                <p className="text-xs text-bark-500">{formatRelative(comment.createdAt, locale)}</p>
                {comment.isEdited ? (
                  <span className="text-xs italic text-bark-500">{tr("diedit", "edited")}</span>
                ) : null}
              </div>

              {editingId === comment.id ? (
                <form onSubmit={(event) => saveEdit(event, comment)} className="mt-1.5" noValidate>
                  <Textarea
                    value={editBody}
                    onChange={(event) => setEditBody(event.target.value.slice(0, 1000))}
                    className="min-h-20"
                    maxLength={1000}
                    disabled={busy}
                    autoFocus
                  />
                  <p className="mt-1 text-xs leading-relaxed text-bark-500">
                    {tr(
                      "Edit akan melewati moderasi lagi dan tampil setelah dinilai aman.",
                      "Edits pass moderation again and appear once reviewed as safe.",
                    )}
                  </p>
                  <div className="mt-2 flex justify-end gap-2">
                    <Button type="button" variant="cozySoft" size="sm" onClick={() => { setEditingId(null); setEditBody(""); }}>
                      {tr("Batal", "Cancel")}
                    </Button>
                    <Button type="submit" variant="cozy" size="sm" disabled={busy}>
                      {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
                      {tr("Simpan", "Save")}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-bark-700">{comment.body}</p>
              )}

              {feed ? (
                <Link
                  href={`/${locale}/feed-terverifikasi/${feed.slug}`}
                  className="mt-3 flex items-start gap-2.5 rounded-[14px] border border-sage-300 bg-sage-100 p-3 transition hover:border-sage-600"
                >
                  <BookOpenCheck className="mt-0.5 size-4 shrink-0 text-sage-700" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-sage-700">
                        {tr("Klarifikasi terverifikasi", "Verified clarification")}
                      </span>
                      <VerdictBadge verdict={feed.verdict} size="sm" palette="warm" />
                    </span>
                    <span className="mt-1 block text-xs font-bold leading-snug text-bark-900">{feed.title[locale]}</span>
                  </span>
                </Link>
              ) : null}

              {replyTo === comment.id ? (
                <form onSubmit={(event) => submitReply(event, comment)} className="mt-3" noValidate>
                  <Textarea
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value.slice(0, 1000))}
                    placeholder={tr("Tulis balasan yang sopan...", "Write a polite reply...")}
                    className="min-h-20"
                    maxLength={1000}
                    disabled={busy}
                    autoFocus
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-bark-500">{replyBody.length}/1000</span>
                    <div className="flex gap-2">
                      <Button type="button" variant="cozySoft" size="sm" onClick={() => { setReplyTo(null); setReplyBody(""); }}>
                        {tr("Batal", "Cancel")}
                      </Button>
                      <Button type="submit" variant="cozy" size="sm" disabled={busy}>
                        {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                        {tr("Balas", "Reply")}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : null}

              {editingId === comment.id ? null : (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold">
                  {!thread?.isLocked ? (
                    <button
                      type="button"
                      onClick={() => startReply(comment)}
                      className="inline-flex items-center gap-1 text-bark-500 transition hover:text-sage-700"
                    >
                      <CornerDownRight className="size-3.5" aria-hidden="true" />
                      {tr("Balas", "Reply")}
                    </button>
                  ) : null}
                  {comment.isOwn ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { setEditingId(comment.id); setEditBody(comment.body); setReplyTo(null); }}
                        className="inline-flex items-center gap-1 text-bark-500 transition hover:text-sage-700"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        {tr("Edit", "Edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(comment)}
                        className="inline-flex items-center gap-1 text-bark-500 transition hover:text-[#a33]"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        {tr("Hapus", "Delete")}
                      </button>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </article>

        {replies.length > 0 ? (
          <div className="mt-3 space-y-3">
            {shownReplies.map((reply) => renderComment(reply, 1))}
          </div>
        ) : null}

        {hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => ({ ...prev, [comment.id]: true }))}
            className="ml-8 mt-2 inline-flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline sm:ml-10"
          >
            {tr(`Lihat ${hiddenCount} balasan`, `View ${hiddenCount} replies`)}
          </button>
        ) : null}
        {isExpanded && replies.length > 2 ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => ({ ...prev, [comment.id]: false }))}
            className="ml-8 mt-2 inline-flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline sm:ml-10"
          >
            {tr("Sembunyikan balasan", "Hide replies")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/forum`} className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 hover:text-sage-700">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {tr("Kembali ke forum", "Back to forum")}
      </Link>

      <article className="rounded-[24px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">{categoryName(thread.categorySlug, locale)}</Badge>
          {thread.isLocked ? (
            <Badge variant="outline">
              <Lock className="size-3" aria-hidden="true" />
              {tr("Thread dikunci", "Thread locked")}
            </Badge>
          ) : null}
        </div>
        <h1 className="mt-3 font-heading text-2xl font-black leading-tight tracking-[-0.45px] text-bark-900 sm:text-3xl">
          {thread.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-dashed border-[#e8e2d5] pb-4">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-bark-700">
            <Avatar name={thread.authorAlias} size="sm" tone="warm" />
            {thread.authorAlias}
            {thread.authorIsReviewer ? (
              <Badge variant="sky">
                <Stethoscope className="size-3" aria-hidden="true" />
                {tr("Reviewer", "Reviewer")}
              </Badge>
            ) : null}
          </span>
          <span className="text-xs text-bark-500">{formatDate(thread.createdAt, locale, true)}</span>
          <span className="inline-flex items-center gap-1 text-xs text-bark-500">
            <MessageCircle className="size-3.5" aria-hidden="true" />
            {visibleComments.length}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-bark-500">
            <Eye className="size-3.5" aria-hidden="true" />
            {thread.views}
          </span>
        </div>
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-bark-700">{thread.body}</p>
      </article>

      <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow sm:p-6">
        <h2 className="font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">{tr("Tulis komentar", "Write a comment")}</h2>
        <p className="mt-1 text-xs leading-relaxed text-bark-500">
          {tr(
            "Komentar melewati moderasi AI sebelum tampil. Komentar yang belum lolos tidak terlihat publik.",
            "Comments pass AI moderation before appearing. Comments that have not passed are not publicly visible.",
          )}
        </p>
        {thread.isLocked ? (
          <Alert variant="warning" className="mt-4">
            {tr("Thread ini dikunci. Komentar baru tidak dapat ditambahkan.", "This thread is locked. New comments cannot be added.")}
          </Alert>
        ) : (
          <form onSubmit={submit} className="mt-4" noValidate>
            {error ? <Alert variant="danger" className="mb-3">{error}</Alert> : null}
            <label htmlFor="comment-body" className="sr-only">
              {tr("Komentar", "Comment")}
            </label>
            <Textarea
              id="comment-body"
              value={body}
              onChange={(event) => setBody(event.target.value.slice(0, 1000))}
              placeholder={tr("Tulis tanggapan yang sopan dan relevan...", "Write a polite and relevant response...")}
              className="min-h-28"
              maxLength={1000}
              disabled={moderating}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-bark-500">
                <CircleAlert className="size-3" aria-hidden="true" />
                {body.length}/1000 · {tr("AI moderation aktif", "AI moderation active")}
              </div>
              <Button type="submit" variant="cozy" disabled={moderating}>
                {moderating ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                {moderating ? tr("Memeriksa komentar...", "Checking comment...") : tr("Kirim komentar", "Post comment")}
              </Button>
            </div>
          </form>
        )}
        <div className="mt-3 flex items-start gap-2 rounded-[14px] border border-[#e8e2d5] bg-cream-100/70 p-3 text-xs leading-relaxed text-bark-700">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-sage-700" aria-hidden="true" />
          <p>
            {tr(
              "Komentar yang ditahan tidak dihapus diam-diam. Kamu menerima penjelasan alasannya begitu moderasi selesai.",
              "Held comments are not silently deleted. You get an explanation as soon as moderation finishes.",
            )}
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">
          {tr("Komentar", "Comments")} <span className="text-base font-bold text-bark-500">({visibleComments.length})</span>
        </h2>
        <div className="mt-4 space-y-3">
          {roots.length > 0 ? (
            roots.map((comment) => renderComment(comment, 0))
          ) : (
            <EmptyState
              compact
              icon={MessageSquarePlus}
              state="none"
              title={tr("Belum ada komentar", "No comments yet")}
              description={tr("Jadi yang pertama menanggapi dengan sopan dan konstruktif.", "Be the first to respond politely and constructively.")}
            />
          )}
        </div>
      </section>

      <Dialog
        open={moderationNotice !== null}
        onOpenChange={(open) => { if (!open) setModerationNotice(null); }}
        className="cozy-pop sm:rounded-[24px] sm:border-[#eae5d9] sm:bg-[#fffdf8]"
        title={moderationTitle(moderationNotice?.status)}
        description={moderationNotice?.moderationNote ?? moderationDescription(moderationNotice?.status)}
        footer={
          <Button onClick={() => setModerationNotice(null)}>
            {tr("Mengerti", "Got it")}
          </Button>
        }
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        className="cozy-pop sm:rounded-[24px] sm:border-[#eae5d9] sm:bg-[#fffdf8]"
        title={tr("Hapus komentar", "Delete comment")}
        description={tr(
          "Komentar ini akan dihapus secara lembut dan tidak akan terlihat publik lagi. Balasan lain tetap dapat tampil.",
          "This comment will be softly deleted and will no longer be visible publicly. Other replies may still remain visible.",
        )}
        footer={
          <>
            <Button variant="cozySoft" onClick={() => setDeleteTarget(null)}>{tr("Batal", "Cancel")}</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={busyId === deleteTarget?.id}>
              {busyId === deleteTarget?.id ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
              {tr("Hapus", "Delete")}
            </Button>
          </>
        }
      />
    </div>
  );
}
