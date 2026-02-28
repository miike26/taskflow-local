import React, { useState, useEffect, useRef } from 'react';
import type { TourCampaign } from '../constants/tours';
import { XIcon, ChevronRightIcon, ChevronLeftIcon } from './icons';

interface FeatureTourModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaign: TourCampaign | null;
}

const FeatureTourModal: React.FC<FeatureTourModalProps> = ({ isOpen, onClose, campaign }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const steps = campaign?.steps || [];
    
    // 👇 O Paraquedas: Se o índice estiver bagunçado, garante que não vai quebrar
    const currentStep = steps[currentIndex] || steps[0]; 
    
    // Refs para controlar play/pause
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

    // Reset index quando o modal abre ou a campanha muda
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
        }
    }, [isOpen, campaign?.id]);

    // 👇 O Controle de Autoplay Blindado
    useEffect(() => {
        if (!isOpen) return;

        // Dá um tempinho (150ms) pro navegador carregar a tag antes de forçar o play
        const timer = setTimeout(() => {
            videoRefs.current.forEach((video, index) => {
                if (!video) return;

                if (index === currentIndex) {
                    // Convence o navegador de que é seguro dar play automático (Mudo garantido)
                    video.muted = true;
                    video.defaultMuted = true;
                    
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(err => console.log("Navegador pausou o autoplay:", err));
                    }
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            });
        }, 150);

        return () => clearTimeout(timer);
    }, [currentIndex, isOpen]);

    // 👇 Trava de segurança final para não renderizar o vazio
    if (!isOpen || !currentStep) return null;

    const handleNext = () => {
        if (currentIndex < steps.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div
                className="relative bg-white dark:bg-[#161B22] w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-gray-200 dark:border-gray-800"
                style={{ maxHeight: '90vh' }}
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
                    {/* Media Area */}
                    <div className="w-full aspect-video bg-black/5 dark:bg-black/20 relative flex-shrink-0 border-b border-gray-100 dark:border-gray-800 overflow-hidden">
                        {steps.map((step, index) => {
                            const isActive = index === currentIndex;
                            const visibilityClass = isActive 
                                ? 'opacity-100 z-10 pointer-events-auto' 
                                : 'opacity-0 z-0 pointer-events-none';

                            return (
                                <div 
                                    key={index} 
                                    className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out ${visibilityClass}`}
                                >
                                    {step.mediaType === 'video' ? (
                                        <video
                                            ref={el => {
                                                videoRefs.current[index] = el;
                                                // Garantia extra de mudo na criação do elemento
                                                if (el) {
                                                    el.muted = true;
                                                    el.defaultMuted = true;
                                                }
                                            }}
                                            src={step.mediaUrl} 
                                            className="w-full h-full object-cover"
                                            loop
                                            muted
                                            playsInline
                                            preload="auto"
                                        />
                                    ) : step.mediaType === 'youtube' ? (
                                        <iframe
                                            src={isActive ? `${step.mediaUrl}?autoplay=1&mute=1&loop=1&playlist=${step.mediaUrl.split('/').pop()}` : ''}
                                            className="w-full h-full object-cover"
                                            title={step.title}
                                            style={{ border: 0 }}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <img
                                            src={step.mediaUrl}
                                            alt={step.title}
                                            className="w-full h-full object-cover"
                                            loading="eager"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar relative">
                        <div key={currentIndex} className="animate-fade-in">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                {currentStep.title}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg leading-relaxed">
                                {currentStep.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer / Navigation */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-[#0D1117]/50 flex-shrink-0">
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
                    className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 dark:bg-black/30 dark:hover:bg-black/50 text-white/80 rounded-full backdrop-blur-sm transition-all z-20"
                    title="Fechar"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            {/* 👇 O "Truque" do Preload Nativo super leve e rápido */}
            <div className="hidden">
                {steps.map((step, idx) => (
                    step.mediaType === 'video' && (
                        <video key={`preload-${idx}`} src={step.mediaUrl} preload="auto" />
                    )
                ))}
            </div>
        </div>
    );
};

export default FeatureTourModal;