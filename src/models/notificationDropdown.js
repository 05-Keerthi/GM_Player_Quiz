// import React, { useState, useEffect, useCallback } from "react";
// import { FaBell } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import { useNotificationContext } from "../context/notificationContext";
// import { useSurveyNotificationContext } from "../context/SurveynotificationContext";
// import io from "socket.io-client";

// const NotificationDropdown = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const navigate = useNavigate();
//   const [socket, setSocket] = useState(null);

//   // Regular notification context
//   const {
//     notifications: regularNotifications,
//     loading: regularLoading,
//     error: regularError,
//     getNotificationsByUserId: getRegularNotifications,
//     markAsRead: markRegularAsRead,
//   } = useNotificationContext();

//   // Survey notification context
//   const {
//     notifications: surveyNotifications,
//     loading: surveyLoading,
//     error: surveyError,
//     getNotificationsByUserId: getSurveyNotifications,
//     markAsRead: markSurveyAsRead,
//   } = useSurveyNotificationContext();

//   // Socket connection setup
//   useEffect(() => {
//     const newSocket = io("http://localhost:5000");
//     setSocket(newSocket);

//     return () => newSocket.disconnect();
//   }, []);

//   const handleRegularNotificationClick = async (notification) => {
//     try {
//       console.log("Handling regular notification:", notification);
//       if (!notification.read) {
//         await markRegularAsRead(notification._id);
//       }

//       if (notification.type === "quiz_result" && notification.sessionId) {
//         navigate(`/leaderboard?sessionId=${notification.sessionId}`);
//       } else if (notification.sixDigitCode) {
//         navigate(`/join?code=${notification.sixDigitCode}`);
//       }
//       setIsOpen(false);
//     } catch (error) {
//       console.error("Error handling regular notification:", error);
//     }
//   };

//   const handleSurveyNotificationClick = async (notification) => {
//     try {
//       console.log("Handling survey notification:", notification);
//       if (!notification.read) {
//         // Make sure we're using the correct ID field for survey notifications
//         const notificationId = notification._id;
//         console.log("Marking survey notification as read with ID:", notificationId);
//         await markSurveyAsRead(notificationId);
//       }

//       // Navigate to survey
//       if (notification.qrCodeData) {
//         const surveyPath = notification.qrCodeData.split('/join')[0];
//         navigate(surveyPath);
//       } else if (notification.joinCode) {
//         navigate(`/survey/join?code=${notification.joinCode}`);
//       }
//       setIsOpen(false);
//     } catch (error) {
//       console.error("Error handling survey notification:", error);
//     }
//   };

//   const handleNotificationClick = (notification) => {
//     if (notification.type === "Survey-Invitation") {
//       handleSurveyNotificationClick(notification);
//     } else {
//       handleRegularNotificationClick(notification);
//     }
//   };

//   const renderNotificationMessage = (notification) => {
//     switch (notification.type) {
//       case "Survey-Invitation":
//         return (
//           <div className="text-sm">
//             <span className="text-gray-600 font-medium">Survey Invitation</span>
//             <div className="text-gray-500 text-sm mt-1">
//               <span>{notification.message}</span>
//             </div>
//             <div className="text-xs text-gray-500 mt-1">
//               <span className="font-medium">Click to participate</span>
//             </div>
//           </div>
//         );
//       case "quiz_result":
//         return (
//           <div className="text-sm">
//             <span className="text-gray-600 font-medium">Quiz Result Available</span>
//             <div className="text-gray-500 text-sm mt-1">
//               <span>Score: {notification.score}</span>
//             </div>
//           </div>
//         );
//       default:
//         return (
//           <div className="text-sm">
//             <span className="text-gray-600">{notification.message}</span>
//           </div>
//         );
//     }
//   };

//   // Combine and sort all notifications
//   const allNotifications = [...regularNotifications, ...surveyNotifications]
//     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//   const unreadCount = 
//     regularNotifications.filter(n => !n.read).length + 
//     surveyNotifications.filter(n => !n.read).length;

//   return (
//     <div className="relative notification-dropdown" onClick={(e) => e.stopPropagation()}>
//       <div className="cursor-pointer relative" onClick={() => setIsOpen(!isOpen)}>
//         <FaBell className="text-gray-600 hover:text-gray-800" size={24} />
//         {unreadCount > 0 && (
//           <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//             {unreadCount}
//           </span>
//         )}
//       </div>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
//           <div className="p-3 border-b border-gray-200">
//             <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
//           </div>

//           <div className="max-h-96 overflow-y-auto">
//             {regularLoading || surveyLoading ? (
//               <div className="flex justify-center py-4">
//                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
//               </div>
//             ) : regularError || surveyError ? (
//               <div className="p-4 text-center text-red-500">
//                 {regularError?.message || surveyError?.message}
//               </div>
//             ) : allNotifications.length > 0 ? (
//               allNotifications.map((notification) => (
//                 <div
//                   key={notification.id || notification._id}
//                   onClick={() => handleNotificationClick(notification)}
//                   className={`block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
//                     !notification.read ? "bg-blue-50" : ""
//                   }`}
//                 >
//                   {renderNotificationMessage(notification)}
//                   <div className="flex items-center justify-between mt-1">
//                     <span className="text-xs text-gray-500">
//                       {new Date(notification.createdAt).toLocaleString()}
//                     </span>
//                     {!notification.read && (
//                       <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
//                         New
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="p-4 text-center text-gray-500">
//                 No notifications
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default NotificationDropdown;
import React, { useState, useEffect, useCallback } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useNotificationContext } from "../context/notificationContext";
import { useSurveyNotificationContext } from "../context/SurveynotificationContext";
import io from "socket.io-client";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  // Regular notification context
  const {
    notifications: regularNotifications,
    loading: regularLoading,
    error: regularError,
    getNotificationsByUserId: getRegularNotifications,
    markAsRead: markRegularAsRead,
  } = useNotificationContext();

  // Survey notification context
  const {
    notifications: surveyNotifications,
    loading: surveyLoading,
    error: surveyError,
    getNotificationsByUserId: getSurveyNotifications,
    markAsRead: markSurveyAsRead,
  } = useSurveyNotificationContext();

  // Fetch notifications when component mounts
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (userId) {
          await Promise.all([
            getRegularNotifications(userId),
            getSurveyNotifications(userId)
          ]);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [getRegularNotifications, getSurveyNotifications]);

  // Socket connection setup
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("newNotification", async () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        await Promise.all([
          getRegularNotifications(userId),
          getSurveyNotifications(userId)
        ]);
      }
    });

    return () => {
      newSocket.off("newNotification");
      newSocket.disconnect();
    };
  }, [getRegularNotifications, getSurveyNotifications]);

  const handleSurveyNotificationClick = async (notification) => {
    try {
      console.log("Handling survey notification:", notification);
      if (!notification.read) {
        const notificationId = notification._id;
        await markSurveyAsRead(notificationId);
        // Refresh notifications
        const userId = localStorage.getItem('userId');
        if (userId) {
          await getSurveyNotifications(userId);
        }
      }

      // Navigate using the correct field names from backend
      if (notification.surveyQrData) {
        const surveyPath = notification.surveyQrData.split('/join')[0];
        navigate(surveyPath);
      } else if (notification.surveyJoinCode) {
        navigate(`/survey/join?code=${notification.surveyJoinCode}`);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling survey notification:", error);
    }
  };

  const handleRegularNotificationClick = async (notification) => {
    try {
      console.log("Handling regular notification:", notification);
      if (!notification.read) {
        await markRegularAsRead(notification._id);
        const userId = localStorage.getItem('userId');
        if (userId) {
          await getRegularNotifications(userId);
        }
      }

      if (notification.type === "quiz_result" && notification.sessionId) {
        navigate(`/leaderboard?sessionId=${notification.sessionId}`);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling regular notification:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === "Survey-Invitation") {
      handleSurveyNotificationClick(notification);
    } else {
      handleRegularNotificationClick(notification);
    }
  };

  const renderNotificationMessage = (notification) => {
    switch (notification.type) {
      case "Survey-Invitation":
        return (
          <div className="text-sm">
            <span className="text-gray-600 font-medium">Survey Invitation</span>
            <div className="text-gray-500 text-sm mt-1">
              <span>{notification.message}</span>
            </div>
            {notification.surveyJoinCode && (
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-medium">Join Code: </span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {notification.surveyJoinCode}
                </span>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              <span className="font-medium">Click to participate</span>
            </div>
          </div>
        );
      case "quiz_result":
        return (
          <div className="text-sm">
            <span className="text-gray-600 font-medium">Quiz Result Available</span>
            <div className="text-gray-500 text-sm mt-1">
              <span>Score: {notification.score}</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-sm">
            <span className="text-gray-600">{notification.message}</span>
          </div>
        );
    }
  };

  // Debug logging
  useEffect(() => {
    console.log("Survey Notifications:", surveyNotifications);
    console.log("Regular Notifications:", regularNotifications);
  }, [surveyNotifications, regularNotifications]);

  // Combine and sort all notifications
  const allNotifications = [...regularNotifications, ...surveyNotifications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unreadCount = 
    regularNotifications.filter(n => !n.read).length + 
    surveyNotifications.filter(n => !n.read).length;

  return (
    <div className="relative notification-dropdown" onClick={(e) => e.stopPropagation()}>
      <div className="cursor-pointer relative" onClick={() => setIsOpen(!isOpen)}>
        <FaBell className="text-gray-600 hover:text-gray-800" size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {regularLoading || surveyLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : regularError || surveyError ? (
              <div className="p-4 text-center text-red-500">
                {regularError?.message || surveyError?.message}
              </div>
            ) : allNotifications.length > 0 ? (
              allNotifications.map((notification) => (
                <div
                  key={notification.id || notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  {renderNotificationMessage(notification)}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    {!notification.read && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;