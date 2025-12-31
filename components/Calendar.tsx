import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  displayDate: Date;
  onDisplayDateChange: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelectDate, displayDate, onDisplayDateChange }) => {
  const currentDate = displayDate;
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

  const handlePrevMonth = () => {
    onDisplayDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    onDisplayDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white dark:bg-[#21262D] p-4 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-80">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} type="button" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
          <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 capitalize">
          {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={handleNextMonth} type="button" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
          <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
        {weekDays.map(wd => <div key={wd}>{wd}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2">
        {days.map((d, i) => {
          const isCurrentMonth = d.getMonth() === currentDate.getMonth();
          const isToday = d.toDateString() === new Date().toDateString();
          const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();

          const dayClasses = `
            w-10 h-10 flex items-center justify-center rounded-full text-sm cursor-pointer transition-colors
            ${isCurrentMonth ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'}
            ${!isSelected && 'hover:bg-gray-100 dark:hover:bg-white/10'}
            ${isToday && !isSelected && 'font-bold border border-gray-400 dark:border-gray-500'}
            ${isSelected && 'bg-primary-600 text-white font-bold'}
          `;

          return (
            <div
              key={i}
              onClick={() => onSelectDate(d)}
              className={dayClasses}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;