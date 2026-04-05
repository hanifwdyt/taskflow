import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '@taskflow/shared';
import { PROJECT_COLORS } from '@taskflow/shared';

interface Props {
  projects: Project[];
  activeProjectId: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onSelectProject: (id: string | null) => void;
  onCreateProject: (title: string, color: string) => void;
  onDeleteProject: (id: string) => void;
}

export default function ProjectSidebar({
  projects, activeProjectId, collapsed, onToggle,
  onSelectProject, onCreateProject, onDeleteProject,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState<string>(PROJECT_COLORS[0]);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    onCreateProject(newTitle.trim(), newColor);
    setNewTitle('');
    setCreating(false);
    setNewColor(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)] as string);
  };

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 48 : 200 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="flex-shrink-0 h-full flex flex-col bg-[#131316] border-r border-[#1e1e23] overflow-hidden"
      >
        <div className="flex items-center justify-between px-3 py-3">
          {!collapsed && <span className="text-[11px] font-medium text-[#555560]">Projects</span>}
          <button onClick={onToggle} className="p-1 rounded text-[#555560] hover:text-[#808090] transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d={collapsed ? "M5 3l4 4-4 4" : "M9 3l-4 4 4 4"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* All */}
        <button
          onClick={() => onSelectProject(null)}
          className={`flex items-center gap-2 px-3 py-[7px] text-left transition-colors ${
            activeProjectId === null ? 'bg-accent/[0.07] text-accent' : 'text-[#808090] hover:text-[#b0b0c0] hover:bg-white/[0.02]'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
            <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
            <rect x="8" y="1.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
            <rect x="1.5" y="8" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
            <rect x="8" y="8" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
          </svg>
          {!collapsed && <span className="text-[12px] font-medium">All</span>}
        </button>

        {/* Projects */}
        <div className="flex-1 overflow-y-auto py-0.5">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              onContextMenu={(e) => { e.preventDefault(); setContextMenu({ id: project.id, x: e.clientX, y: e.clientY }); }}
              className={`w-full flex items-center gap-2 px-3 py-[7px] text-left transition-colors ${
                activeProjectId === project.id
                  ? 'bg-white/[0.04] text-[#d0d0d8]'
                  : 'text-[#707080] hover:text-[#a0a0b0] hover:bg-white/[0.02]'
              }`}
            >
              <span className="h-[7px] w-[7px] rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
              {!collapsed && (
                <>
                  <span className="text-[12px] truncate flex-1">{project.title}</span>
                  {project.taskCount !== undefined && project.taskCount > 0 && (
                    <span className="text-[10px] text-[#4a4a58] tabular-nums">{project.taskCount}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Create */}
        <div className="border-t border-[#1e1e23] p-2">
          <AnimatePresence mode="wait">
            {creating && !collapsed ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <input
                  autoFocus
                  type="text"
                  placeholder="Name"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
                  className="w-full rounded-lg bg-[#0f0f12] border border-[#2a2a30] px-2.5 py-1.5 text-[12px] text-[#e0e0e5] placeholder-[#4a4a58] outline-none focus:border-accent/25 transition-colors"
                />
                <div className="flex flex-wrap gap-[5px]">
                  {PROJECT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`h-[14px] w-[14px] rounded-full transition-transform ${newColor === color ? 'scale-[1.3] ring-1 ring-white/20' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={handleCreate} className="flex-1 rounded-lg bg-accent py-1 text-[11px] font-medium text-white">Create</button>
                  <button onClick={() => setCreating(false)} className="flex-1 rounded-lg bg-[#2a2a30] py-1 text-[11px] text-[#6b6b78]">Cancel</button>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-[#4a4a58] hover:text-[#7a7a88] transition-colors"
              >
                <span className="text-[13px] leading-none">+</span>
                {!collapsed && <span>New</span>}
              </button>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-50 bg-[#222228] border border-[#333340] rounded-lg py-1 min-w-[100px] shadow-2xl"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                onClick={() => { onDeleteProject(contextMenu.id); setContextMenu(null); }}
                className="w-full px-3 py-1.5 text-left text-[12px] text-red-400/80 hover:bg-red-400/10 transition-colors"
              >
                Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
