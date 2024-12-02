import React, {
  createContext,
  useReducer,
  useEffect,
  useState,
  useContext,
} from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { ACTIONS, authReducer, initialState } from "../reducers/authReducer";

const BASE_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const AuthContext = createContext(initialState);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [loading, setLoading] = useState(true);

  // Debug logging function
  const debugLog = (message, ...args) => {
    console.log(`[AuthContext Debug] ${message}`, ...args);
  };

  // Handle session expiry
  const handleSessionExpiry = async () => {
    debugLog("Session expired, logging out user");
    dispatch({ type: ACTIONS.SESSION_EXPIRED });
    await logout();
  };

  // Reset session expired state
  const resetSessionState = () => {
    dispatch({ type: ACTIONS.RESET_SESSION_STATE });
  };

  // Update axios authorization header
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
          // If token validation fails, attempt to refresh
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

            // Update local storage
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
            // If refresh fails, trigger session expiry
            await handleSessionExpiry();
          }
        }
      }
      setLoading(false);
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
            // If refresh fails, trigger session expiry
            await handleSessionExpiry();
            return Promise.reject(refreshError);
          }
        }

        // Check for specific token expiration error messages
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
    } catch (error) {
      const errorResponse = error.response?.data;
      throw new Error(
        JSON.stringify({
          email:
            errorResponse?.message === "Invalid Email."
              ? "Email does not exist"
              : null,
          password:
            errorResponse?.message === "Invalid Password."
              ? "Enter valid password"
              : null,
          general: errorResponse?.message || "An error occurred",
        })
      );
    }
  };

  const logout = async () => {
    try {
      debugLog("Logout initiated");
      const token = localStorage.getItem("token");

      if (token) {
        await api.post("/auth/logout", { token });
      }
    } catch (error) {
      debugLog("Logout request failed", { errorMessage: error.message });
    } finally {
      // Clear all auth-related data
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");

      // Remove auth header
      updateAuthHeader(null);

      // Dispatch logout action
      dispatch({ type: ACTIONS.LOGOUT });
      debugLog("Logout completed");
    }
  };

  const register = async (username, email, mobile, password) => {
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
      const errorResponse = error.response?.data;
      throw {
        field: errorResponse?.field || "general",
        message:
          errorResponse?.message ||
          "An error occurred. Please try again later.",
      };
    }
  };

  const getProfile = async () => {
    try {
      const response = await api.get("/auth/me");
      dispatch({ type: ACTIONS.GET_USER_PROFILE, payload: response.data });
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        getProfile,
        loading,
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
