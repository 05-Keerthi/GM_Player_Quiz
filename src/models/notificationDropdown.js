import React, { useState, useEffect, useCallback } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNotificationContext } from '../context/notificationContext';
import io from 'socket.io-client';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    loading, 
    error, 
    getNotificationsByUserId, 
    markAsRead 
  } = useNotificationContext();
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = async (data) => {
      // Refresh notifications when a new one is received
      if (data.userId) {
        await getNotificationsByUserId(data.userId);
      }
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, getNotificationsByUserId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.notification-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification._id);
      }

      if (notification.qrCodeData) {
        window.open(notification.qrCodeData, '_blank');
      }

      // Close dropdown after clicking
      setIsOpen(false);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatNotificationTime = useCallback((createdAt) => {
    const now = new Date();
    const notificationDate = new Date(createdAt);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return notificationDate.toLocaleDateString();
  }, []);

  return (
    <div className="relative notification-dropdown" onClick={(e) => e.stopPropagation()}>
      <div className="cursor-pointer relative" onClick={() => setIsOpen(!isOpen)}>
        <FaBell className="text-gray-600 hover:text-gray-800" size={24} />
        {notifications.some((n) => !n.read) && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.filter((n) => !n.read).length}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                {error.message}
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="text-sm">
                      <span className="text-gray-600">{notification.message}</span>
                    </div>

                    {notification.sixDigitCode && (
                      <div className="text-xs text-gray-500">
                        Code: <span className="font-medium">{notification.sixDigitCode}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                      {!notification.read && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => {/* Handle view all notifications */}}
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
