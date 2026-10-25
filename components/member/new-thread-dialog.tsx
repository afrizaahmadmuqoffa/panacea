"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Dialog } from "@/components/ui/dialog";
import { NewThreadForm } from "./new-thread-form";

export function NewThreadDialog({
  initialClaimId,
  className,
  children,
}: {
  initialClaimId?: string;
  className?: string;
  children?: ReactNode;
}) {
  const { tr } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children ?? tr("Buat thread", "New thread")}
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={tr("Buat thread baru", "Start a new thread")}
        description={tr(
          "Tulis pertanyaan atau pengalaman secara spesifik. Hindari data pribadi dan serangan personal.",
          "Write a specific question or experience. Avoid personal data and personal attacks.",
        )}
        className="cozy-pop sm:max-w-3xl sm:rounded-[24px] sm:border-[#eae5d9] sm:bg-[#fffdf8]"
      >
        {open ? (
          <NewThreadForm initialClaimId={initialClaimId} onDone={() => setOpen(false)} />
        ) : null}
      </Dialog>
    </>
  );
}
