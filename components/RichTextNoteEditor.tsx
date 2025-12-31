
import React, { useRef, useState, useEffect } from 'react';
import { BoldIcon, ItalicIcon, LinkIcon, ListBulletIcon, SparklesIcon } from './icons';
import { GoogleGenAI } from "@google/genai";

const LinkModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (url: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    const [url, setUrl] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setUrl('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (url.trim()) {
            onConfirm(url.trim());
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]" onClick={handleBackdropClick}>
            <div className="bg-white dark:bg-[#212D] rounded-xl p-6 shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Adicionar Hyperlink</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Insira a URL para o texto selecionado.</p>
                <div className="mt-4">
                    <label htmlFor="link-url" className="sr-only">URL</label>
                    <input
                        ref={inputRef}
                        id="link-url"
                        type="text"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                        placeholder="https://exemplo.com"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm bg-ice-blue dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 p-2.5 transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/50 focus:border-primary-500"
                    />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-500 font-medium">Cancelar</button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const RichTextNoteEditor: React.FC<{ 
    value: string; 
    onChange: (value: string) => void; 
    placeholder: string; 
    onAdd: () => void; 
    onCancel: () => void;
    isLoading?: boolean;
    isAiHighlighted?: boolean;
}> = ({ value, onChange, placeholder, onAdd, onCancel, isLoading, isAiHighlighted }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isFormatting, setIsFormatting] = useState(false);
    const savedSelectionRef = useRef<Range | null>(null);

    // Sync external value to innerHTML
    useEffect(() => {
        if (editorRef.current && !isLoading && !isFormatting) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value, isLoading, isFormatting]);

    useEffect(() => {
        if (!isLoading && !isFormatting) {
            editorRef.current?.focus();
        }
    }, [isLoading, isFormatting]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };

    const execFormat = (command: string, valueArg?: string) => {
        document.execCommand(command, false, valueArg);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    const handleLinkModalOpen = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
            alert("Por favor, selecione o texto que deseja transformar em link.");
            return;
        }
        savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
        setIsLinkModalOpen(true);
    };

    const handleConfirmLink = (url: string) => {
        setIsLinkModalOpen(false);
        editorRef.current?.focus();
        
        setTimeout(() => {
            const selection = window.getSelection();
            if (selection && savedSelectionRef.current) {
                selection.removeAllRanges();
                selection.addRange(savedSelectionRef.current);
                execFormat('createLink', url);
            }
            savedSelectionRef.current = null;
        }, 10);
    };

    const handleSmartFormat = async () => {
        if (!editorRef.current) return;
        const rawContent = editorRef.current.innerHTML;
        if (!rawContent.replace(/<[^>]*>/g, '').trim()) return;

        setIsFormatting(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
            Você é um assistente de formatação de texto inteligente.
            
            OBJETIVO:
            Normalize, limpe e organize o conteúdo HTML/Texto fornecido abaixo.
            
            REGRAS OBRIGATÓRIAS:
            1. NÃO RESUMA. NÃO APAGUE INFORMAÇÕES. NÃO MUDE O SIGNIFICADO. Mantenha 100% do conteúdo informativo original.
            2. Remova formatações externas sujas (cores de fundo, fontes específicas, tamanhos de fonte inline).
            3. Organize parágrafos longos ou "paredões de texto" quebrando-os em parágrafos menores e lógicos.
            4. Se houver listas no texto (itens separados por hífen, bolinhas ou linhas curtas), transforme-as em HTML <ul> e <li>.
            5. Destaque palavras-chave, nomes de pessoas, datas, prazos e conclusões usando a tag <strong> (negrito).
            6. Corrija espaçamentos excessivos.
            
            Entrada:
            ${rawContent}

            Saída:
            Apenas o HTML limpo e formatado (tags permitidas: <p>, <ul>, <li>, <strong>, <em>, <br>). Sem markdown.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const formattedText = response.text;
            
            if (formattedText) {
                onChange(formattedText);
                // We don't set innerHTML here because React state update will trigger useEffect to update it when formatting state is cleared
            }
        } catch (error) {
            console.error("Smart format failed:", error);
        } finally {
            setIsFormatting(false);
        }
    };
    
    const toolbarButtonClass = "p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors";

    const handleMouseDown = (e: React.MouseEvent, action: () => void) => {
        e.preventDefault();
        if (!isLoading && !isFormatting) {
            action();
        }
    };

    const isBusy = isLoading || isFormatting;
    const aiGlowClass = isAiHighlighted ? "ring-2 ring-purple-400 ring-offset-2 dark:ring-offset-[#161B22] shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-500" : "";
    const loadingClass = isBusy ? "animate-pulse border-indigo-400 dark:border-indigo-500" : "border-gray-300 dark:border-gray-700";

    return (
        <>
            <LinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onConfirm={handleConfirmLink}
            />
            <div className={`relative bg-white dark:bg-[#0D1117] rounded-lg border shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-500/20 dark:focus-within:ring-primary-500/50 focus-within:border-primary-500 ${loadingClass} ${aiGlowClass} flex flex-col`}>
                <div className="p-1 border-b border-gray-200 dark:border-gray-600 flex items-center gap-1 flex-shrink-0">
                    <button onMouseDown={(e) => handleMouseDown(e, () => execFormat('bold'))} className={toolbarButtonClass} title="Negrito" disabled={isBusy}><BoldIcon className="w-5 h-5" /></button>
                    <button onMouseDown={(e) => handleMouseDown(e, () => execFormat('italic'))} className={toolbarButtonClass} title="Itálico" disabled={isBusy}><ItalicIcon className="w-5 h-5" /></button>
                    <button onMouseDown={(e) => handleMouseDown(e, handleLinkModalOpen)} className={toolbarButtonClass} title="Link" disabled={isBusy}><LinkIcon className="w-5 h-5" /></button>
                    <button onMouseDown={(e) => handleMouseDown(e, () => execFormat('insertUnorderedList'))} className={toolbarButtonClass} title="Lista" disabled={isBusy}><ListBulletIcon className="w-5 h-5" /></button>
                    
                    {/* Smart Format Button */}
                    <button 
                        onMouseDown={(e) => handleMouseDown(e, handleSmartFormat)} 
                        className={`ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold transition-all duration-200 
                            ${isFormatting 
                                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 cursor-wait' 
                                : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                            }`}
                        title="Formatação Inteligente (Organizar texto com IA)"
                        disabled={isBusy}
                    >
                        <SparklesIcon className={`w-4 h-4 ${isFormatting ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Formatar</span>
                    </button>
                </div>
                
                <div className="relative min-h-[120px] max-h-[300px] overflow-hidden">
                    {/* Loading Overlay - Rendered when busy, covers the editor */}
                    {isBusy && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-[#0D1117] text-indigo-500 dark:text-indigo-400 cursor-wait">
                            <SparklesIcon className="w-6 h-6 animate-spin mb-3" />
                            <span className="text-sm font-medium animate-pulse">
                                {isFormatting ? 'Normalizando texto...' : 'A IA está gerando o resumo...'}
                            </span>
                        </div>
                    )}
                    
                    {/* Editor - Maintained in DOM but invisible when busy to preserve height */}
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleInput}
                        data-placeholder={placeholder}
                        className={`prose prose-sm dark:prose-invert max-w-none block w-full p-2.5 h-full min-h-[120px] max-h-[300px] overflow-y-auto focus:outline-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] ${isBusy ? 'invisible' : ''}`}
                    />
                </div>

                <div className={`flex justify-end items-center p-2 rounded-b-lg border-t border-gray-100 dark:border-gray-800 flex-shrink-0 ${isBusy ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <button onClick={onCancel} disabled={isBusy} className="px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">Cancelar</button>
                    <button onClick={onAdd} disabled={!value.replace(/<[^>]*>/g, '').trim() || isBusy} className="ml-2 px-3 py-1.5 bg-primary-500 text-white font-semibold rounded-lg disabled:opacity-50 text-sm">Adicionar</button>
                </div>
            </div>
        </>
    );
};

export default RichTextNoteEditor;
