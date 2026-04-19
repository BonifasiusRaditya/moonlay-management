import { useEffect } from 'react';
import { useNotificationStore } from '@/Session/notificationSession';
import { cn } from '@/utils/cn';

export function NotificationToast() {
  const { notifications, removeNotification } = useNotificationStore();

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, 5000); // Auto-dismiss after 5 seconds
      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  const typeStyles = {
    success: 'bg-green-500 text-white border-green-600',
    error: 'bg-red-500 text-white border-red-600',
    info: 'bg-blue-500 text-white border-blue-600',
    warning: 'bg-yellow-500 text-white border-yellow-600',
  };

  const iconStyles = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            'rounded p-4 shadow-lg border-2 flex items-start gap-3 animate-in slide-in-from-right',
            typeStyles[notification.type]
          )}
        >
          <div className="flex-shrink-0 text-xl font-bold">{iconStyles[notification.type]}</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">{notification.title}</div>
            {notification.message && (
              <div className="text-sm mt-1 opacity-90">{notification.message}</div>
            )}
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 text-white hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-white rounded"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

