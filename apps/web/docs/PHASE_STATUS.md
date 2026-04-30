# Phase Status — Camping SaaS

> Living document. Update when phase boundaries shift or advisor state changes.
> Survives `/clear`. Read this first when picking up work.

## Hard constraints (from AGENTS.md)

- **Next.js 16.2.4 with breaking changes from prior versions.** Before writing
  any code that touches Next conventions, read the relevant guide in
  `node_modules/next/dist/docs/`. Heed deprecation notices.
- Known renames in Next 16: `middleware.ts` → `proxy.ts` / `proxy()`;
  Async Request APIs (`await cookies()`, `await searchParams`, `await params`).
- React 19. Use `useActionState(action, initialState)` returning
  `[state, formAction, pending]` for form flows.
- TypeScript strict, Tailwind v4 + OKLCH neutral base, shadcn/ui new-york style.
- Hebrew RTL: `lang="he"` `dir="rtl"` on `<html>`. Heebo Google font.
- Supabase **hosted** project (no Docker). All DB changes go through
  `mcp__supabase__apply_migration`.

## Supabase project

- URL: `https://kvnhrfttxebqcksnmzko.supabase.co`
- Publishable key: `sb_publishable_FcBrmWJs5ZfdqlMgrhy-6g_N3cCFqeM`
- Migrations applied (11): `create_camping_data` (legacy POC, dropped),
  `extensions_and_enums`, `core_schema`, `rls_policies`,
  `pin_trigger_search_path`, `revoke_rls_helper_execute`, `drop_camping_data`,
  `rls_initplan_rewrite`, `consolidate_permissive_policies`, `fk_indexes`,
  `profile_autoprovision_trigger`.
- Tables: `profiles`, `destinations`, `categories`, `trips`, `trip_members`,
  `items`, `item_claims`, `trip_invitations`, `audit_events`.
- Enums: `claim_state`, `invitation_status`, `item_kind`, `platform_role`,
  `trip_role` (owner | editor | viewer).
- RLS helper functions (SECURITY DEFINER, search_path pinned, EXECUTE revoked
  from anon/authenticated/PUBLIC):
  `has_trip_role(required trip_role, t_id uuid, uid uuid)`,
  `is_platform_admin(uid uuid)`,
  `is_trip_member(t_id uuid, uid uuid)`.
- Auto-provision trigger: `on_auth_user_created` AFTER INSERT on `auth.users`
  → `public.handle_new_auth_user()` upserts into `public.profiles`
  (display_name from `raw_user_meta_data->>'name'` or email local part).
  SECURITY DEFINER, search_path pinned, EXECUTE revoked.

## Phase 1 — Auth + first real screen — ✅ COMPLETE

Wired:

- `lib/supabase/env.ts` — `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` from env.
- `lib/supabase/client.ts` — browser client, `createBrowserClient<Database>`.
- `lib/supabase/server.ts` — server client, `createServerClient<Database>`,
  `try/catch` around `cookieStore.set` (Server Components can't mutate cookies;
  proxy refreshes on next request).
- `lib/supabase/proxy.ts` — session refresh + `getUser()` gating; redirects
  unauthenticated users to `/login?next=...`; redirects authed users away from
  `/login`/`/signup`/`/auth`. `setAll(cookies, headers)` propagates the headers
  arg back onto the response (CDN cookie poisoning prevention).
- `lib/supabase/database.types.ts` — generated from hosted schema, threaded
  via `<Database>` generic into all three client factories.
- `lib/auth/actions.ts` — server actions:
  - `signInWithMagicLink(prevState, formData)`: validates email regex, derives
    origin from `headers()` (`x-forwarded-host`/`x-forwarded-proto` → `host` →
    `http://localhost:3000`), preserves `next` if it `startsWith("/")`,
    returns `LoginState` `{ status: "idle" | "sent" | "error"; message: string;
    email?: string }` with Hebrew messages.
  - `signOut()`.
- `components/auth/login-form.tsx` — client `useActionState` form,
  replaces with success message after send, hidden `next` input, ARIA wired.
- `app/(auth)/login/page.tsx` — server component awaiting
  `searchParams: Promise<{ next?: string | string[] }>`, normalizes array,
  guards `next.startsWith("/")` against open-redirect.
- `app/auth/confirm/route.ts` — GET handler, reads `token_hash`/`type`/`next`
  from `request.nextUrl.searchParams`, imports `EmailOtpType` from
  `@supabase/supabase-js`. Redirects to `/login?error=invalid_link` or
  `/login?error=expired_link` on failure.
- `app/(app)/layout.tsx` — protected shell, defense-in-depth `getUser()`
  re-check, header with email span (`dir="ltr"`), sign-out form.
- `app/(app)/trips/page.tsx` — Hebrew "הטיולים שלי" stub, empty Card,
  disabled "טיול חדש (בקרוב)".

Build: `npm run build` exit 0 under Next 16 / Turbopack.

## DB hardening — ✅ COMPLETE

6 migrations applied via `mcp__supabase__apply_migration` (subagent pass):
`pin_trigger_search_path`, `revoke_rls_helper_execute`, `drop_camping_data`,
`rls_initplan_rewrite`, `consolidate_permissive_policies`, `fk_indexes`.

Advisor delta:
- **Security: 9 → 0** (function_search_path_mutable, rls_policy_always_true ×2,
  anon_security_definer_function_executable ×3,
  authenticated_security_definer_function_executable ×3 all cleared).
- **Performance: 34 actionable → 0** (16 auth_rls_initplan, 13
  multiple_permissive_policies, 5 unindexed_foreign_keys cleared).
- Remaining 16 `unused_index` INFO notices retained intentionally —
  re-evaluate after real query patterns emerge in Phase 2+.

Function arity correction discovered during the pass (verified via `pg_proc`):
`has_trip_role(uuid, uuid, trip_role)` — explicit user_id arg first,
`is_platform_admin(uuid)`, `is_trip_member(uuid, uuid)`. RLS policies pass
`auth.uid()` in. Update mental model accordingly.

Notable policy semantics decisions:
- `item_claims` SELECT widened so all trip members can read claims (not just
  claimer + admins).
- `profiles_update_self` USING widened to `(select auth.uid()) = id` (was
  more restrictive).
- `items_write_editor` split into per-action policies; `created_by` pin
  preserved on UPDATE.

### Original findings (kept for reference)

### Security

- WARN: `public.tg_set_updated_at` has mutable `search_path`. Pin via
  `ALTER FUNCTION ... SET search_path = public, pg_temp`.
- WARN: `has_trip_role`, `is_platform_admin`, `is_trip_member` are
  SECURITY DEFINER and executable by `anon` + `authenticated` via
  PostgREST RPC. They are RLS helpers, not RPCs.
  `REVOKE EXECUTE ON FUNCTION ... FROM anon, authenticated, public;`
  (Inside RLS policies the function runs with the policy's evaluation
  context regardless of EXECUTE grants, so revoke is safe.)
- `camping_data` legacy POC table has policies `WITH CHECK (true)` /
  `USING (true)` for INSERT/UPDATE — RLS effectively bypassed.
  Drop the table (4 rows of POC data, not in scope for the SaaS schema).

### Performance

- `auth_rls_initplan` on ~16 RLS policies across `profiles`, `destinations`,
  `categories`, `trips`, `trip_members`, `items`, `item_claims`,
  `trip_invitations`, `audit_events`. Wrap each `auth.uid()` /
  `auth.role()` / `is_platform_admin()` / `has_trip_role(...)` /
  `is_trip_member(...)` call as `(select ...)` so Postgres caches the
  result per statement instead of per row.
- `multiple_permissive_policies` on `categories`, `destinations`,
  `item_claims`, `items`, `profiles`, `trip_members` for various
  `authenticated` actions — consolidate overlapping permissive policies
  into one per (table, role, action).
- `unindexed_foreign_keys`: add btree indexes on
  - `categories.trip_id` (constraint `categories_trip_fk`)
  - `items.created_by` (constraint `items_created_by_fkey`)
  - `trip_invitations.accepted_by`
  - `trip_invitations.invited_by`
  - `trips.destination_id`
- `unused_index` notices on several indexes — **do not drop yet**, wait
  for real query patterns to emerge in Phase 2+.

### Approach

One subagent does the whole pass as a sequence of `apply_migration` calls,
re-runs both advisors, reports back a tight summary. Migration names should
be snake_case and chronological:
`20260430_pin_trigger_search_path`, `20260430_revoke_rls_helper_execute`,
`20260430_drop_camping_data`, `20260430_rls_initplan_rewrite`,
`20260430_consolidate_permissive_policies`, `20260430_fk_indexes`.
(Exact timestamps determined by the migration tool.)

## Phase 2 — Real trips CRUD — ✅ COMPLETE

Wired:

- **#54 Profile auto-provision.** Migration `profile_autoprovision_trigger`:
  AFTER INSERT trigger on `auth.users` → `public.handle_new_auth_user()`.
  SECURITY DEFINER, `SET search_path = public, pg_temp`,
  `REVOKE EXECUTE ... FROM anon, authenticated, PUBLIC`. Backfilled all
  existing `auth.users` rows. Verified via `pg_trigger`. Database types
  regenerated into `lib/supabase/database.types.ts` (legacy `camping_data`
  table now absent).
- **#55 `/trips` real list.** `app/(app)/trips/page.tsx` — Server Component,
  `.is("archived_at", null).order("starts_on", { ascending: true,
  nullsFirst: false }).order("created_at", { ascending: false })`. RLS
  (`is_trip_member`) does the membership filter. Empty state, error state,
  responsive grid of cards linking to `/trips/[id]`, "טיול חדש" CTA via
  `Button asChild` + `Link`. `Intl.DateTimeFormat("he-IL")` for date ranges.
- **#56 `/trips/new` create flow.**
  - `lib/trips/actions.ts` — `"use server"`. `createTrip(_prevState, formData)`
    returns `CreateTripState { status, message, fieldErrors?, values? }`.
    Validates name (1–120), notes (≤4000), ISO date format, `ends_on >=
    starts_on`. Inserts `trips` then `trip_members { role: "owner" }`.
    `revalidatePath('/trips')` then `redirect('/trips/${id}')`. Friendly
    fallback if member-insert fails (RLS makes the orphan trip invisible).
  - `components/trips/new-trip-form.tsx` — `"use client"`, `useActionState`,
    Hebrew labels, `dir="ltr"` on date inputs, ARIA invalid + describedby
    wired to `fieldErrors`, retains `values` on error. Submit + Cancel.
  - `app/(app)/trips/new/page.tsx` — Server component shell with metadata
    title "טיול חדש", wraps form in Card.
  - `components/ui/textarea.tsx` — added shadcn-style `forwardRef` Textarea
    (was missing).
- **#57 `/trips/[id]` detail.** `app/(app)/trips/[id]/page.tsx` —
  `params: Promise<{ id: string }>`, `await params` in both default export
  and `generateMetadata`. Single PostgREST query joining `trips +
  trip_members + profiles`. `notFound()` if no user, no trip (RLS), or user
  not in members. Header with role badge (`{ owner: "בעלים", editor:
  "עורך", viewer: "צופה" }`), notes card (conditional), members card,
  Phase 3 stub cards (gear/categories) with disabled CTAs.
- **#58 Build verify + advisors clean.** `npm run build` exit 0 under Next
  16.2.4 / Turbopack: 7 routes (`/`, `/_not-found`, `/auth/confirm`,
  `/login`, `/trips`, `/trips/[id]`, `/trips/new`). TypeScript clean.
  Advisors: security 0, performance 16 unused_index INFO (intentionally
  retained — see DB hardening section).

## Phase 3 — Items, categories, claims — pending

Goal: turn the trip detail page into a real planning surface. Members can
add gear, organize it into per-trip categories, and claim items.

### Sub-tasks (sketch — refine before starting)

1. **Per-trip categories.** `categories` table is keyed by `trip_id`. CRUD
   from `/trips/[id]` for editors/owners. Default seed (e.g. אוכל, שינה,
   בישול) on trip creation? Decide in Phase 3 brief.
2. **Items CRUD.** `items` table: `name`, `kind` (item_kind enum),
   `quantity`, `category_id`, `notes`. Inline list on `/trips/[id]`,
   grouped by category. Editors can write; viewers read-only.
3. **Claims.** `item_claims` table: a member commits to bringing an item.
   `claim_state` enum (`pending` / `confirmed` / `released`). One active
   claim per item; UI shows who claimed what.
4. **Optimistic updates.** Use `useOptimistic` for claim toggle and item
   add — the latency-sensitive interactions.
5. **Audit events.** Write to `audit_events` on item creation, claim
   change, role change. Surface in a per-trip activity feed (later).

### Open questions for Phase 3 brief

- Do categories carry across trips (templates) or are they trip-local only?
- Item kind enum semantics (consumable vs durable vs personal) — confirm
  what each means in the UX before building filters.
- Should viewers be able to claim, or claim-write requires editor+?

## Tasks (TaskList)

- #41–#45 ✅ Phase 1
- #46–#52 ✅ DB hardening
- #53–#58 ✅ Phase 2

## Standing directive

User said: "do what's needed and continue, don't wait for approval".
Run through DB hardening then Phase 2 continuously. Notify only when done
or blocked.
