-- Extensions
create extension if not exists "pgcrypto" with schema "extensions";
create extension if not exists "citext"   with schema "extensions";
create extension if not exists "postgis"  with schema "extensions";

-- Enums
do $$ begin
  create type public.platform_role as enum ('super_admin', 'user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.trip_role as enum ('owner', 'editor', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.item_kind as enum ('gear', 'food', 'task');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.claim_state as enum ('claimed', 'packed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
exception when duplicate_object then null; end $$;
