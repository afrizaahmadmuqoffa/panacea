"use client";

import { ArrowUpRight, Eye, EyeOff, LoaderCircle, Mail, Lock } from "lucide-react";
import { useActionState, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { loginAction } from "@/lib/actions/auth";

const labelClass = "text-[11px] font-extrabold text-[#506451] mb-[7px]";
const inputWrapClass =
  "flex h-[47px] items-center gap-[9px] rounded-[13px] border border-[#e5e7d9] bg-[#fffef9] px-3 mb-[3px] transition-[border-color,box-shadow,transform] duration-200 ease-[ease] focus-within:-translate-y-px focus-within:border-[#91b995] focus-within:shadow-[0_0_0_4px_#a9c9a82e]";
const fieldIconClass = "w-[18px] flex-none text-center text-[16px] text-[#9bb79a]";
const inputClass =
  "w-full min-w-0 border-0 bg-transparent p-0 font-sans text-[12px] leading-[24px] text-[#3e5142] outline-none placeholder:text-[#b1b7a8]";

export function LoginForm() {
  const { locale, tr } = useI18n();
  const [state, formAction, pending] = useActionState(loginAction.bind(null, locale), { error: "" });
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="flex flex-col" noValidate aria-busy={pending}>
      {state.error ? (
        <p className="mt-[3px] mb-2 min-h-[14px] text-[10px] leading-[1.4] text-[#b95f51]" id="login-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <label className={labelClass} htmlFor="email">
        {tr("Email", "Email")}
      </label>
      <div className={inputWrapClass}>
        <span className={fieldIconClass} aria-hidden="true">
          <Mail size={16} />
        </span>
        <input
          className={inputClass}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          required
          disabled={pending}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>

      <label className={labelClass} htmlFor="password">
        {tr("Password", "Password")}
      </label>
      <div className={inputWrapClass}>
        <span className={fieldIconClass} aria-hidden="true">
          <Lock size={16} />
        </span>
        <input
          className={inputClass}
          id="password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          required
          minLength={8}
          disabled={pending}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
        />
        <button
          type="button"
          className="rounded-[8px] border-0 bg-transparent p-1.5 text-[15px] text-[#90a08e] transition-[background,color] duration-200 hover:bg-[#edf2e6] hover:text-[#52795a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          onClick={() => setShow((value) => !value)}
          disabled={pending}
          aria-label={show ? tr("Sembunyikan password", "Hide password") : tr("Tampilkan password", "Show password")}
        >
          {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>

      <button
        type="submit"
        className="group mt-[9px] flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border-0 bg-[#668f6d] px-4 py-[7px] font-sans text-[12px] font-extrabold text-[#fffdf5] shadow-[0_4px_0_#4e7656,0_9px_18px_#648c6a24] transition-[transform,box-shadow,background] duration-[220ms] ease-[cubic-bezier(.2,.75,.25,1)] hover:-translate-y-0.5 hover:bg-[#5c8664] hover:shadow-[0_6px_0_#4e7656,0_13px_22px_#648c6a30] active:translate-y-0.5 active:shadow-[0_1px_0_#4e7656] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-[#668f6d] disabled:hover:shadow-[0_4px_0_#4e7656,0_9px_18px_#648c6a24] disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_#4e7656,0_9px_18px_#648c6a24]"
        disabled={pending}
      >
        <span>{pending ? tr("Memeriksa sesi...", "Checking session...") : tr("Masuk", "Sign in")}</span>
        {pending ? (
          <LoaderCircle size={16} className="spin" aria-hidden="true" />
        ) : (
          <ArrowUpRight size={16} aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
