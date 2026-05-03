
create table public.camping_data (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.camping_data enable row level security;

create policy "anyone can read camping_data"
  on public.camping_data for select
  to anon, authenticated
  using (true);

create policy "anyone can insert camping_data"
  on public.camping_data for insert
  to anon, authenticated
  with check (true);

create policy "anyone can update camping_data"
  on public.camping_data for update
  to anon, authenticated
  using (true)
  with check (true);

alter table public.camping_data replica identity full;

alter publication supabase_realtime add table public.camping_data;

insert into public.camping_data (key, value) values
  ('shared', '{}'::jsonb),
  ('personal', '{}'::jsonb)
on conflict (key) do nothing;
