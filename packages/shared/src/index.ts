export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export const PROJECT_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#6366F1',
  '#F43F5E', '#84CC16',
] as const;

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  color: string;
  icon?: string;
  userId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
  position: number;
  createdAt: string;
}

export interface Board {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  boardId?: string;
  userId?: string;
  position: number;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  effort?: number;
  columnId?: string;
  boardId?: string;
  projectId?: string;
  userId: string;
  position: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  labels?: Label[];
  subtasks?: Subtask[];
  project?: Project;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
