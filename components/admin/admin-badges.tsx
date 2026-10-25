"use client";

import { Award, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/panacea/status-badge";
import { BadgeIcon } from "@/components/panacea/badge-icon";
import { saveBadgeActiveAction, saveBadgeThresholdAction } from "@/lib/actions/admin";
import type { Badge as BadgeType } from "@/lib/types";

export function AdminBadges({ badges }: { badges: BadgeType[] }) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const [thresholds, setThresholds] = useState<Record<string, number>>(
    Object.fromEntries(badges.map((badge) => [badge.code, badge.threshold])),
  );
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(badges.map((badge) => [badge.code, badge.isActive ?? true])),
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    const invalid = Object.values(thresholds).some((value) => value < 1);
    if (invalid) {
      toast.error(tr("Ambang badge harus lebih dari 0.", "Badge thresholds must be greater than 0."));
      return;
    }
    setSaving(true);
    for (const badge of badges) {
      if (thresholds[badge.code] === badge.threshold) continue;
      const result = await saveBadgeThresholdAction(locale, {
        code: badge.code,
        threshold: thresholds[badge.code],
      });
      if (result.error) {
        setSaving(false);
        toast.error(result.error);
        return;
      }
    }
    setSaving(false);
    router.refresh();
    toast.success(
      tr(
        "Konfigurasi disimpan. Perubahan hanya berlaku untuk pencapaian baru.",
        "Configuration saved. Changes only apply to new achievements.",
      ),
    );
  }

  async function toggleActive(code: string, value: boolean) {
    setActive((current) => ({ ...current, [code]: value }));
    const result = await saveBadgeActiveAction(locale, { code, isActive: value });
    if (result.error) {
      setActive((current) => ({ ...current, [code]: !value }));
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Gamifikasi", "Gamification")}
        title={tr("Ambang badge verifikasi dan streak", "Verification and streak badge thresholds")}
        description={tr(
          "Badge bersifat permanen. Perubahan ambang tidak mencabut badge yang sudah terbuka dan hanya berlaku untuk pencapaian berikutnya.",
          "Badges are permanent. Threshold changes do not revoke badges already unlocked and only apply to future achievements.",
        )}
        actions={
          <Button onClick={() => void save()} disabled={saving}>
            <Save className="size-4" aria-hidden="true" />
            {saving ? tr("Menyimpan...", "Saving...") : tr("Simpan konfigurasi", "Save configuration")}
          </Button>
        }
      />

      <div className="flex gap-2.5 rounded-lg border border-butter-300 bg-[#fff7de] p-4 text-xs leading-relaxed text-[#7c5c17]">
        <Award className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          {tr(
            "Admin dapat mengubah ambang, tetapi badge yang sudah diraih tetap dimiliki pengguna.",
            "Admins can change thresholds, but badges already earned remain with users.",
          )}
        </p>
      </div>

      {badges.length === 0 ? (
        <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-6 text-sm text-bark-700">
          {tr("Belum ada badge di database.", "No badges exist in the database yet.")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {badges.map((badge) => (
              <article key={badge.code} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-12 place-items-center rounded-full border-4 border-butter-300 bg-[#f6d982] text-[#7c5c17]">
                    <BadgeIcon iconKey={badge.iconKey} className="size-5" />
                  </span>
                  <Switch
                    checked={active[badge.code] ?? true}
                    onCheckedChange={(value) => void toggleActive(badge.code, value)}
                    label={tr("Aktifkan badge", "Activate badge")}
                  />
                </div>
                <h2 className="mt-3 font-heading text-base font-extrabold text-bark-900">{badge.name[locale]}</h2>
                <p className="mt-1 text-xs leading-relaxed text-bark-700">{badge.description[locale]}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={badge.type === "streak" ? "peach" : "sage"}>
                    {badge.type === "streak" ? tr("Streak", "Streak") : tr("Verifikasi", "Verification")}
                  </Badge>
                  <StatusBadge status={active[badge.code] ?? true ? "active" : "inactive"} />
                </div>
                <div className="mt-4">
                  <label htmlFor={`threshold-${badge.code}`} className="text-xs font-bold text-bark-700">
                    {tr("Ambang", "Threshold")}
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      id={`threshold-${badge.code}`}
                      type="number"
                      min={1}
                      value={thresholds[badge.code] ?? badge.threshold}
                      onChange={(event) =>
                        setThresholds((current) => ({ ...current, [badge.code]: Number(event.target.value) }))
                      }
                      className="h-10 w-28"
                    />
                    <span className="text-xs text-bark-500">
                      {badge.type === "streak" ? tr("hari", "days") : tr("verifikasi", "verifications")}
                    </span>
                  </div>
                </div>
              </article>
          ))}
        </div>
      )}
    </div>
  );
}
