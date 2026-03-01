import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GoogleGenAI } from "@google/genai";
import type { Project, Task, Category, Tag, Status, Notification, Habit, Activity, AppSettings, SubTask, ConfirmationToastData, TaskDocument } from '../../types';
// Adicionei os ícones que estavam faltando baseados no Header.tsx e no seu código antigo
import {
    ChevronLeftIcon, KanbanIcon, TableCellsIcon, ActivityIcon, FolderIcon, SearchIcon, ClipboardDocumentCheckIcon, BellIcon, MoonIcon, SunIcon, PlusIcon, BroomIcon, CheckCircleIcon, ClockIcon, ChevronDownIcon, PencilIcon, TrashIcon, CalendarDaysIcon, XIcon, ChatBubbleLeftEllipsisIcon, ArrowRightLeftIcon, PlusCircleIcon, StopCircleIcon, PlayCircleIcon, SparklesIcon,
    RocketLaunchIcon, CodeBracketIcon, GlobeAltIcon, StarIcon, HeartIcon, ChartPieIcon, ArrowTopRightOnSquareIcon, LinkIcon, CheckIcon, ChevronRightIcon,
    DragHandleIcon, ChatBubbleOvalLeftIcon, DocumentDuplicateIcon, ListBulletIcon, ArrowDownTrayIcon, BriefcaseIcon, UserCircleIcon, ListIcon, PlayIcon, PauseIcon, ArrowRightOnRectangleIcon,
    // 👇 Ícones Novos para Documentos
    GoogleDocsIcon, GoogleSheetsIcon, GoogleSlidesIcon, GoogleDriveIcon, DocumentTextIcon, ChevronUpIcon
} from '../icons';
import TaskCard from '../TaskCard';
import { STATUS_COLORS, STATUS_OPTIONS } from '../../constants';
import HabitChecklistPopup from '../HabitChecklistPopup';
import DateRangeCalendar from '../DateRangeCalendar';
import RichTextNoteEditor from '../RichTextNoteEditor';
import Calendar from '../Calendar';
import { sanitizeTag } from '../../utils/tags';

// --- HELPER: Gera Link Mágico do Google Calendar ---
const generateGoogleCalendarLink = (task: Task): string => {
    const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const text = encodeURIComponent(task.title);
    const details = encodeURIComponent(task.description || "");

    if (!task.dueDate) return baseUrl;

    // 1. Pega a data base que o usuário escolheu
    const baseDate = new Date(task.dueDate);

    // 2. Cria a data de INÍCIO forçando as 09:00 da manhã (horário local)
    const startDate = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        9, 0, 0
    );

    // 3. Cria a data de FIM forçando as 10:00 da manhã (horário local)
    const endDate = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        10, 0, 0
    );

    // 4. Formata para o padrão UTC sem pontuação que a Google exige
    const formatDateTime = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const dates = `${formatDateTime(startDate)}/${formatDateTime(endDate)}`;

    return `${baseUrl}&text=${text}&details=${details}&dates=${dates}`;
};

// --- ICON: Google Calendar (Oficial Colorido) ---
const GoogleCalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img
        src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
        alt="Google Agenda"
        className={className}
    />
);

// --- HELPER: Recupera ícones de categorias (Sincronizado com Header.tsx) ---
const getCategoryIcon = (category?: Category) => {
    if (!category) return BellIcon;
    if (category.icon) return category.icon;

    switch (category.id) {
        case 'cat-1': return BriefcaseIcon;      // Trabalho
        case 'cat-2': return UserCircleIcon;     // Pessoal
        case 'cat-3': return ListIcon;           // Estudo / Lista
        default: return FolderIcon;              // Personalizadas
    }
};

// --- HELPER: Formatação de Tempo ---
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

// --- HELPER: Componente para Renderizar Links e Quebras de Linha ---
const LinkifiedText: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return (
        <div className={className}>
            {text.split('\n').map((line, lineIndex) => (
                <p key={lineIndex} className="min-h-[1.2em]">
                    {line.split(urlRegex).map((part, partIndex) => {
                        if (part.match(urlRegex)) {
                            return (
                                <a
                                    key={partIndex}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-500 hover:text-primary-600 underline break-all relative z-20 cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {part}
                                </a>
                            );
                        }
                        return part;
                    })}
                </p>
            ))}
        </div>
    );
};


// --- COMPONENT: NotificationCard ---
const NotificationCard: React.FC<{
    notification: Notification;
    task?: Task;
    category?: Category;
    onClick: () => void;
    onSnooze: () => void;
    onMarkHabitComplete: (habitId: string) => void;
    isRead?: boolean;
    timeFormat: '12h' | '24h';
    allTasks?: Task[];
    onSelectTaskFromGroup?: (task: Task) => void;
}> = ({ notification, task, category, onClick, onSnooze, onMarkHabitComplete, isRead, timeFormat, allTasks, onSelectTaskFromGroup }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSnoozing, setIsSnoozing] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const isHabitReminder = notification.taskId.startsWith('habit-');
    const isGroupSummary = notification.taskId === 'summary-group' && notification.relatedTaskIds;
    const isChangelog = notification.taskId === 'system-changelog';

    if (!task && !isHabitReminder && !isGroupSummary && !isChangelog) return null;

    // --- MODO GRUPO (Resumo do Dia) ---
    if (isGroupSummary && notification.relatedTaskIds && allTasks) {
        const groupedTasks = allTasks.filter(t => notification.relatedTaskIds?.includes(t.id));

        const groupBgClass = isRead
            ? 'bg-white dark:bg-[#21262D] opacity-75'
            : 'bg-indigo-50/60 dark:bg-indigo-900/10 border-l-4 border-l-indigo-500';
        const groupBorderClass = isRead
            ? 'border-gray-100 dark:border-gray-800'
            : 'border-indigo-100 dark:border-indigo-900/30';

        return (
            <li className="mb-2 last:mb-0">
                <div className={`relative w-full rounded-xl border transition-all duration-200 ${groupBgClass} ${groupBorderClass}`}>
                    <div onClick={() => setIsExpanded(!isExpanded)} className="p-4 cursor-pointer flex gap-4 select-none group">
                        <div className="flex-shrink-0 pt-1">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 text-indigo-500 shadow-sm">
                                <CalendarDaysIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Resumo do Dia</span>
                                {!isRead && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{notification.taskTitle}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{notification.message}</p>
                            <div className="mt-2 flex items-center text-xs text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                                {isExpanded ? 'Recolher lista' : 'Ver lista de tarefas'}
                                <ChevronDownIcon className={`w-3 h-3 ml-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                    </div>
                    {isExpanded && (
                        <div className="border-t border-indigo-100 dark:border-indigo-900/30 bg-white/50 dark:bg-black/20 animate-slide-down">
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                {groupedTasks.map(t => (
                                    <li key={t.id} onClick={() => onSelectTaskFromGroup && onSelectTaskFromGroup(t)} className="px-4 py-3 flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-white/5 cursor-pointer transition-colors group/item">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLORS[t.status] || 'bg-gray-300'}`}></span>
                                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400">{t.title}</span>
                                        </div>
                                        <ArrowRightOnRectangleIcon className="w-4 h-4 text-gray-300 group-hover/item:text-indigo-500 transition-colors flex-shrink-0" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </li>
        );
    }

    // --- MODO PADRÃO ---
    let CategoryIcon = BellIcon;
    let CardIcon = BellIcon;

    if (isChangelog) {
        CardIcon = SparklesIcon;
    } else if (isHabitReminder) {
        CardIcon = ClipboardDocumentCheckIcon;
    } else {
        CardIcon = getCategoryIcon(category);
    }
    // Prioridade para o ícone visual do card
    if (isChangelog) CategoryIcon = SparklesIcon;
    else if (isHabitReminder) CategoryIcon = ClipboardDocumentCheckIcon;
    else CategoryIcon = getCategoryIcon(category);

    const bgClass = isRead ? 'bg-white dark:bg-[#21262D] opacity-75 hover:opacity-100' : 'bg-blue-50/60 dark:bg-blue-900/10 border-l-4 border-l-primary-500';
    const borderClass = isRead ? 'border-gray-100 dark:border-gray-800' : 'border-blue-100 dark:border-blue-900/30';

    const handleSnooze = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsSnoozing(true);
        setTimeout(() => { onSnooze(); }, 500);
    };

    const handleCompleteHabit = (e: React.MouseEvent) => {
        e.stopPropagation();
        const habitId = notification.taskId.replace('habit-', '');
        onMarkHabitComplete(habitId);
        setIsCompleted(true);
    };

    const handleCardClick = () => { if (!isHabitReminder) onClick(); };

    return (
        <li className="mb-2 last:mb-0">
            <div onClick={handleCardClick} className={`relative group w-full p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${bgClass} ${borderClass}`}>
                <div className="flex gap-4">
                    <div className="flex-shrink-0 pt-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRead ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-white dark:bg-gray-800 text-primary-500 shadow-sm'}`}>
                            <CategoryIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{formatNotificationTime(notification.notifyAt, timeFormat)}</span>
                            {!isRead && <span className="w-2 h-2 rounded-full bg-primary-500"></span>}
                        </div>
                        <h4 className={`text-sm font-semibold mb-0.5 truncate ${isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>{notification.taskTitle}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-3">
                            {isHabitReminder ? (
                                <button onClick={handleCompleteHabit} disabled={isCompleted} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default' : 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/40'}`}>
                                    {isCompleted ? <CheckIcon className="w-3.5 h-3.5" /> : <CheckCircleIcon className="w-3.5 h-3.5" />} {isCompleted ? 'Concluído' : 'Marcar Feito'}
                                </button>
                            ) : (
                                <button onClick={handleSnooze} disabled={isSnoozing} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isSnoozing ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-default' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                                    <ClockIcon className="w-3.5 h-3.5" /> {isSnoozing ? 'Adiado' : 'Lembrar +2h'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};

// --- COMPONENT: NotificationBell ---
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
    onSelectTask: (task: Task) => void;
}> = ({
    notifications,
    unreadNotifications,
    tasks = [],
    categories = [],
    onNotificationClick,
    onSnooze,
    onMarkHabitComplete,
    onMarkAllAsRead,
    onClearAllNotifications,
    timeFormat,
    onSelectTask
}) => {
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
                                                    key={n.id} notification={n} task={task} category={category}
                                                    onClick={() => onNotificationClick(n)} onSnooze={() => onSnooze(n)}
                                                    onMarkHabitComplete={onMarkHabitComplete} isRead={false} timeFormat={timeFormat}
                                                    allTasks={tasks}
                                                    onSelectTaskFromGroup={(t) => { onNotificationClick(n); onSelectTask(t); }}
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
                                                    key={n.id} notification={n} task={task} category={category}
                                                    onClick={() => onNotificationClick(n)} onSnooze={() => onSnooze(n)}
                                                    onMarkHabitComplete={onMarkHabitComplete} isRead={true} timeFormat={timeFormat}
                                                    allTasks={tasks}
                                                    onSelectTaskFromGroup={(t) => onSelectTask(t)}
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

// --- COMPONENT: Botão Flutuante Fixo no Elemento ---
const LinkAddTooltip: React.FC<{
    linkData: { url: string; title: string; x: number; y: number } | null;
    onAdd: (url: string, title: string) => void;
    onClose: () => void;
    onMouseEnter: () => void;
}> = ({ linkData, onAdd, onClose, onMouseEnter }) => {

    if (!linkData) return null;

    return createPortal(
        <div
            className="fixed z-[9999] pt-3 pb-2 px-2" // Padding generoso para capturar o mouse
            style={{
                top: linkData.y, // Posição exata abaixo do link
                left: linkData.x,
                transform: 'translateX(-50%)',
                pointerEvents: 'auto'
            }}
            // Eventos CRUCIAIS:
            onMouseEnter={onMouseEnter} // Cancela timeout
            onMouseLeave={onClose}      // Inicia timeout
        >
            <div className="bg-white dark:bg-[#161B22] p-1 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 ring-1 ring-black/5">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAdd(linkData.url, linkData.title);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors whitespace-nowrap"
                >
                    <PlusCircleIcon className="w-4 h-4 text-primary-500" />
                    Adicionar à Documentos e Links
                </button>
            </div>
        </div>,
        document.body
    );
};

const statusConfig: Record<Status, { icon: React.ReactNode; color: string; text: string }> = {
    'Pendente': { icon: <StopCircleIcon className="w-5 h-5" />, color: 'border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50', text: 'Pendente' },
    'Em andamento': { icon: <PlayCircleIcon className="w-5 h-5" />, color: 'border-yellow-500 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50', text: 'Em Andamento' },
    'Concluída': { icon: <CheckCircleIcon className="w-5 h-5" />, color: 'border-green-500 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50', text: 'Concluída' },
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
        if (isOpen) {
            const initialDate = initialData?.notifyAt ? new Date(initialData.notifyAt) : new Date();
            if (!initialData) {
                initialDate.setDate(initialDate.getDate() + 1);
                initialDate.setHours(9, 0, 0, 0);
            }
            setDate(initialDate);
            setCalendarDisplayDate(initialDate);
            setTime(initialDate.toTimeString().substring(0, 5));
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

const PROJECT_ICONS: Record<string, React.FC<{ className?: string }>> = {
    folder: FolderIcon,
    rocket: RocketLaunchIcon,
    code: CodeBracketIcon,
    globe: GlobeAltIcon,
    star: StarIcon,
    heart: HeartIcon,
    chart: ChartPieIcon
};

// Updated STATUS_STEPS to use hover:ring-* instead of text-* for ringClass property
const STATUS_STEPS = [
    { status: 'Pendente', icon: <StopCircleIcon className="w-4 h-4" />, bgClass: 'bg-blue-500', ringClass: 'hover:ring-blue-400' },
    { status: 'Em andamento', icon: <PlayCircleIcon className="w-4 h-4" />, bgClass: 'bg-yellow-500', ringClass: 'hover:ring-yellow-400' },
    { status: 'Concluída', icon: <CheckCircleIcon className="w-4 h-4" />, bgClass: 'bg-green-500', ringClass: 'hover:ring-green-400' },
];

interface HabitWithStatus extends Habit {
    isCompleted: boolean;
}

interface TaskDetailViewProps {
    task: Task;
    onUpdate: (taskId: string, updates: Partial<Task>) => void;
    onDelete: (taskId: string) => void;
    onDuplicate: (task: Task) => void;
    onDeleteActivity: (taskId: string, activityId: string, type: Activity['type']) => void;
    onBack: () => void;
    onSelectTask: (task: Task) => void;
    categories: Category[];
    tags: Tag[];
    tasks: Task[];
    projects: Project[];
    onOpenProject: (project: Project) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    notifications: Notification[];
    unreadNotifications: Notification[];
    onNotificationClick: (notification: Notification) => void;
    onSnoozeNotification: (notification: Notification) => void;
    onMarkHabitComplete: (habitId: string) => void;
    onMarkAllNotificationsAsRead: () => void;
    onClearAllNotifications: () => void;
    addToast: (data: Omit<ConfirmationToastData, 'id'>) => void;
    userName: string;
    habitsWithStatus: HabitWithStatus[];
    onToggleHabit: (habitId: string) => void;
    onMarkAllHabitsComplete: () => void;
    onOpenHabitSettings: () => void;
    appSettings: AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const SubTaskItem: React.FC<{
    subTask: SubTask;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<SubTask>) => void;
    dragHandlers?: any;
    isDraft?: boolean;
}> = ({ subTask, onToggle, onDelete, onUpdate, dragHandlers, isDraft }) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [noteText, setNoteText] = useState(subTask.note || '');
    const [popoverCoords, setPopoverCoords] = useState({ top: 0, left: 0, align: 'bottom' });
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipCoords, setTooltipCoords] = useState({ top: 0, left: 0, placement: 'bottom' });
    
    // 👇 ESTADO NOVO PARA ANIMAÇÃO DE ENTRADA
    const [isAnimatingIn, setIsAnimatingIn] = useState(!!isDraft);

    const iconRef = useRef<HTMLButtonElement>(null);

    // Efeito para disparar a animação quando o rascunho é renderizado
    useEffect(() => {
        if (isDraft) {
            // Remove a classe de animação após 500ms para estabilizar o elemento
            const timer = setTimeout(() => setIsAnimatingIn(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isDraft]);

    const handleOpenPopover = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUpwards = spaceBelow < 220;

            setPopoverCoords({
                top: openUpwards ? rect.top : rect.bottom,
                left: rect.right,
                align: openUpwards ? 'top' : 'bottom'
            });
        }
        setNoteText(subTask.note || '');
        setIsPopoverOpen(true);
        setShowTooltip(false);
    };

    const handleMouseEnter = () => {
        if (subTask.note && !isPopoverOpen && iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            const placement = rect.top < 100 ? 'bottom' : 'top';

            setTooltipCoords({
                top: placement === 'top' ? rect.top : rect.bottom,
                left: rect.right,
                placement
            });
            setShowTooltip(true);
        }
    }

    const handleMouseLeave = () => {
        setShowTooltip(false);
    }

    const handleSaveNote = () => {
        onUpdate(subTask.id, { note: noteText.trim() });
        setIsPopoverOpen(false);
    };

    const handleCancelNote = () => {
        setIsPopoverOpen(false);
        setNoteText(subTask.note || '');
    };

    return (
        <>
            <div
                {...dragHandlers}
                className={`flex items-center p-2 rounded-md group transition-all duration-500 ease-out relative overflow-hidden
                    ${isDraft 
                        ? 'bg-indigo-50/80 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                        : 'bg-gray-100 dark:bg-[#0D1117] hover:shadow-sm border border-transparent'
                    }
                    ${isAnimatingIn ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}
                `}
            >
                {/* Efeito de "Brilho" que corre quando a tarefa oficializa */}
                {!isDraft && !isAnimatingIn && (
                    <div className="absolute inset-0 bg-white/20 dark:bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                )}

                <div className="w-7 flex justify-center flex-shrink-0 transition-all duration-300">
                    {isDraft ? (
                        <SparklesIcon className="w-4 h-4 text-indigo-500 animate-pulse" />
                    ) : (
                        <DragHandleIcon className="w-5 h-5 text-gray-400 cursor-grab opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
                
                <input
                    type="checkbox"
                    id={`subtask-${subTask.id}`}
                    checked={subTask.completed}
                    onChange={() => onToggle(subTask.id)}
                    className={`appearance-none h-4 w-4 rounded border-2 focus:outline-none transition-colors duration-200 flex-shrink-0 cursor-pointer
                        ${isDraft 
                            ? 'border-indigo-300 dark:border-indigo-600 checked:bg-indigo-500 checked:border-transparent' 
                            : 'border-gray-300 dark:border-gray-600 checked:bg-primary-500 checked:border-transparent'
                        }
                    `}
                />
                
                <label htmlFor={`subtask-${subTask.id}`} className={`ml-3 flex-1 text-sm cursor-pointer transition-colors duration-200
                    ${subTask.completed ? 'line-through text-gray-400 dark:text-gray-500' : 
                        isDraft ? 'text-indigo-900 dark:text-indigo-200 font-medium' : 'text-gray-800 dark:text-gray-200'
                    }`}>
                    {subTask.text}
                </label>

                <div className="flex items-center gap-1">
                    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                        <button
                            ref={iconRef}
                            onClick={handleOpenPopover}
                            className={`p-1 transition-all duration-200 
                                ${subTask.note 
                                    ? (isDraft ? 'opacity-100 text-indigo-500' : 'opacity-100 text-primary-500') 
                                    : `opacity-0 group-hover:opacity-100 ${isDraft ? 'text-indigo-300 hover:text-indigo-600' : 'text-gray-400 hover:text-primary-500'}`
                                }`}
                            title={subTask.note ? undefined : "Adicionar nota"}
                        >
                            <ChatBubbleOvalLeftIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <button onClick={() => onDelete(subTask.id)} className={`opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded hover:bg-white/50 dark:hover:bg-white/10 ${isDraft ? 'text-indigo-400 hover:text-indigo-600' : 'text-gray-400 hover:text-red-500'}`}>
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ... Todo o resto do Tooltip e Popover continua exatamente igual ... */}
            {showTooltip && (
                <div
                    className="fixed z-[70] p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none w-72 max-w-sm break-words whitespace-pre-wrap"
                    style={{
                        top: tooltipCoords.placement === 'top' ? tooltipCoords.top - 8 : tooltipCoords.top + 8,
                        left: tooltipCoords.left,
                        transform: tooltipCoords.placement === 'top' ? 'translate(-100%, -100%)' : 'translate(-100%, 0)'
                    }}
                >
                    {subTask.note}
                </div>
            )}

            {isPopoverOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={handleCancelNote}></div>
                    <div
                        className="fixed z-[70] w-96 p-4 bg-white dark:bg-[#161B22] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col gap-3 cursor-default"
                        style={{
                            top: popoverCoords.align === 'bottom' ? popoverCoords.top + 8 : 'auto',
                            bottom: popoverCoords.align === 'top' ? (window.innerHeight - popoverCoords.top) + 8 : 'auto',
                            left: popoverCoords.left,
                            transform: 'translateX(-100%)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Adicione uma nota..."
                            className="w-full h-40 text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#0D1117] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleCancelNote}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveNote}
                                className="px-3 py-1.5 text-xs font-bold bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-sm"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

const activityConfig: Record<Activity['type'], { icon: React.FC<{ className?: string }>; classes: string }> = {
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

// --- COMPONENT: ActivityItem (Versão Final Corrigida) ---
// --- COMPONENT: ActivityItem (Texto Restaurado + Tooltip Novo) ---
const ActivityItem: React.FC<{
    act: Activity;
    onDelete: (id: string, type: Activity['type']) => void;
    timeFormat: '12h' | '24h';
    onLinkEnter: (data: { url: string; title: string; x: number; y: number }) => void;
    onLinkLeave: () => void;
}> = ({ act, onDelete, timeFormat, onLinkEnter, onLinkLeave, taskTitle }) => {

    const [isExpanded, setIsExpanded] = useState(false); // Adicionado para suportar o 'Ver detalhes' do BulkChange antigo
    const time = formatActivityTimestamp(act.timestamp, timeFormat);
    const isAi = act.isAiGenerated;
    const config = activityConfig[act.type] || activityConfig.creation;
    const Icon = isAi ? SparklesIcon : config.icon;
    const isBulkChange = act.type === 'status_change' && (act.count || 0) > 1 && !!act.affectedTasks;

    const styleClass = isAi
        ? 'bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-purple-600 dark:text-purple-300'
        : config.classes;

    // --- MANIPULADORES DE EVENTO OTIMIZADOS (MANTIDOS DA VERSÃO NOVA) ---
    const handleContainerMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');

        if (link) {
            const rect = link.getBoundingClientRect();
            onLinkEnter({
                url: link.getAttribute('href') || '',
                title: link.innerText,
                x: rect.left + (rect.width / 2),
                y: rect.bottom
            });
        }
    };

    const handleContainerMouseOut = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        if (link && e.relatedTarget && !link.contains(e.relatedTarget as Node)) {
            onLinkLeave();
        }
    };

    return (
        <li className="group flex items-start space-x-3 py-3 border-b border-dashed border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className={`rounded-full p-1.5 mt-1 ${styleClass}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                    <span className="font-semibold">{act.user}</span>{' '}

                    {/* --- LÓGICA DE TEXTO RESTAURADA (DO ARQUIVO ANTIGO) --- */}

                    {act.type === 'creation' && !act.taskTitle ? 'criou esta tarefa.' : null}
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
                    {act.type === 'project' && !act.taskTitle && 'atualizou o projeto.'}

                    {act.type === 'note' && (isAi ? 'sumarizou anotações com IA:' : 'adicionou uma nota:')}
                    {act.type === 'reminder' && 'criou um lembrete para:'}

                    {/* Lógica de Status Change (Com detalhes DE -> PARA) */}
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
                                {act.taskTitle ? <>alterou o status de <strong>{act.taskTitle}</strong></> : 'alterou o status'} de <StatusSpan status={act.from!} /> para <StatusSpan status={act.to!} />.
                            </>
                        )
                    )}

                    {/* Lógica de Property Change (Prioridade, Categoria, Título, etc) */}
                    {act.type === 'property_change' && (
                        <>alterou {act.property} de <strong>{act.from || act.oldValue}</strong> para <strong>{act.to || act.newValue}</strong>.</>
                    )}

                    {/* ----------------------------------------------------- */}
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

                {/* Área da Nota (Com lógica nova de Tooltip) */}
                {act.note && act.type === 'note' && (
                    <div
                        className={`mt-1 p-2 border rounded-md text-sm note-content break-words relative z-10 
                            ${isAi ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'}`}
                        onMouseOver={handleContainerMouseOver}
                        onMouseOut={handleContainerMouseOut}
                        dangerouslySetInnerHTML={{
                            __html: act.note.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" style="cursor: pointer; text-decoration: underline; color: #3b82f6;" ')
                        }}
                    />
                )}

                {act.type === 'reminder' && act.notifyAt && (
                    <div className="mt-1 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900/50 text-sm">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {new Date(act.notifyAt).toLocaleDateString('pt-BR', { dateStyle: 'full' })}, {new Date(act.notifyAt).toLocaleTimeString('pt-BR', { hour: timeFormat === '12h' ? 'numeric' : '2-digit', minute: '2-digit', hour12: timeFormat === '12h' })}
                        </p>
                        {act.note && <p className="mt-1.5 italic text-gray-600 dark:text-gray-400">"{act.note}"</p>}

                        {/* 👇 NOVO: Botão do Google Agenda Integrado */}
                        <div className="mt-3 flex justify-start">
                            <a
                                href={(() => {
                                    // Mini construtor do Link Mágico específico para este lembrete
                                    const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
                                    const title = taskTitle || act.taskTitle || "Tarefa";
                                    const text = encodeURIComponent(`[Lembrete] ${title}`);
                                    const desc = encodeURIComponent(act.note ? `Nota do lembrete: ${act.note}` : '');

                                    const startDate = new Date(act.notifyAt!);
                                    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

                                    const formatDateTime = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
                                    const dates = `${formatDateTime(startDate)}/${formatDateTime(endDate)}`;

                                    return `${baseUrl}&text=${text}&details=${desc}&dates=${dates}`;
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
                            >
                                <GoogleCalendarIcon className="w-3.5 h-3.5 object-contain" />
                                Adicionar ao Google Agenda
                            </a>
                        </div>
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

const TaskDetailView: React.FC<TaskDetailViewProps> = ({ task, onUpdate, onDelete, onDuplicate, onDeleteActivity, onBack, onSelectTask, categories, tags, tasks, projects, onOpenProject, theme, toggleTheme, notifications, unreadNotifications, onNotificationClick, onSnoozeNotification, onMarkHabitComplete, onMarkAllNotificationsAsRead, onClearAllNotifications, addToast, userName, habitsWithStatus, onToggleHabit, onMarkAllHabitsComplete, onOpenHabitSettings, appSettings, setAppSettings }) => {

    // States
    const [detectedLink, setDetectedLink] = useState<{ url: string; title: string; x: number; y: number } | null>(null);
    const linkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 2. O mouse entrou no Link
    const handleLinkEnter = useCallback((data: { url: string; title: string; x: number; y: number }) => {
        // CORREÇÃO: Se já estamos mostrando o tooltip para este link, não fazemos nada.
        // Isso para os logs excessivos e re-renderizações.
        setDetectedLink(prev => {
            if (prev && prev.url === data.url) {
                return prev; // Mantém o estado atual
            }

            // Se é um novo link, cancela timer e atualiza
            if (linkTimeoutRef.current) {
                clearTimeout(linkTimeoutRef.current);
                linkTimeoutRef.current = null;
            }
            return data;
        });
    }, []);

    // 3. O mouse saiu do Link OU do Tooltip (Inicia contagem para fechar)
    const handleLinkLeave = useCallback(() => {
        // Se já tiver um timer rodando, não faz nada
        if (linkTimeoutRef.current) return;

        linkTimeoutRef.current = setTimeout(() => {
            setDetectedLink(null);
            linkTimeoutRef.current = null;
        }, 200); // 500ms de tolerância (tempo para mover o mouse)
    }, []);

    // 4. O mouse entrou no Tooltip (Cancela o fechamento)
    const handleTooltipEnter = useCallback(() => {
        if (linkTimeoutRef.current) {
            clearTimeout(linkTimeoutRef.current);
            linkTimeoutRef.current = null;
        }
    }, []);


    const [taskData, setTaskData] = useState<Task>(task);

    // --- ESTADOS DA IA PARA SUB-TAREFAS ---
    const [aiSubTaskSuggestions, setAiSubTaskSuggestions] = useState<SubTask[]>([]);
    const [isGeneratingSubTasks, setIsGeneratingSubTasks] = useState(false);

    useEffect(() => setTaskData(task), [task]);

    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [newSubTask, setNewSubTask] = useState('');
    const [newNote, setNewNote] = useState('');
    const [newTag, setNewTag] = useState('');
    const [isNoteEditorExpanded, setIsNoteEditorExpanded] = useState(false);
    
    // 👇 NOVO: Estados para o Autocomplete de Tags
    const [isTagInputFocused, setIsTagInputFocused] = useState(false);
    const tagAutocompleteRef = useRef<HTMLDivElement>(null);
    const tagInputRef = useRef<HTMLInputElement>(null);

    // --- ESTADOS PARA DOCUMENTOS ---
    const [isDocsCollapsed, setIsDocsCollapsed] = useState(false);
    const [newDocUrl, setNewDocUrl] = useState('');
    const [newDocTitle, setNewDocTitle] = useState('');
    const [isAddingDoc, setIsAddingDoc] = useState(false);
    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [isLoadingDocTitle, setIsLoadingDocTitle] = useState(false);
    // ---------------------------------

    const [activityFilter, setActivityFilter] = useState<'all' | 'notes' | 'changes' | 'reminders'>('all');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);

    const [isDueDateCalendarOpen, setIsDueDateCalendarOpen] = useState(false);
    const [editCalendarDisplayDate, setEditCalendarDisplayDate] = useState(new Date(task.dueDate || Date.now()));
    const dueDateRef = useRef<HTMLDivElement>(null);
    const draggedSubTask = useRef<{ subTask: SubTask; index: number } | null>(null);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    // Dropdown States
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const tagDropdownRef = useRef<HTMLDivElement>(null);

    // Project Dropdown Logic
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [projectSearchQuery, setProjectSearchQuery] = useState('');
    const projectDropdownRef = useRef<HTMLDivElement>(null);


    const [confirmationState, setConfirmationState] = useState<ConfirmationDialogState>({
        isOpen: false, title: '', message: '', onConfirm: () => { },
    });

    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [isHabitPopupOpen, setIsHabitPopupOpen] = useState(false);
    const habitPopupRef = useRef<HTMLDivElement>(null);


    // Search state and logic
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchMode, setSearchMode] = useState<'name' | 'tags'>('name'); // Added searchMode state
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // AI Summarization State
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isAiGenerated, setIsAiGenerated] = useState(false);



    // 👇 3. FUNÇÃO QUE O BOTÃO VAI CHAMAR
    const handleAddDetectedLink = (url: string, title: string) => {
        // Usa sua lógica existente de detectar tipo e criar ID
        const newDoc: TaskDocument = {
            id: `doc-${Date.now()}`,
            url: url,
            title: title.length > 30 ? title.substring(0, 30) + '...' : title || 'Novo Link',
            type: detectDocType(url)
        };
        onUpdate(taskData.id, { documents: [...(taskData.documents || []), newDoc] });

        // Abre a seção de docs se estiver fechada para dar feedback visual
        setIsDocsCollapsed(false);
        setDetectedLink(null);
        addToast({ title: 'Link adicionado aos documentos', type: 'success' });
    };



    const activityConfig: Record<Activity['type'], { icon: React.FC<{ className?: string }>; classes: string }> = {
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

    const hasResults = useMemo(() => Object.values(searchResults).some(group => Array.isArray(group) && group.length > 0), [searchResults]);

    const handleResultClick = (task: Task) => {
        onSelectTask(task);
        setSearchQuery('');
        setIsSearchOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dueDateRef.current && !dueDateRef.current.contains(event.target as Node)) setIsDueDateCalendarOpen(false);
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) setIsSearchOpen(false);
            if (habitPopupRef.current && !habitPopupRef.current.contains(event.target as Node)) setIsHabitPopupOpen(false);
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) setIsStatusDropdownOpen(false);
            if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) setIsProjectDropdownOpen(false);
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) setIsCategoryDropdownOpen(false);
            if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) setIsTagDropdownOpen(false);
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) setIsFilterDropdownOpen(false);
            if (tagAutocompleteRef.current && !tagAutocompleteRef.current.contains(event.target as Node)) setIsTagInputFocused(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredActivity = useMemo(() => {
        if (!taskData) return [];
        switch (activityFilter) {
            case 'notes': return taskData.activity.filter(a => a.type === 'note');
            case 'reminders': return taskData.activity.filter(a => a.type === 'reminder');
            case 'changes': return taskData.activity.filter(a => a.type === 'status_change' || a.type === 'creation' || a.type === 'property_change' || a.type === 'project');
            default: return taskData.activity;
        }
    }, [activityFilter, taskData.activity]);

    const handleLocalUpdate = (updates: Partial<Task>) => {
        setTaskData(prev => ({ ...prev, ...updates }));
    }

    const handleTitleBlur = (newTitle: string) => {
        const trimmedTitle = newTitle.trim();
        if (trimmedTitle && trimmedTitle !== task.title) {
            const activityEntry: Activity = {
                id: `act-${Date.now()}`,
                type: 'property_change',
                timestamp: new Date().toISOString(),
                property: 'Título',
                from: task.title,
                to: trimmedTitle,
                user: userName,
            };
            onUpdate(taskData.id, { title: trimmedTitle, activity: [...taskData.activity, activityEntry] });
        } else {
            handleLocalUpdate({ title: task.title });
        }
    };

    const currentStatusIndex = STATUS_STEPS.findIndex(s => s.status === taskData.status);

    const currentProject = projects.find(p => p.id === taskData.projectId);
    const ProjectIcon = currentProject && currentProject.icon && PROJECT_ICONS[currentProject.icon] ? PROJECT_ICONS[currentProject.icon] : FolderIcon;

    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()));

    const totalSubTasks = taskData.subTasks?.length || 0;
    const completedSubTasks = taskData.subTasks?.filter(st => st.completed).length || 0;
    const progress = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;

    const hasNotes = taskData.activity.some(a => a.type === 'note');

    const activityFilterOptions: { value: 'all' | 'notes' | 'changes' | 'reminders'; label: string }[] = [
        { value: 'all', label: 'Todas' },
        { value: 'notes', label: 'Anotações' },
        { value: 'changes', label: 'Alterações' },
    ];

    const currentFilterLabel = activityFilterOptions.find(o => o.value === activityFilter)?.label || 'Todas';

    const handleSaveReminder = (data: { notifyAt: string; message: string }) => {
        const activityEntry: Activity = {
            id: `act-${Date.now()}`,
            type: 'reminder',
            timestamp: new Date().toISOString(),
            notifyAt: data.notifyAt,
            note: data.message,
            user: userName,
        };
        const updatedActivity = [...taskData.activity, activityEntry];
        onUpdate(taskData.id, { activity: updatedActivity });
        setIsReminderModalOpen(false);
        addToast({ title: 'Lembrete Definido', type: 'success' });
    };

    const handleStatusChange = (newStatus: string) => {
        if (taskData.status !== newStatus) {

            // 1. Prepara o objeto de atualização com o novo status
            const updates: Partial<Task> = { status: newStatus as Status };

            // 2. Se o novo status for 'Concluída', forçamos onHold para false
            if (newStatus === 'Concluída' && taskData.onHold) {
                updates.onHold = false;
            }

            // 3. Registro de atividade padrão (sem notas extras)
            const activityEntry: Activity = {
                id: `act-${Date.now()}`,
                type: 'status_change',
                timestamp: new Date().toISOString(),
                from: taskData.status,
                to: newStatus as Status,
                user: userName
            };

            // 4. Envia tudo junto
            onUpdate(taskData.id, {
                ...updates,
                activity: [...taskData.activity, activityEntry]
            });
        }
    };

    const handleDateSelect = (date: Date) => {
        const newDueDate = new Date(date);
        newDueDate.setHours(23, 59, 59); // End of day default
        const newDueDateIso = newDueDate.toISOString();

        if (taskData.dueDate !== newDueDateIso) {
            const activityEntry: Activity = {
                id: `act-${Date.now()}`,
                type: 'property_change',
                timestamp: new Date().toISOString(),
                property: 'Prazo Final',
                from: taskData.dueDate ? new Date(taskData.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo',
                to: newDueDate.toLocaleDateString('pt-BR'),
                user: userName,
            };
            onUpdate(taskData.id, { dueDate: newDueDateIso, activity: [...taskData.activity, activityEntry] });
        }
        setIsDueDateCalendarOpen(false);
    };

    const handleCategoryChange = (catId: string) => {
        if (taskData.categoryId !== catId) {
            const oldCategoryName = categories.find(c => c.id === taskData.categoryId)?.name || 'Sem categoria';
            const newCategoryName = categories.find(c => c.id === catId)?.name || 'Sem categoria';

            const activityEntry: Activity = {
                id: `act-${Date.now()}`,
                type: 'property_change',
                timestamp: new Date().toISOString(),
                property: 'Categoria',
                from: oldCategoryName,
                to: newCategoryName,
                user: userName,
            };
            onUpdate(taskData.id, { categoryId: catId, activity: [...taskData.activity, activityEntry] });
        }
    };

    const handleTagChange = (tagId: string) => {
        if (taskData.tagId !== tagId) {
            const oldTagName = tags.find(t => t.id === taskData.tagId)?.name || 'Sem prioridade';
            const newTagName = tags.find(t => t.id === tagId)?.name || 'Sem prioridade';

            const activityEntry: Activity = {
                id: `act-${Date.now()}`,
                type: 'property_change',
                timestamp: new Date().toISOString(),
                property: 'Prioridade',
                from: oldTagName,
                to: newTagName,
                user: userName,
            };
            onUpdate(taskData.id, { tagId: tagId, activity: [...taskData.activity, activityEntry] });
        }
    };

    const handleProjectSelect = (project: Project) => {
        const activityEntry: Activity = {
            id: `act-${Date.now()}`,
            type: 'property_change',
            timestamp: new Date().toISOString(),
            property: 'Projeto',
            from: currentProject?.name || 'Nenhum',
            to: project.name,
            user: userName
        };
        onUpdate(taskData.id, { projectId: project.id, activity: [...taskData.activity, activityEntry] });
        setIsProjectDropdownOpen(false);
    };

    const handleUnlinkProject = () => {
        if (!currentProject) return;
        const activityEntry: Activity = {
            id: `act-${Date.now()}`,
            type: 'property_change',
            timestamp: new Date().toISOString(),
            property: 'Projeto',
            from: currentProject.name,
            to: 'Nenhum',
            user: userName
        };
        onUpdate(taskData.id, { projectId: "", activity: [...taskData.activity, activityEntry] });
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const updatedTags = taskData.tags?.filter(t => t !== tagToRemove);
        onUpdate(taskData.id, { tags: updatedTags });
    };

    const handleAddTagToList = (tagToSave?: string) => {
        const rawTag = tagToSave || newTag;
        if (!rawTag.trim()) return;

        const cleanTag = sanitizeTag(rawTag);
        
        // 👇 A MUDANÇA É AQUI: Limpamos virtualmente as tags que já estão na tarefa só para fazer a checagem
        const currentTagsSanitized = (taskData.tags || []).map(t => sanitizeTag(t));
        
        // 👇 Agora ele checa na lista higienizada
        if (currentTagsSanitized.includes(cleanTag)) {
            setNewTag('');
            // Devolve o foco para o input instantaneamente
            tagInputRef.current?.focus(); 
            return;
        }
        
        const updatedTags = [...(taskData.tags || []), cleanTag];
        onUpdate(taskData.id, { tags: updatedTags });
        setNewTag('');
        // Não mudamos o setIsTagInputFocused para false!
        // Apenas forçamos o cursor a continuar no input
        tagInputRef.current?.focus(); 
    };

    // Subtasks
    const handleSubTaskToggle = (subTaskId: string) => {
        const updatedSubTasks = taskData.subTasks.map(st =>
            st.id === subTaskId ? { ...st, completed: !st.completed } : st
        );
        onUpdate(taskData.id, { subTasks: updatedSubTasks });
    };

    const handleDeleteSubTask = (subTaskId: string) => {
        const updatedSubTasks = taskData.subTasks.filter(st => st.id !== subTaskId);
        onUpdate(taskData.id, { subTasks: updatedSubTasks });
    };

    const handleUpdateSubTaskData = (subTaskId: string, updates: Partial<SubTask>) => {
        const updatedSubTasks = taskData.subTasks.map(st =>
            st.id === subTaskId ? { ...st, ...updates } : st
        );
        onUpdate(taskData.id, { subTasks: updatedSubTasks });
    };

    const handleAddSubTask = () => {
        if (!newSubTask.trim()) return;
        const newSub: SubTask = {
            id: `sub-${Date.now()}`,
            text: newSubTask.trim(),
            completed: false
        };
        onUpdate(taskData.id, { subTasks: [...(taskData.subTasks || []), newSub] });
        setNewSubTask('');
    };

    // Drag & Drop Subtasks
    const handleSubTaskDragStart = (e: React.DragEvent<HTMLDivElement>, subTask: SubTask, index: number) => {
        draggedSubTask.current = { subTask, index };
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleSubTaskDragEnd = () => {
        draggedSubTask.current = null;
    };

    const handleSubTaskDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        // Reordering logic
        if (!draggedSubTask.current || draggedSubTask.current.index === index) return;

        const newSubTasks = [...taskData.subTasks];
        const draggedItem = newSubTasks[draggedSubTask.current.index];
        newSubTasks.splice(draggedSubTask.current.index, 1);
        newSubTasks.splice(index, 0, draggedItem);

        setTaskData(prev => ({ ...prev, subTasks: newSubTasks })); // Optimistic local update
        draggedSubTask.current.index = index;
    };

    const handleSubTaskDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        // Persist change
        onUpdate(taskData.id, { subTasks: taskData.subTasks });
    };

    // --- DOCUMENTS LOGIC ---
    const detectDocType = (url: string): TaskDocument['type'] => {
        if (url.includes('docs.google.com/document')) return 'google-doc';
        if (url.includes('docs.google.com/spreadsheets')) return 'google-sheet';
        if (url.includes('docs.google.com/presentation')) return 'google-slide';
        if (url.includes('drive.google.com')) return 'google-drive';
        return 'link';
    };

    const handleAddDocument = () => {
        if (!newDocUrl.trim()) return;

        let validUrl = newDocUrl.trim();
        if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
            validUrl = `https://${validUrl}`;
        }

        if (editingDocId) {
            // Updating existing
            const updatedDocs = (taskData.documents || []).map(d =>
                d.id === editingDocId ? { ...d, url: validUrl, title: newDocTitle.trim(), type: detectDocType(validUrl) } : d
            );
            onUpdate(taskData.id, { documents: updatedDocs });
            setEditingDocId(null);
        } else {
            // Adding new
            const newDoc: TaskDocument = {
                id: `doc-${Date.now()}`,
                url: validUrl,
                title: newDocTitle.trim(),
                type: detectDocType(validUrl)
            };
            onUpdate(taskData.id, { documents: [...(taskData.documents || []), newDoc] });
        }

        setNewDocUrl('');
        setNewDocTitle('');
        setIsAddingDoc(false);
    };

    const handleEditDocument = (doc: TaskDocument) => {
        setNewDocUrl(doc.url);
        setNewDocTitle(doc.title || '');
        setEditingDocId(doc.id);
        setIsAddingDoc(true);
    };

    const handleDeleteDocument = (docId: string) => {
        const updatedDocs = (taskData.documents || []).filter(d => d.id !== docId);
        onUpdate(taskData.id, { documents: updatedDocs });
    };
    // -----------------------

    // Summarize Activities
    const handleSummarizeActivities = async () => {
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
            const notes = taskData.activity
                .filter(a => a.type === 'note' && a.note)
                .map(a => `[${new Date(a.timestamp).toLocaleString()}] ${a.note?.replace(/<[^>]*>/g, '')}`)
                .join('\n');

            if (!notes) {
                setNewNote('Não há anotações suficientes para resumir.');
                setIsSummarizing(false);
                return;
            }

            const prompt = `Resuma as seguintes anotações da tarefa em um texto consolidado e claro (HTML simples: p, ul, li, strong). Contexto: ${taskData.title}\n\nAnotações:\n${notes}`;

            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setNewNote(response.text || '');
        } catch (e) {
            console.error(e);
            setNewNote('Erro ao gerar resumo.');
            setIsAiGenerated(false);
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleAddNote = () => {
        if (!newNote.replace(/<[^>]*>/g, '').trim()) return;
        const activityEntry: Activity = {
            id: `act-${Date.now()}`,
            type: 'note',
            timestamp: new Date().toISOString(),
            note: newNote,
            user: userName,
            isAiGenerated: isAiGenerated
        };
        const updatedActivity = [...taskData.activity, activityEntry];
        onUpdate(taskData.id, { activity: updatedActivity });
        setNewNote('');
        setIsNoteEditorExpanded(false);
        setIsAiGenerated(false);
    };

    const renderActivity = (act: Activity) => (
        <ActivityItem
            key={act.id}
            act={act}
            onDelete={onDeleteActivity.bind(null, taskData.id)}
            timeFormat={appSettings.timeFormat}
            onLinkEnter={handleLinkEnter}
            onLinkLeave={handleLinkLeave}
            taskTitle={taskData.title}
        />
    );

    // Função para buscar título automaticamente
    const handleFetchDocTitle = async () => {
        // Só busca se tiver URL e o título estiver vazio
        if (!newDocUrl.trim() || newDocTitle.trim()) return;

        setIsLoadingDocTitle(true);
        try {
            // Usa Microlink para contornar CORS e ler metadados
            const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(newDocUrl)}`);
            const data = await response.json();

            if (data.status === 'success' && data.data.title) {
                setNewDocTitle(data.data.title);
                // Opcional: Se quiser pegar o logo ou imagem, estaria em data.data.logo ou data.data.image
            }
        } catch (error) {
            console.error("Erro ao buscar título do link", error);
            // Falha silenciosa: deixa o usuário digitar se der erro
        } finally {
            setIsLoadingDocTitle(false);
        }
    };

    // --- FUNÇÃO PARA GERAR SUB-TAREFAS COM IA ---
    // --- FUNÇÃO PARA GERAR SUB-TAREFAS COM IA ---
    const handleGenerateSubTasks = async () => {
        if (!appSettings.enableAi) {
            setConfirmationState({
                isOpen: true,
                title: "Ativar Recursos de IA",
                message: "Para gerar sub-tarefas, é necessário ativar os Recursos de IA. Deseja ativar agora?",
                onConfirm: () => setAppSettings(prev => ({ ...prev, enableAi: true }))
            });
            return;
        }

        // 1. Validação local super rápida (poupa requisição à toa)
        const contextLength = (taskData.title || '').length + (taskData.description || '').length;
        if (contextLength < 4) {
            addToast({ title: 'O título é muito curto para a IA entender.', type: 'error' });
            return;
        }

        setIsGeneratingSubTasks(true);
        setAiSubTaskSuggestions([]); 

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // 👇 PROMPT ATUALIZADO: Com regra de Validação de Contexto
            const prompt = `
            Você é um assistente de produtividade.
            Crie uma lista de sub-tarefas curtas e diretas baseadas no título e descrição da tarefa abaixo.
            As sub-tarefas devem começar com um VERBO DE AÇÃO (ex: Criar, Revisar, Enviar).
            
            Título: ${taskData.title}
            Descrição: ${taskData.description || 'Sem descrição detalhada.'}
            
            REGRAS OBRIGATÓRIAS:
            1. SE o título e a descrição forem genéricos demais, vagos ou apenas testes (ex: "Teste", "asdf", "Nova Tarefa", "Ligar") e não houver contexto suficiente para quebrar em passos menores, NÃO INVENTE TAREFAS. Retorne EXATAMENTE e APENAS a palavra: INSUFICIENTE.
            2. Caso haja contexto válido, retorne APENAS uma lista de texto simples, com um item por linha.
            3. Comece CADA linha com um traço e um espaço (exatamente assim: "- ").
            4. Não adicione introduções ou formatação markdown.
            5. Gere no máximo 7 sub-tarefas.

            Exemplo de saída esperada:

            - Configurar repositório no GitHub
            - Definir paleta de cores
            - Criar componente Header
            `;

            const response = await ai.models.generateContent({ 
                model: 'gemini-2.5-flash', 
                contents: prompt 
            });
            
            const rawText = response.text || "";
            
            // 👇 2. O APP LÊ O CÓDIGO DA IA E AVISA O USUÁRIO
            if (rawText.trim().includes('INSUFICIENTE')) {
                addToast({ title: 'Adicione mais contexto à tarefa para a IA gerar sugestões!', type: 'error' });
                return; // Para a função aqui e não tenta renderizar nada
            }
            
            const suggestionsList = rawText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith('-'))
                .map(line => line.replace(/^- /, '').trim());

            if (suggestionsList.length > 0) {
                const draftSubTasks: SubTask[] = suggestionsList.map((text, index) => ({
                    id: `draft-${Date.now()}-${index}`,
                    text: text,
                    completed: false,
                    isDraft: true 
                }));
                
                setAiSubTaskSuggestions(draftSubTasks);
            } else {
                throw new Error("A IA não retornou itens no formato esperado.");
            }
        } catch (e) {
            console.error("Erro ao gerar sub-tarefas com IA:", e);
            addToast({ title: 'Erro ao gerar sugestões. Tente novamente.', type: 'error' });
        } finally {
            setIsGeneratingSubTasks(false);
        }
    };

    // Funcões para Aceitar/Recusar o Draft
    const handleAcceptAiSuggestions = () => {
        // Pega as sugestões e remove a propriedade 'isDraft' completamente
        const finalTasks = aiSubTaskSuggestions.map(st => {
            const { isDraft, ...cleanSubTask } = st; // Desestrutura tirando o isDraft
            return cleanSubTask; // Retorna só os dados limpos que o Firebase gosta
        });

        onUpdate(taskData.id, { subTasks: [...(taskData.subTasks || []), ...finalTasks] });
        setAiSubTaskSuggestions([]); // Limpa o rascunho
    };

    // --- HANDLERS DOS RASCUNHOS DA IA ---
    const handleToggleDraftSubTask = (subTaskId: string) => {
        setAiSubTaskSuggestions(prev => prev.map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st));
    };

    const handleDeleteDraftSubTask = (subTaskId: string) => {
        setAiSubTaskSuggestions(prev => prev.filter(st => st.id !== subTaskId));
    };

    const handleUpdateDraftSubTaskData = (subTaskId: string, updates: Partial<SubTask>) => {
        setAiSubTaskSuggestions(prev => prev.map(st => st.id === subTaskId ? { ...st, ...updates } : st));
    };

    const handleDiscardAiSuggestions = () => {
        setAiSubTaskSuggestions([]);
    };

    // --- FUNÇÃO PARA COPIAR TAREFA COMO RICH TEXT E MARKDOWN ---
    const handleCopyTask = async () => {
        // 1. Encontra os nomes reais de Categoria e Prioridade
        const categoryName = categories.find(c => c.id === taskData.categoryId)?.name || 'Sem categoria';
        const priorityName = tags.find(t => t.id === taskData.tagId)?.name || 'Sem prioridade';
        const projectName = currentProject?.name || 'Nenhum';

        // 2. Formata datas
        const createdDate = new Date(taskData.dateTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        const dueDateFormatted = taskData.dueDate ? new Date(taskData.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo';

        const statusIcon = taskData.status === 'Concluída' ? '✅' : taskData.status === 'Em andamento' ? '⏳' : '⏸️';

        // ==========================================
        // 3. VERSÃO 1: MARKDOWN (Para Slack, Notion, etc)
        // ==========================================
        let markdownText = `**${taskData.title}**\n`;
        if (taskData.description) markdownText += `\n*${taskData.description.replace(/<[^>]*>?/gm, '')}*\n`;
        markdownText += `\n**Status:** ${taskData.status} ${statusIcon}`;
        markdownText += `\n**Criado em:** ${createdDate}`;
        markdownText += `\n**Prazo:** ${dueDateFormatted}`;
        markdownText += `\n**Categoria:** ${categoryName}`;
        if (projectName !== 'Nenhum') markdownText += `\n**Projeto:** ${projectName}`;
        if (taskData.tagId) markdownText += `\n**Prioridade:** ${priorityName}`;

        if (taskData.subTasks && taskData.subTasks.length > 0) {
            markdownText += `\n\n**Sub-tarefas:**\n`;
            taskData.subTasks.forEach(st => {
                markdownText += `- [${st.completed ? 'x' : ' '}] ${st.text}\n`;
                if (st.note) markdownText += `  *Nota: ${st.note}*\n`;
            });
        }

        if (taskData.documents && taskData.documents.length > 0) {
            markdownText += `\n**Documentos:**\n`;
            taskData.documents.forEach(doc => {
                markdownText += `- [${doc.title || doc.url}](${doc.url})\n`;
            });
        }
        markdownText += `\n---\n🔗 [Ver no FlowTask](https://app.flowtask.tech/task/${taskData.id})`;

        // ==========================================
        // 4. VERSÃO 2: HTML/RICH TEXT (Para Word, Email, WhatsApp)
        // ==========================================
        let htmlText = `<b style="font-size: 1.2em;">${taskData.title}</b><br><br>`;
        if (taskData.description) htmlText += `<i>${taskData.description.replace(/\n/g, '<br>')}</i><br><br>`;
        htmlText += `<b>Status:</b> ${taskData.status} ${statusIcon}<br>`;
        htmlText += `<b>Criado em:</b> ${createdDate}<br>`;
        htmlText += `<b>Prazo:</b> ${dueDateFormatted}<br>`;
        htmlText += `<b>Categoria:</b> ${categoryName}<br>`;
        if (projectName !== 'Nenhum') htmlText += `<b>Projeto:</b> ${projectName}<br>`;
        if (taskData.tagId) htmlText += `<b>Prioridade:</b> ${priorityName}<br>`;

        if (taskData.subTasks && taskData.subTasks.length > 0) {
            htmlText += `<br><b>Sub-tarefas:</b><br><ul style="margin-top: 4px; padding-left: 20px;">`;
            taskData.subTasks.forEach(st => {
                htmlText += `<li>${st.completed ? '✅' : '◻️'} ${st.text}`;
                if (st.note) htmlText += `<br><i style="color: gray;">Nota: ${st.note.replace(/\n/g, '<br>')}</i>`;
                htmlText += `</li>`;
            });
            htmlText += `</ul>`;
        }

        if (taskData.documents && taskData.documents.length > 0) {
            htmlText += `<br><b>Documentos:</b><br><ul style="margin-top: 4px; padding-left: 20px;">`;
            taskData.documents.forEach(doc => {
                htmlText += `<li><a href="${doc.url}">${doc.title || doc.url}</a></li>`;
            });
            htmlText += `</ul>`;
        }
        htmlText += `<br><hr><br>🔗 <a href="https://app.flowtask.tech/task/${taskData.id}">Ver no FlowTask</a>`;

        // ==========================================
        // 5. INJEÇÃO NA ÁREA DE TRANSFERÊNCIA (O Pulo do Gato)
        // ==========================================
        try {
            // Cria um objeto de clipboard com ambas as versões!
            const clipboardItem = new ClipboardItem({
                'text/plain': new Blob([markdownText], { type: 'text/plain' }),
                'text/html': new Blob([htmlText], { type: 'text/html' })
            });
            await navigator.clipboard.write([clipboardItem]);
            addToast({ title: 'Tarefa copiada!', subtitle: 'Formatada perfeitamente na área de transferência.', type: 'success' });
        } catch (err) {
            console.error('Navegador não suporta HTML Clipboard, usando texto simples:', err);
            try {
                await navigator.clipboard.writeText(markdownText);
                addToast({ title: 'Tarefa copiada!', subtitle: 'Salva como texto simples.', type: 'success' });
            } catch (fallbackErr) {
                addToast({ title: 'Erro ao copiar', type: 'error' });
            }
        }
    };

    // --- LÓGICA DO AUTOCOMPLETE DE TAGS ---
    const tagSuggestions = useMemo(() => {
        // Se o dicionário não existe OU o campo está vazio, não mostra nenhuma sugestão
        if (!appSettings.customTags || !newTag.trim()) return [];

        const sanitizedInput = sanitizeTag(newTag);
        
        return appSettings.customTags
            .filter(t => t.includes(sanitizedInput))
            .filter(t => !(taskData.tags || []).includes(t))
            .slice(0, 10); 
            
    }, [newTag, appSettings.customTags, taskData.tags]);

    return (

        <div className="p-4 flex flex-col h-full">

            {/* 👇 5. RENDERIZE O TOOLTIP NO TOPO DO JSX */}
            <LinkAddTooltip
                linkData={detectedLink}
                onAdd={handleAddDetectedLink}
                onClose={handleLinkLeave}      // Se sair do tooltip, tenta fechar
                onMouseEnter={handleTooltipEnter} // Se entrar no tooltip, cancela o fechamento
            />

            <ConfirmationDialog state={confirmationState} setState={setConfirmationState} />
            <ReminderModal
                isOpen={isReminderModalOpen}
                onClose={() => setIsReminderModalOpen(false)}
                onSave={handleSaveReminder}
                initialData={null}
                timeFormat={appSettings.timeFormat}
            />

            <header className="flex items-center justify-between pb-4 gap-4">
                <div className="flex-1 flex items-center gap-4 min-w-0">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><ChevronLeftIcon className="w-6 h-6" /></button>
                    <input type="text" value={taskData.title} onChange={e => handleLocalUpdate({ title: e.target.value })} onBlur={e => handleTitleBlur(e.target.value)} placeholder="Título da Tarefa" className="text-3xl font-bold bg-transparent focus:outline-none w-full text-gray-900 dark:text-white p-2 -m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 focus:bg-white dark:focus:bg-[#0D1117] focus:ring-2 focus:ring-primary-400 truncate" />
                </div>
                <div className="flex items-center gap-2">
                    <div ref={searchContainerRef} className="relative">
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
                            className="bg-white dark:bg-[#21262D] text-gray-900 dark:text-gray-200 rounded-lg pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 w-72 transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/50 focus:border-primary-500"
                        />
                        {isSearchOpen && hasResults && (
                            <div className="absolute top-full mt-2 w-[500px] bg-white dark:bg-[#21262D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-20 max-h-96 overflow-y-auto p-6">
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
                                                    {tasksInGroup.map(task => {
                                                        const category = categories.find(c => c.id === task.categoryId);
                                                        const tag = tags.find(t => t.id === task.tagId);
                                                        return (
                                                            <div key={task.id} className="rounded-lg hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => handleResultClick(task)}>
                                                                <TaskCard
                                                                    task={task}
                                                                    category={category}
                                                                    tag={tag}
                                                                    onSelect={() => { }}
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
                            <div className="absolute top-full mt-2 w-[500px] bg-white dark:bg-[#21262D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-20 p-6 text-center text-sm text-gray-500">
                                Nenhum resultado encontrado.
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
                        onSelectTask={onSelectTask}
                    />
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400">
                        {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                    </button>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-4"></div>

                    {/* 👇 NOVO BOTÃO AQUI */}
                    <button
                        onClick={handleCopyTask}
                        title="Copiar detalhes da tarefa para Área de Transferência"
                        className="flex items-center gap-2 px-2.5 py-2.5 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-gray-400 dark:hover:ring-offset-[#0D1117]"
                    >
                        {/* Como não temos um ícone específico importado para Markdown, o DocumentTextIcon funciona perfeitamente */}
                        <DocumentTextIcon className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => onDuplicate(taskData)}
                        title="Duplicar Tarefa"
                        className="flex items-center gap-2 px-2.5 py-2.5 rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-gray-400 dark:hover:ring-offset-[#0D1117]"
                    >
                        <DocumentDuplicateIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onDelete(taskData.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-md hover:shadow-lg hover:shadow-red-400/30 duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-red-400 dark:hover:ring-offset-[#0D1117]"
                    >
                        <TrashIcon className="w-5 h-5" />
                        <span>Excluir Tarefa</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-8 gap-4 2xl:gap-6 min-h-0">
                {/* Col 1 */}
                <div className="lg:col-span-1 2xl:col-span-2 flex flex-col gap-6 overflow-y-auto custom-scrollbar px-2 pb-2">
                    {/* Lógica de Visualização vs Edição da Descrição */}
                    <div className="relative group">
                        {isEditingDescription ? (
                            <textarea
                                autoFocus
                                value={taskData.description || ''}
                                onChange={e => handleLocalUpdate({ description: e.target.value })}
                                onBlur={e => {
                                    onUpdate(taskData.id, { description: e.target.value });
                                    setIsEditingDescription(false); // Sai do modo edição ao clicar fora
                                }}
                                className="block w-full rounded-lg bg-white dark:bg-[#0D1117] border border-primary-500 text-base font-semibold text-gray-900 dark:text-gray-200 p-4 h-auto min-h-[8rem] focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-y"
                                placeholder="Adicionar uma descrição..."
                            />
                        ) : (
                            <div
                                onClick={() => setIsEditingDescription(true)}
                                className="block w-full rounded-lg bg-transparent text-base font-semibold text-gray-500 dark:text-gray-400 p-4 min-h-[8rem] cursor-text transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            >
                                {taskData.description ? (
                                    <LinkifiedText text={taskData.description} className="whitespace-pre-wrap leading-relaxed" />
                                ) : (
                                    <span className="text-gray-400 italic">Adicionar uma descrição...</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status Slider */}
                    <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 block px-1">Status</label>
                        <div className="relative bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl flex items-center justify-between shadow-inner w-full">
                            {/* The Moving Indicator */}
                            <div
                                className={`absolute top-1.5 bottom-1.5 w-[calc(33.33%-4px)] rounded-lg shadow-md transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] z-0 ${STATUS_STEPS[currentStatusIndex >= 0 ? currentStatusIndex : 0].bgClass}`}
                                style={{
                                    left: `calc(${currentStatusIndex * 33.33}% + 2px)`,
                                }}
                            />

                            {/* The Clickable Steps */}
                            {STATUS_STEPS.map((step) => {
                                const isActive = taskData.status === step.status;
                                return (
                                    <button
                                        key={step.status}
                                        onClick={() => handleStatusChange(step.status)}
                                        className={`relative z-10 flex-1 w-full flex flex-col items-center justify-center py-2 text-xs font-bold rounded-lg transition-all duration-200 
                                            focus:outline-none
                                            ${isActive
                                                ? 'text-white'
                                                : `text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:ring-2 hover:ring-offset-2 hover:ring-offset-gray-100 dark:hover:ring-offset-gray-800 ${step.ringClass}`
                                            }`}
                                    >
                                        <div className="mb-0.5">{step.icon}</div>
                                        <span className="hidden xl:inline leading-none">{step.status}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* BOTÃO DE PAUSA (ON HOLD) */}
                    <div className="mt-0">
                        <button
                            onClick={() => {
                                const newOnHoldState = !taskData.onHold;

                                const activityEntry: Activity = {
                                    id: `act-${Date.now()}`,
                                    type: 'status_change',
                                    timestamp: new Date().toISOString(),
                                    from: taskData.onHold ? 'Em espera' : 'Ativo',
                                    to: newOnHoldState ? 'Em espera' : 'Ativo',
                                    user: userName,
                                    note: newOnHoldState
                                        ? '<strong>Pausou a tarefa</strong> (aguardando terceiros/bloqueio).'
                                        : '<strong>Retomou a tarefa</strong>.'
                                };

                                onUpdate(taskData.id, {
                                    onHold: newOnHoldState,
                                    activity: [...taskData.activity, activityEntry]
                                });
                                handleLocalUpdate({ onHold: newOnHoldState });
                            }}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200
                                ${taskData.onHold
                                    ? 'bg-yellow-500 text-white shadow-md hover:bg-yellow-600 hover:shadow-lg hover:ring-2 hover:ring-offset-2 hover:ring-yellow-400 dark:hover:ring-offset-[#161B22] border border-transparent'
                                    : 'relative bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-primary-400'
                                }`}
                        >
                            {taskData.onHold ? (
                                <>
                                    <PlayIcon className="w-5 h-5" />
                                    Retomar Tarefa
                                </>
                            ) : (
                                <>
                                    <PauseIcon className="w-5 h-5" />
                                    Pausar tarefa (On Hold)
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex flex-col gap-6 px-4 pt-6 mt-2 border-t border-gray-200 dark:border-gray-700">
                        <div ref={dueDateRef} className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-1.5">
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 xl:mb-0">Prazo Final</label>

                            <div className="group flex items-center justify-end w-full xl:w-[205px] relative">

                                <button type="button" onClick={() => setIsDueDateCalendarOpen(prev => !prev)}
                                    className={`relative flex items-center justify-between px-3 py-2 bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm cursor-pointer transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-400 flex-1 min-w-0 ${isDueDateCalendarOpen ? 'ring-2 ring-primary-500/20 dark:ring-primary-500/50 border-primary-500' : ''}`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <CalendarDaysIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className={`text-sm truncate ${taskData.dueDate ? 'text-gray-900 dark:text-gray-200' : 'text-gray-500'}`}>{taskData.dueDate ? new Date(taskData.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Nenhuma'}</span>
                                    </div>
                                </button>

                                {/* Botão Google Agenda */}
                                {taskData.dueDate && (
                                    <div className="flex items-center gap-1 overflow-hidden w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out pl-1">
                                        <a
                                            href={generateGoogleCalendarLink(taskData)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            // Removi as cores de texto, deixei apenas o hover do fundo
                                            className="p-2 text-gray-400 hover:text-primary-500 transition-colors bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                            title="Adicionar ao Google Agenda"
                                        >
                                            <GoogleCalendarIcon className="w-5 h-5 object-contain" />
                                        </a>
                                    </div>
                                )}

                                {isDueDateCalendarOpen && (
                                    <div className="absolute top-full right-0 mt-2 z-10">
                                        <Calendar selectedDate={taskData.dueDate ? new Date(taskData.dueDate) : null} onSelectDate={handleDateSelect} displayDate={editCalendarDisplayDate} onDisplayDateChange={setEditCalendarDisplayDate} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div ref={categoryDropdownRef} className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-1.5">
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 xl:mb-0">Categoria</label>
                            <div className="relative w-full xl:w-[205px]">
                                <button
                                    onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                                    className={`flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm cursor-pointer transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-400 ${isCategoryDropdownOpen ? 'ring-2 ring-primary-500/20 dark:ring-primary-500/50 border-primary-500' : ''}`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        {(() => {
                                            const cat = categories.find(c => c.id === taskData.categoryId);
                                            const Icon = getCategoryIcon(cat);
                                            return <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
                                        })()}
                                        <span className={`text-sm truncate ${taskData.categoryId ? 'text-gray-900 dark:text-gray-200' : 'text-gray-500'}`}>
                                            {categories.find(c => c.id === taskData.categoryId)?.name || 'Selecionar Categoria'}
                                        </span>
                                    </div>
                                    <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                </button>

                                {isCategoryDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-[#21262D] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden flex flex-col max-h-60">
                                        <div className="overflow-y-auto p-1">
                                            {categories.map(cat => {
                                                const Icon = getCategoryIcon(cat);
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => { handleCategoryChange(cat.id); setIsCategoryDropdownOpen(false); }}
                                                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${taskData.categoryId === cat.id ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        <span className="truncate">{cat.name}</span>
                                                        {taskData.categoryId === cat.id && <CheckCircleIcon className="w-3.5 h-3.5 ml-auto" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div ref={tagDropdownRef} className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-1.5">
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 xl:mb-0">Prioridade</label>
                            <div className="relative w-full xl:w-[205px]">
                                <button
                                    onClick={() => setIsTagDropdownOpen(prev => !prev)}
                                    className={`flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm cursor-pointer transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-400 ${isTagDropdownOpen ? 'ring-2 ring-primary-500/20 dark:ring-primary-500/50 border-primary-500' : ''}`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        {(() => {
                                            const selectedTag = tags.find(t => t.id === taskData.tagId);
                                            if (selectedTag) {
                                                return (
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${selectedTag.bgColor} ${selectedTag.color}`}>
                                                        {selectedTag.name}
                                                    </span>
                                                );
                                            }
                                            return <span className="text-sm text-gray-500 truncate">Selecionar Prioridade</span>;
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
                                                    onClick={() => { handleTagChange(tag.id); setIsTagDropdownOpen(false); }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${taskData.tagId === tag.id ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                >
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${tag.bgColor} ${tag.color}`}>
                                                        {tag.name}
                                                    </span>
                                                    {taskData.tagId === tag.id && <CheckCircleIcon className="w-3.5 h-3.5 ml-auto text-primary-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Project Selector */}
                        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-1.5" ref={projectDropdownRef}>
                            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 xl:mb-0">Projeto</label>

                            <div className="group flex items-center justify-end w-full xl:w-[205px] relative">
                                <div
                                    className={`relative flex items-center justify-between px-3 py-2 bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm cursor-pointer transition-all duration-300 ease-in-out hover:border-primary-400 dark:hover:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 dark:focus-within:ring-primary-500/50 focus-within:border-primary-500 flex-1 min-w-0`}
                                    onClick={() => {
                                        setIsProjectDropdownOpen(true);
                                        setProjectSearchQuery('');
                                    }}
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
                                                className="bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-gray-200 w-full p-0"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center flex-1 gap-2 min-w-0">
                                            {currentProject ? (
                                                <ProjectIcon className={`w-4 h-4 flex-shrink-0 ${currentProject.color.replace('bg-', 'text-')}`} />
                                            ) : (
                                                <FolderIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                            )}
                                            <span className={`text-sm truncate ${currentProject ? 'text-gray-900 dark:text-gray-200' : 'text-gray-500'}`}>
                                                {currentProject ? currentProject.name : 'Selecionar Projeto'}
                                            </span>
                                        </div>
                                    )}
                                    {!isProjectDropdownOpen && <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />}

                                    {/* Dropdown */}
                                    {isProjectDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#21262D] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden flex flex-col max-h-60">
                                            <div className="overflow-y-auto p-1">
                                                {filteredProjects.length > 0 ? filteredProjects.map(proj => {
                                                    const ItemIcon = proj.icon && PROJECT_ICONS[proj.icon] ? PROJECT_ICONS[proj.icon] : FolderIcon;
                                                    return (
                                                        <button
                                                            key={proj.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleProjectSelect(proj);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2
                                                                ${taskData.projectId === proj.id
                                                                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                                }`}
                                                        >
                                                            <ItemIcon className={`w-4 h-4 flex-shrink-0 ${proj.color.replace('bg-', 'text-')}`} />
                                                            <span className="truncate">{proj.name}</span>
                                                            {taskData.projectId === proj.id && <CheckCircleIcon className="w-3.5 h-3.5 ml-auto" />}
                                                        </button>
                                                    );
                                                }) : (
                                                    <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                                        Nenhum projeto encontrado.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Container - Revealed on hover */}
                                {currentProject && !isProjectDropdownOpen && (
                                    <div className="flex items-center gap-1 overflow-hidden w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out pl-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenProject(currentProject);
                                            }}
                                            className="p-2 text-gray-400 hover:text-primary-500 transition-colors bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                            title="Abrir Projeto"
                                        >
                                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUnlinkProject();
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="Desvincular Projeto"
                                        >
                                            <LinkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Seção de Tags (Refatorada) */}
                        <div className="flex flex-col gap-3">
                            
                            {/* Linha 1: Label na esquerda, Input na direita (Alinhado com os de cima) */}
                            <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-1.5" ref={tagAutocompleteRef}>
                                <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 xl:mb-0">Tags</label>
                                
                                {/* O Input com tamanho travado em 205px nas telas grandes para alinhar com os combos acima */}
                                <div className="relative w-full xl:w-[205px]">
                                    <input 
                                        ref={tagInputRef}
                                        type="text" 
                                        value={newTag} 
                                        onChange={e => setNewTag(e.target.value)} 
                                        onFocus={() => setIsTagInputFocused(true)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddTagToList()} 
                                        placeholder="Adicionar tag..." 
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm p-2 transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/50 focus:border-primary-500" 
                                    />
                                    
                                    {/* Menu Flutuante de Sugestões */}
                                    {isTagInputFocused && newTag.trim() && (
                                        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#21262D] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden flex flex-col max-h-60 animate-fade-in">
                                            <div className="overflow-y-auto p-1 custom-scrollbar">

                                                {tagSuggestions.map(tagStr => (
                                                    <button
                                                        key={tagStr}
                                                        onClick={() => handleAddTagToList(tagStr)}
                                                        className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                    >
                                                        <span className="text-gray-400 font-bold text-sm leading-none">#</span>
                                                        {tagStr}
                                                    </button>
                                                ))}

                                                {!tagSuggestions.includes(sanitizeTag(newTag)) && sanitizeTag(newTag).length > 0 && (
                                                    <button
                                                        onClick={() => handleAddTagToList()}
                                                        className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-t border-gray-100 dark:border-gray-800 mt-1 pt-2"
                                                    >
                                                        <PlusIcon className="w-4 h-4" />
                                                        Criar: <strong className="break-all">"{sanitizeTag(newTag)}"</strong>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Linha 2: As tags que já foram adicionadas ficam embaixo do input */}
                            {taskData.tags && taskData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {taskData.tags.map(t => (
                                        <span key={t} className="flex items-center gap-1.5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-full text-xs font-semibold border border-primary-200 dark:border-primary-800/30">
                                            <span className="opacity-50 font-normal">#</span>
                                            {t} 
                                            <button onClick={() => handleRemoveTag(t)} className="text-primary-500 hover:text-primary-800 dark:hover:text-primary-200 transition-colors ml-0.5">
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-auto pt-4 px-4">
                        <button onClick={() => setIsReminderModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-primary-500 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-primary-600 transition-all shadow-md hover:shadow-lg hover:shadow-primary-400/30 duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-primary-400 dark:hover:ring-offset-[#0D1117]">
                            <ClockIcon className="w-5 h-5" />
                            Criar Lembrete
                        </button>
                    </div>
                </div>

                {/* Col 2 (Central) */}
                <div className="lg:col-span-1 2xl:col-span-3 flex flex-col gap-4 min-h-0 h-full">

                    {/* 1. Sub-tarefas Section */}
                    <div className={`bg-white dark:bg-[#161B22] p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isDocsCollapsed ? 'h-[calc(100%-4.5rem)]' : 'h-[55%]'}`}>
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Sub-tarefas</h3>

                            {/* 👇 MUDANÇA 1: Botão Pequeno no Topo (Só aparece se já tem sub-tarefas E não tem rascunho aberto) */}
                            {totalSubTasks > 0 && aiSubTaskSuggestions.length === 0 && (
                                <button
                                    onClick={handleGenerateSubTasks}
                                    disabled={isGeneratingSubTasks}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                    <SparklesIcon className={`w-3.5 h-3.5 ${isGeneratingSubTasks ? 'animate-spin' : ''}`} />
                                    Gerar com IA
                                </button>
                            )}
                        </div>

                        {totalSubTasks > 0 && (
                            <div className="mb-4 flex-shrink-0">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{completedSubTasks} de {totalSubTasks} concluídas</p>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-primary-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 overflow-y-auto pr-2 flex-1 min-h-0 custom-scrollbar">
                            {Array.isArray(taskData.subTasks) && taskData.subTasks.length > 0 ? (
                                taskData.subTasks.map((st, index) => (
                                    <SubTaskItem
                                        key={st.id}
                                        subTask={st}
                                        onToggle={handleSubTaskToggle}
                                        onDelete={handleDeleteSubTask}
                                        onUpdate={handleUpdateSubTaskData}
                                        dragHandlers={{
                                            draggable: true,
                                            onDragStart: (e: React.DragEvent<HTMLDivElement>) => handleSubTaskDragStart(e, st, index),
                                            onDragEnd: handleSubTaskDragEnd,
                                            onDragOver: (e: React.DragEvent<HTMLDivElement>) => handleSubTaskDragOver(e, index),
                                            onDrop: handleSubTaskDrop
                                        }}
                                    />
                                ))
                            ) : aiSubTaskSuggestions.length === 0 ? (
                                /* 👇 MUDANÇA 2: Empty State com Botão Grande de IA */
                                <div className="text-center py-4 flex flex-col items-center justify-center h-full">
                                    <ListBulletIcon className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Nenhuma sub-tarefa</h4>
                                    <button
                                        onClick={handleGenerateSubTasks}
                                        disabled={isGeneratingSubTasks}
                                        className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                                    >
                                        <SparklesIcon className={`w-4 h-4 ${isGeneratingSubTasks ? 'animate-spin' : 'group-hover:animate-pulse'}`} />
                                        {isGeneratingSubTasks ? 'Pensando...' : 'Criar checklist com IA'}
                                    </button>
                                </div>
                            ) : null}

                            {/* 👇 MUDANÇA AQUI: 2. Mapeamento dos Rascunhos da IA */}
                            {aiSubTaskSuggestions.map((draftSt) => (
                                <SubTaskItem
                                    key={draftSt.id}
                                    subTask={draftSt}
                                    isDraft={true}
                                    onToggle={handleToggleDraftSubTask}
                                    onDelete={handleDeleteDraftSubTask}
                                    onUpdate={handleUpdateDraftSubTaskData}
                                // Não passamos dragHandlers para o rascunho, ele fica fixo até ser salvo!
                                />
                            ))}


                        </div>

                        {/* 👇 MUDANÇA AQUI: Barra de Confirmação da IA */}
                        {aiSubTaskSuggestions.length > 0 && (
                            <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl flex items-center justify-between flex-shrink-0 animate-fade-in shadow-inner">
                                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                    <SparklesIcon className="w-4 h-4" />
                                    <span className="text-sm font-semibold">{aiSubTaskSuggestions.length} sugestões</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDiscardAiSuggestions}
                                        className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Descartar
                                    </button>
                                    <button
                                        onClick={handleAcceptAiSuggestions}
                                        className="px-3 py-1.5 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-sm"
                                    >
                                        Manter Sugestões
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 mt-4 flex-shrink-0">
                            <input type="text" value={newSubTask} onChange={e => setNewSubTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSubTask()} placeholder="Adicionar sub-tarefa..." className="flex-grow block w-full rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm p-2.5 transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/50 focus:border-primary-500" />
                            <button onClick={handleAddSubTask} className="bg-primary-500 text-white p-2.5 rounded-lg hover:bg-primary-600 disabled:opacity-50" disabled={!newSubTask.trim()}><PlusIcon className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* 2. Documents Section */}
                    {/* Altura: Se fechado, altura fixa do header (3.8rem). Se aberto, 45%. */}
                    <div className={`bg-white dark:bg-[#161B22] p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isDocsCollapsed ? 'h-[3.8rem] flex-shrink-0 overflow-hidden' : 'h-[45%]'}`}>
                        <div
                            className="flex justify-between items-center cursor-pointer mb-0 flex-shrink-0"
                            onClick={() => setIsDocsCollapsed(!isDocsCollapsed)}
                        >
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                Documentos e Links
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                    {(taskData.documents || []).length}
                                </span>
                            </h3>
                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 transition-transform duration-300">
                                {/* Lógica da Seta Invertida: UP quando fechado, DOWN quando aberto */}
                                {isDocsCollapsed ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Conteúdo: Usamos opacity/visibility para transição suave ao invés de remover do DOM */}
                        <div className={`flex flex-col flex-1 min-h-0 transition-all duration-300 delay-75 ${isDocsCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible pt-2'}`}>
                            <div className="flex-1 overflow-y-auto pr-2 min-h-0 custom-scrollbar space-y-2 mb-3">
                                {(taskData.documents || []).length > 0 ? (
                                    (taskData.documents || []).map(doc => {
                                        let Icon = DocumentTextIcon;
                                        if (doc.type === 'google-doc') Icon = GoogleDocsIcon;
                                        if (doc.type === 'google-sheet') Icon = GoogleSheetsIcon;
                                        if (doc.type === 'google-slide') Icon = GoogleSlidesIcon;
                                        if (doc.type === 'google-drive') Icon = GoogleDriveIcon;
                                        if (doc.type === 'link') Icon = LinkIcon;

                                        return (
                                            <div key={doc.id} className="group flex items-center p-2 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-white/5 transition-all">
                                                <div className="p-2 bg-white dark:bg-black/20 rounded-md mr-3 shadow-sm">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate hover:text-primary-500 transition-colors">
                                                        {doc.title || doc.url}
                                                    </p>
                                                    {doc.title && <p className="text-[10px] text-gray-400 truncate">{doc.url}</p>}
                                                </a>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditDocument(doc)}
                                                        className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                                                    >
                                                        <PencilIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDocument(doc.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                    >
                                                        <TrashIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-6 text-gray-400 dark:text-gray-600 text-sm">
                                        Nenhum documento anexado.
                                    </div>
                                )}
                            </div>

                            {isAddingDoc ? (
                                <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0 animate-fade-in">
                                    <input
                                        type="text"
                                        value={newDocUrl}
                                        onChange={e => setNewDocUrl(e.target.value)}
                                        onBlur={handleFetchDocTitle}
                                        placeholder="Cole a URL aqui..."
                                        className="w-full text-sm p-2 mb-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 focus:outline-none focus:border-primary-500"
                                        autoFocus
                                    />
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={newDocTitle}
                                            onChange={e => setNewDocTitle(e.target.value)}
                                            placeholder={isLoadingDocTitle ? "Buscando título..." : "Título (opcional)"}
                                            disabled={isLoadingDocTitle} // Trava enquanto carrega
                                            className={`w-full text-sm p-2 mb-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 focus:outline-none focus:border-primary-500 ${isLoadingDocTitle ? 'opacity-50 cursor-wait' : ''}`}
                                        />
                                        {isLoadingDocTitle && (
                                            <div className="absolute right-2 top-2.5">
                                                {/* Spinner simples usando Tailwind */}
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => { setIsAddingDoc(false); setNewDocUrl(''); setNewDocTitle(''); setEditingDocId(null); }}
                                            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleAddDocument}
                                            disabled={!newDocUrl.trim()}
                                            className="px-3 py-1.5 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 rounded transition-colors disabled:opacity-50"
                                        >
                                            {editingDocId ? 'Salvar' : 'Adicionar'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddingDoc(true)}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-500 transition-all text-sm font-medium flex-shrink-0"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Adicionar Documento
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Col 3 */}
                <section className="lg:col-span-1 2xl:col-span-3 bg-white dark:bg-[#161B22] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center p-4 flex-shrink-0">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Atividade</h3>
                        {/* ... Activity buttons ... */}
                        <div className="flex items-center gap-2">
                            {hasNotes && (
                                <button
                                    onClick={handleSummarizeActivities}
                                    disabled={isSummarizing}
                                    className="group flex items-center justify-center p-2 rounded-full bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-100 shadow-sm hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:bg-gradient-to-r hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:ring-2 hover:ring-purple-400 hover:ring-offset-2 dark:hover:ring-offset-[#161B22]"
                                >
                                    <SparklesIcon className={`w-5 h-5 flex-shrink-0 ${isSummarizing ? 'animate-spin' : ''}`} />
                                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap ml-0 group-hover:ml-2 text-sm font-medium">
                                        Sumarizar
                                    </span>
                                </button>
                            )}
                            <div ref={filterDropdownRef} className="relative">
                                <button
                                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                    className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all duration-200 hover:ring-2 hover:ring-primary-400 ${activityFilter !== 'all'
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
                                                className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-between ${activityFilter === option.value
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
                        <div className="px-4 pb-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1 rounded-full animate-pulse-glow w-full"></div>
                            </div>
                        </div>
                    )}
                    <div className={`flex-1 overflow-y-auto px-4 transition-colors duration-500 ${isSummarizing ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}><ul className="space-y-0">{filteredActivity.slice().reverse().map(renderActivity)}</ul></div>
                    <div className="p-4 mt-auto">
                        {isNoteEditorExpanded ? (
                            <div className="transition-all duration-300 ease-in-out">
                                <RichTextNoteEditor
                                    value={newNote}
                                    onChange={setNewNote}
                                    placeholder="Adicionar uma anotação..."
                                    onAdd={handleAddNote}
                                    onCancel={() => {
                                        setNewNote('');
                                        setIsNoteEditorExpanded(false);
                                        setIsAiGenerated(false);
                                    }}
                                    isLoading={isSummarizing}
                                    isAiHighlighted={isAiGenerated}
                                    enableAi={appSettings.enableAi}
                                />
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsNoteEditorExpanded(true)}
                                className="w-full text-left cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0D1117] text-gray-500 dark:text-gray-400 p-3 text-sm transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-400"
                            >
                                Adicionar uma anotação...
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TaskDetailView;