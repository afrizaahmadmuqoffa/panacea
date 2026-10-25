"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { logoutFormAction } from "@/lib/actions/auth";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  locale: Locale;
  iconOnly?: boolean;
  className?: string;
  buttonClassName?: string;
  variant?: "destructive" | "ghost" | "secondary";
};

function SubmitButton({
  locale,
  iconOnly,
  buttonClassName,
  variant,
}: Pick<LogoutButtonProps, "locale" | "iconOnly" | "buttonClassName" | "variant">) {
  const { pending } = useFormStatus();
  const label = locale === "id" ? "Keluar" : "Log out";
  const pendingLabel = locale === "id" ? "Mengeluarkan..." : "Signing out...";

  return (
    <Button
      type="submit"
      variant={variant ?? "destructive"}
      size={iconOnly ? "icon" : "sm"}
      disabled={pending}
      aria-label={iconOnly ? label : undefined}
      className={cn(!iconOnly && "w-full justify-start", buttonClassName)}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-4" aria-hidden="true" />
      )}
      {iconOnly ? null : pending ? pendingLabel : label}
    </Button>
  );
}

export function LogoutButton({ locale, iconOnly, className, buttonClassName, variant }: LogoutButtonProps) {
  return (
    <form action={logoutFormAction} className={className}>
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton locale={locale} iconOnly={iconOnly} buttonClassName={buttonClassName} variant={variant} />
    </form>
  );
}
