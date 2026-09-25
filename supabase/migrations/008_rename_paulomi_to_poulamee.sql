-- Run once in the Supabase SQL editor to rename the Pune evaluator
-- "Paulomi" to "Poulamee". Updates any existing pune_scores rows first,
-- then the check constraint - safe to run even if no scores exist yet.

update pune_scores set evaluator_name = 'Poulamee' where evaluator_name = 'Paulomi';

alter table pune_scores drop constraint if exists pune_scores_evaluator_name_check;
alter table pune_scores add constraint pune_scores_evaluator_name_check
  check (
    evaluator_name in ('Poulamee', 'Amit', 'Yogesh', 'Rushikesh', 'Mayuresh', 'Tushar', 'Pramay', 'Utkarsh')
  );
