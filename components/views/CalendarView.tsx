
import React, { useState, useMemo } from 'react';
import type { Task, Category, Tag, Status, AppSettings } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import TaskCard from '../TaskCard';
import { STATUS_COLORS } from '../../constants';

interface CalendarViewProps {
  tasks: Task[];
  categories: Category[];
  tags: Tag[];
  onSelectTask: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  appSettings?: AppSettings;
}

const taskSortFunction = (a: Task, b: Task) => {
    const now = new Date();
    const aIsOverdue = a.dueDate && new Date(a.dueDate) < now && a.status !== 'Concluída';
    const bIsOverdue = b.dueDate && new Date(b.dueDate) < now && b.status !== 'Concluída';

    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;

    const aDueDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDueDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;

    return aDueDate - bDueDate;
};


const CalendarView: React.FC<CalendarViewProps> = ({ tasks, categories, tags, onSelectTask, appSettings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const getCategory = (id: string) => categories.find(c => c.id === id);
  const getTag = (id: string) => tags.find(t => t.id === id);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }
  
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const tasksByDate = tasks.reduce((acc, task) => {
    const date = new Date(task.dateTime).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const selectedDayTasksByStatus = useMemo(() => {
    if (!selectedDate) return null;

    const dayTasks = tasksByDate[selectedDate.toDateString()] || [];
    
    const grouped: Record<Status, Task[]> = {
        'Pendente': [],
        'Em andamento': [],
        'Concluída': [],
    };

    dayTasks.forEach(task => {
        if (grouped[task.status]) {
            grouped[task.status].push(task);
        }
    });

    grouped['Pendente'].sort(taskSortFunction);
    grouped['Em andamento'].sort(taskSortFunction);
    grouped['Concluída'].sort(taskSortFunction);

    return grouped;

  }, [selectedDate, tasksByDate]);
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const renderTaskList = (taskList: Task[], status: Status) => {
      if (taskList.length === 0) return null;
      return (
          <div key={status}>
              <h4 className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200 text-base mb-3 mt-8">
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`}></span>
                <span>{status}</span>
              </h4>
              <div className="space-y-2">
                {taskList.map(task => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Concluída';
                  return (
                    <TaskCard 
                      key={task.id}
                      task={task}
                      category={getCategory(task.categoryId)}
                      tag={getTag(task.tagId)}
                      onSelect={onSelectTask}
                      isOverdue={isOverdue}
                      variant="compact"
                      disableOverdueColor={appSettings?.disableOverdueColor}
                    />
                  )
                })}
              </div>
          </div>
      )
  }

  return (
    <div className="p-4 flex flex-col lg:flex-row gap-4 h-[calc(100vh-100px)]">
      <div className="flex-grow bg-white dark:bg-[#161B22] p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
            <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
            <ChevronRightIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <div className="grid grid-cols-7">
          {weekDays.map(wd => (
            <div key={wd} className="text-center font-medium text-sm py-2 text-gray-500 dark:text-gray-400">{wd}</div>
          ))}
          {days.map((d, i) => {
            const isCurrentMonth = d.getMonth() === currentDate.getMonth();
            const isToday = d.toDateString() === new Date().toDateString();
            const isSelected = d.toDateString() === selectedDate?.toDateString();
            const dayTasks = tasksByDate[d.toDateString()] || [];

            return (
              <div
                key={i}
                onClick={() => setSelectedDate(d)}
                className={`p-2 h-28 flex flex-col cursor-pointer transition-colors border-t border-l border-gray-200 dark:border-gray-800
                  ${isCurrentMonth ? 'bg-white dark:bg-[#161B22]' : 'bg-gray-50 dark:bg-[#0D1117] text-gray-400 dark:text-gray-600'}
                  ${isSelected ? 'bg-primary-50 dark:bg-primary-900/50' : 'hover:bg-gray-100 dark:hover:bg-white/5'}
                `}
              >
                <span className={`self-end font-semibold text-sm ${isToday ? 'bg-primary-600 text-white rounded-full h-7 w-7 flex items-center justify-center' : ''}`}>
                  {d.getDate()}
                </span>
                <div className="flex-grow overflow-y-auto text-xs mt-1 space-y-1">
                  {dayTasks.slice(0, 3).map(task => {
                    const tag = getTag(task.tagId);
                    const tagColor = tag ? tag.bgColor.split(' ')[0].replace('bg-', '').split('-')[0] : 'gray';
                    const colorClass = `bg-${tagColor}-500`;
                    return <div key={task.id} title={task.title} className={`h-1.5 w-full rounded-full ${colorClass}`}></div>;
                  })}
                  {dayTasks.length > 3 && <div className="text-gray-500 dark:text-gray-400 text-center text-[10px] font-semibold">+{dayTasks.length - 3} mais</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-full lg:w-[400px] bg-white dark:bg-[#161B22] p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Tarefas para {selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        <div>
          {selectedDayTasksByStatus && (
              Object.keys(selectedDayTasksByStatus).length > 0 && 
              (selectedDayTasksByStatus['Pendente'].length > 0 || selectedDayTasksByStatus['Em andamento'].length > 0 || selectedDayTasksByStatus['Concluída'].length > 0)
          ) ? (
            <>
              {renderTaskList(selectedDayTasksByStatus['Pendente'], 'Pendente')}
              {renderTaskList(selectedDayTasksByStatus['Em andamento'], 'Em andamento')}
              {renderTaskList(selectedDayTasksByStatus['Concluída'], 'Concluída')}
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center pt-10">Nenhuma tarefa para este dia.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
