
import React, { useState } from 'react';
import { UserCircleIcon, ArrowRightOnRectangleIcon, GlobeAltIcon, PencilIcon, CheckIcon } from '../icons';
import type { NotificationSettings, AppSettings } from '../../types';

interface ProfileViewProps {
  onLogout: () => void;
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  userName: string;
  setUserName: (name: string) => void;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onLogout, userName, setUserName }) => {
  const [editingName, setEditingName] = useState(userName);
  const [editingEmail, setEditingEmail] = useState('usuario@exemplo.com'); // Mock state for email
  const [isEmailEditable, setIsEmailEditable] = useState(false);

  const handleNameSave = () => {
      if (editingName.trim()) {
          setUserName(editingName.trim());
      }
  };

  const handleEmailSave = () => {
      // Logic to validate and save email would go here
      setIsEmailEditable(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-[#161B22] p-8 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 -mr-12 -mt-12 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-400 to-purple-500 p-1">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#161B22] flex items-center justify-center">
                    <UserCircleIcon className="w-20 h-20 text-gray-400 dark:text-gray-500" />
                </div>
            </div>
        </div>
        <div className="text-center md:text-left flex-grow relative z-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{userName}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Administrador</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full uppercase tracking-wider">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Conta Ativa
            </div>
        </div>
        <div className="relative z-10">
             <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 hover:shadow-md"
            >
                <ArrowRightOnRectangleIcon className="w-5 h-5"/>
                Sair da Conta
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
          
          {/* Column 1: Account & Integrations */}
          <div className="space-y-8">
              
              {/* Integrations */}
              <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <GlobeAltIcon className="w-5 h-5 text-primary-500" />
                      Integrações
                  </h3>
                  <div className="p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-lg font-bold text-gray-700 dark:text-gray-300">
                              G
                          </div>
                          <div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">Conta Google</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Sincronize calendário e tarefas</p>
                          </div>
                      </div>
                      <button 
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors opacity-60 cursor-not-allowed"
                        disabled
                        title="Funcionalidade em desenvolvimento"
                      >
                          Conectar
                      </button>
                  </div>
              </div>

              {/* Personal Data */}
              <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <UserCircleIcon className="w-5 h-5 text-primary-500" />
                    Dados Pessoais
                </h3>
                
                <div className="space-y-5">
                    {/* Name Field */}
                    <div className="group">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nome de Exibição</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={editingName}
                                onChange={e => setEditingName(e.target.value)}
                                className="flex-grow bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                            />
                            <button
                                onClick={handleNameSave}
                                disabled={editingName.trim() === userName || !editingName.trim()}
                                className="p-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <CheckIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="group">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">E-mail</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={editingEmail}
                                disabled={!isEmailEditable}
                                onChange={e => setEditingEmail(e.target.value)}
                                className={`flex-grow bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all ${!isEmailEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                            />
                            {isEmailEditable ? (
                                <button
                                    onClick={handleEmailSave}
                                    className="p-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    <CheckIcon className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsEmailEditable(true)}
                                    className="p-2.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ProfileView;
