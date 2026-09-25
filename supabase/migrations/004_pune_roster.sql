-- Run once in the Supabase SQL editor to add the Pune registration desk.
-- Safe to re-run. Purely additive - does not alter pune_teams, pune_scores,
-- or any UP table in any way.

create table if not exists pune_roster (
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

drop trigger if exists pune_roster_set_updated_at on pune_roster;
create trigger pune_roster_set_updated_at
  before update on pune_roster
  for each row execute function set_updated_at();

alter table pune_roster enable row level security;

drop policy if exists "public read pune roster" on pune_roster;
create policy "public read pune roster" on pune_roster for select using (true);
