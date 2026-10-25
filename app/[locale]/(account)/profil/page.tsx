import type { Metadata } from "next";
import { ProfileView } from "@/components/member/profile-view";

export const metadata: Metadata = {
  title: "Profil Saya",
};

export default function ProfilePage() {
  return <ProfileView />;
}