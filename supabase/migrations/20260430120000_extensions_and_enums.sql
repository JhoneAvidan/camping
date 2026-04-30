-- ============================================================================
-- 0001 — Extensions and enums
-- ============================================================================
-- Enables required PostgreSQL extensions and defines the enum types used
-- across the schema. Runs first because every subsequent migration depends
-- on these types existing.
-- ============================================================================

create extension if not exists "pgcrypto" with schema "extensions";
create extension if not exists "citext"   with schema "extensions";
create extension if not exists "postgis"  with schema "extensions";

-- Platform-level role: distinguishes super-admins (operator/staff) from
-- regular end users. Per-trip authority is modeled separately via trip_role.
do $$ begin
  create type public.platform_role as enum ('super_admin', 'user');
exception when duplicate_object then null; end $$;

-- Per-trip role on trip_members. Owner can manage members and delete the
-- trip; editor can mutate items and metadata; viewer is read-only.
do $$ begin
  create type public.trip_role as enum ('owner', 'editor', 'viewer');
exception when duplicate_object then null; end $$;

-- Item categorization. 'gear' = physical equipment; 'food' = consumables;
-- 'task' = todo/chore (cooking shifts, campsite teardown, etc.).
do $$ begin
  create type public.item_kind as enum ('gear', 'food', 'task');
exception when duplicate_object then null; end $$;

-- Claim lifecycle on item_claims. 'unclaimed' is the implicit default;
-- a row only exists for claimed/packed states.
do $$ begin
  create type public.claim_state as enum ('claimed', 'packed');
exception when duplicate_object then null; end $$;

-- Invitation status for trip_invitations.
do $$ begin
  create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
exception when duplicate_object then null; end $$;
