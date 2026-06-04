-- Allows administrators to delete student, coordinator, and guest accounts.
-- Run in Supabase SQL Editor after schema.sql.

create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_target_role text;
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Not authorized';
  end if;

  if target_id = auth.uid() then
    raise exception 'Cannot delete your own account';
  end if;

  select role into v_target_role from public.profiles where id = target_id;
  if v_target_role is null then
    raise exception 'User not found';
  end if;

  if v_target_role = 'admin' then
    raise exception 'Cannot delete administrator accounts';
  end if;

  delete from auth.users where id = target_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;
