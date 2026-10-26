"use client";

import { LoaderCircle, Pencil, Plus, Search, SearchX, Tags, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Switch } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AdminCategories({ categories }: { categories: Category[] }) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [removing, setRemoving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nameId: "", nameEn: "", slug: "", descriptionId: "", descriptionEn: "", isActive: true });
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return categories.filter(
      (category) =>
        !normalized ||
        category.name.id.toLowerCase().includes(normalized) ||
        category.name.en.toLowerCase().includes(normalized) ||
        category.slug.includes(normalized),
    );
  }, [categories, query]);

  const hasQuery = query.trim().length > 0;
  const { page, setPage, pageCount, start, end } = usePagination(visible.length);
  const pageSlice = visible.slice(start, end);

  function openAdd() {
    setEditing(null);
    setForm({ nameId: "", nameEn: "", slug: "", descriptionId: "", descriptionEn: "", isActive: true });
    setError("");
    setOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({
      nameId: category.name.id,
      nameEn: category.name.en,
      slug: category.slug,
      descriptionId: category.description.id,
      descriptionEn: category.description.en,
      isActive: category.isActive,
    });
    setError("");
    setOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (form.nameId.trim().length < 3 || form.nameEn.trim().length < 3) {
      setError(tr("Nama kategori minimal 3 karakter.", "Category name must be at least 3 characters."));
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.slug)) {
      setError(tr("Slug hanya boleh huruf kecil, angka, dan tanda hubung.", "Slug may only contain lowercase letters, numbers, and hyphens."));
      return;
    }
    const duplicate = categories.some(
      (category) => category.slug === form.slug && category.id !== editing?.id,
    );
    if (duplicate) {
      setError(tr("Slug sudah dipakai kategori lain.", "The slug is already used by another category."));
      return;
    }
    if (form.descriptionId.trim().length < 5 || form.descriptionEn.trim().length < 5) {
      setError(tr("Deskripsi minimal 5 karakter di kedua bahasa.", "Description must be at least 5 characters in both languages."));
      return;
    }
    const result = await saveCategoryAction(locale, {
      id: editing?.id,
      slug: form.slug,
      nameId: form.nameId.trim(),
      nameEn: form.nameEn.trim(),
      descriptionId: form.descriptionId.trim(),
      descriptionEn: form.descriptionEn.trim(),
      isActive: form.isActive,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(editing ? tr("Kategori diperbarui.", "Category updated.") : tr("Kategori ditambahkan.", "Category added."));
    setOpen(false);
    router.refresh();
  }

  async function toggle(category: Category) {
    const result = await saveCategoryAction(locale, {
      id: category.id,
      slug: category.slug,
      nameId: category.name.id,
      nameEn: category.name.en,
      descriptionId: category.description.id,
      descriptionEn: category.description.en,
      isActive: !category.isActive,
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    if (deleting.usage > 0) {
      toast.error(tr("Kategori masih dipakai dan tidak dapat dihapus.", "The category is still in use and cannot be deleted."));
      setDeleting(null);
      return;
    }
    setRemoving(true);
    try {
      const result = await deleteCategoryAction(locale, deleting.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(tr("Kategori dihapus.", "Category deleted."));
      setDeleting(null);
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Kategori", "Categories")}
        title={tr("Topik kesehatan untuk routing dan KB", "Health topics for routing and the KB")}
        description={tr(
          "Kategori dipakai untuk routing klaim, sumber Knowledge Base, thread forum, dan bank soal. Kategori yang sedang dipakai tidak dapat dihapus.",
          "Categories are used for claim routing, KB sources, forum threads, and the question bank. Categories in use cannot be deleted.",
        )}
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" aria-hidden="true" />
            {tr("Tambah kategori", "Add category")}
          </Button>
        }
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={tr("Cari kategori...", "Search categories...")} className="pl-11" aria-label={tr("Cari kategori", "Search categories")} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-bark-700">{visible.length} {tr("kategori", "categories")}</p>
        <Badge variant="sage"><Tags className="size-3.5" aria-hidden="true" />{categories.filter((category) => category.isActive).length} {tr("aktif", "active")}</Badge>
      </div>

      {visible.length > 0 ? (
        <>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>{tr("Nama Indonesia", "Indonesian name")}</TH>
                    <TH>{tr("Nama Inggris", "English name")}</TH>
                    <TH>Slug</TH>
                    <TH>{tr("Dipakai", "Usage")}</TH>
                    <TH>{tr("Aktif", "Active")}</TH>
                    <TH>{tr("Aksi", "Actions")}</TH>
                  </TR>
                </THead>
                <TBody>
                  {pageSlice.map((category) => (
                    <TR key={category.id}>
                      <TD className="font-bold text-bark-900">{category.name.id}</TD>
                      <TD>{category.name.en}</TD>
                      <TD><code className="rounded bg-cream-100 px-1.5 py-0.5 text-xs text-bark-700">{category.slug}</code></TD>
                      <TD className="text-xs">{category.usage}</TD>
                      <TD><Switch checked={category.isActive} onCheckedChange={() => void toggle(category)} label={tr("Aktifkan kategori", "Activate category")} /></TD>
                      <TD>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="size-11" onClick={() => openEdit(category)} aria-label={tr("Edit kategori", "Edit category")}><Pencil className="size-3.5" aria-hidden="true" /></Button>
                          <Button variant="ghost" size="icon" className="size-11 text-rose-700" onClick={() => setDeleting(category)} aria-label={tr("Hapus kategori", "Delete category")}><Trash2 className="size-3.5" aria-hidden="true" /></Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </div>

          <div className="grid gap-3 md:hidden">
            {pageSlice.map((category) => (
              <article key={category.id} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-bark-900">{category.name[locale]}</p>
                    <p className="mt-0.5 text-xs text-bark-500">{category.slug}</p>
                  </div>
                  <Switch checked={category.isActive} onCheckedChange={() => void toggle(category)} label={tr("Aktifkan kategori", "Activate category")} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-3">
                  <span className="text-xs text-bark-500">{category.usage} {tr("penggunaan", "uses")}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-11" onClick={() => openEdit(category)} aria-label={tr("Edit kategori", "Edit category")}><Pencil className="size-3.5" aria-hidden="true" /></Button>
                    <Button variant="ghost" size="icon" className="size-11 text-rose-700" onClick={() => setDeleting(category)} aria-label={tr("Hapus kategori", "Delete category")}><Trash2 className="size-3.5" aria-hidden="true" /></Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      ) : hasQuery ? (
        <EmptyState
          icon={SearchX}
          state="filtered"
          title={tr("Kategori tidak ditemukan", "No categories found")}
          description={tr("Ubah kata kunci pencarian.", "Change the search keyword.")}
          action={<Button variant="secondary" onClick={() => { setQuery(""); setPage(1); }}>{tr("Hapus filter", "Clear filters")}</Button>}
        />
      ) : (
        <EmptyState
          icon={Tags}
          state="none"
          title={tr("Belum ada kategori", "No categories yet")}
          description={tr("Tambahkan kategori agar klaim dan diskusi bisa dikelompokkan.", "Add categories so claims and discussions can be grouped.")}
          action={<Button onClick={openAdd}>{tr("Tambah kategori", "Add category")}</Button>}
        />
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? tr("Edit kategori", "Edit category") : tr("Tambah kategori", "Add category")}
        description={tr("Slug dipakai di URL dan routing internal. Gunakan huruf kecil dan tanda hubung.", "The slug is used in URLs and internal routing. Use lowercase letters and hyphens.")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{tr("Batal", "Cancel")}</Button>
            <Button type="submit" form="category-form">{editing ? tr("Simpan", "Save") : tr("Tambah", "Add")}</Button>
          </>
        }
      >
        <form id="category-form" onSubmit={save} className="space-y-4" noValidate>
          {error ? <div className="rounded-md bg-rose-100 p-3 text-xs font-semibold text-rose-700">{error}</div> : null}
          <Field label={tr("Nama Indonesia", "Indonesian name")} htmlFor="category-id" required>
            <Input id="category-id" value={form.nameId} onChange={(event) => setForm((current) => ({ ...current, nameId: event.target.value }))} />
          </Field>
          <Field label={tr("Nama Inggris", "English name")} htmlFor="category-en" required>
            <Input id="category-en" value={form.nameEn} onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))} />
          </Field>
          <Field label="Slug" htmlFor="category-slug" required>
            <Input id="category-slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} placeholder="kesehatan-anak" />
          </Field>
          <Field label={tr("Deskripsi Indonesia", "Indonesian description")} htmlFor="category-description-id" required>
            <Input id="category-description-id" value={form.descriptionId} onChange={(event) => setForm((current) => ({ ...current, descriptionId: event.target.value }))} />
          </Field>
          <Field label={tr("Deskripsi Inggris", "English description")} htmlFor="category-description-en" required>
            <Input id="category-description-en" value={form.descriptionEn} onChange={(event) => setForm((current) => ({ ...current, descriptionEn: event.target.value }))} />
          </Field>
          <label className="flex items-center gap-2.5 text-xs font-semibold text-bark-700">
            <Checkbox checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            {tr("Aktif dan tersedia untuk routing", "Active and available for routing")}
          </label>
        </form>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onOpenChange={(value) => { if (!value) setDeleting(null); }}
        title={tr("Hapus kategori?", "Delete category?")}
        description={
          deleting && deleting.usage > 0
            ? tr(
                `Kategori ini dipakai ${deleting.usage} kali dan tidak dapat dihapus. Nonaktifkan saja agar tidak dipakai routing baru.`,
                `This category is used ${deleting.usage} times and cannot be deleted. Deactivate it instead so it is not used for new routing.`,
              )
            : tr("Kategori yang belum dipakai dapat dihapus permanen.", "A category that is not yet used can be permanently deleted.")
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={removing}>{tr("Batal", "Cancel")}</Button>
            <Button variant="destructive" onClick={() => void remove()} disabled={removing || Boolean(deleting && deleting.usage > 0)}>
              {removing ? <LoaderCircle className="size-4 spin" aria-hidden="true" /> : null}
              {removing ? tr("Menghapus...", "Deleting...") : tr("Hapus", "Delete")}
            </Button>
          </>
        }
      >
        {deleting ? (
          <div className={cn("rounded-md p-3 text-xs font-semibold", deleting.usage > 0 ? "bg-[#fff7de] text-[#7c5c17]" : "bg-rose-100 text-rose-700")}>
            {deleting.name[locale]} · {deleting.usage} {tr("penggunaan", "uses")}
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
