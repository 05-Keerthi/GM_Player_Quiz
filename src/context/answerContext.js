import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  answerReducer,
  ANSWER_ACTIONS,
  initialState,
} from "../reducers/answerReducer";

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

const AnswerContext = createContext();

export const AnswerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(answerReducer, initialState);

  const submitAnswer = async (sessionId, questionId, answerData) => {
    dispatch({ type: ANSWER_ACTIONS.SUBMIT_ANSWER_START });
    try {
      const response = await api.post(
        `/sessions/${sessionId}/questions/${questionId}/answer`,
        answerData
      );
      dispatch({
        type: ANSWER_ACTIONS.SUBMIT_ANSWER_SUCCESS,
        payload: response.data.answer,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to submit answer";
      dispatch({
        type: ANSWER_ACTIONS.SUBMIT_ANSWER_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const getSessionAnswers = async (sessionId) => {
    dispatch({ type: ANSWER_ACTIONS.GET_SESSION_ANSWERS_START });
    try {
      const response = await api.get(`/sessions/${sessionId}/answers`);
      dispatch({
        type: ANSWER_ACTIONS.GET_SESSION_ANSWERS_SUCCESS,
        payload: response.data.result,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch session answers";
      dispatch({
        type: ANSWER_ACTIONS.GET_SESSION_ANSWERS_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const getQuestionAnswers = async (sessionId, questionId) => {
    dispatch({ type: ANSWER_ACTIONS.GET_QUESTION_ANSWERS_START });
    try {
      const response = await api.get(
        `/sessions/${sessionId}/questions/${questionId}/answers`
      );
      dispatch({
        type: ANSWER_ACTIONS.GET_QUESTION_ANSWERS_SUCCESS,
        payload: response.data.answers,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch question answers";
      dispatch({
        type: ANSWER_ACTIONS.GET_QUESTION_ANSWERS_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };


  const clearError = () => {
    dispatch({ type: ANSWER_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    submitAnswer,
    getSessionAnswers,
    getQuestionAnswers,
    clearError,
  };

  return (
    <AnswerContext.Provider value={value}>{children}</AnswerContext.Provider>
  );
};

export const useAnswerContext = () => {
  const context = useContext(AnswerContext);
  if (!context) {
    throw new Error("useAnswerContext must be used within an AnswerProvider");
  }
  return context;
};
