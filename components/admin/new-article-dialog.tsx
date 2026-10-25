"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ArticleEditor } from "@/components/admin/article-editor";
import { useI18n } from "@/components/providers/i18n-provider";
import type { Category, KBSource } from "@/lib/types";

export function NewArticleDialog({
  source,
  categories,
}: {
  source: KBSource | null | undefined;
  categories: Category[];
}) {
  const { tr } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        {tr("Buat artikel", "New article")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={tr("Buat artikel KB", "Create KB article")}
        description={tr(
          "Tulis artikel, lalu sistem memecahnya menjadi chunk. Kamu bisa mengelola chunk sebelum di-ingest.",
          "Write the article, then the system splits it into chunks. You can manage chunks before ingestion.",
        )}
        className="sm:max-w-4xl"
      >
        <ArticleEditor
          source={source ?? undefined}
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
