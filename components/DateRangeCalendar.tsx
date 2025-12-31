import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface DateRangeCalendarProps {
  range: { startDate: Date | null; endDate: Date | null };
  onApply: (range: { startDate: Date | null; endDate: Date | null }) => void;
  onClear: () => void;
}

const DateRangeCalendar: React.FC<DateRangeCalendarProps> = ({ range, onApply, onClear }) => {
  const [currentDisplayDate, setCurrentDisplayDate] = useState(range.startDate || new Date());
  const [selectedRange, setSelectedRange] = useState(range);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  useEffect(() => {
    setSelectedRange(range);
  }, [range]);

  const handleDateClick = (date: Date) => {
    if (!selectedRange.startDate || selectedRange.endDate) {
      // Start a new selection or reset the range
      setSelectedRange({ startDate: date, endDate: null });
    } else {
      // Complete the range
      if (date < selectedRange.startDate) {
        setSelectedRange({ startDate: date, endDate: selectedRange.startDate });
      } else {
        setSelectedRange({ ...selectedRange, endDate: date });
      }
    }
  };
  
  const startOfMonth = new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth(), 1);
  const endOfMonth = new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth() + 1, 0);

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
  
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const getDayClasses = (d: Date) => {
    const isCurrentMonth = d.getMonth() === currentDisplayDate.getMonth();
    const isToday = d.toDateString() === new Date().toDateString();

    const { startDate, endDate } = selectedRange;
    const isStart = startDate && d.toDateString() === startDate.toDateString();
    const isEnd = endDate && d.toDateString() === endDate.toDateString();
    
    const isWithinRange = startDate && endDate && d > startDate && d < endDate;
    
    let isWithinHoverRange = false;
    if (startDate && !endDate && hoveredDate) {
      if (hoveredDate > startDate) {
        isWithinHoverRange = d > startDate && d < hoveredDate;
      } else {
        isWithinHoverRange = d < startDate && d > hoveredDate;
      }
    }

    let classes = 'w-10 h-10 flex items-center justify-center text-sm cursor-pointer transition-colors duration-150 relative ';
    
    if (isCurrentMonth) {
        classes += 'text-gray-800 dark:text-gray-200 ';
    } else {
        classes += 'text-gray-400 dark:text-gray-600 ';
    }

    if (isWithinRange || isWithinHoverRange) {
        classes += 'bg-primary-100 dark:bg-primary-900/50 ';
    }

    if (isStart) {
        classes += 'bg-primary-500 text-white font-bold rounded-l-full ';
    }
    
    if (isEnd) {
        classes += 'bg-primary-500 text-white font-bold rounded-r-full ';
    }

    if (!isStart && !isEnd) {
        classes += 'rounded-full hover:bg-gray-200 dark:hover:bg-white/10 ';
    }

    if (isToday && !isStart && !isEnd) {
        classes += 'border border-gray-400 dark:border-gray-500 ';
    }

    return classes;
  };

  return (
    <div className="bg-white dark:bg-[#21262D] rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-80">
      <div className="flex justify-between items-center mb-4 p-4 pb-0">
        <button onClick={() => setCurrentDisplayDate(new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth() - 1, 1))} type="button" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
          <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 capitalize">
          {currentDisplayDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => setCurrentDisplayDate(new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth() + 1, 1))} type="button" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
          <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 font-medium px-4">
        {weekDays.map(wd => <div key={wd}>{wd}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0 mt-2 px-4">
        {days.map((d, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredDate(d)}
              onMouseLeave={() => setHoveredDate(null)}
              onClick={() => handleDateClick(d)}
              className={getDayClasses(d)}
            >
              <span>{d.getDate()}</span>
            </div>
        ))}
      </div>
      <div className="flex justify-end space-x-2 p-4 border-t border-gray-200 dark:border-gray-700 mt-2">
        <button onClick={onClear} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Limpar</button>
        <button onClick={() => onApply(selectedRange)} disabled={!selectedRange.startDate || !selectedRange.endDate} className="px-4 py-2 text-sm font-semibold rounded-md bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed">Aplicar</button>
      </div>
    </div>
  );
};

export default DateRangeCalendar;
