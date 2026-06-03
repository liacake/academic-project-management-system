-- Create ENUM type for domain rule classification
do $$ begin
  create type signup_email_domain_type as enum ('allow', 'deny');
exception
  when duplicate_object then null;
end $$;

-- Table of allowed/denied domains
create table if not exists public.signup_email_domains (
  id serial primary key,
  domain text not null,
  type signup_email_domain_type not null,
  reason text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create the hook function that checks the email domain
create or replace function public.hook_restrict_signup_by_email_domain(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  email text;
  domain text;
  is_allowed int;
begin
  email := event->'user'->>'email';
  domain := split_part(email, '@', 2);

  -- Allow only exact domain match
  select count(*) into is_allowed
  from public.signup_email_domains
  where type = 'allow'
    and lower(domain) = lower($1);

  if is_allowed > 0 then
    return '{}'::jsonb; -- allow signup
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'message', 'Signups from this email domain are not allowed.',
      'http_code', 403
    )
  );
end;
$$;

-- Permissions
grant execute on function public.hook_restrict_signup_by_email_domain to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_by_email_domain from authenticated, anon, public;

-- Seed allowed domain
insert into public.signup_email_domains (domain, type, reason)
values ('esg.ipsantarem.pt', 'allow', 'Company domain')
on conflict do nothing;
