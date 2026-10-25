"use client";

import { ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Dialog } from "@/components/ui/dialog";
import { ReportForm } from "./report-form";

export function ReportDialog({
  claimId,
  className,
  children,
}: {
  claimId: string;
  className?: string;
  children?: ReactNode;
}) {
  const { tr } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children ?? (
          <>
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {tr("Laporkan ke Pakar", "Report to an Expert")}
          </>
        )}
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={tr("Laporkan ke Pakar", "Report to an Expert")}
        description={tr(
          "Jelaskan mengapa analisis awal AI belum cukup. Laporan dikirim ke reviewer aktif yang keahliannya cocok.",
          "Explain why the initial AI analysis is not enough. The report goes to active reviewers with matching expertise.",
        )}
        className="cozy-pop sm:max-w-3xl sm:rounded-[24px] sm:border-[#eae5d9] sm:bg-[#fffdf8]"
      >
        {open ? <ReportForm claimId={claimId} onDone={() => setOpen(false)} /> : null}
      </Dialog>
    </>
  );
}
