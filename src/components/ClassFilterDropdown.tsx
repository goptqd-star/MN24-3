import React, { useState, useRef, useEffect } from 'react';
import { ClassInfo } from '../types';

interface ClassFilterDropdownProps {
    classes: ClassInfo[];
    selectedClasses: string[];
    onSelectionChange: (selected: string[]) => void;
}

const ClassFilterDropdown: React.FC<ClassFilterDropdownProps> = ({ classes, selectedClasses, onSelectionChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
         function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if(!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const handleSelect = (className: string) => {
        const newSelection = selectedClasses.includes(className)
            ? selectedClasses.filter(c => c !== className)
            : [...selectedClasses, className];
        onSelectionChange(newSelection);
    };

    const handleSelectAll = () => {
        if (selectedClasses.length === classes.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(classes.map(c => c.name));
        }
    }

    const filteredClasses = classes.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative w-full max-w-xs" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-[42px] px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left flex justify-between items-center"
            >
                <span className="text-sm truncate">
                    {selectedClasses.length === 0
                        ? 'Không chọn lớp nào'
                        : selectedClasses.length === classes.length
                        ? 'Tất cả các lớp'
                        : `Đã chọn ${selectedClasses.length} lớp`}
                </span>
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg z-30 max-h-72 flex flex-col dropdown-content origin-top">
                    <div className="p-2 border-b dark:border-gray-600">
                        <input
                            type="text"
                            placeholder="Tìm kiếm lớp..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-500 rounded-md focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                    <div className="p-2 border-b dark:border-gray-600">
                        <label className="flex items-center space-x-2 px-2 py-1 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedClasses.length === classes.length}
                                onChange={handleSelectAll}
                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Chọn tất cả</span>
                        </label>
                    </div>
                    <div className="p-2 overflow-y-auto">
                        {filteredClasses.length > 0 ? filteredClasses.map(c => (
                            <label key={c.name} className="flex items-center space-x-2 px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                                <input
                                    type="checkbox"
                                    checked={selectedClasses.includes(c.name)}
                                    onChange={() => handleSelect(c.name)}
                                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-200">{c.name}</span>
                            </label>
                        )) : (
                             <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">Không tìm thấy lớp.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ClassFilterDropdown;