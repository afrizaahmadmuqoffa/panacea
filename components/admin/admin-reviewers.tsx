"use client";

import { Pencil, Plus, Search, SearchX, ShieldCheck, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { saveReviewerAction } from "@/lib/actions/admin";
import { Avatar } from "@/components/ui/avatar";
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
import { categoryName } from "@/lib/data/categories";
import { formatDate } from "@/lib/i18n/format";
import type { Category, ReviewerProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

type EditorState = { mode: "add" } | { mode: "edit"; reviewer: ReviewerProfile };

export function AdminReviewers({
  reviewers,
  categories,
}: {
  reviewers: ReviewerProfile[];
  categories: Category[];
}) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", categories: [] as string[], isAvailable: true });
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return reviewers.filter(
      (reviewer) =>
        !normalized ||
        reviewer.fullName.toLowerCase().includes(normalized) ||
        reviewer.email.toLowerCase().includes(normalized),
    );
  }, [reviewers, query]);

  const hasQuery = query.trim().length > 0;
  const { page, setPage, pageCount, start, end } = usePagination(visible.length);
  const pageSlice = visible.slice(start, end);

  function openAdd() {
    setForm({ name: "", email: "", password: "", categories: [], isAvailable: true });
    setError("");
    setEditor({ mode: "add" });
  }

  function openEdit(reviewer: ReviewerProfile) {
    setForm({ name: reviewer.fullName, email: reviewer.email, password: "", categories: reviewer.categorySlugs, isAvailable: reviewer.isAvailable });
    setError("");
    setEditor({ mode: "edit", reviewer });
  }

  function handleSessionError(result: { error?: string; code?: string | null }) {
    if (result.error && result.code === "session_missing") {
      router.push(`/${locale}/masuk`);
      router.refresh();
      return true;
    }
    return false;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (form.name.trim().length < 3) {
      setError(tr("Nama lengkap minimal 3 karakter.", "Full name must be at least 3 characters."));
      return;
    }
    if (!form.email.includes("@")) {
      setError(tr("Masukkan email yang valid.", "Enter a valid email."));
      return;
    }
    if (editor?.mode === "add" && form.password.length < 8) {
      setError(tr("Password minimal 8 karakter.", "Password must be at least 8 characters."));
      return;
    }
    if (form.categories.length === 0) {
      setError(tr("Pilih setidaknya satu kategori keahlian.", "Select at least one expertise category."));
      return;
    }
    const result = await saveReviewerAction(locale, {
      reviewerId: editor?.mode === "edit" ? editor.reviewer.id : undefined,
      fullName: form.name.trim(),
      email: form.email.trim(),
      password: form.password || undefined,
      categorySlugs: form.categories,
      isAvailable: form.isAvailable,
    });
    if (handleSessionError(result)) return;
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(
      editor?.mode === "edit"
        ? tr("Reviewer diperbarui.", "Reviewer updated.")
        : tr("Akun reviewer dibuat dengan password yang ditetapkan admin.", "Reviewer account created with the admin-set password."),
    );
    setEditor(null);
    router.refresh();
  }

  async function toggleAvailability(reviewer: ReviewerProfile) {
    const result = await saveReviewerAction(locale, {
      reviewerId: reviewer.id,
      fullName: reviewer.fullName,
      email: reviewer.email,
      categorySlugs: reviewer.categorySlugs,
      isAvailable: !reviewer.isAvailable,
    });
    if (handleSessionError(result)) return;
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      reviewer.isAvailable
        ? tr("Reviewer ditandai tidak tersedia. Assignment baru dihentikan.", "Reviewer marked unavailable. New assignments are paused.")
        : tr("Reviewer kembali tersedia untuk assignment.", "Reviewer is available for assignments again."),
    );
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Reviewer", "Reviewers")}
        title={tr("Pakar mitra dan keahliannya", "Partner experts and their expertise")}
        description={tr(
          "Reviewer dibuat manual oleh admin. Routing mengirim kasus ke semua reviewer aktif yang cocok dengan kategori keahlian.",
          "Reviewers are created manually by admins. Routing sends cases to every active reviewer matching the expertise categories.",
        )}
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" aria-hidden="true" />
            {tr("Tambah reviewer", "Add reviewer")}
          </Button>
        }
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={tr("Cari nama atau email reviewer...", "Search reviewer name or email...")} className="pl-11" aria-label={tr("Cari reviewer", "Search reviewers")} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-bark-700">{visible.length} {tr("reviewer", "reviewers")}</p>
        <Badge variant="sage">
          <Stethoscope className="size-3.5" aria-hidden="true" />
          {reviewers.filter((reviewer) => reviewer.isAvailable).length} {tr("tersedia", "available")}
        </Badge>
      </div>

      {visible.length > 0 ? (
        <>
          <div className="hidden lg:block">
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>{tr("Reviewer", "Reviewer")}</TH>
                    <TH>{tr("Keahlian", "Expertise")}</TH>
                    <TH>{tr("Tugas", "Tasks")}</TH>
                    <TH>{tr("Ketersediaan", "Availability")}</TH>
                    <TH>{tr("Bergabung", "Joined")}</TH>
                    <TH>{tr("Aksi", "Actions")}</TH>
                  </TR>
                </THead>
                <TBody>
                  {pageSlice.map((reviewer) => (
                    <TR key={reviewer.id}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={reviewer.fullName} size="sm" />
                          <div>
                            <p className="text-xs font-extrabold text-bark-900">{reviewer.fullName}</p>
                            <p className="text-xs text-bark-500">{reviewer.email}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {reviewer.categorySlugs.map((slug) => (
                            <Badge key={slug} variant="outline" className="px-2 py-0.5 text-xs">{categoryName(slug, locale)}</Badge>
                          ))}
                        </div>
                      </TD>
                      <TD className="whitespace-nowrap text-xs">
                        <span className="font-bold text-bark-900">{reviewer.activeTasks}</span> {tr("aktif", "active")}
                        <span className="text-bark-500"> · {reviewer.completedTasks} {tr("selesai", "done")}</span>
                      </TD>
                      <TD><Switch checked={reviewer.isAvailable} onCheckedChange={() => toggleAvailability(reviewer)} label={tr("Ketersediaan reviewer", "Reviewer availability")} /></TD>
                      <TD className="whitespace-nowrap text-xs">{formatDate(reviewer.joinedAt, locale)}</TD>
                      <TD>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="size-11" onClick={() => openEdit(reviewer)} aria-label={tr("Ubah reviewer", "Edit reviewer")}><Pencil className="size-3.5" aria-hidden="true" /></Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </div>

          <div className="grid gap-3 lg:hidden">
            {pageSlice.map((reviewer) => (
              <article key={reviewer.id} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
                <div className="flex items-start gap-3">
                  <Avatar name={reviewer.fullName} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-bark-900">{reviewer.fullName}</p>
                    <p className="truncate text-xs text-bark-500">{reviewer.email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {reviewer.categorySlugs.map((slug) => (
                        <Badge key={slug} variant="outline" className="px-2 py-0.5 text-xs">{categoryName(slug, locale)}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-bark-500">{tr("Tersedia", "Available")}</span>
                    <Switch checked={reviewer.isAvailable} onCheckedChange={() => toggleAvailability(reviewer)} label={tr("Ketersediaan reviewer", "Reviewer availability")} />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(reviewer)}><Pencil className="size-3.5" aria-hidden="true" />{tr("Edit", "Edit")}</Button>
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
          title={tr("Tidak ada reviewer yang cocok", "No matching reviewers")}
          description={tr("Ubah kata kunci pencarian.", "Change the search keyword.")}
          action={<Button variant="secondary" onClick={() => { setQuery(""); setPage(1); }}>{tr("Hapus filter", "Clear filters")}</Button>}
        />
      ) : (
        <EmptyState
          icon={ShieldCheck}
          state="none"
          title={tr("Belum ada reviewer", "No reviewers yet")}
          description={tr("Tambahkan reviewer agar klaim bisa ditinjau.", "Add a reviewer so claims can be reviewed.")}
          action={<Button onClick={openAdd}>{tr("Tambah reviewer", "Add reviewer")}</Button>}
        />
      )}

      <div className="flex gap-2.5 rounded-lg border border-butter-300 bg-[#fff7de] p-4 text-xs leading-relaxed text-bark-700">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          {tr(
            "Admin membuat akun reviewer dengan password awal. Minta reviewer mengganti password setelah masuk pertama kali.",
            "Admins create reviewer accounts with an initial password. Ask the reviewer to change it after their first sign-in.",
          )}
        </p>
      </div>

      <Dialog
        open={editor !== null}
        onOpenChange={(open) => { if (!open) setEditor(null); }}
        title={editor?.mode === "edit" ? tr("Ubah reviewer", "Edit reviewer") : tr("Tambah reviewer", "Add reviewer")}
        description={
          editor?.mode === "edit"
            ? tr("Perbarui nama, email, dan kategori keahlian. Perubahan routing berlaku untuk assignment baru.", "Update the name, email, and expertise categories. Routing changes apply to new assignments.")
            : tr("Buat akun reviewer dengan email dan password awal. Sampaikan password secara aman.", "Create the reviewer account with an email and initial password. Share the password securely.")
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditor(null)}>{tr("Batal", "Cancel")}</Button>
            <Button type="submit" form="reviewer-form">{editor?.mode === "edit" ? tr("Simpan", "Save") : tr("Buat akun", "Create account")}</Button>
          </>
        }
      >
        <form id="reviewer-form" onSubmit={save} className="space-y-4" noValidate>
          {error ? <div className="rounded-md bg-rose-100 p-3 text-xs font-semibold text-rose-700">{error}</div> : null}
          <Field label={tr("Nama lengkap", "Full name")} htmlFor="reviewer-name" required>
            <Input id="reviewer-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </Field>
          <Field label={tr("Email", "Email")} htmlFor="reviewer-email" required>
            <Input id="reviewer-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </Field>
          {editor?.mode === "add" ? (
            <Field label={tr("Password awal", "Initial password")} htmlFor="reviewer-password" required>
              <Input id="reviewer-password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} minLength={8} />
            </Field>
          ) : null}
          <div>
            <p className="text-[13px] font-bold text-bark-700">{tr("Kategori keahlian", "Expertise categories")} <span className="text-rose-700">*</span></p>
            <div className="mt-2 grid max-h-56 gap-1.5 overflow-y-auto rounded-md border border-border-soft bg-cream-50 p-2 sm:grid-cols-2">
              {categories.map((category) => {
                const checked = form.categories.includes(category.slug);
                return (
                  <label key={category.slug} className={cn("flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-2 text-xs font-semibold transition", checked ? "bg-sage-100 text-sage-700" : "text-bark-700 hover:bg-white")}>
                    <Checkbox
                      checked={checked}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          categories: event.target.checked
                            ? [...current.categories, category.slug]
                            : current.categories.filter((slug) => slug !== category.slug),
                        }))
                      }
                    />
                    {category.name[locale]}
                  </label>
                );
              })}
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
