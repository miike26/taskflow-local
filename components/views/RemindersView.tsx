import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Task, Category, Activity, AppSettings } from '../../types';
import { BellIcon, CalendarIcon, TrashIcon, ClockIcon, ExclamationTriangleIcon, CheckCircleIcon, CalendarDaysIcon } from '../icons';
import Calendar from '../Calendar';

interface RemindersViewProps {
  tasks: Task[];
  categories: Category[];
  onSelectTask: (task: Task) => void;
  onDeleteReminderRequest: (taskId: string, reminderId: string) => void;
  appSettings?: AppSettings;
}

// Helper to calculate grouping dates
const getGroup = (date: Date) => {
    const now = new Date();
    
    // Normalize "now" to start of day for date comparisons
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    
    const nextWeekStart = new Date(todayStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    // Normalize target date to start of day
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // 1. Overdue: Strictly if the full timestamp is in the past
    if (date.getTime() < now.getTime()) return 'overdue';
    
    // 2. Today: If the date matches today (and hasn't passed "now" due to check #1)
    if (checkDate.getTime() === todayStart.getTime()) return 'today';
    
    // 3. Tomorrow
    if (checkDate.getTime() === tomorrowStart.getTime()) return 'tomorrow';
    
    // 4. Next 7 Days (excluding today and tomorrow)
    if (checkDate.getTime() < nextWeekStart.getTime()) return 'week';
    
    // 5. Future
    return 'future';
};

const ReminderCard: React.FC<{
    reminder: Activity & { task: Task; category?: Category };
    onSelectTask: (task: Task) => void;
    onDelete: () => void;
    variant?: 'default' | 'highlight';
    disableOverdueColor?: boolean;
    timeFormat?: '12h' | '24h';
}> = ({ reminder, onSelectTask, onDelete, variant = 'default', disableOverdueColor, timeFormat = '24h' }) => {
    const { task, category } = reminder;
    const CategoryIcon = category?.icon || BellIcon;
    const reminderDate = new Date(reminder.notifyAt!);
    const isOverdue = reminderDate < new Date();
    const applyOverdueStyle = isOverdue && !disableOverdueColor;

    const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: timeFormat === '12h' ? 'numeric' : '2-digit', 
        minute: '2-digit', 
        hour12: timeFormat === '12h' 
    };
    const formattedTime = reminderDate.toLocaleTimeString('pt-BR', timeOptions);

    if (variant === 'highlight') {
        return (
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BellIcon className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <ClockIcon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Próximo Lembrete</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                        {formattedTime}
                    </div>
                    <div className="text-primary-100 text-sm mb-4 font-medium">
                        {reminderDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors" onClick={() => onSelectTask(task)}>
                        <h4 className="font-bold text-lg truncate">{task.title}</h4>
                        <p className="text-primary-100 text-sm truncate opacity-90">{reminder.note || "Sem nota"}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`group relative bg-white dark:bg-[#161B22] p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${applyOverdueStyle ? 'border-red-200 dark:border-red-900/30' : 'border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700'}`}>
            <div className="flex items-start gap-4">
                {/* Date Box */}
                <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl flex-shrink-0 border ${applyOverdueStyle ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    <span className="text-lg font-bold leading-none">{reminderDate.getDate()}</span>
                    <span className="text-[10px] font-bold uppercase mt-0.5">{reminderDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                </div>

                <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className={`text-xs font-bold mb-0.5 flex items-center gap-1 ${applyOverdueStyle ? 'text-red-500' : 'text-primary-600 dark:text-primary-400'}`}>
                                <ClockIcon className="w-3 h-3" />
                                {formattedTime}
                                {isOverdue && <span className="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 rounded text-[9px] uppercase tracking-wide">Atrasado</span>}
                            </span>
                            <h4 
                                className="font-semibold text-gray-800 dark:text-gray-200 truncate cursor-pointer hover:text-primary-500 transition-colors"
                                onClick={() => onSelectTask(task)}
                            >
                                {task.title}
                            </h4>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {reminder.note || "Lembrete personalizado"}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-3">
                        {category && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                                <CategoryIcon className="w-3.5 h-3.5" />
                                <span>{category.name}</span>
                            </div>
                        )}
                        {task.status === 'Concluída' && (
                            <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded">Concluída</span>
                        )}
                    </div>
                </div>

                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Excluir lembrete"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const ReminderGroup: React.FC<{ title: string; count: number; icon: React.ReactNode; colorClass: string; children: React.ReactNode }> = ({ title, count, icon, colorClass, children }) => {
    if (count === 0) return null;
    return (
        <div className="space-y-3 mb-8">
            <h3 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${colorClass}`}>
                {icon}
                {title}
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs ml-auto">
                    {count}
                </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: number; icon: React.FC<{className?: string}>; bgClass: string; textClass: string }> = ({ label, value, icon: Icon, bgClass, textClass }) => (
    <div className={`flex items-center gap-4 p-4 rounded-xl border border-transparent ${bgClass}`}>
        <div className={`p-3 rounded-lg bg-white/50 dark:bg-black/20 ${textClass}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70 text-gray-600 dark:text-gray-300">{label}</p>
        </div>
    </div>
);

const RemindersView: React.FC<RemindersViewProps> = ({ tasks, categories, onSelectTask, onDeleteReminderRequest, appSettings }) => {
    
    const { activeReminders, nextReminder, stats, groupedReminders } = useMemo(() => {
        const now = new Date();
        const all = tasks.flatMap(task => 
            task.activity
                .filter((act): act is Activity & { type: 'reminder', notifyAt: string } => act.type === 'reminder' && !!act.notifyAt)
                .map(reminderActivity => ({ 
                    ...reminderActivity,
                    task, 
                    category: categories.find(c => c.id === task.categoryId) 
                }))
        ).sort((a, b) => new Date(a.notifyAt).getTime() - new Date(b.notifyAt).getTime());

        // SHOW ALL REMINDERS regardless of task status. 
        // Previously we filtered out completed tasks, but reminders might be relevant even if the task is done.
        const active = all; 
        
        const next = active.length > 0 ? active.filter(r => new Date(r.notifyAt) >= now)[0] : null;

        const groups = {
            overdue: [] as typeof active,
            today: [] as typeof active,
            tomorrow: [] as typeof active,
            week: [] as typeof active,
            future: [] as typeof active,
        };

        active.forEach(r => {
            const groupKey = getGroup(new Date(r.notifyAt));
            if (groups[groupKey]) {
                groups[groupKey].push(r);
            } else {
                // Fallback for edge cases
                groups['future'].push(r);
            }
        });

        return { 
            activeReminders: active, 
            nextReminder: next,
            stats: {
                total: active.length,
                overdue: groups.overdue.length,
                today: groups.today.length
            },
            groupedReminders: groups
        };

    }, [tasks, categories]);

    return (
        <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
            <header className="mb-6 flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Meus Lembretes
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Gerencie seus alertas e notificações agendadas.
                </p>
            </header>

            {activeReminders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-[#161B22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm border-dashed">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-full mb-4">
                        <BellIcon className="w-12 h-12 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Tudo Silencioso</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                        Você não tem lembretes ativos no momento. Adicione um lembrete dentro dos detalhes de uma tarefa.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
                    
                    {/* Left Panel: Stats & Highlights */}
                    <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-4">
                        {/* Next Reminder Highlight */}
                        {nextReminder && (
                            <ReminderCard 
                                reminder={nextReminder} 
                                onSelectTask={onSelectTask} 
                                onDelete={() => onDeleteReminderRequest(nextReminder.task.id, nextReminder.id)}
                                variant="highlight" 
                                timeFormat={appSettings?.timeFormat}
                            />
                        )}

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 gap-3">
                            <StatCard 
                                label="Total Ativos" 
                                value={stats.total} 
                                icon={BellIcon} 
                                bgClass="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800"
                                textClass="text-blue-600 dark:text-blue-400"
                            />
                            <StatCard 
                                label="Para Hoje" 
                                value={stats.today} 
                                icon={CalendarIcon} 
                                bgClass="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
                                textClass="text-emerald-600 dark:text-emerald-400"
                            />
                            {stats.overdue > 0 && (
                                <StatCard 
                                    label="Atrasados" 
                                    value={stats.overdue} 
                                    icon={ExclamationTriangleIcon} 
                                    bgClass="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 animate-pulse-glow"
                                    textClass="text-red-600 dark:text-red-400"
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Panel: The List */}
                    <div className="flex-1 bg-white dark:bg-[#161B22] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            
                            <ReminderGroup 
                                title="Atrasados" 
                                count={groupedReminders.overdue.length} 
                                icon={<ExclamationTriangleIcon className="w-4 h-4"/>} 
                                colorClass="text-red-500"
                            >
                                {groupedReminders.overdue.map(r => (
                                    <ReminderCard key={r.id} reminder={r} onSelectTask={onSelectTask} onDelete={() => onDeleteReminderRequest(r.task.id, r.id)} disableOverdueColor={appSettings?.disableOverdueColor} timeFormat={appSettings?.timeFormat} />
                                ))}
                            </ReminderGroup>

                            <ReminderGroup 
                                title="Hoje" 
                                count={groupedReminders.today.length} 
                                icon={<CheckCircleIcon className="w-4 h-4"/>} 
                                colorClass="text-emerald-500"
                            >
                                {groupedReminders.today.map(r => (
                                    <ReminderCard key={r.id} reminder={r} onSelectTask={onSelectTask} onDelete={() => onDeleteReminderRequest(r.task.id, r.id)} disableOverdueColor={appSettings?.disableOverdueColor} timeFormat={appSettings?.timeFormat} />
                                ))}
                            </ReminderGroup>

                            <ReminderGroup 
                                title="Amanhã" 
                                count={groupedReminders.tomorrow.length} 
                                icon={<CalendarIcon className="w-4 h-4"/>} 
                                colorClass="text-blue-500"
                            >
                                {groupedReminders.tomorrow.map(r => (
                                    <ReminderCard key={r.id} reminder={r} onSelectTask={onSelectTask} onDelete={() => onDeleteReminderRequest(r.task.id, r.id)} disableOverdueColor={appSettings?.disableOverdueColor} timeFormat={appSettings?.timeFormat} />
                                ))}
                            </ReminderGroup>

                            <ReminderGroup 
                                title="Próximos 7 Dias" 
                                count={groupedReminders.week.length} 
                                icon={<CalendarIcon className="w-4 h-4"/>} 
                                colorClass="text-purple-500"
                            >
                                {groupedReminders.week.map(r => (
                                    <ReminderCard key={r.id} reminder={r} onSelectTask={onSelectTask} onDelete={() => onDeleteReminderRequest(r.task.id, r.id)} disableOverdueColor={appSettings?.disableOverdueColor} timeFormat={appSettings?.timeFormat} />
                                ))}
                            </ReminderGroup>

                            <ReminderGroup 
                                title="Futuro" 
                                count={groupedReminders.future.length} 
                                icon={<ClockIcon className="w-4 h-4"/>} 
                                colorClass="text-gray-500"
                            >
                                {groupedReminders.future.map(r => (
                                    <ReminderCard key={r.id} reminder={r} onSelectTask={onSelectTask} onDelete={() => onDeleteReminderRequest(r.task.id, r.id)} disableOverdueColor={appSettings?.disableOverdueColor} timeFormat={appSettings?.timeFormat} />
                                ))}
                            </ReminderGroup>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemindersView;