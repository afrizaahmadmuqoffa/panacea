"use client";

import { RefreshCw, Server } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { checkServiceStatusAction } from "@/lib/actions/admin";
import type { SystemService } from "@/lib/types";
import { cn } from "@/lib/utils";

const tone = {
  healthy: "border-sage-300 bg-sage-100 text-sage-700",
  degraded: "border-butter-300 bg-[#fff7de] text-[#7c5c17]",
  attention: "border-rose-100 bg-rose-100 text-rose-700",
};

export function ServiceStatus({ initial }: { initial: SystemService[] }) {
  const { locale, tr } = useI18n();
  const [services, setServices] = useState(initial);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await checkServiceStatusAction(locale);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setServices(result.services ?? []);
      setCheckedAt(new Date().toISOString());
      toast.success(tr("Pemeriksaan layanan selesai.", "Service check finished."));
    });
  }

  return (
    <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow cozy-hover hover:border-sage-300">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e2d5] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Server className="size-4 text-bark-500" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-base font-extrabold text-bark-900">
              {tr("Status layanan", "Service status")}
            </h2>
            <p className="mt-0.5 text-xs text-bark-500">
              {checkedAt
                ? tr(
                    `Diuji terakhir ${new Date(checkedAt).toLocaleTimeString(locale === "id" ? "id-ID" : "en-GB")}`,
                    `Last checked ${new Date(checkedAt).toLocaleTimeString(locale === "id" ? "id-ID" : "en-GB")}`,
                  )
                : tr("Hasil pemeriksaan koneksi nyata.", "Results from a real connection check.")}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={run} disabled={pending}>
          <RefreshCw className={cn("size-4", pending && "animate-spin")} aria-hidden="true" />
          {pending ? tr("Menguji…", "Testing…") : tr("Uji koneksi", "Test connection")}
        </Button>
      </div>
      <ul className="grid gap-2.5 p-5 sm:grid-cols-3">
        {services.map((service) => (
          <li key={service.name} className={cn("min-w-0 rounded-md border p-3", tone[service.status])}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 break-words text-xs font-extrabold">{service.name}</p>
              <span className="shrink-0 text-xs font-extrabold uppercase tracking-[0.1em]">
                {service.status === "healthy"
                  ? tr("Sehat", "Healthy")
                  : service.status === "degraded"
                    ? tr("Terdegradasi", "Degraded")
                    : tr("Perlu perhatian", "Needs attention")}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="min-w-0 break-words">{service.detail[locale]}</span>
              <span className="shrink-0 font-bold">{service.latency}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
