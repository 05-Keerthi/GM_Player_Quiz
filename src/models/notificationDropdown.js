// import React, { useEffect, useState } from 'react';
// import { FaBell } from 'react-icons/fa';
// import { useNotification } from '../context/NotificationContext'; // Use the custom hook
// import io from 'socket.io-client';

// const NotificationDropdown = ({ onNotificationClick, userId }) => {
//   const { 
//     notifications, 
//     addNotification,
//     updateNotification,
//     markNotificationAsRead,
//     fetchNotifications
//   } = useNotification(); // Use the hook here
  
//   const [isOpen, setIsOpen] = useState(false);

//   // Initialize socket connection
//   const socket = io("http://localhost:5000");

//   useEffect(() => {
//     if (userId) {
//       fetchNotifications(userId); // Fetch initial notifications
//     }
//   }, [userId, fetchNotifications]);

//   useEffect(() => {
//     // Listen for real-time notifications from the socket
//     socket.on('receive-notification', (notification) => {
//       addNotification(notification);  // Add new notification to state
//     });

//     // Listen for updates to notifications
//     socket.on('notification-updated', (updatedNotification) => {
//       updateNotification(updatedNotification);  // Update notification in state
//     });

//     // Cleanup socket listeners on component unmount
//     return () => {
//       socket.off('receive-notification');
//       socket.off('notification-updated');
//     };
//   }, [addNotification, updateNotification, socket]);

//   const handleNotificationClick = (notification) => {
//     markNotificationAsRead(notification._id); // Mark the notification as read
//     if (notification.qrcodedata) {
//       window.open(notification.qrcodedata, '_blank');
//     }
//     onNotificationClick?.(notification._id);
//   };

//   return (
//     <div className="relative notification-dropdown" onClick={(e) => e.stopPropagation()}>
//       {/* Bell Icon with Badge */}
//       <div className="cursor-pointer relative" onClick={() => setIsOpen(!isOpen)}>
//         <FaBell className="text-gray-600 hover:text-gray-800" size={24} />
//         {notifications.some((n) => !n.read) && (
//           <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//             {notifications.filter((n) => !n.read).length}
//           </span>
//         )}
//       </div>

//       {/* Dropdown Menu */}
//       {isOpen && (
//         <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
//           <div className="p-3 border-b border-gray-200">
//             <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
//           </div>

//           {/* Scrollable Notification List */}
//           <div className="max-h-96 overflow-y-auto">
//             {notifications.length > 0 ? (
//               notifications.map((notification) => (
//                 <a
//                   key={notification._id}
//                   href={notification.qrcodedata}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className={`block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
//                   onClick={(e) => {
//                     e.preventDefault();
//                     handleNotificationClick(notification);
//                   }}
//                 >
//                   <div className="flex flex-col gap-2">
//                     <div className="text-sm">
//                       <span className="text-gray-600">You're invited to join</span>
//                       <span className="font-semibold text-gray-800"> {notification.quizTitle}</span>
//                     </div>

//                     {notification.sixDigitCode && (
//                       <div className="text-xs text-gray-500">
//                         Code: <span className="font-medium">{notification.sixDigitCode}</span>
//                       </div>
//                     )}

//                     <div className="flex items-center justify-between mt-1">
//                       <span className="text-xs text-gray-500">
//                         {new Date(notification.createdAt).toLocaleString()}
//                       </span>
//                     </div>
//                   </div>
//                 </a>
//               ))
//             ) : (
//               <div className="p-4 text-center text-gray-500">
//                 No notifications yet
//               </div>
//             )}
//           </div>

//           {/* Footer */}
//           <div className="p-3 border-t border-gray-200">
//             <button
//               className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
//               onClick={() => alert("Navigate to all notifications")}
//             >
//               View All Notifications
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default NotificationDropdown;
import React, { useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext'; // Use the custom hook
import io from 'socket.io-client';

const NotificationDropdown = ({ onNotificationClick, userId }) => {
  const { 
    notifications, 
    addNotification,
    updateNotification,
    markNotificationAsRead,
    fetchNotifications 
  } = useNotification(); // Use the hook here
  
  const [isOpen, setIsOpen] = useState(false);

  // Initialize socket connection
  const socket = io("http://localhost:5000");

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId); // Fetch initial notifications
    }
  }, [userId, fetchNotifications]);

  useEffect(() => {
    // Listen for real-time notifications from the socket
    socket.on('receive-notification', (notification) => {
      addNotification(notification);  // Add new notification to state
    });

    // Listen for updates to notifications
    socket.on('notification-updated', (updatedNotification) => {
      updateNotification(updatedNotification);  // Update notification in state
    });

    // Cleanup socket listeners on component unmount
    return () => {
      socket.off('receive-notification');
      socket.off('notification-updated');
    };
  }, [addNotification, updateNotification, socket]);

  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification._id); // Mark the notification as read
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
                  className={`block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
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
