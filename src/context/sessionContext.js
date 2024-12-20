// sessionContext.js
import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  sessionReducer,
  SESSION_ACTIONS,
  initialState,
} from "../reducers/sessionReducer";

const BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
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

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const createSession = async (quizId) => {
    dispatch({ type: SESSION_ACTIONS.CREATE_SESSION_START });
    try {
      const response = await api.post(`/sessions/${quizId}/publiz`);
      dispatch({
        type: SESSION_ACTIONS.CREATE_SESSION_SUCCESS,
        payload: {
          ...response.data,
          qrCodeImageUrl: response.data.qrCodeImageUrl,
        },
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

  const joinSession = async (joinCode) => {
    dispatch({ type: SESSION_ACTIONS.JOIN_SESSION_START });
    try {
      const response = await api.post(`/sessions/${joinCode}/join`);
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

  const startSession = async (joinCode, sessionId) => {
    dispatch({ type: SESSION_ACTIONS.START_SESSION_START });
    try {
      const response = await api.post(
        `/sessions/${joinCode}/${sessionId}/start`
      );

      // Ensure we extract and include the order from the session quiz
      const order = response.data.session.quiz.order || [];

      dispatch({
        type: SESSION_ACTIONS.START_SESSION_SUCCESS,
        payload: {
          session: response.data.session,
          questions: response.data.questions,
          slides: response.data.slides,
          order: order, // Include the order in the dispatch
        },
      });

      // Return complete data including the order
      return {
        ...response.data,
        order: order,
      };
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

  const nextQuestion = async (joinCode, sessionId) => {
    dispatch({ type: SESSION_ACTIONS.NEXT_QUESTION_START });
    try {
      const response = await api.post(
        `/sessions/${joinCode}/${sessionId}/next`
      );
      dispatch({
        type: SESSION_ACTIONS.NEXT_QUESTION_SUCCESS,
        payload: {
          type: response.data.type,
          item: response.data.item,
          isLastItem: response.data.isLastItem || false,
        },
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to get next question";
      dispatch({
        type: SESSION_ACTIONS.NEXT_QUESTION_FAILURE,
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
        payload: {
          session: response.data.session,
          reports: response.data.reports,
          activityLogs: response.data.activityLogs,
        },
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
    startSession,
    nextQuestion,
    endSession,
    clearError,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
};
