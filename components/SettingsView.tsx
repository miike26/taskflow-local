import React, { useState } from 'react';
import type { Category, Tag, NotificationSettings } from '../../types';
// FIX: Import BriefcaseIcon to use as a default icon for new categories.
import { PencilIcon, TrashIcon, PlusIcon, BriefcaseIcon } from '../icons';

interface SettingsViewProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ categories, setCategories, tags, setTags, notificationSettings, setNotificationSettings }) => {
    const [newCategory, setNewCategory] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('red');

    const handleAddCategory = () => {
        if(newCategory.trim()){
            // FIX: Added missing color and icon properties to the new category object to match the 'Category' type.
            setCategories([...categories, {id: `cat-${Date.now()}`, name: newCategory.trim(), color: 'gray', icon: BriefcaseIcon }]);
            setNewCategory('');
        }
    };

    const handleDeleteCategory = (id: string) => {
        setCategories(categories.filter(c => c.id !== id));
    }
    
    const handleAddTag = () => {
        if(newTagName.trim()){
            // FIX: Added missing `baseColor` property to the new tag object to match the 'Tag' type.
            setTags([...tags, {
                id: `tag-${Date.now()}`, 
                name: newTagName.trim(),
                color: `text-${newTagColor}-700`,
                bgColor: `bg-${newTagColor}-100 dark:bg-${newTagColor}-900/50 dark:text-${newTagColor}-300`,
                baseColor: newTagColor as 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink'
            }]);
            setNewTagName('');
            setNewTagColor('red');
        }
    }
    
    const handleDeleteTag = (id: string) => {
        setTags(tags.filter(t => t.id !== id));
    }

  return (
    <div className="p-6 m-4 space-y-8 max-w-4xl mx-auto bg-white dark:bg-[#161B22] rounded-2xl shadow-lg">
       <div className="bg-white dark:bg-[#212D] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Gerenciar Notificações</h3>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="enable-notifications" className="font-medium text-gray-700 dark:text-gray-300">
                Ativar notificações de prazo
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input 
                      type="checkbox" 
                      id="enable-notifications" 
                      checked={notificationSettings.enabled}
                      onChange={e => setNotificationSettings(s => ({...s, enabled: e.target.checked}))}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer dark:bg-gray-800 dark:border-gray-600"
                  />
                  <label htmlFor="enable-notifications" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer dark:bg-gray-700"></label>
              </div>
            </div>
            {notificationSettings.enabled && (
               <div className="flex items-center justify-between">
                <label htmlFor="remind-days" className="font-medium text-gray-700 dark:text-gray-300">
                  Lembrar com antecedência de
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="remind-days"
                    min="1"
                    max="30"
                    value={notificationSettings.remindDaysBefore}
                    onChange={e => setNotificationSettings(s => ({...s, remindDaysBefore: parseInt(e.target.value, 10)}))}
                    className="w-20 rounded-lg p-2.5 border-gray-300 dark:border-gray-700 shadow-sm bg-ice-blue dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 transition-colors duration-200 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">dias</span>
                </div>
              </div>
            )}
        </div>
      </div>


      <div className="bg-white dark:bg-[#212D] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Gerenciar Categorias</h3>
        <ul className="space-y-2 mb-4">
          {categories.map(cat => (
            <li key={cat.id} className="flex justify-between items-center p-3 bg-ice-blue dark:bg-[#0D1117] rounded-lg">
              <span className="text-gray-800 dark:text-gray-200">{cat.name}</span>
              <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500">
                <TrashIcon className="w-5 h-5"/>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
            <input 
                type="text" 
                value={newCategory} 
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova categoria"
                className="flex-grow block w-full rounded-lg p-2.5 border-gray-300 dark:border-gray-700 shadow-sm bg-ice-blue dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 transition-colors duration-200 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            <button onClick={handleAddCategory} className="bg-primary-500 text-white p-2.5 rounded-lg hover:bg-primary-600 transition-all duration-200 hover:ring-2 hover:ring-primary-400"><PlusIcon className="w-6 h-6" /></button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#212D] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Gerenciar Prioridades (Tags)</h3>
        <ul className="space-y-2 mb-4">
          {tags.map(tag => (
            <li key={tag.id} className="flex justify-between items-center p-3 bg-ice-blue dark:bg-[#0D1117] rounded-lg">
              <span className={`${tag.bgColor} ${tag.color} px-2 py-1 text-sm font-semibold rounded-full`}>
                {tag.name}
              </span>
              <button onClick={() => handleDeleteTag(tag.id)} className="text-gray-400 hover:text-red-500">
                <TrashIcon className="w-5 h-5"/>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
            <input 
                type="text" 
                value={newTagName} 
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nova prioridade"
                className="flex-grow min-w-[150px] block w-full rounded-lg p-2.5 border-gray-300 dark:border-gray-700 shadow-sm bg-ice-blue dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 transition-colors duration-200 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            <select value={newTagColor} onChange={e => setNewTagColor(e.target.value)} className="rounded-lg p-2.5 border-gray-300 dark:border-gray-700 shadow-sm bg-ice-blue dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 transition-colors duration-200 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
                <option value="red">Vermelho</option>
                <option value="yellow">Amarelo</option>
                <option value="green">Verde</option>
                <option value="blue">Azul</option>
                <option value="indigo">Índigo</option>
                <option value="purple">Roxo</option>
                <option value="pink">Rosa</option>
            </select>
            <button onClick={handleAddTag} className="bg-primary-500 text-white p-2.5 rounded-lg hover:bg-primary-600 transition-all duration-200 hover:ring-2 hover:ring-primary-400"><PlusIcon className="w-6 h-6" /></button>
        </div>
      </div>
      <style>{`
        .toggle-checkbox:checked {
          right: 0;
          border-color: #06b6d4; /* primary-500 */
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #06b6d4; /* primary-500 */
        }
      `}</style>
    </div>
  );
};

export default SettingsView;