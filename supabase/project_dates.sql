-- Week 2 project timeline fields. Run in Supabase SQL Editor on existing databases.

alter table public.projects
  add column if not exists start_date date,
  add column if not exists end_date date;
