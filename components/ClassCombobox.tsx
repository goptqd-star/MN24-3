import React, { useState, useRef, useEffect } from 'react';
import { ClassInfo } from '../types';

interface ClassComboboxProps {
    classes: ClassInfo[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

const ClassCombobox: React.FC<ClassComboboxProps> = ({ classes, value, onChange, disabled, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

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

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);
    
    const handleSelect = (className: string) => {
        onChange(className);
        setIsOpen(false);
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen(!isOpen);
        }
    };

    const filteredClasses = classes.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedClass = classes.find(c => c.name === value);
    const displayValue = selectedClass 
        ? `${selectedClass.name} (Sĩ số: ${selectedClass.studentCount})` 
        : (placeholder || 'Chọn...');


    return (
        <div className="relative w-full max-w-xs" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className={`w-full h-[42px] px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left flex justify-between items-center disabled:bg-gray-100 dark:disabled:bg-gray-600 ${!value ? 'text-gray-400 dark:text-gray-500' : ''}`}
            >
                <span className="text-sm truncate">{displayValue}</span>
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg z-20 max-h-60 flex flex-col dropdown-content origin-top">
                    <div className="p-2 border-b dark:border-gray-600">
                         <input
                            type="text"
                            placeholder="Tìm kiếm lớp..."
                            autoFocus
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-500 rounded-md focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                    <div className="p-1 overflow-y-auto">
                        {filteredClasses.length > 0 ? filteredClasses.map(c => (
                             <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelect(c.name)}
                                className={`w-full text-left px-3 py-2 text-sm rounded ${value === c.name ? 'bg-teal-600 text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                             >
                                {c.name} <span className="text-xs text-gray-500 dark:text-gray-400">(Sĩ số: {c.studentCount})</span>
                             </button>
                        )) : (
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">Không tìm thấy lớp.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassCombobox;