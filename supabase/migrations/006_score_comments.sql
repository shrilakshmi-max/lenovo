-- Run once in the Supabase SQL editor to add an optional evaluator
-- comment to every scoring table. Safe to re-run.

alter table scores add column if not exists comment text;
alter table round2_scores add column if not exists comment text;
alter table pune_scores add column if not exists comment text;
