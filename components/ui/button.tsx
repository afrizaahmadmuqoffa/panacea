import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 text-sm font-bold transition-[background-color,border-color,color,transform,box-shadow] duration-150 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary: "rounded-[15px] bg-[#65936f] text-white shadow-[0_5px_0_#4e7957,0_10px_22px_rgb(84_122_96/0.18)] hover:-translate-y-px hover:bg-[#5c8766] active:translate-y-[3px] active:shadow-[0_2px_0_#4e7957] motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0",
        secondary:
          "rounded-[15px] border border-[#dce8d4] bg-white/90 text-sage-700 shadow-[0_3px_0_rgb(232_226_213/0.8)] hover:bg-sage-100 active:translate-y-[2px] active:shadow-none motion-reduce:active:translate-y-0",
        outline: "rounded-[15px] border border-sage-300 bg-white/90 text-bark-900 shadow-[0_2px_0_rgb(185_214_182/0.4)] hover:bg-sage-100",
        ghost: "rounded-md text-bark-700 hover:bg-cream-200 hover:text-bark-900",
        destructive: "rounded-[15px] bg-rose-700 text-white shadow-[0_3px_0_#7c3431] hover:bg-[#913c39] active:translate-y-[2px]",
        soft: "rounded-[15px] bg-sage-100 text-sage-700 hover:bg-sage-300/60",
        link: "rounded-md text-sage-700 underline-offset-4 hover:underline",
        cozy: "rounded-[15px] bg-[#65936f] text-white shadow-[0_5px_0_#4e7957,0_10px_22px_rgb(84_122_96/0.18)] hover:-translate-y-px hover:bg-[#5c8766] active:translate-y-[3px] active:shadow-[0_2px_0_#4e7957] motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0",
        cozySoft:
          "rounded-[15px] border border-[#dce8d4] bg-white/90 text-sage-700 shadow-[0_3px_0_rgb(232_226_213/0.8)] hover:bg-sage-100 active:translate-y-[2px] active:shadow-none motion-reduce:active:translate-y-0",
      },
      size: {
        sm: "h-11 px-3 text-xs",
        md: "h-12 px-5",
        lg: "h-14 px-7 text-base",
        icon: "size-11 p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, fullWidth, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}
