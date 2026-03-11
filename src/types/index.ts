export type Role = 'student' | 'coordinator' | 'admin' | 'guest';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'archived';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  studentId?: string;
}

export interface Technology {
  id: string;
  name: string;
  category: 'language' | 'framework' | 'tool' | 'database' | 'cloud' | 'other';
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: string;
  projectId: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  technologies: Technology[];
  members: User[];
  tasks: Task[];
  ownerId: string;
  semester?: string;
  year?: number;
  repositoryUrl?: string;
  demoUrl?: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}
