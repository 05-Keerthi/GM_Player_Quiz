import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useNotificationContext } from "../context/notificationContext";
import { useSurveyNotificationContext } from "../context/SurveynotificationContext";
import io from "socket.io-client";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
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

  // Handle modal open/close with history
  const openModal = () => {
    setIsOpen(true);
    // Push a new entry to handle back button
    window.history.pushState({ modal: true }, "");
  };

  const closeModal = () => {
    setIsOpen(false);
    // If we opened with pushState, go back
    if (window.history.state?.modal) {
      window.history.back();
    }
  };

  // Listen for popstate (back/forward) events
  useEffect(() => {
    const handlePopState = () => {
      setIsOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        window.innerWidth >= 640
      ) {
        // sm breakpoint
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Socket connection setup
  useEffect(() => {
    if (user?.id) {
      const newSocket = io(process.env.REACT_APP_API_URL);
      setSocket(newSocket);
      newSocket.emit("join-user-room", { userId: user.id });
      return () => {
        if (newSocket) newSocket.disconnect();
      };
    }
  }, [user]);

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
  }, [user?.id, getRegularNotifications, getSurveyNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (socket && user?.id) {
      socket.on("receive-notification", fetchNotifications);
      socket.on("receive-survey-notification", fetchNotifications);
      socket.on("notification-updated", fetchNotifications);
      socket.on("survey-notification-updated", fetchNotifications);
      socket.on("error", (error) => console.error("Socket error:", error));

      return () => {
        socket.off("receive-notification");
        socket.off("receive-survey-notification");
        socket.off("notification-updated");
        socket.off("survey-notification-updated");
        socket.off("error");
      };
    }
  }, [socket, user?.id, fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    try {
      if (
        notification.type === "Survey-Invitation" ||
        notification.type === "Survey-session_update"
      ) {
        if (!notification.read) {
          await markSurveyAsRead(notification._id);
          socket?.emit("mark-survey-notification-read", {
            notificationId: notification._id,
            userId: user.id,
          });
        }
        if (
          notification.type !== "Survey-session_update" &&
          notification.joinCode
        ) {
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
      closeModal();
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const allNotifications = [
    ...(regularNotifications || []),
    ...(surveyNotifications || []),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unreadCount = allNotifications.filter((n) => !n.read).length;

  const renderNotificationMessage = (notification) => {
    switch (notification.type) {
      case "Survey-Invitation":
        return (
          <div className="text-sm">
            <span className="text-gray-600 font-medium">Survey Invitation</span>
            <div className="text-gray-500 text-sm mt-1">
              <span className="line-clamp-2">{notification.message}</span>
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
              <span className="line-clamp-2">{notification.message}</span>
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
            <span className="text-gray-600 line-clamp-2">
              {notification.message}
            </span>
          </div>
        );
    }
  };

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="cursor-pointer relative"
        onClick={openModal}
        data-testid="notification-bell"
      >
        <FaBell className="text-white hover:text-gray-200 w-6 h-6 sm:w-6 sm:h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <>
          {/* Mobile overlay backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
            onClick={closeModal}
          />

          {/* Notification container */}
          <div className="fixed sm:absolute right-0 sm:right-0 top-0 sm:top-auto mt-0 sm:mt-2 w-full sm:w-80 h-full sm:h-auto bg-white rounded-none sm:rounded-lg shadow-xl z-50 border border-gray-200">
            <div className="sticky top-0 p-3 border-b border-gray-200 bg-white flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Notifications
              </h3>
              <button
                onClick={closeModal}
                className="sm:hidden text-gray-500 hover:text-gray-700 p-2"
                aria-label="Close notifications"
              >
                ✕
              </button>
            </div>

            <div className="h-[calc(100%-4rem)] sm:max-h-96 overflow-y-auto">
              {regularLoading || surveyLoading ? (
                <div className="flex justify-center py-4">
                  <div
                    className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"
                    data-testid="loading-spinner"
                  />
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
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
