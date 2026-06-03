-- Week 4: coordinators and admins can monitor all projects (not only memberships).
-- Run in Supabase SQL Editor on existing databases.

create policy "Coordinators and admins can view all projects"
  on public.projects for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('coordinator', 'admin'))
  );

create policy "Coordinators and admins can view all tasks"
  on public.tasks for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('coordinator', 'admin'))
  );
