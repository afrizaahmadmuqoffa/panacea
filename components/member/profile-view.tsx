"use client";

import {
  Check,
  Eye,
  Flame,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n, useLocaleSwitch } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { changePasswordAction, updateProfileAction } from "@/lib/actions/member";
import { ProfileSkeleton } from "@/components/skeletons/member";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/label";
import { Input, Select } from "@/components/ui/input";
import { MemberPageHeader } from "./member-page-header";
import { shortAlias } from "@/lib/utils";
import type { Badge as BadgeType, Profile, UserRole } from "@/lib/types";

export function ProfileView() {
  const { profile, badges, role, refresh, hydrated } = usePanacea();
  if (!hydrated) return <ProfileSkeleton />;
  return (
    <ProfileViewInner
      key={`${profile.fullName}|${profile.alias}|${profile.uiLanguage}|${profile.showOnLeaderboard}`}
      profile={profile}
      badges={badges}
      role={role}
      refresh={refresh}
    />
  );
}

function ProfileViewInner({
  profile,
  badges,
  role,
  refresh,
}: {
  profile: Profile;
  badges: BadgeType[];
  role: UserRole;
  refresh: () => Promise<unknown>;
}) {
  const { locale, tr } = useI18n();
  const switchLocale = useLocaleSwitch();
  const [fullName, setFullName] = useState(profile.fullName);
  const [alias, setAlias] = useState(profile.alias);
  const [language, setLanguage] = useState(profile.uiLanguage);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(profile.showOnLeaderboard);
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [changing, setChanging] = useState(false);
  const earned = badges.filter((badge) => badge.earned).length;
  const isPlayer = role === "user";

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 3) {
      toast.error(tr("Nama lengkap minimal 3 karakter.", "Full name must be at least 3 characters."));
      return;
    }
    if (alias.trim().length < 2) {
      toast.error(tr("Nama publik minimal 2 karakter.", "Public name must be at least 2 characters."));
      return;
    }
    setSaving(true);
    const payload = new FormData();
    payload.set("fullName", fullName.trim());
    payload.set("alias", alias.trim());
    payload.set("uiLanguage", language);
    if (showOnLeaderboard) payload.set("showOnLeaderboard", "on");
    const result = await updateProfileAction(locale, payload);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(tr("Profil disimpan.", "Profile saved."));
    if (result.uiLanguage && result.uiLanguage !== locale) {
      switchLocale(result.uiLanguage);
      return;
    }
    await refresh();
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError("");
    if (passwords.current.length < 8) {
      setPasswordError(tr("Password saat ini minimal 8 karakter.", "Current password must be at least 8 characters."));
      return;
    }
    if (passwords.next.length < 8) {
      setPasswordError(tr("Password baru minimal 8 karakter.", "New password must be at least 8 characters."));
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError(tr("Konfirmasi password baru belum cocok.", "New password confirmation does not match."));
      return;
    }
    setChanging(true);
    const payload = new FormData();
    payload.set("currentPassword", passwords.current);
    payload.set("password", passwords.next);
    payload.set("confirmPassword", passwords.confirm);
    const result = await changePasswordAction(locale, payload);
    setChanging(false);
    if (result.error) {
      setPasswordError(result.error);
      return;
    }
    setPasswords({ current: "", next: "", confirm: "" });
    toast.success(tr("Password diperbarui.", "Password updated."));
  }

  return (
    <div className="space-y-6">
      <MemberPageHeader
        icon={UserRound}
        title={tr("Profil dan preferensi", "Profile and preferences")}
        description={
          isPlayer
            ? tr(
                "Atur nama tampilan, bahasa antarmuka, dan preferensi leaderboard. Email dikelola oleh akun dan tidak dapat diubah di sini.",
                "Manage your display name, interface language, and leaderboard preference. Email is managed by the account and cannot be changed here.",
              )
            : tr(
                "Atur nama tampilan dan bahasa antarmuka. Email dikelola oleh akun dan tidak dapat diubah di sini.",
                "Manage your display name and interface language. Email is managed by the account and cannot be changed here.",
              )
        }
      />

      <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={profile.fullName} size="lg" tone="warm" className="mx-auto size-20 shrink-0 text-xl ring-4 ring-butter-300 ring-offset-4 ring-offset-[#fffdf8] sm:mx-0" />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">{profile.fullName}</h2>
            <p className="mt-0.5 text-xs text-bark-500">{profile.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {role === "reviewer" ? (
                <Badge variant="sky">
                  <Stethoscope className="size-3.5" aria-hidden="true" />
                  {tr("Reviewer", "Reviewer")}
                </Badge>
              ) : role === "admin" ? (
                <Badge variant="butter">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  {tr("Admin", "Admin")}
                </Badge>
              ) : (
                <Badge variant="sage">
                  <UserRound className="size-3.5" aria-hidden="true" />
                  {tr("Anggota", "Member")}
                </Badge>
              )}
              {isPlayer ? (
                <Badge variant="butter">
                  {showOnLeaderboard ? <Eye className="size-3.5" aria-hidden="true" /> : <LockKeyhole className="size-3.5" aria-hidden="true" />}
                  {showOnLeaderboard ? tr("Tampil di leaderboard", "On leaderboard") : tr("Privat", "Private")}
                </Badge>
              ) : null}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-bark-500">
              {tr("Tampilan publik", "Public display")}: <span className="font-bold text-bark-700">{shortAlias(alias)}</span>
            </p>
          </div>
          {isPlayer ? (
            <dl className="grid grid-cols-3 gap-2 border-t border-dashed border-[#e8e2d5] pt-4 text-center sm:w-[260px] sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-bark-500">{tr("Poin", "Points")}</dt>
                <dd className="mt-1 font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">
                  {profile.xp.toLocaleString(locale === "id" ? "id-ID" : "en-GB")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-bark-500">Streak</dt>
                <dd className="mt-1 inline-flex items-center gap-1 font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">
                  <Flame className="size-4 text-[#8a641a]" aria-hidden="true" />
                  {profile.streak}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-bark-500">Badge</dt>
                <dd className="mt-1 font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">{earned}</dd>
              </div>
            </dl>
          ) : null}
        </div>
        {isPlayer ? (
          <div className="mt-5 flex items-start gap-2 rounded-[16px] border border-sage-300 bg-sage-100 p-3.5 text-xs leading-relaxed text-bark-700">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              {tr(
                "Privasi default: nama lengkap tidak otomatis tampil di leaderboard. Kamu dapat memilih nama publik yang berbeda.",
                "Privacy by default: your full name is not automatically shown on the leaderboard. You can choose a different public name.",
              )}
            </p>
          </div>
        ) : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={saveProfile} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow sm:p-6" noValidate>
          <h2 className="font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">{tr("Informasi profil", "Profile information")}</h2>
          <div className="mt-4 space-y-4">
            <Field label={tr("Nama lengkap", "Full name")} htmlFor="profile-name" required>
              <Input id="profile-name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
            </Field>
            <Field label={tr("Email", "Email")} htmlFor="profile-email" hint={tr("Tidak dapat diubah", "Cannot be changed")}>
              <Input id="profile-email" value={profile.email} disabled />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Nama publik", "Public name")} htmlFor="profile-alias" hint={tr("2–40 karakter", "2–40 characters")}>
                <Input id="profile-alias" value={alias} onChange={(event) => setAlias(event.target.value)} maxLength={40} />
              </Field>
              <Field label={tr("Bahasa antarmuka", "Interface language")} htmlFor="profile-language">
                <Select id="profile-language" value={language} onChange={(event) => setLanguage(event.target.value as "id" | "en")}>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </Select>
              </Field>
            </div>
            {isPlayer ? (
              <div className="flex items-start justify-between gap-4 rounded-[16px] border border-[#e8e2d5] bg-cream-100/70 p-4">
                <div>
                  <p className="text-xs font-extrabold text-bark-900">{tr("Tampil di leaderboard", "Show on leaderboard")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-bark-700">
                    {tr(
                      "Jika aktif, nama publik di atas akan digunakan. Kamu tetap dapat memilih tidak tampil.",
                      "When enabled, the public name above is used. You can still choose not to appear.",
                    )}
                  </p>
                </div>
                <Switch checked={showOnLeaderboard} onCheckedChange={setShowOnLeaderboard} label={tr("Tampil di leaderboard", "Show on leaderboard")} />
              </div>
            ) : null}
          </div>
          <div className="mt-5 flex items-center justify-end gap-3 sm:justify-between">
            <p className="hidden text-xs text-bark-500 sm:block">{tr("Perubahan berlaku untuk tampilan publik berikutnya.", "Changes apply to the next public display.")}</p>
            <Button type="submit" variant="cozy" disabled={saving}>
              {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
              {saving ? tr("Menyimpan...", "Saving...") : tr("Simpan profil", "Save profile")}
            </Button>
          </div>
        </form>

        <div className="space-y-5">
          <form onSubmit={changePassword} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow sm:p-6" noValidate>
            <div className="flex items-center gap-2">
              <LockKeyhole className="size-4 text-sage-700" aria-hidden="true" />
              <h2 className="font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">{tr("Ganti password", "Change password")}</h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-bark-500">
              {tr(
                "Hanya tersedia dari sesi yang terautentikasi. Tidak ada alur lupa atau reset password.",
                "Only available from an authenticated session. There is no forgot or reset password flow.",
              )}
            </p>
            {passwordError ? <Alert variant="danger" className="mt-3">{passwordError}</Alert> : null}
            <div className="mt-4 space-y-4">
              <Field label={tr("Password saat ini", "Current password")} htmlFor="current-password" required>
                <Input id="current-password" type="password" value={passwords.current} onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))} autoComplete="current-password" />
              </Field>
              <Field label={tr("Password baru", "New password")} htmlFor="new-password" required>
                <Input id="new-password" type="password" value={passwords.next} onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))} autoComplete="new-password" />
              </Field>
              <Field label={tr("Konfirmasi", "Confirm")} htmlFor="confirm-password" required>
                <Input id="confirm-password" type="password" value={passwords.confirm} onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))} autoComplete="new-password" />
              </Field>
            </div>
            <div className="mt-5 flex justify-end">
              <Button type="submit" variant="cozySoft" disabled={changing}>
                {changing ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <LockKeyhole className="size-4" aria-hidden="true" />}
                {changing ? tr("Memperbarui...", "Updating...") : tr("Perbarui password", "Update password")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
