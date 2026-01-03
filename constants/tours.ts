
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
        description: "Clique no botão '+' no topo ou utilize atalhos rápidos. Defina prazos, categorias e prioridades para manter tudo organizado desde o início.",
        mediaType: "image",
        mediaUrl: "https://placehold.co/600x340/06b6d4/ffffff?text=Criar+Tarefa" // Placeholder visual
    },
    {
        id: 2,
        title: "Organize com Projetos",
        description: "Agrupe suas tarefas em Projetos dedicados. Acompanhe o progresso geral, defina ícones personalizados e mantenha o foco no que realmente importa.",
        mediaType: "image",
        mediaUrl: "https://placehold.co/600x340/8b5cf6/ffffff?text=Projetos"
    },
    {
        id: 3,
        title: "Inteligência Artificial ao seu lado",
        description: "Use o botão de 'Sumarizar' em tarefas e projetos para gerar resumos automáticos, ou peça para a IA formatar suas anotações bagunçadas.",
        mediaType: "image",
        mediaUrl: "https://placehold.co/600x340/10b981/ffffff?text=IA+Generativa"
    },
    {
        id: 4,
        title: "Hábitos e Rotina",
        description: "Configure seus hábitos diários. O sistema reinicia a contagem automaticamente todo dia e envia lembretes para você não quebrar a corrente.",
        mediaType: "image",
        mediaUrl: "https://placehold.co/600x340/f59e0b/ffffff?text=Habitos"
    }
];
