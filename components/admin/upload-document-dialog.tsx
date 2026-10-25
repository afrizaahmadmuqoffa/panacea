"use client";

import { FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DocumentUpload } from "@/components/admin/document-upload";
import { useI18n } from "@/components/providers/i18n-provider";
import type { Category } from "@/lib/types";

export function UploadDocumentDialog({ categories }: { categories: Category[] }) {
  const { tr } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <FileUp className="size-4" aria-hidden="true" />
        {tr("Unggah dokumen", "Upload document")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={tr("Unggah dokumen KB", "Upload KB document")}
        description={tr(
          "Unggah dokumen, lalu sistem ekstrak teks dan memecahnya menjadi chunk. Kamu bisa mengelola chunk sebelum di-ingest.",
          "Upload a document, then the system extracts text and splits it into chunks. You can manage chunks before ingestion.",
        )}
        className="sm:max-w-3xl"
      >
        <DocumentUpload
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
