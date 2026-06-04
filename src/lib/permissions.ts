import { Project, Role, Task, User } from '../types';

export function canCreateProjects(role?: Role): boolean {
  return role === 'student' || role === 'coordinator' || role === 'admin';
}

export function canViewAllProjects(role?: Role): boolean {
  return role === 'coordinator' || role === 'admin';
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

export function isProjectMember(user: User | null | undefined, project: Project): boolean {
  if (!user) return false;
  return user.id === project.ownerId || project.members.some(m => m.id === user.id);
}

/** Full task edit (title, assignee, etc.) — project owner/coordinator or unassigned-coordinator member rules. */
export function canEditTask(user: User | null | undefined, project: Project): boolean {
  return canModifyProject(user, project);
}

export function canDeleteTask(user: User | null | undefined, project: Project): boolean {
  if (!user || user.role === 'guest') return false;
  if (user.role === 'admin') return true;
  return user.id === project.ownerId || user.id === project.coordinatorId;
}

/** Students (and others) may add a task assigned to themselves when they are project members. */
export function canCreateSelfAssignedTask(user: User | null | undefined, project: Project): boolean {
  if (!user || user.role === 'guest') return false;
  if (canModifyProject(user, project)) return true;
  return isProjectMember(user, project);
}

export function canMoveAssignedTask(
  user: User | null | undefined,
  task: Task,
  project: Project
): boolean {
  if (!user || !task.assigneeId || task.assigneeId !== user.id) return false;
  if (canModifyProject(user, project)) return true;
  return isProjectMember(user, project);
}

export function canChangeAssignedTaskStatus(
  user: User | null | undefined,
  task: Task,
  project: Project
): boolean {
  return canMoveAssignedTask(user, task, project);
}

/** Admins may delete student/coordinator/guest accounts, not admins or themselves. */
export function canDeleteUserAccount(actor: User | null | undefined, target: User): boolean {
  if (!actor || actor.role !== 'admin') return false;
  if (actor.id === target.id) return false;
  if (target.role === 'admin') return false;
  return true;
}
