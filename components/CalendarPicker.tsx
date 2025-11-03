import React, { useState } from 'react';

// --- Holiday Data and Logic ---
// List of Vietnamese public holidays in YYYY-MM-DD format for 2024 and 2025.
const holidays2024 = new Set([
    '2024-01-01', '2024-02-08', '2024-02-09', '2024-02-10', '2024-02-11', 
    '2024-02-12', '2024-02-13', '2024-02-14', '2024-04-18', '2024-04-30', 
    '2024-05-01', '2024-09-02', '2024-09-03'
]);
const holidays2025 = new Set([
    '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', 
    '2025-02-01', '2025-04-09', '2025-04-30', '2025-05-01', '2025-09-02'
]);
const allHolidays = new Set([...holidays2024, ...holidays2025]);

const formatDateForHolidayCheck = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isHoliday = (date: Date): boolean => {
    const dateString = formatDateForHolidayCheck(date);
    return allHolidays.has(dateString);
};
// --- End Holiday Data ---


interface CalendarPickerProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  selectionMode?: 'single' | 'multiple';
  minDate?: string; // YYYY-MM-DD
  disabled?: boolean;
  registeredDates?: Set<string>;
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDates, onDatesChange, selectionMode = 'multiple', minDate, disabled = false, registeredDates }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const todayString = formatDate(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    if (date.getDay() === 0 || isHoliday(date) || disabled) return;
    const dateString = formatDate(date);

    if (selectionMode === 'single') {
        onDatesChange([dateString]);
        return;
    }

    const newSelectedDates = selectedDates.includes(dateString)
      ? selectedDates.filter(d => d !== dateString)
      : [...selectedDates, dateString];
    onDatesChange(newSelectedDates.sort());
  };
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const currentStaticYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentStaticYear - 10 + i);
  const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    setCurrentDate(new Date(year, newMonth, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setCurrentDate(new Date(newYear, month, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const minD = minDate ? new Date(minDate + 'T00:00:00') : null;
    if (minD) minD.setHours(0,0,0,0);

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateString = formatDate(date);
      const isSunday = date.getDay() === 0;
      const isHolidayDate = isHoliday(date);
      const isUnselectableDay = isSunday || isHolidayDate;
      const isPast = minD ? date < minD : false;
      const isSelected = selectedDates.includes(dateString);
      const isToday = dateString === todayString;
      const isRegistered = !isSelected && registeredDates?.has(dateString);
      
      let buttonClass = 'w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 text-sm';
      
      if (isPast || disabled || isUnselectableDay) {
        buttonClass += ' cursor-not-allowed';
        if (isUnselectableDay) {
            buttonClass += ' bg-red-50 text-red-400 dark:bg-red-900/50 dark:text-red-500 line-through';
        } else {
            buttonClass += ' text-gray-400 dark:text-gray-600';
        }
      } else if (isSelected) {
        buttonClass += ' bg-teal-600 text-white font-bold';
      } else if (isRegistered) {
        buttonClass += ' bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 font-semibold';
      } else if (isToday) {
        buttonClass += ' text-teal-700 dark:text-teal-300 ring-2 ring-teal-500';
      } else {
        buttonClass += ' text-gray-700 dark:text-gray-200 hover:bg-teal-100 dark:hover:bg-teal-900';
      }

      days.push(
        <div key={i} className="p-1 flex justify-center items-center">
          <button
            type="button"
            onClick={() => handleDateClick(date)}
            disabled={isPast || disabled || isUnselectableDay}
            className={buttonClass}
            aria-label={isSelected ? `Selected, day ${i}` : isRegistered ? `Has registrations, day ${i}` : `Day ${i}`}
          >
            {i}
          </button>
        </div>
      );
    }

    return days;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-80 ${disabled ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <button type="button" disabled={disabled} onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50" aria-label="Previous month">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </button>
        <div className="flex items-center space-x-2">
            <select
                value={month}
                onChange={handleMonthChange}
                disabled={disabled}
                className="w-auto px-2 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm font-medium text-gray-700 dark:text-gray-200"
                aria-label="Chọn tháng"
            >
                {months.map((m, index) => (
                    <option key={index} value={index}>{m}</option>
                ))}
            </select>
            <select
                value={year}
                onChange={handleYearChange}
                disabled={disabled}
                className="w-auto px-2 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm font-medium text-gray-700 dark:text-gray-200"
                aria-label="Chọn năm"
            >
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </div>
        <button type="button" disabled={disabled} onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50" aria-label="Next month">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
        <div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>
    </div>
  );
};

export default CalendarPicker;