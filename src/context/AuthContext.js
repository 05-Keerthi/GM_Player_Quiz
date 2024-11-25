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

  // Update axios authorization header
  const updateAuthHeader = (token) => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  };

  // Initialize auth state and set up interceptors
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = JSON.parse(localStorage.getItem("user"));

        if (storedToken && storedUser) {
          updateAuthHeader(storedToken);
          dispatch({
            type: ACTIONS.LOGIN,
            payload: { user: storedUser, token: storedToken },
          });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    let isRefreshing = false;
    let failedQueue = [];

    const processQueue = (error, token = null) => {
      failedQueue.forEach((prom) => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve(token);
        }
      });
      failedQueue = [];
    };

    // Set up response interceptor for handling 401 errors
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            // Queue the request if a refresh is already in progress
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers["Authorization"] = `Bearer ${token}`;
                return api(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const newToken = await refreshToken();
            if (newToken) {
              updateAuthHeader(newToken);
              originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
              processQueue(null, newToken);
              return api(originalRequest);
            }
          } catch (refreshError) {
            processQueue(refreshError, null);
            await logout();
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );

    initializeAuth();

    return () => {
      api.interceptors.response.eject(interceptor);
    };
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

  const refreshToken = async () => {
    try {
      const refresh_token = localStorage.getItem("refresh_token");
      if (!refresh_token) throw new Error("No refresh token available");

      const response = await api.post("/auth/refresh-token", {
        refresh_token,
      });

      const { token: newToken } = response.data;
      localStorage.setItem("token", newToken);
      updateAuthHeader(newToken);

      return newToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      await logout();
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
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      updateAuthHeader(null);
      dispatch({ type: ACTIONS.LOGOUT });
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
