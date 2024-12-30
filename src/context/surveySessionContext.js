// surveySessionContext.js
import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  surveySessionReducer,
  SURVEY_SESSION_ACTIONS,
  initialState,
} from "../reducers/surveySessionReducer";

const BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

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

const SurveySessionContext = createContext();

export const SurveySessionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(surveySessionReducer, initialState);

  const createSurveySession = async (surveyQuizId) => {
    dispatch({ type: SURVEY_SESSION_ACTIONS.CREATE_SURVEY_SESSION_START });
    try {
      const response = await api.post(
        `/survey-sessions/${surveyQuizId}/create`
      );
      dispatch({
        type: SURVEY_SESSION_ACTIONS.CREATE_SURVEY_SESSION_SUCCESS,
        payload: {
          ...response.data,
          surveyQrCodeImageUrl: response.data.surveyQrCodeImageUrl,
        },
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to create survey session";
      dispatch({
        type: SURVEY_SESSION_ACTIONS.CREATE_SURVEY_SESSION_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const joinSurveySession = async (joinCode) => {
    dispatch({ type: SURVEY_SESSION_ACTIONS.JOIN_SURVEY_SESSION_START });
    try {
      const response = await api.post(`/survey-sessions/${joinCode}/join`);
      dispatch({
        type: SURVEY_SESSION_ACTIONS.JOIN_SURVEY_SESSION_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to join survey session";
      dispatch({
        type: SURVEY_SESSION_ACTIONS.JOIN_SURVEY_SESSION_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const startSurveySession = async (joinCode, sessionId) => {
    dispatch({ type: SURVEY_SESSION_ACTIONS.START_SURVEY_SESSION_START });
    try {
      const response = await api.post(
        `/survey-sessions/${joinCode}/${sessionId}/start`
      );
      dispatch({
        type: SURVEY_SESSION_ACTIONS.START_SURVEY_SESSION_SUCCESS,
        payload: {
          session: response.data.session,
          questions: response.data.questions,
        },
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to start survey session";
      dispatch({
        type: SURVEY_SESSION_ACTIONS.START_SURVEY_SESSION_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const nextSurveyQuestion = async (joinCode, sessionId) => {
    dispatch({ type: SURVEY_SESSION_ACTIONS.NEXT_SURVEY_QUESTION_START });
    try {
      const response = await api.post(
        `/survey-sessions/${joinCode}/${sessionId}/next`
      );
      dispatch({
        type: SURVEY_SESSION_ACTIONS.NEXT_SURVEY_QUESTION_SUCCESS,
        payload: {
          question: response.data.question,
        },
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to get next survey question";
      dispatch({
        type: SURVEY_SESSION_ACTIONS.NEXT_SURVEY_QUESTION_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const endSurveySession = async (joinCode, sessionId) => {
    dispatch({ type: SURVEY_SESSION_ACTIONS.END_SURVEY_SESSION_START });
    try {
      const response = await api.post(
        `/survey-sessions/${joinCode}/${sessionId}/end`
      );
      dispatch({
        type: SURVEY_SESSION_ACTIONS.END_SURVEY_SESSION_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to end survey session";
      dispatch({
        type: SURVEY_SESSION_ACTIONS.END_SURVEY_SESSION_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: SURVEY_SESSION_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    createSurveySession,
    joinSurveySession,
    startSurveySession,
    nextSurveyQuestion,
    endSurveySession,
    clearError,
  };

  return (
    <SurveySessionContext.Provider value={value}>
      {children}
    </SurveySessionContext.Provider>
  );
};

export const useSurveySessionContext = () => {
  const context = useContext(SurveySessionContext);
  if (!context) {
    throw new Error(
      "useSurveySessionContext must be used within a SurveySessionProvider"
    );
  }
  return context;
};
