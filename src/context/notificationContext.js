// // notificationContext.js
// import React, { createContext, useContext, useReducer } from "react";
// import axios from "axios";
// import { initialState, ACTIONS, notificationReducer } from "../reducers/notificationReducer";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export const NotificationContext = createContext();

// export const NotificationProvider = ({ children }) => {
//   const [state, dispatch] = useReducer(notificationReducer, initialState);

//   const actions = {
//     getNotificationsByUserId: async (userId) => {
//       dispatch({ type: ACTIONS.SET_LOADING, payload: true });
//       try {
//         const { data } = await api.get(`/notifications/${userId}`);
//         dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: data.notifications });
//         return data.notifications;
//       } catch (error) {
//         dispatch({
//           type: ACTIONS.SET_ERROR,
//           payload: {
//             message: error.response?.data?.message || "Failed to fetch notifications",
//           },
//         });
//         throw error;
//       } finally {
//         dispatch({ type: ACTIONS.SET_LOADING, payload: false });
//       }
//     },

//     createNotification: async (notificationData) => {
//       dispatch({ type: ACTIONS.SET_LOADING, payload: true });
//       try {
//         const { data: newNotification } = await api.post("/notifications", notificationData);
//         dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: newNotification });
//         return newNotification;
//       } catch (error) {
//         const errorPayload = {
//           message: error.response?.data?.message || "Failed to create notification",
//           errors: error.response?.data?.errors || [],
//         };
//         dispatch({ type: ACTIONS.SET_ERROR, payload: errorPayload });
//         throw error;
//       } finally {
//         dispatch({ type: ACTIONS.SET_LOADING, payload: false });
//       }
//     },

//     markAsRead: async (id) => {
//       dispatch({ type: ACTIONS.SET_LOADING, payload: true });
//       try {
//         const { data: updatedNotification } = await api.put(`/notifications/${id}`);
//         dispatch({ type: ACTIONS.UPDATE_NOTIFICATION, payload: updatedNotification });
//         return updatedNotification;
//       } catch (error) {
//         dispatch({
//           type: ACTIONS.SET_ERROR,
//           payload: {
//             message: error.response?.data?.message || "Failed to mark notification as read",
//           },
//         });
//         throw error;
//       } finally {
//         dispatch({ type: ACTIONS.SET_LOADING, payload: false });
//       }
//     },

//     deleteNotification: async (id) => {
//       dispatch({ type: ACTIONS.SET_LOADING, payload: true });
//       try {
//         await api.delete(`/notifications/${id}`);
//         dispatch({ type: ACTIONS.DELETE_NOTIFICATION, payload: id });
//       } catch (error) {
//         dispatch({
//           type: ACTIONS.SET_ERROR,
//           payload: {
//             message: error.response?.data?.message || "Failed to delete notification",
//           },
//         });
//         throw error;
//       } finally {
//         dispatch({ type: ACTIONS.SET_LOADING, payload: false });
//       }
//     },

//     clearError: () => {
//       dispatch({ type: ACTIONS.SET_ERROR, payload: null });
//     },
//   };

//   const contextValue = {
//     state,
//     notifications: state.notifications,
//     currentNotification: state.currentNotification,
//     loading: state.loading,
//     error: state.error,
//     ...actions,
//   };

//   return (
//     <NotificationContext.Provider value={contextValue}>
//       {children}
//     </NotificationContext.Provider>
//   );
// };

// export const useNotificationContext = () => {
//   const context = useContext(NotificationContext);
//   if (!context) {
//     throw new Error("useNotificationContext must be used within a NotificationProvider");
//   }
//   return context;
// };
import React, { createContext, useContext, useReducer, useState } from "react";
import axios from "axios";
import { initialState, ACTIONS, notificationReducer } from "../reducers/notificationReducer";

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

// Create Notification Context
export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const [notifications, setNotifications] = useState([]); // Local useState for notifications

  // Context Actions
  const actions = {
    // Fetch notifications
    getNotificationsByUserId: async (userId) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.get(`/notifications/${userId}`);
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

    // Create notification
    createNotification: async (notificationData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: newNotification } = await api.post("/notifications", notificationData);
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

    // Mark notification as read
    markAsRead: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: updatedNotification } = await api.put(`/notifications/${id}`);
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

    // Delete notification
    deleteNotification: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        await api.delete(`/notifications/${id}`);
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
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook for using the context
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
};
