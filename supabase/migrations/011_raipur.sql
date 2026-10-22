-- Run once in the Supabase SQL editor to add the Raipur hackathon. Safe to
-- re-run. Purely additive - does not alter teams, scores, pune_teams,
-- pune_scores, round2_scores, or any other existing table in any way.
--
-- Structural note: unlike Pune/UP, Raipur allows two one-person teams to
-- share a table number (see 012_raipur_register_functions.sql for the
-- pairing logic), so table_number can't be the unique identity for a team
-- here. raipur_teams is keyed by team_id instead; raipur_scores and all
-- Raipur routes match by team_id, not table_number.

create table if not exists raipur_roster (
  id uuid primary key default gen_random_uuid(),
  team_id text not null unique,
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
  registered boolean not null default false,
  registered_table_number integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists raipur_teams (
  team_id text primary key,
  table_number integer not null,
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
  group_number smallint not null check (group_number between 1 and 5),
  is_solo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists raipur_scores (
  id uuid primary key default gen_random_uuid(),
  team_id text not null references raipur_teams(team_id) on delete cascade,
  evaluator_name text not null check (
    evaluator_name in ('Amit', 'Rajat', 'Pramay', 'Rajkamal', 'Rushikesh', 'Sudhi', 'Ankush', 'Tushar', 'Pratima', 'Priyanshi')
  ),
  theme_alignment smallint not null check (theme_alignment between 1 and 10),
  innovation smallint not null check (innovation between 1 and 10),
  technical_implementation smallint not null check (technical_implementation between 1 and 10),
  scalability smallint not null check (scalability between 1 and 10),
  total smallint generated always as (
    theme_alignment + innovation + technical_implementation + scalability
  ) stored,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, evaluator_name)
);

drop trigger if exists raipur_roster_set_updated_at on raipur_roster;
create trigger raipur_roster_set_updated_at
  before update on raipur_roster
  for each row execute function set_updated_at();

drop trigger if exists raipur_teams_set_updated_at on raipur_teams;
create trigger raipur_teams_set_updated_at
  before update on raipur_teams
  for each row execute function set_updated_at();

drop trigger if exists raipur_scores_set_updated_at on raipur_scores;
create trigger raipur_scores_set_updated_at
  before update on raipur_scores
  for each row execute function set_updated_at();

alter table raipur_roster enable row level security;
alter table raipur_teams enable row level security;
alter table raipur_scores enable row level security;

drop policy if exists "public read raipur roster" on raipur_roster;
create policy "public read raipur roster" on raipur_roster for select using (true);

drop policy if exists "public read raipur teams" on raipur_teams;
create policy "public read raipur teams" on raipur_teams for select using (true);

drop policy if exists "public read raipur scores" on raipur_scores;
create policy "public read raipur scores" on raipur_scores for select using (true);

drop policy if exists "public insert raipur scores" on raipur_scores;
create policy "public insert raipur scores" on raipur_scores for insert with check (true);

drop policy if exists "public update raipur scores" on raipur_scores;
create policy "public update raipur scores" on raipur_scores for update using (true) with check (true);

create or replace view raipur_leaderboard as
select
  t.team_id,
  t.table_number,
  t.team_name,
  t.project_title,
  t.project_theme,
  t.group_number,
  count(s.id) as evaluations_count,
  round(avg(s.total)::numeric, 2) as average_total,
  round(avg(s.theme_alignment)::numeric, 2) as avg_theme_alignment,
  round(avg(s.innovation)::numeric, 2) as avg_innovation,
  round(avg(s.technical_implementation)::numeric, 2) as avg_technical_implementation,
  round(avg(s.scalability)::numeric, 2) as avg_scalability,
  t.leader_name,
  t.member2_name,
  t.project_link
from raipur_teams t
left join raipur_scores s on s.team_id = t.team_id
group by t.team_id, t.table_number, t.team_name, t.project_title, t.project_theme, t.group_number, t.leader_name, t.member2_name, t.project_link
order by average_total desc nulls last, t.table_number asc;

alter view raipur_leaderboard set (security_invoker = true);
