import "server-only";
import { createHash } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type EuropePmcRecord = {
  id: string;
  title: string;
  abstract: string;
  publisher: string;
  year: number;
  identifier: string;
  url: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
};

type EpmcResult = {
  id?: string;
  source?: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title?: string;
  authorString?: string;
  journalTitle?: string;
  pubYear?: string;
  abstractText?: string;
};

function clean(value: string | undefined) {
  return (value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function mapRecord(item: EpmcResult): EuropePmcRecord | null {
  const title = clean(item.title);
  if (!title) return null;
  const pmid = item.pmid?.trim();
  const pmcid = item.pmcid?.trim();
  const doi = item.doi?.trim();
  const id = item.id?.trim() || pmid || pmcid || doi;
  if (!id) return null;

  const url = pmcid
    ? `https://europepmc.org/article/PMC/${pmcid}`
    : pmid
      ? `https://europepmc.org/article/MED/${pmid}`
      : doi
        ? `https://doi.org/${doi}`
        : `https://europepmc.org/article/${item.source ?? "MED"}/${id}`;

  return {
    id: `${item.source ?? "MED"}:${id}`,
    title,
    abstract: clean(item.abstractText),
    publisher: clean(item.journalTitle) || item.source || "Europe PMC",
    year: Number(item.pubYear) || new Date().getFullYear(),
    identifier: pmid ? `PMID:${pmid}` : pmcid ? `PMCID:${pmcid}` : doi ? `DOI:${doi}` : id,
    url,
    doi,
    pmid,
    pmcid,
  };
}

export async function searchEuropePmc(query: string, limit: number): Promise<EuropePmcRecord[]> {
  const env = getServerEnv();
  const trimmed = query.trim().slice(0, 300);
  if (!trimmed) return [];

  const hash = createHash("sha256").update(trimmed).digest("hex");
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  try {
    const cached = await admin
      .schema("private")
      .from("europe_pmc_cache")
      .select("response, expires_at")
      .eq("query_hash", hash)
      .gt("expires_at", now)
      .maybeSingle();
    if (cached.data?.response) {
      return cached.data.response as EuropePmcRecord[];
    }
  } catch {
    // Cache is an optimisation, not a dependency.
  }

  const url = new URL(`${env.EUROPE_PMC_BASE_URL.replace(/\/$/, "")}/search`);
  url.searchParams.set("query", trimmed);
  url.searchParams.set("format", "json");
  url.searchParams.set("pageSize", String(Math.min(limit, env.EUROPE_PMC_PAGE_SIZE)));
  url.searchParams.set("resultType", "core");
  if (env.EUROPE_PMC_CONTACT_EMAIL) {
    url.searchParams.set("email", env.EUROPE_PMC_CONTACT_EMAIL);
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": `PANACEA/0.1 (${env.EUROPE_PMC_CONTACT_EMAIL ?? "no-contact"})`,
      accept: "application/json",
    },
    signal: AbortSignal.timeout(env.EUROPE_PMC_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Europe PMC error ${response.status}`);

  const payload = (await response.json()) as {
    resultList?: { result?: EpmcResult[] };
  };
  const records = (payload.resultList?.result ?? [])
    .map(mapRecord)
    .filter((record): record is EuropePmcRecord => Boolean(record))
    .slice(0, limit);

  try {
    await admin.schema("private").from("europe_pmc_cache").upsert(
      {
        query_hash: hash,
        query: trimmed,
        response: records,
        fetched_at: now,
        expires_at: new Date(Date.now() + env.EUROPE_PMC_CACHE_TTL_SECONDS * 1000).toISOString(),
      },
      { onConflict: "query_hash" },
    );
  } catch {
    // Ignore cache write failures.
  }

  return records;
}
