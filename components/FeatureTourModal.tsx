
import React, { useState, useEffect } from 'react';
import type { TourStep } from '../constants/tours';
import { XIcon, ChevronRightIcon, ChevronLeftIcon } from './icons';

interface FeatureTourModalProps {
    isOpen: boolean;
    onClose: () => void;
    steps: TourStep[]; // <--- NOVO: Recebe os passos de fora
    onComplete?: () => void; // <--- NOVO: Saber quando terminou
}

const FeatureTourModal: React.FC<FeatureTourModalProps> = ({ isOpen, onClose, steps, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentStep = steps[currentIndex];

    // Reset index when opened
    useEffect(() => {
        if (isOpen) setCurrentIndex(0);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentIndex < steps.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Se tiver uma função de completar (salvar no firebase), chama ela
            if (onComplete) onComplete();
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const renderMedia = () => {
        const { mediaType, mediaUrl, title } = currentStep;

        const commonClasses = "absolute inset-0 w-full h-full object-cover";

        switch (mediaType) {
            case 'youtube':
                return (
                    <iframe
                        src={`${mediaUrl}?autoplay=1&mute=1&loop=1&playlist=${mediaUrl.split('/').pop()}`} // Truque para loop e autoplay
                        className="w-full h-full absolute inset-0" // Absolute garante que preencha o container aspect-video
                        title={title}
                        frameBorder="0" // Depreciado, mas útil para legacy
                        style={{ border: 0 }} // CSS moderno
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                );
            case 'video':
                return (
                    <video
                        src={mediaUrl}
                        className={commonClasses}
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                );
            case 'gif':
            case 'image':
            default:
                return (
                    <img
                        src={mediaUrl}
                        alt={title}
                        className={commonClasses}
                    />
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div
                className="relative bg-white dark:bg-[#161B22] w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-gray-200 dark:border-gray-800"
                style={{ maxHeight: '90vh' }} // Limite de altura seguro
                onClick={e => e.stopPropagation()}
            >
                {/* Header (Progress Bar) */}
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    <div
                        className="h-full bg-primary-500 transition-all duration-500 ease-out"
                        style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
                    ></div>
                </div>

                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Media Area - Responsiva (16:9 ratio approx or fixed height) */}
                    <div className="w-full aspect-video bg-black/5 dark:bg-black/20 relative flex-shrink-0 border-b border-gray-100 dark:border-gray-800">
                        {renderMedia()}
                    </div>

                    {/* Content Area - Scrollável se o texto for longo */}
                    <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                            {currentStep.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg leading-relaxed">
                            {currentStep.description}
                        </p>
                    </div>
                </div>

                {/* Footer / Navigation */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-[#0D1117]/50 flex-shrink-0">

                    {/* Pagination Dots */}
                    <div className="flex gap-2">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-primary-500 w-4' : 'bg-gray-300 dark:bg-gray-600'}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {currentIndex > 0 ? (
                            <button
                                onClick={handlePrev}
                                className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl font-medium transition-colors"
                            >
                                Anterior
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="px-4 py-2.5 text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors text-sm"
                            >
                                Pular Tour
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                        >
                            {currentIndex === steps.length - 1 ? 'Começar' : 'Próximo'}
                            {currentIndex < steps.length - 1 && <ChevronRightIcon className="w-4 h-4 stroke-2" />}
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 dark:bg-black/30 dark:hover:bg-black/50 text-white/80 rounded-full backdrop-blur-sm transition-all"
                    title="Fechar"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default FeatureTourModal;
