export interface ChangeLogItem {
    version: string;
    date: string;
    title: string;
    description?: string;
    changes: {
        type: 'feature' | 'improvement' | 'fix';
        text: string;
    }[];
}


/* Ao adicionar novas novidades e tutoriais, atualizar a seção de tutoriais no "settingsview" */

export const CHANGELOG_DATA: ChangeLogItem[] = [
    {
        version: '1.3.2',
        date: '2026-02-19',
        title: 'Integração com Google Agenda',
        description: 'Agora você pode adicionar suas tarefas e lembretes diretamente no Google Agenda.',
        changes: [
            { 
                type: 'feature', 
                text: 'Atalho para integração com Google Agenda: Adicione tarefas e lembretes ao seu calendário oficial com apenas um clique através de links inteligentes. Ao passar o mouse sobre o prazo de uma tarefa, um novo botão "Adicionar ao Google Agenda" aparece.' 
            },
            { 
                type: 'feature', 
                text: 'Na tela de lembretes, agora é possível exportar o horário exato da notificação para o Google Agenda, incluindo notas extras e detalhes da tarefa.' 
            }
        ]
    },
    {
        version: '1.3.0',
        date: '2026-02-18',
        title: 'Nova Interface de Lembretes e Melhorias Visuais',
        description: 'Um visual mais moderno para seus lembretes e uma experiência de navegação mais fluida e responsiva.',
        changes: [
            { 
                type: 'improvement', 
                text: 'Nova Tela de Lembretes: Redesign completo com layout de duas colunas e feed de urgência.' 
            },
            { 
                type: 'improvement', 
                text: 'Responsividade do aplicativo: Em telas menores (Notebooks), telas como Dashboard, Projetos e Lista de tarefas se adaptam à diferentes resoluções, tornando a usabilidade mais fluída.' 
            },
            { 
                type: 'fix', 
                text: 'Correção de bugs da Barra Lateral (Sidebar) quando está em sua versão compacta.' 
            }
        ]
    },
    {
        version: '1.2.5',
        date: '2026-02-06',
        title: 'Novas funcionalidades e melhorias',
        description: 'Mais controle sobre suas notificações e mais detalhes nas suas tarefas.',
        changes: [
            { type: 'improvement', text: 'Configure um horário para receber uma notificação de "Resumo do dia", para notificações atrasadas, que vencem "Hoje", e "Amanhã".' },
            { type: 'feature', text: 'Agora você pode receber notificações push do Navegador (Windows e Mac).' },
            { type: 'feature', text: 'Habilite um discreto aviso sonoro para as notificações do App.' },
            { type: 'feature', text: 'Nova seção de Documentos dentro de Tarefas. Salve Documentos e Links (URL Apenas) relacionadas a sua tarefa. Dica: Passe o mouse sobre links adicionados nas anotações, para adicioná-los aos "Documentos e Links"' },
            { type: 'improvement', text: 'Agora é possível filtrar por "Projetos" na "Lista de Tarefas"' }
        ]
    },
    {
        version: '1.2.0',
        date: '2026-01-11',
        title: 'Novas opções para gerenciar tarefas',
        description: 'Adição de novas funcionalidades.',
        changes: [
            { type: 'improvement', text: 'Prorrogação Rápida de Prazos: Agora você pode alterar a data de vencimento diretamente pelo card da tarefa. Basta clicar no indicador de atraso para acessar opções rápidas como "Amanhã" ou "Próxima Semana"' },
            { type: 'feature', text: 'Status "Em Espera" (On Hold): Pause tarefas que dependem de terceiros ou bloqueios externos. Tarefas pausadas ganham destaque visual amarelo (removendo o alerta de atraso) e a ação é registrada automaticamente no histórico.' }
        ]
    },
    {
        version: '1.1.0',
        date: '2026-01-08',
        title: 'Configurações Visuais, Navegação e Usabilidade',
        description: 'Melhorias significativas na navegação entre projetos e calendário.',
        changes: [
            { type: 'improvement', text: 'Agora ao criar uma tarefa vindo do Calendário, a data já vem preenchida.' },
            { type: 'improvement', text: 'Ao criar tarefa a partir da tela de um Projeto, o projeto já vem selecionado automaticamente.' },
            { type: 'improvement', text: 'Links na descrição das tarefas agora são clicáveis automaticamente.' },
            { type: 'fix', text: 'Correção na exibição de tarefas no calendário (agora considera data de vencimento).' },
            { type: 'feature', text: 'Adicionada opção para exibir/ocultar nome (ou apenas o ícone) do projeto nos cards. Possível editar em "Configurações".' }
        ]
    }
    // Adicione novas versões no topo da lista
];