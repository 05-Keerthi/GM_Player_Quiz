// sessionContext.js
import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  sessionReducer,
  SESSION_ACTIONS,
  initialState,
} from "../reducers/sessionReducer";

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

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const createSession = async (quizId) => {
    dispatch({ type: SESSION_ACTIONS.CREATE_SESSION_START });
    try {
      const response = await api.post(`/sessions/${quizId}/publiz`);
      console.log("Create Session", response.data);
      dispatch({
        type: SESSION_ACTIONS.CREATE_SESSION_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to create session";
      dispatch({
        type: SESSION_ACTIONS.CREATE_SESSION_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const joinSession = async (joinCode, sessionId) => {
    dispatch({ type: SESSION_ACTIONS.JOIN_SESSION_START });
    try {
      const response = await api.post(
        `/sessions/${joinCode}/${sessionId}/join`
      );
      dispatch({
        type: SESSION_ACTIONS.JOIN_SESSION_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to join session";
      dispatch({
        type: SESSION_ACTIONS.JOIN_SESSION_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const getSessionPlayers = async (joinCode, sessionId) => {
    dispatch({ type: SESSION_ACTIONS.GET_PLAYERS_START });
    try {
      const response = await api.get(
        `/sessions/${joinCode}/${sessionId}/players`
      );
      dispatch({
        type: SESSION_ACTIONS.GET_PLAYERS_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch players";
      dispatch({
        type: SESSION_ACTIONS.GET_PLAYERS_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const startSession = async (joinCode, sessionId) => {
    dispatch({ type: SESSION_ACTIONS.START_SESSION_START });
    try {
      const response = await api.post(
        `/sessions/${joinCode}/${sessionId}/start`
      );
      dispatch({
        type: SESSION_ACTIONS.START_SESSION_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to start session";
      dispatch({
        type: SESSION_ACTIONS.START_SESSION_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const getSessionQuestions = async (joinCode, sessionId) => {
    dispatch({ type: SESSION_ACTIONS.GET_QUESTIONS_START });
    try {
      const response = await api.get(
        `/sessions/${joinCode}/${sessionId}/questions`
      );
      dispatch({
        type: SESSION_ACTIONS.GET_QUESTIONS_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch questions";
      dispatch({
        type: SESSION_ACTIONS.GET_QUESTIONS_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const endSession = async (joinCode, sessionId) => {
    dispatch({ type: SESSION_ACTIONS.END_SESSION_START });
    try {
      const response = await api.post(`/sessions/${joinCode}/${sessionId}/end`);
      dispatch({
        type: SESSION_ACTIONS.END_SESSION_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to end session";
      dispatch({
        type: SESSION_ACTIONS.END_SESSION_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: SESSION_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    createSession,
    joinSession,
    getSessionPlayers,
    startSession,
    getSessionQuestions,
    endSession,
    clearError,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

// Custom Hook for using SessionContext
export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
};
