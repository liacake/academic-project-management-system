import { Role } from '../types';

/** Only students expose student_id in the UI. */
export function visibleStudentId(role: Role, studentId?: string | null): string | undefined {
  if (role !== 'student') return undefined;
  const id = studentId?.trim();
  return id || undefined;
}
