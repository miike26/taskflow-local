import React, { useState } from 'react';
// Caminhos relativos mantidos
import { LOGIN_LOGO_URL, DEFAULT_TASKS, DEFAULT_CATEGORIES, DEFAULT_TAGS, DEFAULT_HABITS } from '../constants';
import Sidebar from './Sidebar';
import DashboardView from './views/DashboardView';
import { GoogleIcon } from './icons';
import { useAuth } from '../hooks/useAuth';

// Interface simplificada, pois não precisamos mais de user/pass manuais
interface LoginScreenProps {
    login: (user: string, pass: string) => Promise<boolean>;
}

const AuthModal: React.FC = () => {
    const { loginWithGoogle } = useAuth();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleConnect = async () => {
        setError('');
        setIsLoading(true);
        try {
            // Essa função do seu hook deve lidar tanto com login quanto com registro (signInWithPopup)
            await loginWithGoogle();
        } catch (err: any) {
            const msg = err.message ? err.message.replace('Firebase: ', '') : "Erro ao conectar.";
            setError(msg);
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in border border-gray-200 dark:border-gray-800 relative z-50">
            {/* Header com Logo */}
            <div className="pt-10 pb-6 px-6 text-center">
                <img 
                    src={LOGIN_LOGO_URL} 
                    alt="FlowTask Logo" 
                    className="h-56 mx-auto mb-6 object-contain drop-shadow-sm" 
                />
                <h2 className="text-xl font-medium text-gray-700 dark:text-gray-100 mb-2">
                    Bem-vindo ao FlowTask
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    Gerencie seus hábitos, tarefas e projetos<br/> com a ajuda da Inteligência Artificial.
                </p>
            </div>

            {/* Corpo com Botão Único */}
            <div className="px-8 pb-10 space-y-6">
                
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs p-3 rounded-lg text-center">
                        {error}
                    </div>
                )}

                <button 
                    onClick={handleGoogleConnect}
                    disabled={isLoading}
                    className="group w-full flex items-center justify-center gap-3 bg-white dark:bg-[#21262D] border border-gray-300 dark:border-gray-700 rounded-xl py-3.5 px-4 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-[#30363d] hover:border-gray-400 dark:hover:border-gray-600 transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                         <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    ) : (
                        <GoogleIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    )}
                    <span>
                        {isLoading ? 'Conectando...' : 'Continuar com Google'}
                    </span>
                </button>

                <div className="text-center">
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 max-w-xs mx-auto leading-tight">
                        Ao clicar em continuar, você cria sua conta automaticamente e aceita nossos <span className="underline cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">Termos de Uso</span> e <span className="underline cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">Política de Privacidade</span>.
                    </p>
                </div>
            </div>
            
            {/* Barra inferior decorativa */}
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        </div>
    );
}

// --- Fundo Mantido Exatamente Igual ---
const DemoDashboardBackground = () => {
    const habitsWithStatus = DEFAULT_HABITS.map(h => ({ ...h, isCompleted: false }));
    const [appSettings] = useState({ 
      disableOverdueColor: false, 
      timeFormat: '24h' as const, 
      weekStart: 'monday' as const, 
      enableAi: true, 
      enableAnimations: true 
    });

    return (
        <div className="absolute inset-0 flex gap-4 p-4 filter blur-sm brightness-75 bg-ice-blue dark:bg-[#0D1117] overflow-hidden pointer-events-none select-none">
            <Sidebar 
                currentView="dashboard" 
                setCurrentView={() => {}} 
                recentTaskIds={[]} 
                pinnedTaskIds={[]} 
                tasks={DEFAULT_TASKS} 
                categories={DEFAULT_CATEGORIES} 
                onSelectTask={() => {}} 
                onPinTask={() => {}} 
                selectedTask={null} 
                onClearRecents={() => {}} 
                userName="Visitante" 
            />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="p-4 flex justify-between items-center">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        Olá, Visitante!
                    </h2>
                </header>
                <div className="flex-1 overflow-hidden">
                    <DashboardView 
                        tasks={DEFAULT_TASKS}
                        categories={DEFAULT_CATEGORIES}
                        tags={DEFAULT_TAGS}
                        onSelectTask={() => {}}
                        habits={habitsWithStatus}
                        onToggleHabit={() => {}}
                        appSettings={appSettings}
                        setAppSettings={() => {}}
                        isDemoMode={true}
                        onReorderHabits={() => {}}
                    />
                </div>
            </div>
        </div>
    );
};

const LoginScreen: React.FC<LoginScreenProps> = () => {
    // Não precisamos mais de estados de Signup/Login, pois é um modal único
    
    return (
        <div className="relative min-h-screen bg-ice-blue dark:bg-[#0D1117] flex items-center justify-center overflow-hidden">
            
            {/* Background fixo */}
            <div className="fixed inset-0 z-0">
                <DemoDashboardBackground />
            </div>
            
            {/* Overlay escuro */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-10"></div>

            {/* Modal Central */}
            <div className="relative z-20 w-full flex items-center justify-center p-4">
                <AuthModal />
            </div>
        </div>
    );
};

export default LoginScreen;