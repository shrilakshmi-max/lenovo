-- Run once in the Supabase SQL editor to add Round 2 to an already-deployed
-- database. Safe to re-run.

alter table teams add column if not exists round2_qualified boolean not null default false;

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
