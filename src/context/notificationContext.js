import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications for a user by their userId
  const fetchNotifications = async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/notifications/${userId}`);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add a notification to state
  const addNotification = (notification) => {
    setNotifications((prevNotifications) => [notification, ...prevNotifications]);
  };

  // Update an existing notification in state
  const updateNotification = (updatedNotification) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification._id === updatedNotification._id ? updatedNotification : notification
      )
    );
  };

  // Mark a notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}`);
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        fetchNotifications,
        addNotification,
        updateNotification,
        markNotificationAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
