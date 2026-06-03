-- Week 4: administrators may delete any project, not only those they own.
-- Run in Supabase SQL Editor on existing databases.

create policy "Admins can delete any project"
  on public.projects for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
