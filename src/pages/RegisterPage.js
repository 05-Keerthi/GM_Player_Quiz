import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../context/AuthContext";

// RegisterPage.jsx
export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  // State variables
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // New state for username
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [usernameError, setUsernameError] = useState(""); // New state for username error
  const [generalError, setGeneralError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation patterns
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validateForm = () => {
    let isValid = true;

    // Clear previous errors
    setEmailError("");
    setMobileError("");
    setPasswordError("");
    setUsernameError(""); // Clear username error
    setGeneralError("");

    // Email validation
    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!EMAIL_REGEX.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Username validation (no regex, just check for non-empty value)
    if (!username) {
      setUsernameError("Username is required");
      isValid = false;
    }

    // Phone validation
    if (!mobile) {
      setMobileError("Phone number is required");
      isValid = false;
    } else if (mobile.length < 10) {
      setMobileError("Number should be 10 digits");
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (!PASSWORD_REGEX.test(password)) {
      setPasswordError(
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        await register(username, email, mobile, password); // Pass username to register function
        navigate("/");
      } catch (error) {
        // Clear all previous errors first
        setEmailError("");
        setMobileError("");
        setPasswordError("");
        setUsernameError(""); // Clear username error
        setGeneralError("");

        // Set the appropriate error based on the field
        switch (error.field) {
          case "username":
            setUsernameError(error.message);
            break;
          case "email":
            setEmailError(error.message);
            break;
          case "mobile":
            setMobileError(error.message);
            break;
          case "general":
            setGeneralError(error.message);
            break;
          default:
            setGeneralError("An unexpected error occurred. Please try again.");
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-8">Registration</h2>

        {generalError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div>
            <label
              htmlFor="register-username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="register-username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError("");
              }}
              className={`mt-1 block w-full rounded-md border ${
                usernameError ? "border-red-500" : "border-gray-300"
              } px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="Enter your username"
              aria-label="Username"
            />
            {usernameError && (
              <p className="mt-1 text-sm text-red-600">{usernameError}</p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="register-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              className={`mt-1 block w-full rounded-md border ${
                emailError ? "border-red-500" : "border-gray-300"
              } px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="Enter your email address"
              aria-label="Email"
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>

          {/* Phone Number Input */}
          <div>
            <label
              htmlFor="register-mobile"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number
            </label>
            <PhoneInput
              id="register-mobile"
              value={mobile}
              onChange={(value) => {
                setMobile(value);
                setMobileError("");
              }}
              className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                mobileError ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter phone number"
              defaultCountry="IN"
              aria-label="Phone Number"
            />
            {mobileError && (
              <p className="mt-1 text-sm text-red-600">{mobileError}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="register-password"
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
                className="absolute inset-y-0 right-0 px-3 py-2 text-gray-500"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {passwordError && (
              <p className="mt-1 text-sm text-red-600">{passwordError}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Register
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Login here
          </span>
        </p>
      </div>
    </div>
  );
};
