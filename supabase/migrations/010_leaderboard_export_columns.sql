-- Run once in the Supabase SQL editor to add the columns the CSV export
-- page needs (leader/member2 names, project link) to the leaderboard
-- views. Safe to re-run.
--
-- Postgres only allows CREATE OR REPLACE VIEW to add columns at the very
-- end of the column list - inserting them earlier shifts the position of
-- existing columns, which Postgres treats as an (disallowed) rename. The
-- new columns are appended at the end here for that reason.

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
