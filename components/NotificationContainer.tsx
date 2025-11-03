import React from 'react';
import { useUI } from '../contexts/UIContext';

const Notification: React.FC<{ message: string; }> = ({ message }) => {
  return (
    <div className={`notification-item flex items-center p-3 mb-3 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      <div className="flex-1">{message}</div>
    </div>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications } = useUI();

  return (
    <div role="status" aria-live="polite" className="fixed bottom-5 left-5 z-[100] w-full max-w-sm">
      <style>{`
        .notification-item {
            animation: slideInUp 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
      `}</style>
      {notifications.map(notification => (
        <Notification key={notification.id} message={notification.message} />
      ))}
    </div>
  );
};

export default NotificationContainer;
