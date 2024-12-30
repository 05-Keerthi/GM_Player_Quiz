import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  surveyAnswerReducer,
  initialState,
  SURVEY_ANSWER_ACTIONS,
} from "../reducers/surveyAnswerReducer";

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

const SurveyAnswerContext = createContext();

export const SurveyAnswerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(surveyAnswerReducer, initialState);

  const submitSurveyAnswer = async (sessionId, questionId, answerData) => {
    dispatch({ type: SURVEY_ANSWER_ACTIONS.SUBMIT_ANSWER_START });
    try {
      const response = await api.post(
        `/survey-submit-answer/${sessionId}/${questionId}`,
        answerData
      );
      dispatch({
        type: SURVEY_ANSWER_ACTIONS.SUBMIT_ANSWER_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to submit survey answer";
      dispatch({
        type: SURVEY_ANSWER_ACTIONS.SUBMIT_ANSWER_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const getSessionAnswers = async (sessionId) => {
    dispatch({ type: SURVEY_ANSWER_ACTIONS.GET_SESSION_ANSWERS_START });
    try {
      const response = await api.get(`/survey-answers/${sessionId}`);
      dispatch({
        type: SURVEY_ANSWER_ACTIONS.GET_SESSION_ANSWERS_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to get session answers";
      dispatch({
        type: SURVEY_ANSWER_ACTIONS.GET_SESSION_ANSWERS_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const getQuestionAnswers = async (sessionId, questionId) => {
    dispatch({ type: SURVEY_ANSWER_ACTIONS.GET_QUESTION_ANSWERS_START });
    try {
      const response = await api.get(
        `/survey-answers/${sessionId}/${questionId}`
      );
      dispatch({
        type: SURVEY_ANSWER_ACTIONS.GET_QUESTION_ANSWERS_SUCCESS,
        payload: response.data,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to get question answers";
      dispatch({
        type: SURVEY_ANSWER_ACTIONS.GET_QUESTION_ANSWERS_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: SURVEY_ANSWER_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    loading: state.loading,
    error: state.error,
    sessionAnswers: state.sessionAnswers,
    questionAnswers: state.questionAnswers,
    lastSubmittedAnswer: state.lastSubmittedAnswer,
    submitSurveyAnswer,
    getSessionAnswers,
    getQuestionAnswers,
    clearError,
  };

  return (
    <SurveyAnswerContext.Provider value={value}>
      {children}
    </SurveyAnswerContext.Provider>
  );
};

export const useSurveyAnswerContext = () => {
  const context = useContext(SurveyAnswerContext);
  if (!context) {
    throw new Error(
      "useSurveyAnswerContext must be used within a SurveyAnswerProvider"
    );
  }
  return context;
};
