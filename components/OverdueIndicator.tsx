import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom'; // <--- O Segredo Mágico
import { CalendarDaysIcon } from './icons';
import Calendar from './Calendar';

interface OverdueIndicatorProps {
    dueDate: string;
    onUpdateDate: (newDate: string) => void;
    className?: string;
}

const OverdueIndicator: React.FC<OverdueIndicatorProps> = ({ dueDate, onUpdateDate, className = "" }) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [displayDate, setDisplayDate] = useState(new Date());
    
    // Estado para guardar a posição exata onde o popover deve abrir
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
    
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Função para calcular a posição e abrir
    const togglePopover = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!isPopoverOpen && buttonRef.current) {
            // Calcula onde o botão está na tela AGORA
            const rect = buttonRef.current.getBoundingClientRect();
            
            // Define a posição (Logo abaixo do botão)
            // Ajustamos um pouco o 'left' para centralizar ou alinhar melhor se quiser
            setPopoverPos({
                top: rect.bottom + 5, // 5px de margem abaixo do botão
                left: rect.left
            });
        }
        
        setIsPopoverOpen(!isPopoverOpen);
    };

    const handleSelectDate = (date: Date) => {
        const newDate = new Date(date);
        newDate.setHours(23, 59, 59);
        onUpdateDate(newDate.toISOString());
        setIsPopoverOpen(false);
    };

    const handleQuickAction = (daysToAdd: number) => {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + daysToAdd);
        handleSelectDate(newDate);
    };

    // Componente do Popover que será "teletransportado"
    const PopoverContent = () => (
        <>
            {/* 1. Backdrop Invisível: Cobre a tela toda para detectar clique fora e fechar */}
            <div 
                className="fixed inset-0 z-[9998] cursor-default" 
                onClick={(e) => { e.stopPropagation(); setIsPopoverOpen(false); }}
            />

            {/* 2. O Popover em si */}
            <div 
                className="fixed z-[9999] bg-white dark:bg-[#161B22] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-3 min-w-[280px] animate-scale-in"
                style={{ 
                    top: popoverPos.top, 
                    left: popoverPos.left,
                    // Lógica simples para evitar sair da tela na direita (se precisar, refinamos)
                    transform: window.innerWidth - popoverPos.left < 300 ? 'translateX(-80%)' : 'none'
                }}
                onClick={(e) => e.stopPropagation()} // Clique dentro não fecha
            >
                <div className="mb-3 flex gap-2">
                    <button 
                        onClick={() => handleQuickAction(1)}
                        className="flex-1 py-1.5 px-2 bg-gray-100 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                    >
                        Amanhã
                    </button>
                    <button 
                        onClick={() => handleQuickAction(7)}
                        className="flex-1 py-1.5 px-2 bg-gray-100 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                    >
                        Próx. Semana
                    </button>
                </div>
                
                <div className="scale-90 origin-top -mb-4 -mx-2">
                    <Calendar 
                        selectedDate={new Date(dueDate)} 
                        onSelectDate={handleSelectDate}
                        displayDate={displayDate}
                        onDisplayDateChange={setDisplayDate}
                    />
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* O Botão no Card (Fica parado onde está) */}
            <button
                ref={buttonRef}
                onClick={togglePopover}
                className={`group relative w-5 h-5 flex items-center justify-center outline-none ${className}`}
                title="Prorrogar prazo final"
            >
                {/* Bolinha Vermelha */}
                <span className={`absolute w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm transition-all duration-300 ease-in-out transform group-hover:scale-0 group-hover:opacity-0 ${!isPopoverOpen ? 'animate-pulse' : 'scale-0 opacity-0'}`}></span>

                {/* Ícone de Calendário */}
                <CalendarDaysIcon 
                    className={`absolute w-4 h-4 text-red-500 transition-all duration-300 ease-in-out transform scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 ${isPopoverOpen ? '!scale-100 !opacity-100' : ''}`} 
                />
            </button>

            {/* O Portal renderiza o Popover direto no body do HTML */}
            {isPopoverOpen && createPortal(<PopoverContent />, document.body)}
        </>
    );
};

export default OverdueIndicator;