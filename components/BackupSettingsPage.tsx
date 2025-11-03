import React, { useState, useEffect, useMemo } from 'react';
import { useUI } from '../contexts/UIContext';

const BackupSettingsPage: React.FC = () => {
    const { addToast } = useUI();
    const [reminderDay, setReminderDay] = useState('1');
    const [reminderHour, setReminderHour] = useState('8');

    useEffect(() => {
        try {
            const settingsStr = localStorage.getItem('backupSettings_v1');
            if (settingsStr) {
                const settings = JSON.parse(settingsStr);
                setReminderDay(settings.day || '1');
                setReminderHour(settings.hour || '8');
            }
        } catch (e) {
            console.error("Failed to load backup settings from localStorage", e);
        }
    }, []);

    const handleSave = () => {
        try {
            const settings = { day: reminderDay, hour: reminderHour };
            localStorage.setItem('backupSettings_v1', JSON.stringify(settings));
            addToast('Đã lưu cài đặt nhắc nhở sao lưu.', 'success');
        } catch (e) {
            console.error("Failed to save backup settings to localStorage", e);
            addToast('Không thể lưu cài đặt.', 'error');
        }
    };

    const dayOptions = useMemo(() => {
        const options = [];
        for (let i = 1; i <= 31; i++) {
            options.push(<option key={i} value={String(i)}>Ngày {i}</option>);
        }
        options.push(<option key="last" value="last">Ngày cuối tháng</option>);
        return options;
    }, []);

    const hourOptions = useMemo(() => {
        const options = [];
        for (let i = 6; i <= 18; i++) {
             options.push(<option key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</option>);
        }
        return options;
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cài đặt hệ thống</h2>
                <p className="mt-1 text-gray-600 dark:text-gray-400">Tùy chỉnh các thiết lập cho ứng dụng.</p>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cài đặt nhắc nhở sao lưu</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Chọn thời điểm bạn muốn nhận thông báo nhắc nhở sao lưu dữ liệu của tháng trước.
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                        <label htmlFor="reminderDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                           Ngày nhắc nhở
                        </label>
                        <select
                            id="reminderDay"
                            value={reminderDay}
                            onChange={e => setReminderDay(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        >
                            {dayOptions}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="reminderHour" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                           Giờ nhắc nhở
                        </label>
                        <select
                            id="reminderHour"
                            value={reminderHour}
                            onChange={e => setReminderHour(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        >
                            {hourOptions}
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                        Lưu cài đặt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BackupSettingsPage;