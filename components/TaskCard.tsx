import React from 'react';
import type { Task, Category, Tag, Project } from '../types';
import { BriefcaseIcon, ListBulletIcon, FolderIcon, UserCircleIcon, ListIcon, RocketLaunchIcon, CodeBracketIcon, GlobeAltIcon, StarIcon, HeartIcon, ChartPieIcon } from './icons';
import { STATUS_COLORS } from '../constants';

interface TaskCardProps {
  task: Task;
  category?: Category;
  tag?: Tag;
  project?: Project;
  onSelect: (task: Task) => void;
  isDraggable?: boolean;
  variant?: 'full' | 'compact' | 'list-item';
  isOverdue?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, status?: string, targetTaskId?: string) => void;
  disableOverdueColor?: boolean;
  
  // Configurações de Exibição
  showProject?: boolean;
  onlyProjectIcon?: boolean;
}

const PROJECT_ICONS: Record<string, React.FC<{className?: string}>> = {
    folder: FolderIcon,
    rocket: RocketLaunchIcon,
    code: CodeBracketIcon,
    globe: GlobeAltIcon,
    star: StarIcon,
    heart: HeartIcon,
    chart: ChartPieIcon
};

// --- HELPER: Mapeamento de Cores para o Tailwind JIT ---
const getProjectColorClasses = (colorClass: string) => {
    const colorName = colorClass.replace('bg-', '').split('-')[0];

    const colorMap: Record<string, string> = {
        slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800/50',
        gray: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-800/50',
        red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/50',
        orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800/50',
        amber: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/50',
        yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800/50',
        lime: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/40 dark:text-lime-300 dark:border-lime-800/50',
        green: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800/50',
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/50',
        teal: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800/50',
        cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800/50',
        sky: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-800/50',
        blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/50',
        indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800/50',
        violet: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800/50',
        purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800/50',
        fuchsia: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/40 dark:text-fuchsia-300 dark:border-fuchsia-800/50',
        pink: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800/50',
        rose: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800/50',
    };

    return colorMap[colorName] || colorMap['gray'];
};

// --- HELPER: Project Pill Component ---
const ProjectPill: React.FC<{ project: Project; size?: 'small' | 'normal'; onlyIcon?: boolean }> = ({ project, size = 'small', onlyIcon = false }) => {
    const Icon = project.icon && PROJECT_ICONS[project.icon] ? PROJECT_ICONS[project.icon] : FolderIcon;
    const colorClasses = getProjectColorClasses(project.color);
    
    // Configurações de Tamanho
    const isNormal = size === 'normal'; // Para o card FULL

    // SE FOR APENAS ÍCONE
    if (onlyIcon) {
        return (
            <div 
                title={project.name}
                className={`
                    flex items-center justify-center
                    ${isNormal ? 'w-6 h-6' : 'w-5 h-5'} 
                    rounded-md border flex-shrink-0
                    ${colorClasses}
                `}
            >
                <Icon className={`${isNormal ? 'w-3.5 h-3.5' : 'w-3 h-3'}`} />
            </div>
        );
    }
    
    // MODO FULL (Card Grande - Com Texto)
    if (isNormal) {
        return (
            <div 
                title={project.name}
                className={`
                flex items-center gap-1.5
                px-2.5 py-[3px] /* Compensação: 3px padding + 1px borda = 4px */
                text-xs 
                rounded-md font-bold border flex-shrink-0 max-w-[140px] 
                ${colorClasses}
            `}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate leading-tight pb-[1px]">{project.name}</span>
            </div>
        );
    }

    // MODO COMPACT (Kanban - Com Texto)
    return (
        <div 
            title={project.name}
            className={`
            flex items-center gap-1.5 
            px-2 py-[1px] /* Compensação: 1px padding + 1px borda = 2px */
            text-[10px] 
            rounded-md font-bold border flex-shrink-0 max-w-[120px] 
            ${colorClasses}
        `}>
            <Icon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate leading-tight pb-[1px]">{project.name}</span>
        </div>
    );
};

const getCategoryIcon = (category?: Category) => {
    if (!category) return BriefcaseIcon; 
    if (category.icon) return category.icon; 

    switch (category.id) {
        case 'cat-1': return BriefcaseIcon;      
        case 'cat-2': return UserCircleIcon;     
        case 'cat-3': return ListIcon;           
        default: return FolderIcon;              
    }
};

const DueDateDisplay: React.FC<{ dueDate: string, compact?: boolean, listItem?: boolean }> = ({ dueDate, compact = false, listItem = false }) => {
    const date = new Date(dueDate);
     if (listItem) {
        return (
             <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 font-medium">
                <span>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
            </div>
        )
    }
    if (compact) {
        return (
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wide flex-shrink-0">
                <span className="capitalize">{date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span> {date.getDate()}
            </div>
        );
    }
    
    return (
        <div className="text-right flex-shrink-0">
            <div className={`font-bold leading-none text-xl text-gray-800 dark:text-gray-100`}>
                {date.getDate()}
            </div>
            <div className={`text-[11px] font-semibold text-gray-500 dark:text-gray-400`}>
                {date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toLowerCase()}/{date.getFullYear().toString().slice(-2)}
            </div>
        </div>
    );
};


const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  category, 
  tag,
  project,
  onSelect,
  isDraggable = false,
  variant = 'full',
  isOverdue = false,
  onDragStart,
  onDragOver,
  onDrop,
  disableOverdueColor = false,
  showProject = true,
  onlyProjectIcon = false
}) => {
  const { title, description, id, dueDate, status, subTasks } = task;

  const completedSubTasks = subTasks ? subTasks.filter(st => st.completed).length : 0;
  const totalSubTasks = subTasks ? subTasks.length : 0;
  const progress = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragStart) onDragStart(e, id);
    e.dataTransfer.setData('taskId', id);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragOver) onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDrop) onDrop(e, undefined, id);
  };
  
  const statusColor = STATUS_COLORS[status];
  const CategoryIcon = getCategoryIcon(category);
  const applyOverdueStyle = isOverdue && !disableOverdueColor;

  const baseCardClasses = applyOverdueStyle 
    ? 'bg-red-50/40 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' 
    : 'bg-white dark:bg-[#161B22] border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700';

  // --- MODO LISTA ---
  if (variant === 'list-item') {
      return (
        <div
            draggable={isDraggable}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => onSelect(task)}
            className={`
                group relative rounded-xl border p-3 flex items-center gap-3
                transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
                hover:shadow-md hover:scale-[1.002]
                ${baseCardClasses}
                ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
            `}
        >
            <div className={`w-1.5 h-6 flex-shrink-0 rounded-full ${statusColor}`}></div>
            
            <div className="text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors flex-shrink-0">
                <CategoryIcon className="w-4 h-4" />
            </div>

            <div className="flex-grow min-w-0 flex items-center gap-2">
                <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm truncate leading-snug group-hover:text-gray-900 dark:group-hover:text-white transition-colors" title={title}>
                    {title}
                </p>
                
                {isOverdue && (
                    <span className="relative flex h-2 w-2 flex-shrink-0" title="Atrasado">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                )}
            </div>

            {tag && (
                <div title={`Prioridade: ${tag.name}`} className={`hidden sm:block text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${tag.bgColor} ${tag.color}`}>
                    {tag.name === 'Normal' ? 'Média' : tag.name}
                </div>
            )}

            {dueDate && <DueDateDisplay dueDate={dueDate} listItem />}
        </div>
      );
  }

  // --- MODO KANBAN COMPACTO ---
  if (variant === 'compact') {
      return (
        <div
            draggable={isDraggable}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => onSelect(task)}
            className={`
                group relative rounded-xl border p-3 flex flex-col h-24 
                transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
                hover:shadow-md hover:scale-[1.002]
                ${baseCardClasses} 
                ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
            `}
        >
            <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-1.5 flex-wrap overflow-hidden h-6">
                    {tag && (
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${tag.bgColor} ${tag.color}`}>
                        {tag.name === 'Normal' ? 'Média' : tag.name}
                      </div>
                    )}
                    
                    {/* AQUI ESTAVA FALTANDO O '&& showProject' */}
                    {project && showProject && <ProjectPill project={project} size="small" onlyIcon={onlyProjectIcon} />}

                    {isOverdue && (
                      <span className="relative flex h-2 w-2 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                </div>
                {dueDate && <DueDateDisplay dueDate={dueDate} compact />}
            </div>

            <div className="flex-grow flex flex-col justify-center">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
                  {title}
                </h3>
            </div>

            <div className="flex items-center text-gray-400 dark:text-gray-500 gap-2">
                <div title={category?.name} className="flex-shrink-0 transition-colors group-hover:text-gray-500 dark:group-hover:text-gray-400">
                    <CategoryIcon className="w-4 h-4" />
                </div>
                {totalSubTasks > 0 && (
                  <div className="flex items-center gap-2 flex-grow min-w-0">
                      <div className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-1" title={`${Math.round(progress)}% concluído`}>
                          <div className="bg-primary-500 h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="flex items-center text-[10px] flex-shrink-0 font-medium">
                          <span>{completedSubTasks}/{totalSubTasks}</span>
                      </div>
                  </div>
                )}
            </div>
        </div>
    );
  }

  // --- MODO FULL ---
  return (
      <div
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => onSelect(task)}
        className={`
            group relative rounded-2xl border p-4 flex flex-col justify-between min-h-[140px]
            transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
            hover:shadow-md hover:-translate-y-0.5
            ${baseCardClasses}
            ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        `}
      >
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 flex-wrap">
                {tag && (
                  <div className={`text-xs font-bold px-3 py-1 rounded-full ${tag.bgColor} ${tag.color}`}>
                    {tag.name}
                  </div>
                )}
                
                {/* AQUI TAMBÉM ESTAVA FALTANDO O '&& showProject' */}
                {project && showProject && <ProjectPill project={project} size="normal" onlyIcon={onlyProjectIcon} />}

                {isOverdue && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
            </div>
            {dueDate && <DueDateDisplay dueDate={dueDate} />}
        </div>

        <div className="flex-grow flex flex-col items-start justify-center text-left py-3 overflow-hidden">
            <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 transition-opacity duration-200">
                {description}
              </p>
            )}
        </div>

        <div className="flex items-center mt-auto text-gray-400 dark:text-gray-500 w-full gap-2">
            <div title={category?.name} className="flex-shrink-0 transition-colors group-hover:text-gray-500 dark:group-hover:text-gray-400">
                <CategoryIcon className="w-5 h-5" />
            </div>
            
            {totalSubTasks > 0 && (
                <>
                    <div className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
                        <ListBulletIcon className="w-4 h-4" />
                        <span>{completedSubTasks}/{totalSubTasks}</span>
                    </div>
                </>
            )}
        </div>
      </div>
  );
};

export default TaskCard;