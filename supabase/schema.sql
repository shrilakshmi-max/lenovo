-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Safe to re-run: uses "if not exists" / "or replace" everywhere.

create extension if not exists pgcrypto;

create table if not exists teams (
  table_number integer primary key,
  team_id text,
  team_name text,
  leader_name text,
  member2_name text,
  leader_email text,
  leader_contact text,
  attendees text,
  project_title text,
  project_theme text,
  project_link text,
  pitch_night_marks numeric,
  group_number smallint not null check (group_number between 1 and 4),
  round2_qualified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null references teams(table_number) on delete cascade,
  evaluator_name text not null check (
    evaluator_name in ('Amit', 'Saurabh', 'Neha', 'Nishant', 'Priyanshi', 'Yash/Utkarsh', 'Amanpreet', 'Ayush')
  ),
  theme_alignment smallint not null check (theme_alignment between 1 and 10),
  innovation smallint not null check (innovation between 1 and 10),
  technical_implementation smallint not null check (technical_implementation between 1 and 10),
  scalability smallint not null check (scalability between 1 and 10),
  total smallint generated always as (
    theme_alignment + innovation + technical_implementation + scalability
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (table_number, evaluator_name)
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists teams_set_updated_at on teams;
create trigger teams_set_updated_at
  before update on teams
  for each row execute function set_updated_at();

drop trigger if exists scores_set_updated_at on scores;
create trigger scores_set_updated_at
  before update on scores
  for each row execute function set_updated_at();

-- Row level security. This is an internal tool used only via a private link
-- during the event, so reads/writes on scores are open to the anon key;
-- team-list replacement always goes through the service-role-only /api/admin/import route.
alter table teams enable row level security;
alter table scores enable row level security;

drop policy if exists "public read teams" on teams;
create policy "public read teams" on teams for select using (true);

drop policy if exists "public read scores" on scores;
create policy "public read scores" on scores for select using (true);

drop policy if exists "public insert scores" on scores;
create policy "public insert scores" on scores for insert with check (true);

drop policy if exists "public update scores" on scores;
create policy "public update scores" on scores for update using (true) with check (true);

create or replace view leaderboard as
select
  t.table_number,
  t.team_id,
  t.team_name,
  t.project_title,
  t.project_theme,
  t.group_number,
  count(s.id) as evaluations_count,
  round(avg(s.total)::numeric, 2) as average_total,
  round(avg(s.theme_alignment)::numeric, 2) as avg_theme_alignment,
  round(avg(s.innovation)::numeric, 2) as avg_innovation,
  round(avg(s.technical_implementation)::numeric, 2) as avg_technical_implementation,
  round(avg(s.scalability)::numeric, 2) as avg_scalability
from teams t
left join scores s on s.table_number = t.table_number
group by t.table_number, t.team_id, t.team_name, t.project_title, t.project_theme, t.group_number
order by average_total desc nulls last, t.table_number asc;

alter view leaderboard set (security_invoker = true);

-- Round 2: same rubric, a separate 3-evaluator pool, and every team is
-- assigned to every evaluator (no groups). teams.round2_qualified marks the
-- top 20 selected from the round 1 leaderboard when round 2 begins - see
-- /api/round2/begin, which only runs once (it refuses if any team is
-- already flagged).
create table if not exists round2_scores (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null references teams(table_number) on delete cascade,
  evaluator_name text not null check (
    evaluator_name in ('Arvind', 'Utkarsh', 'Amit')
  ),
  theme_alignment smallint not null check (theme_alignment between 1 and 10),
  innovation smallint not null check (innovation between 1 and 10),
  technical_implementation smallint not null check (technical_implementation between 1 and 10),
  scalability smallint not null check (scalability between 1 and 10),
  total smallint generated always as (
    theme_alignment + innovation + technical_implementation + scalability
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (table_number, evaluator_name)
);

drop trigger if exists round2_scores_set_updated_at on round2_scores;
create trigger round2_scores_set_updated_at
  before update on round2_scores
  for each row execute function set_updated_at();

alter table round2_scores enable row level security;

drop policy if exists "public read round2 scores" on round2_scores;
create policy "public read round2 scores" on round2_scores for select using (true);

drop policy if exists "public insert round2 scores" on round2_scores;
create policy "public insert round2 scores" on round2_scores for insert with check (true);

drop policy if exists "public update round2 scores" on round2_scores;
create policy "public update round2 scores" on round2_scores for update using (true) with check (true);

create or replace view round2_leaderboard as
select
  t.table_number,
  t.team_id,
  t.team_name,
  t.project_title,
  t.project_theme,
  count(s.id) as evaluations_count,
  round(avg(s.total)::numeric, 2) as average_total,
  round(avg(s.theme_alignment)::numeric, 2) as avg_theme_alignment,
  round(avg(s.innovation)::numeric, 2) as avg_innovation,
  round(avg(s.technical_implementation)::numeric, 2) as avg_technical_implementation,
  round(avg(s.scalability)::numeric, 2) as avg_scalability
from teams t
left join round2_scores s on s.table_number = t.table_number
where t.round2_qualified = true
group by t.table_number, t.team_id, t.team_name, t.project_title, t.project_theme
order by average_total desc nulls last, t.table_number asc;

alter view round2_leaderboard set (security_invoker = true);
