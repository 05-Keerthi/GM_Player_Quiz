// src/Test/Auth/LoginPage.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../../pages/LoginPage";
import { useAuthContext } from "../../context/AuthContext";
import { usePasswordReset } from "../../context/passwordResetContext";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

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
        <input
          type="email"
          defaultValue={initialEmail}
          data-testid="reset-email-input"
        />
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
  const user = userEvent.setup();

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
    await user.type(screen.getByLabelText(/email/i), credentials.email);
    await user.type(screen.getByLabelText(/password/i), credentials.password);
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

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("validates email format", async () => {
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "invalid-email");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(
      screen.getByText(/please enter a valid email address/i)
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(
      screen.queryByText(/please enter a valid email address/i)
    ).not.toBeInTheDocument();
  });

  test("handles successful login", async () => {
    render(<LoginPage />);
    await fillLoginForm();
    mockLogin.mockResolvedValueOnce({});

    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        validCredentials.email,
        validCredentials.password,
        false
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("handles remember me functionality", async () => {
    render(<LoginPage />);
    await fillLoginForm();
    await user.click(screen.getByLabelText(/remember me/i));
    mockLogin.mockResolvedValueOnce({});

    await user.click(screen.getByRole("button", { name: /login/i }));

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

  test("handles error messages correctly", async () => {
    render(<LoginPage />);
    await fillLoginForm();

    // Test password-specific error
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: "Invalid Password." } },
    });
    await user.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText("Invalid Password.")).toBeInTheDocument();
    });

    // Test email-specific error
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: "Email not found." } },
    });
    await user.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText("Email not found.")).toBeInTheDocument();
    });

    // Test general error
    mockLogin.mockRejectedValueOnce({});
    await user.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(
        screen.getByText("An unexpected error occurred. Please try again.")
      ).toBeInTheDocument();
    });
  });

  test("handles password reset modal", async () => {
    render(<LoginPage />);

    // Open modal
    await user.click(screen.getByText(/forgot password/i));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Test email input
    await user.type(
      screen.getByTestId("reset-email-input"),
      "test@example.com"
    );

    // Close modal
    await user.click(screen.getByText("Close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("shows and clears validation errors", async () => {
    render(<LoginPage />);

    // Show errors
    await user.click(screen.getByRole("button", { name: /login/i }));
    expect(screen.getByText(/enter email/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument();

    // Clear errors on input
    await user.type(screen.getByLabelText(/email/i), "a");
    expect(screen.queryByText(/enter email/i)).not.toBeInTheDocument();
  });

  test("navigates to register page", async () => {
    render(<LoginPage />);
    await user.click(screen.getByText(/don't have an account\? register/i));
    expect(mockNavigate).toHaveBeenCalledWith("/register");
  });
});
