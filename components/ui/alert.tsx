import { CircleAlert, CircleCheck, Info, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const styles = {
  info: {
    box: "border-sky-300 bg-sky-100 text-[#435e69]",
    icon: Info,
  },
  success: {
    box: "border-sage-300 bg-sage-100 text-sage-700",
    icon: CircleCheck,
  },
  warning: {
    box: "border-butter-300 bg-[#fff7de] text-[#7c5c17]",
    icon: CircleAlert,
  },
  danger: {
    box: "border-rose-100 bg-rose-100 text-rose-700",
    icon: ShieldAlert,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
  id,
}: {
  variant?: keyof typeof styles;
  title?: string;
  children?: ReactNode;
  className?: string;
  id?: string;
}) {
  const style = styles[variant];
  const Icon = style.icon;
  return (
    <div
      id={id}
      role={variant === "danger" ? "alert" : undefined}
      className={cn("flex gap-3 rounded-md border p-4 text-sm leading-relaxed", style.box, className)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className={cn(title && "mt-1")}>{children}</div> : null}
      </div>
    </div>
  );
}
