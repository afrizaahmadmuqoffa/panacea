import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function TableWrap({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-lg border border-border-soft bg-white shadow-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Table({ className, ...props }: ComponentProps<"table">) {
  return <table className={cn("w-full min-w-[640px] border-collapse text-left text-sm", className)} {...props} />;
}

export function THead({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("bg-cream-100 text-bark-700", className)} {...props} />;
}

export function TBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-cream-200", className)} {...props} />;
}

export function TR({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("transition hover:bg-sage-100/40", className)} {...props} />;
}

export function TH({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn("whitespace-nowrap px-4 py-3 text-xs font-extrabold uppercase tracking-[0.08em]", className)}
      {...props}
    />
  );
}

export function TD({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3.5 align-middle text-bark-700", className)} {...props} />;
}
