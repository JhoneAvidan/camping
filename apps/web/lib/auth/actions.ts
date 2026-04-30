"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginState = {
  status: "idle" | "sent" | "error";
  message: string;
  email?: string;
};

export async function signInWithMagicLink(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "");

  if (!EMAIL_PATTERN.test(email)) {
    return {
      status: "error",
      message: "כתובת המייל לא תקינה. בדקו ונסו שוב.",
      email,
    };
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${protocol}://${host}` : "";

  const callback = new URL("/auth/confirm", origin || "http://localhost:3000");
  if (next && next.startsWith("/")) callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callback.toString() },
  });

  if (error) {
    return {
      status: "error",
      message: "לא הצלחנו לשלוח את הקישור. נסו שוב בעוד רגע.",
      email,
    };
  }

  return {
    status: "sent",
    message: `שלחנו קישור התחברות לכתובת ${email}. בדקו את תיבת הדואר.`,
    email,
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
