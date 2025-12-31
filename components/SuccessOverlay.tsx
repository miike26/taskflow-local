
import React from 'react';
import { CheckCircleIcon } from './icons';

const SuccessOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none animate-fade-out-delayed">
      {/* Background Blur Overlay - Optional: Add bg-black/20 if you want to dim the background */}
      <div className="animate-success-pop flex flex-col items-center justify-center p-8 md:p-12 bg-white/80 dark:bg-[#161B22]/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/5 transform transition-all">
        
        {/* Animated Check Icon */}
        <div className="relative">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-20 animate-pulse-glow"></div>
            <CheckCircleIcon className="w-32 h-32 md:w-40 md:h-40 text-green-500 drop-shadow-xl relative z-10 stroke-[1.5]" />
        </div>
        
        {/* Text */}
        <div className="mt-6 text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
                Concluído!
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-300 font-medium">
                Ótimo trabalho.
            </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessOverlay;
