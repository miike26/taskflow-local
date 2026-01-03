import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import DashboardView from './components/views/DashboardView.tsx';
import CalendarView from './components/views/CalendarView.tsx';
import ListView from './components/views/ListView.tsx';
import ReportsView from './components/views/ReportsView.tsx';
import RemindersView from './components/views/RemindersView.tsx';
import ProjectsView from './components/views/ProjectsView.tsx';
import ProjectDetailView from './components/views/ProjectDetailView.tsx';
import SettingsView from './components/views/SettingsView.tsx'; 
import TaskSheet from './components/TaskModal.tsx';
import TaskDetailView from './components/views/TaskDetailView.tsx';
import NotificationToast from './components/NotificationToast.tsx';
import ConfirmationToast from './components/ConfirmationToast.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import HabitSettingsModal from './components/HabitSettingsModal.tsx';
import Confetti from './components/Confetti.tsx';
import SuccessOverlay from './components/SuccessOverlay.tsx';
import OnboardingWizard from './components/OnboardingWizard';
import { useLocalStorage } from './hooks/useLocalStorage.ts';
import { useFirestore } from './hooks/useFirestore.ts';
import { useAuth } from './hooks/useAuth.ts';
import { useUserDocument } from './hooks/useUserDocument.ts'; 
import type { View, Task, Category, Tag, Status, NotificationSettings, Notification, Activity, ConfirmationToastData, Habit, HabitTemplate, Project, AppSettings } from './types.ts';
import { DEFAULT_TASKS, DEFAULT_CATEGORIES, DEFAULT_TAGS, DEFAULT_HABITS, HABIT_TEMPLATES, DEFAULT_PROJECTS } from './constants.ts';


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
  // O tema continua no localStorage pois é preferência de dispositivo
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [previousView, setPreviousView] = useState<View>('dashboard');
  
  // --- INTEGRAÇÃO COM FIREBASE ---
  const { user, loading: authLoading, logout } = useAuth();
  
  // Hook para acessar dados do perfil (Settings, Notificações e Nome)
  const { data: userData, updateDocument: updateUserDoc } = useUserDocument();

  // [MODIFICADO] Lógica de Dados do Usuário
  // Removemos o useLocalStorage para userName e onboarding. Agora usamos o userData como fonte da verdade.
  // Se userData ainda não carregou, usamos user.displayName do Auth ou um fallback.
  const userName = userData?.displayName || user?.displayName || 'Usuário';
  
  // Verifica se o onboarding foi completado no documento do Firestore
  const hasCompletedOnboarding = userData?.hasCompletedOnboarding === true;

  // --- FUNÇÃO AUXILIAR DE DATA LOCAL (FUSO HORÁRIO) ---
  const getLocalISODate = useCallback(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000; 
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  }, []);

  // 1. Tarefas (Firestore)
  const { 
    data: tasks, 
    add: addTaskFire, 
    update: updateTaskFire, 
    remove: removeTaskFire,
    updateBatch: updateBatchFire,
    deleteBatch: deleteBatchFire
  } = useFirestore<Task>('tasks', []);

  // 2. Projetos (Firestore)
  const {
    data: projects,
    add: addProjectFire,
    update: updateProjectFire, 
    remove: removeProjectFire
  } = useFirestore<Project>('projects', DEFAULT_PROJECTS);

  // 3. Categorias (Firestore)
  const {
    data: categories,
    add: addCategoryFire,
    update: updateCategoryFire, 
    remove: removeCategoryFire
  } = useFirestore<Category>('categories', DEFAULT_CATEGORIES);

  // 4. Tags (Firestore)
  const {
    data: tags,
    add: addTagFire,
    update: updateTagFire,
    remove: removeTagFire
  } = useFirestore<Tag>('tags', DEFAULT_TAGS);

  // 5. Hábitos (Firestore)
  const {
    data: habits,
    add: addHabitFire,
    update: updateHabitFire,
    remove: removeHabitFire,
  } = useFirestore<Habit>('habits', DEFAULT_HABITS, 'order', 'asc');

  // --- DADOS LOCAIS (Settings e Estado de UI) ---
  
  const [recentTaskIds, setRecentTaskIds] = useLocalStorage<string[]>('recentTaskIds', []);
  
  const pinnedTaskIds = useMemo(() => {
    return tasks
      .filter(task => task.isPinned)
      .map(task => task.id);
  }, [tasks]);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [initialDataForSheet, setInitialDataForSheet] = useState<Task | null>(null);
  const [globalCategoryFilter, setGlobalCategoryFilter] = useLocalStorage<string>('globalCategoryFilter', '');
  
  const DEFAULT_NOTIF_SETTINGS: NotificationSettings = { 
      enabled: true, remindDaysBefore: 1, taskReminders: true, habitReminders: true, marketingEmails: false 
  };
  
  const DEFAULT_APP_SETTINGS: AppSettings = { 
      disableOverdueColor: false, timeFormat: '24h', weekStart: 'monday', enableAi: true, enableAnimations: true 
  };

  const notificationSettings: NotificationSettings = userData?.notificationSettings || DEFAULT_NOTIF_SETTINGS;
  const appSettings: AppSettings = userData?.appSettings || DEFAULT_APP_SETTINGS;
  const readNotificationIds: string[] = userData?.readNotificationIds || [];
  const clearedNotificationIds: string[] = userData?.clearedNotificationIds || [];

  const [confirmationState, setConfirmationState] = useState<ConfirmationDialogState>({
    isOpen: false, title: '', message: '', onConfirm: () => {},
  });
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationToasts, setNotificationToasts] = useState<NotificationToastDataType[]>([]);
  const [confirmationToasts, setConfirmationToasts] = useState<ConfirmationToastData[]>([]);
  const [isHabitSettingsOpen, setIsHabitSettingsOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const isFirstLoad = useRef(true);

  // --- HANDLERS SINCRONIZADOS COM FIREBASE ---

  const handleUpdateNotificationSettings = useCallback((value: NotificationSettings | ((val: NotificationSettings) => NotificationSettings)) => {
      const current = userData?.notificationSettings || DEFAULT_NOTIF_SETTINGS;
      const newValue = value instanceof Function ? value(current) : value;
      updateUserDoc({ notificationSettings: newValue });
  }, [userData, updateUserDoc]); 

  const handleUpdateAppSettings = useCallback((value: AppSettings | ((val: AppSettings) => AppSettings)) => {
      const current = userData?.appSettings || DEFAULT_APP_SETTINGS;
      const newValue = value instanceof Function ? value(current) : value;
      updateUserDoc({ appSettings: newValue });
  }, [userData, updateUserDoc]);

  // [NOVO] Handler para atualizar o Nome do Usuário no Firebase
  const handleUpdateUserName = useCallback((newName: string) => {
      updateUserDoc({ displayName: newName });
  }, [updateUserDoc]);

  const setReadNotificationIds = useCallback((value: string[] | ((val: string[]) => string[])) => {
      const current = userData?.readNotificationIds || [];
      const newValue = value instanceof Function ? value(current) : value;
      updateUserDoc({ readNotificationIds: newValue });
  }, [userData, updateUserDoc]);

  const setClearedNotificationIds = useCallback((value: string[] | ((val: string[]) => string[])) => {
      const current = userData?.clearedNotificationIds || [];
      const newValue = value instanceof Function ? value(current) : value;
      updateUserDoc({ clearedNotificationIds: newValue });
  }, [userData, updateUserDoc]);

  // [MODIFICADO] Finaliza o onboarding salvando no Firebase
  const handleSyncOnboardingData = useCallback(() => {
      updateUserDoc({ hasCompletedOnboarding: true });
      addToast({ title: 'Tudo pronto!', subtitle: 'Suas preferências foram salvas.', type: 'success' });
  }, [updateUserDoc]);

  // [NOVO] Função de Logout Seguro (Corrige o "Ghost Data")
  const handleCompleteLogout = useCallback(async () => {
    try {
        // 1. Limpa resquícios do usuário no LocalStorage
        window.localStorage.removeItem('recentTaskIds');
        window.localStorage.removeItem('globalCategoryFilter');
        // Limpa chaves antigas se existirem
        window.localStorage.removeItem('userName'); 
        window.localStorage.removeItem('hasCompletedOnboarding');
        
        // 2. Reseta estados locais críticos
        setRecentTaskIds([]);
        setNotifications([]);
        
        // 3. Logout do Firebase
        await logout();
    } catch (error) {
        console.error("Erro ao sair:", error);
    }
  }, [logout, setRecentTaskIds]);

  // Efeito de Migração Automática (LocalStorage -> Firebase)
  useEffect(() => {
      if (user && userData) { 
          const migrateIfNeeded = (key: string, defaultVal: any) => {
              if (userData[key] === undefined) {
                  const localItem = window.localStorage.getItem(key);
                  if (localItem) {
                      try {
                          const parsed = JSON.parse(localItem);
                          updateUserDoc({ [key]: parsed });
                      } catch (e) {
                          updateUserDoc({ [key]: defaultVal });
                      }
                  } else {
                      updateUserDoc({ [key]: defaultVal });
                  }
              }
          };

          migrateIfNeeded('appSettings', DEFAULT_APP_SETTINGS);
          migrateIfNeeded('notificationSettings', DEFAULT_NOTIF_SETTINGS);
          if (userData.readNotificationIds === undefined) updateUserDoc({ readNotificationIds: [] });
          if (userData.clearedNotificationIds === undefined) updateUserDoc({ clearedNotificationIds: [] });
      }
  }, [user, userData, updateUserDoc]); 

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
    if (!user) return; 
    
    const generateAndCheckNotifications = () => {
        const now = new Date();
        const generated: Notification[] = [];
        
        const todayStr = getLocalISODate();

        if (notificationSettings.enabled && notificationSettings.taskReminders) {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);

          tasks.forEach(task => {
            if (task.status !== 'Concluída' && task.dueDate) {
              const dueDate = new Date(task.dueDate);
              const startOfDueDate = new Date(dueDate);
              startOfDueDate.setHours(0, 0, 0, 0);

              if (startOfDueDate.getTime() < startOfToday.getTime()) {
                  generated.push({
                      id: `${task.id}-overdue`,
                      taskId: task.id,
                      taskTitle: task.title,
                      message: `Atrasada desde ${dueDate.toLocaleDateString('pt-BR')}`,
                      notifyAt: task.dueDate,
                  });
              } else {
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
        
        if (notificationSettings.enabled && notificationSettings.habitReminders) {
            habits.forEach(habit => {
                const isCompleted = (habit.type === 'manual' && habit.lastCompletedDate === todayStr) || (habit.overrideDate === todayStr);
                if (habit.reminderTime && !isCompleted) {
                    const [hours, minutes] = habit.reminderTime.split(':').map(Number);
                    const reminderDateTime = new Date();
                    reminderDateTime.setHours(hours, minutes, 0, 0);

                    if (now >= reminderDateTime) {
                        generated.push({
                            id: `habit-${habit.id}-${todayStr}`,
                            taskId: `habit-${habit.id}`,
                            taskTitle: habit.title,
                            message: `Lembrete de rotina diária.`,
                            notifyAt: reminderDateTime.toISOString(),
                        });
                    }
                }
            });
        }

        const sortedGenerated = generated.sort((a, b) => new Date(a.notifyAt).getTime() - new Date(b.notifyAt).getTime()).filter(n => !clearedNotificationIds.includes(n.id));
        
        if (!isFirstLoad.current) {
            const currentNotificationIds = new Set(notificationsRef.current.map(n => n.id));
            const newNotifications = sortedGenerated.filter(n => !currentNotificationIds.has(n.id));

            if (newNotifications.length > 0) {
                const unreadNewNotifications = newNotifications.filter(n => !readNotificationIds.includes(n.id));

                const toastsToAdd = unreadNewNotifications.map((n): NotificationToastDataType | null => {
                    const taskForToast = tasks.find(t => t.id === n.taskId);
                    const categoryForToast = taskForToast ? categories.find(c => c.id === taskForToast.categoryId) : undefined;
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
            isFirstLoad.current = false;
        }
        
        setNotifications(sortedGenerated);
    };

    generateAndCheckNotifications();
    const interval = setInterval(generateAndCheckNotifications, 5000);

    return () => clearInterval(interval);
  }, [tasks, categories, notificationSettings, user, readNotificationIds, clearedNotificationIds, habits, getLocalISODate]);


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
      return newRecents.slice(0, 10);
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
            type: 'creation',
            timestamp: new Date().toISOString(),
            user: userName,
            note: 'Usuário criou esse projeto'
        }]
    } as Project;

    addProjectFire(projectWithActivity);
    addToast({ title: 'Projeto Criado', subtitle: 'Projeto adicionado com sucesso.', type: 'success' });
  };

  const handleEditProject = (projectId: string, updates: Partial<Project>) => {
    updateProjectFire(projectId, updates);
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
            removeProjectFire(projectId);
            const tasksToUnlink = tasks.filter(t => t.projectId === projectId).map(t => t.id);
            if (tasksToUnlink.length > 0) {
               updateBatchFire(tasksToUnlink, { projectId: null } as any);
            }
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
            removeTaskFire(taskId);
            
            if (selectedTask?.id === taskId) {
              setCurrentView(previousView);
              setSelectedTask(null);
            }
            // Atualizar activity do projeto no Firestore
            if (taskToDelete?.projectId) {
                const projectToUpdate = projects.find(p => p.id === taskToDelete.projectId);
                if (projectToUpdate) {
                    const activity: Activity = {
                        id: `proj-act-${Date.now()}`,
                        type: 'project',
                        action: 'removed',
                        timestamp: new Date().toISOString(),
                        user: userName,
                        taskTitle: taskToDelete.title
                    };
                    const updatedActivity = [...(projectToUpdate.activity || []), activity];
                    updateProjectFire(projectToUpdate.id, { activity: updatedActivity });
                    
                    if (selectedProject?.id === projectToUpdate.id) {
                         setSelectedProject(prev => prev ? { ...prev, activity: updatedActivity } : null);
                    }
                }
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
        isPinned: false, 
    };
    setInitialDataForSheet(duplicatedData);
    setIsSheetOpen(true);
};

  const handlePinTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        updateTaskFire(taskId, { isPinned: !task.isPinned });
    }
  };

  const handlePinProject = (project: Project) => {
    const newStatus = !(project.isPinned || false);
    updateProjectFire(project.id, { isPinned: newStatus });
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
    addTaskFire(task);
    
    if (task.projectId) {
        const projectToUpdate = projects.find(p => p.id === task.projectId);
        if (projectToUpdate) {
            const activity: Activity = {
                id: `proj-act-${Date.now()}`,
                type: 'project',
                action: 'added',
                timestamp: new Date().toISOString(),
                user: userName,
                taskTitle: task.title
            };
            const updatedActivity = [...(projectToUpdate.activity || []), activity];
            updateProjectFire(projectToUpdate.id, { activity: updatedActivity });
            
            if (selectedProject?.id === projectToUpdate.id) {
                setSelectedProject(prev => prev ? { ...prev, activity: updatedActivity } : null);
            }
        }
    }

    setIsSheetOpen(false);
    addToast({ title: 'Tarefa Criada', subtitle: 'Sua tarefa foi adicionada com sucesso.', type: 'success' });
    handleSelectTask(task);
  };
  
  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    const currentTask = tasks.find(t => t.id === taskId);
    
    if (updates.status === 'Concluída' && currentTask?.status !== 'Concluída' && appSettings.enableAnimations) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
    }

    updateTaskFire(taskId, updates);

    if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
    }

    if (currentTask && 'projectId' in updates && updates.projectId !== currentTask.projectId) {
        const oldProjectId = currentTask.projectId;
        const newProjectId = updates.projectId;

        // Remover do antigo
        if (oldProjectId) {
            const oldProject = projects.find(p => p.id === oldProjectId);
            if (oldProject) {
                const activity: Activity = {
                    id: `proj-act-unlink-${Date.now()}-${Math.random()}`,
                    type: 'project',
                    action: 'removed',
                    timestamp: new Date().toISOString(),
                    user: userName,
                    taskTitle: currentTask.title
                };
                const updatedActivity = [...(oldProject.activity || []), activity];
                updateProjectFire(oldProject.id, { activity: updatedActivity });
                if (selectedProject?.id === oldProject.id) setSelectedProject(prev => prev ? {...prev, activity: updatedActivity} : null);
            }
        }

        // Adicionar no novo
        if (newProjectId) {
            const newProject = projects.find(p => p.id === newProjectId);
            if (newProject) {
                const activity: Activity = {
                    id: `proj-act-link-${Date.now()}-${Math.random()}`,
                    type: 'project',
                    action: 'added',
                    timestamp: new Date().toISOString(),
                    user: userName,
                    taskTitle: currentTask.title
                };
                const updatedActivity = [...(newProject.activity || []), activity];
                updateProjectFire(newProject.id, { activity: updatedActivity });
                if (selectedProject?.id === newProject.id) setSelectedProject(prev => prev ? {...prev, activity: updatedActivity} : null);
            }
        }
    }

    if (currentTask && updates.status && updates.status !== currentTask.status && currentTask.projectId && (!('projectId' in updates) || updates.projectId === currentTask.projectId)) {
         const projectToUpdate = projects.find(p => p.id === currentTask.projectId);
         if (projectToUpdate) {
            const activity: Activity = {
                id: `proj-act-status-${Date.now()}-${Math.random()}`,
                type: 'status_change',
                timestamp: new Date().toISOString(),
                user: userName,
                from: currentTask.status,
                to: updates.status,
                taskTitle: currentTask.title
            };
            const updatedActivity = [...(projectToUpdate.activity || []), activity];
            updateProjectFire(projectToUpdate.id, { activity: updatedActivity });
            if (selectedProject?.id === projectToUpdate.id) setSelectedProject(prev => prev ? {...prev, activity: updatedActivity} : null);
         }
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

    // Atualiza cada tarefa individualmente
    taskIds.forEach(id => {
        const task = tasks.find(t => t.id === id);
        if (task && task.status !== newStatus) {
            const activityEntry = {
                id: `act-${Date.now()}-${Math.random()}`,
                type: 'status_change' as const,
                timestamp: now,
                from: task.status,
                to: newStatus,
                user: userName
            };
            updateTaskFire(id, { status: newStatus, activity: [...task.activity, activityEntry] });
        }
    });

    // Agrupa para atualizar o histórico dos projetos
    const tasksToUpdate = tasks.filter(t => taskIds.includes(t.id) && t.status !== newStatus);
    const groups: Record<string, Record<Status, string[]>> = {};
    
    tasksToUpdate.forEach(task => {
        if (!task.projectId) return;
        if (!groups[task.projectId]) groups[task.projectId] = {} as any;
        if (!groups[task.projectId][task.status]) groups[task.projectId][task.status] = [];
        groups[task.projectId][task.status].push(task.title);
    });

    Object.keys(groups).forEach(projectId => {
        const projectToUpdate = projects.find(p => p.id === projectId);
        if (!projectToUpdate) return;

        let newActivities: Activity[] = [];
        const fromStatuses = Object.keys(groups[projectId]) as Status[];
        
        fromStatuses.forEach(fromStatus => {
            const taskTitles = groups[projectId][fromStatus];
            newActivities.push({
                id: `proj-act-bulk-${Date.now()}-${Math.random()}`,
                type: 'status_change',
                timestamp: now,
                user: userName,
                from: fromStatus,
                to: newStatus,
                count: taskTitles.length,
                affectedTasks: taskTitles,
            });
        });

        const updatedActivity = [...(projectToUpdate.activity || []), ...newActivities];
        updateProjectFire(projectId, { activity: updatedActivity });

        if (selectedProject?.id === projectId) {
            setSelectedProject(prev => prev ? { ...prev, activity: updatedActivity } : null);
        }
    });
  };

  const handleBulkDelete = (taskIds: string[]) => {
    const tasksToDelete = tasks.filter(t => taskIds.includes(t.id));
    
    // Atualiza histórico de projetos antes de deletar
    tasksToDelete.forEach(task => {
        if (task.projectId) {
            const projectToUpdate = projects.find(p => p.id === task.projectId);
            if (projectToUpdate) {
                const activity: Activity = {
                    id: `proj-act-${Date.now()}-${Math.random()}`,
                    type: 'project', 
                    action: 'removed',
                    timestamp: new Date().toISOString(),
                    user: userName,
                    taskTitle: task.title
                };
                const updatedActivity = [...(projectToUpdate.activity || []), activity];
                updateProjectFire(task.projectId, { activity: updatedActivity });
                
                if (selectedProject?.id === task.projectId) {
                    setSelectedProject(prev => prev ? { ...prev, activity: updatedActivity } : null);
                }
            }
        }
    });

    deleteBatchFire(taskIds);
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
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                const updatedActivity = task.activity.filter(r => r.id !== reminderId);
                updateTaskFire(taskId, { activity: updatedActivity });
            }
        }
    });
  };
  
  const handleDeleteActivityRequest = (taskId: string, activityId: string, type: Activity['type']) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const onConfirmDelete = () => {
            updateTaskFire(taskId, { activity: task.activity.filter(act => act.id !== activityId) });
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

    const task = tasks.find(t => t.id === notification.taskId);
    if (task) {
        updateTaskFire(notification.taskId, { activity: [...task.activity, newReminderActivity] });
    }

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
      const todayStr = getLocalISODate();

      const wasTaskCompletedToday = tasks.some(task => {
          const completionActivity = [...task.activity]
              .reverse()
              .find(act => act.type === 'status_change' && act.to === 'Concluída');
          
          if (!completionActivity) return false;
          
          const actDate = new Date(completionActivity.timestamp);
          const offset = actDate.getTimezoneOffset() * 60000;
          const actDateStr = new Date(actDate.getTime() - offset).toISOString().split('T')[0];

          return actDateStr === todayStr;
      });

      return habits.map(habit => {
          let isCompleted = false;
          if (habit.overrideDate === todayStr) {
              isCompleted = false;
          } else if (habit.lastCompletedDate === todayStr) {
              isCompleted = true;
          } else if (habit.type === 'auto-task-completion') {
              isCompleted = wasTaskCompletedToday;
          } else {
              isCompleted = false;
          }
          return { ...habit, isCompleted };
      });
  }, [tasks, habits, getLocalISODate]);

  const handleToggleHabit = (habitId: string) => {
      const todayStr = getLocalISODate();

      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const isCurrentlyCompleted = habitsWithStatus.find(hs => hs.id === habitId)?.isCompleted ?? false;
      let updates = {};

      if (isCurrentlyCompleted) {
          if (habit.type === 'manual') {
              updates = { lastCompletedDate: null }; 
          } else { 
              updates = { overrideDate: todayStr, lastCompletedDate: null };
          }
      } else {
          updates = { lastCompletedDate: todayStr, overrideDate: null };
      }
      
      updateHabitFire(habitId, updates as any);
  };
  
  const handleMarkHabitComplete = (habitId: string) => {
    const todayStr = getLocalISODate();

    updateHabitFire(habitId, { lastCompletedDate: todayStr, overrideDate: null } as any);
    
    const notificationId = `habit-${habitId}-${todayStr}`;
    setReadNotificationIds(prev => [...new Set([...prev, notificationId])]);
    addToast({ title: 'Rotina Concluída!', type: 'success' });
  };
  
  const handleMarkAllHabitsComplete = () => {
    const todayStr = getLocalISODate();
    
    habits.forEach(h => {
        const habitStatus = habitsWithStatus.find(hs => hs.id === h.id);
        if (habitStatus && !habitStatus.isCompleted) {
             updateHabitFire(h.id, { lastCompletedDate: todayStr, overrideDate: null } as any);
        }
    });
    addToast({ title: 'Rotinas Concluídas!', type: 'success' });
  };

  const handleSaveHabits = (updatedHabits: Habit[]) => {
      const updatedIds = new Set(updatedHabits.map(h => h.id));
      const habitsToDelete = habits.filter(h => !updatedIds.has(h.id));
      habitsToDelete.forEach(h => removeHabitFire(h.id));

      updatedHabits.forEach((habitFromModal, index) => {
          
          const habitToSave = { ...habitFromModal, order: index };

          const existing = habits.find(h => h.id === habitToSave.id);
          
          if (existing) {
              const hasChanged = 
                  existing.title !== habitToSave.title ||
                  existing.reminderTime !== habitToSave.reminderTime ||
                  existing.order !== habitToSave.order; 

              if (hasChanged) {
                  updateHabitFire(habitToSave.id, habitToSave);
              }
          } else {
              addHabitFire(habitToSave);
          }
      });

      setIsHabitSettingsOpen(false);
      addToast({ title: 'Rotinas Salvas', subtitle: 'Suas alterações foram salvas com sucesso.', type: 'success' });
  };

  const handleReorderHabits = (fromIndex: number, toIndex: number) => {
      const reorderedList = [...habits];
      
      const [movedItem] = reorderedList.splice(fromIndex, 1);
      reorderedList.splice(toIndex, 0, movedItem);

      reorderedList.forEach((habit, index) => {
          if (habit.order !== index) {
              updateHabitFire(habit.id, { order: index } as any);
          }
      });
  };

  const isFixedLayout = ['dashboard', 'projectDetail', 'taskDetail', 'calendar', 'reminders', 'list', 'settings'].includes(currentView);

  const renderView = () => {
    const commonProps = {
        tasks: filteredTasks,
        categories,
        tags,
        onSelectTask: handleSelectTask,
        onToggleComplete: handleToggleComplete,
        appSettings 
    };
    switch (currentView) {
      case 'dashboard':
        return <DashboardView {...commonProps} habits={habitsWithStatus} onToggleHabit={handleToggleHabit} setAppSettings={handleUpdateAppSettings} onReorderHabits={handleReorderHabits} />;
      case 'calendar':
        return <CalendarView {...commonProps} />;
      case 'list':
        return <ListView {...commonProps} setTasks={() => {}} onStatusChange={handleTaskStatusChange} onBulkStatusChange={handleBulkStatusChange} onBulkDelete={handleBulkDelete} projects={projects} />;
      case 'reminders':
        return <RemindersView tasks={tasks} categories={categories} onSelectTask={handleSelectTask} onDeleteReminderRequest={handleDeleteReminderRequest} appSettings={appSettings}/>;
      case 'reports':
        return <ReportsView tasks={tasks} tags={tags} categories={categories} onSelectTask={handleSelectTask} projects={projects} appSettings={appSettings}/>;
      case 'projects':
        return <ProjectsView projects={projects} tasks={tasks} onAddProject={handleAddProject} onSelectProject={handleSelectProject} onPinProject={handlePinProject} />;
      case 'settings':
        return <SettingsView 
            // --- CATEGORIAS ---
            categories={categories} 
            onAddCategory={(newCat) => {
                const { icon, ...catData } = newCat; 
                addCategoryFire(catData as Category);

                const defaultIds = ['cat-1', 'cat-2', 'cat-3'];
                const defaults = categories.filter(c => defaultIds.includes(c.id));
                
                defaults.forEach(def => {
                    const { icon: defIcon, ...defData } = def;
                    addCategoryFire(defData as Category);
                });

                addToast({ title: 'Categoria Adicionada', type: 'success' });
            }}
            onDeleteCategory={(id) => {
                removeCategoryFire(id);
                addToast({ title: 'Categoria Removida', type: 'success' });
            }}

            // --- TAGS / PRIORIDADES ---
            tags={tags} 
            onAddTag={(newTag) => {
                addTagFire(newTag);

                const defaultTagIds = ['tag-1', 'tag-2', 'tag-3'];
                const defaultTags = tags.filter(t => defaultTagIds.includes(t.id));
                
                defaultTags.forEach(defTag => {
                    addTagFire(defTag);
                });

                addToast({ title: 'Prioridade Adicionada', type: 'success' });
            }}
            onDeleteTag={(id) => {
                removeTagFire(id);
                addToast({ title: 'Prioridade Removida', type: 'success' });
            }}

            // --- CONFIGURAÇÕES GERAIS ---
            notificationSettings={notificationSettings} 
            setNotificationSettings={handleUpdateNotificationSettings}
            appSettings={appSettings} 
            setAppSettings={handleUpdateAppSettings}
            
            // --- CONTA ---
            onLogout={handleCompleteLogout} // [MODIFICADO] Usa o logout seguro
            userName={userName}
            setUserName={handleUpdateUserName} // [MODIFICADO] Atualiza no Firestore
        />;
      case 'projectDetail':
        return selectedProject ? (
            <ProjectDetailView 
                project={selectedProject}
                tasks={tasks.filter(t => t.projectId === selectedProject.id)}
                allTasks={tasks} 
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
                setAppSettings={handleUpdateAppSettings}
            />
        ) : <ProjectsView projects={projects} tasks={tasks} onAddProject={handleAddProject} onSelectProject={handleSelectProject} onPinProject={handlePinProject} />;
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
            setAppSettings={handleUpdateAppSettings}
        /> : null;
      default:
        return <DashboardView {...commonProps} habits={habitsWithStatus} onToggleHabit={handleToggleHabit} setAppSettings={handleUpdateAppSettings} onReorderHabits={handleReorderHabits} />;
    }
  };
  
  if (authLoading) {
      return (
          <div className="flex h-screen items-center justify-center bg-ice-blue dark:bg-[#0D1117]">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
      );
  }

  if (!user) {
    return <LoginScreen login={async () => false} />;
  }

  // [MODIFICADO] Previne "Ghost Data" (flash de dados antigos)
  // Só renderiza o app se tivermos o userData carregado.
  if (user && !userData) {
      return (
          <div className="flex h-screen items-center justify-center bg-ice-blue dark:bg-[#0D1117]">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-ice-blue dark:bg-[#0D1117] text-gray-800 dark:text-gray-200 font-sans p-4">

      {/* Onboarding Wizard Overlay */}
      {/* Verifica se userData está carregado para não mostrar o wizard desnecessariamente */}
      <OnboardingWizard 
          isOpen={userData !== undefined && !hasCompletedOnboarding}
          userName={userName}
          setUserName={handleUpdateUserName} // [MODIFICADO] Salva no Firestore
          appSettings={appSettings}
          setAppSettings={handleUpdateAppSettings}
          theme={theme}
          setTheme={setTheme}
          onComplete={handleSyncOnboardingData}
      />

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
          onLogout={handleCompleteLogout} // [MODIFICADO] Logout seguro
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