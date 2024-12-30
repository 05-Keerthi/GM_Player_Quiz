import React, { createContext, useReducer, useContext } from "react";
import axios from "axios";
import {
  initialState,
  ACTIONS,
  passwordResetReducer,
} from "../reducers/passwordResetReducer";

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

export const PasswordResetContext = createContext();

export function PasswordResetProvider({ children }) {
  const [state, dispatch] = useReducer(passwordResetReducer, initialState);

  const actions = {
    initiatePasswordReset: async (email) => {
      dispatch({ type: ACTIONS.SET_EMAIL, payload: email });
      dispatch({ type: ACTIONS.REQUEST_START });

      try {
        const response = await api.post("/forgot-password", { email });
        dispatch({ type: ACTIONS.CODE_SENT_SUCCESS });
        return true;
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to send reset code";
        dispatch({
          type: ACTIONS.REQUEST_ERROR,
          payload: errorMessage,
        });
        return false;
      }
    },

    verifyResetCode: async (code) => {
      dispatch({ type: ACTIONS.SET_RESET_CODE, payload: code });
      dispatch({ type: ACTIONS.REQUEST_START });

      try {
        const response = await api.post("/verify-reset-code", {
          email: state.email,
          resetCode: code,
        });
        
        dispatch({ type: ACTIONS.CODE_VERIFIED_SUCCESS });
        return true;
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Invalid reset code";
        dispatch({
          type: ACTIONS.REQUEST_ERROR,
          payload: errorMessage,
        });
        return false;
      }
    },

    resetPassword: async (newPassword) => {
      dispatch({ type: ACTIONS.REQUEST_START });

      try {
        const response = await api.post("/reset-password", {
          email: state.email,
          resetCode: state.resetCode,
          newPassword,
        });

        dispatch({ type: ACTIONS.RESET_SUCCESS });
        return true;
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to reset password";
        dispatch({
          type: ACTIONS.REQUEST_ERROR,
          payload: errorMessage,
        });
        return false;
      }
    },

    clearError: () => dispatch({ type: ACTIONS.CLEAR_ERROR }),

    reset: () => dispatch({ type: ACTIONS.RESET }),
  };

  return (
    <PasswordResetContext.Provider value={{ state, actions }}>
      {children}
    </PasswordResetContext.Provider>
  );
}

export function usePasswordReset() {
  const context = useContext(PasswordResetContext);
  if (!context) {
    throw new Error(
      "usePasswordReset must be used within a PasswordResetProvider"
    );
  }
  return context;
}