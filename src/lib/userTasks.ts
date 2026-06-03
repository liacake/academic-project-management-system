import { Project, Task } from '../types';

export interface TaskWithProject {
  task: Task;
  project: Project;
}

export function getAssignedTasks(
  projects: Project[],
  userId: string,
  options?: { openOnly?: boolean }
): TaskWithProject[] {
  const openOnly = options?.openOnly ?? false;
  return projects.flatMap(project =>
    project.tasks
      .filter(t => t.assigneeId === userId && (!openOnly || t.status !== 'done'))
      .map(task => ({ task, project }))
  );
}

export function countAssignedOpenTasks(projects: Project[], userId: string): number {
  return getAssignedTasks(projects, userId, { openOnly: true }).length;
}
