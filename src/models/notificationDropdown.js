import React, { useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNotificationContext } from "../context/notificationContext";

const NotificationDropdown = ({onNotificationClick, userId }) => {
  const { 
    notifications, 
    fetchNotifications, 
    markNotificationAsRead 
  } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);

  // Add userId dependency to useEffect
  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    }
  }, [userId, fetchNotifications]);

  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification._id);
    if (notification.qrcodedata) {
      window.open(notification.qrcodedata, '_blank');
    }
    onNotificationClick?.(notification._id);
  };

 

  return (
    <div className="relative notification-dropdown" onClick={(e) => e.stopPropagation()}>
      {/* Bell Icon with Badge */}
      <div className="cursor-pointer relative" onClick={() => setIsOpen(!isOpen)}>
        <FaBell className="text-gray-600 hover:text-gray-800" size={24} />
        {notifications.some((n) => !n.read) && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.filter((n) => !n.read).length}
          </span>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          </div>

          {/* Scrollable Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <a
                  key={notification._id}
                  href={notification.qrcodedata}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNotificationClick(notification);
                  }}
                >
                  <div className="flex flex-col gap-2">
                    <div className="text-sm">
                      <span className="text-gray-600">You're invited to join</span>
                      <span className="font-semibold text-gray-800"> {notification.quizTitle}</span>
                    </div>

                    {notification.sixDigitCode && (
                      <div className="text-xs text-gray-500">
                        Code: <span className="font-medium">{notification.sixDigitCode}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      {/* <span className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Join now →
                      </span> */}
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200">
            <button
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => alert("Navigate to all notifications")}
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
