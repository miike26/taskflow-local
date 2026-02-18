import React, { useMemo } from 'react';
import type { Task, Category, Activity, AppSettings, Tag } from '../../types';
import { 
    BellIcon, CalendarIcon, TrashIcon, ClockIcon, 
    ExclamationTriangleIcon, CheckCircleIcon, CalendarDaysIcon, 
    ChevronRightIcon,
    // 👇 Novos ícones importados para as categorias
    BriefcaseIcon, UserCircleIcon, ListIcon, FolderIcon
} from '../icons';

interface RemindersViewProps {
    tasks: Task[];
    categories: Category[];
    tags: Tag[];
    onSelectTask: (task: Task) => void;
    onDeleteReminderRequest: (taskId: string, reminderId: string) => void;
    appSettings?: AppSettings;
}

// --- HELPER: Recupera ícones de categorias (Igual ao TaskDetail e Header) ---
const getCategoryIcon = (category?: Category) => {
    if (!category) return FolderIcon; // Ícone padrão se não tiver categoria (ou pode ser BellIcon se preferir)
    if (category.icon) return category.icon;

    // Mapeamento manual
    switch (category.id) {
        case 'cat-1': return BriefcaseIcon;      // Trabalho
        case 'cat-2': return UserCircleIcon;     // Pessoal
        case 'cat-3': return ListIcon;           // Estudo / Lista
        default: return FolderIcon;              // Personalizadas
    }
};

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

const ReminderItem: React.FC<{
    reminder: Activity & { task: Task; category?: Category; tag?: Tag };
    onSelectTask: (task: Task) => void;
    onDelete: () => void;
    disableOverdueColor?: boolean;
    timeFormat?: '12h' | '24h';
}> = ({ reminder, onSelectTask, onDelete, disableOverdueColor, timeFormat = '24h' }) => {
    const { task, category, tag } = reminder;
    
    // 👇 AQUI A MUDANÇA: Usa a função helper para pegar o ícone correto
    const CategoryIcon = getCategoryIcon(category);
    
    const reminderDate = new Date(reminder.notifyAt!);
    const isOverdue = reminderDate < new Date();
    
    const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: timeFormat === '12h' ? 'numeric' : '2-digit', 
        minute: '2-digit', 
        hour12: timeFormat === '12h' 
    };
    const formattedTime = reminderDate.toLocaleTimeString('pt-BR', timeOptions);
    const formattedDate = reminderDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    return (
        <div 
            onClick={() => onSelectTask(task)}
            className={`group relative flex items-center gap-4 bg-white dark:bg-[#161B22] p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden
            ${isOverdue && !disableOverdueColor ? 'border-l-4 border-l-red-500' : 'hover:border-primary-300 dark:hover:border-primary-700'}`}
        >
            {/* Time Column */}
            <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-gray-100 dark:border-gray-700 pr-4 py-1">
                <span className={`text-lg font-bold ${isOverdue ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                    {formattedTime}
                </span>
                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                    {formattedDate}
                </span>
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-base text-gray-900 dark:text-white truncate leading-snug" title={task.title}>
                        {task.title}
                    </h4>
                    {tag && (
                        <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${tag.bgColor} ${tag.color}`}>
                            {tag.name === 'Normal' ? 'Média' : tag.name}
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <div className="text-gray-400 dark:text-gray-500 flex-shrink-0" title={category?.name}>
                        {/* Renderiza o ícone da categoria aqui */}
                        <CategoryIcon className="w-3.5 h-3.5" />
                    </div>
                    <p className="line-clamp-1 break-words">
                        {reminder.note || "Sem anotação extra"}
                    </p>
                </div>
            </div>

            {/* Action Column */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Excluir Lembrete"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
                <div className="text-gray-300 dark:text-gray-600">
                    <ChevronRightIcon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};

const StatRow: React.FC<{ label: string; count: number; colorClass: string; icon: React.ReactNode }> = ({ label, count, colorClass, icon }) => (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-default">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white dark:bg-black/20 shadow-sm ${colorClass}`}>
                {icon}
            </div>
            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{label}</span>
        </div>
        <span className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-md text-xs group-hover:scale-110 transition-transform">
            {count}
        </span>
    </div>
);

const NextReminderSpotlight: React.FC<{
    reminder: Activity & { task: Task; category?: Category };
    onSelectTask: (task: Task) => void;
    timeFormat?: '12h' | '24h';
}> = ({ reminder, onSelectTask, timeFormat = '24h' }) => {
    const { task } = reminder;
    const reminderDate = new Date(reminder.notifyAt!);
    
    const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: timeFormat === '12h' ? 'numeric' : '2-digit', 
        minute: '2-digit', 
        hour12: timeFormat === '12h' 
    };
    const formattedTime = reminderDate.toLocaleTimeString('pt-BR', timeOptions);

    return (
        <div className="w-full bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group mb-6">
            {/* 👇 MUDANÇA AQUI: Adicionei as classes de animação no sino de fundo */}
            <div className="absolute top-0 right-0 p-4 opacity-10 transform transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-12 group-hover:opacity-20 origin-top-right">
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
                <div className="text-primary-100 text-sm mb-4 font-medium capitalize">
                    {reminderDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                
                <div 
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors" 
                    onClick={() => onSelectTask(task)}
                >
                    <h4 className="font-bold text-lg truncate">{task.title}</h4>
                    <p className="text-primary-100 text-sm truncate opacity-90">{reminder.note || "Sem nota"}</p>
                </div>
            </div>
        </div>
    );
};

const RemindersView: React.FC<RemindersViewProps> = ({ tasks = [], categories = [], tags = [], onSelectTask, onDeleteReminderRequest, appSettings }) => {
    
    const { activeReminders, nextReminder, groupedReminders, counts } = useMemo(() => {
        const now = new Date();
        const all = tasks.flatMap(task => 
            task.activity
                .filter((act): act is Activity & { type: 'reminder', notifyAt: string } => act.type === 'reminder' && !!act.notifyAt)
                .map(reminderActivity => ({ 
                    ...reminderActivity,
                    task, 
                    category: categories.find(c => c.id === task.categoryId),
                    tag: tags.find(t => t.id === task.tagId)
                }))
        ).sort((a, b) => new Date(a.notifyAt).getTime() - new Date(b.notifyAt).getTime());

        const next = all.length > 0 ? all.filter(r => new Date(r.notifyAt) >= now)[0] : null;

        const groups = {
            overdue: [] as typeof all,
            today: [] as typeof all,
            tomorrow: [] as typeof all,
            week: [] as typeof all,
            future: [] as typeof all,
        };

        all.forEach(r => {
            const groupKey = getGroup(new Date(r.notifyAt));
            if (groups[groupKey]) {
                groups[groupKey].push(r);
            } else {
                groups['future'].push(r);
            }
        });

        const counts = {
            total: all.length,
            overdue: groups.overdue.length,
            today: groups.today.length,
            upcoming: groups.tomorrow.length + groups.week.length + groups.future.length
        };

        return { 
            activeReminders: all, 
            nextReminder: next,
            groupedReminders: groups,
            counts
        };

    }, [tasks, categories, tags]);

    const renderGroup = (title: string, list: typeof activeReminders, icon: React.ReactNode, textColor: string) => {
        if (list.length === 0) return null;
        return (
            <div className="mb-8 last:mb-0 animate-slide-up-fade-in">
                <div className={`flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800 ${textColor}`}>
                    {icon}
                    <h3 className="text-lg font-bold">{title}</h3>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full font-bold ml-auto">{list.length}</span>
                </div>
                <div className="space-y-3">
                    {list.map(reminder => (
                        <ReminderItem
                            key={reminder.id}
                            reminder={reminder}
                            onSelectTask={onSelectTask}
                            onDelete={() => onDeleteReminderRequest(reminder.task.id, reminder.id)}
                            disableOverdueColor={appSettings?.disableOverdueColor}
                            timeFormat={appSettings?.timeFormat}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full p-4 lg:p-6 gap-6 relative">
            
            {/* --- LEFT PANEL: Summary & Next Reminder (Detached Card) --- */}
            <div className="w-full lg:w-96 flex-shrink-0 bg-white dark:bg-[#161B22] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden h-auto lg:h-full">
                <div className="overflow-y-auto custom-scrollbar h-full p-6 lg:p-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Meus Lembretes</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie seus alertas e prazos.</p>
                    </div>

                    {nextReminder ? (
                        <NextReminderSpotlight 
                            reminder={nextReminder} 
                            onSelectTask={onSelectTask}
                            timeFormat={appSettings?.timeFormat}
                        />
                    ) : (
                        <div className="mb-8 p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                            <BellIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nenhum lembrete pendente.</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">Visão Geral</h3>
                        <StatRow 
                            label="Atrasados" 
                            count={counts.overdue} 
                            colorClass="text-red-500" 
                            icon={<ExclamationTriangleIcon className="w-5 h-5"/>} 
                        />
                        <StatRow 
                            label="Hoje" 
                            count={counts.today} 
                            colorClass="text-emerald-500" 
                            icon={<CheckCircleIcon className="w-5 h-5"/>} 
                        />
                        <StatRow 
                            label="Futuros" 
                            count={counts.upcoming} 
                            colorClass="text-blue-500" 
                            icon={<CalendarDaysIcon className="w-5 h-5"/>} 
                        />
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL: Scrollable Feed --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 rounded-2xl">
                <div className="max-w-4xl mx-auto pb-6">
                    {activeReminders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center opacity-50">
                            <BellIcon className="w-20 h-20 text-gray-300 dark:text-gray-700 mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Tudo Silencioso</h3>
                            <p className="text-gray-500">Você não tem lembretes configurados no momento.</p>
                        </div>
                    ) : (
                        <>
                            {renderGroup('Atrasados', groupedReminders.overdue, <ExclamationTriangleIcon className="w-5 h-5"/>, 'text-red-500')}
                            {renderGroup('Hoje', groupedReminders.today, <CheckCircleIcon className="w-5 h-5"/>, 'text-emerald-500')}
                            {renderGroup('Amanhã', groupedReminders.tomorrow, <CalendarIcon className="w-5 h-5"/>, 'text-blue-500')}
                            {renderGroup('Próximos 7 Dias', groupedReminders.week, <CalendarDaysIcon className="w-5 h-5"/>, 'text-purple-500')}
                            {renderGroup('Futuro', groupedReminders.future, <ClockIcon className="w-5 h-5"/>, 'text-gray-500')}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RemindersView;