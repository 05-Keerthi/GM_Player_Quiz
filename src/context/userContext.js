import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  userReducer,
  initialState,
  USER_ACTIONS,
} from "../reducers/userReducer";

const BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  const fetchUsers = async () => {
    dispatch({ type: USER_ACTIONS.FETCH_USERS_START });
    try {
      const response = await api.get("/users");
      dispatch({
        type: USER_ACTIONS.FETCH_USERS_SUCCESS,
        payload: response.data,
      });
      return response.data;
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
      return response.data;
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

  const changePassword = async (oldPassword, newPassword) => {
    dispatch({ type: USER_ACTIONS.CHANGE_PASSWORD_START });
    try {
      const response = await api.post("/change-password", {
        oldPassword,
        newPassword,
      });
      dispatch({
        type: USER_ACTIONS.CHANGE_PASSWORD_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to change password";
      dispatch({
        type: USER_ACTIONS.CHANGE_PASSWORD_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: USER_ACTIONS.CLEAR_ERROR });
  };

  const clearCurrentUser = () => {
    dispatch({ type: USER_ACTIONS.CLEAR_CURRENT_USER });
  };

  const resetState = () => {
    dispatch({ type: USER_ACTIONS.RESET_STATE });
  };

  const value = {
    ...state,
    fetchUsers,
    fetchUserById,
    updateUser,
    deleteUser,
    changePassword,
    clearError,
    clearCurrentUser,
    resetState,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
