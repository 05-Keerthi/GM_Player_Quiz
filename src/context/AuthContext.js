import React, { createContext, useReducer, useEffect, useState } from "react";
import axios from "axios";
import { authReducer } from "../reducers/authReducer";
import Cookies from "js-cookie";

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
};

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
          type: "LOGIN",
          payload: { user: storedUser, token: storedToken },
        });
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${storedToken}`;
      }
      setLoading(false);
    };

    initializeAuth();

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshedToken = await refreshToken();
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${refreshedToken}`;
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${refreshedToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password, rememberMe) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      const { user, token } = response.data;

      // Handle Remember Me with Cookies
      if (rememberMe) {
        // Store email in a cookie (more secure than localStorage)
        Cookies.set("rememberedEmail", email, {
          expires: 30, // 30 days
          secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
          sameSite: "strict", // Protect against CSRF
        });
      } else {
        // Remove the cookie if remember me is not checked
        Cookies.remove("rememberedEmail");
      }

      // Store user and token
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      // Set Authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      dispatch({ type: "LOGIN", payload: { user, token } });
    } catch (error) {
      const errorResponse = error.response?.data;
      if (errorResponse?.message === "Invalid Email.") {
        throw new Error(JSON.stringify({ email: "Email does not exist" }));
      } else if (errorResponse?.message === "Invalid Password.") {
        throw new Error(JSON.stringify({ password: "Enter valid password" }));
      } else {
        throw new Error(
          JSON.stringify({
            general: "An error occurred. Please try again later.",
          })
        );
      }
    }
  };

  const register = async (username, email, mobile, password) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/auth/register`,
        {
          username,
          email,
          mobile,
          password,
        }
      );

      const { user, token } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      dispatch({ type: "LOGIN", payload: { user, token } });

      return response.data;
    } catch (error) {
      const errorResponse = error.response?.data;

      if (errorResponse?.field && errorResponse?.message) {
        // Convert the error to match our expected format
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
      await axios.post(`http://localhost:5000/api/auth/logout`, { token });
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      dispatch({ type: "LOGOUT" });
    } catch (error) {
      console.error("Logout failed", error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/refresh-token`,
        {
          token: localStorage.getItem("token"),
        }
      );
      const { token } = response.data;
      console.log(response.data);
      localStorage.setItem("token", token);
      return token;
    } catch (error) {
      console.error("Failed to refresh token", error);
      throw error;
    }
  };

  const getProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.get("http://localhost:5000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Assuming the response contains the user data directly
      const user = response.data;

      // Dispatch the user data to update the context
      dispatch({ type: "GET_USER_PROFILE", payload: user });

      return user;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };
  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, register, getProfile, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
