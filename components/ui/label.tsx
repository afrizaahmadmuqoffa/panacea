import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("text-[13px] font-bold leading-snug text-bark-700", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor} className="min-w-0">
          {label}
          {required ? <span className="ml-1 text-rose-700">*</span> : null}
        </Label>
        {hint ? <span className="shrink-0 text-xs text-bark-500">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
          <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-rose-700" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
