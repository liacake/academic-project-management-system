import { Project, ProjectStatus, Role, Technology, User } from '../types';

export const PROJECTS_PAGE_SIZE = 20;

export const SEMESTER_OPTIONS = ['Spring', 'Summer', 'Fall', 'Winter'] as const;

export type MemberSizeFilter = 'any' | '1-2' | '3-5' | '6-10' | '11+';
export type VisibilityFilter = 'any' | 'public' | 'private';

export interface ProjectListFilters {
  search: string;
  status: ProjectStatus | 'all';
  semester: string;
  year: number | 'all';
  technologyIds: string[];
  memberSize: MemberSizeFilter;
  visibility: VisibilityFilter;
}

export const EMPTY_PROJECT_FILTERS: ProjectListFilters = {
  search: '',
  status: 'all',
  semester: 'all',
  year: 'all',
  technologyIds: [],
  memberSize: 'any',
  visibility: 'any',
};

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

export function getProjectMemberCount(project: Project): number {
  return project.members.length;
}

export function matchesMemberSize(count: number, filter: MemberSizeFilter): boolean {
  switch (filter) {
    case 'any': return true;
    case '1-2': return count >= 1 && count <= 2;
    case '3-5': return count >= 3 && count <= 5;
    case '6-10': return count >= 6 && count <= 10;
    case '11+': return count >= 11;
    default: return true;
  }
}

export function applyProjectListFilters(
  projects: Project[],
  filters: ProjectListFilters
): Project[] {
  const q = filters.search.trim().toLowerCase();

  return projects.filter(p => {
    if (q) {
      const matchSearch =
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.technologies.some(t => t.name.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    if (filters.status !== 'all' && p.status !== filters.status) return false;

    if (filters.semester !== 'all') {
      if (!p.semester || p.semester !== filters.semester) return false;
    }

    if (filters.year !== 'all' && p.year !== filters.year) return false;

    if (filters.technologyIds.length > 0) {
      const hasTech = filters.technologyIds.every(id =>
        p.technologies.some(t => t.id === id)
      );
      if (!hasTech) return false;
    }

    if (!matchesMemberSize(getProjectMemberCount(p), filters.memberSize)) return false;

    if (filters.visibility === 'public' && !p.isPublic) return false;
    if (filters.visibility === 'private' && p.isPublic) return false;

    return true;
  });
}

export interface ProjectFilterOptions {
  semesters: string[];
  years: number[];
  technologies: Technology[];
}

export function buildProjectFilterOptions(projects: Project[]): ProjectFilterOptions {
  const semesterSet = new Set<string>();
  const yearSet = new Set<number>();
  const techMap = new Map<string, Technology>();

  for (const p of projects) {
    if (p.semester) semesterSet.add(p.semester);
    for (const t of p.technologies) techMap.set(t.id, t);
    if (p.year != null) yearSet.add(p.year);
  }

  const standard = SEMESTER_OPTIONS.filter(s => semesterSet.has(s));
  const extra = [...semesterSet].filter(s => !(SEMESTER_OPTIONS as readonly string[]).includes(s)).sort();
  const semesters = [...standard, ...extra];

  return {
    semesters,
    years: [...yearSet].sort((a, b) => b - a),
    technologies: [...techMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function countActiveProjectFilters(filters: ProjectListFilters): number {
  let n = 0;
  if (filters.status !== 'all') n++;
  if (filters.semester !== 'all') n++;
  if (filters.year !== 'all') n++;
  if (filters.technologyIds.length > 0) n++;
  if (filters.memberSize !== 'any') n++;
  if (filters.visibility !== 'any') n++;
  return n;
}

export function sortProjects(
  projects: Project[],
  sortBy: 'updated' | 'created' | 'title'
): Project[] {
  return [...projects].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'created') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
