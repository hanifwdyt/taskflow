import type { Project } from '@taskflow/shared';

interface Props {
  project: Project;
  size?: 'sm' | 'md';
  showTitle?: boolean;
  onClick?: () => void;
}

export default function ProjectBadge({ project, size = 'sm', showTitle = true, onClick }: Props) {
  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-3 w-3';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 group"
      type="button"
    >
      <span
        className={`${dotSize} rounded-full flex-shrink-0`}
        style={{ backgroundColor: project.color }}
      />
      {showTitle && (
        <span className={`${textSize} text-white/40 group-hover:text-white/60 transition-colors truncate`}>
          {project.title}
        </span>
      )}
    </button>
  );
}
