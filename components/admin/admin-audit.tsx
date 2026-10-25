"use client";

import { FileClock, FilterX, ScrollText, Search, SearchX, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/i18n/format";
import type { AuditLog } from "@/lib/types";

export function AdminAudit({ logs }: { logs: AuditLog[] }) {
  const { locale, tr } = useI18n();
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const actions = Array.from(new Set(logs.map((log) => log.action)));

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return logs
      .filter((log) => action === "all" || log.action === action)
      .filter(
        (log) =>
          !normalized ||
          log.actor.toLowerCase().includes(normalized) ||
          log.action.toLowerCase().includes(normalized) ||
          log.target.toLowerCase().includes(normalized) ||
          log.requestId.toLowerCase().includes(normalized),
      );
  }, [query, action, logs]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || action !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Audit", "Audit")}
        title={tr("Jejak perubahan penting", "Trail of important changes")}
        description={tr(
          "Timestamp, aktor, aksi, target, dan request ID non-PII. Audit yang wajib dipertahankan tidak dihapus oleh cleanup umum.",
          "Timestamp, actor, action, target, and non-PII request ID. Audit records that must be retained are not removed by general cleanup.",
        )}
        actions={<Badge variant="sky"><ShieldCheck className="size-3.5" aria-hidden="true" />{tr("Read-only", "Read-only")}</Badge>}
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr("Cari aktor, aksi, target, atau request ID...", "Search actor, action, target, or request ID...")} className="pl-11" aria-label={tr("Cari audit", "Search audit")} />
          </div>
          <Select value={action} onChange={(event) => setAction(event.target.value)} aria-label={tr("Filter aksi", "Filter action")} className="md:w-64">
            <option value="all">{tr("Semua aksi", "All actions")}</option>
            {actions.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-bark-700">{visible.length} {tr("event", "events")}</p>
        <span className="inline-flex items-center gap-1 text-xs text-bark-500"><FileClock className="size-3.5" aria-hidden="true" />{tr("Tidak dapat diedit dari UI", "Not editable from the UI")}</span>
      </div>

      {visible.length > 0 ? (
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>{tr("Waktu", "Time")}</TH>
                <TH>{tr("Aktor", "Actor")}</TH>
                <TH>{tr("Aksi", "Action")}</TH>
                <TH>{tr("Target", "Target")}</TH>
                <TH>Request ID</TH>
              </TR>
            </THead>
            <TBody>
              {visible.map((log) => (
                <TR key={log.id}>
                  <TD className="whitespace-nowrap text-xs">{formatDate(log.createdAt, locale, true)}</TD>
                  <TD className="text-xs font-bold text-bark-900">{log.actor}</TD>
                  <TD><Badge variant="outline">{log.action}</Badge></TD>
                  <TD className="text-xs">{log.target}</TD>
                  <TD><code className="rounded bg-cream-100 px-1.5 py-0.5 font-mono text-xs text-bark-500">{log.requestId}</code></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      ) : isFiltered ? (
        <EmptyState
          icon={hasQuery ? SearchX : FilterX}
          state="filtered"
          title={tr("Tidak ada event audit", "No audit events")}
          description={tr("Ubah kata kunci atau filter aksi.", "Adjust the keyword or action filter.")}
          action={<Button variant="secondary" onClick={() => { setQuery(""); setAction("all"); }}>{tr("Hapus filter", "Clear filters")}</Button>}
        />
      ) : (
        <EmptyState
          icon={ScrollText}
          state="none"
          title={tr("Belum ada event audit", "No audit events yet")}
          description={tr("Perubahan penting pada sistem akan tercatat di sini.", "Important system changes will be recorded here.")}
        />
      )}

      <div className="rounded-lg border border-cream-200 bg-cream-100 p-4 text-xs leading-relaxed text-bark-700">
        {tr(
          "Request ID tidak memuat PII. Jangan menambahkan payload privat, prompt lengkap, atau secret ke detail audit.",
          "Request IDs contain no PII. Do not add private payloads, full prompts, or secrets to audit details.",
        )}
      </div>
    </div>
  );
}
