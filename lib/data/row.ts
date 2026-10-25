import type { Localized } from "@/lib/types";

export type Row = Record<string, unknown>;

export const asRow = (value: unknown): Row =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : {};

export const asRows = (value: unknown): Row[] => (Array.isArray(value) ? value.map(asRow) : []);

export const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

export const asNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" ? value : Number.isFinite(Number(value)) ? Number(value) : fallback;

export const asBoolean = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback;

export const localized = (id: unknown, en: unknown): Localized => ({
  id: asString(id),
  en: asString(en),
});
