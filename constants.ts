
import type { Category, Tag, Task, Status, Activity, View, Habit, HabitTemplate, Project } from './types';
import { BriefcaseIcon, UserIcon, AcademicCapIcon, ClipboardDocumentCheckIcon, FolderIcon, SunIcon } from './components/icons';

export const LOGO_URL = 'https://cdn-icons-png.flaticon.com/512/906/906334.png';

export const VIEW_TITLES: Record<View, string> = {
  dashboard: 'Dashboard',
  calendar: 'Calendário',
  list: 'Lista de Tarefas',
  reminders: 'Meus Lembretes',
  reports: 'Relatórios',
  profile: 'Meu Perfil',
  taskDetail: 'Detalhes da Tarefa',
  projects: 'Projetos',
  projectDetail: 'Detalhes do Projeto',
  settings: 'Configurações'
};

export const STATUS_OPTIONS: Status[] = ['Pendente', 'Em andamento', 'Concluída'];

export const STATUS_COLORS: Record<Status, string> = {
  'Pendente': 'bg-blue-500',
  'Em andamento': 'bg-yellow-500',
  'Concluída': 'bg-green-500',
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Trabalho', color: 'blue', icon: BriefcaseIcon },
  { id: 'cat-2', name: 'Pessoal', color: 'green', icon: UserIcon },
  { id: 'cat-3', name: 'Estudos', color: 'purple', icon: AcademicCapIcon },
  { id: 'cat-4', name: 'Saúde', color: 'red', icon: ClipboardDocumentCheckIcon },
];

export const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Alta', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/50 dark:text-red-300', baseColor: 'red' },
  { id: 'tag-2', name: 'Normal', color: 'text-yellow-700', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300', baseColor: 'yellow' },
  { id: 'tag-3', name: 'Baixa', color: 'text-green-700', bgColor: 'bg-green-100 dark:bg-green-900/50 dark:text-green-300', baseColor: 'green' },
];

// Helper to create past/future dates easily based on Dec 11, 2025
const today = new Date('2025-12-11T10:00:00');
const getDate = (daysOffset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString();
};

export const DEFAULT_PROJECTS: Project[] = [
    {
        id: 'proj-1',
        name: 'Lançamento App Mobile v2.0',
        description: 'Refatoração completa da interface e implementação do modo escuro nativo.',
        color: 'bg-blue-500',
        createdAt: getDate(-120), // 4 months ago
        activity: [
            { id: 'pa-1', type: 'creation', timestamp: getDate(-120), user: 'Admin', note: 'Projeto iniciado' },
            { id: 'pa-2', type: 'note', timestamp: getDate(-60), user: 'Admin', note: 'Design system aprovado pela equipe de UI.' },
            { id: 'pa-3', type: 'status_change', timestamp: getDate(-30), user: 'Admin', from: 'Planejamento', to: 'Desenvolvimento', taskTitle: 'Fase 1' },
            { id: 'pa-4', type: 'note', timestamp: getDate(-5), user: 'Admin', note: 'Sprint final de correções iniciada.', isAiGenerated: true }
        ]
    },
    {
        id: 'proj-2',
        name: 'Planejamento Financeiro 2026',
        description: 'Organização de orçamento, investimentos e metas para o próximo ano.',
        color: 'bg-green-500',
        createdAt: getDate(-20),
        activity: [
            { id: 'pa-21', type: 'creation', timestamp: getDate(-20), user: 'Admin' },
            { id: 'pa-22', type: 'note', timestamp: getDate(-10), user: 'Admin', note: 'Planilhas base criadas e importadas.' }
        ]
    },
    {
        id: 'proj-3',
        name: 'Reforma do Home Office',
        description: 'Pintura, novos móveis e iluminação para o escritório de casa.',
        color: 'bg-yellow-500',
        createdAt: getDate(-200), // Completed project basically
        activity: [
            { id: 'pa-31', type: 'creation', timestamp: getDate(-200), user: 'Admin' },
            { id: 'pa-32', type: 'note', timestamp: getDate(-150), user: 'Admin', note: 'Orçamentos de marcenaria fechados.' },
            { id: 'pa-33', type: 'note', timestamp: getDate(-100), user: 'Admin', note: 'Pintura finalizada. Aguardando entrega da mesa.' }
        ]
    },
    {
        id: 'proj-4',
        name: 'Curso de Inglês Avançado',
        description: 'Aulas semanais e preparação para o exame TOEFL.',
        color: 'bg-purple-500',
        createdAt: getDate(-300),
        activity: []
    }
];

export const DEFAULT_TASKS: Task[] = [
  // --- PROJETO 1: APP MOBILE (Misto de concluído e andamento) ---
  {
    id: 't-1',
    title: 'Definir paleta de cores Dark Mode',
    description: 'Selecionar tons de cinza e cores de destaque acessíveis.',
    dateTime: getDate(-110),
    dueDate: getDate(-100),
    categoryId: 'cat-1',
    tagId: 'tag-1',
    status: 'Concluída',
    projectId: 'proj-1',
    subTasks: [
        { id: 'st-1', text: 'Pesquisar referências', completed: true },
        { id: 'st-2', text: 'Validar contraste WCAG', completed: true }
    ],
    activity: [
        { id: 'a-1', type: 'creation', timestamp: getDate(-110), user: 'Admin' },
        { id: 'a-2', type: 'status_change', from: 'Pendente', to: 'Concluída', timestamp: getDate(-100), user: 'Admin' }
    ],
    tags: ['Design', 'UI']
  },
  {
    id: 't-2',
    title: 'Implementar autenticação biométrica',
    description: 'Adicionar suporte a FaceID e TouchID no login.',
    dateTime: getDate(-90),
    dueDate: getDate(-80),
    categoryId: 'cat-1',
    tagId: 'tag-1',
    status: 'Concluída',
    projectId: 'proj-1',
    subTasks: [
        { id: 'st-21', text: 'Configurar lib nativa', completed: true },
        { id: 'st-22', text: 'Tela de fallback de senha', completed: true }
    ],
    activity: [{ id: 'a-3', type: 'creation', timestamp: getDate(-90), user: 'Admin' }],
    tags: ['Dev', 'Security']
  },
  {
    id: 't-3',
    title: 'Testes de regressão - Módulo de Perfil',
    description: 'Garantir que a atualização de foto e dados não quebrou com a nova API.',
    dateTime: getDate(-10),
    dueDate: getDate(2), // Due soon
    categoryId: 'cat-1',
    tagId: 'tag-1',
    status: 'Em andamento',
    projectId: 'proj-1',
    subTasks: [
        { id: 'st-31', text: 'Testar upload de imagem', completed: true },
        { id: 'st-32', text: 'Testar validação de e-mail', completed: false }
    ],
    activity: [
        { id: 'a-4', type: 'creation', timestamp: getDate(-10), user: 'Admin' },
        { id: 'a-5', type: 'note', timestamp: getDate(-2), user: 'Admin', note: 'Bug encontrado no upload de PNGs transparentes. Correção em andamento.' }
    ],
    tags: ['QA', 'Bugfix']
  },
  {
    id: 't-4',
    title: 'Preparar release notes v2.0',
    description: 'Escrever texto para Apple Store e Google Play.',
    dateTime: getDate(-5),
    dueDate: getDate(5),
    categoryId: 'cat-1',
    tagId: 'tag-2',
    status: 'Pendente',
    projectId: 'proj-1',
    subTasks: [],
    activity: [],
    tags: ['Marketing']
  },

  // --- PROJETO 2: FINANCEIRO (Início recente) ---
  {
    id: 't-5',
    title: 'Levantar gastos fixos de 2025',
    description: 'Exportar extratos bancários e categorizar despesas.',
    dateTime: getDate(-15),
    dueDate: getDate(-5),
    categoryId: 'cat-2',
    tagId: 'tag-1',
    status: 'Concluída',
    projectId: 'proj-2',
    subTasks: [],
    activity: [
        { id: 'a-6', type: 'status_change', from: 'Em andamento', to: 'Concluída', timestamp: getDate(-5), user: 'Admin' }
    ],
    tags: ['Finanças']
  },
  {
    id: 't-6',
    title: 'Definir meta de aportes para FIIs',
    description: 'Calcular percentual da renda líquida para renda variável.',
    dateTime: getDate(-5),
    dueDate: getDate(10),
    categoryId: 'cat-2',
    tagId: 'tag-2',
    status: 'Pendente',
    projectId: 'proj-2',
    subTasks: [],
    activity: [],
    tags: ['Investimentos']
  },

  // --- PROJETO 3: REFORMA (Maioria concluído) ---
  {
    id: 't-7',
    title: 'Comprar tinta Suvinil Algodão Egípcio',
    description: '3 latas de 18L.',
    dateTime: getDate(-180),
    dueDate: getDate(-175),
    categoryId: 'cat-2',
    tagId: 'tag-2',
    status: 'Concluída',
    projectId: 'proj-3',
    subTasks: [],
    activity: [],
    tags: ['Compras']
  },
  {
    id: 't-8',
    title: 'Instalar prateleiras novas',
    dateTime: getDate(-150),
    dueDate: getDate(-148),
    categoryId: 'cat-2',
    tagId: 'tag-2',
    status: 'Concluída',
    projectId: 'proj-3',
    subTasks: [],
    activity: [],
    tags: ['DIY']
  },
  {
    id: 't-9',
    title: 'Organizar cabos da mesa',
    description: 'Comprar fitas velcro e canaletas.',
    dateTime: getDate(-140),
    dueDate: getDate(-130),
    categoryId: 'cat-2',
    tagId: 'tag-3',
    status: 'Concluída',
    projectId: 'proj-3',
    subTasks: [],
    activity: [],
    tags: ['Organização']
  },
  
  // --- PROJETO 4: INGLÊS (Recorrente/Longo prazo) ---
  {
    id: 't-10',
    title: 'Simulado TOEFL Reading',
    dateTime: getDate(-60),
    dueDate: getDate(-60),
    categoryId: 'cat-3',
    tagId: 'tag-1',
    status: 'Concluída',
    projectId: 'proj-4',
    subTasks: [],
    activity: [{ id: 'a-10', type: 'note', timestamp: getDate(-60), user: 'Admin', note: 'Score: 28/30' }],
    tags: ['TOEFL']
  },
  {
    id: 't-11',
    title: 'Simulado TOEFL Listening',
    dateTime: getDate(-30),
    dueDate: getDate(-30),
    categoryId: 'cat-3',
    tagId: 'tag-1',
    status: 'Concluída',
    projectId: 'proj-4',
    subTasks: [],
    activity: [{ id: 'a-11', type: 'note', timestamp: getDate(-30), user: 'Admin', note: 'Score: 26/30. Preciso melhorar em sotaques britânicos.' }],
    tags: ['TOEFL']
  },
  {
    id: 't-12',
    title: 'Escrever redação: "Technology impact"',
    dateTime: getDate(0),
    dueDate: getDate(3),
    categoryId: 'cat-3',
    tagId: 'tag-1',
    status: 'Em andamento',
    projectId: 'proj-4',
    subTasks: [
        { id: 'st-121', text: 'Brainstorming', completed: true },
        { id: 'st-122', text: 'Drafting', completed: false }
    ],
    activity: [],
    tags: ['Writing']
  },

  // --- TASKS SOLTAS (Sem projeto) ---
  {
    id: 't-13',
    title: 'Comprar presente de Natal (Mãe)',
    dateTime: getDate(-10),
    dueDate: getDate(8),
    categoryId: 'cat-2',
    tagId: 'tag-1',
    status: 'Pendente',
    subTasks: [],
    activity: [],
    tags: ['Natal']
  },
  {
    id: 't-14',
    title: 'Agendar revisão do carro',
    description: 'Troca de óleo e filtros. Verificar freios.',
    dateTime: getDate(-40),
    dueDate: getDate(-35),
    categoryId: 'cat-2',
    tagId: 'tag-2',
    status: 'Concluída',
    subTasks: [],
    activity: [],
    tags: ['Carro']
  },
  {
    id: 't-15',
    title: 'Renovar seguro residencial',
    dateTime: getDate(-50),
    dueDate: getDate(-45),
    categoryId: 'cat-2',
    tagId: 'tag-1',
    status: 'Concluída',
    subTasks: [],
    activity: [],
    tags: ['Contas']
  },
  {
    id: 't-16',
    title: 'Consulta Dermatologista',
    dateTime: getDate(1), // Tomorrow
    dueDate: getDate(1),
    categoryId: 'cat-4',
    tagId: 'tag-2',
    status: 'Pendente',
    subTasks: [],
    activity: [
        { id: 'a-16', type: 'reminder', timestamp: getDate(-2), notifyAt: getDate(0.5), note: 'Levar exames anteriores', user: 'Admin' }
    ],
    tags: ['Médico']
  },
  {
    id: 't-17',
    title: 'Academia - Treino A',
    dateTime: getDate(0), // Today
    dueDate: getDate(0),
    categoryId: 'cat-4',
    tagId: 'tag-3',
    status: 'Pendente',
    subTasks: [],
    activity: [],
    tags: ['Fitness']
  },
  {
    id: 't-18',
    title: 'Ler "O Programador Pragmático" - Cap 4',
    dateTime: getDate(-2),
    dueDate: getDate(0),
    categoryId: 'cat-3',
    tagId: 'tag-3',
    status: 'Em andamento',
    subTasks: [],
    activity: [],
    tags: ['Leitura']
  },
  {
    id: 't-19',
    title: 'Backup das fotos do celular',
    dateTime: getDate(-100),
    dueDate: getDate(-99),
    categoryId: 'cat-2',
    tagId: 'tag-3',
    status: 'Concluída',
    subTasks: [],
    activity: [],
    tags: ['Digital']
  },
  {
    id: 't-20',
    title: 'Reunião de Feedback Trimestral',
    dateTime: getDate(-5),
    dueDate: getDate(-5),
    categoryId: 'cat-1',
    tagId: 'tag-1',
    status: 'Concluída',
    subTasks: [],
    activity: [{ id: 'a-20', type: 'note', timestamp: getDate(-5), user: 'Admin', note: 'Feedback positivo sobre o projeto App Mobile.', isAiGenerated: true }],
    tags: ['Reunião']
  }
];

export const HABIT_TEMPLATES: HabitTemplate[] = [
    { id: 'ht-1', title: 'Beber 2L de água', type: 'manual', description: 'Manter a hidratação diária.' },
    { id: 'ht-2', title: 'Ler 10 páginas', type: 'manual', description: 'Desenvolver o hábito da leitura.' },
    { id: 'ht-3', title: 'Exercício Físico', type: 'manual', description: 'Pelo menos 30 minutos de atividade.' },
    { id: 'ht-4', title: 'Zerar Tarefas Pendentes', type: 'auto-task-completion', description: 'Concluir pelo menos uma tarefa do dia.' },
    { id: 'ht-5', title: 'Meditação', type: 'manual', description: '10 minutos de mindfulness.' },
];

export const DEFAULT_HABITS: Habit[] = [
    { id: 'h-1', title: 'Beber água (manhã)', type: 'manual', reminderTime: '09:00' },
    { id: 'h-2', title: 'Concluir 1 Tarefa Importante', type: 'auto-task-completion' },
];
