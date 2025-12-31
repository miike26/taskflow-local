
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SunIcon, MoonIcon, SearchIcon, PlusIcon, BellIcon, ClockIcon, ChevronDownIcon, UserCircleIcon, BroomIcon, ClipboardDocumentCheckIcon, CheckCircleIcon, DashboardIcon, CalendarIcon, ListIcon, BarChartIcon, FolderIcon, CheckIcon, Cog6ToothIcon } from './icons';
import type { View, Category, Task, Tag, Status, Notification, Habit, AppSettings } from '../types';
import TaskCard from './TaskCard';
import { STATUS_COLORS, VIEW_TITLES } from '../constants';
import HabitChecklistPopup from './HabitChecklistPopup';

const formatNotificationTime = (dateString: string, timeFormat: '12h' | '24h') => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.setDate(now.getDate() + 1)).toDateString() === date.toDateString();
    
    const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: timeFormat === '12h' ? 'numeric' : '2-digit', 
        minute: '2-digit', 
        hour12: timeFormat === '12h' 
    };
    const time = date.toLocaleTimeString('pt-BR', timeOptions);
    
    if (isToday) return `Hoje, ${time}`;
    if (isTomorrow) return `Amanhã, ${time}`;
    return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}, ${time}`;
};

const NotificationCard: React.FC<{
  notification: Notification;
  task?: Task;
  category?: Category;
  onClick: () => void;
  onSnooze: () => void;
  onMarkHabitComplete: (habitId: string) => void;
  isRead?: boolean;
  timeFormat: '12h' | '24h';
}> = ({ notification, task, category, onClick, onSnooze, onMarkHabitComplete, isRead, timeFormat }) => {
    const [isSnoozing, setIsSnoozing] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    
    const isHabitReminder = notification.taskId.startsWith('habit-');

    if (!task && !isHabitReminder) return null;

    const CategoryIcon = isHabitReminder ? ClipboardDocumentCheckIcon : (category?.icon || BellIcon);
    // Dynamic colors based on read status
    const bgClass = isRead 
        ? 'bg-white dark:bg-[#21262D] opacity-75 hover:opacity-100' 
        : 'bg-blue-50/60 dark:bg-blue-900/10 border-l-4 border-l-primary-500';
    
    const borderClass = isRead
        ? 'border-gray-100 dark:border-gray-800'
        : 'border-blue-100 dark:border-blue-900/30';

    const handleSnooze = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsSnoozing(true);
        setTimeout(() => {
            onSnooze();
        }, 500);
    };

    const handleCompleteHabit = (e: React.MouseEvent) => {
        e.stopPropagation();
        const habitId = notification.taskId.replace('habit-', '');
        onMarkHabitComplete(habitId);
        setIsCompleted(true);
    };
    
    const handleCardClick = () => {
        if (!isHabitReminder) {
            onClick();
        }
    };

    return (
        <li className="mb-2 last:mb-0">
             <div 
                onClick={handleCardClick}
                className={`relative group w-full p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${bgClass} ${borderClass}`}
            >
                <div className="flex gap-4">
                    {/* Icon Column */}
                    <div className="flex-shrink-0 pt-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRead ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-white dark:bg-gray-800 text-primary-500 shadow-sm'}`}>
                            <CategoryIcon className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                {formatNotificationTime(notification.notifyAt, timeFormat)}
                            </span>
                            {!isRead && (
                                <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                            )}
                        </div>
                        
                        <h4 className={`text-sm font-semibold mb-0.5 truncate ${isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                            {notification.taskTitle}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {notification.message}
                        </p>

                        {/* Actions Row */}
                        <div className="flex items-center gap-3 mt-3">
                            {isHabitReminder ? (
                                <button 
                                    onClick={handleCompleteHabit} 
                                    disabled={isCompleted}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                        isCompleted
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default'
                                        : 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/40'
                                    }`}
                                >
                                    {isCompleted ? <CheckIcon className="w-3.5 h-3.5" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
                                    {isCompleted ? 'Concluído' : 'Marcar Feito'}
                                </button>
                            ) : (
                                <button 
                                    onClick={handleSnooze} 
                                    disabled={isSnoozing}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                        isSnoozing
                                        ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-default'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    <ClockIcon className="w-3.5 h-3.5"/>
                                    {isSnoozing ? 'Adiado' : 'Lembrar +2h'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};

const NotificationBell: React.FC<{
  notifications: Notification[];
  unreadNotifications: Notification[];
  tasks: Task[];
  categories: Category[];
  onNotificationClick: (notification: Notification) => void;
  onSnooze: (notification: Notification) => void;
  onMarkHabitComplete: (habitId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAllNotifications: () => void;
  timeFormat: '12h' | '24h';
}> = ({ notifications, unreadNotifications, tasks, categories, onNotificationClick, onSnooze, onMarkHabitComplete, onMarkAllAsRead, onClearAllNotifications, timeFormat }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const readNotifications = useMemo(() => 
        notifications.filter(n => !unreadNotifications.some(un => un.id === n.id)),
        [notifications, unreadNotifications]
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div ref={dropdownRef} className="relative">
            <button onClick={() => setIsOpen(prev => !prev)} className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">
                <BellIcon className="w-6 h-6" />
                {unreadNotifications.length > 0 && (
                    <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-[#21262D]"></span>
                )}
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-[420px] bg-white dark:bg-[#21262D] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden ring-1 ring-black/5 animate-scale-in origin-top-right">
                    <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#21262D]">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Notificações</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                Você tem {unreadNotifications.length} não lidas
                            </p>
                        </div>
                        {unreadNotifications.length > 0 ? (
                           <button onClick={onMarkAllAsRead} className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-1.5 rounded-lg transition-colors">
                                Marcar lidas
                           </button>
                        ) : notifications.length > 0 ? (
                            <button onClick={onClearAllNotifications} title="Limpar todas" className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                <BroomIcon className="w-4 h-4" />
                            </button>
                        ) : null}
                    </div>
                    {notifications.length > 0 ? (
                        <ul className="max-h-[450px] overflow-y-auto p-2 bg-gray-50/50 dark:bg-[#0D1117]/50 custom-scrollbar">
                            {unreadNotifications.length > 0 && (
                                <>
                                    <li className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Novas</li>
                                    {unreadNotifications.map(n => {
                                        const task = tasks.find(t => t.id === n.taskId);
                                        const category = task ? categories.find(c => c.id === task.categoryId) : undefined;
                                        return (
                                            <NotificationCard
                                                key={n.id}
                                                notification={n}
                                                task={task}
                                                category={category}
                                                onClick={() => onNotificationClick(n)}
                                                onSnooze={() => onSnooze(n)}
                                                onMarkHabitComplete={onMarkHabitComplete}
                                                isRead={false}
                                                timeFormat={timeFormat}
                                            />
                                        )
                                    })}
                                </>
                            )}
                             {readNotifications.length > 0 && (
                                <>
                                    <li className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-2">Anteriores</li>
                                    {readNotifications.map(n => {
                                        const task = tasks.find(t => t.id === n.taskId);
                                        const category = task ? categories.find(c => c.id === task.categoryId) : undefined;
                                        return (
                                            <NotificationCard
                                                key={n.id}
                                                notification={n}
                                                task={task}
                                                category={category}
                                                onClick={() => onNotificationClick(n)}
                                                onSnooze={() => onSnooze(n)}
                                                onMarkHabitComplete={onMarkHabitComplete}
                                                isRead={true}
                                                timeFormat={timeFormat}
                                            />
                                        )
                                    })}
                                </>
                            )}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <BellIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-900 dark:text-white font-semibold">Tudo limpo!</p>
                            <p className="text-gray-500 text-sm mt-1">Você não tem novas notificações.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface HabitWithStatus extends Habit {
    isCompleted: boolean;
}

interface HeaderProps {
  currentView: View;
  tasks: Task[];
  tags: Tag[];
  categories: Category[];
  onSelectTask: (task: Task) => void;
  onAddTask: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  globalCategoryFilter: string;
  onCategoryChange: (categoryId: string) => void;
  notifications: Notification[];
  unreadNotifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onSnoozeNotification: (notification: Notification) => void;
  onMarkHabitComplete: (habitId: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  onClearAllNotifications: () => void;
  setCurrentView: (view: View) => void;
  userName: string;
  habitsWithStatus: HabitWithStatus[];
  onToggleHabit: (habitId: string) => void;
  onMarkAllHabitsComplete: () => void;
  onOpenHabitSettings: () => void;
  appSettings: AppSettings;
}

const VIEW_ICONS: Record<View, { icon: React.FC<{ className?: string }>, color?: string }> = {
  dashboard: { icon: DashboardIcon, color: 'text-cyan-500' },
  calendar: { icon: CalendarIcon, color: 'text-cyan-500' },
  list: { icon: ListIcon, color: 'text-cyan-500' },
  reminders: { icon: ClockIcon, color: 'text-cyan-500' },
  reports: { icon: BarChartIcon, color: 'text-cyan-500' },
  profile: { icon: UserCircleIcon, color: 'text-indigo-500' },
  projects: { icon: FolderIcon, color: 'text-cyan-500' },
  taskDetail: { icon: ListIcon, color: 'text-cyan-500' },
  projectDetail: { icon: FolderIcon, color: 'text-cyan-500' },
  settings: { icon: Cog6ToothIcon, color: 'text-cyan-500' },
};

const Header: React.FC<HeaderProps> = ({ currentView, tasks, tags, categories, onSelectTask, onAddTask, theme, toggleTheme, globalCategoryFilter, onCategoryChange, notifications, unreadNotifications, onNotificationClick, onSnoozeNotification, onMarkHabitComplete, onMarkAllNotificationsAsRead, onClearAllNotifications, setCurrentView, userName, habitsWithStatus, onToggleHabit, onMarkAllHabitsComplete, onOpenHabitSettings, appSettings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isHabitPopupOpen, setIsHabitPopupOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<'name' | 'tags'>('name');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  const habitPopupRef = useRef<HTMLDivElement>(null);


  const searchResults = useMemo(() => {
    const grouped: Record<string, Task[]> = {};

    if (!searchQuery) {
        if (searchMode === 'name') {
            return { 'Pendente': [], 'Em andamento': [], 'Concluída': [] };
        }
        return {};
    }

    if (searchMode === 'tags') {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const tasksByTag: Record<string, Task[]> = {};

        tasks.forEach(task => {
            task.tags?.forEach(tag => {
                if (tag.toLowerCase().includes(lowerCaseQuery)) {
                    const groupKey = `#${tag}`;
                    if (!tasksByTag[groupKey]) {
                        tasksByTag[groupKey] = [];
                    }
                    if (!tasksByTag[groupKey].find(t => t.id === task.id)) {
                        tasksByTag[groupKey].push(task);
                    }
                }
            });
        });
        return tasksByTag;

    } else { // searchMode === 'name'
        grouped['Pendente'] = [];
        grouped['Em andamento'] = [];
        grouped['Concluída'] = [];
        
        const filteredTasks = tasks.filter(
          (task) =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filteredTasks.forEach((task) => {
            if (grouped[task.status]) {
              grouped[task.status].push(task);
            }
        });
        return grouped;
    }
  }, [searchQuery, tasks, searchMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (categoryFilterRef.current && !categoryFilterRef.current.contains(event.target as Node)) {
        setIsCategoryFilterOpen(false);
      }
      if (habitPopupRef.current && !habitPopupRef.current.contains(event.target as Node)) {
        setIsHabitPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleResultClick = (task: Task) => {
      onSelectTask(task);
      setSearchQuery('');
      setIsSearchOpen(false);
  }

  const hasResults = useMemo(() => 
    Object.values(searchResults).some(group => Array.isArray(group) && group.length > 0),
  [searchResults]);
  
  const selectedCategoryName = useMemo(() => {
    if (!globalCategoryFilter) return 'Todas as Categorias';
    return categories.find(c => c.id === globalCategoryFilter)?.name || 'Todas as Categorias';
  }, [globalCategoryFilter, categories]);

  const viewTitle = currentView === 'dashboard' ? `Olá, ${userName}!` : VIEW_TITLES[currentView];
  const viewConfig = VIEW_ICONS[currentView];
  const ViewIcon = viewConfig?.icon;

  return (
    <header className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            {ViewIcon && <ViewIcon className={`w-10 h-10 ${viewConfig.color || 'text-gray-800 dark:text-gray-200'}`} />}
            {viewTitle}
        </h2>
        <div className="flex items-center space-x-2">
          <div ref={searchContainerRef} className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(e.target.value.length > 0);
              }}
              onFocus={() => searchQuery && setIsSearchOpen(true)}
              className="bg-white dark:bg-[#21262D] text-gray-900 dark:text-gray-200 rounded-lg pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 w-60 transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/50 focus:border-primary-500"
            />
            {isSearchOpen && hasResults && (
              <div className="absolute top-full mt-2 w-[480px] bg-white dark:bg-[#21262D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-20 max-h-[70vh] overflow-y-auto p-6">
                <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                    <button
                        onClick={() => setSearchMode('name')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${searchMode === 'name' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                    >
                        Nome
                    </button>
                    <button
                        onClick={() => setSearchMode('tags')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${searchMode === 'tags' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                    >
                        Tags
                    </button>
                </div>
                <div className="space-y-6">
                    {Object.keys(searchResults).map((groupKey) => {
                      const tasksInGroup = searchResults[groupKey];
                      if (tasksInGroup.length === 0) return null;
                      
                      const statusColor = STATUS_COLORS[groupKey as Status];

                      return (
                        <div key={groupKey}>
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 px-2 pb-2 mb-3">
                            {statusColor && <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`}></span>}
                            {groupKey}
                          </h4>
                          <div className="space-y-2">
                            {tasksInGroup.map(task => {
                                const category = categories.find(c => c.id === task.categoryId);
                                const tag = tags.find(t => t.id === task.tagId);
                                return (
                                    <div key={task.id} className="rounded-lg hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => handleResultClick(task)}>
                                        <TaskCard
                                          task={task}
                                          category={category}
                                          tag={tag}
                                          onSelect={() => {}} 
                                          variant="compact"
                                        />
                                    </div>
                                );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            {isSearchOpen && !hasResults && searchQuery && (
                <div className="absolute top-full mt-2 w-[480px] bg-white dark:bg-[#21262D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-20 p-6 text-center text-sm text-gray-500">
                    Nenhum resultado encontrado.
                </div>
            )}
          </div>
          <div ref={categoryFilterRef} className="relative hidden md:block">
             <button
                onClick={() => setIsCategoryFilterOpen(prev => !prev)}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium w-48 transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${
                    globalCategoryFilter
                    ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300' 
                    : 'bg-white dark:bg-[#21262D] border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}
             >
                <span className="truncate">{selectedCategoryName}</span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isCategoryFilterOpen ? 'rotate-180' : ''}`} />
             </button>
             {isCategoryFilterOpen && (
                <div className="absolute top-full mt-2 left-0 bg-white dark:bg-[#21262D] p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 w-full space-y-1">
                    <button onClick={() => { onCategoryChange(''); setIsCategoryFilterOpen(false); }} className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Todas as Categorias</span>
                    </button>
                    {categories.map(cat => {
                        const CategoryIcon = cat.icon;
                        return (
                            <button key={cat.id} onClick={() => { onCategoryChange(cat.id); setIsCategoryFilterOpen(false); }} className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10">
                                <CategoryIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
                            </button>
                        )
                    })}
                </div>
             )}
          </div>
          <div ref={habitPopupRef} className="relative">
             <button onClick={() => setIsHabitPopupOpen(prev => !prev)} className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400">
                <ClipboardDocumentCheckIcon className="w-6 h-6" />
                {habitsWithStatus.some(h => !h.isCompleted) && (
                    <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-yellow-400 border-2 border-white dark:border-[#21262D]"></span>
                )}
             </button>
             <HabitChecklistPopup
                isOpen={isHabitPopupOpen}
                onClose={() => setIsHabitPopupOpen(false)}
                habitsWithStatus={habitsWithStatus}
                onToggleHabit={onToggleHabit}
                onMarkAllComplete={onMarkAllHabitsComplete}
                onOpenSettings={onOpenHabitSettings}
              />
          </div>
          <NotificationBell 
            notifications={notifications}
            unreadNotifications={unreadNotifications}
            tasks={tasks}
            categories={categories}
            onNotificationClick={onNotificationClick}
            onSnooze={onSnoozeNotification}
            onMarkHabitComplete={onMarkHabitComplete}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
            onClearAllNotifications={onClearAllNotifications}
            timeFormat={appSettings.timeFormat}
          />
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400">
            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
          </button>
          <button
            onClick={onAddTask}
            className="flex items-center bg-primary-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-600 transition-all shadow-md hover:shadow-lg hover:shadow-primary-400/30 duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-primary-400 dark:hover:ring-offset-[#0D1117]"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Adicionar Tarefa
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
