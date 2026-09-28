-- Run once in the Supabase SQL editor, after 007_pune_spot_registration.sql,
-- to make table assignment overflow past 72 instead of erroring out once a
-- group's fixed range is full. Safe to re-run (create or replace).
--
-- Once a group's own 1-72 range is exhausted, the next team routed to that
-- group gets the next sequential number starting at 73 (74, 75, ...) - no
-- solo/two-person distinction in that range. Which group a team lands in
-- is unaffected (still the existing round robin in register_pune_team /
-- register_new_pune_team), so overflow teams keep splitting evenly across
-- the 4 judge groups automatically.

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
