import React, { useState, useContext } from "react";
import { PasswordResetContext } from "../context/passwordResetContext";

export const PasswordResetModal = ({ isOpen, onClose, initialEmail }) => {
  const { state, actions } = useContext(PasswordResetContext);
  const [email, setEmail] = useState(initialEmail || "");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [resetCodeError, setResetCodeError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = () => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateResetCode = () => {
    if (!resetCode) {
      setResetCodeError("Reset code is required");
      return false;
    }
    setResetCodeError("");
    return true;
  };

  const validatePassword = () => {
    if (!newPassword) {
      setPasswordError("New password is required");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSendResetCode = async () => {
    if (validateEmail()) {
      const success = await actions.initiatePasswordReset(email);
      if (!success) {
        setEmailError(state.error || "Failed to send reset code");
      }
    }
  };

  const handleVerifyResetCode = async () => {
    if (validateResetCode()) {
      const success = await actions.verifyResetCode(resetCode);
      if (!success) {
        setResetCodeError(state.error || "Invalid reset code");
      }
    }
  };

  const handleResetPassword = async () => {
    if (validatePassword()) {
      const success = await actions.resetPassword(newPassword);
      if (success) {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Reset Password</h2>

        {state.stage === "email" && (
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              placeholder="Enter your email"
              className={`w-full px-3 py-2 border ${
                emailError ? "border-red-500" : "border-gray-300"
              } rounded`}
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
            <div className="flex justify-between mt-4">
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSendResetCode}
                disabled={state.isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {state.isLoading ? "Sending..." : "Send Reset Code"}
              </button>
            </div>
          </div>
        )}

        {state.stage === "code" && (
          <div>
            <input
              type="text"
              value={resetCode}
              onChange={(e) => {
                setResetCode(e.target.value);
                setResetCodeError("");
              }}
              placeholder="Enter reset code"
              className={`w-full px-3 py-2 border ${
                resetCodeError ? "border-red-500" : "border-gray-300"
              } rounded`}
            />
            {resetCodeError && (
              <p className="text-red-500 text-sm mt-1">{resetCodeError}</p>
            )}
            <div className="flex justify-between mt-4">
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyResetCode}
                disabled={state.isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {state.isLoading ? "Verifying..." : "Verify Code"}
              </button>
            </div>
          </div>
        )}

        {state.stage === "newPassword" && (
          <div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError("");
              }}
              placeholder="New Password"
              className={`w-full px-3 py-2 border ${
                passwordError ? "border-red-500" : "border-gray-300"
              } rounded mb-4`}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError("");
              }}
              placeholder="Confirm New Password"
              className={`w-full px-3 py-2 border ${
                passwordError ? "border-red-500" : "border-gray-300"
              } rounded`}
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
            <div className="flex justify-between mt-4">
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={state.isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {state.isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        )}

        {state.success && (
          <div className="text-green-600 text-center">
            Password reset successfully!
          </div>
        )}
      </div>
    </div>
  );
};
