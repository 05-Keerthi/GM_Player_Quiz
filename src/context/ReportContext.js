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
  const [reports, setReports] = useState([]); // Local useState for reports

  // Context Actions
  const actions = {
    // Get all reports (admin only)
    getAllReports: async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.get('/reports');
        setReports(data.data); // Update useState reports
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

    // Get reports for current user
    getUserReportByQuiz: async (userId) => {  // Added parameters
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.get(`/reports/${userId}`);
        setReports(data.data); // Update useState reports
        dispatch({ type: ACTIONS.SET_REPORTS, payload: data.data });
        return data.data;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to fetch user reports",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    // Get reports for a specific quiz
    getReportsByQuiz: async (quizId) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.get(`/reports/${quizId}`);
        setReports(data.data); // Update useState reports
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

    // Get user's report for a specific quiz
    getUserReportByQuiz: async (quizId, userId) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.get(`/reports/${quizId}/user/${userId}`);
        setReports((prev) => [...prev, data.data]); // Add to existing reports
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

    // Create a new report
    createReport: async (reportData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.post('/reports', reportData);
        setReports((prev) => [...prev, data.data]);
        dispatch({ type: ACTIONS.SET_CURRENT_REPORT, payload: data.data });
        return data.data;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to create report",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    // Clear error
    clearError: () => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    },

    // Clear reports
    clearReports: () => {
      setReports([]);
      dispatch({ type: ACTIONS.CLEAR_REPORTS });
    },
  };

  const contextValue = {
    state,
    reports, // Expose the useState reports
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

// Hook for using the context
export const useReportContext = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error("useReportContext must be used within a ReportProvider");
  }
  return context;
};

export default ReportContext;