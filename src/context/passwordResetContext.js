// passwordResetContext.js
import React, { createContext, useReducer, useContext } from "react";
import {
  initialState,
  ACTIONS,
  passwordResetReducer,
} from "../reducers/passwordResetReducer";

export const PasswordResetContext = createContext();

export function PasswordResetProvider({ children }) {
  const [state, dispatch] = useReducer(passwordResetReducer, initialState);

  const actions = {
    initiatePasswordReset: async (email) => {
      dispatch({ type: ACTIONS.SET_EMAIL, payload: email });
      dispatch({ type: ACTIONS.REQUEST_START });

      try {
        const response = await fetch(
          "http://localhost:5000/api/forgot-password",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          dispatch({ type: ACTIONS.CODE_SENT_SUCCESS });
          return true;
        } else {
          dispatch({
            type: ACTIONS.REQUEST_ERROR,
            payload: data.message || "Failed to send reset code",
          });
          return false;
        }
      } catch (error) {
        dispatch({
          type: ACTIONS.REQUEST_ERROR,
          payload: "Network error. Please try again.",
        });
        return false;
      }
    },

    verifyResetCode: async (code) => {
      dispatch({ type: ACTIONS.SET_RESET_CODE, payload: code });
      dispatch({ type: ACTIONS.REQUEST_START });

      try {
        const response = await fetch(
          "http://localhost:5000/api/verify-reset-code",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: state.email,
              resetCode: code,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          dispatch({ type: ACTIONS.CODE_VERIFIED_SUCCESS });
          return true;
        } else {
          dispatch({
            type: ACTIONS.REQUEST_ERROR,
            payload: data.message || "Invalid reset code",
          });
          return false;
        }
      } catch (error) {
        dispatch({
          type: ACTIONS.REQUEST_ERROR,
          payload: "Network error. Please try again.",
        });
        return false;
      }
    },

    resetPassword: async (newPassword) => {
      dispatch({ type: ACTIONS.REQUEST_START });

      try {
        const response = await fetch(
          "http://localhost:5000/api/reset-password",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: state.email,
              resetCode: state.resetCode,
              newPassword,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          dispatch({ type: ACTIONS.RESET_SUCCESS });
          return true;
        } else {
          dispatch({
            type: ACTIONS.REQUEST_ERROR,
            payload: data.message || "Failed to reset password",
          });
          return false;
        }
      } catch (error) {
        dispatch({
          type: ACTIONS.REQUEST_ERROR,
          payload: "Network error. Please try again.",
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
