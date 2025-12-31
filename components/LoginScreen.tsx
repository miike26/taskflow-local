
import React, { useState } from 'react';
import { LOGO_URL, DEFAULT_TASKS, DEFAULT_CATEGORIES, DEFAULT_TAGS, DEFAULT_HABITS, DEFAULT_PROJECTS } from '../constants';
import Sidebar from './Sidebar';
import DashboardView from './views/DashboardView';
import { GoogleIcon } from './icons';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface LoginScreenProps {
    login: (user: string, pass: string) => boolean;
}

const inputClass = "flex-grow block w-full rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 placeholder:text-gray-400 text-sm p-3 transition-all duration-200 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium";

const SignupModal: React.FC<{ onSignup: (name: string) => void, onClose: () => void }> = ({ onSignup, onClose }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        nickname: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, validation and API call would go here.
        if (formData.nickname) {
            onSignup(formData.nickname);
        }
    };

    const handleGoogleConnect = () => {
        // Mock Google Connect
        onSignup("Usuário Google");
    };

    return (
        <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-gray-200 dark:border-gray-800 relative z-50">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Crie sua conta</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Social Login */}
                <button 
                    onClick={handleGoogleConnect}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#21262D] border border-gray-300 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
                >
                    <GoogleIcon className="w-5 h-5" />
                    <span>Conectar com Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 border-t border-gray-200 dark:border-gray-700"></div>
                    <span className="relative bg-white dark:bg-[#161B22] px-3 text-xs text-gray-500 uppercase tracking-wide font-medium">ou preencha seus dados</span>
                </div>

                {/* Form */}
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-4">
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Nome Completo"
                            required
                            className={inputClass}
                            value={formData.fullName}
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="nickname"
                            placeholder="Como quer ser chamado (Apelido)"
                            required
                            className={inputClass}
                            value={formData.nickname}
                            onChange={handleInputChange}
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="E-mail"
                            required
                            className={inputClass}
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="password"
                                name="password"
                                placeholder="Senha"
                                required
                                className={inputClass}
                                value={formData.password}
                                onChange={handleInputChange}
                            />
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Repita a senha"
                                required
                                className={inputClass}
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-lg shadow-lg shadow-primary-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Cadastrar
                    </button>
                </form>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117]/50 border-t border-gray-100 dark:border-gray-800 text-center">
                <button onClick={onClose} className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                    Já tem uma conta? Faça login
                </button>
            </div>
        </div>
    );
};

const LoginModal: React.FC<{ login: (u: string, p: string) => boolean, onToggleMode: () => void }> = ({ login, onToggleMode }) => {
    const [username, setUsername] = useState(''); 
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        // Fallback convenience: if empty, try default credentials for demo experience
        const u = username || 'admin';
        const p = password || 'admin';
        
        const success = login(u, p);
        if (!success) {
            setError('Usuário ou senha inválidos.');
        }
    };

    const handleGoogleConnect = () => {
        // Mock Google Login
        login('Usuário Google', 'password');
    };

    return (
        <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-gray-200 dark:border-gray-800 relative z-50">
             {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 text-center">
                 <img src={LOGO_URL} alt="FlowTask Logo" className="h-10 mx-auto mb-3 object-contain" />
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bem-vindo de volta!</h2>
            </div>

            <div className="p-6 space-y-6">
                 {/* Social Login */}
                <button 
                    onClick={handleGoogleConnect}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#21262D] border border-gray-300 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
                >
                    <GoogleIcon className="w-5 h-5" />
                    <span>Entrar com Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 border-t border-gray-200 dark:border-gray-700"></div>
                    <span className="relative bg-white dark:bg-[#161B22] px-3 text-xs text-gray-500 uppercase tracking-wide font-medium">ou entre com usuário</span>
                </div>

                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="sr-only">Usuário</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={inputClass}
                                placeholder="Usuário (admin)"
                            />
                        </div>
                        <div>
                            <label htmlFor="password-input" className="sr-only">Senha</label>
                            <input
                                id="password-input"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputClass}
                                placeholder="Senha (admin)"
                            />
                        </div>
                    </div>
                    
                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="w-full py-3.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-lg shadow-lg shadow-primary-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Entrar
                        </button>
                    </div>
                </form>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-[#0D1117]/50 border-t border-gray-100 dark:border-gray-800 text-center">
                <button 
                    onClick={onToggleMode}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline"
                >
                    Novo por aqui? Clique aqui para criar sua conta
                </button>
            </div>
        </div>
    )
}

const DemoDashboardBackground = () => {
    // Static dummy data for visual background
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
                    />
                </div>
            </div>
        </div>
    );
};

const LoginScreen: React.FC<LoginScreenProps> = ({ login }) => {
    const [isSignupMode, setIsSignupMode] = useState(false);
    
    const [_, setStoredUserName] = useLocalStorage('userName', 'Admin');

    const handleSignupSuccess = (name: string) => {
        setStoredUserName(name);
        // Auto-login logic for demo purposes
        login('admin', 'admin'); 
    };

    return (
        <div className="relative min-h-screen bg-ice-blue dark:bg-[#0D1117] flex items-center justify-center overflow-hidden">
            
            {/* Background is now always visible */}
            <div className="fixed inset-0 z-0">
                <DemoDashboardBackground />
            </div>
            
            {/* Overlay is now always visible */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-10"></div>

            <div className="relative z-20 w-full flex items-center justify-center p-4">
                {isSignupMode ? (
                    <SignupModal onSignup={handleSignupSuccess} onClose={() => setIsSignupMode(false)} />
                ) : (
                    <LoginModal login={login} onToggleMode={() => setIsSignupMode(true)} />
                )}
            </div>
        </div>
    );
};

export default LoginScreen;
