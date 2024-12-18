import React, { createContext, useContext, useReducer, useState } from "react";
import axios from "axios";
import { initialState, ACTIONS, surveyNotificationReducer } from "../reducers/surveyNotificationReducer";

// Configure Axios
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create Survey Notification Context
export const SurveyNotificationContext = createContext();

export const SurveyNotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(surveyNotificationReducer, initialState);
  const [notifications, setNotifications] = useState([]); // Local useState for notifications

  // Context Actions
  const actions = {
    // Fetch notifications by userId
    getNotificationsByUserId: async (userId) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.get(`/survey-notifications/${userId}`);
        setNotifications(data.notifications); // Update useState notifications
        dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: data.notifications });
        return data.notifications;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to fetch notifications",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    // Create a new survey notification
    createNotification: async (notificationData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: newNotification } = await api.post("/survey-notifications", notificationData);
        setNotifications((prev) => [...prev, newNotification]); // Update useState notifications
        dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: newNotification });
        return newNotification;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to create notification",
          errors: error.response?.data?.errors || [],
        };
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorPayload });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    // Mark a notification as read
    markAsRead: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: updatedNotification } = await api.put(`/survey-notifications/${id}`);
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? updatedNotification : notification
          )
        ); // Update useState notifications
        dispatch({ type: ACTIONS.UPDATE_NOTIFICATION, payload: updatedNotification });
        return updatedNotification;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to mark notification as read",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    // Delete a survey notification
    deleteNotification: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        await api.delete(`/survey-notifications/${id}`);
        setNotifications((prev) => prev.filter((notification) => notification.id !== id)); // Update useState notifications
        dispatch({ type: ACTIONS.DELETE_NOTIFICATION, payload: id });
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to delete notification",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    // Clear error
    clearError: () => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    },
  };

  const contextValue = {
    state,
    notifications, // Expose the useState notifications
    currentNotification: state.currentNotification,
    loading: state.loading,
    error: state.error,
    ...actions,
  };

  return (
    <SurveyNotificationContext.Provider value={contextValue}>
      {children}
    </SurveyNotificationContext.Provider>
  );
};

// Hook for using the context
export const useSurveyNotificationContext = () => {
  const context = useContext(SurveyNotificationContext);
  if (!context) {
    throw new Error("useSurveyNotificationContext must be used within a SurveyNotificationProvider");
  }
  return context;
};
