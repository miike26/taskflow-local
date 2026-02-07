import { useEffect, useRef } from 'react';
import type { Task, Habit, NotificationSettings } from '../types';
import { CHANGELOG_DATA } from '../constants/changelog';

// Helper para verificar se duas datas estão no mesmo minuto (para alarmes exatos)
const isSameMinute = (date1: Date, date2: Date) => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate() &&
        date1.getHours() === date2.getHours() &&
        date1.getMinutes() === date2.getMinutes()
    );
};

// Helper para zerar as horas e comparar apenas as datas (DIA)
const isSameDay = (date1: Date, date2: Date) => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};

export const useLocalNotifications = (
    tasks: Task[],
    habits: Habit[],
    settings: NotificationSettings
) => {
    // Armazena IDs já disparados para evitar repetição (Resetar diariamente seria ideal, mas em SPA isso reinicia no refresh)
    const notifiedRef = useRef<Set<string>>(new Set());


    useEffect(() => {
        if (!settings.enabled || !settings.desktopNotifications) return;

        const checkNotifications = () => {
            if (Notification.permission !== 'granted') return;

            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];


            // =========================================================================
            // 0. CHANGELOG / NOVIDADES (Push de Sistema)
            // =========================================================================
            if (settings.marketingEmails && CHANGELOG_DATA.length > 0) {
                const latestVersion = CHANGELOG_DATA[0];
                const key = `push-changelog-${latestVersion.version}`;

                // Verifica se já notificou essa versão específica nesta sessão
                if (!notifiedRef.current.has(key)) {
                    // Opcional: Só envia push se o usuário ainda não viu essa versão nas configs
                    // (Você pode passar essa prop se quiser ser muito estrito, mas enviar 1 vez é seguro)
                    
                    new Notification(`✨ Novidades da Versão ${latestVersion.version}`, {
                        body: latestVersion.title,
                        icon: '/favicon.ico',
                        tag: key
                    });
                    
                    // Não chamamos triggerSound() aqui pq o App.tsx já vai cuidar do som com o Toast
                    notifiedRef.current.add(key);
                }
            }

            // =========================================================================
            // 1. RESUMO MATINAL (Agrupado) - Horário dinâmico
            // =========================================================================
            const [summaryHour, summaryMinute] = settings.dailySummaryTime 
                ? settings.dailySummaryTime.split(':').map(Number) 
                : [9, 0]; // Fallback para 09:00 se der erro

            if (settings.taskReminders && now.getHours() === summaryHour && now.getMinutes() === summaryMinute) {
                
                // A. Agrupar Tarefas que vencem HOJE
                const tasksDueToday = tasks.filter(t => 
                    t.status !== 'Concluída' && 
                    t.dueDate && 
                    isSameDay(now, new Date(t.dueDate))
                );

                const groupKeyToday = `summary-today-${todayStr}`;

                if (tasksDueToday.length > 0 && !notifiedRef.current.has(groupKeyToday)) {
                    let title = '';
                    let body = '';

                    if (tasksDueToday.length === 1) {
                        title = `📅 Vence Hoje: ${tasksDueToday[0].title}`;
                        body = 'Fique atento ao prazo.';
                    } else {
                        title = `📅 ${tasksDueToday.length} Tarefas vencem hoje`;
                        // Cria uma lista com as 3 primeiras
                        const firstFew = tasksDueToday.slice(0, 3).map(t => `• ${t.title}`).join('\n');
                        const remaining = tasksDueToday.length - 3;
                        body = remaining > 0 ? `${firstFew}\n...e mais ${remaining}.` : firstFew;
                    }

                    new Notification(title, {
                        body: body,
                        icon: '/favicon.ico',
                        tag: groupKeyToday // Garante que não duplique se o browser for lento
                    });
                    notifiedRef.current.add(groupKeyToday);
                }

                // B. Agrupar Tarefas que vencem EM BREVE (Antecipado)
                if (settings.remindDaysBefore > 0) {
                    const remindDate = new Date();
                    remindDate.setDate(now.getDate() + settings.remindDaysBefore);
                    
                    const tasksDueSoon = tasks.filter(t => 
                        t.status !== 'Concluída' && 
                        t.dueDate && 
                        isSameDay(remindDate, new Date(t.dueDate))
                    );

                    const groupKeySoon = `summary-soon-${todayStr}`;

                    if (tasksDueSoon.length > 0 && !notifiedRef.current.has(groupKeySoon)) {
                        let title = '';
                        let body = '';

                        if (tasksDueSoon.length === 1) {
                            title = `⏳ Vence em ${settings.remindDaysBefore} dia(s): ${tasksDueSoon[0].title}`;
                            body = 'Prepare-se com antecedência.';
                        } else {
                            title = `⏳ ${tasksDueSoon.length} Tarefas vencem em ${settings.remindDaysBefore} dias`;
                            const firstFew = tasksDueSoon.slice(0, 3).map(t => `• ${t.title}`).join('\n');
                            body = firstFew;
                        }

                        new Notification(title, {
                            body: body,
                            icon: '/favicon.ico',
                            tag: groupKeySoon
                        });
                        notifiedRef.current.add(groupKeySoon);
                    }
                }

                // C. Agrupar Tarefas ATRASADAS (Novo no Push)
                const tasksOverdue = tasks.filter(t => {
                    if (t.status === 'Concluída' || !t.dueDate) return false;
                    const d = new Date(t.dueDate);
                    d.setHours(0,0,0,0);
                    const today = new Date(now);
                    today.setHours(0,0,0,0);
                    return d < today; // Data menor que hoje = Atrasada
                });

                const groupKeyOverdue = `summary-overdue-${todayStr}`;

                if (tasksOverdue.length > 0 && !notifiedRef.current.has(groupKeyOverdue)) {
                    new Notification(`⚠️ Atenção: ${tasksOverdue.length} Tarefas Atrasadas`, {
                        body: 'Não deixe acumular! Clique para resolver.',
                        icon: '/favicon.ico',
                        tag: groupKeyOverdue
                    });
                    notifiedRef.current.add(groupKeyOverdue);
                }
            }

            // =========================================================================
            // 2. LEMBRETES DE HORA EXATA (Sininho e Hábitos) - NÃO Agrupados
            // =========================================================================
            // Motivo: Estes são configurados pelo usuário para horas específicas. 
            // Se ele marcou 3 lembretes para 14:00, ele provavelmente quer ver os 3.
            
            // ... Tarefas Manuais ...
            if (settings.taskReminders) {
                tasks.forEach(task => {
                    if (task.status === 'Concluída') return;
                    task.activity.forEach(act => {
                        if (act.type === 'reminder' && act.notifyAt) {
                            const notifyTime = new Date(act.notifyAt);
                            if (isSameMinute(now, notifyTime)) {
                                const key = `reminder-${act.id}-${notifyTime.getTime()}`;
                                if (!notifiedRef.current.has(key)) {
                                    new Notification(`🔔 Lembrete: ${task.title}`, {
                                        body: act.note || 'Hora de focar!',
                                        icon: '/favicon.ico',
                                        tag: key
                                    });
                                    notifiedRef.current.add(key);
                                }
                            }
                        }
                    });
                });
            }

            // ... Hábitos ...
            if (settings.habitReminders) {
                habits.forEach(habit => {
                    const isCompleted = (habit.type === 'manual' && habit.lastCompletedDate === todayStr) || (habit.overrideDate === todayStr);
                    if (isCompleted || !habit.reminderTime) return;

                    const [hours, minutes] = habit.reminderTime.split(':').map(Number);
                    const habitTime = new Date();
                    habitTime.setHours(hours, minutes, 0, 0);

                    if (isSameMinute(now, habitTime)) {
                        const key = `habit-${habit.id}-${todayStr}`;
                        if (!notifiedRef.current.has(key)) {
                            new Notification(`🔄 Hábito: ${habit.title}`, {
                                body: 'Não quebre a corrente!',
                                icon: '/favicon.ico',
                                tag: key
                            });
                            notifiedRef.current.add(key);
                        }
                    }
                });
            }
        };

        checkNotifications(); 
        const intervalId = setInterval(checkNotifications, 30000); 

        return () => clearInterval(intervalId);
    }, [tasks, habits, settings]);
};