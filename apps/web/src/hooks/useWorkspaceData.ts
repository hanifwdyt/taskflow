import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Column, Task, Project, Label, ApiResponse } from '@taskflow/shared';

interface WorkspaceData {
  columns: Column[];
  projects: Project[];
  labels: Label[];
}

export function useWorkspaceData() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWorkspace = useCallback(async (projectId?: string | null) => {
    try {
      const query = projectId ? `?projectId=${projectId}` : '';
      const res = await api.get<ApiResponse<WorkspaceData>>(`/api/workspace${query}`);
      if (res.data) {
        setColumns(res.data.columns);
        setProjects(res.data.projects);
        setLabels(res.data.labels);
      }
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspace(activeProjectId);
  }, [activeProjectId, fetchWorkspace]);

  const addTask = useCallback(async (
    columnId: string,
    title: string,
    projectId?: string | null,
    extra?: { description?: string; priority?: string },
  ) => {
    const res = await api.post<ApiResponse<Task>>('/api/tasks', {
      title,
      columnId,
      projectId: projectId || activeProjectId,
      ...extra,
    });
    if (res.data) {
      const enriched: Task = {
        ...res.data,
        labels: [],
        subtasks: [],
        project: projects.find(p => p.id === res.data!.projectId) || undefined,
      };
      setColumns(prev => prev.map(col =>
        col.id === columnId
          ? { ...col, tasks: [...col.tasks, enriched] }
          : col
      ));
      return enriched;
    }
    return undefined;
  }, [activeProjectId, projects]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task> & { labelIds?: string[] }) => {
    const res = await api.patch<ApiResponse<Task>>(`/api/tasks/${taskId}`, updates);
    if (res.data) {
      setColumns(prev => prev.map(col => ({
        ...col,
        tasks: col.tasks.map(t => t.id === taskId ? { ...t, ...res.data! } : t),
      })));

      // If columnId changed, move task between columns
      if (updates.columnId) {
        setColumns(prev => {
          const task = prev.flatMap(c => c.tasks).find(t => t.id === taskId);
          if (!task) return prev;
          return prev.map(col => ({
            ...col,
            tasks: col.id === updates.columnId
              ? [...col.tasks.filter(t => t.id !== taskId), { ...task, ...res.data! }]
              : col.tasks.filter(t => t.id !== taskId),
          }));
        });
      }
    }
    return res.data;
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    await api.delete(`/api/tasks/${taskId}`);
    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks.filter(t => t.id !== taskId),
    })));
  }, []);

  const moveTask = useCallback(async (taskId: string, targetColumnId: string) => {
    // Optimistic update
    setColumns(prev => {
      const task = prev.flatMap(c => c.tasks).find(t => t.id === taskId);
      if (!task) return prev;
      return prev.map(col => ({
        ...col,
        tasks: col.id === targetColumnId
          ? [...col.tasks.filter(t => t.id !== taskId), { ...task, columnId: targetColumnId }]
          : col.tasks.filter(t => t.id !== taskId),
      }));
    });

    try {
      await api.patch(`/api/tasks/${taskId}`, { columnId: targetColumnId });
    } catch {
      fetchWorkspace(activeProjectId);
    }
  }, [activeProjectId, fetchWorkspace]);

  const addProject = useCallback(async (title: string, color: string) => {
    const res = await api.post<ApiResponse<Project>>('/api/projects', { title, color });
    if (res.data) {
      setProjects(prev => [...prev, res.data!]);
    }
    return res.data;
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const res = await api.patch<ApiResponse<Project>>(`/api/projects/${id}`, updates);
    if (res.data) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...res.data! } : p));
    }
    return res.data;
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await api.delete(`/api/projects/${id}`);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
    fetchWorkspace(activeProjectId === id ? null : activeProjectId);
  }, [activeProjectId, fetchWorkspace]);

  return {
    columns, projects, labels, loading, error,
    activeProjectId, setActiveProjectId,
    addTask, updateTask, deleteTask, moveTask,
    addProject, updateProject, deleteProject,
    refetch: () => fetchWorkspace(activeProjectId),
  };
}
