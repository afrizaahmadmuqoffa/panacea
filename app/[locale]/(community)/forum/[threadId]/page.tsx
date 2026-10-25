import type { Metadata } from "next";
import { ThreadDetail } from "@/components/member/thread-detail";

export const metadata: Metadata = {
  title: "Detail Diskusi",
};

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  return <ThreadDetail threadId={threadId} />;
}
