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
    // {
    //     version: '1.2.0',
    //     date: '2026-01-08',
    //     title: 'Navegação e Usabilidade',
    //     description: 'Melhorias significativas na navegação entre projetos e calendário.',
    //     changes: [
    //         { type: 'feature', text: 'Agora ao criar uma tarefa vindo do Calendário, a data já vem preenchida.' },
    //         { type: 'feature', text: 'Ao criar tarefa dentro de um Projeto, o projeto já vem selecionado automaticamente.' },
    //         { type: 'improvement', text: 'Links na descrição das tarefas agora são clicáveis automaticamente.' },
    //         { type: 'fix', text: 'Correção na exibição de tarefas no calendário (agora considera data de vencimento).' }
    //     ]
    // },
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