-- Optional Supabase schema. Run in a new project after reviewing this migration.
-- Public browsing uses the shipped snapshot and does not require a database.
create table public.menu_snapshots (
  id uuid primary key default gen_random_uuid(),
  region text not null check (region = 'US'),
  fetched_at timestamptz not null,
  source_url text not null,
  published boolean not null default false,
  raw_payload jsonb not null
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  region text not null check (region = 'US'),
  provider_product_id text not null,
  category text not null,
  unique (region, provider_product_id)
);

create table public.ingredient_versions (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id),
  snapshot_id uuid not null references public.menu_snapshots(id),
  name text not null,
  availability text not null,
  compatible_bases jsonb not null default '[]',
  ingredient_declaration jsonb,
  allergens jsonb,
  source_url text not null,
  unique (ingredient_id, snapshot_id)
);

create table public.nutrition_observations (
  id uuid primary key default gen_random_uuid(),
  ingredient_version_id uuid not null references public.ingredient_versions(id),
  serving_quantity numeric not null check (serving_quantity > 0),
  serving_unit text not null check (serving_unit in ('ml', 'full_pump', 'half_pump', 'portion', 'drink')),
  size_code text,
  portion_code text,
  calories numeric check (calories >= 0),
  calories_low numeric check (calories_low >= 0),
  calories_high numeric check (calories_high >= 0),
  estimation_method text check (estimation_method in ('generic', 'analogy', 'recipe-derived', 'noncaloric')),
  confidence text check (confidence in ('low', 'medium')),
  assumed_serving_notes text,
  reference_sources jsonb not null default '[]' check (jsonb_typeof(reference_sources) = 'array'),
  sugar_g numeric check (sugar_g >= 0),
  protein_g numeric check (protein_g >= 0),
  caffeine_mg numeric check (caffeine_mg >= 0),
  evidence_kind text not null check (evidence_kind in ('official', 'estimate', 'unknown')),
  source_url text,
  source_note text not null,
  verified_at timestamptz,
  check (evidence_kind <> 'official' or (source_url is not null and verified_at is not null)),
  check (evidence_kind <> 'unknown' or calories is null),
  check (calories_low is null or calories is null or calories_low <= calories),
  check (calories_high is null or calories is null or calories_high >= calories),
  check (calories_low is null or calories_high is null or calories_low <= calories_high)
);

create table public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id uuid not null references public.menu_snapshots(id),
  title text not null check (char_length(title) between 1 and 120),
  build jsonb not null check (jsonb_typeof(build) = 'object'),
  created_at timestamptz not null default now()
);

create index ingredient_versions_snapshot_idx on public.ingredient_versions(snapshot_id);
create index nutrition_observations_version_idx on public.nutrition_observations(ingredient_version_id);
create index saved_recipes_owner_idx on public.saved_recipes(owner_id);

alter table public.menu_snapshots enable row level security;
alter table public.ingredients enable row level security;
alter table public.ingredient_versions enable row level security;
alter table public.nutrition_observations enable row level security;
alter table public.saved_recipes enable row level security;

create policy "Published snapshots are readable" on public.menu_snapshots for select to anon, authenticated using (published);
create policy "Published ingredients are readable" on public.ingredients for select to anon, authenticated using (
  exists (select 1 from public.ingredient_versions v join public.menu_snapshots s on s.id = v.snapshot_id
          where v.ingredient_id = ingredients.id and s.published)
);
create policy "Published ingredient versions are readable" on public.ingredient_versions for select to anon, authenticated using (
  exists (select 1 from public.menu_snapshots s where s.id = snapshot_id and s.published)
);
create policy "Published nutrition is readable" on public.nutrition_observations for select to anon, authenticated using (
  exists (select 1 from public.ingredient_versions v join public.menu_snapshots s on s.id = v.snapshot_id
          where v.id = ingredient_version_id and s.published)
);
create policy "Owners manage their recipes" on public.saved_recipes for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
-- No anonymous catalog writes. A trusted importer must use the server-only service role.
-- Do not put a service-role key in a VITE_* environment variable.
