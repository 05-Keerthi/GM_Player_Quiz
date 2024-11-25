import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { usePasswordReset } from "../../context/passwordResetContext";

const PasswordResetModal = ({ isOpen, onClose, initialEmail, onSuccess }) => {
  const { state, actions } = usePasswordReset();
  const [email, setEmail] = useState(initialEmail || "");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  const handleReset = () => {
    setEmail(initialEmail || "");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setFormErrors({});
    setIsCodeSent(false);
    setIsCodeVerified(false);
    actions.reset();
  };

  const validateEmail = () => {
    if (!email) {
      setFormErrors((prev) => ({ ...prev, email: "Email is required" }));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email",
      }));
      return false;
    }
    return true;
  };

  const validateCode = () => {
    if (!resetCode) {
      setFormErrors((prev) => ({
        ...prev,
        resetCode: "Reset code is required",
      }));
      return false;
    }
    if (!/^\d{6}$/.test(resetCode)) {
      setFormErrors((prev) => ({
        ...prev,
        resetCode: "Code must be 6 digits",
      }));
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    const errors = {};
    if (!newPassword) {
      errors.newPassword = "Password is required";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSendCode = async () => {
    setFormErrors({});
    if (!validateEmail()) return;

    try {
      const success = await actions.initiatePasswordReset(email);
      if (success) {
        setIsCodeSent(true);
        toast.success("Reset code has been sent to your email", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      toast.error("Failed to send reset code. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setFormErrors((prev) => ({
        ...prev,
        email: "Failed to send reset code. Please try again.",
      }));
    }
  };

  const handleVerifyCode = async () => {
    setFormErrors({});
    if (!validateCode()) return;

    try {
      const success = await actions.verifyResetCode(resetCode);
      if (success) {
        setIsCodeVerified(true);
        toast.success("Code verified successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      toast.error("Failed to verify code. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setFormErrors((prev) => ({
        ...prev,
        resetCode: "Failed to verify code. Please try again.",
      }));
    }
  };

  const handleResetPassword = async () => {
    setFormErrors({});
    if (!validatePassword()) return;

    try {
      const success = await actions.resetPassword(newPassword);
      if (success) {
        toast.success("Password reset successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      toast.error("Failed to reset password. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setFormErrors((prev) => ({
        ...prev,
        newPassword: "Failed to reset password. Please try again.",
      }));
    }
  };

  const renderEmailStep = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFormErrors((prev) => ({ ...prev, email: "" }));
          }}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.email ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter your email"
        />
        {formErrors.email && (
          <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
        )}
      </div>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          onClick={handleSendCode}
          disabled={state.isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {state.isLoading ? "Sending..." : "Send Reset Code"}
        </button>
      </div>
    </div>
  );

  const renderCodeVerificationStep = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Verification Code
        </label>
        <input
          type="text"
          value={resetCode}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 6);
            setResetCode(value);
            setFormErrors((prev) => ({ ...prev, resetCode: "" }));
          }}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.resetCode ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter 6-digit code"
          maxLength={6}
        />
        {formErrors.resetCode && (
          <p className="mt-1 text-sm text-red-600">{formErrors.resetCode}</p>
        )}
      </div>
      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            setIsCodeSent(false);
            setFormErrors({});
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Back to Email
        </button>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleVerifyCode}
            disabled={state.isLoading || resetCode.length !== 6}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {state.isLoading ? "Verifying..." : "Verify Code"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPasswordResetStep = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setFormErrors((prev) => ({ ...prev, newPassword: "" }));
          }}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.newPassword ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter new password"
        />
        {formErrors.newPassword && (
          <p className="mt-1 text-sm text-red-600">{formErrors.newPassword}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setFormErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            formErrors.confirmPassword ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Confirm new password"
        />
        {formErrors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            {formErrors.confirmPassword}
          </p>
        )}
      </div>
      <div className="flex justify-between items-center">
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Start Over
        </button>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleResetPassword}
            disabled={state.isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {state.isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {!isCodeSent && "Enter your email to receive a reset code"}
            {isCodeSent &&
              !isCodeVerified &&
              "Enter the 6-digit code sent to your email"}
            {isCodeVerified && "Create a new password for your account"}
          </p>
        </div>

        {!isCodeSent && renderEmailStep()}
        {isCodeSent && !isCodeVerified && renderCodeVerificationStep()}
        {isCodeVerified && renderPasswordResetStep()}
      </div>
    </div>
  );
};

export default PasswordResetModal;
