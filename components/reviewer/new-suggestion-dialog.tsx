"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { NewSuggestionForm } from "@/components/reviewer/new-suggestion-form";
import { useI18n } from "@/components/providers/i18n-provider";
import type { Category } from "@/lib/types";

export function NewSuggestionDialog({
  sources,
  categories,
  label,
  children,
}: {
  sources: Array<{ id: string; title: string }>;
  categories: Category[];
  label?: string;
  children?: ReactNode;
}) {
  const { tr } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        {children ?? label ?? tr("Ajukan saran", "New suggestion")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={tr("Ajukan saran bukti", "Suggest new evidence")}
        description={tr(
          "Tulis atau unggah bukti, lalu sistem memecahnya menjadi chunk dengan target 400–800 token. Kamu bisa mengelola chunk sebelum admin ditinjau.",
          "Write or upload the evidence, then the system splits it into chunks targeting 400–800 tokens. You can manage the chunks before an admin reviews them.",
        )}
        className="sm:max-w-3xl"
      >
        <NewSuggestionForm
          sources={sources}
          categories={categories}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
    </>
  );
}
