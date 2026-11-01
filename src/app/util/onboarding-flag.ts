const DONE_PREFIX = 'comzhichi_onboarding_done_';

function doneKey(email: string): string {
  return DONE_PREFIX + email.trim().toLowerCase();
}

/**
 * El onboarding se considera pendiente la primera vez que una cuenta de estudiante
 * inicia sesión, y deja de estarlo una vez que lo completa.
 */
export function isOnboardingCompleted(email: string | null | undefined): boolean {
  if (!email) return false;
  try {
    return localStorage.getItem(doneKey(email)) === 'true';
  } catch {
    return false;
  }
}

export function markOnboardingCompleted(email: string | null | undefined): void {
  if (!email) return;
  try {
    localStorage.setItem(doneKey(email), 'true');
  } catch {
    /* ignore */
  }
}
