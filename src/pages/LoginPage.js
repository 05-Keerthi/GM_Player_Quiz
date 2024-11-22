import React, { useState, useEffect, useContext } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../context/AuthContext";
import { usePasswordReset } from "../context/passwordResetContext";
import PasswordResetModal from "../models/PasswordResetModal";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { state: passwordResetState, actions: passwordResetActions } =
    usePasswordReset();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  useEffect(() => {
    const rememberedEmail = Cookies.get("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Reset all errors when modal closes
  useEffect(() => {
    if (!showForgotPasswordModal) {
      setEmailError("");
      setPasswordError("");
      setGeneralError("");
      passwordResetActions.reset(); // Reset password reset state when modal closes
    }
  }, [showForgotPasswordModal, passwordResetActions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let isValid = true;

    // Clear all errors
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    // Validate email
    if (!email) {
      setEmailError("Enter email");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError("Enter your password");
      isValid = false;
    }

    if (isValid) {
      try {
        await login(email, password, rememberMe);
        navigate("/");
      } catch (error) {
        try {
          const errorObj = JSON.parse(error.message);
          if (errorObj.email) setEmailError(errorObj.email);
          if (errorObj.password) setPasswordError(errorObj.password);
          if (errorObj.general) setGeneralError(errorObj.general);
        } catch (parseError) {
          setGeneralError("An unexpected error occurred. Please try again.");
        }
      }
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
    // Pre-fill email in password reset modal if it exists
    if (email) {
      passwordResetActions.reset(); // Reset any previous state
    }
  };

  const handlePasswordResetComplete = () => {
    setShowForgotPasswordModal(false);
    setGeneralError("");
    setPassword(""); // Clear password field after reset
  };

  return (
    <>
      <div className="min-h-screen relative flex items-center justify-center bg-gray-100 p-4">
        <div className="relative z-10 max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Login</h2>

          {generalError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded relative">
              <span>{generalError}</span>
              <button
                onClick={() => setGeneralError("")}
                className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                aria-label="Close error message"
              >
                ×
              </button>
            </div>
          )}

          {passwordResetState.success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded relative">
              <span>
                Password reset successful! Please login with your new password.
              </span>
              <button
                onClick={() => passwordResetActions.reset()}
                className="absolute top-1 right-1 text-green-500 hover:text-green-700"
                aria-label="Close success message"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                className={`mt-1 block w-full rounded-md border ${
                  emailError ? "border-red-500" : "border-gray-300"
                }px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                placeholder="Enter your email"
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  className={`mt-1 block w-full rounded-md border ${
                    passwordError ? "border-red-500" : "border-gray-300"
                  }px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600"
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="h-4 w-4"
                  />
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              Login
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Don't have an account? Register
              </button>
            </div>
          </form>
        </div>
      </div>

      <PasswordResetModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        initialEmail={email}
        onSuccess={handlePasswordResetComplete}
      />
    </>
  );
};

export default LoginPage;
