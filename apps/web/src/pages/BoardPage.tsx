import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanColumn from '../components/KanbanColumn';
import TaskCard from '../components/TaskCard';
import { pageVariants } from '../hooks/usePageTransition';
import type { Column, Task, Board } from '@taskflow/shared';

interface BoardData extends Board {
  columns: (Column & { tasks: Task[] })[];
}

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const [board, setBoard] = useState<BoardData | null>(null);
  const [error, setError] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/boards/${id}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(res => {
        if (!res.data) throw new Error('Board not found');
        setBoard(res.data);
      })
      .catch(e => setError(e.message || 'Failed to load board'));
  }, [id]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = board?.columns.flatMap(c => c.tasks).find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !board) return;

    const targetColumnId = over.id as string;
    const taskId = active.id as string;

    // Optimistic update
    const prevBoard = board;
    setBoard(prev => {
      if (!prev) return prev;
      const task = prev.columns.flatMap(c => c.tasks).find(t => t.id === taskId);
      if (!task) return prev;
      return {
        ...prev,
        columns: prev.columns.map(col => ({
          ...col,
          tasks: col.id === targetColumnId
            ? [...col.tasks.filter(t => t.id !== taskId), { ...task, columnId: targetColumnId }]
            : col.tasks.filter(t => t.id !== taskId),
        })),
      };
    });
    setActiveTask(null);

    // Persist to API, rollback on failure
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnId: targetColumnId }),
    });
    if (!res.ok) setBoard(prevBoard);
  };

  const addTask = async (columnId: string, title: string) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, columnId, boardId: id }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.data) return;
    setBoard(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.map(col =>
          col.id === columnId ? { ...col, tasks: [...col.tasks, data.data] } : col
        ),
      };
    });
  };

  if (error) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <p className="text-sm text-red-400/70">Failed to load board: {error}</p>
      <Link to="/" className="text-xs text-cyber-400/70 hover:text-cyber-400 transition-colors font-mono">
        ← back to boards
      </Link>
    </div>
  );

  if (!board) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-cyber-400/30 border-t-cyber-400 animate-spin" />
    </div>
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex h-screen flex-col overflow-hidden"
    >
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 glass border-b border-white/[0.05] px-6 py-4 flex items-center gap-4"
      >
        <Link to="/" className="text-white/30 hover:text-white/60 transition-colors text-sm font-mono">
          &larr; boards
        </Link>
        <span className="text-white/10">/</span>
        <h1 className="font-semibold text-white/80">{board.title}</h1>
      </motion.header>

      <div className="flex-1 overflow-x-auto p-6">
        <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex h-full gap-4 pb-4"
          >
            <SortableContext items={board.columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              {board.columns.map((col, i) => (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <KanbanColumn column={col} onAddTask={addTask} />
                </motion.div>
              ))}
            </SortableContext>
          </motion.div>
          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
            {activeTask && (
              <div className="rotate-2 opacity-90 w-72">
                <TaskCard task={activeTask} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </motion.div>
  );
}
