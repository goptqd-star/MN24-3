import React from 'react';
import { MealType } from '../types';

interface ListCardProps {
    data: {
        className: string;
        kidsLunchCurrent: { count: number; registeredBy?: string };
        teachersLunchCurrent: { count: number; registeredBy?: string };
        kidsBreakfastNext: { count: number; registeredBy?: string };
    };
    stt: number;
    isUserClassHighlight: boolean;
}

const MealInfo: React.FC<{ label: string; count: number; registeredBy?: string }> = ({ label, count, registeredBy }) => (
    <div className="flex justify-between items-center text-sm py-2">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <div>
            <span className="font-bold text-gray-800 dark:text-gray-100">{count}</span>
            {registeredBy && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">({registeredBy})</span>}
        </div>
    </div>
);

const ListCard: React.FC<ListCardProps> = ({ data, stt, isUserClassHighlight }) => {
    const userHighlightClass = isUserClassHighlight ? 'highlight-user-class border-teal-500' : 'border-gray-200 dark:border-gray-700';

    return (
        <div className={`data-card table-row-item ${userHighlightClass}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-teal-700 dark:text-teal-400">
                    <span className="text-gray-400 dark:text-gray-500 mr-2">{stt}.</span>
                    {data.className}
                </h3>
            </div>
            <div className="p-4 divide-y divide-gray-200 dark:divide-gray-700">
                <MealInfo label={MealType.KidsLunch} count={data.kidsLunchCurrent.count} registeredBy={data.kidsLunchCurrent.registeredBy} />
                <MealInfo label={MealType.TeachersLunch} count={data.teachersLunchCurrent.count} registeredBy={data.teachersLunchCurrent.registeredBy} />
                <MealInfo label={MealType.KidsBreakfast} count={data.kidsBreakfastNext.count} registeredBy={data.kidsBreakfastNext.registeredBy} />
            </div>
        </div>
    );
};

export default React.memo(ListCard);
