// userContext.js
import React, { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";
import {
  userReducer,
  USER_ACTIONS,
  initialState,
} from "../reducers/userReducer";

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

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refresh_token");
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refresh_token: refreshToken,
        });

        const { token } = response.data;

        // Update stored token
        localStorage.setItem("token", token);

        // Update the failed request's auth header and retry
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Context
const UserContext = createContext();

// Provider Component
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Verify auth state on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  // Rest of your existing actions but using the enhanced api instance
  const fetchUsers = async () => {
    dispatch({ type: USER_ACTIONS.FETCH_USERS_START });
    try {
      const response = await api.get("/users");
      dispatch({
        type: USER_ACTIONS.FETCH_USERS_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch users";
      dispatch({
        type: USER_ACTIONS.FETCH_USERS_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const fetchUserById = async (userId) => {
    dispatch({ type: USER_ACTIONS.FETCH_USER_START });
    try {
      const response = await api.get(`/users/${userId}`);
      dispatch({
        type: USER_ACTIONS.FETCH_USER_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch user";
      dispatch({
        type: USER_ACTIONS.FETCH_USER_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const updateUser = async (userId, userData) => {
    dispatch({ type: USER_ACTIONS.UPDATE_USER_START });
    try {
      const response = await api.put(`/users/${userId}`, userData);
      dispatch({
        type: USER_ACTIONS.UPDATE_USER_SUCCESS,
        payload: response.data.user,
      });
      return response.data.user;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update user";
      dispatch({
        type: USER_ACTIONS.UPDATE_USER_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const deleteUser = async (userId) => {
    dispatch({ type: USER_ACTIONS.DELETE_USER_START });
    try {
      await api.delete(`/users/${userId}`);
      dispatch({
        type: USER_ACTIONS.DELETE_USER_SUCCESS,
        payload: userId,
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete user";
      dispatch({
        type: USER_ACTIONS.DELETE_USER_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: USER_ACTIONS.CLEAR_ERROR });
  };

  // Value to be provided to consumers
  const value = {
    ...state,
    fetchUsers,
    fetchUserById,
    updateUser,
    deleteUser,
    clearError,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom Hook for using UserContext
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
