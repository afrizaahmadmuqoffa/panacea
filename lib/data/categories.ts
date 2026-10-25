import { l } from "./helpers";

const names = {
  nutrisi: l("Nutrisi & Gizi", "Nutrition"),
  vaksin: l("Vaksin & Imunitas", "Vaccines & Immunity"),
  "penyakit-tidak-menular": l("Penyakit Tidak Menular", "Non-communicable Disease"),
  pengobatan: l("Pengobatan & Suplemen", "Treatment & Supplements"),
  "gaya-hidup": l("Gaya Hidup", "Lifestyle"),
  "kesehatan-mental": l("Kesehatan Mental", "Mental Health"),
  "kesehatan-anak": l("Kesehatan Anak", "Child Health"),
  kehamilan: l("Kehamilan", "Pregnancy"),
};

export function categoryName(slug: string, locale: "id" | "en") {
  return names[slug as keyof typeof names]?.[locale] ?? slug;
}
