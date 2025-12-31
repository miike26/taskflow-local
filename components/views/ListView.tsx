
import React, { useState, useMemo, useRef } from 'react';
import type { Task, Category, Tag, Status, AppSettings } from '../../types';
import TaskCard from '../TaskCard';
import { STATUS_OPTIONS, STATUS_COLORS } from '../../constants';
import { KanbanIcon, TableCellsIcon, ChevronDownIcon, CalendarDaysIcon, TrashIcon, ListBulletIcon, ArrowTopRightOnSquareIcon, ArrowDownTrayIcon } from '../icons';
import DateRangeCalendar from '../DateRangeCalendar';
import { useLocalStorage } from '../../hooks/useLocalStorage';


interface ConfirmationDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

const ConfirmationDialog: React.FC<{ state: ConfirmationDialogState; setState: React.Dispatch<React.SetStateAction<ConfirmationDialogState>> }> = ({ state, setState }) => {
    if (!state.isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#21262D] rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{state.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{state.message}</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setState({ ...state, isOpen: false })} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">Cancelar</button>
                    <button onClick={() => {
                        state.onConfirm();
                        setState({ ...state, isOpen: false });
                    }} className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 font-semibold">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

interface ListViewProps {
  tasks: Task[];
  setTasks: (tasks: Task[] | ((tasks: Task[]) => Task[])) => void;
  categories: Category[];
  tags: Tag[];
  onSelectTask: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: Status) => void;
  onBulkStatusChange: (taskIds: string[], newStatus: Status) => void;
  onBulkDelete: (taskIds: string[]) => void;
  appSettings?: AppSettings;
}

type ViewMode = 'kanban' | 'detailed-list';
type TableSortKey = 'title' | 'categoryId' | 'tagId' | 'dateTime' | 'dueDate' | 'status';

const kanbanSortFunction = (a: Task, b: Task) => {
    const now = new Date();
    const aIsOverdue = a.dueDate && new Date(a.dueDate) < now && a.status !== 'Concluída';
    const bIsOverdue = b.dueDate && new Date(b.dueDate) < now && b.status !== 'Concluída';

    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;

    const aDueDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDueDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;

    return aDueDate - bDueDate;
};


const defaultTableSort = (a: Task, b: Task) => {
    const statusOrder: Record<Status, number> = { 'Pendente': 1, 'Em andamento': 1, 'Concluída': 2 };
    const now = new Date();
    const aIsOverdue = a.dueDate && new Date(a.dueDate) < now && a.status !== 'Concluída';
    const bIsOverdue = b.dueDate && new Date(b.dueDate) < now && b.status !== 'Concluída';

    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;
    
    const aStatusOrder = statusOrder[a.status];
    const bStatusOrder = statusOrder[b.status];
    if (aStatusOrder !== bStatusOrder) {
        return aStatusOrder - bStatusOrder;
    }

    const aDueDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDueDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    
    if (aIsOverdue && bIsOverdue) {
        return aDueDate - bDueDate;
    }

    return aDueDate - bDueDate;
};


const KanbanColumn: React.FC<{
    status: Status;
    tasks: Task[];
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: string) => void;
    children: React.ReactNode;
}> = ({ status, tasks, onDrop, children }) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        onDrop(e, status);
    };

    return (
        <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col px-2 rounded-xl transition-colors flex-1 border ${isOver ? 'bg-primary-100/40 dark:bg-primary-900/30 border-primary-400' : 'border-gray-300 dark:border-gray-700'}`}
        >
            {/* Matches ProjectDetailView: p-4 pb-2 */}
            <h3 className="flex items-center gap-2 flex-shrink-0 font-semibold text-xl text-gray-800 dark:text-gray-200 p-4 pb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`}></span>
                {status} 
                <span className="text-sm font-normal text-gray-500">({tasks.length})</span>
            </h3>
            {/* Matches ProjectDetailView: p-2 space-y-3 */}
            <div className="flex-1 space-y-3 overflow-y-auto p-2">
                {children}
            </div>
        </div>
    );
};

const ListView: React.FC<ListViewProps> = ({ tasks, categories, tags, onSelectTask, onStatusChange, onBulkStatusChange, onBulkDelete, appSettings }) => {
  const [filterCategories, setFilterCategories] = useLocalStorage<string[]>('listview.filters.categories', []);
  const [filterTags, setFilterTags] = useLocalStorage<string[]>('listview.filters.tags', []);
  const [filterStatuses, setFilterStatuses] = useLocalStorage<Status[]>('listview.filters.statuses', []);

  // Raw string dates from localStorage
  const [rawCreationDateFilter, setRawCreationDateFilter] = useLocalStorage<{ startDate: string | null, endDate: string | null }>('listview.filters.creationDate', { startDate: null, endDate: null });
  const [rawDueDateFilter, setRawDueDateFilter] = useLocalStorage<{ startDate: string | null, endDate: string | null }>('listview.filters.dueDate', { startDate: null, endDate: null });

  // Memoized Date objects for components and logic
  const creationDateRangeFilter = useMemo(() => ({
      startDate: rawCreationDateFilter.startDate ? new Date(rawCreationDateFilter.startDate) : null,
      endDate: rawCreationDateFilter.endDate ? new Date(rawCreationDateFilter.endDate) : null
  }), [rawCreationDateFilter]);

  const dueDateRangeFilter = useMemo(() => ({
      startDate: rawDueDateFilter.startDate ? new Date(rawDueDateFilter.startDate) : null,
      endDate: rawDueDateFilter.endDate ? new Date(rawDueDateFilter.endDate) : null
  }), [rawDueDateFilter]);
  
  // Setters to convert Date objects to strings for storage
  const setCreationDateRangeFilter = (range: { startDate: Date | null, endDate: Date | null }) => {
      setRawCreationDateFilter({
          startDate: range.startDate ? range.startDate.toISOString() : null,
          endDate: range.endDate ? range.endDate.toISOString() : null,
      });
  };

  const setDueDateRangeFilter = (range: { startDate: Date | null, endDate: Date | null }) => {
      setRawDueDateFilter({
          startDate: range.startDate ? range.startDate.toISOString() : null,
          endDate: range.endDate ? range.endDate.toISOString() : null,
      });
  };

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isCompactMode, setIsCompactMode] = useLocalStorage('listview.compactMode', false);
  const [tableSortConfig, setTableSortConfig] = useState<{ key: TableSortKey; direction: 'asc' | 'desc' } | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set<string>());
  const [confirmationState, setConfirmationState] = useState<ConfirmationDialogState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);
  
  // New state for Export Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleFilterMouseEnter = (filterName: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }
    setOpenFilter(filterName);
  };

  const handleFilterMouseLeave = () => {
    closeTimer.current = window.setTimeout(() => {
      setOpenFilter(null);
    }, 200);
  };

  const handleMultiSelectFilterChange = (setter: React.Dispatch<React.SetStateAction<any[]>>) => (value: string) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const areFiltersActive = useMemo(() => 
    filterCategories.length > 0 || 
    filterTags.length > 0 || 
    filterStatuses.length > 0 || 
    creationDateRangeFilter.startDate ||
    dueDateRangeFilter.startDate, 
  [filterCategories, filterTags, filterStatuses, creationDateRangeFilter, dueDateRangeFilter]);

  const handleClearFilters = () => {
    setFilterCategories([]);
    setFilterTags([]);
    setFilterStatuses([]);
    setCreationDateRangeFilter({ startDate: null, endDate: null });
    setDueDateRangeFilter({ startDate: null, endDate: null });
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
        const categoryMatch = filterCategories.length === 0 || filterCategories.includes(task.categoryId);
        const tagMatch = filterTags.length === 0 || filterTags.includes(task.tagId);
        const statusMatch = filterStatuses.length === 0 || filterStatuses.includes(task.status);
        const creationDateMatch = (() => {
            if (!creationDateRangeFilter.startDate || !creationDateRangeFilter.endDate) {
                return true;
            }
            const taskDate = new Date(task.dateTime);
            const startDate = new Date(creationDateRangeFilter.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(creationDateRangeFilter.endDate);
            endDate.setHours(23, 59, 59, 999);
            return taskDate >= startDate && taskDate <= endDate;
        })();
        const dueDateMatch = (() => {
            if (!dueDateRangeFilter.startDate || !dueDateRangeFilter.endDate) {
                return true;
            }
            if (!task.dueDate) {
                return false;
            }
            const taskDate = new Date(task.dueDate);
            const startDate = new Date(dueDateRangeFilter.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(dueDateRangeFilter.endDate);
            endDate.setHours(23, 59, 59, 999);
            return taskDate >= startDate && taskDate <= endDate;
        })();
        return categoryMatch && tagMatch && statusMatch && creationDateMatch && dueDateMatch;
    });
    
    let sorted = [...filtered];

    if (viewMode === 'detailed-list') {
        if (tableSortConfig) {
          sorted.sort((a, b) => {
            const key = tableSortConfig.key;
            let aValue: any;
            let bValue: any;

            if (key === 'categoryId') {
              aValue = categories.find(c => c.id === a.categoryId)?.name || '';
              bValue = categories.find(c => c.id === b.categoryId)?.name || '';
            } else if (key === 'tagId') {
              aValue = tags.findIndex(t => t.id === a.tagId);
              bValue = tags.findIndex(t => t.id === b.tagId);
            } else {
              aValue = a[key];
              bValue = b[key];
            }
            if (aValue === undefined || aValue === null) aValue = key === 'dueDate' ? Infinity : '';
            if (bValue === undefined || bValue === null) bValue = key === 'dueDate' ? Infinity : '';

            if (aValue < bValue) return tableSortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return tableSortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          });
        } else {
            sorted.sort(defaultTableSort);
        }
    } else {
        sorted.sort(kanbanSortFunction);
    }

    return sorted;
  }, [tasks, filterCategories, filterTags, filterStatuses, creationDateRangeFilter, dueDateRangeFilter, tags, categories, viewMode, tableSortConfig]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleKanbanDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onStatusChange(taskId, newStatus as Status);
  };

  const handleTableSort = (key: TableSortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (tableSortConfig && tableSortConfig.key === key && tableSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setTableSortConfig({ key, direction });
  };
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedTaskIds(new Set(filteredAndSortedTasks.map(t => t.id)));
    } else {
        setSelectedTaskIds(new Set());
    }
  };

  const handleSelectOne = (taskId: string) => {
      const newSelection = new Set(selectedTaskIds);
      if (newSelection.has(taskId)) {
          newSelection.delete(taskId);
      } else {
          newSelection.add(taskId);
      }
      setSelectedTaskIds(newSelection);
  };
  
  const handleBulkStatusChange = (newStatus: Status) => {
      if (selectedTaskIds.size === 0) return;
      setConfirmationState({
          isOpen: true,
          title: 'Confirmar Alteração de Status',
          message: `Deseja alterar o status de ${selectedTaskIds.size} tarefa(s) para "${newStatus}"?`,
          onConfirm: () => {
              onBulkStatusChange(Array.from(selectedTaskIds), newStatus);
              setSelectedTaskIds(new Set());
          }
      });
  };

  const handleBulkDeleteRequest = () => {
      if (selectedTaskIds.size === 0) return;
      setConfirmationState({
          isOpen: true,
          title: 'Confirmar Exclusão',
          message: `Deseja excluir permanentemente ${selectedTaskIds.size} tarefa(s)? Esta ação não pode ser desfeita.`,
          onConfirm: () => {
              onBulkDelete(Array.from(selectedTaskIds));
              setSelectedTaskIds(new Set());
          }
      });
  };

  const getCategory = (id: string) => categories.find(c => c.id === id);
  const getTag = (id: string) => tags.find(t => t.id === id);
  
  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('pt-BR') : 'N/A';
  
  const formatDateShort = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const creationDateFilterLabel = creationDateRangeFilter.startDate && creationDateRangeFilter.endDate
    ? `Criação: ${formatDateShort(creationDateRangeFilter.startDate)} - ${formatDateShort(creationDateRangeFilter.endDate)}`
    : 'Data de Criação';
    
  const dueDateFilterLabel = dueDateRangeFilter.startDate && dueDateRangeFilter.endDate
    ? `Prazo: ${formatDateShort(dueDateRangeFilter.startDate)} - ${formatDateShort(dueDateRangeFilter.endDate)}`
    : 'Prazo Final';

  const checkboxClass = "appearance-none h-4 w-4 rounded-md border-2 border-gray-300 dark:border-gray-600 checked:bg-primary-500 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800";
  const filterCheckboxClass = "appearance-none h-4 w-4 rounded-md border-2 border-gray-300 dark:border-gray-600 checked:bg-primary-500 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600";


  return (
    <div className="p-6 bg-white dark:bg-[#161B22] rounded-2xl m-4 flex flex-col h-[calc(100%-2rem)] shadow-lg">
      <ConfirmationDialog state={confirmationState} setState={setConfirmationState} />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
            
            {/* Category Filter */}
            <div className="relative" onMouseEnter={() => handleFilterMouseEnter('category')} onMouseLeave={handleFilterMouseLeave}>
                <button className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${
                    filterCategories.length > 0 
                    ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300' 
                    : 'bg-white dark:bg-[#21262D] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}>
                    <span>Categoria</span>
                    {filterCategories.length > 0 && <span className="bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{filterCategories.length}</span>}
                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${openFilter === 'category' ? 'rotate-180' : ''}`} />
                </button>
                {openFilter === 'category' && (
                    <div className="absolute top-full mt-2 left-0 bg-white dark:bg-[#21262D] p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 w-60 space-y-1">
                        {categories.map(cat => {
                            const CategoryIcon = cat.icon;
                            return (
                                <label key={cat.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer">
                                    <input type="checkbox" checked={filterCategories.includes(cat.id)} onChange={() => handleMultiSelectFilterChange(setFilterCategories)(cat.id)} className={filterCheckboxClass}/>
                                    <CategoryIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
                                </label>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Priority Filter */}
            <div className="relative" onMouseEnter={() => handleFilterMouseEnter('priority')} onMouseLeave={handleFilterMouseLeave}>
                 <button className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${
                    filterTags.length > 0 
                    ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300' 
                    : 'bg-white dark:bg-[#21262D] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}>
                    <span>Prioridade</span>
                    {filterTags.length > 0 && <span className="bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{filterTags.length}</span>}
                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${openFilter === 'priority' ? 'rotate-180' : ''}`} />
                </button>
                {openFilter === 'priority' && (
                    <div className="absolute top-full mt-2 left-0 bg-white dark:bg-[#21262D] p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 w-60 space-y-1">
                        {tags.map(tag => (
                            <label key={tag.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer">
                                <input type="checkbox" checked={filterTags.includes(tag.id)} onChange={() => handleMultiSelectFilterChange(setFilterTags)(tag.id)} className={filterCheckboxClass}/>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${tag.bgColor} ${tag.color}`}>{tag.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Status Filter */}
            <div className="relative" onMouseEnter={() => handleFilterMouseEnter('status')} onMouseLeave={handleFilterMouseLeave}>
                 <button className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${
                    filterStatuses.length > 0 
                    ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300' 
                    : 'bg-white dark:bg-[#21262D] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}>
                    <span>Status</span>
                    {filterStatuses.length > 0 && <span className="bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{filterStatuses.length}</span>}
                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${openFilter === 'status' ? 'rotate-180' : ''}`} />
                </button>
                 {openFilter === 'status' && (
                    <div className="absolute top-full mt-2 left-0 bg-white dark:bg-[#21262D] p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 w-60 space-y-1">
                        {STATUS_OPTIONS.map(status => (
                            <label key={status} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer">
                                <input type="checkbox" checked={filterStatuses.includes(status)} onChange={() => handleMultiSelectFilterChange(setFilterStatuses)(status)} className={filterCheckboxClass}/>
                                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`}></div>
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{status}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Creation Date Filter */}
            <div className="relative" onMouseEnter={() => handleFilterMouseEnter('creationDate')} onMouseLeave={handleFilterMouseLeave}>
                <button className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${
                    creationDateRangeFilter.startDate
                    ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300'
                    : 'bg-white dark:bg-[#21262D] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}>
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span className="truncate">{creationDateFilterLabel}</span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${openFilter === 'creationDate' ? 'rotate-180' : ''}`} />
                </button>
                {openFilter === 'creationDate' && (
                    <div className="absolute top-full mt-2 left-0 bg-transparent z-20">
                       <DateRangeCalendar
                            range={creationDateRangeFilter}
                            onApply={(range) => {
                                setCreationDateRangeFilter(range);
                                setOpenFilter(null);
                            }}
                            onClear={() => {
                                setCreationDateRangeFilter({ startDate: null, endDate: null });
                                setOpenFilter(null);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Due Date Filter */}
            <div className="relative" onMouseEnter={() => handleFilterMouseEnter('dueDate')} onMouseLeave={handleFilterMouseLeave}>
                <button className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${
                    dueDateRangeFilter.startDate
                    ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300'
                    : 'bg-white dark:bg-[#21262D] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}>
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span className="truncate">{dueDateFilterLabel}</span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${openFilter === 'dueDate' ? 'rotate-180' : ''}`} />
                </button>
                {openFilter === 'dueDate' && (
                    <div className="absolute top-full mt-2 left-0 bg-transparent z-20">
                       <DateRangeCalendar
                            range={dueDateRangeFilter}
                            onApply={(range) => {
                                setDueDateRangeFilter(range);
                                setOpenFilter(null);
                            }}
                            onClear={() => {
                                setDueDateRangeFilter({ startDate: null, endDate: null });
                                setOpenFilter(null);
                            }}
                        />
                    </div>
                )}
            </div>

            {areFiltersActive && (
                <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                >
                    Limpar Filtros
                </button>
            )}

        </div>
        <div className="flex items-center bg-ice-blue dark:bg-[#0D1117] p-1 rounded-lg">
            {viewMode === 'kanban' && (
                <>
                    <button
                        title={isCompactMode ? "Expandir Cards" : "Cards Compactos"}
                        onClick={() => setIsCompactMode(!isCompactMode)}
                        className={`p-1.5 rounded-md transition-all duration-200 mr-1 ${isCompactMode ? 'bg-white dark:bg-[#21262D] shadow text-primary-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                    >
                        <ListBulletIcon className="w-5 h-5" />
                    </button>
                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                </>
            )}
            <button title="Visualização Kanban" onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'kanban' ? 'bg-white dark:bg-[#21262D] shadow text-primary-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                <KanbanIcon className="w-5 h-5" />
            </button>
            <button title="Visualização em Tabela" onClick={() => { setViewMode('detailed-list'); setTableSortConfig(null); }} className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'detailed-list' ? 'bg-white dark:bg-[#21262D] shadow text-primary-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                <TableCellsIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      
       {viewMode === 'detailed-list' && selectedTaskIds.size > 0 && (
          <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg flex items-center gap-4 relative z-20">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedTaskIds.size} selecionada(s)</span>
              <div className="relative group">
                  <button className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm transition-all duration-200 hover:ring-2 hover:ring-primary-400">
                      Marcar como...
                  </button>
                  <div className="absolute top-full left-0 pt-1 w-40 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                      <div className="bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                        {STATUS_OPTIONS.map(status => (
                            <a key={status} href="#" onClick={(e) => { e.preventDefault(); handleBulkStatusChange(status); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">{status}</a>
                        ))}
                      </div>
                  </div>
              </div>
               <button
                onClick={handleBulkDeleteRequest}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-md text-sm font-medium transition-colors hover:bg-red-100 dark:hover:bg-red-900/60"
              >
                  <TrashIcon className="w-4 h-4" />
                  Excluir
              </button>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 rounded-md text-sm font-medium transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
              >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  Exportar
              </button>
          </div>
       )}

      {viewMode === 'kanban' ? (
        <div className="flex-1 flex gap-6 overflow-x-auto">
            {STATUS_OPTIONS.map(status => (
                <KanbanColumn 
                    key={status} 
                    status={status} 
                    tasks={filteredAndSortedTasks.filter(t => t.status === status)}
                    onDrop={handleKanbanDrop}
                >
                    {filteredAndSortedTasks
                        .filter(task => task.status === status)
                        .map(task => (
                             <TaskCard
                                key={task.id}
                                task={task}
                                category={getCategory(task.categoryId)}
                                tag={getTag(task.tagId)}
                                onSelect={onSelectTask}
                                isDraggable={true}
                                isOverdue={task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Concluída'}
                                onDragStart={handleDragStart}
                                variant={isCompactMode ? 'compact' : 'full'}
                                disableOverdueColor={appSettings?.disableOverdueColor}
                              />
                        ))
                    }
                </KanbanColumn>
            ))}
        </div>
      ) : (
        <div className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden flex flex-col min-h-0">
            {filteredAndSortedTasks.length > 0 ? (
                <div className="overflow-auto h-full">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10">
                            <tr>
                                <th scope="col" className="p-4">
                                    <div className="flex items-center">
                                        <input id="checkbox-all" type="checkbox" 
                                        onChange={handleSelectAll} 
                                        checked={filteredAndSortedTasks.length > 0 && selectedTaskIds.size === filteredAndSortedTasks.length}
                                        className={checkboxClass} />
                                        <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                                    </div>
                                </th>
                                { (['title', 'status', 'categoryId', 'tagId', 'dueDate'] as TableSortKey[]).map(key => (
                                <th key={key} scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleTableSort(key)}>
                                    <div className="flex items-center">
                                    { {title: 'Nome', status: 'Status', categoryId: 'Categoria', tagId: 'Prioridade', dateTime: 'Data de Criação', dueDate: 'Prazo'}[key] }
                                    { tableSortConfig?.key === key && (<span>{tableSortConfig.direction === 'asc' ? ' ▲' : ' ▼'}</span>) }
                                    </div>
                                </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedTasks.map(task => {
                                const tag = getTag(task.tagId);
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Concluída';
                                // Apply logic to table rows too
                                const showOverdueStyle = isOverdue && !appSettings?.disableOverdueColor;

                                return (
                                <tr key={task.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${showOverdueStyle ? 'bg-red-50 dark:bg-red-900/10' : 'bg-white dark:bg-gray-800'}`}>
                                        <td className="w-4 p-4">
                                            <div className="flex items-center">
                                                <input id={`checkbox-${task.id}`} type="checkbox"
                                                checked={selectedTaskIds.has(task.id)}
                                                onChange={() => handleSelectOne(task.id)}
                                                className={checkboxClass} />
                                                <label htmlFor={`checkbox-${task.id}`} className="sr-only">checkbox</label>
                                            </div>
                                        </td>
                                        <td onClick={() => onSelectTask(task)} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <span>{task.title}</span>
                                                {isOverdue && (
                                                    <span className="relative flex h-2 w-2" title="Atrasado">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                            <div className={`h-2.5 w-2.5 rounded-full mr-2 ${STATUS_COLORS[task.status]}`}></div>
                                            {task.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getCategory(task.categoryId)?.name}</td>
                                        <td className="px-6 py-4">
                                            {tag && <span className={`px-2 py-1 font-semibold leading-tight rounded-full ${tag.bgColor} ${tag.color}`}>{tag.name}</span>}
                                        </td>
                                        <td className="px-6 py-4">{formatDate(task.dueDate)}</td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                     <p className="text-center text-gray-500 dark:text-gray-400 py-10">Nenhuma tarefa encontrada.</p>
                </div>
            )}
        </div>
      )}
      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]" onClick={() => setIsExportModalOpen(false)}>
            <div className="bg-white dark:bg-[#21262D] rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Exportar Tarefas</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {selectedTaskIds.size} {selectedTaskIds.size === 1 ? 'tarefa selecionada' : 'tarefas selecionadas'} para exportação.
                </p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">Cancelar</button>
                    <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold flex items-center gap-2 transition-all shadow-md">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Exportar CSV
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ListView;
