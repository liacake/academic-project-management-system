-- Auto-assign unique student_id from email local-part for student profiles.
-- Run in Supabase SQL Editor on existing projects (schema.sql updated for fresh installs).

create unique index if not exists profiles_student_id_unique
  on public.profiles (student_id)
  where student_id is not null;

create or replace function public.derive_student_id(p_email text)
returns text
language plpgsql
as $$
declare
  base text;
  candidate text;
  suffix int := 2;
begin
  base := lower(trim(split_part(p_email, '@', 1)));
  if base = '' then
    base := 'user';
  end if;

  candidate := base;
  if not exists (select 1 from public.profiles where student_id = candidate) then
    return candidate;
  end if;

  loop
    candidate := base || suffix::text;
    if not exists (select 1 from public.profiles where student_id = candidate) then
      return candidate;
    end if;
    suffix := suffix + 1;
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_student_id text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'student');

  if v_role = 'student' then
    v_student_id := public.derive_student_id(new.email);
  else
    v_student_id := null;
  end if;

  insert into public.profiles (id, name, email, role, student_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    v_role,
    v_student_id
  );

  return new;
end;
$$;

-- Backfill students missing student_id (skips rows that would conflict)
update public.profiles p
set student_id = public.derive_student_id(p.email)
where p.role = 'student'
  and (p.student_id is null or trim(p.student_id) = '');
