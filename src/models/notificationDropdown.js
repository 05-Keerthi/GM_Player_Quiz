import { useState } from "react";
import { FaBell } from "react-icons/fa";

const NotificationDropdown = ({ notifications, onNotificationClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle dropdown visibility
  const toggleDropdown = () => setIsOpen(!isOpen);

  // Close dropdown when clicking outside (optional, if needed)
  const handleOutsideClick = (e) => {
    if (!e.target.closest(".notification-dropdown")) {
      setIsOpen(false);
    }
  };

  return (
    <div
      className="relative notification-dropdown"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Bell Icon */}
      <div className="cursor-pointer" onClick={toggleDropdown}>
        <FaBell size={24} />
        {/* Badge for Unread Notifications */}
        {notifications.some((n) => !n.isRead) && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
            {notifications.filter((n) => !n.isRead).length}
          </span>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg z-50">
          <div className="p-2 border-b">
            <h3 className="text-sm font-semibold">Notifications</h3>
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`p-2 border-b cursor-pointer ${
                    notification.isRead ? "bg-gray-50" : "bg-blue-50"
                  }`}
                  onClick={() => onNotificationClick(notification.id)}
                >
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {notification.time || "Just now"}
                  </p>
                </li>
              ))
            ) : (
              <li className="p-2 text-center text-sm text-gray-500">
                No new notifications
              </li>
            )}
          </ul>
          <div className="p-2 text-center">
            <button
              className="text-sm text-blue-500 hover:underline"
              onClick={() => alert("Navigate to all notifications page")}
            >
              View All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
