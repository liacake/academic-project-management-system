import { Project, Role, User } from '../types';

export function canCreateProjects(role?: Role): boolean {
  return role === 'student' || role === 'coordinator' || role === 'admin';
}

export function canModifyProject(user: User | null | undefined, project: Project): boolean {
  if (!user || user.role === 'guest') return false;
  if (user.role === 'admin') return true;
  const isOwner = user.id === project.ownerId;
  const isCoordinator = user.id === project.coordinatorId;
  const isMember = project.members.some(m => m.id === user.id);
  return isOwner || isCoordinator || (!project.coordinatorId && isMember);
}

export function canDeleteProject(user: User | null | undefined, project: Project): boolean {
  if (!user || user.role === 'guest') return false;
  if (user.role === 'admin') return true;
  return user.id === project.ownerId;
}
