// questionContext.js
import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  initialState,
  QUESTION_ACTIONS,
  questionReducer,
} from "../reducers/questionReducer";

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
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

export const QuestionContext = createContext();

export const QuestionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(questionReducer, initialState);

  const uploadImage = async (imageFile) => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("media", imageFile);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/media/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data || !response.data.media || !response.data.media[0]) {
        throw new Error("Invalid image upload response");
      }

      return response.data.media[0]._id;
    } catch (error) {
      console.error("Image upload error:", error);
      throw new Error("Failed to upload image");
    }
  };

  const actions = {
   createQuestion: async (surveyId, questionData) => {
      dispatch({ type: QUESTION_ACTIONS.CREATE_QUESTION_START });
      try {
        const { data } = await api.post(
          `/${surveyId}/create-survey-question`,
          questionData
        );
        
        // Make sure we return the question data consistently
        const newQuestion = data.data || data;
        
        dispatch({
          type: QUESTION_ACTIONS.CREATE_QUESTION_SUCCESS,
          payload: newQuestion,
        });
        return newQuestion;
      } catch (error) {
        dispatch({
          type: QUESTION_ACTIONS.CREATE_QUESTION_FAILURE,
          payload: error.response?.data?.message || "Failed to create question",
        });
        throw error;
      }
    },

    updateQuestion: async (surveyId, questionId, questionData) => {
      dispatch({ type: QUESTION_ACTIONS.UPDATE_QUESTION_START });
      try {
        const { data } = await api.put(
          `/${surveyId}/survey-question/${questionId}`,
          questionData
        );
        
        // Make sure we return the data consistently
        const updatedQuestion = data.data || data;
        
        dispatch({
          type: QUESTION_ACTIONS.UPDATE_QUESTION_SUCCESS,
          payload: updatedQuestion,
        });
        return updatedQuestion;
      } catch (error) {
        dispatch({
          type: QUESTION_ACTIONS.UPDATE_QUESTION_FAILURE,
          payload: error.response?.data?.message || "Failed to update question",
        });
        throw error;
      }
    },

    deleteQuestion: async (surveyId, questionId) => {
      dispatch({ type: QUESTION_ACTIONS.DELETE_QUESTION_START });
      try {
        await api.delete(`/${surveyId}/survey-question/${questionId}`);
        dispatch({
          type: QUESTION_ACTIONS.DELETE_QUESTION_SUCCESS,
          payload: questionId,
        });
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to delete question",
          errors: error.response?.data?.errors || [],
        };
        dispatch({
          type: QUESTION_ACTIONS.DELETE_QUESTION_FAILURE,
          payload: errorPayload,
        });
        throw error;
      }
    },

    getAllQuestions: async (surveyId) => {
      dispatch({ type: QUESTION_ACTIONS.FETCH_QUESTIONS_START });
      try {
        const { data } = await api.get(`/${surveyId}/survey-question`);
        const questions = data?.data || [];
        dispatch({
          type: QUESTION_ACTIONS.FETCH_QUESTIONS_SUCCESS,
          payload: questions,
        });
        return questions;
      } catch (error) {
        if (error.response?.status === 404) {
          dispatch({
            type: QUESTION_ACTIONS.FETCH_QUESTIONS_SUCCESS,
            payload: [],
          });
          return [];
        }
        const errorPayload = {
          message: error.response?.data?.message || "Failed to fetch questions",
          errors: error.response?.data?.errors || [],
        };
        dispatch({
          type: QUESTION_ACTIONS.FETCH_QUESTIONS_FAILURE,
          payload: errorPayload,
        });
        throw error;
      }
    },

    getQuestionById: async (surveyId, questionId) => {
      dispatch({ type: QUESTION_ACTIONS.FETCH_QUESTION_START });
      try {
        const { data } = await api.get(
          `/${surveyId}/survey-question/${questionId}`
        );
        const question = data.data || data;
        dispatch({
          type: QUESTION_ACTIONS.FETCH_QUESTION_SUCCESS,
          payload: question,
        });
        return question;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to fetch question",
          errors: error.response?.data?.errors || [],
        };
        dispatch({
          type: QUESTION_ACTIONS.FETCH_QUESTION_FAILURE,
          payload: errorPayload,
        });
        throw error;
      }
    },

    clearError: () => {
      dispatch({ type: QUESTION_ACTIONS.CLEAR_ERROR });
    },
  };

  const contextValue = {
    state,
    questions: state.questions,
    currentQuestion: state.currentQuestion,
    loading: state.loading,
    error: state.error,
    ...actions,
  };

  return (
    <QuestionContext.Provider value={contextValue}>
      {children}
    </QuestionContext.Provider>
  );
};

export const useQuestionContext = () => {
  const context = useContext(QuestionContext);
  if (!context) {
    throw new Error("useQuestionContext must be used within a QuestionProvider");
  }
  return context;
};