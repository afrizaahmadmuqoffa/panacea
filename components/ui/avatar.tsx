import { cn, initials } from "@/lib/utils";

const palettes = [
  "bg-sage-100 text-sage-700",
  "bg-[#fff2ce] text-[#8a641a]",
  "bg-[#f4f6e8] text-sage-700",
  "bg-[#fff7de] text-[#8a641a]",
  "bg-sage-100 text-sage-700",
];

const warmPalettes = [
  "bg-sage-100 text-sage-700",
  "bg-[#fff2ce] text-[#8a641a]",
  "bg-cream-200 text-bark-700",
];

export function Avatar({
  name,
  size = "md",
  className,
  tone = "default",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  tone?: "default" | "warm";
}) {
  const set = tone === "warm" ? warmPalettes : palettes;
  const index = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % set.length;
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full border border-white font-heading font-extrabold shadow-soft",
        size === "sm" && "size-8 text-xs",
        size === "md" && "size-10 text-xs",
        size === "lg" && "size-14 text-base",
        set[index],
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
