import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  CreateOrganization,
  OrganizationSwitcher,
  SignOutButton,
} from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

function deriveDisplayName(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (user.username) return user.username;
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";
  if (email) return email.split("@")[0]!;
  return "משתמש";
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) redirect("/login");

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";

  // Bootstrap the Supabase profile row for this Clerk user. Idempotent: the
  // upsert is a no-op once the row exists, so the FK from trip_members.profile_id
  // always resolves on first navigation into the authenticated app.
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        display_name: deriveDisplayName(user),
        avatar_url: user.imageUrl || null,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );

  const { orgId } = await auth();

  if (!orgId) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
            <span className="text-lg font-semibold tracking-tight">מחנאות</span>
            <div className="flex items-center gap-3 text-sm">
              <span
                className="hidden text-muted-foreground sm:inline"
                dir="ltr"
              >
                {email}
              </span>
              <SignOutButton redirectUrl="/login">
                <Button type="button" variant="ghost" size="sm">
                  התנתקות
                </Button>
              </SignOutButton>
            </div>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              צרו את הקבוצה הראשונה
            </h1>
            <p className="max-w-md text-sm text-muted-foreground">
              כל טיול שייך לקבוצה. אפשר ליצור קבוצה משפחתית, חברי טיולים או כל
              תצורה אחרת — תמיד אפשר ליצור עוד אחר כך.
            </p>
          </div>
          <CreateOrganization
            afterCreateOrganizationUrl="/trips"
            skipInvitationScreen
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/trips" className="text-lg font-semibold tracking-tight">
            מחנאות
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <OrganizationSwitcher
              afterCreateOrganizationUrl="/trips"
              afterSelectOrganizationUrl="/trips"
              hidePersonal
            />
            <span
              className="hidden text-muted-foreground sm:inline"
              dir="ltr"
            >
              {email}
            </span>
            <SignOutButton redirectUrl="/login">
              <Button type="button" variant="ghost" size="sm">
                התנתקות
              </Button>
            </SignOutButton>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
