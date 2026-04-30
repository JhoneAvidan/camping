-- =============================================================================
-- POC seed — apply against Supabase project gmcfftvkzqqquudvjaqv ONLY.
-- Paste the whole file into Dashboard → SQL Editor and run.
--
-- Idempotent: running again replaces the 'shared' and 'personal' rows.
-- Does NOT touch 'login_log' or 'activity_log'.
-- =============================================================================

-- 1. Schema --------------------------------------------------------------------

create table if not exists public.camping_data (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.camping_data enable row level security;

-- POC has no auth — index.html uses the publishable (anon) key directly.
drop policy if exists camping_data_anon_all on public.camping_data;
create policy camping_data_anon_all
  on public.camping_data
  for all
  to anon
  using (true)
  with check (true);

-- Realtime: index.html subscribes to postgres_changes on this table.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'camping_data'
  ) then
    execute 'alter publication supabase_realtime add table public.camping_data';
  end if;
end $$;

-- 2. Seed payloads -------------------------------------------------------------

with ts as (select (extract(epoch from now()) * 1000)::bigint as ms)
insert into public.camping_data (key, value, updated_at)
select
  'shared',
  jsonb_build_object(
    -- Mangal / dinner ------------------------------------------------------
    'sh_seed01', jsonb_build_object('name', 'מנגל ופחמים',                 'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed02', jsonb_build_object('name', 'כלים למנגל',                  'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed03', jsonb_build_object('name', 'המבורגר',                     'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed04', jsonb_build_object('name', 'לחמניות המבורגר',            'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed05', jsonb_build_object('name', 'שישיית בירה לכל משתתף',     'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed06', jsonb_build_object('name', '6 לימונים',                   'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed07', jsonb_build_object('name', 'קרש חיתוך',                   'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed08', jsonb_build_object('name', 'מחבת וסיר',                   'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed09', jsonb_build_object('name', 'שתי קערות לסלט',             'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed10', jsonb_build_object('name', 'סכין',                        'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed11', jsonb_build_object('name', 'מלקחיים',                     'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed12', jsonb_build_object('name', 'מרשמלו',                      'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed13', jsonb_build_object('name', 'ירקות לסלט',                  'category', 'dinner',  'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    -- Breakfast ------------------------------------------------------------
    'sh_seed14', jsonb_build_object('name', 'ערכת קפה',                    'category', 'breakfast','claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    -- General --------------------------------------------------------------
    'sh_seed15', jsonb_build_object('name', 'עגלת ציוד',                   'category', 'general', 'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed16', jsonb_build_object('name', 'סטיקלייטים וזוהרים',         'category', 'general', 'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed17', jsonb_build_object('name', 'חד״פ (צלחות / כוסות / סכו״ם)','category','general', 'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed18', jsonb_build_object('name', 'נפנף',                        'category', 'general', 'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed19', jsonb_build_object('name', 'שקיות אשפה',                 'category', 'general', 'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed20', jsonb_build_object('name', 'סקוץ וסבון כלים',           'category', 'general', 'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed21', jsonb_build_object('name', 'רמקול',                       'category', 'general', 'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    -- My suggested additions (general) -------------------------------------
    'sh_seed22', jsonb_build_object('name', 'מצית / גפרורים',             'category', 'general', 'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed23', jsonb_build_object('name', 'ערכת עזרה ראשונה',          'category', 'general', 'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed24', jsonb_build_object('name', 'נייר טואלט',                  'category', 'general', 'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms),
    'sh_seed25', jsonb_build_object('name', 'שולחן מתקפל',                'category', 'general', 'claims', '{}'::jsonb, 'packed', '{}'::jsonb, 'addedBy', 'system', 'addedAt', ts.ms)
  ),
  now()
from ts
on conflict (key) do update
  set value = excluded.value, updated_at = excluded.updated_at;

-- Personal items (one entry per family, identical starter list per family) ----

with
ts as (select (extract(epoch from now()) * 1000)::bigint as ms),
items(slot, name) as (
  values
    ('pr_seed01', 'אוהל'),
    ('pr_seed02', 'שישיית מים'),
    ('pr_seed03', 'מזרן'),
    ('pr_seed04', 'פנסים'),
    ('pr_seed05', 'אלתוש'),
    ('pr_seed06', 'מחצלת'),
    ('pr_seed07', 'כיסאות'),
    ('pr_seed08', 'כריות'),
    ('pr_seed09', 'שמיכות'),
    ('pr_seed10', 'קרם הגנה'),
    ('pr_seed11', 'מברשות שיניים'),
    ('pr_seed12', 'מטענים'),
    ('pr_seed13', 'חטיפים ונשנושים'),
    ('pr_seed14', 'כובע'),
    ('pr_seed15', 'בגדים חמים ללילה'),
    -- My suggested additions
    ('pr_seed16', 'משחת שיניים'),
    ('pr_seed17', 'מגבת'),
    ('pr_seed18', 'בגדים להחלפה'),
    ('pr_seed19', 'תרופות אישיות'),
    ('pr_seed20', 'שק שינה')
),
per_family as (
  select
    fam,
    jsonb_object_agg(
      slot,
      jsonb_build_object(
        'name', name,
        'checked', false,
        'addedBy', 'system',
        'addedAt', (select ms from ts)
      )
    ) as fam_items
  from items
  cross join (values ('avidan'), ('afsoa'), ('weizman'), ('sofer')) as f(fam)
  group by fam
)
insert into public.camping_data (key, value, updated_at)
select
  'personal',
  jsonb_object_agg(fam, fam_items),
  now()
from per_family
on conflict (key) do update
  set value = excluded.value, updated_at = excluded.updated_at;

-- 3. Sanity check --------------------------------------------------------------
-- Should return: 'shared' with 25 items, 'personal' with 4 family keys × 20 items.
select
  key,
  case key
    when 'shared'   then jsonb_object_keys(value) is not null
    when 'personal' then jsonb_object_keys(value) is not null
    else true
  end as ok,
  jsonb_object_keys(value) as sample_keys
from public.camping_data
where key in ('shared', 'personal')
order by key;
