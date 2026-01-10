import React, { useState, useRef, useEffect } from 'react';
import type { Category, Tag, NotificationSettings, AppSettings } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { 
    PencilIcon, TrashIcon, PlusIcon, BriefcaseIcon, Cog6ToothIcon, BellIcon, 
    UserCircleIcon, CpuChipIcon, SparklesIcon, ExclamationTriangleIcon,
    FolderIcon, ArrowRightOnRectangleIcon, CheckIcon, ChevronDownIcon, InformationCircleIcon
} from '../icons';

interface SettingsViewProps {
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onOpenChangelog: () => void;
  
  tags: Tag[];
  onAddTag: (tag: Tag) => void;
  onDeleteTag: (id: string) => void;

  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onLogout: () => void;
  userName: string;
  setUserName: (name: string) => void;
  onOpenTour: () => void;
  hasNewUpdate?: boolean;
}

type SettingsTab = 'general' | 'notifications' | 'organization' | 'account';

// IDs that cannot be deleted
const PROTECTED_IDS = ['cat-1', 'cat-2', 'cat-3', 'tag-1', 'tag-2', 'tag-3'];

// -- Helper Components --

const SidebarItem = ({ 
    id, 
    label, 
    icon: Icon, 
    isActive, 
    onClick 
}: { 
    id: SettingsTab, 
    label: string, 
    icon: React.FC<{className?: string}>, 
    isActive: boolean, 
    onClick: (id: SettingsTab) => void 
}) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
            isActive
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
        }`}
    >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
    </button>
);

const SettingToggle = ({ 
    label, 
    description, 
    checked, 
    onChange,
    colorClass = 'bg-primary-500'
}: { 
    label: string, 
    description?: string, 
    checked: boolean, 
    onChange: (checked: boolean) => void,
    colorClass?: string
}) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <div className="pr-4">
            <p className="font-medium text-gray-900 dark:text-white text-sm">{label}</p>
            {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
        </div>
        <button 
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? colorClass : 'bg-gray-300 dark:bg-gray-700'}`}
        >
            <span className="sr-only">Use setting</span>
            <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    </div>
);

const CustomSelect = ({ 
    value, 
    onChange, 
    options, 
    label 
}: { 
    value: string; 
    onChange: (val: string) => void; 
    options: { value: string; label: string; color?: string }[];
    label?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full min-w-[140px] px-3 py-2 bg-white dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm cursor-pointer transition-all duration-200 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
                <div className="flex items-center gap-2">
                    {selectedOption?.color && (
                        <div className={`w-3 h-3 rounded-full bg-${selectedOption.color}-500`}></div>
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-200">{selectedOption?.label || value}</span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-full min-w-[140px] bg-white dark:bg-[#21262D] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden py-1 animate-scale-in">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2
                                ${value === opt.value 
                                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                                }`}
                        >
                            {opt.color && <div className={`w-3 h-3 rounded-full bg-${opt.color}-500`}></div>}
                            {opt.label}
                            {value === opt.value && <CheckIcon className="w-3.5 h-3.5 ml-auto text-primary-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const SettingsView: React.FC<SettingsViewProps> = ({ 
    categories, onAddCategory, onDeleteCategory,
    tags, onAddTag, onDeleteTag,
    notificationSettings, setNotificationSettings,
    appSettings, setAppSettings,
    onLogout, userName, setUserName, onOpenTour, onOpenChangelog, hasNewUpdate
}) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    
    // Organization State
    const [newCategory, setNewCategory] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('red');

    // Profile State
    const [editingName, setEditingName] = useState(userName);

    // AI Confirmation State
    const [isAiConfirmationOpen, setIsAiConfirmationOpen] = useState(false);

    // -- Handlers --

    const handleAddCategoryClick = () => {
        if(newCategory.trim()){
            onAddCategory({id: `cat-${Date.now()}`, name: newCategory.trim(), icon: BriefcaseIcon });
            setNewCategory('');
        }
    };
    
    const handleAddTagClick = () => {
        if(newTagName.trim()){
            onAddTag({
                id: `tag-${Date.now()}`, 
                name: newTagName.trim(),
                color: `text-${newTagColor}-700`,
                bgColor: `bg-${newTagColor}-100 dark:bg-${newTagColor}-900/50 dark:text-${newTagColor}-300`,
                baseColor: newTagColor as 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink'
            });
            setNewTagName('');
            setNewTagColor('red');
        }
    }

    const handleNameSave = () => {
        if (editingName.trim()) {
            setUserName(editingName.trim());
        }
    };
  

    const handleAiToggleClick = () => {
        if (appSettings.enableAi) {
            // Trying to disable
            setIsAiConfirmationOpen(true);
        } else {
            // Trying to enable
            setAppSettings(s => ({...s, enableAi: true}));
        }
    };

    const confirmDisableAi = () => {
        setAppSettings(s => ({...s, enableAi: false}));
        setIsAiConfirmationOpen(false);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full p-4 lg:p-8 max-w-7xl mx-auto relative">
            {/* AI Confirmation Modal */}
            {isAiConfirmationOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] animate-fade-in">
                    <div className="bg-white dark:bg-[#21262D] rounded-xl p-6 shadow-2xl max-w-md w-full mx-4 animate-scale-in border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Desativar Recursos de IA?</h3>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Ao desativar os recursos de Inteligência Artificial, você perderá acesso imediato às seguintes funcionalidades:
                        </p>
                        
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                                <span>Sugestões de "Vitórias Rápidas" no Dashboard.</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                                <span>Resumos inteligentes de Tarefas e Projetos.</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                                <span>Formatação e organização automática de texto.</span>
                            </li>
                        </ul>

                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setIsAiConfirmationOpen(false)}
                                className="px-4 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-500 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDisableAi}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors shadow-sm hover:ring-2 hover:ring-offset-2 hover:ring-red-500 dark:hover:ring-offset-[#21262D]"
                            >
                                Desativar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar Navigation */}
            <div className="w-full lg:w-64 flex-shrink-0">
                <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 space-y-1">
                    <h2 className="px-4 pb-4 pt-2 text-xl font-bold text-gray-900 dark:text-white">Configurações</h2>
                    <SidebarItem id="general" label="Geral" icon={Cog6ToothIcon} isActive={activeTab === 'general'} onClick={setActiveTab} />
                    <SidebarItem id="notifications" label="Notificações" icon={BellIcon} isActive={activeTab === 'notifications'} onClick={setActiveTab} />
                    <SidebarItem id="organization" label="Organização" icon={FolderIcon} isActive={activeTab === 'organization'} onClick={setActiveTab} />
                    <div className="my-2 border-t border-gray-100 dark:border-gray-800"></div>
                    <SidebarItem id="account" label="Conta" icon={UserCircleIcon} isActive={activeTab === 'account'} onClick={setActiveTab} />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white dark:bg-[#161B22] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 lg:p-8 overflow-y-auto">
                
                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Preferências Gerais</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Customize a experiência visual e funcional do app.</p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Aparência & Comportamento</h4>
                            
                            {/* Time Format */}
                            <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">Formato de Horário</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Escolha como as horas são exibidas.</p>
                                </div>
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setAppSettings(s => ({...s, timeFormat: '12h'}))}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${appSettings.timeFormat === '12h' ? 'bg-white dark:bg-[#21262D] shadow text-primary-600' : 'text-gray-500'}`}
                                    >
                                        12h (AM/PM)
                                    </button>
                                    <button 
                                        onClick={() => setAppSettings(s => ({...s, timeFormat: '24h'}))}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${appSettings.timeFormat === '24h' ? 'bg-white dark:bg-[#21262D] shadow text-primary-600' : 'text-gray-500'}`}
                                    >
                                        24h
                                    </button>
                                </div>
                            </div>

                            <SettingToggle 
                                label="Confetti ao concluir" 
                                description="Exibir animação de celebração ao finalizar tarefas." 
                                checked={appSettings.enableAnimations} 
                                onChange={(v) => setAppSettings(s => ({...s, enableAnimations: v}))} 
                            />

                            <SettingToggle 
                                label="Exibir projeto nos cards" 
                                description="Mostra a identificação do projeto vinculado." 
                                checked={appSettings.showProjectOnCard !== false}
                                onChange={(v) => setAppSettings(s => ({...s, showProjectOnCard: v}))} 
                            />

                            {appSettings.showProjectOnCard !== false && (
                                <div className="ml-6 pl-4 border-l-2 border-gray-100 dark:border-gray-800 mt-2">
                                    <SettingToggle 
                                        label="Exibir apenas ícone" 
                                        description="Economiza espaço mostrando apenas o símbolo do projeto." 
                                        checked={!!appSettings.onlyProjectIcon} 
                                        onChange={(v) => setAppSettings(s => ({...s, onlyProjectIcon: v}))} 
                                    />
                                </div>
                            )}
                            
                            
                            <SettingToggle 
                                label="Destacar atrasos" 
                                description="Tarefas atrasadas ficam com fundo vermelho." 
                                checked={!appSettings.disableOverdueColor} 
                                onChange={(v) => setAppSettings(s => ({...s, disableOverdueColor: !v}))} 
                                colorClass="bg-red-500"
                            />
                        </div>

                        {/* AI Section */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white dark:bg-indigo-900/50 rounded-full shadow-sm text-indigo-500">
                                    <CpuChipIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            Recursos de IA <SparklesIcon className="w-4 h-4 text-yellow-500"/>
                                        </h4>
                                        <button 
                                            onClick={handleAiToggleClick}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${appSettings.enableAi ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                        >
                                            <span className="sr-only">Use AI</span>
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${appSettings.enableAi ? 'translate-x-5' : 'translate-x-0'}`}
                                            />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                        Habilita sugestões inteligentes de tarefas e resumos automáticos de projetos.
                                    </p>
                                    <div className="text-xs text-indigo-600 dark:text-indigo-400 bg-white/50 dark:bg-black/20 p-2 rounded border border-indigo-100 dark:border-indigo-800/50">
                                        <strong>Nota de Privacidade:</strong> Ao ativar, os dados das tarefas são processados pela API do Google Gemini. Recomendamos evitar incluir informações sensíveis ou confidenciais (como senhas ou dados financeiros) nos títulos e descrições.                                    </div>
                                 </div>
                            </div>
                        </div>
                        <div className="space-y-2 pt-6 border-t border-gray-100 dark:border-gray-800">
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Sobre o Sistema</h4>
                            
                            <div className="bg-white dark:bg-[#0D1117] p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Novidades e Atualizações</h4>                              
                                        {hasNewUpdate && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse">
                                                NOVO
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Veja o histórico de versões e o que mudou recentemente.</p>
                                </div>
                                <button
                                    onClick={onOpenChangelog}
                                    className={`px-4 py-2 rounded-lg transition-colors text-xs font-bold border ${hasNewUpdate
                                            ? 'bg-primary-500 text-white hover:bg-primary-600 border-transparent shadow-md shadow-primary-500/20' // Botão destacado se tiver novidade
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    Ver Changelog
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* NOTIFICATIONS TAB */}
                {activeTab === 'notifications' && (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Notificações e Alertas</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Controle o que você quer receber.</p>
                        </div>

                        <div className="space-y-2">
                            <SettingToggle 
                                label="Notificações Gerais" 
                                description="Ativar ou desativar todas as notificações do sistema." 
                                checked={notificationSettings.enabled} 
                                onChange={(v) => setNotificationSettings(s => ({...s, enabled: v}))} 
                            />

                            {notificationSettings.enabled && (
                                <div className="pl-4 ml-2 border-l-2 border-gray-100 dark:border-gray-800 space-y-2 mt-4">
                                    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">Lembrete Antecipado</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Dias antes do vencimento para avisar.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="7"
                                                value={notificationSettings.remindDaysBefore}
                                                onChange={e => setNotificationSettings(s => ({...s, remindDaysBefore: parseInt(e.target.value) || 0}))}
                                                className="w-16 p-1.5 text-center bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-gray-700 rounded-md text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                            />
                                            <span className="text-sm text-gray-500">dias</span>
                                        </div>
                                    </div>

                                    <SettingToggle 
                                        label="Tarefas e Prazos" 
                                        description="Alertas sobre tarefas vencidas ou próximas do vencimento." 
                                        checked={notificationSettings.taskReminders} 
                                        onChange={(v) => setNotificationSettings(s => ({...s, taskReminders: v}))} 
                                    />
                                    
                                    <SettingToggle 
                                        label="Hábitos Diários" 
                                        description="Lembretes para completar sua rotina." 
                                        checked={notificationSettings.habitReminders} 
                                        onChange={(v) => setNotificationSettings(s => ({...s, habitReminders: v}))} 
                                    />

                                    <div className="py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                        <SettingToggle 
                                            label="Novidades e Dicas" 
                                            description="Receber atualizações sobre novas funcionalidades." 
                                            checked={notificationSettings.marketingEmails} 
                                            onChange={(v) => setNotificationSettings(s => ({...s, marketingEmails: v}))} 
                                            colorClass="bg-green-500"
                                        />
                                        <div className="mt-4 pt-2">
                                            <button 
                                                onClick={onOpenTour}
                                                className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                                            >
                                                <InformationCircleIcon className="w-4 h-4" />
                                                Ver Introdução (Tour)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ORGANIZATION TAB */}
                {activeTab === 'organization' && (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Gerenciamento de Dados</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Edite as categorias e prioridades usadas nas tarefas.</p>
                        </div>

                        {/* Categories */}
                        <div className="bg-gray-50 dark:bg-[#0D1117] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <FolderIcon className="w-5 h-5 text-blue-500" /> Categorias
                            </h4>
                            <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {categories.map(cat => (
                                    <li key={cat.id} className="flex justify-between items-center p-3 bg-white dark:bg-[#161B22] rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <span className="text-gray-800 dark:text-gray-200 font-medium text-sm">{cat.name}</span>
                                        {!PROTECTED_IDS.includes(cat.id) ? (
                                            <button onClick={() => onDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Padrão</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newCategory} 
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="Nova categoria"
                                    className="flex-grow block w-full rounded-lg p-2.5 border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-[#161B22] text-gray-900 dark:text-gray-200 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                />
                                <button onClick={handleAddCategoryClick} disabled={!newCategory.trim()} className="bg-primary-500 text-white p-2.5 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors">
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Priorities */}
                        <div className="bg-gray-50 dark:bg-[#0D1117] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <BriefcaseIcon className="w-5 h-5 text-purple-500" /> Prioridades
                            </h4>
                            <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {tags.map(tag => (
                                    <li key={tag.id} className="flex justify-between items-center p-3 bg-white dark:bg-[#161B22] rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <span className={`${tag.bgColor} ${tag.color} px-2 py-1 text-xs font-bold rounded-full`}>
                                            {tag.name}
                                        </span>
                                        {!PROTECTED_IDS.includes(tag.id) ? (
                                            <button onClick={() => onDeleteTag(tag.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Padrão</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="text" 
                                    value={newTagName} 
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    placeholder="Nova prioridade"
                                    className="flex-grow min-w-[120px] rounded-lg p-2.5 border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-[#161B22] text-gray-900 dark:text-gray-200 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                />
                                <div className="w-40 flex-shrink-0">
                                    <CustomSelect 
                                        value={newTagColor}
                                        onChange={setNewTagColor}
                                        options={[
                                            { value: 'red', label: 'Vermelho', color: 'red' },
                                            { value: 'yellow', label: 'Amarelo', color: 'yellow' },
                                            { value: 'green', label: 'Verde', color: 'green' },
                                            { value: 'blue', label: 'Azul', color: 'blue' },
                                            { value: 'indigo', label: 'Índigo', color: 'indigo' },
                                            { value: 'purple', label: 'Roxo', color: 'purple' },
                                            { value: 'pink', label: 'Rosa', color: 'pink' }
                                        ]}
                                    />
                                </div>
                                <button onClick={handleAddTagClick} disabled={!newTagName.trim()} className="bg-primary-500 text-white p-2.5 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors flex-shrink-0 shadow-sm">
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ACCOUNT TAB */}
                {activeTab === 'account' && (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Conta & Privacidade</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie seus dados e acesso.</p>
                        </div>

                       {/* Profile Header */}
<div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
    <div className="relative z-10 flex-shrink-0">
        {/* Container do Avatar com Borda Degradê */}
        <div className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-[#21262D] shadow-md">
            
            {/* Círculo interno (Branco/Escuro) */}
            <div className="w-full h-full rounded-full bg-white dark:bg-[#161B22] flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                    // SE TEM FOTO: Mostra a imagem do Google
                    <img 
                        src={user.photoURL} 
                        alt={userName} 
                        className="w-full h-full object-cover" 
                    />
                ) : (
                    // SE NÃO TEM FOTO: Mostra o ícone padrão cinza
                    <UserCircleIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                )}
            </div>

            {/* Badge do Google pequeno no canto (Opcional, mas fica chique) */}
            {user?.photoURL && (
                <div className="absolute bottom-0 right-0 bg-white dark:bg-[#0D1117] rounded-full p-1 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <svg className="w-3 h-3" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.17c-.22-.66-.35-1.36-.35-2.17s.13-1.51.35-2.17V7.01H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.99l3.66-2.82z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.01l3.66 2.82c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
            )}
        </div>
    </div>

    <div className="text-center md:text-left flex-grow relative z-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{userName}</h2>
        {/* Mudei o texto para refletir que é login social */}
        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Conta Google Conectada</p>
    </div>

    <div className="relative z-10">
        <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm"
        >
            <ArrowRightOnRectangleIcon className="w-4 h-4"/>
            Sair da Conta
        </button>
    </div>
</div>

                        <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                            <div className="space-y-5">
                                {/* Name Field */}
                                <div className="group">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nome de Exibição</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            className="flex-grow bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                        />
                                        <button
                                            onClick={handleNameSave}
                                            disabled={editingName.trim() === userName || !editingName.trim()}
                                            className="p-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <CheckIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Email Field - Read Only from Google */}
<div className="group">
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
        E-mail
    </label>
    <div className="relative">
        <input
            type="email"
            value={user?.email || ''} 
            disabled
            readOnly
            className="w-full pl-10 pr-20 py-2.5 bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed select-none focus:outline-none opacity-80"
        />
        
        {/* Ícone de Cadeado (Esquerda) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        </div>

        {/* Badge "GOOGLE" (Direita) */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
             <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700">
                GOOGLE
             </span>
        </div>
    </div>
    <p className="text-xs text-gray-400 mt-1.5 ml-1">
        Gerenciado pela sua conta conectada.
    </p>
</div>
                            </div>
                        </div>

                        <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                            <h4 className="text-red-700 dark:text-red-400 font-bold flex items-center gap-2 mb-2">
                                <ExclamationTriangleIcon className="w-5 h-5" />
                                Zona de Perigo
                            </h4>
                            <p className="text-sm text-red-600 dark:text-red-300 mb-6">
                                A exclusão da conta é permanente e não pode ser desfeita. Todos os seus projetos, tarefas, hábitos e configurações serão apagados.
                            </p>
                            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                                Excluir Minha Conta
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SettingsView;