// AuthContext.js
import React, { createContext, useReducer, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ACTIONS, authReducer, initialState } from "../reducers/authReducer";

const BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const AuthContext = createContext(initialState);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  const clearAuthData = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    delete api.defaults.headers.common["Authorization"];
    dispatch({ type: ACTIONS.LOGOUT });
    navigate("/login");
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));

        if (token && user) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          dispatch({ type: ACTIONS.LOGIN, payload: { user, token } });
        } else {
          dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Setup axios interceptor for token refresh
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem("refresh_token");
            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            const response = await axios.post(
              `${BASE_URL}/auth/refresh-token`,
              { refresh_token: refreshToken }
            );

            const { token: newToken, user: refreshedUser } = response.data;

            localStorage.setItem("token", newToken);
            localStorage.setItem("user", JSON.stringify(refreshedUser));

            api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

            dispatch({
              type: ACTIONS.LOGIN,
              payload: { user: refreshedUser, token: newToken },
            });

            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            clearAuthData();
            return Promise.reject(refreshError);
          }
        }

        if (error.response?.status === 401) {
          clearAuthData();
        }

        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [navigate]);

  const login = async (email, password) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user, token, refresh_token } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.setItem("refresh_token", refresh_token);

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      dispatch({ type: ACTIONS.LOGIN, payload: { user, token } });
      return response.data;
    } catch (error) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: error.response?.data?.message || "Login failed",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await api.post("/auth/logout", { token });
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      clearAuthData();
    }
  };

  const register = async (userData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await api.post("/auth/register", userData);
      const { user, token, refresh_token } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.setItem("refresh_token", refresh_token);

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      dispatch({ type: ACTIONS.REGISTER, payload: { user, token } });
      return response.data;
    } catch (error) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: error.response?.data?.message || "Registration failed",
      });
      throw error;
    }
  };


  const clearError = () => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
