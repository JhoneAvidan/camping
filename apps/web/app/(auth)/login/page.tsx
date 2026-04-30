import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "התחברות" };

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next: nextParam } = await searchParams;
  const next = Array.isArray(nextParam) ? nextParam[0] : nextParam;
  const safeNext = next && next.startsWith("/") ? next : undefined;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">ברוכים הבאים למחנאות</CardTitle>
          <CardDescription>
            הזינו את כתובת המייל שלכם כדי לקבל קישור התחברות.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={safeNext} />
        </CardContent>
      </Card>
    </main>
  );
}
