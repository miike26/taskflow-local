import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckIcon, XIcon } from './icons';

interface ConfirmationToastProps {
  id: number;
  title: string;
  subtitle?: string;
  type: 'success' | 'error';
  onClose: (id: number) => void;
}

const toastConfig = {
  success: {
    icon: CheckIcon,
    iconBg: 'bg-green-500',
    gradientFrom: 'from-green-500/20',
  },
  error: {
    icon: XIcon,
    iconBg: 'bg-red-500',
    gradientFrom: 'from-red-500/20',
  }
};

const ConfirmationToast: React.FC<ConfirmationToastProps> = ({ id, title, subtitle, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const config = toastConfig[type];
  const IconComponent = config.icon;
  const timerRef = useRef<number | null>(null);

  const handleClose = useCallback(() => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 500); // Wait for exit animation
  }, [id, onClose]);

  useEffect(() => {
    timerRef.current = window.setTimeout(handleClose, 7000);
    return () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };
  }, [handleClose]);

  return (
    <div className={`group w-96 rounded-xl shadow-2xl bg-white dark:bg-[#2E343A] relative overflow-hidden ${isExiting ? 'animate-bottom-toast-out' : 'animate-bottom-toast-in'}`}>
        <div className={`absolute top-0 left-0 h-full w-2/3 bg-gradient-to-r ${config.gradientFrom} to-transparent opacity-40 dark:opacity-50`}></div>
        <div className="relative z-10 p-4 flex items-center gap-4">
            <div className={`flex-shrink-0 p-1.5 rounded-full ${config.iconBg}`}>
                <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
                {subtitle && <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>}
            </div>
        </div>
         <button 
            onClick={handleClose} 
            className="absolute top-2 right-2 z-20 p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:text-gray-500 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Fechar"
        >
            <XIcon className="w-4 h-4" />
        </button>
    </div>
  );
};

export default ConfirmationToast;