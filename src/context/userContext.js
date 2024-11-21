import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import { userReducer } from "../reducers/userReducer";

// Initial State
const initialState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
};

// Action Types
const USER_ACTIONS = {
  FETCH_USERS_START: "FETCH_USERS_START",
  FETCH_USERS_SUCCESS: "FETCH_USERS_SUCCESS",
  FETCH_USERS_FAILURE: "FETCH_USERS_FAILURE",

  FETCH_USER_START: "FETCH_USER_START",
  FETCH_USER_SUCCESS: "FETCH_USER_SUCCESS",
  FETCH_USER_FAILURE: "FETCH_USER_FAILURE",

  UPDATE_USER_START: "UPDATE_USER_START",
  UPDATE_USER_SUCCESS: "UPDATE_USER_SUCCESS",
  UPDATE_USER_FAILURE: "UPDATE_USER_FAILURE",

  DELETE_USER_START: "DELETE_USER_START",
  DELETE_USER_SUCCESS: "DELETE_USER_SUCCESS",
  DELETE_USER_FAILURE: "DELETE_USER_FAILURE",

  CLEAR_ERROR: "CLEAR_ERROR",
};

// Context
const UserContext = createContext();

// Provider Component
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Action Creators
  const fetchUsers = async () => {
    dispatch({ type: USER_ACTIONS.FETCH_USERS_START });
    try {
      const response = await axios.get("http://localhost:5000/api/users");
      dispatch({
        type: USER_ACTIONS.FETCH_USERS_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      dispatch({
        type: USER_ACTIONS.FETCH_USERS_FAILURE,
        payload: error.response?.data?.message || "Failed to fetch users",
      });
    }
  };

  const fetchUserById = async (userId) => {
    dispatch({ type: USER_ACTIONS.FETCH_USER_START });
    try {
      const response = await axios.get(
        `http://localhost:5000/api/users/${userId}`
      );
      dispatch({
        type: USER_ACTIONS.FETCH_USER_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      dispatch({
        type: USER_ACTIONS.FETCH_USER_FAILURE,
        payload: error.response?.data?.message || "Failed to fetch user",
      });
    }
  };

  const updateUser = async (userId, userData) => {
    dispatch({ type: USER_ACTIONS.UPDATE_USER_START });
    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${userId}`,
        userData
      );
      dispatch({
        type: USER_ACTIONS.UPDATE_USER_SUCCESS,
        payload: response.data.user,
      });
      return response.data.user;
    } catch (error) {
      dispatch({
        type: USER_ACTIONS.UPDATE_USER_FAILURE,
        payload: error.response?.data?.message || "Failed to update user",
      });
      throw error;
    }
  };

  const deleteUser = async (userId) => {
    dispatch({ type: USER_ACTIONS.DELETE_USER_START });
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`);
      dispatch({
        type: USER_ACTIONS.DELETE_USER_SUCCESS,
        payload: userId,
      });
    } catch (error) {
      dispatch({
        type: USER_ACTIONS.DELETE_USER_FAILURE,
        payload: error.response?.data?.message || "Failed to delete user",
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
