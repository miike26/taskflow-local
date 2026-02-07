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

export const CHANGELOG_DATA: ChangeLogItem[] = [
    {
        version: '1.2.5',
        date: '2026-02-06',
        title: 'Melhorias no sistema de notificações',
        description: 'Novas possibilidades e configurações para notificações no App.',
        changes: [
            { type: 'improvement', text: 'Configure um horário para receber uma notificação de "Resumo do dia", para notificações atrasadas, que vencem "Hoje", e "Amanhã".' },
            { type: 'feature', text: 'Agora você pode receber notificações push do Navegador (Windows e Mac).' },
            { type: 'feature', text: 'Habilite um discreto aviso sonoro para as notificações do App.' }
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