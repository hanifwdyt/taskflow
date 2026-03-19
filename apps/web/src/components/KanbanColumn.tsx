import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import type { Column, Task } from '@taskflow/shared';

interface Props {
  column: Column & { tasks: Task[] };
  onAddTask: (columnId: string, title: string) => void;
}

export default function KanbanColumn({ column, onAddTask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddTask(column.id, newTitle.trim());
    setNewTitle('');
    setAdding(false);
  };

  return (
    <div className="flex w-72 flex-shrink-0 flex-col gap-2">
      {/* Column Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold tracking-widest uppercase text-white/40 font-mono">
          {column.title}
        </span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/[0.05] px-1.5 text-[10px] font-mono text-white/25">
          {column.tasks.length}
        </span>
      </div>

      {/* Drop Zone */}
      <motion.div
        ref={setNodeRef}
        animate={{
          backgroundColor: isOver ? 'rgba(0,212,255,0.04)' : 'rgba(255,255,255,0.01)',
          borderColor: isOver ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.04)',
        }}
        transition={{ duration: 0.2 }}
        className="flex-1 overflow-y-auto rounded-2xl border p-2 min-h-48 space-y-2"
      >
        <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {column.tasks.map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <TaskCard task={task} />
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <input
              autoFocus
              type="text"
              placeholder="Task title..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
              className="w-full rounded-xl bg-white/[0.04] border border-cyber-400/20 px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-cyber-400/40 transition-all"
            />
            <div className="flex gap-2">
              <motion.button
                onClick={handleAdd}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 rounded-lg bg-cyber-400 py-1.5 text-xs font-semibold text-dark-400 hover:bg-cyber-300"
              >
                Add
              </motion.button>
              <motion.button
                onClick={() => setAdding(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 rounded-lg glass border border-white/5 py-1.5 text-xs text-white/30 hover:text-white/60"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="add-btn"
            onClick={() => setAdding(true)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-all"
          >
            <span className="text-base font-light">+</span> Add task
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
