import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  userReducer,
  USER_ACTIONS,
  initialState,
} from "../reducers/userReducer";

// Base URL and API configuration
const BASE_URL = "http://localhost:5000/api";

// Get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// Create axios instance with base URL and headers
const api = axios.create({
  baseURL: BASE_URL,
  headers: getAuthHeaders(),
});

// Context
const UserContext = createContext();

// Provider Component
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Action Creators
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
