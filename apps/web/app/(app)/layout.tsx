import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/trips" className="text-lg font-semibold tracking-tight">
            מחנאות
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span
              className="hidden text-muted-foreground sm:inline"
              dir="ltr"
            >
              {user.email}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                התנתקות
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
