-- Run in Supabase SQL Editor if schema was applied before admin user management.
-- Allows administrators to change roles on any profile (Week 4 RBAC).

create policy "Admins can update any profile"
  on public.profiles for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
