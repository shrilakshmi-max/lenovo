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
  comment text,
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
  round(avg(s.scalability)::numeric, 2) as avg_scalability,
  t.leader_name,
  t.member2_name,
  t.project_link
from teams t
left join scores s on s.table_number = t.table_number
group by t.table_number, t.team_id, t.team_name, t.project_title, t.project_theme, t.group_number, t.leader_name, t.member2_name, t.project_link
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
  comment text,
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

-- Pune hackathon: a fully separate event, parallel to the UP tables above
-- rather than sharing them - table numbers aren't unique across events, so
-- this avoids any composite-key surgery on the live "teams"/"scores" data.
-- Same rubric, same 4-groups-of-2 pattern as UP, own evaluator pool.
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
    evaluator_name in ('Poulamee', 'Amit', 'Yogesh', 'Rushikesh', 'Mayuresh', 'Tushar', 'Pramay', 'Utkarsh')
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
  round(avg(s.scalability)::numeric, 2) as avg_scalability,
  t.leader_name,
  t.member2_name,
  t.project_link
from pune_teams t
left join pune_scores s on s.table_number = t.table_number
group by t.table_number, t.team_id, t.team_name, t.project_title, t.project_theme, t.group_number, t.leader_name, t.member2_name, t.project_link
order by average_total desc nulls last, t.table_number asc;

alter view pune_leaderboard set (security_invoker = true);

-- Pune registration desk: teams check in before they have a table number.
-- This is a separate table, not a change to pune_teams - pune_teams (and
-- everything evaluation/leaderboard depend on) is untouched. A team lives
-- here first (uploaded via an admin "pre-registration roster" import, no
-- table number yet); pressing "Register" at the desk creates the matching
-- pune_teams row with an assigned table number and flips `registered` here
-- to true, so it drops out of the desk's pending list.
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

-- Reads only: the desk's Team ID lookup uses the anon key directly (no
-- passcode, per the org's call). All writes - the roster import and the
-- actual "Register" action - go through service-role API routes instead
-- of opening up anon insert/update here, so table-number assignment can be
-- done safely (transactionally, no race between two desks) server side.
alter table pune_roster enable row level security;

drop policy if exists "public read pune roster" on pune_roster;
create policy "public read pune roster" on pune_roster for select using (true);

-- Shared table-assignment logic, used by both register_pune_team (existing
-- roster entries) and register_new_pune_team (spot/walk-in registration).
--
-- Table assignment within a group: solo teams (no second member) prefer
-- that group's small reserved solo pool; two-person teams prefer the
-- larger regular pool. If a team's preferred pool is exhausted, it spills
-- into the other pool for that group instead of blocking registration. If
-- the group's whole 1-72 range is exhausted, overflow into a shared
-- sequential pool starting at 73 (no solo/regular distinction there) -
-- still routed to this group by the round-robin in the caller.
create or replace function assign_pune_table(p_group smallint, p_is_solo boolean)
returns integer
language plpgsql
as $$
declare
  v_regular integer[];
  v_solo integer[];
  v_num integer;
  v_table integer;
begin
  case p_group
    when 1 then
      v_regular := array[1,2,3,4,5,6,7,8,9,10,11,12,13,14];
      v_solo := array[15,16,17];
    when 2 then
      v_regular := array[35,34,33,32,31,30,29,28,27,26,25,24,23,22,21,20];
      v_solo := array[18,19];
    when 3 then
      v_regular := array[36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51];
      v_solo := array[52,53];
    when 4 then
      v_regular := array[72,71,70,69,68,67,66,65,64,63,62,61,60,59,58,57];
      v_solo := array[54,55,56];
  end case;

  v_table := null;

  if p_is_solo then
    foreach v_num in array v_solo loop
      if not exists (select 1 from pune_teams where table_number = v_num) then
        v_table := v_num;
        exit;
      end if;
    end loop;
    if v_table is null then
      foreach v_num in array v_regular loop
        if not exists (select 1 from pune_teams where table_number = v_num) then
          v_table := v_num;
          exit;
        end if;
      end loop;
    end if;
  else
    foreach v_num in array v_regular loop
      if not exists (select 1 from pune_teams where table_number = v_num) then
        v_table := v_num;
        exit;
      end if;
    end loop;
    if v_table is null then
      foreach v_num in array v_solo loop
        if not exists (select 1 from pune_teams where table_number = v_num) then
          v_table := v_num;
          exit;
        end if;
      end loop;
    end if;
  end if;

  if v_table is null then
    select greatest(73, coalesce(max(table_number), 72) + 1)
    into v_table
    from pune_teams;
  end if;

  return v_table;
end;
$$;

-- Atomically assigns a table number + evaluator group to a roster team and
-- creates its pune_teams row. Called from /api/pune/register via the
-- service-role client (never directly from the browser).
--
-- Group assignment: simple round robin over check-in order (1st team
-- overall -> group 1, 2nd -> group 2, 3rd -> group 3, 4th -> group 4, 5th
-- -> group 1 again, ...).
--
-- pg_advisory_xact_lock serializes every call against every other call to
-- this function AND register_new_pune_team, held for the duration of the
-- calling transaction, so two desks registering teams (existing roster or
-- brand new) at the same instant can never be assigned the same table or
-- miscount the round-robin position.
create or replace function register_pune_team(p_team_id text)
returns table (assigned_table_number integer, assigned_group_number smallint)
language plpgsql
as $$
declare
  v_roster pune_roster%rowtype;
  v_position integer;
  v_group smallint;
  v_is_solo boolean;
  v_table integer;
begin
  perform pg_advisory_xact_lock(hashtext('pune_register'));

  select * into v_roster from pune_roster where team_id = p_team_id;
  if not found then
    raise exception 'No roster entry for Team ID %', p_team_id using errcode = 'P0002';
  end if;
  if v_roster.registered then
    raise exception 'Team % is already registered', p_team_id using errcode = '23505';
  end if;

  select count(*) into v_position from pune_teams;
  v_position := v_position + 1;
  v_group := ((v_position - 1) % 4) + 1;

  v_is_solo := (v_roster.member2_name is null or btrim(v_roster.member2_name) = '');
  v_table := assign_pune_table(v_group, v_is_solo);

  insert into pune_teams (
    table_number, team_id, team_name, leader_name, member2_name,
    leader_email, leader_contact, attendees, project_title, project_theme,
    project_link, pitch_night_marks, group_number
  ) values (
    v_table, v_roster.team_id, v_roster.team_name, v_roster.leader_name, v_roster.member2_name,
    v_roster.leader_email, v_roster.leader_contact, v_roster.attendees, v_roster.project_title, v_roster.project_theme,
    v_roster.project_link, v_roster.pitch_night_marks, v_group
  );

  update pune_roster
  set registered = true, registered_table_number = v_table
  where team_id = p_team_id;

  return query select v_table, v_group;
end;
$$;

-- Spot/walk-in registration: a team that was never on the pre-uploaded
-- roster. Generates a unique Team ID (format "W001", "W002", ... - the "W"
-- prefix keeps these unambiguously distinct from the roster's own IDs),
-- creates its pune_roster row (already marked registered, for the same
-- audit trail roster-based registrations get), and assigns a table number
-- + group exactly like register_pune_team. Shares the same advisory lock
-- name, so it's serialized against register_pune_team too.
create or replace function register_new_pune_team(
  p_team_name text,
  p_leader_name text,
  p_member2_name text,
  p_leader_email text,
  p_leader_contact text,
  p_attendees text,
  p_project_title text,
  p_project_theme text,
  p_project_link text
)
returns table (assigned_team_id text, assigned_table_number integer, assigned_group_number smallint)
language plpgsql
as $$
declare
  v_position integer;
  v_group smallint;
  v_is_solo boolean;
  v_table integer;
  v_team_id text;
  v_next_seq integer;
begin
  perform pg_advisory_xact_lock(hashtext('pune_register'));

  select coalesce(max(substring(team_id from 2)::integer), 0) + 1
  into v_next_seq
  from pune_roster
  where team_id ~ '^W[0-9]+$';

  v_team_id := 'W' || lpad(v_next_seq::text, 3, '0');

  select count(*) into v_position from pune_teams;
  v_position := v_position + 1;
  v_group := ((v_position - 1) % 4) + 1;

  v_is_solo := (p_member2_name is null or btrim(p_member2_name) = '');
  v_table := assign_pune_table(v_group, v_is_solo);

  insert into pune_roster (
    team_id, team_name, leader_name, member2_name, leader_email,
    leader_contact, attendees, project_title, project_theme, project_link,
    registered, registered_table_number
  ) values (
    v_team_id, p_team_name, p_leader_name, p_member2_name, p_leader_email,
    p_leader_contact, p_attendees, p_project_title, p_project_theme, p_project_link,
    true, v_table
  );

  insert into pune_teams (
    table_number, team_id, team_name, leader_name, member2_name,
    leader_email, leader_contact, attendees, project_title, project_theme,
    project_link, group_number
  ) values (
    v_table, v_team_id, p_team_name, p_leader_name, p_member2_name,
    p_leader_email, p_leader_contact, p_attendees, p_project_title, p_project_theme,
    p_project_link, v_group
  );

  return query select v_team_id, v_table, v_group;
end;
$$;

-- Raipur hackathon: a third, fully separate event alongside UP and Pune.
-- Same pattern as Pune (separate tables, own evaluator pool, own
-- admin/register flow) but with one structural difference: Raipur allows
-- two one-person teams to share a table_number, so table_number can no
-- longer be the unique identity for a team. raipur_teams is keyed by
-- team_id instead (table_number is a plain, non-unique display/seating
-- column). raipur_scores, the detail page routes, and ScoreForm all match
-- by team_id for Raipur.
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
  -- Whether this is a one-person team. Drives which tables are eligible
  -- for solo-pairing in assign_raipur_table, and means a table_number can
  -- appear on at most 2 rows (both is_solo = true) or exactly 1 row
  -- (is_solo = false, a dedicated two-person table).
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

-- Table assignment for Raipur. Group g (1-5) gets a dedicated block of 10
-- table numbers: (g-1)*10+1 .. (g-1)*10+10 (Group 1 = 1-10, Group 2 =
-- 11-20, ... Group 5 = 41-50). Two-person teams always get a fresh,
-- exclusive table from that block. One-person teams first look for an
-- existing table in the block that already holds exactly one other
-- one-person team (so two solo teams end up sharing a table, always
-- within the same judge group); if none exists, they get a fresh table
-- too, which becomes available for the next solo team to pair into. Once
-- a group's block of 10 is exhausted, table numbers overflow
-- sequentially from 51 onward, shared across all groups, with no
-- solo/two-person distinction there (matches Pune's >72 overflow).
create or replace function assign_raipur_table(p_group smallint, p_is_solo boolean)
returns integer
language plpgsql
as $$
declare
  v_base integer;
  v_table integer;
  v_next_k integer;
begin
  v_base := (p_group - 1) * 10;

  if p_is_solo then
    select rt.table_number into v_table
    from raipur_teams rt
    where rt.group_number = p_group
      and rt.is_solo = true
      and rt.table_number between v_base + 1 and v_base + 10
    group by rt.table_number
    having count(*) = 1
    order by rt.table_number
    limit 1;

    if v_table is not null then
      return v_table;
    end if;
  end if;

  select min(k) into v_next_k
  from generate_series(1, 10) as k
  where not exists (
    select 1 from raipur_teams rt where rt.table_number = v_base + k
  );

  if v_next_k is not null then
    return v_base + v_next_k;
  end if;

  select greatest(51, coalesce(max(rt.table_number), 50) + 1)
  into v_table
  from raipur_teams rt;

  return v_table;
end;
$$;

-- Atomically assigns a table number + evaluator group to a roster team and
-- creates its raipur_teams row. Called from /api/raipur/register via the
-- service-role client. Group assignment: simple round robin over check-in
-- order (1st team overall -> group 1, 2nd -> group 2, ..., 5th -> group 5,
-- 6th -> group 1 again, ...). pg_advisory_xact_lock serializes every call
-- against every other call to this function AND register_new_raipur_team,
-- so two desks registering teams at the same instant can never collide.
create or replace function register_raipur_team(p_team_id text)
returns table (assigned_table_number integer, assigned_group_number smallint)
language plpgsql
as $$
declare
  v_roster raipur_roster%rowtype;
  v_position integer;
  v_group smallint;
  v_is_solo boolean;
  v_table integer;
begin
  perform pg_advisory_xact_lock(hashtext('raipur_register'));

  select * into v_roster from raipur_roster where team_id = p_team_id;
  if not found then
    raise exception 'No roster entry for Team ID %', p_team_id using errcode = 'P0002';
  end if;
  if v_roster.registered then
    raise exception 'Team % is already registered', p_team_id using errcode = '23505';
  end if;

  select count(*) into v_position from raipur_teams;
  v_position := v_position + 1;
  v_group := ((v_position - 1) % 5) + 1;

  v_is_solo := (v_roster.member2_name is null or btrim(v_roster.member2_name) = '');
  v_table := assign_raipur_table(v_group, v_is_solo);

  insert into raipur_teams (
    team_id, table_number, team_name, leader_name, member2_name,
    leader_email, leader_contact, attendees, project_title, project_theme,
    project_link, pitch_night_marks, group_number, is_solo
  ) values (
    v_roster.team_id, v_table, v_roster.team_name, v_roster.leader_name, v_roster.member2_name,
    v_roster.leader_email, v_roster.leader_contact, v_roster.attendees, v_roster.project_title, v_roster.project_theme,
    v_roster.project_link, v_roster.pitch_night_marks, v_group, v_is_solo
  );

  update raipur_roster
  set registered = true, registered_table_number = v_table
  where team_id = p_team_id;

  return query select v_table, v_group;
end;
$$;

-- Spot/walk-in registration: a team that was never on the pre-uploaded
-- roster. Generates a unique Team ID ("W001", "W002", ...), creates its
-- raipur_roster row (already marked registered), and assigns a table +
-- group exactly like register_raipur_team. Shares the same advisory lock
-- name, so it's serialized against register_raipur_team too.
create or replace function register_new_raipur_team(
  p_team_name text,
  p_leader_name text,
  p_member2_name text,
  p_leader_email text,
  p_leader_contact text,
  p_attendees text,
  p_project_title text,
  p_project_theme text,
  p_project_link text
)
returns table (assigned_team_id text, assigned_table_number integer, assigned_group_number smallint)
language plpgsql
as $$
declare
  v_position integer;
  v_group smallint;
  v_is_solo boolean;
  v_table integer;
  v_team_id text;
  v_next_seq integer;
begin
  perform pg_advisory_xact_lock(hashtext('raipur_register'));

  select coalesce(max(substring(team_id from 2)::integer), 0) + 1
  into v_next_seq
  from raipur_roster
  where team_id ~ '^W[0-9]+$';

  v_team_id := 'W' || lpad(v_next_seq::text, 3, '0');

  select count(*) into v_position from raipur_teams;
  v_position := v_position + 1;
  v_group := ((v_position - 1) % 5) + 1;

  v_is_solo := (p_member2_name is null or btrim(p_member2_name) = '');
  v_table := assign_raipur_table(v_group, v_is_solo);

  insert into raipur_roster (
    team_id, team_name, leader_name, member2_name, leader_email,
    leader_contact, attendees, project_title, project_theme, project_link,
    registered, registered_table_number
  ) values (
    v_team_id, p_team_name, p_leader_name, p_member2_name, p_leader_email,
    p_leader_contact, p_attendees, p_project_title, p_project_theme, p_project_link,
    true, v_table
  );

  insert into raipur_teams (
    team_id, table_number, team_name, leader_name, member2_name,
    leader_email, leader_contact, attendees, project_title, project_theme,
    project_link, group_number, is_solo
  ) values (
    v_team_id, v_table, p_team_name, p_leader_name, p_member2_name,
    p_leader_email, p_leader_contact, p_attendees, p_project_title, p_project_theme,
    p_project_link, v_group, v_is_solo
  );

  return query select v_team_id, v_table, v_group;
end;
$$;
