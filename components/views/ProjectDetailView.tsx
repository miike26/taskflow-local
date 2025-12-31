
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Project, Task, Category, Tag, Status, Notification, Habit, Activity, AppSettings } from '../../types';
import { 
    ChevronLeftIcon, KanbanIcon, TableCellsIcon, ActivityIcon, FolderIcon, SearchIcon, ClipboardDocumentCheckIcon, BellIcon, MoonIcon, SunIcon, PlusIcon, BroomIcon, CheckCircleIcon, ClockIcon, ChevronDownIcon, PencilIcon, TrashIcon, CalendarDaysIcon, XIcon, ChatBubbleLeftEllipsisIcon, ArrowRightLeftIcon, PlusCircleIcon, StopCircleIcon, PlayCircleIcon, SparklesIcon,
    RocketLaunchIcon, CodeBracketIcon, GlobeAltIcon, StarIcon, HeartIcon, ChartPieIcon, ArrowTopRightOnSquareIcon, LinkIcon, CheckIcon, ChevronRightIcon,
    DragHandleIcon, ChatBubbleOvalLeftIcon, DocumentDuplicateIcon, ListBulletIcon, ArrowDownTrayIcon
} from '../icons';
import TaskCard from '../TaskCard';
import { STATUS_COLORS, STATUS_OPTIONS } from '../../constants';
import HabitChecklistPopup from '../HabitChecklistPopup';
import DateRangeCalendar from '../DateRangeCalendar';
import RichTextNoteEditor from '../RichTextNoteEditor';
import Calendar from '../Calendar';

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
                    <div className="flex-shrink-0 pt-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRead ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-white dark:bg-gray-800 text-primary-500 shadow-sm'}`}>
                            <CategoryIcon className="w-5 h-5" />
                        </div>
                    </div>
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

interface ConfirmationDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

const ConfirmationDialog: React.FC<{ state: ConfirmationDialogState; setState: React.Dispatch<React.SetStateAction<ConfirmationDialogState>> }> = ({ state, setState }) => {
    if (!state.isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
            <div className="bg-white dark:bg-[#212D] rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{state.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{state.message}</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setState({ ...state, isOpen: false })} className="px-4 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-500 font-medium transition-colors">Cancelar</button>
                    <button onClick={() => {
                        state.onConfirm();
                        setState({ ...state, isOpen: false });
                    }} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold transition-colors shadow-sm">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const statusConfig: Record<Status, { icon: React.ReactNode; color: string; text: string }> = {
    'Pendente': { icon: <StopCircleIcon className="w-5 h-5"/>, color: 'border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50', text: 'Pendente' },
    'Em andamento': { icon: <PlayCircleIcon className="w-5 h-5"/>, color: 'border-yellow-500 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50', text: 'Em Andamento' },
    'Concluída': { icon: <CheckCircleIcon className="w-5 h-5"/>, color: 'border-green-500 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50', text: 'Concluída' },
};

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { notifyAt: string; message: string }) => void;
    initialData?: Activity | null;
    timeFormat: '12h' | '24h';
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onSave, initialData, timeFormat }) => {
    const [date, setDate] = useState<Date>(new Date());
    const [time, setTime] = useState('09:00');
    const [message, setMessage] = useState('');
    const [calendarDisplayDate, setCalendarDisplayDate] = useState(new Date());
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(isOpen) {
            const initialDate = initialData?.notifyAt ? new Date(initialData.notifyAt) : new Date();
            if(!initialData) { // Set tomorrow 9am for new reminders
                initialDate.setDate(initialDate.getDate() + 1);
                initialDate.setHours(9, 0, 0, 0);
            }
            setDate(initialDate);
            setCalendarDisplayDate(initialDate);
            setTime(initialDate.toTimeString().substring(0,5));
            setMessage(initialData?.note || '');
        }
    }, [isOpen, initialData]);
    
    const formattedDateTime = useMemo(() => {
      const [hours, minutes] = time.split(':').map(Number);
      const combinedDate = new Date(date);
      combinedDate.setHours(hours, minutes, 0, 0);
      return combinedDate.toLocaleString('pt-BR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric',
          hour: timeFormat === '12h' ? 'numeric' : '2-digit', 
          minute: '2-digit', 
          hour12: timeFormat === '12h' 
      });
    }, [date, time, timeFormat]);

    if (!isOpen) return null;

    const handleSave = () => {
        const [hours, minutes] = time.split(':').map(Number);
        const notifyAtDate = new Date(date);
        notifyAtDate.setHours(hours, minutes, 0, 0);
        onSave({ notifyAt: notifyAtDate.toISOString(), message });
    };
    
    const setPreset = (days: number, hours: number, minutes: number) => {
      const newDate = new Date();
      if (days > 0) newDate.setDate(newDate.getDate() + days);
      newDate.setHours(hours, minutes, 0, 0);
      setDate(newDate);
      setTime(newDate.toTimeString().substring(0, 5));
      setCalendarDisplayDate(newDate);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
            <div ref={modalRef} className="bg-white dark:bg-[#161B22] rounded-2xl p-6 shadow-2xl w-full max-w-4xl mx-4 flex gap-8 animate-scale-in">
                <div className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Configurar Lembrete</h3>
                    
                    <div className="space-y-4">
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Horário</label>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex-1 flex items-center gap-2 bg-ice-blue dark:bg-[#0D1117] p-2.5 rounded-lg">
                                    <CalendarDaysIcon className="w-5 h-5 text-gray-500" />
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date)}</span>
                                </div>
                                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                                    className="p-2.5 w-32 rounded-lg border-gray-300 dark:border-gray-700 shadow-sm bg-ice-blue dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 transition-colors duration-200 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                />
                            </div>
                        </div>

                         <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Opções Rápidas</label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button onClick={() => setPreset(0, new Date().getHours() + 2, new Date().getMinutes())} className="text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Daqui 2 horas</button>
                                <button onClick={() => setPreset(1, 9, 0)} className="text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Amanhã, 9:00</button>
                                <button onClick={() => setPreset(2, 9, 0)} className="text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Em 2 dias</button>
                                <button onClick={() => setPreset(7, 9, 0)} className="text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Próxima semana</button>
                            </div>
                        </div>
                        
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mensagem</label>
                            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                                placeholder="Lembrar de..."
                                className="mt-2 block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm bg-ice-blue dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 p-2.5 transition-colors duration-200 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-auto pt-6 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        O lembrete será enviado em:
                      </p>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{formattedDateTime}</p>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button onClick={onClose} className="px-5 py-2.5 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-500 font-semibold text-sm transition-colors hover:border-primary-400">Cancelar</button>
                        <button onClick={handleSave} className="px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold text-sm transition-all duration-200 shadow-sm hover:ring-2 hover:ring-offset-2 hover:ring-primary-400 dark:hover:ring-offset-[#161B22]">Salvar Lembrete</button>
                    </div>
                </div>
                 <Calendar 
                    selectedDate={date} 
                    onSelectDate={setDate}
                    displayDate={calendarDisplayDate}
                    onDisplayDateChange={setCalendarDisplayDate}
                />
            </div>
        </div>
    );
};

const formatActivityTimestamp = (timestamp: string, timeFormat: '12h' | '24h'): string => {
    const activityDate = new Date(timestamp);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    
    const activityDateNoTime = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

    const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: timeFormat === '12h' ? 'numeric' : '2-digit', 
        minute: '2-digit', 
        hour12: timeFormat === '12h' 
    };
    const dateFormat: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

    if (activityDateNoTime.getTime() === startOfToday.getTime()) {
        return activityDate.toLocaleTimeString('pt-BR', timeOptions);
    } else if (activityDateNoTime.getTime() === startOfYesterday.getTime()) {
        return `Ontem, ${activityDate.toLocaleTimeString('pt-BR', timeOptions)}`;
    } else {
        return `${activityDate.toLocaleDateString('pt-BR', dateFormat)} às ${activityDate.toLocaleTimeString('pt-BR', timeOptions)}`;
    }
};

const StatusSpan: React.FC<{ status: Status | string }> = ({ status }) => {
    return <strong>{status}</strong>;
};

const PROJECT_ICONS: Record<string, React.FC<{className?: string}>> = {
    folder: FolderIcon,
    rocket: RocketLaunchIcon,
    code: CodeBracketIcon,
    globe: GlobeAltIcon,
    star: StarIcon,
    heart: HeartIcon,
    chart: ChartPieIcon
};

interface HabitWithStatus extends Habit {
    isCompleted: boolean;
}

const activityConfig: Record<Activity['type'], { icon: React.FC<{className?: string}>; classes: string }> = {
    note: {
        icon: ChatBubbleLeftEllipsisIcon,
        classes: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
    },
    status_change: {
        icon: ArrowRightLeftIcon,
        classes: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
    },
    reminder: {
        icon: BellIcon,
        classes: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300'
    },
    property_change: {
        icon: PencilIcon,
        classes: 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300'
    },
    creation: {
        icon: PlusCircleIcon,
        classes: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
    },
    task_update: {
        icon: ActivityIcon,
        classes: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'
    },
    project: {
        icon: FolderIcon,
        classes: 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300'
    }
};

const ActivityItem: React.FC<{ act: Activity, onDelete: (id: string, type: Activity['type']) => void, timeFormat: '12h' | '24h' }> = ({ act, onDelete, timeFormat }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const time = formatActivityTimestamp(act.timestamp, timeFormat);
    const isAi = act.isAiGenerated;
    let config = activityConfig[act.type] || activityConfig.creation;
    const Icon = isAi ? SparklesIcon : config.icon;
    
    const isBulkChange = act.type === 'status_change' && (act.count || 0) > 1 && !!act.affectedTasks;

    const styleClass = isAi 
        ? 'bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-purple-600 dark:text-purple-300' 
        : config.classes;

    return (
        <li className="group flex items-start space-x-3 py-3 border-b border-dashed border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className={`rounded-full p-1.5 mt-1 ${styleClass}`}>
                <Icon className="w-4 h-4"/>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                    <span className="font-semibold">{act.user}</span>{' '}
                    
                    {act.type === 'creation' && !act.taskTitle && 'criou este projeto.'}
                    {act.type === 'creation' && act.taskTitle && (
                        <>
                            {(act.note?.includes('removida') || act.note?.includes('desvinculada')) ? 'removeu' : 'adicionou'} a tarefa <strong>{act.taskTitle}</strong>.
                        </>
                    )}
                    
                    {act.type === 'project' && act.taskTitle && (
                        act.action === 'added' ? <>adicionou a tarefa <strong>{act.taskTitle}</strong> a este projeto.</> :
                        act.action === 'removed' ? <>removeu a tarefa <strong>{act.taskTitle}</strong> deste projeto.</> :
                        'atualizou o projeto.'
                    )}
                    
                    {act.type === 'note' && (isAi ? 'sumarizou anotações com IA:' : 'adicionou uma nota ao projeto:')}
                    
                    {isBulkChange ? (
                        <>
                            alterou <strong>{act.count} tarefas</strong> de <StatusSpan status={act.from!} /> para <StatusSpan status={act.to!} />
                            <button onClick={() => setIsExpanded(!isExpanded)} className="ml-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline text-xs font-semibold focus:outline-none">
                                {isExpanded ? '(ocultar)' : '(detalhes)'}
                            </button>.
                        </>
                    ) : (
                        act.type === 'status_change' && (
                            <>
                                alterou o status de <strong>{act.taskTitle}</strong> de <StatusSpan status={act.from!} /> para <StatusSpan status={act.to!} />.
                            </>
                        )
                    )}

                    {act.type === 'property_change' && (
                         <>alterou {act.property} de <strong>{act.oldValue}</strong> para <strong>{act.newValue}</strong>.</>
                    )}
                </p>

                {isBulkChange && isExpanded && act.affectedTasks && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                        <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                            {act.affectedTasks.map((title, idx) => (
                                <li key={idx} className="truncate">{title}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {act.type === 'note' && act.note && (
                    <div className={`mt-1 p-2 border rounded-md text-sm note-content break-words ${isAi ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'}`} dangerouslySetInnerHTML={{ __html: act.note }}/>
                )}
                
                {act.type === 'reminder' && act.notifyAt && (
                    <div className="mt-1 p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900/50 text-sm">
                        <p className="font-semibold">
                            {new Date(act.notifyAt).toLocaleDateString('pt-BR', { dateStyle: 'full' })}, {new Date(act.notifyAt).toLocaleTimeString('pt-BR', { hour: timeFormat === '12h' ? 'numeric' : '2-digit', minute: '2-digit', hour12: timeFormat === '12h' })}
                        </p>
                        {act.note && <p className="mt-1 italic">"{act.note}"</p>}
                    </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{time}</p>
            </div>
            
            {(act.type === 'note' || act.type === 'reminder') && (
                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onDelete(act.id, act.type)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                </div>
            )}
        </li>
    );
};

interface ProjectDetailViewProps {
    project: Project;
    tasks: Task[];
    allTasks: Task[];
    categories: Category[];
    tags: Tag[];
    onBack: () => void;
    onSelectTask: (task: Task) => void;
    onUpdateTaskStatus: (taskId: string, status: Status) => void;
    onAddTask: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    notifications: Notification[];
    unreadNotifications: Notification[];
    onNotificationClick: (notification: Notification) => void;
    onSnoozeNotification: (notification: Notification) => void;
    onMarkHabitComplete: (habitId: string) => void;
    onMarkAllNotificationsAsRead: () => void;
    onClearAllNotifications: () => void;
    userName: string;
    habitsWithStatus: HabitWithStatus[];
    onToggleHabit: (habitId: string) => void;
    onMarkAllHabitsComplete: () => void;
    onOpenHabitSettings: () => void;
    onEditProject: (projectId: string, updates: Partial<Project>) => void;
    onDeleteProject: (projectId: string) => void;
    onBulkStatusChange: (taskIds: string[], newStatus: Status) => void;
    onBulkDelete: (taskIds: string[]) => void;
    appSettings: AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

type TableSortKey = 'title' | 'categoryId' | 'tagId' | 'dueDate' | 'status';

const PROJECT_COLORS = [
    { name: 'Blue', bg: 'bg-blue-500' },
    { name: 'Green', bg: 'bg-green-500' },
    { name: 'Yellow', bg: 'bg-yellow-500' },
    { name: 'Purple', bg: 'bg-purple-500' },
    { name: 'Red', bg: 'bg-red-500' },
    { name: 'Pink', bg: 'bg-pink-500' },
    { name: 'Indigo', bg: 'bg-indigo-500' },
    { name: 'Cyan', bg: 'bg-cyan-500' },
    { name: 'Teal', bg: 'bg-teal-500' },
    { name: 'Orange', bg: 'bg-orange-500' },
    { name: 'Gray', bg: 'bg-gray-500' },
];

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
    title: string;
    tasks: Task[];
    categories: Category[];
    tags: Tag[];
    onSelectTask: (task: Task) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: Status) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
    disableOverdueColor: boolean;
}> = ({ title, tasks, categories, tags, onSelectTask, onDrop, onDragStart, disableOverdueColor }) => {
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
        onDrop(e, title as Status);
    };

    return (
        <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col px-2 rounded-xl transition-colors flex-1 border ${isOver ? 'bg-primary-100/40 dark:bg-primary-900/30 border-primary-400' : 'border-gray-300 dark:border-gray-700'}`}
        >
            <h3 className="flex items-center gap-2 flex-shrink-0 font-semibold text-xl text-gray-800 dark:text-gray-200 p-4 pb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[title as Status]}`}></span>
                {title} 
                <span className="text-sm font-normal text-gray-500">({tasks.length})</span>
            </h3>
            <div className="flex-1 space-y-3 overflow-y-auto p-2 custom-scrollbar">
                {tasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        category={categories.find(c => c.id === task.categoryId)}
                        tag={tags.find(t => t.id === task.tagId)}
                        onSelect={onSelectTask}
                        isDraggable={true}
                        onDragStart={onDragStart}
                        variant="compact"
                        disableOverdueColor={disableOverdueColor}
                        isOverdue={task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Concluída'}
                    />
                ))}
            </div>
        </div>
    );
};

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ 
    project, 
    tasks, 
    allTasks,
    categories, 
    tags, 
    onBack, 
    onSelectTask, 
    onUpdateTaskStatus,
    onAddTask,
    theme,
    toggleTheme,
    notifications,
    unreadNotifications,
    onNotificationClick,
    onSnoozeNotification,
    onMarkHabitComplete,
    onMarkAllNotificationsAsRead,
    onClearAllNotifications,
    userName,
    habitsWithStatus,
    onToggleHabit,
    onMarkAllHabitsComplete,
    onOpenHabitSettings,
    onEditProject,
    onDeleteProject,
    onBulkStatusChange,
    onBulkDelete,
    appSettings,
    setAppSettings
}) => {
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchMode, setSearchMode] = useState<'name' | 'tags'>('name'); // Added searchMode state
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [isHabitPopupOpen, setIsHabitPopupOpen] = useState(false);
    const habitPopupRef = useRef<HTMLDivElement>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editProjectName, setEditProjectName] = useState(project.name);
    const [editProjectDesc, setEditProjectDesc] = useState(project.description || '');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const iconPickerRef = useRef<HTMLDivElement>(null);
    const [newNote, setNewNote] = useState('');
    const [isNoteEditorExpanded, setIsNoteEditorExpanded] = useState(false);
    const [activityFilter, setActivityFilter] = useState<'all' | 'notes' | 'changes' | 'reminders'>('all');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    const [confirmationState, setConfirmationState] = useState<ConfirmationDialogState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isAiGenerated, setIsAiGenerated] = useState(false);
    const [isSummaryDropdownOpen, setIsSummaryDropdownOpen] = useState(false);
    const summaryDropdownRef = useRef<HTMLDivElement>(null);
    const [filterCategories, setFilterCategories] = useState<string[]>([]);
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [filterStatuses, setFilterStatuses] = useState<Status[]>([]);
    const [creationDateRangeFilter, setCreationDateRangeFilter] = useState<{ startDate: Date | null, endDate: Date | null }>({ startDate: null, endDate: null });
    const [dueDateRangeFilter, setDueDateRangeFilter] = useState<{ startDate: Date | null, endDate: Date | null }>({ startDate: null, endDate: null });
    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const closeTimer = useRef<number | null>(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState(new Set<string>());
    const [tableSortConfig, setTableSortConfig] = useState<{ key: TableSortKey; direction: 'asc' | 'desc' } | null>(null);
    const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    
    // New state for Export Modal
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const small = window.innerWidth < 1280;
            setIsSmallScreen(small);
            if (small) { // xl breakpoint
                setIsHistoryCollapsed(true);
            } else {
                setIsHistoryCollapsed(false);
            }
        };
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getCategory = (id: string) => categories.find(c => c.id === id);
    const getTag = (id: string) => tags.find(t => t.id === id);

    const filteredAndSortedTasks = useMemo(() => {
        let results = tasks.filter(task => {
            const categoryMatch = filterCategories.length === 0 || filterCategories.includes(task.categoryId);
            const tagMatch = filterTags.length === 0 || filterTags.includes(task.tagId);
            const statusMatch = filterStatuses.length === 0 || filterStatuses.includes(task.status);
            
            const creationDateMatch = (() => {
                if (!creationDateRangeFilter.startDate || !creationDateRangeFilter.endDate) return true;
                const taskDate = new Date(task.dateTime);
                const startDate = new Date(creationDateRangeFilter.startDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(creationDateRangeFilter.endDate);
                endDate.setHours(23, 59, 59, 999);
                return taskDate >= startDate && taskDate <= endDate;
            })();

            const dueDateMatch = (() => {
                if (!dueDateRangeFilter.startDate || !dueDateRangeFilter.endDate) return true;
                if (!task.dueDate) return false;
                const taskDate = new Date(task.dueDate);
                const startDate = new Date(dueDateRangeFilter.startDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(dueDateRangeFilter.endDate);
                endDate.setHours(23, 59, 59, 999);
                return taskDate >= startDate && taskDate <= endDate;
            })();

            return categoryMatch && tagMatch && statusMatch && creationDateMatch && dueDateMatch;
        });

        if (viewMode === 'list') {
            if (tableSortConfig) {
                results.sort((a, b) => {
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
                results.sort(defaultTableSort);
            }
        }

        return results;
    }, [tasks, filterCategories, filterTags, filterStatuses, creationDateRangeFilter, dueDateRangeFilter, viewMode, tableSortConfig, categories, tags]);

    const pendingTasks = filteredAndSortedTasks.filter(t => t.status === 'Pendente');
    const inProgressTasks = filteredAndSortedTasks.filter(t => t.status === 'Em andamento');
    const completedTasks = filteredAndSortedTasks.filter(t => t.status === 'Concluída');

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleKanbanDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: Status) => {
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) onUpdateTaskStatus(taskId, newStatus);
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

    const handleBulkStatusChangeRequest = (newStatus: Status) => {
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
            if (habitPopupRef.current && !habitPopupRef.current.contains(event.target as Node)) {
                setIsHabitPopupOpen(false);
            }
            if (summaryDropdownRef.current && !summaryDropdownRef.current.contains(event.target as Node)) {
                setIsSummaryDropdownOpen(false);
            }
            if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
                setIsIconPickerOpen(false);
            }
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
                setIsFilterDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            
            const filteredSearchTasks = tasks.filter(
              (task) =>
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );

            filteredSearchTasks.forEach((task) => {
                if (grouped[task.status]) {
                  grouped[task.status].push(task);
                }
            });
            return grouped;
        }
    }, [searchQuery, tasks, searchMode]);

    const hasResults = useMemo(() => Object.values(searchResults).some(group => Array.isArray(group) && group.length > 0), [searchResults]);

    const handleResultClick = (task: Task) => {
        onSelectTask(task);
        setSearchQuery('');
        setIsSearchOpen(false);
    };

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

    const handleSaveEditProject = () => {
        if (!editProjectName.trim()) return;
        onEditProject(project.id, { name: editProjectName.trim(), description: editProjectDesc.trim() });
        setIsEditModalOpen(false);
    };

    const formatDateShort = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('pt-BR') : 'N/A';

    const creationDateFilterLabel = creationDateRangeFilter.startDate && creationDateRangeFilter.endDate
        ? `Criação: ${formatDateShort(creationDateRangeFilter.startDate)} - ${formatDateShort(creationDateRangeFilter.endDate)}`
        : 'Data de Criação';
        
    const dueDateFilterLabel = dueDateRangeFilter.startDate && dueDateRangeFilter.endDate
        ? `Prazo: ${formatDateShort(dueDateRangeFilter.startDate)} - ${formatDateShort(dueDateRangeFilter.endDate)}`
        : 'Prazo Final';

    const filterCheckboxClass = "appearance-none h-4 w-4 rounded-md border-2 border-gray-300 dark:border-gray-600 checked:bg-primary-500 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600";
    const checkboxClass = "appearance-none h-4 w-4 rounded-md border-2 border-gray-300 dark:border-gray-600 checked:bg-primary-500 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800";

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

    const handleAddNote = () => {
        if (!newNote.replace(/<[^>]*>/g, '').trim()) return;
        const activityEntry: Activity = {
            id: `proj-act-${Date.now()}`, 
            type: 'note', 
            timestamp: new Date().toISOString(), 
            note: newNote, 
            user: userName,
            isAiGenerated: isAiGenerated
        };
        onEditProject(project.id, { activity: [...(project.activity || []), activityEntry] });
        setNewNote('');
        setIsNoteEditorExpanded(false);
        setIsAiGenerated(false);
    };

    const handleDeleteActivity = (activityId: string, type: Activity['type']) => {
        setConfirmationState({
            isOpen: true,
            title: 'Excluir Item',
            message: 'Tem certeza que deseja excluir este item do histórico?',
            onConfirm: () => {
                const updatedActivity = project.activity.filter(a => a.id !== activityId);
                onEditProject(project.id, { activity: updatedActivity });
            }
        });
    };

    const filteredActivity = useMemo(() => {
        if (!project.activity) return [];
        switch(activityFilter) {
            case 'notes': return project.activity.filter(a => a.type === 'note');
            case 'reminders': return project.activity.filter(a => a.type === 'reminder');
            case 'changes': return project.activity.filter(a => a.type === 'status_change' || a.type === 'creation' || a.type === 'property_change' || a.type === 'project');
            default: return project.activity;
        }
    }, [activityFilter, project.activity]);

    const handleSummarizeProject = async (mode: 'project' | 'full') => {
        setIsSummaryDropdownOpen(false);

        if (!appSettings.enableAi) {
            setConfirmationState({
                isOpen: true,
                title: "Ativar Recursos de IA",
                message: "Para utilizar o resumo inteligente, é necessário ativar os Recursos de IA. Deseja ativar agora?",
                onConfirm: () => setAppSettings(prev => ({ ...prev, enableAi: true }))
            });
            return;
        }

        setIsSummarizing(true);
        setIsNoteEditorExpanded(true);
        setIsAiGenerated(true);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            let context = `Project: ${project.name}\nDescription: ${project.description || 'N/A'}\n\nTimeline of Events:\n`;
            
            let allActivities: { timestamp: string, text: string }[] = [];

            const projectActivities = project.activity || [];
            projectActivities.forEach(act => {
                const dateStr = new Date(act.timestamp).toLocaleString('pt-BR');
                let text = '';
                if (act.type === 'note') text = `[Projeto] Nota: ${act.note?.replace(/<[^>]*>/g, '')}`;
                else if (act.type === 'creation') text = `[Projeto] Criado por ${act.user}`;
                else if (act.type === 'status_change') text = `[Projeto] Status de tarefa "${act.taskTitle}" alterado para ${act.to}`;
                else if (act.type === 'project') {
                     if (act.action === 'added') text = `[Projeto] Tarefa "${act.taskTitle}" adicionada`;
                     else if (act.action === 'removed') text = `[Projeto] Tarefa "${act.taskTitle}" removida`;
                }

                if (text && (mode === 'full' || act.type === 'note')) {
                     allActivities.push({ timestamp: act.timestamp, text: `[${dateStr}] ${text}` });
                }
            });

            if (mode === 'full') {
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                projectTasks.forEach(task => {
                    task.activity.forEach(act => {
                        const dateStr = new Date(act.timestamp).toLocaleString('pt-BR');
                        let text = '';
                        if (act.type === 'note') text = `[Tarefa: ${task.title}] Nota: ${act.note?.replace(/<[^>]*>/g, '')}`;
                        else if (act.type === 'status_change') text = `[Tarefa: ${task.title}] Status alterado de ${act.from} para ${act.to}`;
                        else if (act.type === 'creation') text = `[Tarefa: ${task.title}] Criada`;
                        
                        if (text) {
                            allActivities.push({ timestamp: act.timestamp, text: `[${dateStr}] ${text}` });
                        }
                    });
                });
            }

            allActivities.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            if (allActivities.length === 0) {
                setNewNote("Não há atividades suficientes para gerar um resumo.");
                setIsSummarizing(false);
                return;
            }

            context += allActivities.map(a => a.text).join('\n');
            
            const prompt = `Atue como um assistente de gerenciamento de projetos. Resuma o contexto fornecido abaixo em Português do Brasil.
            Regras estritas:
            1. Baseie-se APENAS nas informações fornecidas. Não invente fatos.
            2. Formate a resposta utilizando tags HTML simples (p, ul, li, strong, em) para criar um resumo organizado e fácil de ler. Não use Markdown (como ** ou -).
            3. Destaque pontos importantes, decisões e o progresso geral.
            
            ${context}`;
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setNewNote(response.text || '');
        } catch (e) {
            console.error("Error summarizing:", e);
            setNewNote("Erro ao gerar resumo. Por favor, tente novamente.");
            setIsAiGenerated(false);
        } finally {
            setIsSummarizing(false);
        }
    };

    const CurrentIcon = project.icon && PROJECT_ICONS[project.icon] ? PROJECT_ICONS[project.icon] : FolderIcon;

    const activityFilterOptions: { value: 'all' | 'notes' | 'changes' | 'reminders'; label: string }[] = [
        { value: 'all', label: 'Todas' },
        { value: 'notes', label: 'Anotações' },
        { value: 'changes', label: 'Alterações' },
    ];

    const currentFilterLabel = activityFilterOptions.find(o => o.value === activityFilter)?.label || 'Todas';

    return (
        <div className="flex flex-col h-full p-4 overflow-hidden gap-6">
            <ConfirmationDialog state={confirmationState} setState={setConfirmationState} />
            
            {/* Edit Project Modal ... */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-white dark:bg-[#21262D] rounded-xl p-6 shadow-2xl max-w-md w-full mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Editar Projeto</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Projeto</label>
                                <input
                                    type="text"
                                    value={editProjectName}
                                    onChange={e => setEditProjectName(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-ice-blue dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 p-2.5 hover:border-primary-400 dark:hover:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/50 focus:border-primary-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                                <textarea
                                    value={editProjectDesc}
                                    onChange={e => setEditProjectDesc(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-ice-blue dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 p-2.5 hover:border-primary-400 dark:hover:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/50 focus:border-primary-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                            <button onClick={handleSaveEditProject} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold">Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <header className="flex items-center justify-between pb-4 gap-4 flex-shrink-0">
                {/* Left: Project Info ... */}
                <div className="flex-1 flex items-center gap-4 min-w-0">
                    <button 
                        onClick={onBack} 
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    
                    <div className="flex items-center gap-3 flex-1 min-w-0 group/title relative">
                        <div ref={iconPickerRef} className="relative flex-shrink-0">
                            <button 
                                onClick={() => setIsIconPickerOpen(true)}
                                className={`p-1.5 rounded-lg ${project.color} bg-opacity-20 flex-shrink-0 hover:bg-opacity-30 transition-all cursor-pointer`}
                                title="Alterar ícone e cor"
                            >
                                <CurrentIcon className={`w-6 h-6 ${project.color.replace('bg-', 'text-')}`} />
                            </button>
                            {/* ... Icon Picker ... */}
                            {isIconPickerOpen && (
                                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#21262D] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 w-64 p-4 animate-scale-in">
                                    <div className="mb-4">
                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Cor do Projeto</h4>
                                        <div className="grid grid-cols-4 gap-2">
                                            {PROJECT_COLORS.map((color) => (
                                                <button
                                                    key={color.name}
                                                    onClick={() => onEditProject(project.id, { color: color.bg })}
                                                    className={`w-8 h-8 rounded-full ${color.bg} ${project.color === color.bg ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-[#21262D]' : 'hover:opacity-80'} transition-all`}
                                                    title={color.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Ícone</h4>
                                        <div className="grid grid-cols-4 gap-2">
                                            {Object.keys(PROJECT_ICONS).map((iconKey) => {
                                                const IconComp = PROJECT_ICONS[iconKey];
                                                const isActive = (project.icon || 'folder') === iconKey;
                                                return (
                                                    <button
                                                        key={iconKey}
                                                        onClick={() => onEditProject(project.id, { icon: iconKey })}
                                                        className={`p-2 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-gray-100 dark:bg-gray-700 text-primary-500' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                    >
                                                        <IconComp className="w-5 h-5" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white truncate cursor-default" title={project.description}>
                            {project.name}
                        </h2>
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    
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
                            className="bg-white dark:bg-[#161B22] text-gray-900 dark:text-gray-200 rounded-lg pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 w-60 transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/50 focus:border-primary-500"
                        />
                        {isSearchOpen && hasResults && (
                            <div className="absolute top-full right-0 mt-2 w-[480px] bg-white dark:bg-[#21262D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-20 max-h-96 overflow-y-auto p-6">
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
                                    {(Object.keys(searchResults) as string[]).map((groupKey) => {
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
                                                    {tasksInGroup.map(task => (
                                                        <div key={task.id} className="cursor-pointer" onClick={() => handleResultClick(task)}>
                                                            <TaskCard
                                                                task={task}
                                                                category={getCategory(task.categoryId)}
                                                                tag={getTag(task.tagId)}
                                                                onSelect={() => {}} 
                                                                variant="compact"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                         {isSearchOpen && !hasResults && searchQuery && (
                            <div className="absolute top-full right-0 mt-2 w-[480px] bg-white dark:bg-[#21262D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-20 p-6 text-center text-sm text-gray-500">
                                Nenhum resultado encontrado neste projeto.
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
                        tasks={allTasks}
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

                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>

                    <button
                        onClick={() => {
                            setEditProjectName(project.name);
                            setEditProjectDesc(project.description || '');
                            setIsEditModalOpen(true);
                        }}
                        title="Editar Projeto"
                        className="flex items-center justify-center p-2.5 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-gray-400 dark:hover:ring-offset-[#0D1117]"
                    >
                        <PencilIcon className="w-5 h-5"/>
                    </button>

                    <button
                        onClick={() => onDeleteProject(project.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-md hover:shadow-lg hover:shadow-red-400/30 duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-red-400 dark:hover:ring-offset-[#0D1117]"
                    >
                        <TrashIcon className="w-5 h-5"/>
                        <span className="hidden sm:inline">Excluir Projeto</span>
                    </button>

                    <button
                        onClick={onAddTask}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all shadow-md hover:shadow-lg hover:shadow-primary-400/30 duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-primary-400 dark:hover:ring-offset-[#0D1117] ml-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Adicionar Tarefa</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area - Tasks Left, Activity Right */}
            <div className="flex flex-1 min-h-0 gap-6">
                
                {/* Left: Tasks Container (Flex-1 to take available space) */}
                <div className="flex-1 bg-white dark:bg-[#161B22] p-6 rounded-2xl shadow-lg flex flex-col min-w-0 animate-slide-up-fade-in">
                    
                    {/* Tasks Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 flex-shrink-0">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Category Filter */}
                            <div className="relative" onMouseEnter={() => handleFilterMouseEnter('category')} onMouseLeave={handleFilterMouseLeave}>
                                <button className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${filterCategories.length > 0 ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300' : 'bg-white dark:bg-[#21262D] border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'}`}>
                                    <span>Categoria</span>
                                    {filterCategories.length > 0 && <span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{filterCategories.length}</span>}
                                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${openFilter === 'category' ? 'rotate-180' : ''}`} />
                                </button>
                                {openFilter === 'category' && (
                                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#21262D] p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 w-60 space-y-1">
                                        {categories.map(cat => (
                                            <label key={cat.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer">
                                                <input type="checkbox" checked={filterCategories.includes(cat.id)} onChange={() => handleMultiSelectFilterChange(setFilterCategories)(cat.id)} className={filterCheckboxClass}/>
                                                <cat.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Priority Filter */}
                            <div className="relative" onMouseEnter={() => handleFilterMouseEnter('priority')} onMouseLeave={handleFilterMouseLeave}>
                                <button className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${filterTags.length > 0 ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300' : 'bg-white dark:bg-[#21262D] border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'}`}>
                                    <span>Prioridade</span>
                                    {filterTags.length > 0 && <span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{filterTags.length}</span>}
                                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${openFilter === 'priority' ? 'rotate-180' : ''}`} />
                                </button>
                                {openFilter === 'priority' && (
                                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#21262D] p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 w-60 space-y-1">
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
                                <button className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${filterStatuses.length > 0 ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300' : 'bg-white dark:bg-[#21262D] border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'}`}>
                                    <span>Status</span>
                                    {filterStatuses.length > 0 && <span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{filterStatuses.length}</span>}
                                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${openFilter === 'status' ? 'rotate-180' : ''}`} />
                                </button>
                                {openFilter === 'status' && (
                                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#21262D] p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 w-60 space-y-1">
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
                                <button className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${creationDateRangeFilter.startDate ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300' : 'bg-white dark:bg-[#21262D] border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'}`}>
                                    <CalendarDaysIcon className="w-4 h-4" />
                                    <span className="truncate max-w-[100px]">{creationDateFilterLabel}</span>
                                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${openFilter === 'creationDate' ? 'rotate-180' : ''}`} />
                                </button>
                                {openFilter === 'creationDate' && (
                                    <div className="absolute top-full left-0 mt-2 bg-transparent z-20">
                                        <DateRangeCalendar
                                            range={creationDateRangeFilter}
                                            onApply={(range) => { setCreationDateRangeFilter(range); setOpenFilter(null); }}
                                            onClear={() => { setCreationDateRangeFilter({ startDate: null, endDate: null }); setOpenFilter(null); }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Due Date Filter */}
                            <div className="relative" onMouseEnter={() => handleFilterMouseEnter('dueDate')} onMouseLeave={handleFilterMouseLeave}>
                                <button className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${dueDateRangeFilter.startDate ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300' : 'bg-white dark:bg-[#21262D] border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'}`}>
                                    <CalendarDaysIcon className="w-4 h-4" />
                                    <span className="truncate max-w-[100px]">{dueDateFilterLabel}</span>
                                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${openFilter === 'dueDate' ? 'rotate-180' : ''}`} />
                                </button>
                                {openFilter === 'dueDate' && (
                                    <div className="absolute top-full left-0 mt-2 bg-transparent z-20">
                                        <DateRangeCalendar
                                            range={dueDateRangeFilter}
                                            onApply={(range) => { setDueDateRangeFilter(range); setOpenFilter(null); }}
                                            onClear={() => { setDueDateRangeFilter({ startDate: null, endDate: null }); setOpenFilter(null); }}
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

                        {/* View Toggle */}
                        <div className="flex items-center bg-gray-100 dark:bg-[#0D1117] p-1 rounded-lg">
                            <button 
                                onClick={() => setViewMode('kanban')} 
                                className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'kanban' ? 'bg-white dark:bg-[#21262D] shadow text-primary-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                title="Visualização Kanban"
                            >
                                <KanbanIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')} 
                                className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-white dark:bg-[#21262D] shadow text-primary-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                title="Visualização Tabela"
                            >
                                <TableCellsIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Bulk Actions Bar */}
                    {viewMode === 'list' && selectedTaskIds.size > 0 && (
                        <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg flex items-center gap-4 animate-fade-in relative z-20">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">{selectedTaskIds.size} selecionada(s)</span>
                            <div className="relative group">
                                <button className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm transition-all duration-200 hover:ring-2 hover:ring-primary-400">
                                    Marcar como...
                                </button>
                                {/* Wrapper with padding to bridge the gap */}
                                <div className="absolute top-full left-0 pt-1 w-40 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                    <div className="bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                        {STATUS_OPTIONS.map(status => (
                                            <a key={status} href="#" onClick={(e) => { e.preventDefault(); handleBulkStatusChangeRequest(status); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">{status}</a>
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

                    {viewMode === 'list' ? (
                        <div className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden flex flex-col min-h-0 bg-white dark:bg-[#161B22]">
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
                                                    { {title: 'Tarefa', status: 'Status', categoryId: 'Categoria', tagId: 'Prioridade', dueDate: 'Prazo'}[key] }
                                                    { tableSortConfig?.key === key && (<span>{tableSortConfig.direction === 'asc' ? ' ▲' : ' ▼'}</span>) }
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSortedTasks.length > 0 ? (
                                            filteredAndSortedTasks.map(task => {
                                                const tag = getTag(task.tagId);
                                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Concluída';
                                                const showOverdueStyle = isOverdue && !appSettings.disableOverdueColor;
                                                return (
                                                    <tr key={task.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${showOverdueStyle ? 'bg-red-50 dark:bg-red-900/10' : 'bg-white dark:bg-[#161B22]'}`}>
                                                        <td className="w-4 p-4">
                                                            <div className="flex items-center">
                                                                <input id={`checkbox-${task.id}`} type="checkbox"
                                                                checked={selectedTaskIds.has(task.id)}
                                                                onChange={() => handleSelectOne(task.id)}
                                                                className={checkboxClass} />
                                                                <label htmlFor={`checkbox-${task.id}`} className="sr-only">checkbox</label>
                                                            </div>
                                                        </td>
                                                        <td onClick={() => onSelectTask(task)} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white cursor-pointer hover:underline">
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
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                    Nenhuma tarefa encontrada.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex gap-6 overflow-x-auto pb-2 min-h-0">
                            <KanbanColumn 
                                title="Pendente" 
                                tasks={pendingTasks} 
                                categories={categories} 
                                tags={tags} 
                                onSelectTask={onSelectTask}
                                onDrop={handleKanbanDrop}
                                onDragStart={handleDragStart}
                                disableOverdueColor={appSettings.disableOverdueColor}
                            />
                            <KanbanColumn 
                                title="Em andamento" 
                                tasks={inProgressTasks} 
                                categories={categories} 
                                tags={tags} 
                                onSelectTask={onSelectTask}
                                onDrop={handleKanbanDrop}
                                onDragStart={handleDragStart}
                                disableOverdueColor={appSettings.disableOverdueColor}
                            />
                            <KanbanColumn 
                                title="Concluída" 
                                tasks={completedTasks} 
                                categories={categories} 
                                tags={tags} 
                                onSelectTask={onSelectTask}
                                onDrop={handleKanbanDrop}
                                onDragStart={handleDragStart}
                                disableOverdueColor={appSettings.disableOverdueColor}
                            />
                        </div>
                    )}
                </div>

                {/* Right: Activity Log */}
                {isHistoryCollapsed ? (
                    <div 
                        onClick={() => setIsHistoryCollapsed(false)}
                        className="w-12 flex-shrink-0 bg-white dark:bg-[#161B22] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                        title="Expandir Histórico"
                    >
                        <ChevronLeftIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform" />
                    </div>
                ) : (
                    <div className="w-[480px] flex-shrink-0 bg-white dark:bg-[#161B22] p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-hidden">
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Histórico do Projeto</h3>
                            <div className="flex items-center gap-2">
                                {isSmallScreen && (
                                    <button
                                        onClick={() => setIsHistoryCollapsed(true)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                        title="Recolher"
                                    >
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </button>
                                )}
                                <div ref={summaryDropdownRef} className="relative">
                                    <button
                                        onClick={() => setIsSummaryDropdownOpen(prev => !prev)}
                                        disabled={isSummarizing}
                                        className="group flex items-center justify-center p-2 rounded-full bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 shadow-sm hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:bg-gradient-to-r hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:ring-2 hover:ring-purple-400 hover:ring-offset-2 dark:hover:ring-offset-[#161B22]"
                                    >
                                        <SparklesIcon className={`w-4 h-4 flex-shrink-0 ${isSummarizing ? 'animate-spin' : ''}`} />
                                        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap ml-0 group-hover:ml-2 text-xs font-medium">
                                            Sumarizar
                                        </span>
                                        <ChevronDownIcon className="w-3 h-3 ml-1" />
                                    </button>
                                    {isSummaryDropdownOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#21262D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden animate-scale-in">
                                            <button 
                                                onClick={() => handleSummarizeProject('project')}
                                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
                                            >
                                                Do projeto
                                            </button>
                                            <button 
                                                onClick={() => handleSummarizeProject('full')}
                                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
                                            >
                                                Do projeto + Tarefas
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div ref={filterDropdownRef} className="relative">
                                    <button
                                        onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                        className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${
                                            activityFilter !== 'all'
                                            ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300'
                                            : 'bg-white dark:bg-[#0D1117] border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        <span>{currentFilterLabel}</span>
                                        <ChevronDownIcon className={`w-3 h-3 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {isFilterDropdownOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-[#21262D] p-1 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 space-y-0.5 animate-scale-in">
                                            {activityFilterOptions.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => { setActivityFilter(option.value); setIsFilterDropdownOpen(false); }}
                                                    className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-between ${
                                                        activityFilter === option.value
                                                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {option.label}
                                                    {activityFilter === option.value && <CheckCircleIcon className="w-3 h-3" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {isSummarizing && (
                        <div className="px-2 pb-3 flex-shrink-0">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1 rounded-full animate-pulse-glow w-full"></div>
                                </div>
                            </div>
                        )}

                        <div className={`flex-1 overflow-y-auto pr-2 transition-colors duration-500 ${isSummarizing ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                            {filteredActivity.length > 0 ? (
                                <ul className="space-y-0">
                                    {filteredActivity.slice().reverse().map(act => (
                                        <ActivityItem 
                                            key={act.id} 
                                            act={act} 
                                            onDelete={handleDeleteActivity}
                                            timeFormat={appSettings.timeFormat}
                                        />
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">Nenhuma atividade registrada.</p>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                            {isNoteEditorExpanded ? (
                                <div className="transition-all duration-300 ease-in-out">
                                    <RichTextNoteEditor 
                                        value={newNote}
                                        onChange={setNewNote}
                                        placeholder="Adicionar nota ao projeto..."
                                        onAdd={handleAddNote}
                                        onCancel={() => {
                                            setNewNote('');
                                            setIsNoteEditorExpanded(false);
                                            setIsAiGenerated(false);
                                        }}
                                        isLoading={isSummarizing}
                                        isAiHighlighted={isAiGenerated}
                                    />
                                </div>
                            ) : (
                                <div
                                    onClick={() => setIsNoteEditorExpanded(true)}
                                    className="w-full text-left cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0D1117] text-gray-500 dark:text-gray-400 p-3 text-sm transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-400"
                                >
                                    Adicionar nota ao projeto...
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
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

export default ProjectDetailView;
