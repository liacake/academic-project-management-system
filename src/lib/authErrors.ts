import strings from '../components/ui/strings';

export const ALLOWED_EMAIL_DOMAIN = 'esg.ipsantarem.pt';

export function isAllowedSignupEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1];
  return domain === ALLOWED_EMAIL_DOMAIN;
}

function isEmailDomainRestrictionError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('hook_restrict_signup_by_email_domain') ||
    lower.includes('restrict_signup_by_email_domain')
  );
}

export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (isEmailDomainRestrictionError(message)) {
    return strings.auth.domainNotAllowed;
  }
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return strings.auth.emailNotConfirmed;
  }
  return message;
}
