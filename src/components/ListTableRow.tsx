import React from 'react';

interface ListTableRowProps {
    data: {
        className: string;
        kidsLunchCurrent: { count: number; registeredBy?: string };
        teachersLunchCurrent: { count: number; registeredBy?: string };
        kidsBreakfastNext: { count: number; registeredBy?: string };
    };
    isHighlighted: boolean;
    stt: number;
    isUserClassHighlight: boolean;
}

const MealCell: React.FC<{ mealData: { count: number; registeredBy?: string; } }> = ({ mealData }) => (
    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
        <div>{mealData.count}</div>
        {mealData.registeredBy && <div className="text-xs text-gray-400 dark:text-gray-500">({mealData.registeredBy})</div>}
    </td>
);

const ListTableRow: React.FC<ListTableRowProps> = ({ data, isHighlighted, stt, isUserClassHighlight }) => {
    const highlightClass = isHighlighted ? 'highlight-update' : '';
    const userHighlightClass = isUserClassHighlight ? 'highlight-user-class' : '';
    return (
        <tr 
            data-classname={data.className} 
            className={`table-row-item ${highlightClass} ${userHighlightClass} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150`}
            style={{ scrollMarginTop: '72px' }}
        >
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{stt}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{data.className}</td>
            <MealCell mealData={data.kidsLunchCurrent} />
            <MealCell mealData={data.teachersLunchCurrent} />
            <MealCell mealData={data.kidsBreakfastNext} />
        </tr>
    );
};

export default React.memo(ListTableRow);
