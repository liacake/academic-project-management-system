import strings from '../components/ui/strings';

export const ALLOWED_EMAIL_DOMAIN = 'esg.ipsantarem.pt';

function isEmailDomainRestrictionError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('hook_restrict_signup_by_email_domain') ||
    lower.includes('restrict_signup_by_email_domain')
  );
}

export function formatAuthError(message: string): string {
  if (isEmailDomainRestrictionError(message)) {
    return strings.auth.domainNotAllowed;
  }
  return message;
}
