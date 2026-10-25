"use client";

import { FilterX, Gamepad2, Pencil, Plus, Search, SearchX, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { saveGameStatementAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Switch } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { Category, GameStatement } from "@/lib/types";

type StatementForm = {
  statementId: string;
  statementEn: string;
  isFact: boolean;
  explanationId: string;
  explanationEn: string;
  sourceUrl: string;
  categorySlug: string;
  isActive: boolean;
};

const emptyForm: StatementForm = {
  statementId: "",
  statementEn: "",
  isFact: true,
  explanationId: "",
  explanationEn: "",
  sourceUrl: "",
  categorySlug: "nutrisi",
  isActive: true,
};

export function AdminGameStatements({
  statements,
  categories,
}: {
  statements: GameStatement[];
  categories: Category[];
}) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const categoryLabel = (slug: string) =>
    categories.find((item) => item.slug === slug)?.name[locale] ?? slug;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<GameStatement | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StatementForm>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return statements
      .filter((item) => filter === "all" || (filter === "active" ? item.isActive : !item.isActive))
      .filter((item) => !normalized || item.statement[locale].toLowerCase().includes(normalized));
  }, [statements, query, filter, locale]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || filter !== "all";

  const activeCount = statements.filter((item) => item.isActive).length;

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm, categorySlug: categories[0]?.slug ?? "nutrisi" });
    setError("");
    setOpen(true);
  }

  function openEdit(statement: GameStatement) {
    setEditing(statement);
    setForm({
      statementId: statement.statement.id,
      statementEn: statement.statement.en,
      isFact: statement.isFact,
      explanationId: statement.explanation.id,
      explanationEn: statement.explanation.en,
      sourceUrl: statement.sourceUrl,
      categorySlug: statement.categorySlug,
      isActive: statement.isActive,
    });
    setError("");
    setOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (form.statementId.trim().length < 20) {
      setError(tr("Pernyataan Indonesia minimal 20 karakter.", "Indonesian statement must be at least 20 characters."));
      return;
    }
    if (form.statementEn.trim().length < 20) {
      setError(tr("Pernyataan Inggris minimal 20 karakter.", "English statement must be at least 20 characters."));
      return;
    }
    if (form.explanationId.trim().length < 40 || form.explanationEn.trim().length < 40) {
      setError(tr("Penjelasan minimal 40 karakter di kedua bahasa.", "Explanation must be at least 40 characters in both languages."));
      return;
    }
    if (!/^https?:\/\/\S+$/i.test(form.sourceUrl)) {
      setError(tr("Tautan sumber harus HTTP/HTTPS yang valid.", "Source link must be a valid HTTP/HTTPS URL."));
      return;
    }
    setSaving(true);
    const result = await saveGameStatementAction(locale, {
      id: editing?.id,
      statementId: form.statementId.trim(),
      statementEn: form.statementEn.trim(),
      isFact: form.isFact,
      explanationId: form.explanationId.trim(),
      explanationEn: form.explanationEn.trim(),
      sourceUrl: form.sourceUrl,
      categorySlug: form.categorySlug,
      isActive: form.isActive,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
    toast.success(editing ? tr("Soal diperbarui.", "Question updated.") : tr("Soal ditambahkan ke bank soal.", "Question added to the bank."));
  }

  async function toggle(statement: GameStatement) {
    const result = await saveGameStatementAction(locale, {
      id: statement.id,
      statementId: statement.statement.id,
      statementEn: statement.statement.en,
      isFact: statement.isFact,
      explanationId: statement.explanation.id,
      explanationEn: statement.explanation.en,
      sourceUrl: statement.sourceUrl,
      categorySlug: statement.categorySlug,
      isActive: !statement.isActive,
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
    toast.success(tr("Status soal diperbarui.", "Question status updated."));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Game", "Game")}
        title={tr("Bank soal Fakta / Hoaks", "Fact / Hoax question bank")}
        description={tr(
          "Setiap soal wajib memiliki penjelasan dan tautan sumber. Minimal 10 soal aktif diperlukan agar sesi dapat dimulai.",
          "Every question needs an explanation and source link. At least 10 active questions are required to start a session.",
        )}
        actions={
          <Button onClick={openAdd}>
            <Plus className="size-4" aria-hidden="true" />
            {tr("Tambah soal", "Add question")}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
          <div className="flex items-center gap-2 text-bark-700">
            <Gamepad2 className="size-4" aria-hidden="true" />
            <p className="text-xs font-extrabold">{tr("Soal aktif", "Active questions")}</p>
          </div>
          <p className="mt-1 font-heading text-2xl font-extrabold text-bark-900">{activeCount}</p>
          <p className="text-xs text-bark-500">{tr("Minimal 10 soal untuk memulai sesi", "At least 10 questions to start a session")}</p>
        </div>
        <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
          <p className="text-xs font-extrabold text-bark-700">{tr("Total bank soal", "Total question bank")}</p>
          <p className="mt-1 font-heading text-2xl font-extrabold text-bark-900">{statements.length}</p>
          <p className="text-xs text-bark-500">{statements.filter((item) => !item.isActive).length} {tr("nonaktif", "inactive")}</p>
        </div>
      </div>

      {activeCount < 10 ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-butter-300 bg-[#fff7de] p-4 text-xs leading-relaxed text-[#7c5c17]">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {tr("Soal aktif kurang dari 10. Sesi game tidak dapat dimulai.", "Fewer than 10 active questions. Game sessions cannot start.")}
        </div>
      ) : null}

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr("Cari pernyataan...", "Search statements...")} className="pl-11" aria-label={tr("Cari soal", "Search questions")} />
          </div>
          <Select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label={tr("Filter status", "Filter status")} className="md:w-40">
            <option value="all">{tr("Semua", "All")}</option>
            <option value="active">{tr("Aktif", "Active")}</option>
            <option value="inactive">{tr("Nonaktif", "Inactive")}</option>
          </Select>
        </div>
      </div>

      {visible.length > 0 ? (
        <>
          <div className="hidden lg:block">
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>{tr("Pernyataan", "Statement")}</TH>
                    <TH>{tr("Jawaban", "Answer")}</TH>
                    <TH>{tr("Kategori", "Category")}</TH>
                    <TH>{tr("Aktif", "Active")}</TH>
                    <TH>{tr("Aksi", "Actions")}</TH>
                  </TR>
                </THead>
                <TBody>
                  {visible.map((statement) => (
                    <TR key={statement.id}>
                      <TD className="max-w-xl"><p className="line-clamp-2 text-xs font-bold text-bark-900">{statement.statement[locale]}</p></TD>
                      <TD><Badge variant={statement.isFact ? "sage" : "rose"}>{statement.isFact ? tr("Fakta", "Fact") : tr("Hoaks", "Hoax")}</Badge></TD>
                      <TD><Badge variant="outline">{categoryLabel(statement.categorySlug)}</Badge></TD>
                      <TD><Switch checked={statement.isActive} onCheckedChange={() => toggle(statement)} label={tr("Aktifkan soal", "Activate question")} /></TD>
                      <TD><Button variant="ghost" size="icon" className="size-11" onClick={() => openEdit(statement)} aria-label={tr("Edit soal", "Edit question")}><Pencil className="size-3.5" aria-hidden="true" /></Button></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </div>
          <div className="grid gap-3 lg:hidden">
            {visible.map((statement) => (
              <article key={statement.id} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statement.isFact ? "sage" : "rose"}>{statement.isFact ? tr("Fakta", "Fact") : tr("Hoaks", "Hoax")}</Badge>
                    <Badge variant="outline">{categoryLabel(statement.categorySlug)}</Badge>
                  </div>
                  <Switch checked={statement.isActive} onCheckedChange={() => toggle(statement)} label={tr("Aktifkan soal", "Activate question")} />
                </div>
                <p className="mt-2 text-sm font-bold leading-snug text-bark-900">{statement.statement[locale]}</p>
                <p className="mt-1.5 line-clamp-2 text-xs text-bark-700">{statement.explanation[locale]}</p>
                <div className="mt-3 flex justify-between border-t border-cream-200 pt-2">
                  <a href={statement.sourceUrl} target="_blank" rel="noreferrer noopener" className="text-xs font-bold text-sage-700 hover:underline">{tr("Sumber", "Source")}</a>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(statement)}><Pencil className="size-3.5" aria-hidden="true" />{tr("Edit", "Edit")}</Button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : isFiltered ? (
        <EmptyState
          icon={hasQuery ? SearchX : FilterX}
          state="filtered"
          title={tr("Tidak ada soal", "No questions")}
          description={tr("Ubah pencarian atau filter untuk melihat soal lain.", "Change the search or filter to see other questions.")}
          action={<Button variant="secondary" onClick={() => { setQuery(""); setFilter("all"); }}>{tr("Hapus filter", "Clear filters")}</Button>}
        />
      ) : (
        <EmptyState
          icon={Gamepad2}
          state="none"
          title={tr("Belum ada soal", "No questions yet")}
          description={tr("Tambahkan soal hoaks beserta sumbernya untuk permainan.", "Add hoax statements with sources for the game.")}
          action={<Button onClick={openAdd}>{tr("Tambah soal", "Add question")}</Button>}
        />
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? tr("Edit soal", "Edit question") : tr("Tambah soal", "Add question")}
        description={tr("Soal Hoaks wajib memiliki tautan sumber/klarifikasi. Penjelasan minimal 40 karakter.", "Hoax statements require a source/clarification link. Explanation must be at least 40 characters.")}
        className="sm:max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{tr("Batal", "Cancel")}</Button>
            <Button type="submit" form="game-form" disabled={saving}>{saving ? tr("Menyimpan...", "Saving...") : editing ? tr("Simpan", "Save") : tr("Tambah", "Add")}</Button>
          </>
        }
      >
        <form id="game-form" onSubmit={save} className="space-y-4" noValidate>
          {error ? <div className="rounded-md bg-rose-100 p-3 text-xs font-semibold text-rose-700">{error}</div> : null}
          <Field label={tr("Pernyataan Indonesia", "Indonesian statement")} htmlFor="statement-id" required>
            <Textarea id="statement-id" value={form.statementId} onChange={(event) => setForm((current) => ({ ...current, statementId: event.target.value }))} className="min-h-20" />
          </Field>
          <Field label={tr("Pernyataan Inggris", "English statement")} htmlFor="statement-en" required>
            <Textarea id="statement-en" value={form.statementEn} onChange={(event) => setForm((current) => ({ ...current, statementEn: event.target.value }))} className="min-h-20" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Jawaban benar", "Correct answer")} htmlFor="statement-answer">
              <Select id="statement-answer" value={form.isFact ? "fact" : "hoax"} onChange={(event) => setForm((current) => ({ ...current, isFact: event.target.value === "fact" }))}>
                <option value="fact">{tr("Fakta", "Fact")}</option>
                <option value="hoax">{tr("Hoaks", "Hoax")}</option>
              </Select>
            </Field>
            <Field label={tr("Kategori", "Category")} htmlFor="statement-category">
              <Select id="statement-category" value={form.categorySlug} onChange={(event) => setForm((current) => ({ ...current, categorySlug: event.target.value }))}>
                {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name[locale]}</option>)}
              </Select>
            </Field>
          </div>
          <Field label={tr("Penjelasan Indonesia", "Indonesian explanation")} htmlFor="explanation-id" hint={`${form.explanationId.length} karakter`} required>
            <Textarea id="explanation-id" value={form.explanationId} onChange={(event) => setForm((current) => ({ ...current, explanationId: event.target.value }))} className="min-h-24" />
          </Field>
          <Field label={tr("Penjelasan Inggris", "English explanation")} htmlFor="explanation-en" hint={`${form.explanationEn.length} characters`} required>
            <Textarea id="explanation-en" value={form.explanationEn} onChange={(event) => setForm((current) => ({ ...current, explanationEn: event.target.value }))} className="min-h-24" />
          </Field>
          <Field label={tr("Tautan sumber", "Source link")} htmlFor="statement-source" required>
            <Input id="statement-source" type="url" value={form.sourceUrl} onChange={(event) => setForm((current) => ({ ...current, sourceUrl: event.target.value }))} placeholder="https://..." />
          </Field>
          <label className="flex items-center gap-2.5 text-xs font-semibold text-bark-700">
            <Checkbox checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            {tr("Aktif dan dapat muncul dalam sesi", "Active and eligible for sessions")}
          </label>
        </form>
      </Dialog>
    </div>
  );
}
