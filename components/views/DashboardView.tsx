
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Task, Category, Tag, Status, Habit, Activity, AppSettings } from '../../types';
import TaskCard from '../TaskCard';
import { 
    CheckCircleIcon, PlayCircleIcon, StopCircleIcon, ClockIcon, 
    ArrowTrendingUpIcon, ArrowTrendingDownIcon, ClipboardDocumentCheckIcon, 
    CheckIcon, SparklesIcon, KanbanIcon, CalendarDaysIcon, BellIcon, ExclamationTriangleIcon,
    ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon
} from '../icons';
import { STATUS_COLORS } from '../../constants';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const taskSortFunction = (a: Task, b: Task) => {
    const now = new Date();
    const aIsOverdue = a.dueDate && new Date(a.dueDate) < now && a.status !== 'Concluída';
    const bIsOverdue = b.dueDate && new Date(b.dueDate) < now && b.status !== 'Concluída';

    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;

    const aDueDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDueDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;

    return aDueDate - bDueDate;
};

// --- WIDGETS COMPONENTS ---

const HabitWidget: React.FC<{ habits: (Habit & { isCompleted: boolean })[], onToggle: (id: string) => void }> = ({ habits, onToggle }) => {
    const completedCount = habits.filter(h => h.isCompleted).length;
    const totalCount = habits.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const allCompleted = totalCount > 0 && completedCount === totalCount;

    // Dynamic background based on completion
    const bgClass = allCompleted 
        ? 'bg-gradient-to-br from-emerald-400 to-green-500' // Success Green
        : 'bg-gradient-to-br from-amber-500 to-orange-600'; // Pending Orange

    return (
        <div className={`${bgClass} transition-colors duration-700 rounded-2xl p-6 text-white shadow-lg border border-transparent relative overflow-hidden group flex flex-col justify-between h-full min-h-[220px]`}>
            {/* Background Decorations & Watermark */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-2xl pointer-events-none"></div>
            
            {/* Large Watermark */}
            <div className="absolute -bottom-6 -right-6 text-white opacity-10 transform rotate-12 pointer-events-none z-0 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
                {allCompleted ? <CheckCircleIcon className="w-48 h-48" /> : <ClipboardDocumentCheckIcon className="w-48 h-48" />}
            </div>
            
            {allCompleted && (
                <div className="absolute top-4 right-4 animate-fade-in pointer-events-none z-10">
                    <CheckCircleIcon className="w-16 h-16 text-white/30" />
                </div>
            )}
            
            <div className="relative z-10">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <div className="flex items-center gap-2 text-white/90 mb-1">
                            <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Checklist Diário</span>
                        </div>
                        <h3 className="text-2xl font-bold leading-tight drop-shadow-sm">
                            {allCompleted ? 'Meta batida! 🎉' : 'Sua rotina'}
                        </h3>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-bold drop-shadow-sm">{completedCount}</span>
                        <span className="text-lg text-white/80 font-medium">/{totalCount}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-black/20 rounded-full h-1.5 mb-5 overflow-hidden backdrop-blur-sm">
                    <div 
                        className="h-full bg-white rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.6)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 relative z-10 pr-1 -mr-2">
                {habits.length > 0 ? habits.map(habit => (
                    <div 
                        key={habit.id}
                        onClick={() => onToggle(habit.id)}
                        className={`
                            group/item flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer backdrop-blur-md
                            ${habit.isCompleted 
                                ? 'bg-white/20 border-white/20' 
                                : 'bg-white/10 border-white/5 hover:bg-white/20 hover:translate-x-1'
                            }
                        `}
                    >
                        <div className={`
                            flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                            ${habit.isCompleted 
                                ? `bg-white border-white ${allCompleted ? 'text-green-500' : 'text-orange-500'}` 
                                : 'border-white/60 text-transparent group-hover/item:border-white'
                            }
                        `}>
                            <CheckIcon className="w-3.5 h-3.5 stroke-[4]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate transition-colors ${habit.isCompleted ? 'text-white/80 line-through decoration-white/60' : 'text-white'}`}>
                                {habit.title}
                            </p>
                            {habit.reminderTime && !habit.isCompleted && (
                                <p className="text-[10px] text-white/90 flex items-center gap-1 mt-0.5 font-medium">
                                    <ClockIcon className="w-3 h-3" /> {habit.reminderTime}
                                </p>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="h-full flex items-center justify-center text-white/60 text-sm italic">
                        Nenhum hábito configurado.
                    </div>
                )}
            </div>
        </div>
    );
};

interface SuggestionItem {
    taskId: string;
    reason: string;
    action: string;
}

const AiQuickWinWidget: React.FC<{ 
    isLoading: boolean; 
    suggestions: SuggestionItem[];
    currentIndex: number;
    currentTask: Task | undefined;
    onSelectTask: (task: Task) => void; 
    onRefresh: () => void;
    onNext: () => void;
    onPrev: () => void;
    isAiEnabled: boolean;
    onEnableAi: () => void;
}> = ({ isLoading, suggestions, currentIndex, currentTask, onSelectTask, onRefresh, onNext, onPrev, isAiEnabled, onEnableAi }) => {
    
    if (!isAiEnabled) {
        return (
            <div 
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group flex flex-col justify-between h-full min-h-[220px]"
            >
                {/* Background Decorations */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col h-full items-center justify-center text-center space-y-4">
                    <div className="p-3 bg-white/20 rounded-full">
                        <SparklesIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-1">Recursos de IA</h3>
                        <p className="text-sm text-indigo-100 opacity-90 max-w-xs">
                            Ative os Recursos de IA para receber sugestões personalizadas de tarefas para priorizar.
                        </p>
                    </div>
                    <button 
                        onClick={onEnableAi}
                        className="px-6 py-2 bg-white text-indigo-600 font-bold rounded-lg shadow-md hover:bg-indigo-50 transition-colors"
                    >
                        Ativar
                    </button>
                </div>
            </div>
        )
    }

    const suggestion = suggestions[currentIndex];
    const total = suggestions.length;

    return (
        <div 
            className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group flex flex-col justify-between h-full min-h-[220px]"
        >
            {/* Background Decorations */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>

            {/* Large Watermark */}
            <div className="absolute -bottom-8 -right-8 text-white opacity-10 transform -rotate-12 pointer-events-none z-0 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6">
                <SparklesIcon className="w-48 h-48" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-indigo-100">
                        <SparklesIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-bold uppercase tracking-wider">Sugestão Inteligente</span>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-black/20 rounded-lg p-0.5">
                        {total > 1 && (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onPrev(); }} 
                                    disabled={currentIndex === 0 || isLoading}
                                    className="p-1 rounded hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors" 
                                    title="Sugestão anterior"
                                >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                </button>
                                <span className="text-[10px] font-medium px-1 text-indigo-100 tabular-nums">
                                    {currentIndex + 1}/{total}
                                </span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onNext(); }} 
                                    disabled={currentIndex === total - 1 || isLoading}
                                    className="p-1 rounded hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors" 
                                    title="Próxima sugestão"
                                >
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-white/10 mx-0.5"></div>
                            </>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRefresh(); }} 
                            className="p-1 rounded hover:bg-white/20 transition-colors" 
                            title="Gerar novas sugestões"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center opacity-80 space-y-3">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <p className="text-sm font-medium">Analisando prioridades...</p>
                    </div>
                ) : suggestion && currentTask ? (
                    <div className="flex-1 flex flex-col justify-between animate-fade-in">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium mb-1 opacity-90">
                                {suggestion.reason}
                            </p>
                            <h3 className="text-2xl font-bold leading-tight mb-2 drop-shadow-sm">
                                {suggestion.action}
                            </h3>
                        </div>
                        
                        <div 
                            onClick={() => onSelectTask(currentTask)}
                            className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 cursor-pointer hover:bg-white/20 transition-all duration-300 flex items-center gap-3 group-hover:translate-y-[-2px] shadow-lg"
                        >
                            <div className={`w-2 h-8 rounded-full ${STATUS_COLORS[currentTask.status]}`}></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{currentTask.title}</p>
                                <p className="text-xs text-indigo-100 truncate opacity-80">
                                    {currentTask.subTasks.filter(st => !st.completed).length > 0 
                                        ? `${currentTask.subTasks.filter(st => !st.completed).length} sub-tarefas restantes` 
                                        : 'Ação rápida identificada'}
                                </p>
                            </div>
                            <PlayCircleIcon className="w-6 h-6 text-white opacity-80" />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-center opacity-80">
                        <p className="text-lg font-bold">Tudo em ordem!</p>
                        <p className="text-sm text-indigo-100 mt-1">Nenhuma vitória rápida óbvia encontrada agora.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const NextReminderBanner: React.FC<{ reminder: Activity & { task: Task } | undefined, onSelectTask: (task: Task) => void }> = ({ reminder, onSelectTask }) => {
    
    if (!reminder) {
        return (
            <div className="flex flex-col justify-center h-full w-full pl-4 md:pl-6 border-l border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <BellIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">Sem lembretes</span>
                        <span className="text-xs">Você está livre por enquanto.</span>
                    </div>
                </div>
            </div>
        );
    }

    const reminderDate = new Date(reminder.notifyAt!);
    const isToday = reminderDate.toDateString() === new Date().toDateString();
    const timeStr = reminderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dayStr = isToday ? 'Hoje' : reminderDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    return (
        <div 
            className="flex flex-col justify-center h-full w-full pl-4 md:pl-6 border-l border-gray-200 dark:border-gray-700 cursor-pointer group"
            onClick={() => onSelectTask(reminder.task)}
        >
            <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <BellIcon className="w-4 h-4 text-primary-500" />
                    Próximo Lembrete
                </h4>
                <span className="text-xs font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                    {dayStr}, {timeStr}
                </span>
            </div>
            
            <div className="mt-1">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate block group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {reminder.task.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {reminder.note || "Ver detalhes da tarefa"}
                </span>
            </div>
        </div>
    );
};

const CompletionRing: React.FC<{ percentage: number; total: number; completed: number }> = ({ percentage, total, completed }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex items-center gap-6 h-full">
            <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        className="text-gray-200 dark:text-gray-700"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="50%"
                        cy="50%"
                    />
                    <circle
                        className="text-primary-500 transition-all duration-1000 ease-out"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="50%"
                        cy="50%"
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-primary-600 dark:text-primary-400">
                    <span className="text-xl font-bold">{Math.round(percentage)}%</span>
                </div>
            </div>
            <div className="flex flex-col justify-center gap-1">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Produtividade</h4>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {completed} <span className="text-gray-400 text-lg font-normal">/ {total}</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Tarefas concluídas</p>
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{
    title: string;
    tasks: Task[];
    categories: Category[];
    tags: Tag[];
    isOverdueColumn?: boolean;
    onSelectTask: (task: Task) => void;
    disableOverdueColor?: boolean;
}> = ({ title, tasks, categories, tags, onSelectTask, isOverdueColumn = false, disableOverdueColor }) => {
    
    const getCategory = (id: string) => categories.find(c => c.id === id);
    const getTag = (id: string) => tags.find(t => t.id === id);

    return (
        <div className="rounded-xl flex flex-col border border-gray-200 dark:border-gray-800 px-2 min-h-0 flex-1 h-full">
            <h3 className="flex items-center gap-3 font-semibold text-lg p-4 pb-2 text-gray-800 dark:text-gray-200 flex-shrink-0">
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[title as Status]}`}></span>
                {title} <span className="text-sm font-normal text-gray-500">({tasks.length})</span>
            </h3>
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-3 custom-scrollbar">
                 {tasks.length > 0 ? (
                    tasks.map(task => (
                        <TaskCard 
                            key={task.id} 
                            task={task}
                            variant="compact"
                            category={getCategory(task.categoryId)}
                            tag={getTag(task.tagId)}
                            onSelect={onSelectTask}
                            isOverdue={isOverdueColumn || (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Concluída')}
                            disableOverdueColor={disableOverdueColor}
                        />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full min-h-[100px]">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma tarefa.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const CompactStatCard: React.FC<{ 
    label: string; 
    value: number; 
    icon: React.FC<{className?: string}>; 
    colorClass: string; 
    bgClass: string; 
    trend?: number; 
}> = ({ label, value, icon: Icon, colorClass, bgClass, trend }) => (
    <div className={`p-4 rounded-xl border border-transparent ${bgClass} flex items-center justify-between transition-all hover:scale-[1.02]`}>
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{value}</span>
                {trend !== undefined && trend !== 0 && (
                    <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {trend > 0 ? <ArrowTrendingUpIcon className="w-3 h-3 mr-0.5"/> : <ArrowTrendingDownIcon className="w-3 h-3 mr-0.5"/>}
                        {Math.abs(trend)}
                    </span>
                )}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-70 text-gray-600 dark:text-gray-300">{label}</span>
        </div>
        <div className={`p-3 rounded-lg ${colorClass} bg-white/50 dark:bg-black/20`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const DateSummaryBanner: React.FC<{ dueTodayCount: number; overdueCount: number; totalPendingCount: number }> = ({ dueTodayCount, overdueCount, totalPendingCount }) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });

    const getMessage = () => {
        if (overdueCount > 0) {
            return (
                <>
                    <span className="text-red-500 font-bold">Atenção!</span> Você tem <span className="text-red-600 dark:text-red-400 font-bold">{overdueCount} {overdueCount === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}</span>.
                </>
            );
        }
        if (dueTodayCount > 0) {
            return (
                <>
                    <span className="capitalize">{weekday}</span>. Você tem <span className="text-primary-600 dark:text-primary-400 font-bold">{dueTodayCount} {dueTodayCount === 1 ? 'tarefa' : 'tarefas'}</span> vencendo hoje.
                </>
            );
        }
        if (totalPendingCount > 0) {
            return (
                <>
                    <span className="capitalize">{weekday}</span> tranquilo! Nada vence hoje, mas você tem <span className="text-gray-700 dark:text-gray-300 font-bold">{totalPendingCount}</span> pendências gerais.
                </>
            );
        }
        
        const funMessages = [
            "Tudo limpo! Aproveite o merecido descanso. ☕",
            "Você zerou suas tarefas! Hora de celebrar. 🎉",
            "Produtividade nota 1000! Nada pendente. 🚀",
            "Agenda livre! O que vamos aprender hoje? 📚",
            "Modo Zen ativado. Nenhuma tarefa à vista. 🧘"
        ];
        const index = Math.floor(now.getMinutes() / 10) % funMessages.length; 
        return <>{funMessages[index]}</>;
    };

    return (
        <div className="flex flex-col justify-center h-full px-2">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-tight capitalize">
                {dateStr}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
                {getMessage()}
            </p>
        </div>
    );
};

const AttentionFilterButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            active
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
    >
        {children}
    </button>
);

// --- MAIN VIEW COMPONENT ---

interface DashboardViewProps {
  tasks: Task[];
  categories: Category[];
  tags: Tag[];
  onSelectTask: (task: Task) => void;
  habits: (Habit & { isCompleted: boolean })[];
  onToggleHabit: (habitId: string) => void;
  appSettings?: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  isDemoMode?: boolean; // New Prop
}

const DashboardView: React.FC<DashboardViewProps> = ({ tasks, categories, tags, onSelectTask, habits, onToggleHabit, appSettings, setAppSettings, isDemoMode = false }) => {
  const [overviewViewMode, setOverviewViewMode] = useState<'status' | 'deadline'>('status');
  const [attentionFilter, setAttentionFilter] = useState<'all' | 'overdue' | 'today' | 'tomorrow'>('all');
  
  // AI Suggestion State with Persistence
  const [aiSuggestionData, setAiSuggestionData] = useLocalStorage<{suggestions: SuggestionItem[] | null, timestamp: number}>('dashboard_ai_suggestions_v2', { suggestions: null, timestamp: 0 });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);

  const { pendingTasks, inProgressTasks, completedTasks, overdueTasks, dueTodayTasks, dueTomorrowTasks, totalTasks, nextReminder } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const nonCompletedTasks = tasks.filter(t => t.status !== 'Concluída');
    const overdueAndNotCompleted = nonCompletedTasks.filter(t => t.dueDate && new Date(t.dueDate) < startOfToday);

    // Find Next Reminder
    const allReminders = tasks.flatMap(task => 
        task.activity
            .filter((act): act is Activity & { type: 'reminder', notifyAt: string } => act.type === 'reminder' && !!act.notifyAt)
            .map(reminderActivity => ({ ...reminderActivity, task }))
    ).sort((a, b) => new Date(a.notifyAt).getTime() - new Date(b.notifyAt).getTime());
    
    const nextReminder = allReminders.find(r => new Date(r.notifyAt) >= new Date());

    return {
      pendingTasks: tasks.filter(t => t.status === 'Pendente').sort(taskSortFunction),
      inProgressTasks: tasks.filter(t => t.status === 'Em andamento').sort(taskSortFunction),
      completedTasks: tasks.filter(t => t.status === 'Concluída').sort(taskSortFunction),
      overdueTasks: overdueAndNotCompleted.sort(taskSortFunction),
      dueTodayTasks: nonCompletedTasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === todayStr).sort(taskSortFunction),
      dueTomorrowTasks: nonCompletedTasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === tomorrowStr).sort(taskSortFunction),
      totalTasks: tasks.length,
      nextReminder
    };
  }, [tasks, tags]);

  const stats = useMemo(() => ({
    pending: pendingTasks.length,
    inProgress: inProgressTasks.length,
    completed: completedTasks.length,
    overdue: overdueTasks.length,
  }), [pendingTasks, inProgressTasks, completedTasks, overdueTasks]);

  const completionRate = totalTasks > 0 ? (stats.completed / totalTasks) * 100 : 0;

  const getCategory = (id: string) => categories.find(c => c.id === id);
  const getTag = (id: string) => tags.find(t => t.id === id);
  
  const generateAiSuggestion = useCallback(async (force = false) => {
        // If AI is disabled or in DEMO mode, do not fetch
        if (!appSettings?.enableAi || isDemoMode) return;

        // Cache Check: 4 hours = 4 * 60 * 60 * 1000 milliseconds
        if (!force && aiSuggestionData.suggestions && (Date.now() - aiSuggestionData.timestamp < 4 * 60 * 60 * 1000)) {
            // Validate if cached task still exists and is not completed
            const cachedSuggestion = aiSuggestionData.suggestions[0];
            const cachedTask = tasks.find(t => t.id === cachedSuggestion?.taskId);
            if (cachedTask && cachedTask.status !== 'Concluída') {
                return; // Valid cache, do nothing
            }
        }

        const candidateTasks = tasks.filter(t => (t.status === 'Pendente' || t.status === 'Em andamento') || (t.dueDate && new Date(t.dueDate) < new Date()));
        
        if (candidateTasks.length === 0) {
            setAiSuggestionData({ suggestions: null, timestamp: Date.now() });
            return;
        }

        setIsAiLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Limit payload to save tokens
            const tasksPayload = candidateTasks.slice(0, 25).map(t => ({
                id: t.id,
                title: t.title,
                description: t.description || "",
                status: t.status,
                dueDate: t.dueDate,
                isOverdue: t.dueDate ? new Date(t.dueDate) < new Date() : false,
                uncompletedSubtasks: t.subTasks.filter(s => !s.completed).map(s => s.text)
            }));

            const prompt = `
                Act as a productivity coach. Analyze the tasks to find the top 3 best "Quick Wins".
                
                A Quick Win is a task that appears VERY fast/easy to complete (e.g., "call", "email", "buy", "check") OR is nearly finished.
                
                PRIORITIZE:
                1. OVERDUE tasks that are Quick Wins.
                2. If no quick overdue tasks, look for Quick Wins in Pending/In Progress.
                
                Tasks: ${JSON.stringify(tasksPayload)}

                Return ONLY a JSON object with this structure (no markdown):
                {
                    "suggestions": [
                        {
                            "taskId": "string (id of the selected task)",
                            "reason": "string (short reason why, max 10 words, in Portuguese)",
                            "action": "string (encouraging imperative action phrase, max 8 words, in Portuguese)"
                        }
                    ]
                }
            `;

            const response = await ai.models.generateContent({ 
                model: 'gemini-2.5-flash', 
                contents: prompt,
                config: {
                    responseMimeType: "application/json"
                }
            });
            
            const resultText = response.text;
            if (resultText) {
                const parsed = JSON.parse(resultText);
                setAiSuggestionData({
                    suggestions: parsed.suggestions || [],
                    timestamp: Date.now()
                });
                setCurrentSuggestionIndex(0); // Reset index on new fetch
            }
        } catch (error) {
            console.error("AI Suggestion failed:", error);
            // Fallback logic
            const fallbackTask = candidateTasks.find(t => t.status === 'Em andamento') || candidateTasks[0];
            if (fallbackTask) {
                setAiSuggestionData({
                    suggestions: [{
                        taskId: fallbackTask.id,
                        reason: "Sugerido automaticamente",
                        action: "Vamos retomar esta tarefa?"
                    }],
                    timestamp: Date.now()
                });
            }
        } finally {
            setIsAiLoading(false);
        }
  }, [tasks, aiSuggestionData, appSettings?.enableAi, isDemoMode]);

  useEffect(() => {
      // Trigger logic on mount. The logic inside generateAiSuggestion handles cache checking.
      if (tasks.length > 0) {
          generateAiSuggestion();
      }
  }, [appSettings?.enableAi, isDemoMode]); 

  const currentSuggestionTask = useMemo(() => {
      if (isDemoMode) {
          // Hardcoded suggestion for demo
          const demoTaskId = tasks.find(t => t.title.includes("Escrever redação"))?.id || tasks[0]?.id;
          return tasks.find(t => t.id === demoTaskId);
      }
      
      if (!aiSuggestionData.suggestions || aiSuggestionData.suggestions.length === 0) return undefined;
      const sugg = aiSuggestionData.suggestions[currentSuggestionIndex];
      return sugg ? tasks.find(t => t.id === sugg.taskId) : undefined;
  }, [aiSuggestionData, tasks, currentSuggestionIndex, isDemoMode]);

  const demoSuggestions = useMemo(() => isDemoMode ? [{
      taskId: currentSuggestionTask?.id || "",
      reason: "Foco Total",
      action: "Finalizar Redação"
  }] : [], [isDemoMode, currentSuggestionTask]);

  const renderAttentionSection = (title: string, taskList: Task[], isOverdue = false) => (
      <div>
        <h4 className="font-semibold text-gray-500 dark:text-gray-400 text-sm mb-2 px-1">{title} <span className="font-normal">({taskList.length})</span></h4>
        <div className="space-y-2">
            {taskList.map(task => (
                <TaskCard
                    key={task.id}
                    task={task}
                    variant="list-item"
                    category={getCategory(task.categoryId)}
                    tag={getTag(task.tagId)}
                    onSelect={onSelectTask}
                    isOverdue={isOverdue}
                    disableOverdueColor={appSettings?.disableOverdueColor}
                />
            ))}
        </div>
      </div>
  );

  return (
    <div className="p-4 flex flex-col w-full h-full gap-6 overflow-y-auto xl:overflow-hidden custom-scrollbar">
        {/* Top Stats Section */}
        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 flex-shrink-0">
            <section className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                <div className="lg:col-span-2 flex items-center justify-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                    <CompletionRing percentage={completionRate} total={totalTasks} completed={stats.completed} />
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between h-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <CompactStatCard label="Pendentes" value={stats.pending} icon={StopCircleIcon} colorClass="text-blue-500" bgClass="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800" trend={2} />
                         <CompactStatCard label="Em Andamento" value={stats.inProgress} icon={PlayCircleIcon} colorClass="text-yellow-500" bgClass="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/30" trend={-1} />
                         <CompactStatCard label="Concluídas" value={stats.completed} icon={CheckCircleIcon} colorClass="text-green-500" bgClass="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30" trend={5} />
                         <CompactStatCard label="Atrasadas" value={stats.overdue} icon={ClockIcon} colorClass="text-red-500" bgClass="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30" trend={0} />
                    </div>
                    <div className="w-full h-px bg-gray-100 dark:bg-gray-800 my-4"></div>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 w-full"><DateSummaryBanner dueTodayCount={dueTodayTasks.length} overdueCount={overdueTasks.length} totalPendingCount={pendingTasks.length + inProgressTasks.length} /></div>
                        {/* Divider removed as NextReminderBanner handles its own separation visually */}
                        <div className="flex-1 w-full"><NextReminderBanner reminder={nextReminder} onSelectTask={onSelectTask} /></div>
                    </div>
                </div>
            </section>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full flex-shrink-0 xl:flex-1 xl:min-h-0 xl:overflow-hidden">
            
            {/* Left Panel: Unified Tasks Overview (Col Span 2) */}
            <div className="xl:col-span-2 flex flex-col min-w-0 h-[600px] xl:h-full min-h-0 overflow-hidden">
                <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-hidden">
                    
                    {/* Panel Header with Toggle */}
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Visão Geral das Tarefas</h3>
                        <div className="flex items-center bg-gray-100 dark:bg-[#0D1117] p-1 rounded-lg">
                            <button
                                onClick={() => setOverviewViewMode('status')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                    overviewViewMode === 'status' 
                                    ? 'bg-white dark:bg-[#21262D] text-primary-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            >
                                <KanbanIcon className="w-4 h-4" />
                                Status
                            </button>
                            <button
                                onClick={() => setOverviewViewMode('deadline')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                    overviewViewMode === 'deadline' 
                                    ? 'bg-white dark:bg-[#21262D] text-primary-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            >
                                <CalendarDaysIcon className="w-4 h-4" />
                                Prazos
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-h-0 relative">
                        {overviewViewMode === 'status' ? (
                            <div className="flex flex-col md:flex-row gap-4 h-full overflow-y-hidden overflow-x-auto pb-2">
                                <KanbanColumn title="Pendente" tasks={pendingTasks} categories={categories} tags={tags} onSelectTask={onSelectTask} disableOverdueColor={appSettings?.disableOverdueColor} />
                                <KanbanColumn title="Em andamento" tasks={inProgressTasks} categories={categories} tags={tags} onSelectTask={onSelectTask} disableOverdueColor={appSettings?.disableOverdueColor} />
                                <KanbanColumn title="Concluída" tasks={completedTasks} categories={categories} tags={tags} onSelectTask={onSelectTask} disableOverdueColor={appSettings?.disableOverdueColor} />
                            </div>
                        ) : (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar flex-shrink-0">
                                    <AttentionFilterButton active={attentionFilter === 'all'} onClick={() => setAttentionFilter('all')}>Todas</AttentionFilterButton>
                                    <AttentionFilterButton active={attentionFilter === 'overdue'} onClick={() => setAttentionFilter('overdue')}>Atrasadas</AttentionFilterButton>
                                    <AttentionFilterButton active={attentionFilter === 'today'} onClick={() => setAttentionFilter('today')}>Hoje</AttentionFilterButton>
                                    <AttentionFilterButton active={attentionFilter === 'tomorrow'} onClick={() => setAttentionFilter('tomorrow')}>Amanhã</AttentionFilterButton>
                                </div>
                                <div className="space-y-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar px-2 pb-2">
                                    {(attentionFilter === 'all' || attentionFilter === 'overdue') && overdueTasks.length > 0 && renderAttentionSection('Atrasadas', overdueTasks, true)}
                                    {(attentionFilter === 'all' || attentionFilter === 'today') && dueTodayTasks.length > 0 && renderAttentionSection('Vencendo Hoje', dueTodayTasks)}
                                    {(attentionFilter === 'all' || attentionFilter === 'tomorrow') && dueTomorrowTasks.length > 0 && renderAttentionSection('Vencendo Amanhã', dueTomorrowTasks)}
                                    
                                    {overdueTasks.length === 0 && dueTodayTasks.length === 0 && dueTomorrowTasks.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                            <CalendarDaysIcon className="w-12 h-12 mb-2 opacity-20" />
                                            <p className="text-sm">Nenhuma tarefa urgente ou próxima.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel: Widgets (Col Span 1) */}
            <div className="flex flex-col gap-6 min-w-0 h-auto xl:h-full xl:min-h-0 xl:overflow-y-auto custom-scrollbar pr-2 pb-2">
                <div className="flex-1 flex flex-col min-h-[250px]">
                    <HabitWidget habits={habits} onToggle={onToggleHabit} />
                </div>

                <div className="flex-1 flex flex-col min-h-[250px]">
                    <AiQuickWinWidget 
                        isLoading={isAiLoading} 
                        suggestions={isDemoMode ? demoSuggestions : (aiSuggestionData.suggestions || [])} 
                        currentIndex={currentSuggestionIndex}
                        currentTask={currentSuggestionTask} 
                        onSelectTask={onSelectTask} 
                        onRefresh={() => generateAiSuggestion(true)}
                        onNext={() => setCurrentSuggestionIndex(prev => Math.min(prev + 1, (aiSuggestionData.suggestions?.length || 1) - 1))}
                        onPrev={() => setCurrentSuggestionIndex(prev => Math.max(prev - 1, 0))}
                        isAiEnabled={appSettings?.enableAi}
                        onEnableAi={() => setAppSettings(prev => ({ ...prev, enableAi: true }))}
                    />
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;
