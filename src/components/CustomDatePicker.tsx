import React, { useState, useRef, useEffect } from 'react';
import CalendarPicker from './CalendarPicker';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  min?: string; // YYYY-MM-DD
  disabled?: boolean;
  className?: string;
  registeredDates?: Set<string>;
}

const CalendarIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002 2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, min, disabled, className, registeredDates }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return 'Chọn ngày';
    const date = new Date(dateString + 'T00:00:00');
    const weekdays = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayOfWeek = weekdays[date.getDay()];
    const formattedDate = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    return `${dayOfWeek}, ${formattedDate}`;
  }

  const displayValue = formatDisplayDate(value);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsOpen(false);
        }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleDateSelect = (dates: string[]) => {
    if (dates[0]) {
      onChange(dates[0]);
    }
    setIsOpen(false);
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative w-full max-w-xs ${className}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="w-full h-[42px] px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 text-sm text-left disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed flex justify-between items-center"
      >
        <span>{displayValue}</span>
        <CalendarIcon />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 z-30 right-0 dropdown-content origin-top-right">
          <CalendarPicker
            selectedDates={value ? [value] : []}
            onDatesChange={handleDateSelect}
            selectionMode="single"
            minDate={min}
            registeredDates={registeredDates}
          />
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;