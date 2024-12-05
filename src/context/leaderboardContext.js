import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  leaderboardReducer,
  LEADERBOARD_ACTIONS,
  initialState,
} from "../reducers/leaderboardReducer";

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

const LeaderboardContext = createContext();

export const LeaderboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(leaderboardReducer, initialState);

  const getLeaderboard = async (sessionId) => {
    dispatch({ type: LEADERBOARD_ACTIONS.GET_LEADERBOARD_START });
    try {
      const response = await api.get(`/leaderboards/${sessionId}`);
      dispatch({
        type: LEADERBOARD_ACTIONS.GET_LEADERBOARD_SUCCESS,
        payload: response.data.leaderboard,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch leaderboard";
      dispatch({
        type: LEADERBOARD_ACTIONS.GET_LEADERBOARD_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const getUserScore = async (sessionId, userId) => {
    dispatch({ type: LEADERBOARD_ACTIONS.GET_USER_SCORE_START });
    try {
      const response = await api.get(`/leaderboards/${sessionId}/${userId}`);
      console.log(response);
      dispatch({
        type: LEADERBOARD_ACTIONS.GET_USER_SCORE_SUCCESS,
        payload: response.data.user,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch user score";
      dispatch({
        type: LEADERBOARD_ACTIONS.GET_USER_SCORE_FAILURE,
        payload: errorMessage,
      });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: LEADERBOARD_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    getLeaderboard,
    getUserScore,
    clearError,
  };

  return (
    <LeaderboardContext.Provider value={value}>
      {children}
    </LeaderboardContext.Provider>
  );
};

export const useLeaderboardContext = () => {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error(
      "useLeaderboardContext must be used within a LeaderboardProvider"
    );
  }
  return context;
};
