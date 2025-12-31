import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Notification, Task, Category } from '../types';
import { BellIcon, XIcon, ClipboardDocumentCheckIcon, CheckCircleIcon } from './icons';

interface NotificationToastProps {
  notification: Notification;
  task?: Task;
  category?: Category;
  notificationKey: string;
  onClose: (key: string) => void;
  onMarkHabitComplete: (habitId: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, task, category, notificationKey, onClose, onMarkHabitComplete }) => {
  const isHabitReminder = notification.taskId.startsWith('habit-');
  const CategoryIcon = isHabitReminder ? ClipboardDocumentCheckIcon : category?.icon;
  const categoryName = isHabitReminder ? 'Rotina' : category?.name;

  const [isExiting, setIsExiting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleClose = useCallback(() => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }
    setIsExiting(true);
    setTimeout(() => {
      onClose(notificationKey);
    }, 500); // Wait for exit animation
  }, [notificationKey, onClose]);

  useEffect(() => {
    timerRef.current = window.setTimeout(handleClose, 7000);
    return () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };
  }, [handleClose]);

  const handleCompleteHabit = () => {
    const habitId = notification.taskId.replace('habit-', '');
    onMarkHabitComplete(habitId);
    setIsCompleted(true);
  };

  return (
    <div className={`group w-96 rounded-xl shadow-2xl bg-white dark:bg-[#2E343A] relative overflow-hidden ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}>
        <div className={`absolute top-0 left-0 h-full w-2/3 bg-gradient-to-r from-primary-500/20 to-transparent opacity-40 dark:opacity-50`}></div>
        <div className="relative z-10 p-4">
            <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 p-1.5 rounded-full bg-primary-500`}>
                    <BellIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-grow min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{notification.taskTitle}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {CategoryIcon && <CategoryIcon className="w-4 h-4" />}
                        <span>{categoryName}</span>
                    </div>
                </div>
            </div>
             {isHabitReminder && (
                <div className="flex justify-end pt-2">
                    <button 
                        onClick={handleCompleteHabit} 
                        disabled={isCompleted}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-all duration-300 ${
                            isCompleted
                            ? 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900/50 cursor-default'
                            : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/40'
                        }`}
                    >
                        {isCompleted ? <CheckCircleIcon className="w-4 h-4"/> : null}
                        {isCompleted ? 'Concluída' : 'Marcar como concluída'}
                    </button>
                </div>
            )}
        </div>
         <button 
            onClick={handleClose} 
            className="absolute top-2 right-2 z-20 p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:text-gray-500 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Fechar notificação"
        >
            <XIcon className="w-4 h-4" />
        </button>
    </div>
  );
};

export default NotificationToast;