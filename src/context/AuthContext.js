import React, { createContext, useReducer, useEffect, useContext } from "react";
import axios from "axios";
import Cookies from "js-cookie";
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

  const debugLog = (message, ...args) => {
    console.log(`[AuthContext Debug] ${message}`, ...args);
  };

  const handleSessionExpiry = async () => {
    debugLog("Session expired, logging out user");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    dispatch({ type: ACTIONS.SESSION_EXPIRED });
    await logout();
  };

  const resetSessionState = () => {
    dispatch({ type: ACTIONS.RESET_SESSION_STATE });
  };

  const updateAuthHeader = (token) => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      debugLog("Authorization header updated with token");
    } else {
      delete api.defaults.headers.common["Authorization"];
      debugLog("Authorization header removed");
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const storedToken = localStorage.getItem("token");
        const storedRefreshToken = localStorage.getItem("refresh_token");

        if (storedUser && storedToken && storedRefreshToken) {
          try {
            dispatch({
              type: ACTIONS.LOGIN,
              payload: { user: storedUser, token: storedToken },
            });
            updateAuthHeader(storedToken);
          } catch (error) {
            try {
              const response = await axios.post(
                `${BASE_URL}/auth/refresh-token`,
                { refresh_token: storedRefreshToken },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              const { token: newToken, user: refreshedUser } = response.data;
              localStorage.setItem("token", newToken);
              localStorage.setItem("user", JSON.stringify(refreshedUser));

              dispatch({
                type: ACTIONS.LOGIN,
                payload: {
                  user: refreshedUser,
                  token: newToken,
                },
              });
              updateAuthHeader(newToken);
            } catch (refreshError) {
              await handleSessionExpiry();
            }
          }
        }
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: "Failed to initialize authentication",
        });
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();

    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const storedRefreshToken = localStorage.getItem("refresh_token");
            const response = await axios.post(
              `${BASE_URL}/auth/refresh-token`,
              { refresh_token: storedRefreshToken },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            const { token: refreshedToken, user: refreshedUser } =
              response.data;

            localStorage.setItem("token", refreshedToken);
            localStorage.setItem("user", JSON.stringify(refreshedUser));

            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${refreshedToken}`;
            api.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${refreshedToken}`;

            dispatch({
              type: ACTIONS.LOGIN,
              payload: {
                user: refreshedUser,
                token: refreshedToken,
              },
            });

            return api(originalRequest);
          } catch (refreshError) {
            await handleSessionExpiry();
            return Promise.reject(refreshError);
          }
        }

        if (
          error.response?.status === 401 &&
          (error.response?.data?.message === "Token validation failed." ||
            error.response?.data?.message === "Invalid or expired token." ||
            error.response?.data?.message === "Token has been invalidated.")
        ) {
          await handleSessionExpiry();
        }

        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password, rememberMe) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user, token, refresh_token } = response.data;

      if (rememberMe) {
        Cookies.set("rememberedEmail", email, {
          expires: 30,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      } else {
        Cookies.remove("rememberedEmail");
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.setItem("refresh_token", refresh_token);

      updateAuthHeader(token);
      dispatch({ type: ACTIONS.LOGIN, payload: { user, token } });
      return { user, token };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      debugLog("Logout initiated");
      const token = localStorage.getItem("token");

      if (token) {
        await api.post("/auth/logout", { token });
      }

      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      updateAuthHeader(null);
      dispatch({ type: ACTIONS.LOGOUT });
      debugLog("Logout completed");
    } catch (error) {
      debugLog("Logout request failed", { errorMessage: error.message });
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: "Failed to logout properly",
      });
    }
  };

  const register = async (username, email, mobile, password) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await api.post("/auth/register", {
        username,
        email,
        mobile,
        password,
      });

      const { user, token, refresh_token } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.setItem("refresh_token", refresh_token);

      updateAuthHeader(token);
      dispatch({ type: ACTIONS.REGISTER, payload: { user, token } });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorMessage });
      throw error;
    }
  };

  const getProfile = async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await api.get("/auth/me");
      dispatch({ type: ACTIONS.GET_USER_PROFILE, payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: "Failed to fetch user profile",
      });
      throw error;
    }
  };

  const listUsers = async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await api.get("/auth/users");
      dispatch({ type: ACTIONS.LIST_USERS, payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: "Failed to fetch users list",
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
        getProfile,
        listUsers,
        clearError,
        resetSessionState,
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
