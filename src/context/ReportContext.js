import React, { createContext, useContext, useReducer, useState } from "react";
import axios from "axios";
import { initialState, ACTIONS, reportReducer } from "../reducers/ReportReducer";

// Configure Axios
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

// Create Report Context
export const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reportReducer, initialState);
  const [reports, setReports] = useState([]);

  // Context Actions
  const actions = {
    clearError: () => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    },

    getAllReports: async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.get('/reports');
        setReports(data.data);
        dispatch({ type: ACTIONS.SET_REPORTS, payload: data.data });
        return data.data;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to fetch reports",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    getReportByQuiz: async (quizId) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.get(`/reports/${quizId}`);
        setReports(data.data);
        dispatch({ type: ACTIONS.SET_REPORTS, payload: data.data });
        return data.data;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to fetch quiz reports",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    getUserReportByQuiz: async (quizId, userId) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.get(`/reports/${quizId}/user/${userId}`);
        dispatch({ type: ACTIONS.SET_CURRENT_REPORT, payload: data.data });
        return data.data;
      } catch (error) {
        if (error.response?.status === 404) {
          dispatch({
            type: ACTIONS.SET_ERROR,
            payload: {
              message: "Report not found",
            },
          });
          return null;
        }
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to fetch user report",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },
  };

  const contextValue = {
    state,
    reports,
    currentReport: state.currentReport,
    loading: state.loading,
    error: state.error,
    ...actions,
  };

  return (
    <ReportContext.Provider value={contextValue}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReportContext = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error("useReportContext must be used within a ReportProvider");
  }
  return context;
};

export default ReportContext;