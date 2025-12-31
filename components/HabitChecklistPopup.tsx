import React from 'react';
import type { Habit } from '../types';
import { CheckCircleIcon, SettingsIcon, CheckIcon } from './icons';

interface HabitWithStatus extends Habit {
    isCompleted: boolean;
}

interface HabitChecklistPopupProps {
    isOpen: boolean;
    onClose: () => void;
    habitsWithStatus: HabitWithStatus[];
    onToggleHabit: (habitId: string) => void;
    onMarkAllComplete: () => void;
    onOpenSettings: () => void;
}

const HabitChecklistPopup: React.FC<HabitChecklistPopupProps> = ({ isOpen, onClose, habitsWithStatus, onToggleHabit, onMarkAllComplete, onOpenSettings }) => {
    if (!isOpen) return null;

    const hasAnyIncompleteHabits = habitsWithStatus.some(h => !h.isCompleted);

    const handleOpenSettings = () => {
        onOpenSettings();
        onClose();
    };
    
    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-[#21262D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-20 overflow-hidden animate-scale-in">
            <div className="p-3 font-semibold border-b border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200">
                Checklist Diário
            </div>
            {habitsWithStatus.length > 0 ? (
                <ul className="max-h-80 overflow-y-auto p-1">
                    {habitsWithStatus.map(habit => {
                        return (
                            <li key={habit.id}>
                                <button 
                                    onClick={() => onToggleHabit(habit.id)}
                                    className="w-full flex items-center gap-3 p-2.5 text-left rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
                                >
                                    {habit.isCompleted ? (
                                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <div className="w-5 h-5 flex-shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"></div>
                                    )}
                                    <span className={`text-sm font-medium flex-grow ${habit.isCompleted ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                        {habit.title}
                                    </span>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            ) : (
                <p className="p-4 text-center text-sm text-gray-500">Nenhum hábito configurado.</p>
            )}
            <div className="p-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                 {hasAnyIncompleteHabits ? (
                    <button 
                        onClick={onMarkAllComplete}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                        <CheckIcon className="w-4 h-4" />
                        Marcar todas
                    </button>
                 ) : <div />}
                <button 
                    onClick={handleOpenSettings}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/40 transition-colors"
                >
                    <SettingsIcon className="w-4 h-4" />
                    Configurar
                </button>
            </div>
        </div>
    );
};

export default HabitChecklistPopup;