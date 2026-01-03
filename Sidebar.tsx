import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // [NOVO] Import do Router
import type { View, Task, Category, Status } from './types';
import { DashboardIcon, CalendarIcon, ListIcon, SettingsIcon, BarChartIcon, BellIcon, UserCircleIcon, PinIcon, BroomIcon, FolderIcon, ChevronLeftIcon, ChevronRightIcon, Cog6ToothIcon } from './components/icons';
import { LOGO_URL } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';


interface SidebarProps {
  currentView: View; // Ainda recebemos para compatibilidade, mas o location é a fonte da verdade
  setCurrentView: (view: View) => void; // Mantido para compatibilidade, mas não usado diretamente para navegação
  recentTaskIds: string[];
  pinnedTaskIds: string[];
  tasks: Task[];
  categories: Category[];
  onSelectTask: (task: Task) => void;
  onPinTask: (taskId: string) => void;
  selectedTask: Task | null;
  onClearRecents: () => void;
  userName: string;
  onLogout: () => void; // [ADICIONADO] Para o link do perfil (opcional, ou redireciona pra settings)
}

const NavItem: React.FC<{
  to: string; // [MODIFICADO] Recebe o caminho da URL
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  hoverColorClass: string;
  showLabel: boolean;
}> = ({ to, label, icon, isActive, hoverColorClass, showLabel }) => {
  return (
    <li>
      <Link
        to={to}
        title={!showLabel ? label : undefined}
        className={`group flex items-center p-3 text-base font-normal rounded-lg transition-all duration-200
          ${isActive 
            ? 'bg-primary-600 text-white shadow-md' 
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'
          }
          ${!showLabel ? 'justify-center' : ''}
        `}
      >
        <span className={`transition-colors duration-200 flex-shrink-0 ${isActive ? 'text-white' : `text-gray-500 group-hover:${hoverColorClass}`}`}>
            {icon}
        </span>
        <span className={`ml-3 font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${showLabel ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 ml-0'}`}>
            {label}
        </span>
      </Link>
    </li>
  );
};

const statusColorClasses: Record<Status, string> = {
  'Pendente': 'bg-blue-500',
  'Em andamento': 'bg-yellow-500',
  'Concluída': 'bg-green-500',
};


const RecentTaskItem: React.FC<{
  task: Task;
  category?: Category;
  isPinned: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onPin: () => void;
  showLabel: boolean;
}> = ({ task, category, isPinned, isSelected, onSelect, onPin, showLabel }) => {
  const [isHovered, setIsHovered] = useState(false);
  const statusColorClass = statusColorClasses[task.status] || 'bg-gray-400';

  // If collapsed, we don't show individual recent items to keep UI clean, 
  // as they rely heavily on text context.
  if (!showLabel) return null;

  return (
    <li
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
      title={task.title}
    >
      <Link
        to={`/tasks/${task.id}`} // [MODIFICADO] Link direto para a tarefa
        className={`flex items-center p-2.5 text-base font-normal rounded-lg transition-colors
          ${isSelected
            ? 'bg-primary-500 text-white'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'
          }`}
      >
        <div className={`w-1.5 h-6 flex-shrink-0 rounded-full ${statusColorClass}`}></div>
        <span className="ml-2 font-medium text-sm truncate flex-1 animate-fade-in">{task.title}</span>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPin(); }}
          className={`ml-2 p-1 rounded-full transition-all duration-200 ${
            (isPinned || isHovered) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } ${ isSelected
                ? 'text-white hover:bg-white/20'
                : isPinned
                ? 'text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/50'
                : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <PinIcon className="w-4 h-4" isPinned={isPinned} />
        </button>
      </Link>
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, recentTaskIds, pinnedTaskIds, tasks, categories, onSelectTask, onPinTask, selectedTask, onClearRecents, userName }) => {
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar.collapsed', false);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation(); // [NOVO] Hook para saber a URL atual

  // The sidebar is "fully visible" if it's NOT collapsed, OR if it IS collapsed but the user is hovering over it.
  const showFull = !isCollapsed || isHovered;

  const recentItems = useMemo(() => {
    const allTasksById = new Map(tasks.map(t => [t.id, t]));
    
    const pinned = pinnedTaskIds
      .map(id => allTasksById.get(id))
      .filter((t): t is Task => !!t);
      
    const recents = recentTaskIds
      .filter(id => !pinnedTaskIds.includes(id))
      .map(id => allTasksById.get(id))
      .filter((t): t is Task => !!t);

    const combined = [...pinned, ...recents.slice(0, 5 - pinned.length)];
    return combined;
  }, [tasks, recentTaskIds, pinnedTaskIds]);

  // Helper para verificar rota ativa
  const isActive = (path: string) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
  };

  return (
    // Outer Wrapper: reserves space in the flex layout (w-64 or w-20)
    <div 
        className={`relative h-full transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] flex-shrink-0 ${isCollapsed ? 'w-20' : 'w-64'} z-50`}
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
        {/* Actual Sidebar: Can expand absolutely over content */}
        <aside 
            className={`
                bg-white dark:bg-[#161B22] rounded-2xl flex flex-col h-full overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] border border-transparent dark:border-gray-800
                ${isCollapsed && isHovered ? 'absolute top-0 left-0 w-64 shadow-2xl border-gray-200 dark:border-gray-700' : 'w-full'}
                ${isCollapsed && !isHovered ? 'items-center px-2' : 'px-4'}
            `}
            aria-label="Sidebar"
        >
            {/* Header: Logo and Toggle */}
            <div className={`flex items-center ${showFull ? 'justify-between' : 'justify-center flex-col-reverse gap-4'} pt-6 pb-6 flex-shrink-0 min-h-[80px]`}>
                {showFull ? (
                    <img src={LOGO_URL} alt="FlowTask Logo" className="w-32 animate-fade-in object-contain" />
                ) : (
                    // Show mini logo or nothing when fully collapsed to save space for icons
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-xs">FT</div>
                )}
                
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${!showFull ? 'mb-2' : ''}`}
                    title={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
                >
                    {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                </button>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 flex flex-col overflow-y-auto min-h-0 pr-1 -mr-1 w-full custom-scrollbar">
            <ul className="space-y-2 w-full">
                <NavItem 
                    to="/" 
                    label="Dashboard" 
                    icon={<DashboardIcon className="w-6 h-6" />}
                    isActive={location.pathname === '/'}
                    hoverColorClass="text-cyan-500"
                    showLabel={showFull}
                />
                <NavItem
                    to="/projects"
                    label="Projetos"
                    icon={<FolderIcon className="w-6 h-6" />}
                    isActive={isActive('/projects')}
                    hoverColorClass="text-blue-500"
                    showLabel={showFull}
                />
                <NavItem
                    to="/list"
                    label="Lista de Tarefas"
                    icon={<ListIcon className="w-6 h-6" />}
                    isActive={isActive('/list')}
                    hoverColorClass="text-purple-500"
                    showLabel={showFull}
                />
                <NavItem
                    to="/calendar"
                    label="Calendário"
                    icon={<CalendarIcon className="w-6 h-6" />}
                    isActive={isActive('/calendar')}
                    hoverColorClass="text-rose-500"
                    showLabel={showFull}
                />
                <NavItem
                    to="/reminders"
                    label="Meus Lembretes"
                    icon={<BellIcon className="w-6 h-6" />}
                    isActive={isActive('/reminders')}
                    hoverColorClass="text-amber-500"
                    showLabel={showFull}
                />
                <NavItem
                    to="/reports"
                    label="Relatórios"
                    icon={<BarChartIcon className="w-6 h-6" />}
                    isActive={isActive('/reports')}
                    hoverColorClass="text-emerald-500"
                    showLabel={showFull}
                />
                <NavItem
                    to="/settings"
                    label="Configurações"
                    icon={<SettingsIcon className="w-6 h-6" />}
                    isActive={isActive('/settings')}
                    hoverColorClass="text-gray-500"
                    showLabel={showFull}
                />
            </ul>

            {recentItems.length > 0 && (
                <div className={`mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 transition-opacity duration-200 ${showFull ? 'opacity-100' : 'opacity-0 hidden'}`}>
                <div className="flex justify-between items-center pr-1">
                    <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Tarefas recentes</h3>
                    <button onClick={onClearRecents} title="Limpar recentes" className="p-1 -mr-1 mb-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                    <BroomIcon className="w-4 h-4" />
                    </button>
                </div>
                <ul className="space-y-1">
                    {recentItems.map(task => {
                    const category = categories.find(c => c.id === task.categoryId);
                    const isPinned = pinnedTaskIds.includes(task.id);
                    // [MODIFICADO] Verifica seleção pela URL
                    const isSelected = location.pathname === `/tasks/${task.id}`;
                    
                    return (
                        <RecentTaskItem
                        key={task.id}
                        task={task}
                        category={category}
                        isPinned={isPinned}
                        isSelected={isSelected}
                        onSelect={() => {}} // O Link já cuida da navegação
                        onPin={() => onPinTask(task.id)}
                        showLabel={showFull}
                        />
                    );
                    })}
                </ul>
                </div>
            )}
            </div>

            {/* User Profile - Fixed Bottom */}
            <div className="mt-4 flex-shrink-0 w-full">
            <ul className={`space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700 ${!showFull ? 'border-t-0' : ''}`}>
                <li>
                <Link
                    to="/settings" // [MODIFICADO] Link para Settings
                    className={`group flex items-center p-2 text-base font-normal rounded-lg transition-colors w-full
                        ${location.pathname === '/settings'
                        ? 'bg-gray-100 dark:bg-white/10'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'
                        }
                        ${!showFull ? 'justify-center' : ''}
                    `}
                    title={!showFull ? userName : undefined}
                >
                    <span className={`transition-colors duration-200 group-hover:text-indigo-500 ${location.pathname === '/settings' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    <UserCircleIcon className="w-10 h-10 flex-shrink-0" />
                    </span>
                    <div className={`ml-3 text-left overflow-hidden transition-all duration-300 ${showFull ? 'opacity-100 w-auto' : 'opacity-0 w-0 ml-0'}`}>
                        <span className="font-semibold block text-sm text-gray-800 dark:text-gray-200 truncate">{userName}</span>
                    </div>
                </Link>
                </li>
            </ul>
            </div>
        </aside>
    </div>
  );
};

export default Sidebar;