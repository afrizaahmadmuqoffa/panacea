"use server";

import { redirect } from "next/navigation";
import { roleHome } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import type { Locale } from "@/lib/i18n/config";

export type AuthActionState = { error: string };

const initialError = { error: "" };

export async function loginAction(
  locale: Locale,
  _previous: AuthActionState = initialError,
  formData: FormData,
): Promise<AuthActionState> {
  void _previous;
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error:
        locale === "id"
          ? "Periksa email dan password. Password minimal 8 karakter."
          : "Check your email and password. The password must be at least 8 characters.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      error:
        locale === "id"
          ? "Email atau password salah."
          : "The email or password is incorrect.",
    };
  }

  const { data: roleData } = await supabase.rpc("get_my_role");
  const role = roleData === "admin" || roleData === "reviewer" ? roleData : "user";
  redirect(roleHome(locale, role));
}

export async function registerAction(
  locale: Locale,
  _previous: AuthActionState = initialError,
  formData: FormData,
): Promise<AuthActionState> {
  void _previous;
  const env = getServerEnv();
  if (!env.ALLOW_OPEN_REGISTRATION) {
    return {
      error:
        locale === "id"
          ? "Pendaftaran mandiri sedang ditutup."
          : "Self-registration is currently closed.",
    };
  }

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    accepted: formData.get("accepted"),
  });
  if (!parsed.success) {
    return {
      error:
        locale === "id"
          ? "Periksa kembali data. Password minimal 8 karakter dan setujui syarat."
          : "Check your details. The password must be at least 8 characters and you must accept the terms.",
    };
  }
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return {
      error:
        locale === "id"
          ? "Konfirmasi password belum cocok."
          : "Password confirmation does not match.",
    };
  }

  const aliasParts = parsed.data.fullName.split(/\s+/);
  const alias = `${aliasParts[0]} ${aliasParts[1]?.[0] ?? ""}.`.trim();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        alias,
      },
    },
  });

  if (error) {
    return {
      error:
        locale === "id"
          ? "Akun tidak dapat dibuat. Email mungkin sudah dipakai."
          : "The account could not be created. The email may already be in use.",
    };
  }
  if (!data.session) {
    return {
      error:
        locale === "id"
          ? "Pendaftaran tersimpan, tetapi konfirmasi email masih aktif. Matikan konfirmasi email di Supabase Auth."
          : "The account was created, but email confirmation is still on. Turn it off in Supabase Auth.",
    };
  }

  redirect(`/${locale}/dashboard`);
}

export async function logoutAction(locale: Locale) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/masuk`);
}

export async function logoutFormAction(formData: FormData) {
  const locale: Locale = formData.get("locale") === "en" ? "en" : "id";
  await logoutAction(locale);
}
