const STORAGE_KEY_PREFIX = 'apms:lastProject:';

export function getLastViewedProjectId(userId: string | undefined): string | null {
  if (!userId) return null;
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export function setLastViewedProjectId(userId: string | undefined, projectId: string): void {
  if (!userId || !projectId) return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, projectId);
  } catch {
    /* storage unavailable */
  }
}

/** Prefer explicit navigation target, then last viewed, then fallback. */
export function pickDefaultProjectId(options: {
  userId: string | undefined;
  accessibleIds: string[];
  preferredId?: string | null;
  fallbackId?: string | null;
}): string {
  const { userId, accessibleIds, preferredId, fallbackId } = options;
  const accessible = new Set(accessibleIds);
  const ok = (id: string | null | undefined) => !!id && accessible.has(id);

  if (ok(preferredId)) return preferredId!;
  const last = getLastViewedProjectId(userId);
  if (ok(last)) return last!;
  if (ok(fallbackId)) return fallbackId!;
  return accessibleIds[0] ?? '';
}
