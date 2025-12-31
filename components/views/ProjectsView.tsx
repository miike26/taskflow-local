
import React, { useState, useMemo } from 'react';
import type { Project, Task } from '../../types';
import { PlusIcon, FolderIcon, CheckCircleIcon, RocketLaunchIcon, CodeBracketIcon, GlobeAltIcon, StarIcon, HeartIcon, ChartPieIcon, PinIcon } from '../icons';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  onAddProject: (project: Project) => void;
  onSelectProject: (project: Project) => void;
}

const PROJECT_ICONS: Record<string, React.FC<{className?: string}>> = {
    folder: FolderIcon,
    rocket: RocketLaunchIcon,
    code: CodeBracketIcon,
    globe: GlobeAltIcon,
    star: StarIcon,
    heart: HeartIcon,
    chart: ChartPieIcon
};

const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, tasks, onAddProject, onSelectProject }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [hideCompleted, setHideCompleted] = useState(false);
    
    // Local state for pinned projects to avoid changing global Project type
    const [pinnedProjectIds, setPinnedProjectIds] = useLocalStorage<string[]>('pinned_projects', []);

    const handleCreateProject = () => {
        if (!newProjectName.trim()) return;

        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name: newProjectName.trim(),
            description: newProjectDesc.trim(),
            color: 'bg-blue-500', // Default color for now
            createdAt: new Date().toISOString(),
            activity: [],
        };

        onAddProject(newProject);
        setNewProjectName('');
        setNewProjectDesc('');
        setIsCreating(false);
    };

    const togglePin = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        setPinnedProjectIds(prev => 
            prev.includes(projectId) 
                ? prev.filter(id => id !== projectId) 
                : [...prev, projectId]
        );
    };

    const processedProjects = useMemo(() => {
        // 1. Calculate stats for all projects first
        const projectsWithStats = projects.map(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const completedTasks = projectTasks.filter(t => t.status === 'Concluída').length;
            const totalTasks = projectTasks.length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            const isCompleted = totalTasks > 0 && completedTasks === totalTasks;
            
            return {
                ...project,
                progress,
                isCompleted,
                taskCount: totalTasks,
                isPinned: pinnedProjectIds.includes(project.id)
            };
        });

        // 2. Filter
        let filtered = projectsWithStats;
        if (hideCompleted) {
            filtered = filtered.filter(p => !p.isCompleted);
        }

        // 3. Sort
        return filtered.sort((a, b) => {
            // Priority 1: Pinned
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            // Priority 2: Completed status (Completed goes to bottom)
            if (a.isCompleted && !b.isCompleted) return 1;
            if (!a.isCompleted && b.isCompleted) return -1;

            // Priority 3: Progress (Descending - Higher progress first for active projects)
            if (a.progress !== b.progress) return b.progress - a.progress;

            // Priority 4: Alphabetical
            return a.name.localeCompare(b.name);
        });

    }, [projects, tasks, hideCompleted, pinnedProjectIds]);

    const checkboxClass = "appearance-none h-4 w-4 rounded-md border-2 border-gray-300 dark:border-gray-600 checked:bg-primary-500 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 transition-colors";

    return (
        <div className="p-4 space-y-6 flex flex-col h-full">
            <div className="flex flex-col gap-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Gerencie e acompanhe o progresso de suas iniciativas.
                </p>
                {/* Controls aligned to the left */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-600 transition-all shadow-md hover:shadow-lg hover:shadow-primary-400/30 duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-primary-400 dark:hover:ring-offset-[#0D1117]"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Novo Projeto
                    </button>
                    
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors select-none">
                        <input 
                            type="checkbox" 
                            checked={hideCompleted} 
                            onChange={e => setHideCompleted(e.target.checked)} 
                            className={checkboxClass}
                        />
                        Ocultar concluídos
                    </label>
                </div>
            </div>

            {isCreating && (
                <div className="p-6 bg-white dark:bg-[#161B22] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 animate-fade-in max-w-2xl w-full">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Criar Novo Projeto</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Nome do Projeto</label>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 p-3 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none transition-all"
                                placeholder="Ex: Redesign do Site"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Descrição (Opcional)</label>
                            <textarea
                                value={newProjectDesc}
                                onChange={(e) => setNewProjectDesc(e.target.value)}
                                className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 p-3 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none transition-all resize-none"
                                placeholder="Qual o objetivo deste projeto?"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateProject}
                                disabled={!newProjectName.trim()}
                                className="px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-md"
                            >
                                Criar Projeto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-6">
                {processedProjects.map((project) => {
                    const ProjectIcon = project.icon && PROJECT_ICONS[project.icon] ? PROJECT_ICONS[project.icon] : FolderIcon;
                    const textColorClass = project.color.replace('bg-', 'text-');

                    return (
                        <div
                            key={project.id}
                            onClick={() => onSelectProject(project)}
                            className={`
                                group relative flex flex-col justify-between h-full
                                bg-white dark:bg-[#161B22] rounded-2xl p-6
                                border border-gray-200 dark:border-gray-800
                                cursor-pointer transition-all duration-300
                                hover:shadow-xl hover:-translate-y-1 hover:border-transparent
                                ring-2 ring-transparent hover:ring-${project.color.replace('bg-', '')}
                            `}
                        >
                            {/* Header: Icon & Count & Pin */}
                            <div className="flex justify-between items-start mb-5">
                                <div className={`
                                    w-14 h-14 rounded-2xl flex items-center justify-center 
                                    ${project.color} bg-opacity-10 dark:bg-opacity-10 
                                    text-opacity-100 transition-transform duration-500 group-hover:scale-110
                                `}>
                                    <ProjectIcon className={`w-7 h-7 ${textColorClass}`} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => togglePin(e, project.id)}
                                        className={`
                                            p-1.5 rounded-lg transition-all duration-200
                                            ${project.isPinned 
                                                ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/30 opacity-100' 
                                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100'
                                            }
                                        `}
                                        title={project.isPinned ? "Desafixar projeto" : "Fixar projeto"}
                                    >
                                        <PinIcon className="w-4 h-4 transform rotate-45" isPinned={project.isPinned} />
                                    </button>
                                    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700">
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                            {project.taskCount} {project.taskCount === 1 ? 'tarefa' : 'tarefas'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Body: Content */}
                            <div className="flex-1 mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                                    {project.description || 'Sem descrição definida.'}
                                </p>
                            </div>
                            
                            {/* Footer: Progress */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Progresso</span>
                                    <span className={`text-sm font-bold ${textColorClass}`}>
                                        {Math.round(project.progress)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className={`h-full ${project.color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]`} 
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {processedProjects.length === 0 && !isCreating && (
                     <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <FolderIcon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhum projeto encontrado</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                            {hideCompleted && projects.length > 0 
                                ? 'Todos os seus projetos foram concluídos! Parabéns.' 
                                : 'Comece criando seu primeiro projeto para organizar suas tarefas.'}
                        </p>
                        {!hideCompleted && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="mt-6 flex items-center gap-2 bg-primary-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-600 transition-all shadow-md hover:shadow-lg hover:shadow-primary-400/30 duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-primary-400 dark:hover:ring-offset-[#0D1117]"
                            >
                                Criar Primeiro Projeto
                            </button>
                        )}
                     </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsView;
