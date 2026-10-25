import type { EvidenceRef, Localized } from "@/lib/types";
import { localized } from "@/lib/data/row";

export const l = (id: string, en: string): Localized => localized(id, en);

export function evidence(
  id: string,
  title: string,
  publisher: string,
  year: number,
  url: string,
  snippetId: string,
  snippetEn: string,
  sourceType: EvidenceRef["sourceType"] = "europe_pmc",
  relevance: EvidenceRef["relevance"] = "high",
  identifier?: string,
): EvidenceRef {
  return {
    id,
    title,
    publisher,
    year,
    url,
    snippet: l(snippetId, snippetEn),
    sourceType,
    relevance,
    identifier,
  };
}
