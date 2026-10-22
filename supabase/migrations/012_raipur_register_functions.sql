-- Run once in the Supabase SQL editor, after 011_raipur.sql, to add
-- Raipur's table-assignment and registration functions. Safe to re-run
-- (create or replace).
--
-- Table assignment: Group g (1-5) gets a dedicated block of 10 table
-- numbers: (g-1)*10+1 .. (g-1)*10+10 (Group 1 = 1-10, ..., Group 5 =
-- 41-50). Two-person teams always get a fresh, exclusive table from that
-- block. One-person teams first look for an existing table in the block
-- that already holds exactly one other one-person team, so two solo teams
-- end up sharing a table - always within the same judge group, since the
-- search is scoped to that group's block. If none exists, they get a
-- fresh table too, which becomes available for the next solo team to pair
-- into. Once a group's block of 10 is exhausted, table numbers overflow
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
