
import React from 'react';
import type { Task, Category, Tag, Status } from '../types';
import { BriefcaseIcon, CalendarDaysIcon, ListBulletIcon } from './icons';
import { STATUS_COLORS } from '../constants';

interface TaskCardProps {
  task: Task;
  category?: Category;
  tag?: Tag;
  onSelect: (task: Task) => void;
  isDraggable?: boolean;
  variant?: 'full' | 'compact' | 'list-item';
  isOverdue?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, status?: string, targetTaskId?: string) => void;
  disableOverdueColor?: boolean;
}

const priorityColors: Record<string, string> = {
    'tag-1': 'bg-red-500',
    'tag-2': 'bg-yellow-500',
    'tag-3': 'bg-green-500',
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
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wide">
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
  onSelect,
  isDraggable = false,
  variant = 'full',
  isOverdue = false,
  onDragStart,
  onDragOver,
  onDrop,
  disableOverdueColor = false
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
  const CategoryIcon = category ? category.icon : BriefcaseIcon;
  
  // Conditionally apply overdue styling
  const applyOverdueStyle = isOverdue && !disableOverdueColor;

  const baseCardClasses = applyOverdueStyle 
    ? 'bg-red-50/40 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' 
    : 'bg-white dark:bg-[#161B22] border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700';

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
            {/* Status Bar Indicator - Sidebar Style */}
            <div className={`w-1.5 h-6 flex-shrink-0 rounded-full ${statusColor}`}></div>
            
            {/* Icon */}
            <div className="text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors flex-shrink-0">
                <CategoryIcon className="w-4 h-4" />
            </div>

            {/* Title & Overdue Dot */}
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

            {/* Tag (Hidden on very small screens if needed, but useful here) */}
            {tag && (
                <div title={`Prioridade: ${tag.name}`} className={`hidden sm:block text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${tag.bgColor} ${tag.color}`}>
                    {tag.name === 'Normal' ? 'Média' : tag.name}
                </div>
            )}

            {/* Date */}
            {dueDate && <DueDateDisplay dueDate={dueDate} listItem />}
        </div>
      );
  }

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
            {/* Top part */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    {tag && (
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tag.bgColor} ${tag.color}`}>
                        {tag.name === 'Normal' ? 'Média' : tag.name}
                      </div>
                    )}
                    {isOverdue && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                </div>
                {dueDate && <DueDateDisplay dueDate={dueDate} compact />}
            </div>

            {/* Middle part (title) */}
            <div className="flex-grow flex flex-col justify-center">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
                  {title}
                </h3>
            </div>

            {/* Bottom part */}
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

  // Full Variant (Redesigned to match Compact style)
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
        {/* Top part */}
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
                {tag && (
                  <div className={`text-xs font-bold px-3 py-1 rounded-full ${tag.bgColor} ${tag.color}`}>
                    {tag.name}
                  </div>
                )}
                {isOverdue && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
            </div>
            {dueDate && <DueDateDisplay dueDate={dueDate} />}
        </div>

        {/* Middle part (title and description) */}
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


        {/* Bottom part */}
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
