import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Task, Project, Label, Subtask, TaskPriority } from '@taskflow/shared';
import { api } from '../lib/api';
import type { ApiResponse } from '@taskflow/shared';

interface Props {
  task: Task;
  projects: Project[];
  labels: Label[];
  onUpdate: (taskId: string, updates: Partial<Task> & { labelIds?: string[] }) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
}

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#71717a' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

const EFFORTS = [1, 2, 3, 5, 8, 13];

// Parse due date without timezone conversion
const parseDueDate = (d?: string) => {
  if (!d) return '';
  // Handle ISO string: take the date part directly
  if (d.includes('T')) return d.split('T')[0];
  return d.substring(0, 10);
};

export default function TaskDetailPanel({ task, projects, labels, onUpdate, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [effort, setEffort] = useState<number | undefined>(task.effort);
  const [projectId, setProjectId] = useState<string | undefined>(task.projectId);
  const [dueDate, setDueDate] = useState(parseDueDate(task.dueDate));
  const [labelIds, setLabelIds] = useState<string[]>((task.labels || []).map(l => l.id));
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subtaskError, setSubtaskError] = useState('');
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const hasChanges =
    title.trim() !== task.title ||
    description !== (task.description || '') ||
    priority !== task.priority ||
    effort !== task.effort ||
    projectId !== task.projectId ||
    dueDate !== parseDueDate(task.dueDate) ||
    JSON.stringify([...labelIds].sort()) !== JSON.stringify((task.labels || []).map(l => l.id).sort());

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setEffort(task.effort);
    setProjectId(task.projectId);
    setDueDate(parseDueDate(task.dueDate));
    setLabelIds((task.labels || []).map(l => l.id));
    setSubtasks(task.subtasks || []);
    setConfirmDelete(false);
    setSaved(false);
    setSaving(false);
    setSubtaskError('');
  }, [task.id]);

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    const updates: Partial<Task> & { labelIds?: string[] } = {};
    if (title.trim() !== task.title) updates.title = title.trim();
    if (description !== (task.description || '')) updates.description = description;
    if (priority !== task.priority) updates.priority = priority;
    if (effort !== task.effort) updates.effort = effort;
    if (projectId !== task.projectId) updates.projectId = projectId;
    if (dueDate !== parseDueDate(task.dueDate)) updates.dueDate = dueDate || undefined;
    if (JSON.stringify([...labelIds].sort()) !== JSON.stringify((task.labels || []).map(l => l.id).sort())) {
      updates.labelIds = labelIds;
    }
    onUpdate(task.id, updates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    setSubtaskError('');
    try {
      const res = await api.post<ApiResponse<Subtask>>(`/api/tasks/${task.id}/subtasks`, { title: newSubtask.trim() });
      if (res.data) { setSubtasks(prev => [...prev, res.data!]); setNewSubtask(''); }
    } catch {
      setSubtaskError('Failed to add subtask');
      setTimeout(() => setSubtaskError(''), 3000);
    }
  };

  const toggleSubtask = async (s: Subtask) => {
    const updated = { ...s, completed: !s.completed };
    setSubtasks(prev => prev.map(x => x.id === s.id ? updated : x));
    try { await api.patch(`/api/subtasks/${s.id}`, { completed: updated.completed }); }
    catch {
      setSubtasks(prev => prev.map(x => x.id === s.id ? s : x));
      setSubtaskError('Failed to update subtask');
      setTimeout(() => setSubtaskError(''), 3000);
    }
  };

  const deleteSubtask = async (id: string) => {
    const prev = subtasks;
    setSubtasks(s => s.filter(x => x.id !== id));
    try { await api.delete(`/api/subtasks/${id}`); }
    catch {
      setSubtasks(prev);
      setSubtaskError('Failed to delete subtask');
      setTimeout(() => setSubtaskError(''), 3000);
    }
  };

  const completedCount = subtasks.filter(s => s.completed).length;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="w-[380px] flex-shrink-0 h-full bg-[#131316] border-l border-[#1e1e23] overflow-y-auto"
    >
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (confirmDelete) { onDelete(task.id); onClose(); }
              else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }
            }}
            className={`text-[11px] transition-colors ${confirmDelete ? 'text-red-400' : 'text-[#4a4a58] hover:text-red-400/70'}`}
          >
            {confirmDelete ? 'Confirm delete?' : 'Delete'}
          </button>
          <button onClick={onClose} className="text-[11px] text-[#4a4a58] hover:text-[#808090] transition-colors">
            Close
          </button>
        </div>

        {/* Title */}
        <textarea
          ref={titleRef}
          value={title}
          onChange={e => { setTitle(e.target.value); setSaved(false); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
          rows={1}
          className="w-full bg-transparent text-[18px] font-semibold text-[#ededf0] leading-tight outline-none placeholder-[#4a4a58] resize-none"
          placeholder="Task title"
        />

        {/* Properties grid */}
        <div className="space-y-3.5 text-[12px]">
          {/* Project */}
          <div className="flex items-start gap-3">
            <span className="w-[72px] flex-shrink-0 text-[#555560] pt-1">Project</span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => { setProjectId(undefined); setSaved(false); }}
                className={`rounded-md px-2 py-[3px] transition-colors ${!projectId ? 'bg-[#2a2a32] text-[#c0c0c8]' : 'text-[#555560] hover:bg-[#1e1e23]'}`}
              >
                —
              </button>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setProjectId(p.id); setSaved(false); }}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-[3px] transition-colors ${
                    projectId === p.id ? 'bg-[#2a2a32] text-[#c0c0c8]' : 'text-[#555560] hover:bg-[#1e1e23]'
                  }`}
                >
                  <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: p.color }} />
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-3">
            <span className="w-[72px] flex-shrink-0 text-[#555560]">Priority</span>
            <div className="flex gap-1">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  onClick={() => { setPriority(p.value); setSaved(false); }}
                  className={`flex items-center gap-1 rounded-md px-2 py-[3px] transition-colors ${
                    priority === p.value ? 'bg-[#2a2a32] text-[#c0c0c8]' : 'text-[#555560] hover:bg-[#1e1e23]'
                  }`}
                >
                  <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Points */}
          <div className="flex items-center gap-3">
            <span className="w-[72px] flex-shrink-0 text-[#555560]">Points</span>
            <div className="flex gap-1">
              {EFFORTS.map(n => (
                <button
                  key={n}
                  onClick={() => { setEffort(effort === n ? undefined : n); setSaved(false); }}
                  className={`h-7 w-7 rounded-md font-mono text-[11px] transition-colors ${
                    effort === n ? 'bg-accent/15 text-accent' : 'text-[#555560] hover:bg-[#1e1e23]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div className="flex items-center gap-3">
            <span className="w-[72px] flex-shrink-0 text-[#555560]">Due</span>
            <input
              type="date"
              value={dueDate}
              onChange={e => { setDueDate(e.target.value); setSaved(false); }}
              className="rounded-md bg-[#1e1e23] border border-[#2a2a30] px-2 py-[3px] text-[12px] text-[#808090] outline-none focus:border-accent/25 transition-colors"
            />
          </div>

          {/* Labels */}
          <div className="flex items-start gap-3">
            <span className="w-[72px] flex-shrink-0 text-[#555560] pt-[3px]">Labels</span>
            <div className="flex flex-wrap gap-1">
              {labels.map(label => {
                const active = labelIds.includes(label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => {
                      setLabelIds(active ? labelIds.filter(id => id !== label.id) : [...labelIds, label.id]);
                      setSaved(false);
                    }}
                    className={`rounded-md px-2 py-[2px] text-[11px] transition-all ${
                      active ? 'opacity-100' : 'opacity-35 hover:opacity-60'
                    }`}
                    style={{ backgroundColor: `${label.color}18`, color: label.color }}
                  >
                    {label.name}
                  </button>
                );
              })}
              {labels.length === 0 && <span className="text-[#3a3a44]">No labels</span>}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#1e1e23]" />

        {/* Description */}
        <div className="space-y-2">
          <span className="text-[12px] text-[#555560]">Description</span>
          <textarea
            value={description}
            onChange={e => { setDescription(e.target.value); setSaved(false); }}
            placeholder="Write something..."
            rows={6}
            className="w-full rounded-lg bg-[#0f0f12] border border-[#1e1e23] px-3.5 py-3 text-[13.5px] text-[#b0b0be] placeholder-[#3a3a44] outline-none focus:border-[#2a2a35] transition-colors resize-none leading-[1.7]"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving || saved}
          className={`w-full rounded-lg py-2 text-[13px] font-medium transition-all ${
            saved
              ? 'bg-emerald-500/15 text-emerald-400'
              : hasChanges
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-[#1e1e23] text-[#3a3a44] cursor-default'
          }`}
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
        </button>

        {/* Subtasks */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#555560]">Subtasks</span>
            {subtasks.length > 0 && (
              <span className="text-[11px] text-[#4a4a58] tabular-nums">{completedCount}/{subtasks.length}</span>
            )}
          </div>

          {subtasks.length > 0 && (
            <div className="h-[3px] rounded-full bg-[#1e1e23] overflow-hidden">
              <motion.div
                className="h-full bg-accent/40 rounded-full"
                animate={{ width: `${subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0}%` }}
              />
            </div>
          )}

          <div className="space-y-0.5">
            {subtasks.map(s => (
              <div key={s.id} className="flex items-center gap-2.5 group py-1 px-1 -mx-1 rounded hover:bg-white/[0.02] transition-colors">
                <button
                  onClick={() => toggleSubtask(s)}
                  className={`h-[15px] w-[15px] rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    s.completed ? 'bg-accent/20 border-accent/40 text-accent' : 'border-[#333340] hover:border-[#4a4a58]'
                  }`}
                >
                  {s.completed && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                <span className={`flex-1 text-[13px] leading-relaxed ${s.completed ? 'text-[#4a4a58] line-through' : 'text-[#a0a0b0]'}`}>
                  {s.title}
                </span>
                <button onClick={() => deleteSubtask(s.id)} className="opacity-0 group-hover:opacity-100 text-[#4a4a58] hover:text-red-400/70 text-[11px] transition-all">×</button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 px-1">
            <span className="text-[#333340] text-[13px]">+</span>
            <input
              type="text"
              placeholder="Add subtask..."
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addSubtask(); }}
              className="flex-1 bg-transparent text-[13px] text-[#808090] placeholder-[#333340] outline-none"
            />
          </div>
          {subtaskError && (
            <p className="text-[11px] text-red-400/70 px-1">{subtaskError}</p>
          )}
        </div>

        {/* Meta */}
        <div className="pt-3 border-t border-[#1e1e23] text-[10px] text-[#3a3a44] space-y-0.5">
          <p>Created {new Date(task.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          <p>Updated {new Date(task.updatedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>
    </motion.div>
  );
}
