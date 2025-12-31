
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Task, Category, Tag, Status, SubTask, Activity, Project } from '../types';
import { 
    XIcon, TrashIcon, PlusIcon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon,
    ChevronDownIcon, CheckCircleIcon, FolderIcon, SearchIcon,
    RocketLaunchIcon, CodeBracketIcon, GlobeAltIcon, StarIcon, HeartIcon, ChartPieIcon
} from './icons';
import TaskCard from './TaskCard';
import { STATUS_COLORS } from '../constants';


interface TaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNew: (task: Task) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onDeleteActivity: (taskId: string, activityId: string, type: Activity['type']) => void;
  initialData?: Task | null;
  categories: Category[];
  tags: Tag[];
  tasks: Task[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
  onViewTaskFromCalendar?: (task: Task) => void;
  zIndex?: number;
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


const TaskSheet: React.FC<TaskSheetProps> = ({ isOpen, onClose, onSaveNew, onUpdate, onDelete, onDeleteActivity, initialData, categories, tags, tasks, projects, onSelectTask, onViewTaskFromCalendar, zIndex = 40 }) => {
  const [taskData, setTaskData] = useState<Task | null>(null);
  const [newSubTask, setNewSubTask] = useState('');
  const [newTag, setNewTag] = useState('');
  
  const [calendarDisplayDate, setCalendarDisplayDate] = useState(new Date());
  const [isCalendarGlowing, setIsCalendarGlowing] = useState(false);
  const [isDueDateFlashing, setIsDueDateFlashing] = useState(false);

  // Dropdown states
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
            setIsCategoryDropdownOpen(false);
        }
        if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
            setIsTagDropdownOpen(false);
        }
        if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
            setIsProjectDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setTaskData(initialData);
            const date = new Date(initialData.dueDate || Date.now());
            setCalendarDisplayDate(date);
        } else {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            setTaskData({
              id: `task-${Date.now()}`,
              title: '',
              description: '',
              dateTime: now.toISOString(),
              dueDate: tomorrow.toISOString(),
              categoryId: categories[0]?.id || '',
              tagId: tags[1]?.id || '',
              status: 'Pendente',
              subTasks: [],
              activity: [],
              tags: [],
              projectId: undefined,
            });
            setCalendarDisplayDate(tomorrow);
        }
    } else {
        setTaskData(null);
    }
  }, [isOpen, initialData, categories, tags]);

  const tasksByDueDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
        if (task.dueDate) {
            const date = new Date(task.dueDate).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(task);
        }
        return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);


  if (!isOpen || !taskData) return null;

  const handleUpdate = (updates: Partial<Task>) => {
      setTaskData(prev => prev ? { ...prev, ...updates } : null);
  };
  
  const handleDateSelect = (date: Date) => {
    setIsDueDateFlashing(true);
    const newDueDate = new Date(date);
    newDueDate.setHours(23, 59, 59);
    handleUpdate({ dueDate: newDueDate.toISOString() });
    
    // Also update the display calendar to match the selected date
    setCalendarDisplayDate(newDueDate);
    
    setTimeout(() => setIsDueDateFlashing(false), 500);
  };
  
  const handleSubTaskToggle = (subTaskId: string) => {
    handleUpdate({
      subTasks: taskData.subTasks.map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st)
    });
  };
  
  const handleAddSubTask = () => {
    if(newSubTask.trim() === '') return;
    const subTask: SubTask = { id: `sub-${Date.now()}`, text: newSubTask.trim(), completed: false };
    handleUpdate({ subTasks: [...taskData.subTasks, subTask] });
    setNewSubTask('');
  };

  const handleDeleteSubTask = (subTaskId: string) => {
    handleUpdate({ subTasks: taskData.subTasks.filter(st => st.id !== subTaskId) });
  };

  const handleAddTagToList = () => {
    if (!newTag.trim() || (taskData && taskData.tags?.includes(newTag.trim()))) return;
    const updatedTags = [...(taskData?.tags || []), newTag.trim()];
    handleUpdate({ tags: updatedTags });
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!taskData) return;
    handleUpdate({ tags: taskData.tags?.filter(t => t !== tagToRemove) });
  };
  
  const handleCreate = () => {
    if (!taskData.title.trim()) {
      alert('O título da tarefa é obrigatório.');
      return;
    }
    onSaveNew(taskData);
  }
    
    const InteractiveCalendar = () => {
        const currentDate = calendarDisplayDate;
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDate = new Date(startOfMonth);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        const endDate = new Date(endOfMonth);
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

        const days = [];
        let day = new Date(startDate);
        while (day <= endDate) {
            days.push(new Date(day));
            day.setDate(day.getDate() + 1);
        }
        
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        const selectedDayTasksByStatus = useMemo(() => {
          const grouped: { 'Pendente': Task[], 'Em andamento': Task[] } = {
            'Pendente': [],
            'Em andamento': [],
          };
          if (!taskData?.dueDate) return grouped;
          const selectedDateStr = new Date(taskData.dueDate).toDateString();
          const tasksForDay = tasksByDueDate[selectedDateStr] || [];
    
          for (const task of tasksForDay) {
            if (task.status === 'Pendente' || task.status === 'Em andamento') {
              grouped[task.status].push(task);
            }
          }
          return grouped;
        }, [taskData?.dueDate, tasksByDueDate]);

        const hasTasksToShow = selectedDayTasksByStatus['Pendente'].length > 0 || selectedDayTasksByStatus['Em andamento'].length > 0;


        return (
            <div className={`bg-white dark:bg-[#21262D] rounded-lg shadow-sm flex flex-col h-full overflow-hidden transition-colors duration-500 border border-gray-200 dark:border-gray-800 ${isCalendarGlowing ? 'bg-primary-50 dark:bg-primary-900/40' : ''}`}>
                
                {/* 50% Height: Calendar */}
                <div className="h-1/2 flex flex-col border-b border-gray-200 dark:border-gray-800 p-4">
                    <div className="mb-2">
                        <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prazo Final</label>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                        <button onClick={() => setCalendarDisplayDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} type="button" className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 capitalize">
                            {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={() => setCalendarDisplayDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} type="button" className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                            <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">
                        {weekDays.map((wd, i) => <div key={i}>{wd}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 flex-1 min-h-0">
                        {days.map((d, i) => {
                            const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                            const isToday = d.toDateString() === new Date().toDateString();
                            const isSelected = taskData.dueDate && d.toDateString() === new Date(taskData.dueDate).toDateString();
                            const dayTasks = (tasksByDueDate[d.toDateString()] || []).filter(task => task.status !== 'Concluída');

                            const dayClasses = `
                                flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all h-full
                                ${isCurrentMonth ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-black/10'}
                                ${!isSelected && 'hover:bg-gray-100 dark:hover:bg-white/10'}
                                ${isSelected && 'bg-primary-500 text-white font-bold shadow-md transform scale-105'}
                            `;

                            return (
                                <div key={i} onClick={() => handleDateSelect(d)} className={dayClasses}>
                                    <span className={`text-xs ${isToday && !isSelected ? 'underline decoration-2 underline-offset-2' : ''}`}>
                                        {d.getDate()}
                                    </span>
                                    <div className="flex justify-center items-center mt-1 space-x-0.5">
                                        {dayTasks.length > 0 && dayTasks.slice(0, 3).map(t => {
                                           const tag = tags.find(tg => tg.id === t.tagId)
                                           const colorClass = tag ? `bg-${tag.baseColor}-500` : 'bg-gray-400'
                                           return <div key={t.id} className={`w-1.5 h-1.5 rounded-full ${colorClass}`}></div>
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 50% Height: Tasks List */}
                <div className="h-1/2 flex flex-col bg-gray-50/50 dark:bg-black/20">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#161B22]">
                        <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide">
                            Tarefas: {taskData.dueDate ? new Date(taskData.dueDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short'}) : 'Hoje'}
                        </h4>
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400 font-bold">
                            {(selectedDayTasksByStatus['Pendente'].length + selectedDayTasksByStatus['Em andamento'].length)}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        {hasTasksToShow ? (
                            <div className="space-y-4">
                                {selectedDayTasksByStatus['Pendente'].length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-2 opacity-70">
                                            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS['Pendente']}`}></span>
                                            <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">Pendente</span>
                                        </div>
                                        <div className="space-y-2">
                                            {selectedDayTasksByStatus['Pendente'].map(task => (
                                                <TaskCard 
                                                    key={task.id}
                                                    task={task}
                                                    category={categories.find(c => c.id === task.categoryId)}
                                                    tag={tags.find(t => t.id === task.tagId)}
                                                    onSelect={onViewTaskFromCalendar || onSelectTask}
                                                    variant="compact"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedDayTasksByStatus['Em andamento'].length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-2 opacity-70">
                                            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS['Em andamento']}`}></span>
                                            <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">Em andamento</span>
                                        </div>
                                        <div className="space-y-2">
                                            {selectedDayTasksByStatus['Em andamento'].map(task => (
                                                <TaskCard 
                                                    key={task.id}
                                                    task={task}
                                                    category={categories.find(c => c.id === task.categoryId)}
                                                    tag={tags.find(t => t.id === task.tagId)}
                                                    onSelect={onViewTaskFromCalendar || onSelectTask}
                                                    variant="compact"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-4">
                                <CheckCircleIcon className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-2" />
                                <p className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-tight">Sem pendências</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    };


  const { title, description, categoryId, tagId, subTasks, dueDate, projectId } = taskData;
  const currentProject = projects.find(p => p.id === projectId);
  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()));
  
  const ProjectIcon = currentProject && currentProject.icon && PROJECT_ICONS[currentProject.icon] ? PROJECT_ICONS[currentProject.icon] : FolderIcon;


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in md:pl-[var(--sidebar-width,80px)] lg:pl-[var(--sidebar-width,256px)] transition-[padding] duration-300" onClick={onClose}>
        <div 
          className="relative w-full max-w-5xl bg-ice-blue dark:bg-[#161B22] rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden animate-scale-in"
          onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <header className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-[#161B22]">
              <div className="flex-1 flex items-center gap-4">
                  <input 
                      type="text"
                      value={title}
                      onChange={e => setTaskData(t => t ? {...t, title: e.target.value} : null)}
                      placeholder="Título da Tarefa"
                      className="text-2xl font-bold bg-transparent focus:outline-none w-full text-gray-900 dark:text-white p-1 -m-1 rounded hover:bg-gray-100 dark:hover:bg-white/5 focus:bg-white dark:focus:bg-[#0D1117] focus:ring-2 focus:ring-primary-400 transition-all duration-200"
                      aria-label="Título da Tarefa"
                  />
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-4" aria-label="Fechar">
                    <XIcon className="w-6 h-6" />
                </button>
            </header>
            
            {/* Content Area - Grid Layout */}
            <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                
                {/* Coluna da Esquerda: Campos de Dados (Wider) */}
                <div className="lg:col-span-7 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Descrição</label>
                        <textarea 
                            id="description" 
                            value={description || ''} 
                            onChange={e => setTaskData(t => t ? {...t, description: e.target.value} : null)} 
                            rows={4} 
                            className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 text-sm p-3 transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            placeholder="Adicionar uma descrição detalhada..."
                        />
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div className="flex flex-col gap-6">
                        {/* Categoria */}
                        <div ref={categoryDropdownRef} className="relative flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Categoria</label>
                            <div className="relative">
                                <button
                                    onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                                    className={`flex items-center justify-between w-[240px] px-3 py-2 bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm cursor-pointer transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-400 ${isCategoryDropdownOpen ? 'ring-2 ring-primary-500/20 border-primary-500' : ''}`}
                                >
                                     <div className="flex items-center gap-2 min-w-0">
                                        {categories.find(c => c.id === categoryId)?.icon && React.createElement(categories.find(c => c.id === categoryId)!.icon, { className: "w-4 h-4 text-gray-500 dark:text-gray-400" })}
                                        <span className={`text-sm font-medium truncate ${categoryId ? 'text-gray-900 dark:text-gray-200' : 'text-gray-400'}`}>
                                            {categories.find(c => c.id === categoryId)?.name || 'Nenhuma'}
                                        </span>
                                    </div>
                                    <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                </button>
                                
                                {isCategoryDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-[#21262D] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden flex flex-col max-h-60">
                                        <div className="overflow-y-auto p-1">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => { handleUpdate({ categoryId: cat.id }); setIsCategoryDropdownOpen(false); }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${categoryId === cat.id ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                >
                                                    <cat.icon className="w-4 h-4" />
                                                    <span className="truncate font-medium">{cat.name}</span>
                                                    {categoryId === cat.id && <CheckCircleIcon className="w-3.5 h-3.5 ml-auto text-primary-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Prioridade */}
                         <div ref={tagDropdownRef} className="relative flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Prioridade</label>
                            <div className="relative">
                                <button
                                    onClick={() => setIsTagDropdownOpen(prev => !prev)}
                                    className={`flex items-center justify-between w-[240px] px-3 py-2 bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm cursor-pointer transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-400 ${isTagDropdownOpen ? 'ring-2 ring-primary-500/20 border-primary-500' : ''}`}
                                >
                                     <div className="flex items-center gap-2 min-w-0">
                                        {(() => {
                                            const selectedTag = tags.find(t => t.id === tagId);
                                            if (selectedTag) {
                                                return (
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${selectedTag.bgColor} ${selectedTag.color}`}>
                                                        {selectedTag.name}
                                                    </span>
                                                );
                                            }
                                            return <span className="text-sm text-gray-400 font-medium truncate">Nenhuma</span>;
                                        })()}
                                    </div>
                                    <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                </button>
                                {isTagDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-[#21262D] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden flex flex-col max-h-60">
                                        <div className="overflow-y-auto p-1">
                                            {tags.map(tag => (
                                                <button
                                                    key={tag.id}
                                                    onClick={() => { handleUpdate({ tagId: tag.id }); setIsTagDropdownOpen(false); }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${tagId === tag.id ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                >
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${tag.bgColor} ${tag.color}`}>
                                                        {tag.name}
                                                    </span>
                                                    {tagId === tag.id && <CheckCircleIcon className="w-3.5 h-3.5 ml-auto text-primary-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Projeto */}
                        <div ref={projectDropdownRef} className="relative flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Projeto</label>
                            <div className="relative">
                                <div
                                    onClick={() => { setIsProjectDropdownOpen(true); setProjectSearchQuery(''); }}
                                    className={`flex items-center justify-between w-[240px] px-3 py-2 bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm cursor-pointer transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-400 ${isProjectDropdownOpen ? 'ring-2 ring-primary-500/20 border-primary-500' : ''}`}
                                >
                                     {isProjectDropdownOpen ? (
                                        <div className="flex items-center flex-1 gap-2 min-w-0">
                                            <SearchIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <input 
                                                autoFocus
                                                type="text" 
                                                value={projectSearchQuery}
                                                onChange={(e) => setProjectSearchQuery(e.target.value)}
                                                placeholder="Buscar..."
                                                className="bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-gray-200 w-full p-0 font-medium"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                             {currentProject ? (
                                                <ProjectIcon className={`w-4 h-4 flex-shrink-0 ${currentProject.color.replace('bg-', 'text-')}`} />
                                            ) : (
                                                <FolderIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                            )}
                                            <span className={`text-sm font-medium truncate ${currentProject ? 'text-gray-900 dark:text-gray-200' : 'text-gray-400'}`}>
                                                {currentProject ? currentProject.name : 'Vincular projeto'}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center flex-shrink-0 ml-1">
                                         {currentProject && !isProjectDropdownOpen ? (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleUpdate({ projectId: undefined }); }}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                                title="Desvincular"
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                         ) : (
                                            !isProjectDropdownOpen && <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                         )}
                                    </div>
                                </div>

                                {isProjectDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-[#21262D] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden flex flex-col max-h-60">
                                        <div className="overflow-y-auto p-1">
                                            {filteredProjects.length > 0 ? filteredProjects.map(proj => {
                                                const ItemIcon = proj.icon && PROJECT_ICONS[proj.icon] ? PROJECT_ICONS[proj.icon] : FolderIcon;
                                                return (
                                                    <button
                                                        key={proj.id}
                                                        onClick={() => { handleUpdate({ projectId: proj.id }); setIsProjectDropdownOpen(false); }}
                                                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${taskData.projectId === proj.id ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                    >
                                                        <ItemIcon className={`w-4 h-4 flex-shrink-0 ${proj.color.replace('bg-', 'text-')}`} />
                                                        <span className="truncate font-medium">{proj.name}</span>
                                                        {taskData.projectId === proj.id && <CheckCircleIcon className="w-3.5 h-3.5 ml-auto text-primary-500" />}
                                                    </button>
                                                )
                                            }) : (
                                                <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">
                                                    Nenhum projeto
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="mt-4">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 block">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {taskData.tags?.map(t => (
                                <span key={t} className="flex items-center gap-1.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {t} <button onClick={() => handleRemoveTag(t)} className="text-primary-500 hover:text-red-500 ml-0.5 transition-colors"><XIcon className="w-3 h-3"/></button>
                                </span>
                            ))}
                        </div>
                         <div className="flex gap-2">
                            <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTagToList()} placeholder="Adicionar tag..." className="flex-grow block w-full rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 placeholder:text-gray-400 text-sm p-2.5 transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"/>
                            <button onClick={handleAddTagToList} className="bg-primary-500 text-white p-2.5 rounded-lg hover:bg-primary-600 disabled:opacity-50 shadow-sm" disabled={!newTag.trim()}><PlusIcon className="w-5 h-5"/></button>
                        </div>
                    </div>

                    {/* Sub-tarefas */}
                    <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl shadow-inner border border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-200 mt-4">
                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 uppercase tracking-tight">Sub-tarefas</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 mb-3 custom-scrollbar">
                            {subTasks.map(st => (
                                <div key={st.id} className="flex items-center bg-gray-100 dark:bg-black/20 p-2.5 rounded-md group hover:shadow-sm transition-all">
                                    <input type="checkbox" id={`subtask-create-${st.id}`} checked={st.completed} onChange={() => handleSubTaskToggle(st.id)} className="appearance-none h-4 w-4 rounded border-2 border-gray-300 dark:border-gray-600 checked:bg-primary-500 checked:border-transparent focus:outline-none transition-all"/>
                                    <label htmlFor={`subtask-create-${st.id}`} className={`ml-3 flex-1 text-sm font-medium cursor-pointer transition-all ${st.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{st.text}</label>
                                    <button onClick={() => handleDeleteSubTask(st.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={newSubTask} onChange={e => setNewSubTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSubTask()} placeholder="Adicionar item..." className="flex-grow block w-full rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 placeholder:text-gray-400 text-sm p-2.5 transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"/>
                            <button onClick={handleAddSubTask} className="bg-primary-500 text-white p-2.5 rounded-lg hover:bg-primary-600 disabled:opacity-50 shadow-sm" disabled={!newSubTask.trim()}><PlusIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Calendário e Visualização */}
                <div className="lg:col-span-5 flex flex-col min-h-0">
                    <InteractiveCalendar />
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-auto p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end space-x-4 bg-white dark:bg-[#161B22] flex-shrink-0">
                <button onClick={onClose} className="px-6 py-3 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-500 font-semibold text-sm transition-colors hover:border-primary-400">Cancelar</button>
                <button onClick={handleCreate} className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:ring-2 hover:ring-offset-2 hover:ring-primary-400 dark:hover:ring-offset-[#161B22]">
                    {initialData ? 'Salvar Alterações' : 'Criar Tarefa'}
                </button>
            </footer>
        </div>
    </div>
  );
};

export default TaskSheet;
