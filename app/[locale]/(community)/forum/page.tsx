import type { Metadata } from "next";
import { ForumList } from "@/components/member/forum-list";

export const metadata: Metadata = {
  title: "Forum",
};

export default function ForumPage() {
  return <ForumList />;
}
