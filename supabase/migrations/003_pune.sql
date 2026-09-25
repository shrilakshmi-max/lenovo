-- Run once in the Supabase SQL editor to add the Pune hackathon to this
-- database. Safe to re-run. Does not touch the existing "teams" / "scores"
-- / "round2_scores" tables in any way - Pune is fully separate.

create table if not exists pune_teams (
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pune_scores (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null references pune_teams(table_number) on delete cascade,
  evaluator_name text not null check (
    evaluator_name in ('Paulomi', 'Amit', 'Yogesh', 'Rushikesh', 'Mayuresh', 'Tushar', 'Pramay', 'Utkarsh')
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

drop trigger if exists pune_teams_set_updated_at on pune_teams;
create trigger pune_teams_set_updated_at
  before update on pune_teams
  for each row execute function set_updated_at();

drop trigger if exists pune_scores_set_updated_at on pune_scores;
create trigger pune_scores_set_updated_at
  before update on pune_scores
  for each row execute function set_updated_at();

alter table pune_teams enable row level security;
alter table pune_scores enable row level security;

drop policy if exists "public read pune teams" on pune_teams;
create policy "public read pune teams" on pune_teams for select using (true);

drop policy if exists "public read pune scores" on pune_scores;
create policy "public read pune scores" on pune_scores for select using (true);

drop policy if exists "public insert pune scores" on pune_scores;
create policy "public insert pune scores" on pune_scores for insert with check (true);

drop policy if exists "public update pune scores" on pune_scores;
create policy "public update pune scores" on pune_scores for update using (true) with check (true);

create or replace view pune_leaderboard as
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
from pune_teams t
left join pune_scores s on s.table_number = t.table_number
group by t.table_number, t.team_id, t.team_name, t.project_title, t.project_theme, t.group_number
order by average_total desc nulls last, t.table_number asc;

alter view pune_leaderboard set (security_invoker = true);
