import React, { createContext, useReducer, useContext } from 'react';
import axios from 'axios';
import notificationReducer from '../reducers/notificationReducer'; // Your reducer file

const BASE_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to always get fresh token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create Notification Context
const NotificationContext = createContext();

// Initial State
const initialState = {
  notifications: [],
  loading: false,
  error: null,
};

// Context Provider Component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Fetch all notifications
  const fetchNotifications = async (userId) => {
    dispatch({ type: 'FETCH_NOTIFICATIONS_REQUEST' });
    try {
      const response = await api.get(`/notifications/${userId}`);
      dispatch({
        type: 'FETCH_NOTIFICATIONS_SUCCESS',
        payload: response.data.notifications,
      });
    } catch (error) {
      dispatch({
        type: 'FETCH_NOTIFICATIONS_FAILURE',
        payload: error.response?.data?.message || 'Failed to fetch notifications',
      });
    }
  };

  // Mark a notification as read
  const markNotificationAsRead = async (userId) => {
    try {
      await api.put(`/notifications/${userId}`);
      dispatch({
        type: 'MARK_AS_READ',
        payload:userId,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Delete a notification (admin only)
  const deleteNotification = async (userId) => {
    try {
      await api.delete(`/notifications/${userId}`);
      dispatch({
        type: 'DELETE_NOTIFICATION',
        payload: userId,
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        ...state,
        fetchNotifications,
        markNotificationAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use Notification Context
export const useNotificationContext = () => useContext(NotificationContext);