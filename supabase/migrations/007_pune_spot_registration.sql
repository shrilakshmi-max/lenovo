-- Run once in the Supabase SQL editor, after 005_pune_register_function.sql,
-- to add spot/walk-in team registration. Safe to re-run (create or
-- replace). Extracts the table-assignment logic from register_pune_team
-- into a shared helper and adds register_new_pune_team for teams that were
-- never on the pre-uploaded roster.

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
    raise exception 'Group % is completely full - no table numbers left', p_group using errcode = 'P0001';
  end if;

  return v_table;
end;
$$;

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
