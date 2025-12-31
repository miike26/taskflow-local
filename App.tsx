
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/views/DashboardView';
import CalendarView from './components/views/CalendarView';
import ListView from './components/views/ListView';
import ReportsView from './components/views/ReportsView';
import RemindersView from './components/views/RemindersView';
import ProjectsView from './components/views/ProjectsView';
import ProjectDetailView from './components/views/ProjectDetailView';
import SettingsView from './components/views/SettingsView'; // Uses the new comprehensive view
import TaskSheet from './components/TaskModal';
import TaskDetailView from './components/views/TaskDetailView';
import NotificationToast from './components/NotificationToast';
import ConfirmationToast from './components/ConfirmationToast';
import LoginScreen from './components/LoginScreen';
import HabitSettingsModal from './components/HabitSettingsModal';
import Confetti from './components/Confetti';
import SuccessOverlay from './components/SuccessOverlay';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';
import type { View, Task, Category, Tag, Status, NotificationSettings, Notification, Activity, ConfirmationToastData, Habit, HabitTemplate, Project, AppSettings } from './types';
import { DEFAULT_TASKS, DEFAULT_CATEGORIES, DEFAULT_TAGS, DEFAULT_HABITS, HABIT_TEMPLATES, DEFAULT_PROJECTS } from './constants';

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
                    <button onClick={() => setState({ ...state, isOpen: false })} className="px-4 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-500 font-medium transition-colors hover:border-primary-400">Cancelar</button>
                    <button onClick={() => {
                        state.onConfirm();
                        setState({ ...state, isOpen: false });
                    }} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold transition-all duration-200 shadow-sm hover:ring-2 hover:ring-offset-2 hover:ring-primary-400 dark:hover:ring-offset-[#21262D]">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

type NotificationToastDataType = { notification: Notification, task?: Task, category?: Category, key: string };

export const App = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [previousView, setPreviousView] = useState<View>('dashboard');
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', DEFAULT_TASKS);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', DEFAULT_CATEGORIES);
  const [tags, setTags] = useLocalStorage<Tag[]>('tags', DEFAULT_TAGS);
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', DEFAULT_PROJECTS);
  
  const { isAuthenticated, login, logout } = useAuth();
  const [userName, setUserName] = useLocalStorage<string>('userName', 'Admin');

  const [recentTaskIds, setRecentTaskIds] = useLocalStorage<string[]>('recentTaskIds', []);
  const [pinnedTaskIds, setPinnedTaskIds] = useLocalStorage<string[]>('pinnedTaskIds', []);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [initialDataForSheet, setInitialDataForSheet] = useState<Task | null>(null);
  const [globalCategoryFilter, setGlobalCategoryFilter] = useLocalStorage<string>('globalCategoryFilter', '');
  
  // Expanded Settings Defaults
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>('notificationSettings', { 
      enabled: true, 
      remindDaysBefore: 1,
      taskReminders: true,
      habitReminders: true,
      marketingEmails: false
  });
  
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('appSettings', { 
      disableOverdueColor: false,
      timeFormat: '24h',
      weekStart: 'monday',
      enableAi: true,
      enableAnimations: true
  });

  const [readNotificationIds, setReadNotificationIds] = useLocalStorage<string[]>('readNotificationIds', []);
  const [clearedNotificationIds, setClearedNotificationIds] = useLocalStorage<string[]>('clearedNotificationIds', []);
  const [confirmationState, setConfirmationState] = useState<ConfirmationDialogState>({
    isOpen: false, title: '', message: '', onConfirm: () => {},
  });
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationToasts, setNotificationToasts] = useState<NotificationToastDataType[]>([]);
  const [confirmationToasts, setConfirmationToasts] = useState<ConfirmationToastData[]>([]);
  const [habits, setHabits] = useLocalStorage<Habit[]>('habits', DEFAULT_HABITS);
  const [isHabitSettingsOpen, setIsHabitSettingsOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Ref to track first load to prevent notification spam on login
  const isFirstLoad = useRef(true);

  
  const notificationsRef = useRef(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const addToast = useCallback((data: Omit<ConfirmationToastData, 'id'>) => {
    const id = Date.now() + Math.random();
    setConfirmationToasts(prev => [...prev, { id, ...data }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setConfirmationToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const removeNotificationToast = useCallback((key: string) => {
    setNotificationToasts(prev => prev.filter(t => t.key !== key));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const generateAndCheckNotifications = () => {
        const now = new Date();
        const generated: Notification[] = [];
        const todayStr = now.toISOString().split('T')[0];

        // From settings (upcoming/overdue) - Check granular setting
        if (notificationSettings.enabled && notificationSettings.taskReminders) {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);

          tasks.forEach(task => {
            if (task.status !== 'Concluída' && task.dueDate) {
              const dueDate = new Date(task.dueDate);
              const startOfDueDate = new Date(dueDate);
              startOfDueDate.setHours(0, 0, 0, 0);

              // Check if overdue (due date is before today)
              if (startOfDueDate.getTime() < startOfToday.getTime()) {
                  generated.push({
                      id: `${task.id}-overdue`,
                      taskId: task.id,
                      taskTitle: task.title,
                      message: `Atrasada desde ${dueDate.toLocaleDateString('pt-BR')}`,
                      notifyAt: task.dueDate,
                  });
              } else {
                  // Check if upcoming (within notificationSettings.remindDaysBefore)
                  const calendarDaysDiff = (startOfDueDate.getTime() - startOfToday.getTime()) / (1000 * 3600 * 24);
                  
                  const daysUntilDue = Math.round(calendarDaysDiff);

                  if (daysUntilDue <= notificationSettings.remindDaysBefore) {
                      const message = 
                          daysUntilDue === 0 ? 'Vence hoje.' :
                          daysUntilDue === 1 ? 'Vence amanhã.' : 
                          `Vence em ${daysUntilDue} dias.`;
                      
                      generated.push({
                          id: `${task.id}-upcoming-${daysUntilDue}`,
                          taskId: task.id,
                          taskTitle: task.title,
                          message: message,
                          notifyAt: task.dueDate,
                      });
                  }
              }
            }
          });
        }
        
        // From custom reminders in activity
        if (notificationSettings.enabled) {
            tasks.forEach(task => {
            task.activity.forEach(act => {
                if(act.type === 'reminder' && act.notifyAt && new Date(act.notifyAt) <= now && task.status !== 'Concluída') {
                    generated.push({
                    id: act.id,
                    taskId: task.id,
                    taskTitle: task.title,
                    message: `Lembrete: ${act.note || new Date(act.notifyAt).toLocaleString('pt-BR')}`,
                    notifyAt: act.notifyAt,
                    });
                }
            });
            });
        }
        
        // From habit reminders - Check granular setting
        if (notificationSettings.enabled && notificationSettings.habitReminders) {
            habits.forEach(habit => {
                const isCompleted = (habit.type === 'manual' && habit.lastCompletedDate === todayStr) || (habit.overrideDate === todayStr);
                if (habit.reminderTime && !isCompleted) {
                    const [hours, minutes] = habit.reminderTime.split(':').map(Number);
                    const reminderDateTime = new Date();
                    reminderDateTime.setHours(hours, minutes, 0, 0);

                    if (now >= reminderDateTime) {
                        generated.push({
                            id: `habit-${habit.id}-${todayStr}`, // Unique per day
                            taskId: `habit-${habit.id}`, // Special ID to identify it's a habit
                            taskTitle: habit.title,
                            message: `Lembrete de rotina diária.`,
                            notifyAt: reminderDateTime.toISOString(),
                        });
                    }
                }
            });
        }

        const sortedGenerated = generated.sort((a, b) => new Date(a.notifyAt).getTime() - new Date(b.notifyAt).getTime()).filter(n => !clearedNotificationIds.includes(n.id));
        
        // Only trigger toasts if it is NOT the first load/login
        if (!isFirstLoad.current) {
            const currentNotificationIds = new Set(notificationsRef.current.map(n => n.id));
            const newNotifications = sortedGenerated.filter(n => !currentNotificationIds.has(n.id));

            if (newNotifications.length > 0) {
                const unreadNewNotifications = newNotifications.filter(n => !readNotificationIds.includes(n.id));

                const toastsToAdd = unreadNewNotifications.map((n): NotificationToastDataType | null => {
                    const taskForToast = tasks.find(t => t.id === n.taskId);
                    const categoryForToast = taskForToast ? categories.find(c => c.id === taskForToast.categoryId) : undefined;
                    
                    // For habits, task will be undefined, but we still want a toast.
                    const isHabit = n.taskId.startsWith('habit-');

                    if ((taskForToast && categoryForToast) || isHabit) {
                        return {
                            notification: n,
                            task: taskForToast,
                            category: categoryForToast,
                            key: n.id,
                        };
                    }
                    return null;
                }).filter((t): t is NotificationToastDataType => !!t);

                if (toastsToAdd.length > 0) {
                    setNotificationToasts(prev => {
                        const existingKeys = new Set(prev.map(t => t.key));
                        const uniqueNewToasts = toastsToAdd.filter(t => !existingKeys.has(t.key));
                        return [...prev, ...uniqueNewToasts];
                    });
                }
            }
        } else {
            // Mark first load as complete, so subsequent updates DO show toasts
            isFirstLoad.current = false;
        }
        
        setNotifications(sortedGenerated);
    };

    generateAndCheckNotifications();
    const interval = setInterval(generateAndCheckNotifications, 5000);

    return () => clearInterval(interval);
  }, [tasks, categories, notificationSettings, isAuthenticated, readNotificationIds, clearedNotificationIds, habits]);


  const unreadNotifications = useMemo(() => notifications.filter(n => !readNotificationIds.includes(n.id)), [notifications, readNotificationIds]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const navigateToView = (view: View) => {
    if (view !== 'taskDetail') {
      setSelectedTask(null);
    }
    if (view !== 'projectDetail') {
        setSelectedProject(null);
    }
    setCurrentView(view);
  };

  const handleAddTask = () => {
    setInitialDataForSheet(null);
    setIsSheetOpen(true);
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setPreviousView(currentView);
    setCurrentView('taskDetail');
    setIsSheetOpen(false);

    setRecentTaskIds(prev => {
      const newRecents = [task.id, ...prev.filter(id => id !== task.id)];
      return newRecents.slice(0, 10); // keep a bit more history internally
    });
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setPreviousView(currentView);
    setCurrentView('projectDetail');
  };

  const handleAddProject = (project: Project) => {
    const projectWithActivity = {
        ...project,
        activity: project.activity.length > 0 ? project.activity : [{
            id: `proj-act-create-${Date.now()}`,
            type: 'creation', // Ensure creation type is set
            timestamp: new Date().toISOString(),
            user: userName,
            note: 'Usuário criou esse projeto'
        }]
    } as Project;

    setProjects(prev => [...prev, projectWithActivity]);
    addToast({ title: 'Projeto Criado', subtitle: 'Projeto adicionado com sucesso.', type: 'success' });
  };

  const handleEditProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(prev => prev ? { ...prev, ...updates } : null);
    }
    addToast({ title: 'Projeto Atualizado', type: 'success' });
  };

  const handleDeleteProject = (projectId: string) => {
    setConfirmationState({
        isOpen: true,
        title: 'Excluir Projeto',
        message: 'Tem certeza que deseja excluir este projeto? As tarefas associadas a ele NÃO serão excluídas, mas ficarão sem projeto.',
        onConfirm: () => {
            setProjects(prev => prev.filter(p => p.id !== projectId));
            // Optional: Remove projectId from tasks or delete tasks?
            // For now, let's keep tasks but remove the association
            setTasks(prev => prev.map(t => t.projectId === projectId ? { ...t, projectId: undefined } : t));
            
            if (selectedProject?.id === projectId) {
                setCurrentView('projects');
                setSelectedProject(null);
            }
            addToast({ title: 'Projeto Excluído', type: 'success' });
        }
    });
  };
  
  const handleDeleteTaskRequest = (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    setConfirmationState({
        isOpen: true,
        title: 'Excluir Tarefa',
        message: 'Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.',
        onConfirm: () => {
            setTasks(currentTasks => currentTasks.filter(t => t.id !== taskId));
            if (selectedTask?.id === taskId) {
              setCurrentView(previousView);
              setSelectedTask(null);
            }
            // Add activity to project if applicable
            if (taskToDelete?.projectId) {
                setProjects(prev => prev.map(p => {
                    if (p.id === taskToDelete.projectId) {
                        const activity: Activity = {
                            id: `proj-act-${Date.now()}`,
                            type: 'project',
                            action: 'removed',
                            timestamp: new Date().toISOString(),
                            user: userName,
                            taskTitle: taskToDelete.title
                        };
                        const updatedProject = { ...p, activity: [...(p.activity || []), activity] };
                        if (selectedProject?.id === p.id) setSelectedProject(updatedProject);
                        return updatedProject;
                    }
                    return p;
                }));
            }
            addToast({ title: 'Tarefa Excluída', subtitle: 'Sua tarefa foi removida.', type: 'error' });
        }
    });
  }

  const handleDuplicateTaskRequest = (taskToDuplicate: Task) => {
    const duplicatedData: Task = {
        ...taskToDuplicate,
        id: `task-${Date.now()}`,
        title: `${taskToDuplicate.title} (Cópia)`,
        dateTime: new Date().toISOString(),
        status: 'Pendente',
        activity: [],
        subTasks: taskToDuplicate.subTasks.map(st => ({
            ...st,
            id: `sub-${Date.now()}-${Math.random()}`
        })),
    };
    setInitialDataForSheet(duplicatedData);
    setIsSheetOpen(true);
};

  const handlePinTask = (taskId: string) => {
    setPinnedTaskIds(prev => {
        const newPinned = new Set(prev);
        if (newPinned.has(taskId)) {
            newPinned.delete(taskId);
        } else {
            newPinned.add(taskId);
        }
        return Array.from(newPinned);
    });
  };

  const handleClearRecentTasks = () => {
    setRecentTaskIds(prev => prev.filter(id => pinnedTaskIds.includes(id)));
  };

  const handleSaveNewTask = (task: Task) => {
    if (!task.activity.some(a => a.type === 'creation')) {
        task.activity.unshift({
            id: `act-${Date.now()}`,
            type: 'creation',
            timestamp: new Date().toISOString(),
            user: userName,
            note: 'Tarefa criada.'
        });
    }
    setTasks(prevTasks => [...prevTasks, task]);
    
    // Add activity to project if applicable
    if (task.projectId) {
        setProjects(prev => prev.map(p => {
            if (p.id === task.projectId) {
                const activity: Activity = {
                    id: `proj-act-${Date.now()}`,
                    type: 'project',
                    action: 'added',
                    timestamp: new Date().toISOString(),
                    user: userName,
                    taskTitle: task.title
                };
                const updatedProject = { ...p, activity: [...(p.activity || []), activity] };
                if (selectedProject?.id === p.id) setSelectedProject(updatedProject);
                return updatedProject;
            }
            return p;
        }));
    }

    setIsSheetOpen(false);
    addToast({ title: 'Tarefa Criada', subtitle: 'Sua tarefa foi adicionada com sucesso.', type: 'success' });
    handleSelectTask(task);
  };
  
  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    const currentTask = tasks.find(t => t.id === taskId);
    
    // Check if status changed to 'Concluída' to trigger confetti and overlay
    if (updates.status === 'Concluída' && currentTask?.status !== 'Concluída' && appSettings.enableAnimations) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
    }

    // Optimistic Update
    setTasks(currentTasks => 
        currentTasks.map(t => {
            if (t.id === taskId) {
                return { ...t, ...updates };
            }
            return t;
        })
    );

    if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
    }

    // Side effect: Handle Project Linking/Unlinking/Switching Activity Log for the PROJECT History
    if (currentTask && 'projectId' in updates && updates.projectId !== currentTask.projectId) {
        const oldProjectId = currentTask.projectId;
        const newProjectId = updates.projectId;

        setProjects(prevProjects => prevProjects.map(p => {
            // Case 1: Task removed from Old Project
            if (oldProjectId && p.id === oldProjectId) {
                const activity: Activity = {
                    id: `proj-act-unlink-${Date.now()}-${Math.random()}`,
                    type: 'project',
                    action: 'removed',
                    timestamp: new Date().toISOString(),
                    user: userName,
                    taskTitle: currentTask.title
                };
                const updatedProject = { ...p, activity: [...(p.activity || []), activity] };
                if (selectedProject?.id === p.id) setSelectedProject(updatedProject);
                return updatedProject;
            }

            // Case 2: Task added to New Project
            if (newProjectId && p.id === newProjectId) {
                const activity: Activity = {
                    id: `proj-act-link-${Date.now()}-${Math.random()}`,
                    type: 'project',
                    action: 'added',
                    timestamp: new Date().toISOString(),
                    user: userName,
                    taskTitle: currentTask.title
                };
                const updatedProject = { ...p, activity: [...(p.activity || []), activity] };
                if (selectedProject?.id === p.id) setSelectedProject(updatedProject);
                return updatedProject;
            }

            return p;
        }));
    }

    // Side effect: Log status change to Project History
    if (currentTask && updates.status && updates.status !== currentTask.status && currentTask.projectId && (!('projectId' in updates) || updates.projectId === currentTask.projectId)) {
         setProjects(prev => prev.map(p => {
            if (p.id === currentTask.projectId) {
                const activity: Activity = {
                    id: `proj-act-status-${Date.now()}-${Math.random()}`,
                    type: 'status_change',
                    timestamp: new Date().toISOString(),
                    user: userName,
                    from: currentTask.status,
                    to: updates.status,
                    taskTitle: currentTask.title
                };
                const updatedProject = { ...p, activity: [...(p.activity || []), activity] };
                if (selectedProject?.id === p.id) setSelectedProject(updatedProject);
                return updatedProject;
            }
            return p;
        }));
    }
  };


  const handleTaskStatusChange = (taskId: string, newStatus: Status) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;
    const activityEntry = {
        id: `act-${Date.now()}`,
        type: 'status_change' as const,
        timestamp: new Date().toISOString(),
        from: oldStatus,
        to: newStatus,
        user: userName
    };
    
    // Just update the task. handleUpdateTask will now take care of the project side-effect.
    handleUpdateTask(taskId, {
      status: newStatus,
      activity: [...task.activity, activityEntry]
    });
  };

  const handleBulkStatusChange = (taskIds: string[], newStatus: Status) => {
    const now = new Date().toISOString();
    
    if (newStatus === 'Concluída' && appSettings.enableAnimations) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
    }

    // 1. Update Tasks
    setTasks(currentTasks =>
        currentTasks.map(task => {
            if (taskIds.includes(task.id) && task.status !== newStatus) {
                const activityEntry = {
                    id: `act-${Date.now()}-${Math.random()}`,
                    type: 'status_change' as const,
                    timestamp: now,
                    from: task.status,
                    to: newStatus,
                    user: userName
                };
                return { ...task, status: newStatus, activity: [...task.activity, activityEntry] };
            }
            return task;
        })
    );

    // 2. Aggregate Project Updates
    const tasksToUpdate = tasks.filter(t => taskIds.includes(t.id) && t.status !== newStatus);
    const groups: Record<string, Record<Status, string[]>> = {}; // projectId -> fromStatus -> taskTitles[]
    
    tasksToUpdate.forEach(task => {
        if (!task.projectId) return;
        if (!groups[task.projectId]) groups[task.projectId] = {} as any;
        if (!groups[task.projectId][task.status]) groups[task.projectId][task.status] = [];
        groups[task.projectId][task.status].push(task.title);
    });

    const projectUpdates: Record<string, Activity[]> = {};

    Object.keys(groups).forEach(projectId => {
        const fromStatuses = Object.keys(groups[projectId]) as Status[];
        fromStatuses.forEach(fromStatus => {
            const taskTitles = groups[projectId][fromStatus];
            const newActivity: Activity = {
                id: `proj-act-bulk-${Date.now()}-${Math.random()}`,
                type: 'status_change',
                timestamp: now,
                user: userName,
                from: fromStatus,
                to: newStatus,
                count: taskTitles.length,
                affectedTasks: taskTitles,
            };
            if (!projectUpdates[projectId]) projectUpdates[projectId] = [];
            projectUpdates[projectId].push(newActivity);
        });
    });

    if (Object.keys(projectUpdates).length > 0) {
        setProjects(prevProjects => prevProjects.map(p => {
            if (projectUpdates[p.id]) {
                return { ...p, activity: [...(p.activity || []), ...projectUpdates[p.id]] };
            }
            return p;
        }));

        if (selectedProject && projectUpdates[selectedProject.id]) {
            setSelectedProject(prev => prev ? {
                ...prev,
                activity: [...(prev.activity || []), ...projectUpdates[prev.id]]
            } : null);
        }
    }
  };

  const handleBulkDelete = (taskIds: string[]) => {
    // Log deletion in projects
    const tasksToDelete = tasks.filter(t => taskIds.includes(t.id));
    tasksToDelete.forEach(task => {
        if (task.projectId) {
             setProjects(prev => prev.map(p => {
                if (p.id === task.projectId) {
                    const activity: Activity = {
                        id: `proj-act-${Date.now()}-${Math.random()}`,
                        type: 'project', 
                        action: 'removed',
                        timestamp: new Date().toISOString(),
                        user: userName,
                        taskTitle: task.title
                    };
                    const updatedProject = { ...p, activity: [...(p.activity || []), activity] };
                    if (selectedProject?.id === p.id) setSelectedProject(updatedProject);
                    return updatedProject;
                }
                return p;
            }));
        }
    });

    setTasks(currentTasks => currentTasks.filter(t => !taskIds.includes(t.id)));
    addToast({ title: 'Tarefas Excluídas', subtitle: `${taskIds.length} tarefa(s) foram removidas.`, type: 'error' });
  };

  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus: Status = task.status === 'Concluída' ? 'Pendente' : 'Concluída';
    handleTaskStatusChange(taskId, newStatus);
  };
  
  const filteredTasks = useMemo(() => {
    let results = tasks;

    if (globalCategoryFilter) {
      results = results.filter(task => task.categoryId === globalCategoryFilter);
    }
    
    return results;
  }, [tasks, globalCategoryFilter]);

  const handleDeleteReminderRequest = (taskId: string, reminderId: string) => {
    setConfirmationState({
        isOpen: true,
        title: 'Excluir Lembrete',
        message: 'Tem certeza que deseja excluir este lembrete?',
        onConfirm: () => {
            let updatedTask: Task | null = null;
            const newTasks = tasks.map(task => {
                if (task.id === taskId) {
                    updatedTask = { ...task, activity: task.activity.filter(r => r.id !== reminderId) };
                    return updatedTask;
                }
                return task;
            });
            setTasks(newTasks);
            if (selectedTask?.id === taskId && updatedTask) {
                setSelectedTask(updatedTask);
            }
        }
    });
  };
  
  const handleDeleteActivityRequest = (taskId: string, activityId: string, type: Activity['type']) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const onConfirmDelete = () => {
            handleUpdateTask(taskId, { activity: task.activity.filter(act => act.id !== activityId) });
        };

        if (type === 'reminder') {
            handleDeleteReminderRequest(taskId, activityId);
        } else {
             setConfirmationState({
                isOpen: true,
                title: 'Excluir Anotação',
                message: 'Tem certeza que deseja excluir esta anotação?',
                onConfirm: onConfirmDelete
            });
        }
    };

  const handleSnoozeNotification = (notification: Notification) => {
    const now = new Date();
    const snoozeTime = new Date();
    snoozeTime.setHours(snoozeTime.getHours() + 2); // Snooze for 2 hours
    
    const newReminderActivity: Activity = {
      id: `act-snooze-${Date.now()}`,
      type: 'reminder',
      timestamp: now.toISOString(),
      notifyAt: snoozeTime.toISOString(),
      note: `Soneca de: ${notification.taskTitle}`,
      user: 'Sistema'
    };

    setTasks(currentTasks => currentTasks.map(task => {
      if (task.id === notification.taskId) {
        return { ...task, activity: [...task.activity, newReminderActivity] };
      }
      return task;
    }));

    // Mark original notification as read
    setReadNotificationIds(prev => [...new Set([...prev, notification.id])]);
    addToast({ title: 'Lembrete Adiado', subtitle: 'Você será notificado em 2 horas.', type: 'success' });
  };
  
  const handleNotificationClick = (notification: Notification) => {
    if (notification.taskId.startsWith('habit-')) {
        setReadNotificationIds(prev => [...new Set([...prev, notification.id])]);
        return;
    }
    const task = tasks.find(t => t.id === notification.taskId);
    if (task) {
      handleSelectTask(task);
      setReadNotificationIds(prev => [...new Set([...prev, notification.id])]);
    }
  };

  const handleMarkAllNotificationsAsRead = () => {
    setReadNotificationIds(notifications.map(n => n.id));
  };

  const handleClearAllNotifications = () => {
    setClearedNotificationIds(prev => [...new Set([...prev, ...notifications.map(n => n.id)])]);
    addToast({ title: 'Notificações Limpas', type: 'success' });
  };

  const habitsWithStatus = useMemo(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      const wasTaskCompletedToday = tasks.some(task => {
          const completionActivity = [...task.activity]
              .reverse()
              .find(act => act.type === 'status_change' && act.to === 'Concluída');
          if (!completionActivity) return false;
          return new Date(completionActivity.timestamp).toISOString().split('T')[0] === todayStr;
      });

      return habits.map(habit => {
          let isCompleted = false;
          // Manual overrides take precedence
          if (habit.overrideDate === todayStr) {
              isCompleted = false; // Manually marked as incomplete
          } else if (habit.lastCompletedDate === todayStr) {
              isCompleted = true; // Manually marked as complete
          } else if (habit.type === 'auto-task-completion') {
              isCompleted = wasTaskCompletedToday; // Automatic check
          } else { // Manual habit, not marked as complete today
              isCompleted = false;
          }
          return { ...habit, isCompleted };
      });
  }, [tasks, habits]);

  const handleToggleHabit = (habitId: string) => {
      const todayStr = new Date().toISOString().split('T')[0];
      setHabits(prevHabits => prevHabits.map(h => {
          if (h.id !== habitId) return h;
          
          const isCurrentlyCompleted = habitsWithStatus.find(hs => hs.id === habitId)?.isCompleted ?? false;
          
          if (isCurrentlyCompleted) {
              // User is un-checking it
              if (h.type === 'manual') {
                  return { ...h, lastCompletedDate: undefined };
              } else { // auto
                  return { ...h, overrideDate: todayStr, lastCompletedDate: undefined };
              }
          } else {
              // User is checking it
              return { ...h, lastCompletedDate: todayStr, overrideDate: undefined };
          }
      }));
  };
  
  const handleMarkHabitComplete = (habitId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setHabits(prevHabits => prevHabits.map(h => {
        if (h.id !== habitId) return h;
        // Force completion by setting lastCompletedDate and removing any incompletion override
        return { ...h, lastCompletedDate: todayStr, overrideDate: undefined };
    }));
    const notificationId = `habit-${habitId}-${todayStr}`;
    setReadNotificationIds(prev => [...new Set([...prev, notificationId])]);
    addToast({ title: 'Rotina Concluída!', type: 'success' });
  };
  
  const handleMarkAllHabitsComplete = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setHabits(prevHabits =>
      prevHabits.map(h => {
        const habitStatus = habitsWithStatus.find(hs => hs.id === h.id);
        // If the habit is not complete, mark it as complete.
        if (habitStatus && !habitStatus.isCompleted) {
          return { ...h, lastCompletedDate: todayStr, overrideDate: undefined };
        }
        // If it's already complete, do nothing.
        return h;
      })
    );
    addToast({ title: 'Rotinas Concluídas!', type: 'success' });
  };

  const handleSaveHabits = (updatedHabits: Habit[]) => {
      setHabits(updatedHabits);
      setIsHabitSettingsOpen(false);
      addToast({ title: 'Rotinas Salvas', subtitle: 'Suas alterações foram salvas com sucesso.', type: 'success' });
  };

  // Determine if current view should have hidden overflow in main container
  const isFixedLayout = ['dashboard', 'projectDetail', 'taskDetail', 'calendar', 'reminders', 'list', 'settings'].includes(currentView);

  const renderView = () => {
    const commonProps = {
        tasks: filteredTasks,
        categories,
        tags,
        onSelectTask: handleSelectTask,
        onToggleComplete: handleToggleComplete,
        appSettings // Passing down to views that need it for TaskCard
    };
    switch (currentView) {
      case 'dashboard':
        return <DashboardView {...commonProps} habits={habitsWithStatus} onToggleHabit={handleToggleHabit} setAppSettings={setAppSettings} />;
      case 'calendar':
        return <CalendarView {...commonProps} />;
      case 'list':
        return <ListView {...commonProps} setTasks={setTasks} onStatusChange={handleTaskStatusChange} onBulkStatusChange={handleBulkStatusChange} onBulkDelete={handleBulkDelete} />;
      case 'reminders':
        return <RemindersView tasks={tasks} categories={categories} onSelectTask={handleSelectTask} onDeleteReminderRequest={handleDeleteReminderRequest} appSettings={appSettings}/>;
      case 'reports':
        return <ReportsView tasks={tasks} tags={tags} categories={categories} onSelectTask={handleSelectTask} projects={projects} appSettings={appSettings}/>;
      // Removed ProfileView case
      case 'projects':
        return <ProjectsView projects={projects} tasks={tasks} onAddProject={handleAddProject} onSelectProject={handleSelectProject} />;
      case 'settings':
        return <SettingsView 
            categories={categories} setCategories={setCategories}
            tags={tags} setTags={setTags}
            notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings}
            appSettings={appSettings} setAppSettings={setAppSettings}
            onLogout={logout}
            userName={userName}
            setUserName={setUserName}
        />;
      case 'projectDetail':
        return selectedProject ? (
            <ProjectDetailView 
                project={selectedProject}
                tasks={tasks.filter(t => t.projectId === selectedProject.id)}
                allTasks={tasks} // Pass all tasks for notification resolution
                categories={categories}
                tags={tags}
                onBack={() => {
                    if (previousView === 'taskDetail' && selectedTask) {
                        setCurrentView('taskDetail');
                    } else {
                        setCurrentView('projects');
                    }
                }}
                onSelectTask={handleSelectTask}
                onUpdateTaskStatus={handleTaskStatusChange}
                onAddTask={handleAddTask}
                theme={theme}
                toggleTheme={toggleTheme}
                notifications={notifications}
                unreadNotifications={unreadNotifications}
                onNotificationClick={handleNotificationClick}
                onSnoozeNotification={handleSnoozeNotification}
                onMarkHabitComplete={handleMarkHabitComplete}
                onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
                onClearAllNotifications={handleClearAllNotifications}
                userName={userName}
                habitsWithStatus={habitsWithStatus}
                onToggleHabit={handleToggleHabit}
                onMarkAllHabitsComplete={handleMarkAllHabitsComplete}
                onOpenHabitSettings={() => setIsHabitSettingsOpen(true)}
                onEditProject={handleEditProject}
                onDeleteProject={handleDeleteProject}
                onBulkStatusChange={handleBulkStatusChange}
                onBulkDelete={handleBulkDelete}
                appSettings={appSettings}
                setAppSettings={setAppSettings}
            />
        ) : <ProjectsView projects={projects} tasks={tasks} onAddProject={handleAddProject} onSelectProject={handleSelectProject} />;
      case 'taskDetail':
        return selectedTask ? <TaskDetailView 
            task={selectedTask} 
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTaskRequest}
            onDuplicate={handleDuplicateTaskRequest}
            onDeleteActivity={handleDeleteActivityRequest}
            onBack={() => {
                setCurrentView(previousView);
                setSelectedTask(null);
            }}
            onSelectTask={handleSelectTask}
            categories={categories}
            tags={tags}
            tasks={tasks}
            projects={projects}
            onOpenProject={handleSelectProject}
            theme={theme}
            toggleTheme={toggleTheme}
            notifications={notifications}
            unreadNotifications={unreadNotifications}
            onNotificationClick={handleNotificationClick}
            onSnoozeNotification={handleSnoozeNotification}
            onMarkHabitComplete={handleMarkHabitComplete}
            onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
            onClearAllNotifications={handleClearAllNotifications}
            addToast={addToast}
            userName={userName}
            habitsWithStatus={habitsWithStatus}
            onToggleHabit={handleToggleHabit}
            onMarkAllHabitsComplete={handleMarkAllHabitsComplete}
            onOpenHabitSettings={() => setIsHabitSettingsOpen(true)}
            appSettings={appSettings}
            setAppSettings={setAppSettings}
        /> : null;
      default:
        return <DashboardView {...commonProps} habits={habitsWithStatus} onToggleHabit={handleToggleHabit} setAppSettings={setAppSettings} />;
    }
  };
  
  if (!isAuthenticated) {
    return <LoginScreen login={login} />;
  }

  return (
    <div className="min-h-screen bg-ice-blue dark:bg-[#0D1117] text-gray-800 dark:text-gray-200 font-sans p-4">
      {showCelebration && (
        <>
            <Confetti />
            <SuccessOverlay />
        </>
      )}
      <div className="fixed top-24 right-6 z-50 space-y-3">
        {notificationToasts.map(toastData => (
          <NotificationToast
              key={toastData.key}
              notificationKey={toastData.key}
              notification={toastData.notification}
              task={toastData.task}
              category={toastData.category}
              onClose={removeNotificationToast}
              onMarkHabitComplete={handleMarkHabitComplete}
          />
        ))}
      </div>
      <div className="fixed bottom-6 right-6 z-[100] space-y-3">
        {confirmationToasts.map(toast => (
          <ConfirmationToast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            subtitle={toast.subtitle}
            type={toast.type}
            onClose={removeToast}
          />
        ))}
      </div>
      <ConfirmationDialog state={confirmationState} setState={setConfirmationState} />
      <div className="flex gap-4 h-[calc(100vh-2rem)]">
        <Sidebar 
          currentView={currentView} 
          setCurrentView={navigateToView} 
          recentTaskIds={recentTaskIds}
          pinnedTaskIds={pinnedTaskIds}
          tasks={tasks}
          categories={categories}
          onSelectTask={handleSelectTask}
          onPinTask={handlePinTask}
          selectedTask={selectedTask}
          onClearRecents={handleClearRecentTasks}
          userName={userName}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentView !== 'taskDetail' && currentView !== 'projectDetail' && (
            <Header 
              currentView={currentView} 
              tasks={tasks}
              tags={tags}
              onSelectTask={handleSelectTask}
              onAddTask={handleAddTask} 
              theme={theme}
              toggleTheme={toggleTheme}
              categories={categories}
              globalCategoryFilter={globalCategoryFilter}
              onCategoryChange={setGlobalCategoryFilter}
              notifications={notifications}
              unreadNotifications={unreadNotifications}
              onNotificationClick={handleNotificationClick}
              onSnoozeNotification={handleSnoozeNotification}
              onMarkHabitComplete={handleMarkHabitComplete}
              onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
              onClearAllNotifications={handleClearAllNotifications}
              setCurrentView={navigateToView}
              userName={userName}
              habitsWithStatus={habitsWithStatus}
              onToggleHabit={handleToggleHabit}
              onMarkAllHabitsComplete={handleMarkAllHabitsComplete}
              onOpenHabitSettings={() => setIsHabitSettingsOpen(true)}
              appSettings={appSettings}
            />
          )}
          <div key={currentView} className={`flex-1 overflow-x-hidden h-full animate-slide-up-fade-in ${isFixedLayout ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
            {renderView()}
          </div>
        </main>
      </div>
      <TaskSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSaveNew={handleSaveNewTask}
        onUpdate={() => {}}
        onDelete={() => {}}
        onDeleteActivity={() => {}}
        initialData={initialDataForSheet}
        categories={categories}
        tags={tags}
        tasks={tasks}
        projects={projects}
        onSelectTask={() => {}}
      />
      <HabitSettingsModal
        isOpen={isHabitSettingsOpen}
        onClose={() => setIsHabitSettingsOpen(false)}
        habits={habits}
        templates={HABIT_TEMPLATES}
        onSave={handleSaveHabits}
       />
    </div>
  );
}
