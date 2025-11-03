import React from 'react';
import { MealType } from '../types';
import NumberInput from './NumberInput';

interface SummaryCardProps {
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

const MealInfoRow: React.FC<{
    label: MealType;
    data: { count: number; registeredBy?: string };
    isEditing: boolean;
    editedValue: string | undefined;
    onChange: (mealType: MealType, value: string) => void;
    id: string;
}> = ({ label, data, isEditing, editedValue, onChange, id }) => (
    <div className="flex justify-between items-center py-2">
        <label htmlFor={`edit-${label}-${id}`} className="text-sm text-gray-600 dark:text-gray-300">{label}</label>
        {isEditing ? (
            <div className="w-24">
                <NumberInput
                    id={`edit-${label}-${id}`}
                    value={editedValue ?? ''}
                    onChange={(val) => onChange(label, val)}
                />
            </div>
        ) : (
            <div>
                <span className="font-bold text-gray-800 dark:text-gray-100">{data.count}</span>
                {data.registeredBy && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">({data.registeredBy})</span>}
            </div>
        )}
    </div>
);


const SavingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const SummaryCard: React.FC<SummaryCardProps> = ({
    item, isHighlighted, isSelected, isEditing, isSaving, isReadOnly, editedMeals, disabled,
    onSelectRow, onStartEdit, onDelete, onSave, onCancel, onMealChange
}) => {
    const { className, date, meals } = item;
    const highlightClass = isHighlighted ? 'highlight-update' : '';
    const rowId = `${date}-${className}`;

    const cardBorderStyle = isSelected ? 'border-teal-500' : 'border-gray-200 dark:border-gray-700';

    return (
        <div className={`data-card table-row-item ${highlightClass} ${disabled ? 'opacity-50' : ''} border ${cardBorderStyle}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-teal-700 dark:text-teal-400">{className}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(date + 'T00:00:00').toLocaleDateString('vi-VN')}</p>
                </div>
                {!isReadOnly && (
                    <div className="flex items-center h-full">
                        <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 disabled:cursor-not-allowed"
                            checked={isSelected}
                            onChange={onSelectRow}
                            disabled={disabled}
                            aria-label={`Select row for ${className} on ${date}`}
                        />
                    </div>
                )}
            </div>
            <div className="p-4 divide-y divide-gray-200 dark:divide-gray-700">
                <MealInfoRow
                    label={MealType.KidsBreakfast}
                    data={meals[MealType.KidsBreakfast] || {count: 0}}
                    isEditing={isEditing}
                    editedValue={editedMeals?.[MealType.KidsBreakfast]}
                    onChange={onMealChange}
                    id={rowId}
                />
                <MealInfoRow
                    label={MealType.KidsLunch}
                    data={meals[MealType.KidsLunch] || {count: 0}}
                    isEditing={isEditing}
                    editedValue={editedMeals?.[MealType.KidsLunch]}
                    onChange={onMealChange}
                    id={rowId}
                />
                 <MealInfoRow
                    label={MealType.TeachersLunch}
                    data={meals[MealType.TeachersLunch] || {count: 0}}
                    isEditing={isEditing}
                    editedValue={editedMeals?.[MealType.TeachersLunch]}
                    onChange={onMealChange}
                    id={rowId}
                />
            </div>
            {!isReadOnly && (
                 <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700">
                     {isEditing ? (
                         isSaving ? (
                            <div className="flex justify-center items-center h-[36px]">
                                <SavingSpinner />
                            </div>
                         ) : (
                            <div className="flex justify-end space-x-4">
                                <button onClick={onSave} className="px-3 py-1 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Lưu</button>
                                <button onClick={onCancel} className="px-3 py-1 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Hủy</button>
                            </div>
                         )
                     ) : (
                        <div className="flex justify-end space-x-4">
                            <button onClick={onStartEdit} disabled={disabled} className="px-3 py-1 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400">Sửa</button>
                            <button onClick={onDelete} disabled={disabled} className="px-3 py-1 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400">Xóa</button>
                        </div>
                     )}
                 </div>
            )}
        </div>
    );
};

export default React.memo(SummaryCard);
