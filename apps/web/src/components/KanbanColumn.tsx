import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import type { Column, Task, TaskPriority } from '@taskflow/shared';

interface Props {
  column: Column & { tasks: Task[] };
  onAddTask: (columnId: string, title: string, extra?: { description?: string; priority?: TaskPriority }) => void;
  onTaskClick?: (task: Task) => void;
}

export default function KanbanColumn({ column, onAddTask, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const resetForm = () => { setNewTitle(''); setAdding(false); };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddTask(column.id, newTitle.trim());
    resetForm();
  };

  return (
    <div className="flex w-[280px] flex-shrink-0 flex-col gap-1.5">
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 py-1">
        <span className="text-[12px] font-medium text-[#808090]">{column.title}</span>
        <span className="text-[11px] text-[#4a4a58] tabular-nums">{column.tasks.length}</span>
      </div>

      {/* Drop Zone */}
      <motion.div
        ref={setNodeRef}
        animate={{ backgroundColor: isOver ? 'rgba(129,140,248,0.03)' : 'transparent' }}
        transition={{ duration: 0.15 }}
        className="flex-1 overflow-y-auto rounded-xl p-0.5 min-h-[200px] space-y-[6px]"
      >
        <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {column.tasks.map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <TaskCard task={task} onClick={() => onTaskClick?.(task)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
      </motion.div>

      {/* Add Task */}
      <AnimatePresence mode="wait">
        {adding ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="rounded-[10px] bg-[#1e1e23] border border-[#2a2a30] p-3"
          >
            <input
              autoFocus
              type="text"
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') resetForm();
              }}
              className="w-full bg-transparent text-[13px] text-[#e0e0e5] placeholder-[#555560] outline-none mb-2.5"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                className="flex-1 rounded-lg bg-accent py-1.5 text-[12px] font-medium text-white hover:bg-accent-hover disabled:opacity-25 transition-colors"
              >
                Create
              </button>
              <button
                onClick={resetForm}
                className="rounded-lg bg-[#2a2a30] px-3 py-1.5 text-[12px] text-[#6b6b78] hover:text-[#9090a0] transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] text-[#4a4a58] hover:text-[#7a7a88] transition-colors"
          >
            <span className="text-[14px] leading-none">+</span> Add task
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}
