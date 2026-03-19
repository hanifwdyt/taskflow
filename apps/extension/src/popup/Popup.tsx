import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '@taskflow/shared';

const API_URL = 'http://localhost:3001';
const spring = { type: 'spring' as const, stiffness: 400, damping: 30 };

export default function Popup() {
  const [view, setView] = useState<'tasks' | 'add'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`, { credentials: 'include' });
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();
      setTasks(data.data || []);
    } catch {
      setError('Login at taskflow.hanif.app first');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), status: 'todo', priority: 'medium' }),
      });
      const data = await res.json();
      setTasks(prev => [data.data, ...prev]);
      setNewTitle('');
      setView('tasks');
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await fetch(`${API_URL}/api/tasks/${task.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  };

  const pending = tasks.filter(t => t.status !== 'done');
  const done = tasks.filter(t => t.status === 'done');

  return (
    <div className="flex flex-col" style={{ height: '460px' }}>
      {/* BG decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#00d4ff] opacity-[0.04] blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#00d4ff] opacity-[0.03] blur-2xl" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-white/[0.05] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 6h10M6 1v10M2 2l8 8M10 2L2 10" stroke="#00d4ff" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm font-semibold">
            <span className="text-[#00d4ff]">Task</span>
            <span className="text-white/60">Flow</span>
          </span>
        </div>
        <motion.button
          onClick={() => setView(view === 'add' ? 'tasks' : 'add')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={spring}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.07] text-white/40 hover:text-[#00d4ff] hover:border-[#00d4ff]/30 transition-colors"
        >
          <motion.span
            animate={{ rotate: view === 'add' ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-base font-light leading-none"
          >+</motion.span>
        </motion.button>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center"
            >
              <div className="h-5 w-5 rounded-full border-2 border-[#00d4ff]/20 border-t-[#00d4ff] animate-spin" />
            </motion.div>
          )}

          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
            >
              <div className="text-2xl opacity-30">&#x26A1;</div>
              <p className="text-xs text-white/30 leading-relaxed">{error}</p>
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-[#00d4ff] px-4 py-2 text-xs font-semibold text-[#050810] hover:bg-[#40f3ff] transition-colors"
              >
                Open TaskFlow
              </a>
            </motion.div>
          )}

          {!loading && !error && view === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-4 space-y-3"
            >
              <p className="text-xs font-mono text-white/25 uppercase tracking-widest">New Task</p>
              <textarea
                autoFocus
                placeholder="What needs to be done?"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addTask(); } }}
                rows={3}
                className="w-full resize-none rounded-xl bg-white/[0.04] border border-[#00d4ff]/20 px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#00d4ff]/40 transition-all"
              />
              <motion.button
                onClick={addTask}
                disabled={adding || !newTitle.trim()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-xl bg-[#00d4ff] py-2.5 text-sm font-semibold text-[#050810] hover:bg-[#40f3ff] disabled:opacity-30 transition-colors"
              >
                {adding ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2 border-[#050810]/30 border-t-[#050810] animate-spin" />
                    Adding...
                  </span>
                ) : 'Add Task'}
              </motion.button>
            </motion.div>
          )}

          {!loading && !error && view === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-3 space-y-1"
            >
              {pending.length === 0 && done.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <div className="text-3xl opacity-20">&#x2726;</div>
                  <p className="text-xs text-white/20">No tasks yet</p>
                </div>
              )}
              <AnimatePresence>
                {pending.map((task, i) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <PopupTaskItem task={task} onToggle={toggleTask} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {done.length > 0 && (
                <details className="pt-2">
                  <summary className="cursor-pointer text-[10px] font-mono text-white/20 uppercase tracking-widest hover:text-white/40 transition-colors select-none">
                    Completed ({done.length})
                  </summary>
                  <div className="mt-1 space-y-1 opacity-40">
                    {done.map(task => <PopupTaskItem key={task.id} task={task} onToggle={toggleTask} />)}
                  </div>
                </details>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative border-t border-white/[0.04] px-4 py-2.5">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="block text-center font-mono text-[10px] text-white/15 hover:text-[#00d4ff]/50 tracking-widest uppercase transition-colors"
        >
          Open Web App &#x2197;
        </a>
      </div>
    </div>
  );
}

function PopupTaskItem({ task, onToggle }: { task: Task; onToggle: (t: Task) => void }) {
  return (
    <motion.button
      onClick={() => onToggle(task)}
      whileHover={{ x: 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.03] transition-colors"
    >
      <motion.div
        animate={{
          backgroundColor: task.status === 'done' ? 'rgba(0,212,255,0.2)' : 'transparent',
          borderColor: task.status === 'done' ? 'rgba(0,212,255,0.6)' : 'rgba(255,255,255,0.15)',
        }}
        transition={{ duration: 0.2 }}
        className="relative flex-shrink-0 h-4 w-4 rounded border"
      >
        {task.status === 'done' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path d="M1 3l2 2 4-4" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        )}
      </motion.div>
      <span className={`text-xs leading-snug ${task.status === 'done' ? 'text-white/25 line-through' : 'text-white/70 group-hover:text-white/90'} transition-colors`}>
        {task.title}
      </span>
    </motion.button>
  );
}
