import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { Task } from '@taskflow/shared';
import clsx from 'clsx';

const priorityConfig = {
  low: { dot: 'bg-white/20', label: 'text-white/25', text: 'low' },
  medium: { dot: 'bg-amber-400/60', label: 'text-amber-400/60', text: 'med' },
  high: { dot: 'bg-red-400/60', label: 'text-red-400/60', text: 'high' },
};

export default function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <motion.div
        whileHover={{ y: -1, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={clsx(
          'group relative rounded-xl glass border border-white/[0.05] p-3 cursor-grab active:cursor-grabbing select-none',
          'hover:border-white/[0.1] hover:shadow-inner-cyber transition-all duration-200',
          isDragging && 'opacity-0'
        )}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative space-y-2">
          <p className="text-sm font-medium leading-snug text-white/80 group-hover:text-white transition-colors">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-white/25 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 pt-0.5">
            <div className={clsx('h-1.5 w-1.5 rounded-full', priorityConfig[task.priority].dot)} />
            <span className={clsx('font-mono text-[10px] uppercase tracking-wider', priorityConfig[task.priority].label)}>
              {priorityConfig[task.priority].text}
            </span>
            {task.dueDate && (
              <>
                <span className="text-white/10">&middot;</span>
                <span className="font-mono text-[10px] text-white/20">
                  {new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
