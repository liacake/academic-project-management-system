-- Task permissions: coordinator delete, student self-assign create, assignee status updates.
-- Run in Supabase SQL Editor after schema.sql.

drop policy if exists "Owners can delete tasks" on public.tasks;

create policy "Members can create self-assigned tasks"
  on public.tasks for insert with check (
    assignee_id = auth.uid()
    and public.is_project_member(project_id)
  );

create policy "Assignees can update their assigned tasks"
  on public.tasks for update
  using (
    assignee_id = auth.uid()
    and public.is_project_member(project_id)
  )
  with check (
    assignee_id = auth.uid()
    and public.is_project_member(project_id)
  );

drop policy if exists "Owners and coordinators can delete tasks" on public.tasks;

create policy "Owners and coordinators can delete tasks"
  on public.tasks for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or p.coordinator_id = auth.uid())
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
