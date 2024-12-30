import React, { useState, useEffect } from "react";
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

  // Initialize socket connection
  useEffect(() => {
    if (user?.id) {
      const newSocket = io(process.env.REACT_APP_API_URL);
      setSocket(newSocket);

      newSocket.emit("join-user-room", { userId: user.id });

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [user]);

  // Fetch notifications when component mounts
  useEffect(() => {
    const fetchNotifications = async () => {
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
    };

    fetchNotifications();
  }, [user]);

  // Handle socket events for notifications
  useEffect(() => {
    if (socket && user?.id) {
      socket.on("receive-notification", async () => {
        await getRegularNotifications(user.id);
      });

      socket.on("new_survey_notification", async () => {
        await getSurveyNotifications(user.id);
      });

      return () => {
        socket.off("receive-notification");
        socket.off("new_survey_notification");
      };
    }
  }, [socket, user]);

  const handleNotificationClick = async (notification) => {
    try {
      if (notification.type === "Survey-Invitation") {
        if (!notification.read) {
          await markSurveyAsRead(notification._id);
          if (user?.id) {
            await getSurveyNotifications(user.id);
          }
        }

        if (notification.joinCode) {
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
          if (user?.id) {
            await getRegularNotifications(user.id);
          }
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

  // Combine and sort notifications
  const allNotifications = [
    ...(regularNotifications || []),
    ...(surveyNotifications || []),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Calculate unread count
  const unreadCount = allNotifications.filter((n) => !n.read).length;

  // Render notification message based on type
  const renderNotificationMessage = (notification) => {
    const messageComponents = {
      "Survey-Invitation": () => (
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
      ),
      quiz_result: () => (
        <div className="text-sm">
          <span className="text-gray-600 font-medium">
            Quiz Result Available
          </span>
          <div className="text-gray-500 text-sm mt-1">
            <span>Score: {notification.score}</span>
          </div>
        </div>
      ),
      default: () => (
        <div className="text-sm">
          <span className="text-gray-600">{notification.message}</span>
        </div>
      ),
    };

    const MessageComponent =
      messageComponents[notification.type] || messageComponents.default;
    return <MessageComponent />;
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div
        className="cursor-pointer relative"
        onClick={() => setIsOpen(!isOpen)}
      >
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
            <h3 className="text-lg font-semibold text-gray-800">
              Notifications
            </h3>
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
