import React, { useState, useEffect, useCallback } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useNotificationContext } from "../context/notificationContext";
import { useSurveyNotificationContext } from "../context/SurveynotificationContext";
import io from "socket.io-client";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [socket, setSocket] = useState(null);

  // State to track screen width
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (user?.id) {
      const newSocket = io(process.env.REACT_APP_API_URL);
      setSocket(newSocket);

      // Join user-specific room
      newSocket.emit("join-user-room", { userId: user.id });

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [user]);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (user?.id) {
      try {
        await Promise.all([
          getRegularNotifications(user.id),
          getSurveyNotifications(user.id),
        ]);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle socket events for live notifications
  useEffect(() => {
    if (socket && user?.id) {
      // Regular notification handlers
      socket.on("receive-notification", (notification) => {
        console.log("Received new notification:", notification);
        fetchNotifications();
      });

      // Survey notification handlers
      socket.on("receive-survey-notification", (notification) => {
        console.log("Received new survey notification:", notification);
        fetchNotifications();
      });

      // Handle notification updates
      socket.on("notification-updated", (data) => {
        console.log("Notification updated:", data);
        fetchNotifications();
      });

      socket.on("survey-notification-updated", (data) => {
        console.log("Survey notification updated:", data);
        fetchNotifications();
      });

      // Error handling
      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      return () => {
        socket.off("receive-notification");
        socket.off("receive-survey-notification");
        socket.off("notification-updated");
        socket.off("survey-notification-updated");
        socket.off("error");
      };
    }
  }, [socket, user?.id]);

  const handleNotificationClick = async (notification) => {
    try {
      if (
        notification.type === "Survey-Invitation" ||
        notification.type === "Survey-session_update"
      ) {
        if (!notification.read) {
          await markSurveyAsRead(notification._id);
          // Emit socket event for real-time update
          socket?.emit("mark-survey-notification-read", {
            notificationId: notification._id,
            userId: user.id,
          });
        }

        if (notification.type === "Survey-session_update") {
          // Only mark as read, no navigation
        } else if (notification.joinCode) {
          navigate(`/joinsurvey?code=${notification.joinCode}`);
        } else if (
          notification.type === "survey_result" &&
          notification.sessionId
        ) {
          navigate(`/leaderboard?sessionId=${notification.sessionId}`);
        }
      } else {
        if (!notification.read) {
          await markRegularAsRead(notification._id);
          // Emit socket event for real-time update
          socket?.emit("mark-notification-read", {
            notificationId: notification._id,
            userId: user.id,
          });
        }

        if (notification.type === "quiz_result" && notification.sessionId) {
          navigate(`/leaderboard?sessionId=${notification.sessionId}`);
        } else if (notification.sixDigitCode) {
          navigate(`/join?code=${notification.sixDigitCode}`);
        }
      }

      setIsOpen(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  // Combine and sort all notifications
  const allNotifications = [
    ...(regularNotifications || []),
    ...(surveyNotifications || []),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Calculate unread count
  const unreadCount = allNotifications.filter((n) => !n.read).length;

  const renderNotificationMessage = (notification) => {
    switch (notification.type) {
      case "Survey-Invitation":
        return (
          <div className="text-sm">
            <span className="text-gray-600 font-medium">Survey Invitation</span>
            <div className="text-gray-500 text-sm mt-1">
              <span>{notification.message}</span>
            </div>
            {notification.joinCode && (
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-medium">Join Code: </span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {notification.joinCode}
                </span>
              </div>
            )}
          </div>
        );
      case "Survey-session_update":
        return (
          <div className="text-sm">
            <span className="text-gray-600 font-medium">
              Survey Session Update
            </span>
            <div className="text-gray-500 text-sm mt-1">
              <span>{notification.message}</span>
            </div>
            {notification.joinCode && (
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-medium">Join Code: </span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {notification.joinCode}
                </span>
              </div>
            )}
          </div>
        );
      case "quiz_result":
        return (
          <div className="text-sm">
            <span className="text-gray-600 font-medium">
              Quiz Result Available
            </span>
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

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div
        className="cursor-pointer relative"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="notification-bell"
      >
        <FaBell className="text-white hover:text-gray-200" size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <div
          className={`
            ${isMobile ? "fixed inset-x-0 mx-4 top-20" : "absolute right-0"}
            mt-2 bg-white rounded-lg shadow-xl z-50 border border-gray-200
            ${isMobile ? "w-auto" : "w-80"}
          `}
        >
          <div className="p-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Notifications
              </h3>
              {isMobile && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div
            className={`overflow-y-auto ${
              isMobile ? "max-h-[70vh]" : "max-h-96"
            }`}
          >
            {/* Existing notification content */}
            {regularLoading || surveyLoading ? (
              <div className="flex justify-center py-4">
                <div
                  className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"
                  data-testid="loading-spinner"
                ></div>
              </div>
            ) : regularError || surveyError ? (
              <div className="p-4 text-center text-red-500">
                {regularError?.message || surveyError?.message}
              </div>
            ) : allNotifications.length > 0 ? (
              allNotifications.map((notification) => (
                <div
                  key={notification._id}
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
