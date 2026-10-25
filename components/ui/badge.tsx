import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold leading-none",
  {
    variants: {
      variant: {
        default: "border-cream-200 bg-cream-100 text-bark-700",
        sage: "border-sage-300 bg-sage-100 text-sage-700",
        sky: "border-butter-300 bg-[#fff2ce] text-[#8a641a]",
        butter: "border-butter-300 bg-[#fff2ce] text-[#8a641a]",
        peach: "border-[#e7e2d1] bg-[#f7f5ee] text-bark-700",
        rose: "border-rose-100 bg-rose-100 text-rose-700",
        outline: "border-border-strong bg-white text-bark-700",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
