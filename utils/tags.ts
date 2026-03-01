// --- SANITIZADOR DE TAGS ---
export const sanitizeTag = (rawTag: string): string => {
    return rawTag
        .trim()                       // Remove espaços no início e no fim
        .toLowerCase()                // Força tudo para minúsculo
        .replace(/[^a-z0-9-]/g, '')   // Remove caracteres especiais (acentos, emojis, pontuação)
        .substring(0, 25);            // Limita a 25 caracteres para não quebrar o layout
};