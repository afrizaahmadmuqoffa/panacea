"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const DEMO_ACCOUNTS = [
  { role: { id: "Admin", en: "Admin" }, email: "admin@mail.com", password: "Demo123!" },
  { role: { id: "Reviewer", en: "Reviewer" }, email: "afriza@mail.com", password: "Demo123!" },
  { role: { id: "Member", en: "Member" }, email: "sitinur@mail.com", password: "Demo123!" },
] as const;

export function DemoAccountsButton() {
  const { tr } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied((current) => (current === label ? null : current)), 1500);
    } catch {
      setCopied(null);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="cozySoft"
        className="mt-3 w-full justify-center"
        onClick={() => setOpen(true)}
      >
        <KeyRound className="size-4" aria-hidden="true" />
        {tr("Lihat akun demo", "View demo accounts")}
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={tr("Akun demo", "Demo accounts")}
        description={tr(
          "Gunakan salah satu akun di bawah untuk mencoba setiap peran.",
          "Use one of the accounts below to try each role.",
        )}
      >
        <ul className="space-y-2.5">
          {DEMO_ACCOUNTS.map((account) => {
            const label = account.role.en;
            const isCopied = copied === label;
            return (
              <li
                key={account.email}
                className="rounded-[16px] border border-[#eae5d9] bg-[#fffdf8] p-3"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.06em] text-sage-700">
                  {account.role.id === "Admin"
                    ? tr("Admin", "Admin")
                    : account.role.id === "Reviewer"
                      ? tr("Reviewer", "Reviewer")
                      : tr("Member", "Member")}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="flex items-baseline gap-1.5 text-xs">
                    <span className="shrink-0 font-bold text-bark-500">{tr("Email", "Email")}</span>
                    <span className="min-w-0 break-all font-mono font-bold text-bark-900">
                      {account.email}
                    </span>
                  </p>
                  <p className="flex items-baseline gap-1.5 text-xs">
                    <span className="shrink-0 font-bold text-bark-500">{tr("Password", "Password")}</span>
                    <span className="min-w-0 break-all font-mono font-bold text-bark-900">
                      {account.password}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void copy(label, `${account.email} / ${account.password}`)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#eae5d9] bg-white px-2.5 py-1 text-[11px] font-extrabold text-sage-700 transition hover:bg-sage-100"
                >
                  {isCopied ? (
                    <Check className="size-3" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3" aria-hidden="true" />
                  )}
                  {isCopied ? tr("Tersalin", "Copied") : tr("Salin", "Copy")}
                </button>
              </li>
            );
          })}
        </ul>
        <Button
          type="button"
          variant="cozy"
          className="mt-3 w-full justify-center"
          onClick={() =>
            void copy(
              "all",
              DEMO_ACCOUNTS.map((account) => `${account.role.id}: ${account.email} / ${account.password}`).join("\n"),
            )
          }
        >
          {copied === "all" ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied === "all" ? tr("Semua tersalin", "All copied") : tr("Salin semua", "Copy all")}
        </Button>
      </Dialog>
    </>
  );
}
