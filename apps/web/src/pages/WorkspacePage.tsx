import { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSession, signOut } from '../lib/auth-client';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import ProjectSidebar from '../components/ProjectSidebar';
import KanbanColumn from '../components/KanbanColumn';
import TaskCard from '../components/TaskCard';
import TaskDetailPanel from '../components/TaskDetailPanel';
import QuickAddBar, { QuickAddBarRef } from '../components/QuickAddBar';
import SettingsModal from '../components/SettingsModal';
import type { Task } from '@taskflow/shared';
import { pageVariants } from '../hooks/usePageTransition';

export default function WorkspacePage() {
  const { data: session } = useSession();
  const {
    columns, projects, labels, loading, error,
    activeProjectId, setActiveProjectId,
    addTask, updateTask, deleteTask, moveTask,
    addProject, deleteProject, refetch,
  } = useWorkspaceData();

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const sensors = useSensors(pointerSensor);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const quickAddRef = useRef<QuickAddBarRef>(null);

  const currentSelectedTask = useMemo(() => {
    if (!selectedTask) return null;
    return columns.flatMap(c => c.tasks).find(t => t.id === selectedTask.id) || null;
  }, [selectedTask, columns]);

  const shortcuts = useMemo(() => ({
    'n': () => quickAddRef.current?.focus(),
    '[': () => setSidebarCollapsed(prev => !prev),
    'escape': () => setSelectedTask(null),
  }), []);
  useKeyboardShortcuts(shortcuts);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveTask(columns.flatMap(c => c.tasks).find(t => t.id === e.active.id) || null);
  }, [columns]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveTask(null);
    if (!e.over) return;
    const overId = e.over.id as string;
    let targetColumnId = columns.find(c => c.id === overId)?.id;
    if (!targetColumnId) {
      targetColumnId = columns.find(c => c.tasks.some(t => t.id === overId))?.id;
    }
    if (targetColumnId) moveTask(e.active.id as string, targetColumnId);
  }, [moveTask, columns]);

  const handleQuickAdd = useCallback(async (raw: string) => {
    const col = columns[0];
    if (!col) return;
    let title = raw;
    let priority: 'low' | 'medium' | 'high' | 'urgent' | undefined;
    const m = raw.match(/\s+!(low|med|medium|high|urgent)\s*$/i);
    if (m) { title = raw.slice(0, m.index).trim(); const p = m[1].toLowerCase(); priority = p === 'med' ? 'medium' : p as any; }
    const task = await addTask(col.id, title, undefined, priority ? { priority } : undefined);
    if (task) setSelectedTask(task);
  }, [columns, addTask]);

  const allTasks = columns.flatMap(c => c.tasks);
  const overdueCount = allTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
  const activeProject = projects.find(p => p.id === activeProjectId);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-5 w-5 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      <p className="text-[13px] text-red-400/80">{error}</p>
      <button onClick={refetch} className="text-[12px] text-accent hover:text-accent-hover transition-colors">Retry</button>
    </div>
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex h-screen flex-col bg-base">
      {/* Header */}
      <header className="flex-shrink-0 bg-[#131316] border-b border-[#1e1e23] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[14px] font-semibold tracking-tight text-[#e0e0e5]">
            <span className="text-accent">Task</span>Flow
          </span>
          {activeProject && (
            <>
              <span className="text-[#333340]">/</span>
              <span className="flex items-center gap-1.5">
                <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: activeProject.color }} />
                <span className="text-[12px] text-[#808090]">{activeProject.title}</span>
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSettingsOpen(true)}
            className="h-6 w-6 rounded-full bg-accent/12 hover:bg-accent/20 flex items-center justify-center text-[10px] font-medium text-accent transition-colors"
            title="Settings"
          >
            {session?.user.name?.[0]?.toUpperCase()}
          </button>
          <button onClick={() => signOut()} className="text-[11px] text-[#4a4a58] hover:text-[#808090] transition-colors">
            Sign out
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar
          projects={projects}
          activeProjectId={activeProjectId}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSelectProject={setActiveProjectId}
          onCreateProject={addProject}
          onDeleteProject={deleteProject}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 pt-4 pb-3">
            <QuickAddBar ref={quickAddRef} onAdd={handleQuickAdd} />
          </div>

          <div className="flex-1 overflow-x-auto px-5">
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex h-full gap-5 pb-4">
                <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                  {columns.map((col, i) => (
                    <motion.div
                      key={col.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                    >
                      <KanbanColumn
                        column={col}
                        onAddTask={async (colId, title, extra) => {
                          const task = await addTask(colId, title, undefined, extra);
                          if (task) setSelectedTask(task);
                        }}
                        onTaskClick={task => setSelectedTask(task)}
                      />
                    </motion.div>
                  ))}
                </SortableContext>
              </div>
              <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
                {activeTask && <div className="rotate-1 opacity-75 w-[280px]"><TaskCard task={activeTask} /></div>}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Status bar */}
          <div className="flex-shrink-0 border-t border-[#1a1a1f] px-5 py-1.5 flex items-center gap-4 text-[10px] text-[#3a3a44]">
            <span>{allTasks.length} tasks</span>
            {overdueCount > 0 && (
              <span className="text-red-400/40">{overdueCount} overdue</span>
            )}
          </div>
        </div>

        <AnimatePresence>
          {currentSelectedTask && (
            <TaskDetailPanel
              task={currentSelectedTask}
              projects={projects}
              labels={labels}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onClose={() => setSelectedTask(null)}
            />
          )}
        </AnimatePresence>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </motion.div>
  );
}
