-- supabase/sql/2026-07-09-gamification.sql
-- Correr manualmente en el editor SQL de Supabase (proyecto qdollaysvrlrpbytmbzs).

alter table profiles
  add column if not exists xp_total integer not null default 0;

alter table bank_statement_analyses
  add column if not exists gastos_evitables_aplicados integer[] not null default '{}';

create table if not exists xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_key text not null,
  xp_amount integer not null default 0,
  dedupe_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists xp_events_user_dedupe_idx
  on xp_events(user_id, dedupe_key)
  where dedupe_key is not null;

alter table xp_events enable row level security;

create policy "select own xp_events" on xp_events
  for select using (auth.uid() = user_id);

create policy "insert own xp_events" on xp_events
  for insert with check (auth.uid() = user_id);

create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_key)
);

alter table user_achievements enable row level security;

create policy "select own achievements" on user_achievements
  for select using (auth.uid() = user_id);

create policy "insert own achievements" on user_achievements
  for insert with check (auth.uid() = user_id);
