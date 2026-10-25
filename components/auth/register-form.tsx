"use client";

import { ArrowUpRight, Eye, EyeOff, LoaderCircle, Mail, Lock, User, Check } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { registerAction } from "@/lib/actions/auth";
import { PasswordStrengthMeter } from "./password-strength";

const labelClass = "mt-[3px] text-[11px] font-extrabold text-[#506451] mb-[7px]";
const inputWrapClass =
  "flex h-[42px] items-center gap-[9px] rounded-[13px] border border-[#e5e7d9] bg-[#fffef9] px-3 mb-[3px] transition-[border-color,box-shadow,transform] duration-200 ease-[ease] focus-within:-translate-y-px focus-within:border-[#91b995] focus-within:shadow-[0_0_0_4px_#a9c9a82e]";
const fieldIconClass = "w-[18px] flex-none text-center text-[16px] text-[#9bb79a]";
const inputClass =
  "w-full min-w-0 border-0 bg-transparent p-0 font-sans text-[12px] leading-[24px] text-[#3e5142] outline-none placeholder:text-[#b1b7a8]";
const toggleClass =
  "rounded-[8px] border-0 bg-transparent p-1.5 text-[15px] text-[#90a08e] transition-[background,color] duration-200 hover:bg-[#edf2e6] hover:text-[#52795a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

export function RegisterForm() {
  const { locale, tr } = useI18n();
  const [state, formAction, pending] = useActionState(registerAction.bind(null, locale), { error: "" });
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);

  return (
    <form action={formAction} className="flex flex-col" noValidate aria-busy={pending}>
      {state.error ? (
        <p className="mt-[3px] mb-[4px] min-h-[14px] text-[10px] leading-[1.4] text-[#b95f51]" id="register-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <label className={labelClass} htmlFor="full-name">
        {tr("Nama lengkap", "Full name")}
      </label>
      <div className={inputWrapClass}>
        <span className={fieldIconClass} aria-hidden="true">
          <User size={16} />
        </span>
        <input
          className={inputClass}
          id="full-name"
          name="fullName"
          autoComplete="name"
          placeholder={tr("Contoh: Siti Nurhaliza", "Example: Siti Nurhaliza")}
          required
          minLength={3}
          disabled={pending}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "register-error" : undefined}
        />
      </div>

      <label className={labelClass} htmlFor="register-email">
        {tr("Email", "Email")}
      </label>
      <div className={inputWrapClass}>
        <span className={fieldIconClass} aria-hidden="true">
          <Mail size={16} />
        </span>
        <input
          className={inputClass}
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          required
          disabled={pending}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "register-error" : undefined}
        />
      </div>

      <div className="mt-[13px] flex items-center justify-between">
        <label className="text-[11px] font-extrabold text-[#506451] mb-[7px]" htmlFor="register-password">
          {tr("Password", "Password")}
        </label>
        <span className="m-0 mb-[5px] text-[9px] leading-[1.5] text-[#9ba493]">
          {tr("Minimal 8 karakter", "At least 8 characters")}
        </span>
      </div>
      <div className={inputWrapClass}>
        <span className={fieldIconClass} aria-hidden="true">
          <Lock size={16} />
        </span>
        <input
          className={inputClass}
          id="register-password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={pending}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "register-error" : undefined}
        />
        <button
          type="button"
          className={toggleClass}
          onClick={() => setShow((value) => !value)}
          disabled={pending}
          aria-label={show ? tr("Sembunyikan password", "Hide password") : tr("Tampilkan password", "Show password")}
        >
          {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
      <PasswordStrengthMeter value={password} />

      <label className={labelClass} htmlFor="register-confirm">
        {tr("Konfirmasi password", "Confirm password")}
      </label>
      <div className={inputWrapClass}>
        <span className={fieldIconClass} aria-hidden="true">
          <Lock size={16} />
        </span>
        <input
          className={inputClass}
          id="register-confirm"
          name="confirmPassword"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          required
          minLength={8}
          disabled={pending}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "register-error" : undefined}
        />
      </div>

      <label className="relative mt-[9px] mb-[5px] flex cursor-pointer items-start gap-2.5 text-[10px] leading-[1.6] text-[#879181]" htmlFor="accepted">
        <input
          className="peer absolute left-0 top-px size-[18px] opacity-0"
          id="accepted"
          type="checkbox"
          name="accepted"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          required
          disabled={pending}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "register-error" : undefined}
        />
        <span
          className="grid size-[17px] flex-none place-items-center rounded-[5px] border border-[#d8dfcf] bg-[#fffef9] text-[11px] text-transparent transition-[background,border-color,color] duration-200 peer-checked:border-[#719a76] peer-checked:bg-[#719a76] peer-checked:text-white peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#a9c9a86b]"
          aria-hidden="true"
        >
          <Check size={14} />
        </span>
        <span>
          {tr("Saya menyetujui ", "I agree to the ")}
          <Link className="font-bold text-[#5c8564] underline decoration-[#c3d5b9] underline-offset-2" href={`/${locale}/kebijakan-privasi`}>
            {tr("Kebijakan Privasi", "Privacy Policy")}
          </Link>
          {tr(" dan ", " and ")}
          <Link className="font-bold text-[#5c8564] underline decoration-[#c3d5b9] underline-offset-2" href={`/${locale}/syarat-ketentuan`}>
            {tr("Syarat & Ketentuan", "Terms & Conditions")}
          </Link>
          .
        </span>
      </label>

      <button
        type="submit"
        className="group mt-[9px] flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border-0 bg-[#668f6d] px-4 py-[7px] font-sans text-[12px] font-extrabold text-[#fffdf5] shadow-[0_4px_0_#4e7656,0_9px_18px_#648c6a24] transition-[transform,box-shadow,background] duration-[220ms] ease-[cubic-bezier(.2,.75,.25,1)] hover:-translate-y-0.5 hover:bg-[#5c8664] hover:shadow-[0_6px_0_#4e7656,0_13px_22px_#648c6a30] active:translate-y-0.5 active:shadow-[0_1px_0_#4e7656] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-[#668f6d] disabled:hover:shadow-[0_4px_0_#4e7656,0_9px_18px_#648c6a24] disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_#4e7656,0_9px_18px_#648c6a24]"
        disabled={pending || !accepted}
      >
        <span>{pending ? tr("Membuat akun...", "Creating account...") : tr("Daftar", "Join")}</span>
        {pending ? (
          <LoaderCircle size={16} className="spin" aria-hidden="true" />
        ) : (
          <ArrowUpRight size={16} aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
