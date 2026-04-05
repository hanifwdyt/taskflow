import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { Task } from '@taskflow/shared';
import clsx from 'clsx';

interface Props {
  task: Task;
  onClick?: () => void;
}

export default function TaskCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const subtasksDone = task.subtasks?.filter(s => s.completed).length || 0;
  const subtasksTotal = task.subtasks?.length || 0;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const priorityDot: Record<string, string> = {
    low: 'bg-zinc-500/50',
    medium: 'bg-amber-400/70',
    high: 'bg-orange-400/80',
    urgent: 'bg-red-400 animate-pulse',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <motion.div
        onClick={() => onClick?.()}
        whileHover={{ y: -1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={clsx(
          'group relative rounded-[10px] bg-[#1e1e23] border border-[#2a2a30] cursor-pointer select-none overflow-hidden',
          'hover:border-[#3a3a42] hover:bg-[#222228] transition-all duration-150',
          isDragging && 'opacity-0',
        )}
      >
        {/* Project color accent */}
        {task.project && (
          <div className="absolute left-0 top-0 bottom-0 w-[2.5px] rounded-l-[10px]" style={{ backgroundColor: task.project.color }} />
        )}

        <div className="px-3.5 py-3 space-y-1.5">
          {/* Title */}
          <p className="text-[13.5px] font-medium leading-[1.45] text-[#e0e0e5] group-hover:text-white transition-colors">
            {task.title}
          </p>

          {/* Description — max 1 line */}
          {task.description && (
            <p className="text-[12px] text-[#6b6b78] line-clamp-1 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Bottom meta — minimal */}
          <div className="flex items-center gap-2 pt-0.5">
            {/* Priority dot only */}
            <span className={clsx('h-[5px] w-[5px] rounded-full', priorityDot[task.priority] || priorityDot.medium)} />

            {/* Due date */}
            {task.dueDate && (
              <span className={clsx('text-[11px]', isOverdue ? 'text-red-400/80' : 'text-[#555560]')}>
                {new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </span>
            )}

            {/* Subtask count */}
            {subtasksTotal > 0 && (
              <span className={clsx('text-[11px]', subtasksDone === subtasksTotal ? 'text-emerald-500/60' : 'text-[#555560]')}>
                {subtasksDone}/{subtasksTotal}
              </span>
            )}

            {/* Effort — tiny */}
            {task.effort && (
              <span className="text-[10px] font-mono text-[#4a4a58] bg-[#2a2a32] rounded px-1 py-px">
                {task.effort}
              </span>
            )}

            <div className="flex-1" />

            {/* Labels as tiny dots */}
            {task.labels && task.labels.length > 0 && (
              <div className="flex items-center gap-[3px]">
                {task.labels.map(label => (
                  <span
                    key={label.id}
                    className="h-[5px] w-[5px] rounded-full opacity-60"
                    style={{ backgroundColor: label.color }}
                    title={label.name}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
