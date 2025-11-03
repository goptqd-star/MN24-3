import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MealType, View, MealRegistration, ClassInfo, Role } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import CustomDatePicker from './CustomDatePicker';
import ClassFilterDropdown from './ClassFilterDropdown';
import SummaryTableRow from './SummaryTableRow';
import SummaryCard from './SummaryCard';
import { DocumentData, DocumentSnapshot } from 'firebase/firestore';

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekDateRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const from = new Date(today);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    from.setDate(today.getDate() + diff);
    
    const to = new Date(from);
    to.setDate(from.getDate() + 5);

    return { from: formatDate(from), to: formatDate(to) }
}

const getMonthDateRange = () => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: formatDate(from), to: formatDate(to) };
}

const EmptyState: React.FC<{onRegisterClick: () => void}> = ({onRegisterClick}) => (
    <div className="text-center py-10 px-6 fade-in">
        <svg className="mx-auto h-32 w-32 text-gray-300 dark:text-gray-500" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M51 59H13c-2.2 0-4-1.8-4-4V9c0-2.2 1.8-4 4-4h23.2c.8 0 1.6.3 2.2.9l10.8 10.8c.6.6.9 1.4.9 2.2V55c0 2.2-1.8 4-4 4z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M36 5v12c0 1.1.9 2 2 2h12M20 31h24M20 41h14" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Không có dữ liệu</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Không có suất ăn nào phù hợp với bộ lọc hiện tại.</p>
        <div className="mt-6">
            <button
                type="button"
                onClick={onRegisterClick}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                Đi đến trang đăng ký
            </button>
        </div>
    </div>
);

export interface SummaryData {
    date: string;
    className: string;
    meals: { [key in MealType]?: { count: number; registeredBy?: string; } };
}

const ITEMS_PER_PAGE = 30;

export const TableRowsSkeleton = () => (
    <div className="p-4 space-y-2">
        {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
    </div>
);

const LoadingMoreSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-4">
        <svg className="animate-spin h-6 w-6 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const SortableHeader: React.FC<{
    title: string;
    sortKey: string;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    onSort: (key: string) => void;
    className?: string;
}> = ({ title, sortKey, sortConfig, onSort, className = '' }) => {
    const isSorted = sortConfig?.key === sortKey;
    const directionIcon = sortConfig?.direction === 'asc' ? '▲' : '▼';

    return (
        <th scope="col" className={`px-6 py-3 text-center align-top text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer ${className}`} onClick={() => onSort(sortKey)}>
            <div className="flex items-center justify-center space-x-1">
                <span>{title}</span>
                <span className={`transition-opacity duration-200 ${isSorted ? 'opacity-100' : 'opacity-30'}`}>{directionIcon}</span>
            </div>
        </th>
    );
};


const SummaryPage: React.FC<{setView: (view: View) => void}> = ({setView}) => {
  const { classes, dataVersion, recentlyUpdatedKeys, getRegistrations, deleteRegistrations, deleteMultipleRegistrationsByDate, updateRegistrations, exportData } = useData();
  const { currentUser } = useAuth();
  const { addToast, isLoading: isContextLoading } = useUI();
  
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  
  const [registrations, setRegistrations] = useState<MealRegistration[]>([]);
  const [reportTotals, setReportTotals] = useState<Record<MealType, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const [totalRecords, setTotalRecords] = useState(0);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });


  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deletingItem, setDeletingItem] = useState<{className: string, date: string} | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [savingRowKey, setSavingRowKey] = useState<string | null>(null);
  const [editedMeals, setEditedMeals] = useState<{ [key in MealType]?: string } | null>(null);
  const [originalRegistrationsForEdit, setOriginalRegistrationsForEdit] = useState<MealRegistration[] | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  const isReadOnly = currentUser?.role === Role.BGH || currentUser?.role === Role.KT_CD;

  useEffect(() => {
    if (classes.length > 0) {
        setSelectedClasses(classes.map(