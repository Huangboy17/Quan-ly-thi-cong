import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { AppNotification } from '../types';
import { fetchMyNotifications, markNotificationAsRead, subscribeToNotifications } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

interface NotificationBellProps {
  userId?: string;
  onNavigateToAdmin?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userId, onNavigateToAdmin }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = async () => {
    if (!userId) return;
    const data = await fetchMyNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    if (!userId) return;
    loadNotifications();

    const unsub = subscribeToNotifications(userId, () => {
      loadNotifications();
    });

    return () => {
      unsub();
    };
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.is_read) {
      await markNotificationAsRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    setIsOpen(false);
    if (n.type === 'NEW_LEVEL_1_PENDING' && onNavigateToAdmin) {
      onNavigateToAdmin();
    }
  };

  if (!userId) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{unreadCount} chưa đọc</span>
              )}
            </div>
            
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Không có thông báo nào.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition relative group ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${!n.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1.5">
                            {new Date(n.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        {!n.is_read && (
                          <div className="shrink-0 flex items-start">
                            <button 
                              onClick={(e) => handleMarkAsRead(n.id, e)}
                              className="w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 transition opacity-0 group-hover:opacity-100"
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 group-hover:hidden" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
