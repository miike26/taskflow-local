import React from 'react';
import { XIcon, SparklesIcon, BugAntIcon, RocketLaunchIcon } from './icons';
import { CHANGELOG_DATA } from '../constants/changelog';

interface ChangelogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangeTypeBadge: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
        case 'feature':
            return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-center gap-1 w-fit"><SparklesIcon className="w-3 h-3"/> Novidade</span>;
        case 'improvement':
            return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1 w-fit"><RocketLaunchIcon className="w-3 h-3"/> Melhoria</span>;
        case 'fix':
            return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800 flex items-center gap-1 w-fit"><BugAntIcon className="w-3 h-3"/> Correção</span>;
        default:
            return null;
    }
};

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-white dark:bg-[#161B22] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-in border border-gray-200 dark:border-gray-800"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#0D1117]/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                            <RocketLaunchIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novidades & Atualizações</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Fique por dentro do que mudou na ferramenta.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Timeline */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="space-y-8 relative">
                        {/* Linha Vertical Conectora */}
                        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-800 -z-10"></div>

                        {CHANGELOG_DATA.map((release, index) => (
                            <div key={index} className="flex gap-6 relative">
                                {/* Bolinha da Timeline */}
                                <div className="flex-shrink-0 mt-1.5">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white dark:border-[#161B22] ${index === 0 ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                        <span className="text-[10px] font-bold">v{release.version}</span>
                                    </div>
                                </div>

                                {/* Conteúdo */}
                                <div className="flex-1 pb-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{release.title}</h3>
                                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 w-fit">
                                            {new Date(release.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    
                                    {release.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                                            {release.description}
                                        </p>
                                    )}

                                    <ul className="space-y-2.5">
                                        {release.changes.map((change, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm bg-gray-50 dark:bg-[#0D1117] p-3 rounded-lg border border-gray-100 dark:border-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    <ChangeTypeBadge type={change.type} />
                                                </div>
                                                <span className="text-gray-700 dark:text-gray-300 leading-snug">{change.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0D1117] text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Versão atual: <span className="font-mono text-primary-500">{CHANGELOG_DATA[0].version}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChangelogModal;