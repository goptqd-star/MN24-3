import React from 'react';
import { MealType } from '../types';
import NumberInput from './NumberInput';

interface SummaryTableRowProps {
    item: {
        className: string;
        date: string;
        meals: { [key in MealType]?: { count: number; registeredBy?: string; } };
    };
    isHighlighted: boolean;
    isSelected: boolean;
    isEditing: boolean;
    isSaving: boolean;
    isReadOnly: boolean;
    editedMeals: { [key in MealType]?: string } | null;
    disabled: boolean;
    onSelectRow: () => void;
    onStartEdit: () => void;
    onDelete: () => void;
    onSave: () => void;
    onCancel: () => void;
    onMealChange: (mealType: MealType, value: string) => void;
}

const MealCell: React.FC<{
    isEditing: boolean;
    mealType: MealType;
    value: { count: number; registeredBy?: string; };
    editedValue: string | undefined;
    onChange: (mealType: MealType, value: string) => void;
    id: string;
}> = ({ isEditing, mealType, value, editedValue, onChange, id }) => (
    <td className="px-6 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
        {isEditing ? (
            <div className="w-20 mx-auto">
                <NumberInput 
                    id={`edit-${mealType}-${id}`}
                    value={editedValue ?? ''}
                    onChange={(val) => onChange(mealType, val)}
                />
            </div>
        ) : (
            <div>
                <span>{value.count}</span>
                {value.registeredBy && <div className="text-xs text-gray-400 dark:text-gray-500">({value.registeredBy})</div>}
            </div>
        )}
    </td>
);

const SavingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const SummaryTableRow: React.FC<SummaryTableRowProps> = ({ 
    item, isHighlighted, isSelected, isEditing, isSaving, isReadOnly, editedMeals, disabled,
    onSelectRow, onStartEdit, onDelete, onSave, onCancel, onMealChange 
}) => {
    const { className, date, meals } = item;
    const highlightClass = isHighlighted ? 'highlight-update' : '';
    const rowId = `${date}-${className}`;
    
    return (
        <tr className={`table-row-item ${highlightClass} ${isSelected ? 'bg-teal-50 dark:bg-teal-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} transition-colors duration-150 ${disabled ? 'opacity-50' : ''}`}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                 {!isReadOnly && (
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 disabled:cursor-not-allowed"
                        checked={isSelected}
                        onChange={onSelectRow}
                        disabled={disabled}
                    />
                 )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{className}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{new Date(date + 'T00:00:00').toLocaleDateString('vi-VN')}</td>
            
            <MealCell 
                isEditing={isEditing}
                mealType={MealType.KidsBreakfast}
                value={meals[MealType.KidsBreakfast] || {count: 0}}
                editedValue={editedMeals?.[MealType.KidsBreakfast]}
                onChange={onMealChange}
                id={rowId}
            />
            <MealCell 
                isEditing={isEditing}
                mealType={MealType.KidsLunch}
                value={meals[MealType.KidsLunch] || {count: 0}}
                editedValue={editedMeals?.[MealType.KidsLunch]}
                onChange={onMealChange}
                id={rowId}
            />
            <MealCell 
                isEditing={isEditing}
                mealType={MealType.TeachersLunch}
                value={meals[MealType.TeachersLunch] || {count: 0}}
                editedValue={editedMeals?.[MealType.TeachersLunch]}
                onChange={onMealChange}
                id={rowId}
            />

            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium h-[52px]">
                {isEditing ? (
                    isSaving ? (
                        <div className="flex justify-center items-center">
                            <SavingSpinner />
                        </div>
                    ) : (
                         <div className="flex justify-center space-x-4">
                            <button onClick={onSave} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors">Lưu</button>
                            <button onClick={onCancel} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">Hủy</button>
                        </div>
                    )
                ) : (
                    !isReadOnly && (
                         <div className="flex justify-center space-x-4">
                            <button onClick={onStartEdit} disabled={disabled} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:cursor-not-allowed disabled:text-gray-400">Sửa</button>
                            <button onClick={onDelete} disabled={disabled} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:cursor-not-allowed disabled:text-gray-400">Xóa</button>
                        </div>
                    )
                )}
            </td>
        </tr>
    );
};

export default React.memo(SummaryTableRow);