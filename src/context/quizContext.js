// quizContext.js
import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import { initialState, ACTIONS, quizReducer } from "../reducers/quizReducer";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
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

export const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const actions = {
    createQuiz: async (quizData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        // Ensure order array is properly structured if provided
        const processedQuizData = {
          ...quizData,
          order:
            quizData.order?.map((item) => ({
              id: item.id,
              type: item.type, // 'question' or 'slide'
            })) || [],
        };

        const { data: newQuiz } = await api.post("/quizzes", processedQuizData);
        dispatch({ type: ACTIONS.ADD_QUIZ, payload: newQuiz });
        return newQuiz;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to create quiz",
          errors: error.response?.data?.errors || [],
        };
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorPayload });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    updateQuiz: async (id, quizData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        // Process order array if it exists in the update data
        const processedQuizData = {
          ...quizData,
          order:
            quizData.order?.map((item) => ({
              id: item.id,
              type: item.type,
            })) || quizData.order,
        };

        const { data: updatedQuiz } = await api.put(
          `/quizzes/${id}`,
          processedQuizData
        );
        dispatch({ type: ACTIONS.UPDATE_QUIZ, payload: updatedQuiz });
        return updatedQuiz;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to update quiz",
          errors: error.response?.data?.errors || [],
        };
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorPayload });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    deleteQuiz: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        await api.delete(`/quizzes/${id}`);
        dispatch({ type: ACTIONS.DELETE_QUIZ, payload: id });
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to delete quiz",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    getAllQuizzes: async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: quizzes } = await api.get("/quizzes");
        dispatch({ type: ACTIONS.SET_QUIZZES, payload: quizzes });
        return quizzes;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to fetch quizzes",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    getQuizById: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: quiz } = await api.get(`/quizzes/${id}`);
        dispatch({ type: ACTIONS.SET_CURRENT_QUIZ, payload: quiz });
        return quiz;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to fetch quiz",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    publishQuiz: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: quiz } = await api.post(`/quizzes/${id}/publish`);
        dispatch({ type: ACTIONS.UPDATE_QUIZ, payload: quiz });
        return quiz;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to publish quiz",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    closeQuiz: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: quiz } = await api.post(`/quizzes/${id}/close`);
        dispatch({ type: ACTIONS.UPDATE_QUIZ, payload: quiz });
        return quiz;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to close quiz",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    clearError: () => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    },
  };

  const contextValue = {
    state,
    quizzes: state.quizzes,
    currentQuiz: state.currentQuiz,
    loading: state.loading,
    error: state.error,
    ...actions,
  };

  return (
    <QuizContext.Provider value={contextValue}>{children}</QuizContext.Provider>
  );
};

export const useQuizContext = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error("useQuizContext must be used within a QuizProvider");
  }
  return context;
};
