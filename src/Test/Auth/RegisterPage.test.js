// src/Test/Auth/RegisterPage.test.js

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterPage } from "../../pages/RegisterPage";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Mock dependencies
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("../../context/AuthContext", () => ({
  useAuthContext: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <div data-testid="password-toggle">Icon</div>,
}));

jest.mock("react-phone-number-input", () => {
  return function PhoneInput(props) {
    return (
      <input
        type="text"
        aria-label="Phone Number"
        {...props}
        onChange={(e) => props.onChange && props.onChange(e.target.value)}
      />
    );
  };
});

describe("RegisterPage", () => {
  const mockNavigate = jest.fn();
  const mockRegister = jest.fn();
  const validFormData = {
    username: "testuser",
    email: "test@example.com",
    phone: "+911234567890",
    password: "TestPass123!",
  };

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useAuthContext.mockReturnValue({ register: mockRegister });
    jest.clearAllMocks();
  });

  const fillForm = async (data = validFormData) => {
    await userEvent.type(screen.getByLabelText(/username/i), data.username);
    await userEvent.type(screen.getByLabelText(/email/i), data.email);
    await userEvent.type(
      screen.getByRole("textbox", { name: /phone number/i }),
      data.phone
    );
    await userEvent.type(screen.getByLabelText(/password/i), data.password);
  };

  test("renders registration form with all required elements", () => {
    render(<RegisterPage />);

    // Check for form fields with better assertions
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const phoneLabel = screen.getByText(/phone number/i);
    const phoneInput = screen.getByRole("textbox", { name: /phone number/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const registerButton = screen.getByRole("button", { name: /register/i });
    const loginLink = screen.getByText(/login here/i);

    // Verify all form elements are present and have correct attributes
    expect(usernameInput).toHaveAttribute("type", "text");
    expect(emailInput).toHaveAttribute("type", "email");
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(registerButton).toHaveAttribute("type", "submit");
    expect(loginLink).toHaveClass("text-blue-600");
  });

  test("toggles password visibility when eye icon is clicked", async () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByTestId("password-toggle");

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute("type", "password");

    // Click toggle button
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    // Click again to hide
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("validates email format", async () => {
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const registerButton = screen.getByRole("button", { name: /register/i });

    // Test invalid email
    await userEvent.type(emailInput, "invalid-email");
    await userEvent.click(registerButton);

    expect(
      screen.getByText(/please enter a valid email address/i)
    ).toBeInTheDocument();

    // Test valid email
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "test@example.com");
    await userEvent.click(registerButton);

    expect(
      screen.queryByText(/please enter a valid email address/i)
    ).not.toBeInTheDocument();
  });

  test("validates password requirements", async () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    const registerButton = screen.getByRole("button", { name: /register/i });

    // Test weak password
    await userEvent.type(passwordInput, "weak");
    await userEvent.click(registerButton);

    expect(
      screen.getByText(/password must be at least 8 characters/i)
    ).toBeInTheDocument();

    // Test strong password
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, "StrongPass123!");
    await userEvent.click(registerButton);

    expect(
      screen.queryByText(/password must be at least 8 characters/i)
    ).not.toBeInTheDocument();
  });

  test("handles successful registration", async () => {
    render(<RegisterPage />);

    await fillForm();
    mockRegister.mockResolvedValueOnce({});

    await userEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        validFormData.username,
        validFormData.email,
        validFormData.phone,
        validFormData.password
      );
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Registration successful! Redirecting to login...",
      expect.objectContaining({
        position: "top-right",
        autoClose: 3000,
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("handles field-specific registration errors", async () => {
    render(<RegisterPage />);

    await fillForm();
    const errorMessage = "Email already exists";
    mockRegister.mockRejectedValueOnce({
      field: "email",
      message: errorMessage,
    });

    await userEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test("handles general registration errors", async () => {
    render(<RegisterPage />);

    await fillForm();
    mockRegister.mockRejectedValueOnce({
      field: "general",
      message: "Network error occurred",
    });

    await userEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
    });
  });

  test("navigates to login page when login link is clicked", async () => {
    render(<RegisterPage />);

    await userEvent.click(screen.getByText(/login here/i));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("clears error messages when inputs change", async () => {
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.click(screen.getByRole("button", { name: /register/i }));
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();

    await userEvent.type(emailInput, "a");
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });

  test("shows validation errors for empty fields", async () => {
    render(<RegisterPage />);

    await userEvent.click(screen.getByRole("button", { name: /register/i }));

    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
});
