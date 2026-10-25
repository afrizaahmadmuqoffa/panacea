import { cn } from "@/lib/utils";

export function Progress({
  value,
  max = 100,
  className,
  barClassName,
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  label?: string;
}) {
  const percent = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-cream-200", className)}
    >
      <div
        className={cn("h-full rounded-full bg-sage-700 transition-[width] duration-500", barClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
