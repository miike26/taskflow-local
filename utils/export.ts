import { Task, Category, Tag, Project } from '../types';

// Função auxiliar para escapar caracteres especiais do CSV (aspas, vírgulas, quebras de linha)
const escapeCsvCell = (text: string | undefined | null): string => {
    if (!text) return '';
    const stringText = String(text);
    // Se tiver aspas, vírgula ou quebra de linha, envolve em aspas e duplica as aspas internas
    if (stringText.includes('"') || stringText.includes(',') || stringText.includes('\n')) {
        return `"${stringText.replace(/"/g, '""')}"`;
    }
    return stringText;
};

// [ATUALIZADO] Formata data E hora (DD/MM/AAAA HH:mm)
const formatDateTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Verifica se a data é válida
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const exportTasksToCSV = (
    tasks: Task[], 
    categories: Category[], 
    tags: Tag[], 
    projects: Project[]
) => {
    // 1. Definir o Cabeçalho (Adicionado "Tags")
    const headers = [
        'ID',
        'Título',
        'Descrição',
        'Status',
        'Prioridade',
        'Categoria',
        'Tags', // <--- Nova Coluna
        'Projeto',
        'Data Criação',
        'Prazo Final',
        'Concluída em',
        'Subtarefas'
    ];

    // 2. Mapear as linhas
    const rows = tasks.map(task => {
        const categoryName = categories.find(c => c.id === task.categoryId)?.name || 'Sem Categoria';
        
        // "Prioridade" visual (tagId)
        const priorityName = tags.find(t => t.id === task.tagId)?.name || 'Sem Prioridade';
        
        const projectName = projects.find(p => p.id === task.projectId)?.name || 'Sem Projeto';
        
        // [NOVO] Tags extras da tarefa (array de strings)
        const taskTags = task.tags && task.tags.length > 0 ? task.tags.join(', ') : '';

        // Calcular progresso das subtarefas
        const subTotal = task.subTasks.length;
        const subCompleted = task.subTasks.filter(s => s.completed).length;
        const progress = subTotal > 0 ? `${subCompleted}/${subTotal}` : '-';

        // Buscar data de conclusão (última mudança para 'Concluída')
        let completedDate = '';
        if (task.status === 'Concluída') {
            const activity = [...task.activity].reverse().find(a => a.type === 'status_change' && a.to === 'Concluída');
            if (activity) completedDate = activity.timestamp;
        }

        return [
            task.id,
            task.title,
            task.description || '',
            task.status,
            priorityName,
            categoryName,
            taskTags, // <--- Valor das Tags
            projectName,
            formatDateTime(task.dateTime), // <--- Com Hora
            formatDateTime(task.dueDate),  // <--- Com Hora
            formatDateTime(completedDate), // <--- Com Hora
            progress
        ].map(escapeCsvCell).join(','); // Junta as colunas com vírgula
    });

    // 3. Montar o conteúdo final
    const csvContent = [headers.join(','), ...rows].join('\n');

    // 4. Criar o Blob e forçar o download
    // Adiciona o BOM (\uFEFF) para o Excel reconhecer acentos (UTF-8) corretamente
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tarefas_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};