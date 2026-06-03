import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Project, Task, TaskStatus, Technology, User } from '../types';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  error: string | null;
  selectProject: (id: string | null) => void;
  fetchProject: (id: string) => Promise<void>;
  updateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => Promise<void>;
  updateTask: (
    projectId: string,
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assigneeId' | 'dueDate'>>
  ) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addMember: (projectId: string, userId: string) => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

function dbToTech(t: Record<string, unknown>): Technology {
  return { id: t.id as string, name: t.name as string, category: t.category as Technology['category'], color: t.color as string };
}

function dbToUser(p: Record<string, unknown>): User {
  return {
    id: p.id as string, name: p.name as string, email: p.email as string,
    role: p.role as User['role'],
    studentId: (p.student_id ?? undefined) as string | undefined,
    avatar: (p.avatar ?? undefined) as string | undefined,
  };
}

function dbToTask(t: Record<string, unknown>): Task {
  return {
    id: t.id as string, title: t.title as string,
    description: (t.description ?? undefined) as string | undefined,
    status: t.status as TaskStatus,
    assigneeId: (t.assignee_id ?? undefined) as string | undefined,
    projectId: t.project_id as string,
    priority: t.priority as Task['priority'],
    dueDate: (t.due_date ?? undefined) as string | undefined,
    createdAt: t.created_at as string, updatedAt: t.updated_at as string,
  };
}

function dbToProject(p: Record<string, unknown>, techs: Technology[], members: User[], tasks: Task[]): Project {
  const coordinatorRaw = p.coordinator as Record<string, unknown> | null | undefined;
  return {
    id: p.id as string, title: p.title as string, description: p.description as string,
    status: p.status as Project['status'],
    ownerId: (p.owner_id ?? '') as string,
    coordinatorId: (p.coordinator_id ?? undefined) as string | undefined,
    coordinator: coordinatorRaw ? dbToUser(coordinatorRaw) : undefined,
    semester: (p.semester ?? undefined) as string | undefined,
    year: (p.year ?? undefined) as number | undefined,
    startDate: (p.start_date ?? undefined) as string | undefined,
    endDate: (p.end_date ?? undefined) as string | undefined,
    repositoryUrl: (p.repository_url ?? undefined) as string | undefined,
    demoUrl: (p.demo_url ?? undefined) as string | undefined,
    thumbnail: (p.thumbnail ?? undefined) as string | undefined,
    isPublic: p.is_public as boolean,
    createdAt: p.created_at as string, updatedAt: p.updated_at as string,
    technologies: techs, members, tasks,
  };
}

async function loadFullProject(projectId: string): Promise<Project | null> {
  const { data: p, error } = await supabase
    .from('projects')
    .select('*, coordinator:profiles!projects_coordinator_id_fkey(*)')
    .eq('id', projectId)
    .single();
  if (error || !p) return null;

  const [techRows, memberRows, taskRows] = await Promise.all([
    supabase.from('project_technologies').select('technologies(*)').eq('project_id', projectId),
    supabase.from('project_members').select('profiles(*)').eq('project_id', projectId),
    supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at'),
  ]);

  const techs   = (techRows.data ?? []).map((r: Record<string, unknown>) => dbToTech(r.technologies as Record<string, unknown>));
  const members = (memberRows.data ?? []).map((r: Record<string, unknown>) => dbToUser(r.profiles as Record<string, unknown>));
  const tasks   = (taskRows.data ?? []).map(dbToTask);
  return dbToProject(p as Record<string, unknown>, techs, members, tasks);
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects]               = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from('projects')
      .select(`*, coordinator:profiles!projects_coordinator_id_fkey(*), project_technologies(technologies(*)), project_members(profiles(*))`)
      .order('updated_at', { ascending: false });

    if (err) { setError(err.message); setLoading(false); return; }

    const mapped: Project[] = (data ?? []).map((p: Record<string, unknown>) => {
      const techs   = ((p.project_technologies as Array<Record<string, unknown>>) ?? []).map(r => dbToTech(r.technologies as Record<string, unknown>));
      const members = ((p.project_members as Array<Record<string, unknown>>) ?? []).map(r => dbToUser(r.profiles as Record<string, unknown>));
      return dbToProject(p, techs, members, []);
    });
    setProjects(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchProjects();
    else { setProjects([]); setSelectedProject(null); }
  }, [isAuthenticated, fetchProjects]);

  const selectProject = useCallback((id: string | null) => {
    if (!id) { setSelectedProject(null); return; }
    setSelectedProject(projects.find(p => p.id === id) ?? null);
  }, [projects]);

  const fetchProject = useCallback(async (id: string) => {
    const full = await loadFullProject(id);
    setSelectedProject(full);
    if (full) setProjects(prev => prev.map(p => p.id === id ? { ...full, tasks: full.tasks } : p));
  }, []);

  const addProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>): Promise<Project | null> => {
    const { data: proj, error: err } = await supabase.from('projects').insert({
      title: project.title, description: project.description, status: project.status,
      owner_id: project.ownerId, semester: project.semester ?? null, year: project.year ?? null,
      start_date: project.startDate ?? null, end_date: project.endDate ?? null,
      repository_url: project.repositoryUrl ?? null, demo_url: project.demoUrl ?? null, is_public: project.isPublic,
    }).select().single();

    if (err || !proj) { setError(err?.message ?? 'Failed to create project'); return null; }

    if (project.technologies.length > 0)
      await supabase.from('project_technologies').insert(project.technologies.map(t => ({ project_id: proj.id, technology_id: t.id })));
    if (project.members.length > 0)
      await supabase.from('project_members').insert(project.members.map(m => ({ project_id: proj.id, user_id: m.id })));

    await fetchProjects();
    return dbToProject(proj as Record<string, unknown>, project.technologies, project.members, []);
  }, [fetchProjects]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title       !== undefined) dbUpdates.title          = updates.title;
    if (updates.description !== undefined) dbUpdates.description    = updates.description;
    if (updates.status      !== undefined) dbUpdates.status         = updates.status;
    if (updates.semester    !== undefined) dbUpdates.semester       = updates.semester;
    if (updates.year        !== undefined) dbUpdates.year           = updates.year;
    if (updates.startDate   !== undefined) dbUpdates.start_date    = updates.startDate ?? null;
    if (updates.endDate     !== undefined) dbUpdates.end_date      = updates.endDate ?? null;
    if (updates.repositoryUrl !== undefined) dbUpdates.repository_url = updates.repositoryUrl;
    if (updates.demoUrl     !== undefined) dbUpdates.demo_url       = updates.demoUrl;
    if (updates.isPublic    !== undefined) dbUpdates.is_public      = updates.isPublic;
    if (updates.coordinatorId !== undefined) dbUpdates.coordinator_id = updates.coordinatorId ?? null;

    if (Object.keys(dbUpdates).length > 0) {
      const { error: err } = await supabase.from('projects').update(dbUpdates).eq('id', id);
      if (err) throw err;
    }

    if (updates.technologies !== undefined) {
      await supabase.from('project_technologies').delete().eq('project_id', id);
      if (updates.technologies.length > 0) {
        const { error: err } = await supabase.from('project_technologies').insert(
          updates.technologies.map(t => ({ project_id: id, technology_id: t.id }))
        );
        if (err) throw err;
      }
    }

    await fetchProjects();
    await fetchProject(id);
  }, [fetchProjects, fetchProject]);

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    setProjects(prev => prev.filter(p => p.id !== id));
    setSelectedProject(prev => prev?.id === id ? null : prev);
  }, []);

  const patchTaskInState = useCallback((projectId: string, taskId: string, patch: Partial<Task>) => {
    const updater = (t: Task) =>
      t.id === taskId ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t;
    setProjects(prev => prev.map(p => p.id !== projectId ? p : { ...p, tasks: p.tasks.map(updater) }));
    setSelectedProject(prev => prev?.id !== projectId ? prev : { ...prev, tasks: prev.tasks.map(updater) });
  }, []);

  const updateTaskStatus = useCallback(async (projectId: string, taskId: string, status: TaskStatus) => {
    const { error: err } = await supabase.from('tasks').update({ status }).eq('id', taskId);
    if (err) { setError(err.message); return; }
    patchTaskInState(projectId, taskId, { status });
  }, [patchTaskInState]);

  const updateTask = useCallback(async (
    projectId: string,
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assigneeId' | 'dueDate'>>
  ) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description ?? null;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.assigneeId !== undefined) dbUpdates.assignee_id = updates.assigneeId ?? null;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate ?? null;

    const { data, error: err } = await supabase.from('tasks').update(dbUpdates).eq('id', taskId).select().single();
    if (err || !data) { setError(err?.message ?? 'Failed to update task'); throw err ?? new Error('Failed to update task'); }
    patchTaskInState(projectId, taskId, dbToTask(data as Record<string, unknown>));
  }, [patchTaskInState]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error: err } = await supabase.from('tasks').insert({
      project_id: task.projectId, title: task.title, description: task.description ?? null,
      status: task.status, priority: task.priority,
      assignee_id: task.assigneeId ?? null, due_date: task.dueDate ?? null,
    }).select().single();
    if (err || !data) { setError(err?.message ?? 'Failed to add task'); return; }
    const newTask = dbToTask(data as Record<string, unknown>);
    const append = (p: Project) => p.id !== task.projectId ? p : { ...p, tasks: [...p.tasks, newTask] };
    setProjects(prev => prev.map(append));
    setSelectedProject(prev => prev?.id !== task.projectId ? prev : { ...prev, tasks: [...prev.tasks, newTask] });
  }, []);

  const addMember = useCallback(async (projectId: string, userId: string) => {
    await supabase.from('project_members').insert({ project_id: projectId, user_id: userId });
    await fetchProject(projectId);
  }, [fetchProject]);

  const removeMember = useCallback(async (projectId: string, userId: string) => {
    await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId);
    const remover = (p: Project) => p.id !== projectId ? p : { ...p, members: p.members.filter(m => m.id !== userId) };
    setProjects(prev => prev.map(remover));
    setSelectedProject(prev => prev?.id !== projectId ? prev : { ...prev, members: prev.members.filter(m => m.id !== userId) });
  }, []);

  return (
    <ProjectContext.Provider value={{
      projects, selectedProject, loading, error,
      selectProject, fetchProject, updateTaskStatus, updateTask,
      addProject, updateProject, deleteProject, addTask,
      addMember, removeMember,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = (): ProjectContextType => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectProvider');
  return ctx;
};
