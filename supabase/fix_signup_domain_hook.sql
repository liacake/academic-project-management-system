-- Fix 500 on signup: hook used lower($1) on the jsonb event instead of the email domain.
-- Run in Supabase SQL Editor, then retry signup with an @esg.ipsantarem.pt address.

create unique index if not exists signup_email_domains_domain_lower_key
  on public.signup_email_domains (lower(domain));

create or replace function public.hook_restrict_signup_by_email_domain(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_domain text;
  v_allowed int;
  v_denied int;
begin
  v_email := event->'user'->>'email';
  v_domain := lower(trim(split_part(coalesce(v_email, ''), '@', 2)));

  if v_domain is null or v_domain = '' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'A valid email address is required.',
        'http_code', 400
      )
    );
  end if;

  select count(*) into v_allowed
  from public.signup_email_domains d
  where d.type = 'allow'
    and lower(d.domain) = v_domain;

  if v_allowed > 0 then
    return '{}'::jsonb;
  end if;

  select count(*) into v_denied
  from public.signup_email_domains d
  where d.type = 'deny'
    and lower(d.domain) = v_domain;

  if v_denied > 0 then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Signups from this email domain are not allowed.',
        'http_code', 403
      )
    );
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'message', 'Signups from this email domain are not allowed.',
      'http_code', 403
    )
  );
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant select on table public.signup_email_domains to supabase_auth_admin;
grant execute on function public.hook_restrict_signup_by_email_domain(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_by_email_domain(jsonb) from authenticated, anon, public;

insert into public.signup_email_domains (domain, type, reason)
values ('esg.ipsantarem.pt', 'allow', 'Institution domain')
on conflict ((lower(domain))) do nothing;
