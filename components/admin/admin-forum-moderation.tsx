"use client";

import {
  CheckCheck,
  EyeOff,
  LoaderCircle,
  Lock,
  MessageSquareWarning,
  MessagesSquare,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { moderateCommentAction, toggleThreadLockAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/panacea/status-badge";
import { categoryName } from "@/lib/data/categories";
import { formatDate } from "@/lib/i18n/format";
import type { CommentStatus, ForumThread } from "@/lib/types";

export function AdminForumModeration({ threads }: { threads: ForumThread[] }) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState("held");
  const [overrides, setOverrides] = useState<Record<string, CommentStatus>>({});
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<string | null>(null);

  const held = useMemo(
    () =>
      threads.flatMap((thread) =>
        thread.comments
          .map((comment) => ({ ...comment, status: overrides[comment.id] ?? comment.status, threadTitle: thread.title }))
          .filter((comment) => comment.status === "held" || comment.status === "pending_moderation"),
      ),
    [threads, overrides],
  );

  async function act(commentId: string, status: CommentStatus) {
    if (status !== "visible" && status !== "hidden" && status !== "removed" && status !== "held") return;
    setPending(commentId);
    try {
      const result = await moderateCommentAction(locale, { commentId, action: status });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setOverrides((current) => ({ ...current, [commentId]: status }));
      router.refresh();
      toast.success(
        status === "visible"
          ? tr("Komentar disetujui dan dipulihkan.", "Comment approved and restored.")
          : status === "hidden"
            ? tr("Komentar disembunyikan tanpa menghapus histori.", "Comment hidden without deleting history.")
            : tr("Komentar dihapus dari tampilan publik.", "Comment removed from public view."),
      );
    } finally {
      setPending(null);
    }
  }

  async function toggleLock(threadId: string, current: boolean) {
    const next = !current;
    const result = await toggleThreadLockAction(locale, threadId, next);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setLocked((state) => ({ ...state, [threadId]: next }));
    router.refresh();
    toast.success(next ? tr("Thread dikunci.", "Thread locked.") : tr("Thread dibuka kembali.", "Thread unlocked."));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Moderasi forum", "Forum moderation")}
        title={tr("Keputusan manusia untuk konten tertahan", "Human decisions for held content")}
        description={tr(
          "Tinjau konteks, alasan model, dan tindakan yang tersedia. Tindakan admin dicatat. Konten tidak dihapus diam-diam berdasarkan skor probabilistik.",
          "Review context, model reasons, and available actions. Admin actions are logged. Content is not silently deleted based on probabilistic scores.",
        )}
        actions={<Badge variant="rose"><MessageSquareWarning className="size-3.5" aria-hidden="true" />{held.length} {tr("tertahan", "held")}</Badge>}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="held"><MessagesSquare className="size-3.5" aria-hidden="true" />{tr("Komentar tertahan", "Held comments")}<Badge variant="rose" className="px-1.5 py-0 text-xs">{held.length}</Badge></TabsTrigger>
          <TabsTrigger value="threads"><Lock className="size-3.5" aria-hidden="true" />{tr("Thread", "Threads")}<Badge variant="outline" className="px-1.5 py-0 text-xs">{threads.length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="held" className="mt-4">
          {held.length > 0 ? (
            <div className="space-y-3">
              {held.map((comment) => (
                <article key={comment.id} className="rounded-[22px] border border-rose-100 bg-[#fffdf8] p-4 cozy-shadow">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={comment.status} />
                    <Badge variant="outline">{comment.threadTitle}</Badge>
                    <span className="ml-auto text-xs text-bark-500">{formatDate(comment.createdAt, locale, true)}</span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-bark-900">{comment.authorAlias}</p>
                  <p className="mt-1 rounded-md border border-[#eae5d9] bg-[#fffdf8] p-3 text-xs leading-relaxed text-bark-700">{comment.body}</p>
                  <div className="mt-2 rounded-md border border-sage-300 bg-sage-100 p-2.5 text-xs leading-relaxed text-sage-700">
                    <span className="font-bold">{tr("Alasan model", "Model reason")}: </span>
                    {comment.moderationNote?.[locale] ?? tr("Konteks ambigu; menunggu pemeriksaan manusia.", "Ambiguous context; awaiting human review.")}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-cream-200 pt-3">
                    <Button size="sm" onClick={() => void act(comment.id, "visible")} disabled={pending === comment.id}>
                      {pending === comment.id ? <LoaderCircle className="size-3.5 spin" aria-hidden="true" /> : <CheckCheck className="size-3.5" aria-hidden="true" />}
                      {tr("Setujui", "Approve")}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => void act(comment.id, "hidden")} disabled={pending === comment.id}>
                      {pending === comment.id ? <LoaderCircle className="size-3.5 spin" aria-hidden="true" /> : <EyeOff className="size-3.5" aria-hidden="true" />}
                      {tr("Sembunyikan", "Hide")}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => void act(comment.id, "removed")} disabled={pending === comment.id}>
                      {pending === comment.id ? <LoaderCircle className="size-3.5 spin" aria-hidden="true" /> : <Trash2 className="size-3.5" aria-hidden="true" />}
                      {tr("Hapus", "Remove")}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border-strong bg-cream-50 py-10 text-center">
              <CheckCheck className="mx-auto size-8 text-sage-700" aria-hidden="true" />
              <p className="mt-2 font-heading text-base font-extrabold text-bark-900">{tr("Tidak ada komentar tertahan", "No held comments")}</p>
              <p className="mt-1 text-xs text-bark-500">{tr("Antrean moderasi bersih.", "The moderation queue is clear.")}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="threads" className="mt-4">
          <div className="space-y-3">
            {threads.map((thread) => {
              const isLocked = locked[thread.id] ?? thread.isLocked;
              return (
                <article key={thread.id} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{categoryName(thread.categorySlug, locale)}</Badge>
                        {isLocked ? <Badge variant="rose"><Lock className="size-3" aria-hidden="true" />{tr("Dikunci", "Locked")}</Badge> : null}
                      </div>
                      <p className="mt-1.5 text-sm font-extrabold leading-snug text-bark-900">{thread.title}</p>
                      <p className="mt-0.5 text-xs text-bark-500">
                        {thread.authorAlias} · {formatDate(thread.createdAt, locale)} · {thread.comments.filter((comment) => comment.status === "visible").length} {tr("komentar terlihat", "visible comments")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-bark-500">{tr("Kunci thread", "Lock thread")}</span>
                      <Switch checked={isLocked} onCheckedChange={() => void toggleLock(thread.id, isLocked)} label={tr("Kunci thread", "Lock thread")} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <div className="rounded-lg border border-cream-200 bg-cream-100 p-4 text-xs leading-relaxed text-bark-700">
        {tr(
          "Moderation log mentah hanya tersedia untuk admin dan sistem. Konten mentah tertahan memiliki retensi terbatas dan tidak masuk feed atau analytics umum.",
          "Raw moderation logs are only available to admins and the system. Raw held content has limited retention and does not enter the feed or general analytics.",
        )}
      </div>
    </div>
  );
}
