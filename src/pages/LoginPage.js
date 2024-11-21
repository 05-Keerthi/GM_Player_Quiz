import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../context/AuthContext";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    const storedPassword = localStorage.getItem("password");

    if (storedEmail && storedPassword) {
      setEmail(storedEmail);
      setPassword(storedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let isValid = true;

    // Clear all previous errors
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    if (!email) {
      setEmailError("Enter email");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Enter your password");
      isValid = false;
    }

    if (isValid) {
      try {
        await login(email, password, rememberMe);
        navigate("/");
      } catch (error) {
        // Parse the error message from the JSON string
        try {
          const errorObj = JSON.parse(error.message);
          if (errorObj.email) {
            setEmailError(errorObj.email);
          }
          if (errorObj.password) {
            setPasswordError(errorObj.password);
          }
          if (errorObj.general) {
            setGeneralError(errorObj.general);
          }
        } catch (parseError) {
          setGeneralError("An unexpected error occurred");
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-8">Login</h2>

        {/* Display general error at the top if present */}
        {generalError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
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
              } px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="Enter your email"
              aria-label="Email"
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>

          {/* Password Input */}
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
                } px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                placeholder="Enter your password"
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 py-2 text-gray-600 focus:outline-none"
                aria-label="Toggle password visibility"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {passwordError && (
              <p className="mt-1 text-sm text-red-600">{passwordError}</p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2"
            />
            <label className="text-gray-700">Remember me</label>
          </div>
          <div className="flex items-center justify-end mt-2">
            <p className="text-sm text-blue-600 hover:underline cursor-pointer">
              Forgot password?
            </p>
          </div>
          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-black text-white rounded-md py-2 px-4 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Login
          </button>
          {/* Register Link */}
          <div className="flex items-center justify-center mt-4">
            <p
              className="text-sm text-blue-600 hover:underline cursor-pointer"
              onClick={() => navigate("/register")}
            >
              Don't have an account? Register
            </p>
          </div>
          {/* Divider */}
          {/* <div className="flex items-center justify-center mt-4">
            <p>OR</p>
          </div> */}
          {/* Social Login Buttons */}
          {/* <div className="space-y-4 mt-4">
            <button
              type="button"
              className="w-full bg-black text-white rounded-md py-2 px-4 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <span>Login with Google</span>
            </button>

            <button
              type="button"
              className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span>Login with Facebook</span>
            </button>
          </div> */}

          {/* Divider */}
          {/* <div className="flex items-center justify-center mt-4">
            <p>Join quiz using</p>
          </div> */}

          {/* Join Quiz Options */}
          {/* <div className="mt-4 space-y-2">
            <button
              type="button"
              className="w-full border border-gray-300 text-gray-700 rounded-md py-2 px-4 hover:bg-gray-50"
            >
              Scan QR code
            </button>

            <button
              type="button"
              className="w-full border border-gray-300 text-gray-700 rounded-md py-2 px-4 hover:bg-gray-50"
            >
              Enter the PIN
            </button>
          </div> */}
        </form>
      </div>
    </div>
  );
};
