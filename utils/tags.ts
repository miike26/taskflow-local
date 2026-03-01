// --- SANITIZADOR DE TAGS ---
export const sanitizeTag = (rawTag: string): string => {
    return rawTag
        .toLowerCase()                  // 1. Força tudo para minúsculo
        .replace(/[^a-z0-9-.\s]/g, '')  // 2. Remove especiais, MAS PERMITE ponto, espaço e hífen
        .replace(/\s+/g, ' ')           // 3. Transforma múltiplos espaços em um só (evita "minha   tag")
        .trim()                         // 4. Remove espaços soltos no começo e no fim
        .substring(0, 25);              // 5. Limita a 25 caracteres
};