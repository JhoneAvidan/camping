import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = { title: "הרשמה" };

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <SignUp />
    </main>
  );
}
