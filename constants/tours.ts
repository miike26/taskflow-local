
export interface TourStep {
    id: number;
    title: string;
    description: string;
    mediaType: 'image' | 'gif' | 'video' | 'youtube';
    mediaUrl: string;
}

export const FEATURE_TOUR_STEPS: TourStep[] = [
    {
        id: 1,
        title: "Crie suas Tarefas num piscar de olhos",
        description: "Clique no botão '+' no topo para criar uma nova tarefa. Defina prazos, categorias e prioridades para manter tudo organizado desde o início.",
        mediaType: "video",
        mediaUrl: "tours/Tour1-createtask.mp4"
    },
    {
        id: 2,
        title: "Organize com Projetos",
        description: "Agrupe suas tarefas em Projetos dedicados. Acompanhe o progresso geral, defina ícones personalizados e mantenha o foco no que realmente importa.",
        mediaType: "video",
        mediaUrl: "tours/Tour2-project.mp4"
    },
    {
        id: 3,
        title: "Inteligência Artificial ao seu lado",
        description: "Use o botão de 'Sumarizar' em tarefas e projetos para gerar resumos automáticos com base nas suas anotações e contexto das tarefas, ou peça para a IA formatar suas anotações bagunçadas.",
        mediaType: "video",
        mediaUrl: "tours/Tour3-AI.mp4"
    },
    {
        id: 4,
        title: "Hábitos e Rotina",
        description: "Configure seus hábitos diários. O sistema reinicia a contagem automaticamente todo dia e envia lembretes para você não quebrar a corrente.",
        mediaType: "video",
        mediaUrl: "tours/Tour4-Habits.mp4"
    }
];
