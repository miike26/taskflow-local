import React, { useState, useEffect, useRef } from 'react';
import type { Habit, HabitTemplate } from '../types';
import { XIcon, TrashIcon, PlusIcon, ClockIcon, DragHandleIcon, ArrowPathIcon, InformationCircleIcon } from './icons';

interface HabitSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    habits: Habit[];
    templates: HabitTemplate[];
    onSave: (habits: Habit[]) => void;
}

const HabitSettingsModal: React.FC<HabitSettingsModalProps> = ({ isOpen, onClose, habits, templates, onSave }) => {
    const [localHabits, setLocalHabits] = useState<Habit[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [newHabitTitle, setNewHabitTitle] = useState('');
    const [editingTimeForHabitId, setEditingTimeForHabitId] = useState<string | null>(null);
    
    const draggedHabitRef = useRef<{ id: string; index: number } | null>(null);


    useEffect(() => {
        if (isOpen) {
            setLocalHabits(JSON.parse(JSON.stringify(habits))); // Deep copy
        } else {
            // Reset states when modal is fully closed to prevent them from persisting
            setShowConfirmation(false);
            setHasUnsavedChanges(false);
        }
    }, [isOpen, habits]);

    useEffect(() => {
        if(isOpen) {
            setHasUnsavedChanges(JSON.stringify(localHabits) !== JSON.stringify(habits));
        }
    }, [localHabits, habits, isOpen]);
    
    if (!isOpen) return null;

    const handleAddManualHabit = () => {
        if (!newHabitTitle.trim()) return;
        const newHabit = {
            id: `habit-local-${Date.now()}`,
            title: newHabitTitle.trim(),
            type: 'manual' as const,
        };
        setLocalHabits(prev => [...prev, newHabit]);
        setNewHabitTitle('');
    };

    const handleAddFromTemplate = (template: HabitTemplate) => {
        const newHabit = {
            id: `habit-local-${Date.now()}`,
            title: template.title,
            type: template.type,
        };
        setLocalHabits(prev => [...prev, newHabit]);
    };
    
    const handleUpdateHabit = (habitId: string, updates: Partial<Habit>) => {
      setLocalHabits(prev => prev.map(h => h.id === habitId ? { ...h, ...updates } : h));
    };

    const handleDeleteHabit = (habitId: string) => {
        setLocalHabits(prev => prev.filter(h => h.id !== habitId));
    };
    
    const isTemplateAdded = (template: HabitTemplate) => {
        return localHabits.some(h => h.title === template.title);
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, habit: Habit, index: number) => {
        draggedHabitRef.current = { id: habit.id, index };
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
        draggedHabitRef.current = null;
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
        e.preventDefault();
        if (!draggedHabitRef.current || draggedHabitRef.current.index === targetIndex) {
            return;
        }

        const newHabits = [...localHabits];
        const draggedItemIndex = draggedHabitRef.current.index;
        
        const [draggedItem] = newHabits.splice(draggedItemIndex, 1);
        newHabits.splice(targetIndex, 0, draggedItem);
        
        draggedHabitRef.current.index = targetIndex;
        
        setLocalHabits(newHabits);
    };


    const handleCloseRequest = () => {
        if (hasUnsavedChanges) {
            setShowConfirmation(true);
        } else {
            onClose();
        }
    };

    const handleSaveChanges = () => {
        onSave(localHabits);
    };
    
    const ConfirmationDialog = () => (
      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
          <div className="bg-white dark:bg-[#21262D] rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Descartar Alterações?</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Você tem alterações não salvas. Tem certeza que deseja descartá-las?</p>
              <div className="mt-6 flex justify-end space-x-3">
                  <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 bg-transparent text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 font-medium">Cancelar</button>
                  <button onClick={() => { setShowConfirmation(false); onClose(); }} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold">Descartar</button>
                  <button onClick={handleSaveChanges} className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 font-semibold">Salvar e Fechar</button>
              </div>
          </div>
      </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in" onClick={handleCloseRequest}>
            <div 
                className="relative w-full max-w-4xl bg-ice-blue dark:bg-[#161B22] rounded-2xl shadow-2xl flex flex-col h-auto max-h-[90vh] overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {showConfirmation && <ConfirmationDialog />}
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configurar Checklist de Rotinas</h2>
                    <button onClick={handleCloseRequest} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Fechar">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0 overflow-y-auto">
                    {/* My Habits Section */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Minhas Rotinas</h3>
                        <div className="flex-grow space-y-1 pr-2 overflow-y-auto bg-white dark:bg-[#21262D] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                            {localHabits.length > 0 ? localHabits.map((habit, index) => (
                                <div 
                                    key={habit.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, habit, index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    className="flex items-center justify-between p-2.5 bg-ice-blue dark:bg-[#0D1117] rounded-md group transition-all duration-200"
                                    style={{ transform: 'translate(0, 0)' }}
                                >
                                    <div className="flex items-center gap-2">
                                        <DragHandleIcon className="w-5 h-5 text-gray-400 cursor-grab"/>
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{habit.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {editingTimeForHabitId === habit.id ? (
                                            <input
                                                type="time"
                                                autoFocus
                                                value={habit.reminderTime || ''}
                                                onChange={(e) => handleUpdateHabit(habit.id, { reminderTime: e.target.value || undefined })}
                                                onBlur={() => setEditingTimeForHabitId(null)}
                                                className="bg-white dark:bg-gray-800 rounded-md p-1 border border-primary-500 text-sm w-24 focus:outline-none"
                                            />
                                        ) : (
                                            <button 
                                            onClick={() => setEditingTimeForHabitId(habit.id)} 
                                            className={`p-1.5 rounded-full transition-colors ${habit.reminderTime ? 'text-primary-500 bg-primary-100 dark:bg-primary-900/50' : 'text-cyan-500'}`}
                                            title={habit.reminderTime ? `Lembrete às ${habit.reminderTime}` : "Adicionar lembrete"}
                                            >
                                                <ClockIcon className="w-4 h-4"/>
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteHabit(habit.id)} className="text-gray-400 hover:text-red-500 p-1.5">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-center text-gray-500 py-8">Nenhuma rotina adicionada.</p>}
                        </div>
                        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">Adicionar Rotina Manual</h4>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={newHabitTitle}
                                    onChange={e => setNewHabitTitle(e.target.value)}
                                    placeholder="Ex: Fazer uma caminhada"
                                    className="block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 p-2.5 transition-colors duration-200 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleAddManualHabit} className="w-full bg-primary-500 text-white font-semibold p-2.5 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                                        <PlusIcon className="w-5 h-5"/> Adicionar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Templates Section */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Modelos Prontos</h3>
                        <div className="flex-grow space-y-3 pr-2 overflow-y-auto">
                            {templates.map(template => (
                                <div key={template.id} className="bg-white dark:bg-[#21262D] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{template.title}</h4>
                                                {template.type === 'auto-task-completion' && (
                                                    <span title="Este hábito é concluído automaticamente com base em suas ações.">
                                                        <ArrowPathIcon className="w-4 h-4 text-primary-500" />
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleAddFromTemplate(template)}
                                            disabled={isTemplateAdded(template)}
                                            className="ml-4 flex-shrink-0 bg-primary-500 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-primary-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isTemplateAdded(template) ? 'Adicionado' : 'Adicionar'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="p-4 bg-white dark:bg-[#21262D] border-t border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <p className="flex items-center gap-2 text-base text-gray-500 dark:text-gray-400">
                        <InformationCircleIcon className="w-5 h-5" />
                        As rotinas são desmarcadas automaticamente todos os dias.
                    </p>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={handleCloseRequest} className="px-4 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-500 font-medium transition-colors">Cancelar</button>
                        <button type="button" onClick={handleSaveChanges} className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold transition-all duration-200 shadow-sm" disabled={!hasUnsavedChanges}>Salvar Alterações</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default HabitSettingsModal;
