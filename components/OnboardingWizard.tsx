
import React, { useState } from 'react';
import { 
    UserCircleIcon, SunIcon, MoonIcon, ClockIcon, SparklesIcon, 
    ArrowRightOnRectangleIcon, CheckIcon, ChevronRightIcon 
} from './icons';
import type { AppSettings } from '../types';

interface OnboardingWizardProps {
    isOpen: boolean;
    userName: string;
    setUserName: (name: string) => void;
    appSettings: AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    onComplete: () => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ 
    isOpen, userName, setUserName, appSettings, setAppSettings, theme, setTheme, onComplete 
}) => {
    const [step, setStep] = useState(1);
    const [localName, setLocalName] = useState(userName === 'Admin' ? '' : userName); // Start empty if default
    const [animateExit, setAnimateExit] = useState(false);

    if (!isOpen) return null;

    const handleNext = () => {
        if (step === 1 && localName.trim()) {
            setUserName(localName);
            setStep(2);
        } else if (step === 2) {
            setAnimateExit(true);
            setTimeout(() => {
                onComplete();
            }, 500); // Wait for animation
        }
    };

    const handleBack = () => {
        if (step === 2) setStep(1);
    };

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    const toggleTime = () => setAppSettings(prev => ({ ...prev, timeFormat: prev.timeFormat === '24h' ? '12h' : '24h' }));
    const toggleAi = () => setAppSettings(prev => ({ ...prev, enableAi: !prev.enableAi }));

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${animateExit ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`w-full max-w-md bg-white dark:bg-[#161B22] rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 ${animateExit ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}>
                
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800">
                    <div 
                        className="h-full bg-primary-500 transition-all duration-500 ease-out" 
                        style={{ width: step === 1 ? '50%' : '100%' }}
                    ></div>
                </div>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="flex flex-col items-center text-center animate-fade-in">
                            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6 text-primary-600 dark:text-primary-400">
                                <UserCircleIcon className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Boas-vindas!</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
                                Para começarmos, como você gostaria de ser chamado no app?
                            </p>
                            
                            <div className="w-full relative mb-8">
                                <input
                                    type="text"
                                    value={localName}
                                    onChange={(e) => setLocalName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                    placeholder="Seu nome ou apelido"
                                    className="w-full text-center text-xl font-semibold bg-transparent border-b-2 border-gray-200 dark:border-gray-700 py-2 focus:border-primary-500 focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-colors"
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!localName.trim()}
                                className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                Continuar <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="animate-slide-up-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Preferências Rápidas</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Personalize sua experiência inicial. Você pode mudar isso depois nas configurações.
                                </p>
                            </div>

                            <div className="space-y-4 mb-8">
                                {/* Theme Toggle */}
                                <div 
                                    onClick={toggleTheme}
                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition-colors">
                                            {theme === 'light' ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Aparência</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{theme === 'light' ? 'Modo Claro' : 'Modo Escuro'}</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                </div>

                                {/* Time Format Toggle */}
                                <div 
                                    onClick={toggleTime}
                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition-colors">
                                            <ClockIcon className="w-5 h-5"/>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Formato de Horário</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{appSettings.timeFormat === '24h' ? '24 Horas (14:00)' : 'AM/PM (02:00 PM)'}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                        {appSettings.timeFormat}
                                    </div>
                                </div>

                                {/* AI Toggle Section */}
                                <div>
                                    <div 
                                        onClick={toggleAi}
                                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group ${appSettings.enableAi ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${appSettings.enableAi ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                                                <SparklesIcon className="w-5 h-5"/>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm">Recursos de IA</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{appSettings.enableAi ? 'Ativado' : 'Desativado'}</p>
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${appSettings.enableAi ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {appSettings.enableAi && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800/50 leading-relaxed">
                                        <strong>Nota de Privacidade:</strong> Ao ativar, dados das tarefas (título, descrição) podem ser processados pela API do Google Gemini para gerar insights. Nenhum dado é usado para treinar modelos públicos.
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleBack}
                                    className="px-6 py-3.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                >
                                    Tudo Pronto!
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;
