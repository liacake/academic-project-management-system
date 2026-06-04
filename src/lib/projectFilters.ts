import { Project, Role, User } from '../types';

export const PROJECTS_PAGE_SIZE = 20;

export function isProjectMember(project: Project, userId: string): boolean {
  return (
    project.ownerId === userId ||
    project.members.some(m => m.id === userId)
  );
}

export function isProjectCoordinator(project: Project, userId: string): boolean {
  return project.coordinatorId === userId;
}

export function showMyProjectsFilter(role?: Role): boolean {
  return role === 'student' || role === 'coordinator';
}

export function filterProjectsForRole(
  projects: Project[],
  user: User | null | undefined,
  myProjectsOnly: boolean
): Project[] {
  if (!user || !myProjectsOnly) return projects;
  if (user.role === 'student') {
    return projects.filter(p => isProjectMember(p, user.id));
  }
  if (user.role === 'coordinator') {
    return projects.filter(p => isProjectCoordinator(p, user.id));
  }
  return projects;
}
