import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full min-w-0 rounded-md border border-input bg-white px-4 text-sm text-bark-900 shadow-soft outline-none transition placeholder:text-bark-500 focus:border-sage-600 focus:ring-3 focus:ring-sage-300/50 disabled:cursor-not-allowed disabled:bg-cream-100",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full resize-y rounded-md border border-input bg-white px-4 py-3 text-sm leading-relaxed text-bark-900 shadow-soft outline-none transition placeholder:text-bark-500 focus:border-sage-600 focus:ring-3 focus:ring-sage-300/50 disabled:cursor-not-allowed disabled:bg-cream-100",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-12 w-full min-w-0 appearance-none rounded-md border border-input bg-white px-4 pr-10 text-sm text-bark-900 shadow-soft outline-none transition focus:border-sage-600 focus:ring-3 focus:ring-sage-300/50 disabled:cursor-not-allowed disabled:bg-cream-100",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%23596557%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat",
        className,
      )}
      {...props}
    />
  );
}
