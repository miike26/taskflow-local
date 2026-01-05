import React, { useState, useEffect } from 'react';
import {
    CheckCircleIcon, SparklesIcon, ChartPieIcon,
    ArrowRightOnRectangleIcon, RocketLaunchIcon, StarIcon, GlobeAltIcon
} from './icons';
import { LP_ICON_URL, APP_ICON_URL } from '../constants';

const FeatureSection: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    reversed?: boolean;
    // Novos campos opcionais:
    mediaType?: 'video' | 'image';
    mediaSrc?: string;
    mediaPlaceholderText?: string;
}> = ({ title, description, icon, reversed, mediaPlaceholderText, mediaType, mediaSrc }) => (
    <div className={`flex flex-col lg:flex-row items-center gap-16 py-24 ${reversed ? 'lg:flex-row-reverse' : ''}`}>
        <div className="flex-1 space-y-8 relative z-10">
            <div className="inline-flex items-center justify-center p-4 bg-white dark:bg-white/5 rounded-2xl shadow-xl shadow-primary-500/10 border border-primary-100 dark:border-white/10 text-primary-600 dark:text-primary-400 backdrop-blur-sm">
                {icon}
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                {title}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                {description}
            </p>
            <div className="flex items-center gap-4 text-sm font-bold text-primary-600 dark:text-primary-400 cursor-pointer group">
                <span>Saiba mais</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
        </div>

        <div className="flex-1 w-full relative group perspective-1000">
            {/* Glow Effect */}
            <div className={`absolute -inset-4 bg-gradient-to-r ${reversed ? 'from-purple-500/20 to-primary-500/20' : 'from-primary-500/20 to-blue-500/20'} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>

            {/* CONTAINER DA MÍDIA */}
            <div className="relative w-full aspect-video bg-white/50 dark:bg-[#161B22]/80 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 dark:border-white/10 overflow-hidden transform transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-primary-500/10">

                {/* Barra de título fake (pra parecer uma janela de app) */}
                <div className="absolute top-0 left-0 w-full h-10 bg-gray-100/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 flex items-center px-4 gap-2 z-20">
                    <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>

                {/* LÓGICA DE EXIBIÇÃO: Vídeo vs Imagem vs Placeholder */}
                <div className="absolute inset-0 pt-10 bg-gray-50 dark:bg-[#0D1117] flex items-center justify-center">

                    {mediaType === 'video' && mediaSrc ? (
                        <video
                            src={mediaSrc}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline // Importante para mobile
                        />
                    ) : mediaType === 'image' && mediaSrc ? (
                        <img
                            src={mediaSrc}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        // Fallback para o placeholder antigo
                        <div className="text-center p-8">
                            <span className="inline-block p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-sm">
                                {mediaPlaceholderText || 'Mídia indisponível'}
                            </span>
                        </div>
                    )}

                </div>
            </div>
        </div>
    </div>
);

const LandingPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // [LÓGICA DE REDIRECIONAMENTO]
    const handleEnterApp = () => {
        // Redireciona para o subdomínio do app
        window.location.href = "https://app.flowtask.tech";
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#090c10] text-gray-800 dark:text-gray-200 font-sans overflow-x-hidden selection:bg-primary-500 selection:text-white relative">

            {/* --- DYNAMIC BACKGROUND --- */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

                {/* Floating Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-primary-500/20 rounded-full blur-[120px] animate-pulse-slow [animation-delay:2s]"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse-slow [animation-delay:4s]"></div>
            </div>

            {/* --- NAVBAR --- */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/80 dark:bg-[#0D1117]/80 backdrop-blur-md border-gray-200 dark:border-gray-800 h-16' : 'bg-transparent border-transparent h-24'}`}>
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-500 blur opacity-10 rounded-full"></div>
                            <img src={LP_ICON_URL} alt="FlowTask Logo" className="h-8 w-auto relative z-10" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleEnterApp}
                            className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105 active:scale-95 flex items-center gap-2 text-sm"
                        >
                            Acessar FlowTask
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="relative pt-48 pb-32 px-6 overflow-hidden">
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-primary-200 dark:border-white/10 text-primary-700 dark:text-primary-300 text-sm font-bold mb-8 animate-fade-in backdrop-blur-md shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                        </span>
                        A Nova Era da Produtividade
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-[1.1] animate-slide-up-fade-in">
                        Organize sua vida.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 animate-gradient-x">
                            Domine seu tempo.
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                        O FlowTask combina <span className="text-gray-900 dark:text-white font-semibold">gerenciamento de tarefas</span>, <span className="text-gray-900 dark:text-white font-semibold">calendário inteligente</span> e <span className="text-gray-900 dark:text-white font-semibold">IA generativa</span> para transformar o caos em clareza absoluta.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button onClick={handleEnterApp} className="group relative px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)] hover:shadow-[0_0_60px_-15px_rgba(6,182,212,0.6)] hover:-translate-y-1 overflow-hidden w-full sm:w-auto">
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                            <span className="relative flex items-center gap-2 justify-center">
                                Começar Agora Grátis
                                <RocketLaunchIcon className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                            </span>
                        </button>
                    </div>
                </div>

                {/* Hero App Screenshot */}
                <div className="mt-24 max-w-7xl mx-auto relative animate-scale-in perspective-[2000px] group">
                    {/* Reflective Gradient below */}
                    <div className="absolute -inset-1 bg-gradient-to-b from-primary-500/30 to-purple-600/30 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000"></div>

                    <div className="relative aspect-video bg-gray-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden transform rotate-x-12 group-hover:rotate-x-0 transition-transform duration-1000 ease-out origin-bottom">
                        {/* Mockup Header */}
                        <div className="absolute top-0 left-0 right-0 h-12 bg-[#161B22] border-b border-white/5 flex items-center px-6 gap-3 z-20">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                            </div>
                            <div className="mx-auto w-1/3 h-2 bg-white/5 rounded-full"></div>
                        </div>

                        {/* Mockup Body - Placeholder */}
                        <div className="absolute inset-0 pt-12 bg-[#0D1117] flex items-center justify-center">
                            <video
                                src="/landing/hero-dashboard.mp4"
                                className="w-full h-full object-contain object-top"
                                autoPlay
                                muted
                                loop
                                playsInline // Importante para funcionar no iPhone/Android
                            />
                        </div>

                        {/* Glossy Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-30"></div>
                    </div>
                </div>
            </header>

            {/* --- FEATURES SECTION --- */}
            <section className="py-32 px-6 max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24">
                    <h2 className="text-sm font-bold text-primary-500 uppercase tracking-widest mb-3">Funcionalidades</h2>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">Tudo o que você precisa.</h2>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Ferramentas poderosas envoltas em uma interface que você vai adorar usar todos os dias.
                    </p>
                </div>

                <FeatureSection
                    title="Kanban & Listas Fluídas"
                    description="Alterne facilmente entre diferentes modos de visualização. Arraste tarefas entre colunas, priorize com cores e mantenha o fluxo de trabalho dinâmico."
                    icon={<ChartPieIcon className="w-8 h-8" />}
                    mediaPlaceholderText="Animação: Drag & Drop"
                />

                <FeatureSection
                    title="Inteligência Artificial Real"
                    description="Não perca tempo formatando notas ou decidindo o que fazer. Nossa IA analisa seus projetos, sugere 'Quick Wins' e resume históricos complexos em segundos."
                    icon={<SparklesIcon className="w-8 h-8" />}
                    reversed
                    mediaPlaceholderText="Vídeo: IA Summarization"
                />

                <FeatureSection
                    title="Hábitos que Perduram"
                    description="Construa rotinas sólidas. Acompanhe seus hábitos diários com checklists inteligentes que se reiniciam automaticamente e geram relatórios de constância."
                    icon={<CheckCircleIcon className="w-8 h-8" />}
                    mediaPlaceholderText="Imagem: Widget de Hábitos"
                />

                {/* Extra Grid of Mini Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
                    {[
                        { title: "Modo Escuro Nativo", desc: "Conforto visual automático ou manual.", icon: <StarIcon className="w-6 h-6" /> },
                        { title: "Privacidade Total", desc: "Seus dados são seus. Opção de armazenamento local.", icon: <GlobeAltIcon className="w-6 h-6" /> },
                        { title: "Extremamente Rápido", desc: "Interface otimizada para zero latência.", icon: <RocketLaunchIcon className="w-6 h-6" /> },
                    ].map((item, i) => (
                        <div key={i} className="bg-white dark:bg-[#161B22] p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-primary-500/50 transition-colors shadow-sm hover:shadow-lg">
                            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                                {item.icon}
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                            <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- LEGAL SECTION --- */}
            <section className="py-24 bg-white dark:bg-[#0D1117] border-t border-gray-200 dark:border-gray-800 relative z-10">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex justify-center gap-2 mb-12 bg-gray-100 dark:bg-[#161B22] p-1 rounded-full w-fit mx-auto">
                        <button
                            onClick={() => setActiveTab('terms')}
                            className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === 'terms' ? 'bg-white dark:bg-primary-600 shadow-md text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                        >
                            Termos de Uso
                        </button>
                        <button
                            onClick={() => setActiveTab('privacy')}
                            className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === 'privacy' ? 'bg-white dark:bg-primary-600 shadow-md text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                        >
                            Privacidade
                        </button>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#161B22]/50 p-10 rounded-3xl border border-gray-200 dark:border-gray-800 h-96 overflow-y-auto custom-scrollbar prose prose-sm md:prose-base dark:prose-invert max-w-none shadow-inner text-left">
                        {activeTab === 'terms' ? (
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1. Visão Geral</h3>
                                    <p>Bem-vindo ao <strong>FlowTask</strong>. Ao acessar nossa plataforma ou utilizar nosso aplicativo, você concorda em estar vinculado a estes Termos de Serviço, a todas as leis e regulamentos aplicáveis, e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2. Uso da Licença</h3>
                                    <p>É concedida permissão para o uso pessoal e/ou profissional do software FlowTask. Esta é a concessão de uma licença, não uma transferência de título, e sob esta licença você não pode:</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                                        <li>Modificar ou copiar os materiais (código-fonte, design);</li>
                                        <li>Usar os materiais para qualquer finalidade comercial de revenda ou exibição pública;</li>
                                        <li>Tentar descompilar ou fazer engenharia reversa de qualquer software contido no FlowTask;</li>
                                        <li>Remover quaisquer direitos autorais ou outras notações de propriedade.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">3. Recursos de Inteligência Artificial</h3>
                                    <p>O FlowTask utiliza a API do Google Gemini para fornecer recursos como resumo de tarefas e sugestões inteligentes ("Quick Wins").</p>
                                    <p className="mt-2">Ao utilizar estes recursos, você entende que:</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                                        <li>As respostas são geradas automaticamente e podem conter imprecisões;</li>
                                        <li>Você é responsável por verificar as informações antes de tomar ações baseadas nelas;</li>
                                        <li>O serviço de IA é fornecido "como está", sujeito à disponibilidade da API do fornecedor (Google).</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">4. Isenção de Responsabilidade</h3>
                                    <p>Os materiais no FlowTask são fornecidos "como estão". Não oferecemos garantias, expressas ou implícitas, e, por este meio, isentamos e negamos todas as outras garantias, incluindo, sem limitação, garantias implícitas de comercialização ou adequação a um fim específico.</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">5. Modificações</h3>
                                    <p>O FlowTask pode revisar estes termos de serviço a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.</p>
                                </section>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1. Compromisso com a Privacidade</h3>
                                    <p>Sua privacidade é fundamental. Esta política descreve como o FlowTask coleta, usa e protege suas informações. Operamos em conformidade com as melhores práticas de segurança e a Lei Geral de Proteção de Dados (LGPD).</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2. Dados que Coletamos</h3>
                                    <p>Coletamos apenas o mínimo necessário para o funcionamento da ferramenta:</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                                        <li><strong>Informações de Conta:</strong> Nome e E-mail (fornecidos através da autenticação Google/Firebase);</li>
                                        <li><strong>Dados de Uso:</strong> Tarefas, projetos, etiquetas e hábitos que você cria na plataforma;</li>
                                        <li><strong>Preferências:</strong> Configurações de tema, notificações e layout.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">3. Armazenamento e Segurança</h3>
                                    <p>Utilizamos uma arquitetura híbrida para maximizar sua performance e privacidade:</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                                        <li><strong>Local:</strong> Seus dados são cacheados no armazenamento local (LocalStorage) do seu navegador para acesso instantâneo.</li>
                                        <li><strong>Nuvem:</strong> Quando conectado, sincronizamos seus dados com o Google Firebase (Firestore), que utiliza criptografia em trânsito e em repouso.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">4. IA e Compartilhamento de Dados</h3>
                                    <p>Para fornecer funcionalidades de IA (resumos e sugestões), enviamos o texto das suas tarefas selecionadas para a API do Google Gemini.</p>
                                    <p className="mt-2 font-semibold text-primary-600 dark:text-primary-400">Importante:</p>
                                    <p>Esses dados são enviados estritamente para gerar a resposta solicitada no momento da ação. Não vendemos seus dados para terceiros e não utilizamos suas informações para publicidade.</p>
                                </section>

                                <section>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">5. Seus Direitos</h3>
                                    <p>Você tem controle total sobre seus dados. A qualquer momento, através das configurações do aplicativo, você pode:</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                                        <li>Solicitar uma cópia de todos os seus dados;</li>
                                        <li>Excluir permanentemente sua conta e todas as informações associadas dos nossos servidores.</li>
                                    </ul>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-12 text-center border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0D1117] relative z-10">
                <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    <img src={LP_ICON_URL} alt="FlowTask" className="h-6 w-auto" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} FlowTask. Criado para organizar o caos.
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;