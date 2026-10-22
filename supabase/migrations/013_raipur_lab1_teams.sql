-- Run once in the Supabase SQL editor, after 012_raipur_register_functions.sql,
-- to add Raipur's Lab 1 team handling. Safe to re-run (create or replace /
-- add column if not exists).
--
-- A fixed set of 6 team IDs skip the normal table-and-group assignment
-- entirely: they're judged in Lab 1 (no table number) by the
-- Pratima/Priyanshi group (group 5), regardless of check-in order.

alter table raipur_teams alter column table_number drop not null;
alter table raipur_teams add column if not exists location text;

create or replace function raipur_lab1_team_ids()
returns text[]
language sql
immutable
as $$
  select array['C291', 'C346', 'C730', 'C509', 'C732', 'C391'];
$$;

-- register_raipur_team's return columns changed (added assigned_location),
-- and create or replace can't change a function's OUT parameters.
drop function if exists register_raipur_team(text);

create function register_raipur_team(p_team_id text)
returns table (assigned_table_number integer, assigned_group_number smallint, assigned_location text)
language plpgsql
as $$
declare
  v_roster raipur_roster%rowtype;
  v_position integer;
  v_group smallint;
  v_is_solo boolean;
  v_table integer;
  v_location text;
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

  v_is_solo := (v_roster.member2_name is null or btrim(v_roster.member2_name) = '');

  if p_team_id = any (raipur_lab1_team_ids()) then
    v_group := 5;
    v_table := null;
    v_location := 'Lab 1';
  else
    v_group := ((v_position - 1) % 5) + 1;
    v_table := assign_raipur_table(v_group, v_is_solo);
    v_location := null;
  end if;

  insert into raipur_teams (
    team_id, table_number, team_name, leader_name, member2_name,
    leader_email, leader_contact, attendees, project_title, project_theme,
    project_link, pitch_night_marks, group_number, is_solo, location
  ) values (
    v_roster.team_id, v_table, v_roster.team_name, v_roster.leader_name, v_roster.member2_name,
    v_roster.leader_email, v_roster.leader_contact, v_roster.attendees, v_roster.project_title, v_roster.project_theme,
    v_roster.project_link, v_roster.pitch_night_marks, v_group, v_is_solo, v_location
  );

  update raipur_roster
  set registered = true, registered_table_number = v_table
  where team_id = p_team_id;

  return query select v_table, v_group, v_location;
end;
$$;

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
  t.project_link,
  t.location
from raipur_teams t
left join raipur_scores s on s.team_id = t.team_id
group by t.team_id, t.table_number, t.team_name, t.project_title, t.project_theme, t.group_number, t.leader_name, t.member2_name, t.project_link, t.location
order by average_total desc nulls last, t.table_number asc nulls last;

alter view raipur_leaderboard set (security_invoker = true);
