-- Run once in the Supabase SQL editor after the evaluator name change.
-- The scores table was empty at the time this was written, so no data
-- migration is needed - just the constraint.

alter table scores drop constraint if exists scores_evaluator_name_check;
alter table scores add constraint scores_evaluator_name_check
  check (
    evaluator_name in (
      'Amit', 'Saurabh', 'Neha', 'Nishant', 'Priyanshi', 'Yash/Utkarsh', 'Amanpreet', 'Ayush'
    )
  );
