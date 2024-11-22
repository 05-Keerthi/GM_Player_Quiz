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

// Constants for API and Actions
const BASE_URL = "http://localhost:5000/api";

// Get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// Create axios instance with base URL and headers
const api = axios.create({
  baseURL: BASE_URL,
  headers: getAuthHeaders(),
});

export const AuthContext = createContext(initialState);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        dispatch({
          type: ACTIONS.LOGIN,
          payload: { user: storedUser, token: storedToken },
        });
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
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
            const refreshedToken = await refreshToken();
            api.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${refreshedToken}`;
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${refreshedToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password, rememberMe) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user, token } = response.data;

      // Remember Me functionality
      if (rememberMe) {
        Cookies.set("rememberedEmail", email, {
          expires: 30,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      } else {
        Cookies.remove("rememberedEmail");
      }

      // Store user and token
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      // Update authorization
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      dispatch({ type: ACTIONS.LOGIN, payload: { user, token } });
    } catch (error) {
      const errorResponse = error.response?.data;
      const errorMessage = errorResponse?.message || "An error occurred";

      const formattedError = {
        email:
          errorMessage === "Invalid Email." ? "Email does not exist" : null,
        password:
          errorMessage === "Invalid Password." ? "Enter valid password" : null,
        general: errorMessage,
      };

      throw new Error(JSON.stringify(formattedError));
    }
  };

  const register = async (username, email, mobile, password) => {
    try {
      // Send registration request
      const response = await api.post("/auth/register", {
        username,
        email,
        mobile,
        password,
      });

      const { user, token } = response.data;

      // Save user and token to localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      // Update axios default headers
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Dispatch REGISTER action
      dispatch({ type: ACTIONS.REGISTER, payload: { user, token } });

      // Return the response for any additional handling
      return response.data;
    } catch (error) {
      const errorResponse = error.response?.data;

      // Format error with field-specific messages
      if (errorResponse?.field && errorResponse?.message) {
        throw {
          field: errorResponse.field,
          message: errorResponse.message,
        };
      } else {
        throw {
          field: "general",
          message: "An error occurred. Please try again later.",
        };
      }
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.post("/auth/logout", { token });

      localStorage.removeItem("user");
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];

      dispatch({ type: ACTIONS.LOGOUT });
    } catch (error) {
      console.error("Logout failed", error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post("/refresh-token", {
        token: localStorage.getItem("token"),
      });

      const { token } = response.data;
      localStorage.setItem("token", token);
      return token;
    } catch (error) {
      console.error("Failed to refresh token", error);
      throw error;
    }
  };

  const getProfile = async () => {
    try {
      const response = await api.get("/auth/me");
      const user = response.data;

      dispatch({ type: ACTIONS.GET_USER_PROFILE, payload: user });
      return user;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };

  // Custom hook for using AuthContext
  const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
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
        useAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
