-- Run once in the Supabase SQL editor, after 004_pune_roster.sql, to add
-- the atomic table-number/group assignment function. Safe to re-run
-- (create or replace).

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
  v_regular integer[];
  v_solo integer[];
  v_num integer;
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

  case v_group
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

  if v_is_solo then
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
    raise exception 'Group % is completely full - no table numbers left', v_group using errcode = 'P0001';
  end if;

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
