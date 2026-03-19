import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSession, signOut } from '../lib/auth-client';
import { pageVariants, staggerContainer, staggerItem } from '../hooks/usePageTransition';
import type { Board } from '@taskflow/shared';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [boards, setBoards] = useState<Board[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    fetch('/api/boards', { credentials: 'include' })
      .then(r => r.json())
      .then(res => setBoards(res.data || []));
  }, []);

  const createBoard = async () => {
    if (!newBoardTitle.trim()) return;
    setCreating(true);
    const res = await fetch('/api/boards', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newBoardTitle }),
    });
    const data = await res.json();
    setBoards(prev => [...prev, data.data]);
    setNewBoardTitle('');
    setShowInput(false);
    setCreating(false);
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen p-6 max-w-6xl mx-auto"
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">
            <span className="text-gradient">Task</span>
            <span className="text-white/70">Flow</span>
          </h1>
          <p className="mt-0.5 text-xs font-mono text-white/25 tracking-widest uppercase">
            / boards
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {session?.user.image ? (
              <img src={session.user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyber-400/20 text-xs font-medium text-cyber-400">
                {session?.user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm text-white/40">{session?.user.name}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => signOut()}
            className="glass cyber-border rounded-lg px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Sign out
          </motion.button>
        </div>
      </motion.header>

      {/* New Board Input */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        {showInput ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-3"
          >
            <input
              autoFocus
              type="text"
              placeholder="Board name..."
              value={newBoardTitle}
              onChange={e => setNewBoardTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createBoard(); if (e.key === 'Escape') setShowInput(false); }}
              className="flex-1 rounded-xl bg-white/[0.04] border border-cyber-400/20 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyber-400/40 focus:ring-1 focus:ring-cyber-400/10 transition-all"
            />
            <motion.button
              onClick={createBoard}
              disabled={creating || !newBoardTitle.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-xl bg-cyber-400 px-5 py-2.5 text-sm font-semibold text-dark-400 hover:bg-cyber-300 disabled:opacity-40 transition-colors"
            >
              {creating ? '...' : 'Create'}
            </motion.button>
            <motion.button
              onClick={() => setShowInput(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="glass cyber-border rounded-xl px-4 py-2.5 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Cancel
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            onClick={() => setShowInput(true)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="group flex items-center gap-2 glass cyber-border rounded-xl px-5 py-2.5 text-sm text-white/40 hover:text-cyber-400 hover:border-cyber-400/30 transition-all"
          >
            <motion.span
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-light leading-none"
            >+</motion.span>
            New Board
          </motion.button>
        )}
      </motion.div>

      {/* Boards Grid */}
      {boards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="mb-4 text-4xl opacity-20">&#x2B21;</div>
          <p className="text-sm text-white/25">No boards yet. Create one to get started.</p>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {boards.map(board => (
            <motion.div key={board.id} variants={staggerItem}>
              <Link to={`/board/${board.id}`}>
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="group relative overflow-hidden glass cyber-border rounded-2xl p-5 hover:border-cyber-400/30 hover:shadow-cyber-sm transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyber-400/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <h3 className="font-semibold text-white/90 group-hover:text-white transition-colors">{board.title}</h3>
                    <p className="mt-1.5 font-mono text-[10px] text-white/20 tracking-wider uppercase">
                      {new Date(board.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="absolute bottom-3 right-3 h-1.5 w-1.5 rounded-full bg-cyber-400/30 group-hover:bg-cyber-400/60 transition-colors" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
