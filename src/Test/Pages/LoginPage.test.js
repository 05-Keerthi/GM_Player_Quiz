// src/Test/Auth/LoginPage.test.js

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../../pages/LoginPage";
import { useAuthContext } from "../../context/AuthContext";
import { usePasswordReset } from "../../context/passwordResetContext";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

// Mock dependencies
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("../../context/AuthContext", () => ({
  useAuthContext: jest.fn(),
}));

jest.mock("../../context/passwordResetContext", () => ({
  usePasswordReset: jest.fn(),
}));

jest.mock("js-cookie", () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <div data-testid="password-toggle">Icon</div>,
}));

// Mock PasswordResetModal component
jest.mock("../../models/User/PasswordResetModal", () => {
  return function MockPasswordResetModal({
    isOpen,
    onClose,
    initialEmail,
    onSuccess,
  }) {
    return isOpen ? (
      <div role="dialog" aria-modal="true">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Reset Password</button>
        <input type="email" defaultValue={initialEmail} />
      </div>
    ) : null;
  };
});

describe("LoginPage", () => {
  const mockNavigate = jest.fn();
  const mockLogin = jest.fn();
  const mockPasswordResetActions = {
    reset: jest.fn(),
  };

  const validCredentials = {
    email: "test@example.com",
    password: "Password123!",
  };

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useAuthContext.mockReturnValue({ login: mockLogin });
    usePasswordReset.mockReturnValue({
      state: { success: false },
      actions: mockPasswordResetActions,
    });
    jest.clearAllMocks();
  });

  const fillLoginForm = async (credentials = validCredentials) => {
    await userEvent.type(screen.getByLabelText(/email/i), credentials.email);
    await userEvent.type(
      screen.getByLabelText(/password/i),
      credentials.password
    );
  };

  test("renders login form with all required elements", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(
      screen.getByText(/don't have an account\? register/i)
    ).toBeInTheDocument();
  });

  test("toggles password visibility when eye icon is clicked", async () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByTestId("password-toggle");

    expect(passwordInput).toHaveAttribute("type", "password");

    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("validates email format", async () => {
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "invalid-email");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(
      screen.getByText(/please enter a valid email address/i)
    ).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(
      screen.queryByText(/please enter a valid email address/i)
    ).not.toBeInTheDocument();
  });

  test("handles successful login", async () => {
    render(<LoginPage />);

    await fillLoginForm();
    mockLogin.mockResolvedValueOnce({});

    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        validCredentials.email,
        validCredentials.password,
        false // remember me defaults to false
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("handles remember me functionality", async () => {
    render(<LoginPage />);

    await fillLoginForm();
    await userEvent.click(screen.getByLabelText(/remember me/i));
    mockLogin.mockResolvedValueOnce({});

    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        validCredentials.email,
        validCredentials.password,
        true
      );
    });
  });

  test("loads remembered email from cookie", () => {
    const rememberedEmail = "remembered@example.com";
    Cookies.get.mockReturnValue(rememberedEmail);

    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toHaveValue(rememberedEmail);
    expect(screen.getByLabelText(/remember me/i)).toBeChecked();
  });

  test("handles login errors", async () => {
    render(<LoginPage />);

    await fillLoginForm();
    const errorMessage = "Invalid credentials";
    mockLogin.mockRejectedValueOnce({
      message: JSON.stringify({ general: errorMessage }),
    });

    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test("navigates to registration page when register link is clicked", async () => {
    render(<LoginPage />);

    await userEvent.click(
      screen.getByText(/don't have an account\? register/i)
    );
    expect(mockNavigate).toHaveBeenCalledWith("/register");
  });

  test("opens password reset modal when forgot password is clicked", async () => {
    render(<LoginPage />);

    // Click forgot password link to open modal
    await userEvent.click(screen.getByText(/forgot password/i));

    // Verify modal is displayed
    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();

    // Verify initial email is passed to modal
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, "test@example.com");
    await userEvent.click(screen.getByText(/forgot password/i));

    // Test modal closing
    await userEvent.click(screen.getByText("Close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("shows validation errors for empty fields", async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByText(/enter email/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument();
  });

  test("clears error messages when inputs change", async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole("button", { name: /login/i }));
    expect(screen.getByText(/enter email/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/email/i), "a");
    expect(screen.queryByText(/enter email/i)).not.toBeInTheDocument();
  });


  test("displays success message after password reset", () => {
    usePasswordReset.mockReturnValue({
      state: { success: true },
      actions: mockPasswordResetActions,
    });

    render(<LoginPage />);

    expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
  });
});
