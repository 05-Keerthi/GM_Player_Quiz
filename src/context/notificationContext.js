import React, { createContext, useReducer, useContext } from 'react';
import notificationReducer from '../reducers/notificationReducer';
import axios from 'axios';

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
  const fetchNotifications = async () => {
    dispatch({ type: 'FETCH_NOTIFICATIONS_REQUEST' });
    try {
      const response = await axios.get('/api/notifications');
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
  const markNotificationAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}`);
      dispatch({
        type: 'MARK_AS_READ',
        payload: id,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Delete a notification (admin only)
  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      dispatch({
        type: 'DELETE_NOTIFICATION',
        payload: id,
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
