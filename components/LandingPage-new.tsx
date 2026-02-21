import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircleIcon, SparklesIcon, ChartPieIcon, 
    ArrowRightOnRectangleIcon, GlobeAltIcon,
    RocketLaunchIcon, StarIcon, DashboardIcon, ListIcon,
    CalendarIcon, ViewListIcon, PlusIcon
} from './icons';
import { LP_ICON_URL } from '../constants';

interface LandingPageProps {
    onEnterApp: () => void;
}

// Mapeamento idêntico à estrutura mental do aplicativo
const SECTIONS = [
    { id: 'visao-geral', label: 'Visão Geral', group: 'Menu', icon: <DashboardIcon className="w-5 h-5" /> },
    { id: 'kanban-listas', label: 'Kanban & Listas', group: 'Menu', icon: <ViewListIcon className="w-5 h-5" /> },
    { id: 'google-agenda', label: 'Google Agenda', group: 'Menu', icon: <CalendarIcon className="w-5 h-5" /> },
    { id: 'ia-gemini', label: 'Assistente IA', group: 'Inteligência', icon: <SparklesIcon className="w-5 h-5" /> },
    { id: 'habitos', label: 'Hábitos Diários', group: 'Rotina', icon: <CheckCircleIcon className="w-5 h-5" /> },
    { id: 'privacidade', label: 'Privacidade (Local)', group: 'Configurações', icon: <GlobeAltIcon className="w-5 h-5" /> },
];

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
    const [activeSection, setActiveSection] = useState('visao-geral');
    const mainRef = useRef<HTMLElement>(null);

    // Lógica de Scroll Spy aprimorada
    useEffect(() => {
        const handleScroll = () => {
            if (!mainRef.current) return;
            const scrollPosition = mainRef.current.scrollTop;
            const sections = SECTIONS.map(s => document.getElementById(s.id));
            
            let current = SECTIONS[0].id;
            for (const section of sections) {
                if (section) {
                    // Offset de 300px para ativar o menu antes de a seção colar no topo
                    if (scrollPosition >= section.offsetTop - 300) {
                        current = section.id;
                    }
                }
            }
            setActiveSection(current);
        };

        const mainEl = mainRef.current;
        if (mainEl) {
            mainEl.addEventListener('scroll', handleScroll);
            handleScroll();
        }
        return () => {
            if (mainEl) mainEl.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToSection = (id: string) => {
        const section = document.getElementById(id);
        if (section && mainRef.current) {
            mainRef.current.scrollTo({
                top: section.offsetTop,
                behavior: 'smooth'
            });
        }
    };

    // Agrupamento para a Sidebar
    const groupedSections = SECTIONS.reduce((acc, section) => {
        if (!acc[section.group]) acc[section.group] = [];
        acc[section.group].push(section);
        return acc;
    }, {} as Record<string, typeof SECTIONS>);

    return (
        <div className="flex h-screen bg-ice-blue dark:bg-[#0D1117] text-gray-900 dark:text-white overflow-hidden font-sans selection:bg-primary-500 selection:text-white">
            
            {/* --- SIDEBAR IDÊNTICA AO APP --- */}
            <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-[#161B22] border-r border-gray-200 dark:border-gray-800 z-20 flex-shrink-0 transition-colors duration-300">
                {/* Logo e Título */}
                <div className="p-6 pb-2 flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('visao-geral')}>
                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center p-1">
                        <img src={LP_ICON_URL} alt="FlowTask" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">FlowTask</span>
                </div>

                {/* Navegação ScrollSpy */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 mt-4 space-y-6">
                    {Object.entries(groupedSections).map(([group, items]) => (
                        <div key={group}>
                            <p className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                                {group}
                            </p>
                            <nav className="space-y-1">
                                {items.map((section) => {
                                    const isActive = activeSection === section.id;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative overflow-hidden group ${
                                                isActive 
                                                ? 'text-primary-700 dark:text-primary-300' 
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div 
                                                    layoutId="active-nav-bg"
                                                    className="absolute inset-0 bg-primary-50 dark:bg-primary-500/10 rounded-xl"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                                />
                                            )}
                                            <span className={`relative z-10 transition-colors ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`}>
                                                {section.icon}
                                            </span>
                                            <span className="relative z-10">{section.label}</span>
                                            {isActive && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse relative z-10 ml-auto"></div>}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* Perfil Fake / Botão de Ação */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 mt-auto bg-gray-50/50 dark:bg-transparent">
                    <button onClick={onEnterApp} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left group">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-primary-500/30 transition-shadow">
                            <RocketLaunchIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Entrar no App</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Acesse seu workspace</p>
                        </div>
                        <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    </button>
                </div>
            </aside>

            {/* --- MOBILE NAVBAR --- */}
            <div className="md:hidden fixed top-0 w-full bg-white/80 dark:bg-[#161B22]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <img src={LP_ICON_URL} alt="FlowTask" className="h-6 w-auto" />
                    <span className="font-bold text-gray-900 dark:text-white">FlowTask</span>
                </div>
                <button onClick={onEnterApp} className="bg-primary-600 text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-md">
                    Acessar
                </button>
            </div>

            {/* --- MAIN CONTENT (Rolável) --- */}
            <main ref={mainRef} className="flex-1 overflow-y-auto scroll-smooth relative pt-16 md:pt-0 custom-scrollbar">
                
                {/* Elementos de fundo em movimento (Ambientação) */}
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <motion.div 
                        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1], x: [0, 50, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[120px]"
                    />
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1], y: [0, 50, 0] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px]"
                    />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pb-32">
                    
                    {/* --- VISÃO GERAL (HERO) --- */}
                    <section id="visao-geral" className="min-h-screen flex flex-col justify-center pt-20 pb-10">
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-3xl">
                            
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold mb-6 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Produtividade sem atrito
                            </div>
                            
                            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1] mb-8 text-gray-900 dark:text-white">
                                Seu trabalho, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500">
                                    em estado de fluxo.
                                </span>
                            </h1>
                            
                            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-10 max-w-2xl">
                                O ecossistema perfeito para mentes inquietas. Gerencie tarefas complexas com Kanban, agende no Google Calendar e deixe a IA resumir seu dia.
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4">
                                <button onClick={onEnterApp} className="group relative px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)] hover:shadow-[0_0_60px_-15px_rgba(6,182,212,0.6)] hover:-translate-y-1 overflow-hidden">
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                                    <span className="relative flex items-center gap-2">
                                        Entrar no FlowTask
                                        <ArrowRightOnRectangleIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </section>

                    {/* --- KANBAN E LISTAS --- */}
                    <section id="kanban-listas" className="py-24 border-t border-gray-200 dark:border-gray-800/50 border-dashed">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
                            <h2 className="text-4xl md:text-5xl font-black mb-4">Gestão Visual Absoluta.</h2>
                            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl">Alterne entre a visão macro do Kanban e o detalhamento da Tabela em milissegundos.</p>
                        </motion.div>

                        <div className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-50">
                                <ChartPieIcon className="w-6 h-6 text-gray-400" />
                                <ViewListIcon className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="flex flex-col gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">O melhor dos dois mundos</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">Arraste cards entre colunas customizadas ou ordene suas tarefas por prazo, tags e categorias em uma lista densa. Tudo renderizado instantaneamente no front-end.</p>
                                </div>
                                {/* Ilustração abstrata Kanban */}
                                <div className="grid grid-cols-3 gap-4 mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                    {[1,2,3].map(col => (
                                        <div key={col} className="bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-gray-800 p-3 space-y-3">
                                            <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                            <div className="w-full h-16 bg-white dark:bg-[#161B22] rounded-lg shadow-sm border border-gray-100 dark:border-gray-800"></div>
                                            {col !== 2 && <div className="w-full h-20 bg-white dark:bg-[#161B22] rounded-lg shadow-sm border border-gray-100 dark:border-gray-800"></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* --- GOOGLE AGENDA --- */}
                    <section id="google-agenda" className="py-24 border-t border-gray-200 dark:border-gray-800/50 border-dashed">
                        <div className="flex flex-col md:flex-row gap-12 items-center">
                            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 space-y-6">
                                <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500">
                                    <CalendarIcon className="w-7 h-7" />
                                </div>
                                <h2 className="text-4xl font-black text-gray-900 dark:text-white">O tempo a seu favor.</h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Prazos não devem viver apenas na sua lista. Com nossos links mágicos, você exporta o bloco exato da sua tarefa diretamente para o Google Agenda com um único clique.
                                </p>
                                <ul className="space-y-3 font-medium text-gray-700 dark:text-gray-300">
                                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-red-500" /> Exportação de prazos (09:00 - 10:00)</li>
                                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-red-500" /> Exportação de Lembretes (+1h de duração)</li>
                                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-red-500" /> Detalhes e notas enviados automaticamente</li>
                                </ul>
                            </motion.div>
                            
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-transparent rounded-3xl blur-xl"></div>
                                <div className="relative bg-white dark:bg-[#161B22] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl flex items-center justify-center min-h-[300px]">
                                    {/* Mockup do Botão do Google Calendar */}
                                    <div className="w-full max-w-sm bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-inner">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                        <div className="w-full py-2.5 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-700 hover:border-blue-400 rounded-lg flex items-center justify-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm cursor-pointer transition-colors">
                                            <span className="w-4 h-4 bg-blue-500 rounded-sm"></span> {/* Simula ícone GCal */}
                                            Adicionar ao Google Agenda
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    {/* --- IA GEMINI --- */}
                    <section id="ia-gemini" className="py-24 border-t border-gray-200 dark:border-gray-800/50 border-dashed">
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden">
                            <div className="absolute top-10 right-10 opacity-20">
                                <SparklesIcon className="w-32 h-32 text-purple-500" />
                            </div>
                            <div className="relative z-10 max-w-2xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold mb-6 border border-purple-200 dark:border-purple-800">
                                    Powered by Gemini 3.1
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black mb-6">Não anote. Sumarize.</h2>
                                <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                                    O histórico do seu projeto virou um pergaminho interminável? Com um clique, a inteligência artificial lê todas as mudanças de status, sub-tarefas e anotações para gerar um <strong>resumo executivo em milissegundos</strong>.
                                </p>
                                <div className="bg-white dark:bg-[#0D1117] border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-inner flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
                                        <SparklesIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic self-center">
                                        "O projeto avançou para 'Em andamento'. A decisão principal foi focar na integração da API. Faltam 2 sub-tarefas críticas para a entrega."
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </section>

                    {/* --- HÁBITOS DIÁRIOS --- */}
                    <section id="habitos" className="py-24 border-t border-gray-200 dark:border-gray-800/50 border-dashed">
                        <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
                            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 space-y-6">
                                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-500">
                                    <CheckCircleIcon className="w-7 h-7" />
                                </div>
                                <h2 className="text-4xl font-black text-gray-900 dark:text-white">Rotina blindada.</h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Muito além de tarefas: construa consistência. Rastreie seus hábitos diários com um painel dedicado que reinicia magicamente à meia-noite.
                                </p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex-1 w-full">
                                <div className="bg-white dark:bg-[#161B22] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl relative overflow-hidden">
                                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                                        <ListIcon className="w-5 h-5" /> Tracker de Hábitos
                                    </h4>
                                    <div className="space-y-3">
                                        {['Beber 2L de Água', 'Leitura 20min'].map((habit, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20">
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500 text-white shadow-sm">
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                </div>
                                                <span className="font-semibold text-emerald-800 dark:text-emerald-200 line-through opacity-80">{habit}</span>
                                                <span className="ml-auto text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded-md">🔥 5 dias</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    {/* --- PRIVACIDADE E DETALHES TÉCNICOS --- */}
                    <section id="privacidade" className="py-24 border-t border-gray-200 dark:border-gray-800/50 border-dashed">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-[#161B22] p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                <GlobeAltIcon className="w-8 h-8 text-blue-500 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Local First</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Opção de armazenar seus dados 100% no seu navegador (LocalStorage). Velocidade instantânea e privacidade máxima.</p>
                            </div>
                            <div className="bg-white dark:bg-[#161B22] p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                <StarIcon className="w-8 h-8 text-yellow-500 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Dark Mode Nativo</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Design metodicamente calculado com cores de baixo contraste para conforto visual absoluto em sessões noturnas de trabalho.</p>
                            </div>
                            <div className="bg-white dark:bg-[#161B22] p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                <RocketLaunchIcon className="w-8 h-8 text-orange-500 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Extremamente Rápido</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Construído em React. Sem telas de loading. Mudanças de status, criação de tarefas e filtros aplicados em tempo real.</p>
                            </div>
                        </motion.div>
                    </section>

                    {/* --- FOOTER SIMPLES DENTRO DA ÁREA DO APP --- */}
                    <footer className="pt-10 pb-6 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 opacity-60 grayscale">
                            <img src={LP_ICON_URL} alt="FlowTask" className="h-5 w-auto" />
                            <span className="font-bold text-sm">FlowTask &copy; {new Date().getFullYear()}</span>
                        </div>
                        <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400 font-medium">
                            <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors">Termos de Uso</span>
                            <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors">Privacidade</span>
                        </div>
                    </footer>

                </div>
            </main>
        </div>
    );
};

export default LandingPage;