// src/Test/Auth/RegisterPage.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import  RegisterPage  from "../../pages/RegisterPage";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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
        type="tel"
        aria-label="Phone Number"
        data-testid="phone-input"
        {...props}
        onChange={(e) => props.onChange && props.onChange(e.target.value)}
      />
    );
  };
});

describe("RegisterPage", () => {
  const mockNavigate = jest.fn();
  const mockRegister = jest.fn();
  const user = userEvent.setup();

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

  const renderRegisterPage = () => {
    return render(<RegisterPage />);
  };

  const fillForm = async (data = validFormData) => {
    await user.type(screen.getByLabelText(/username/i), data.username);
    await user.type(screen.getByLabelText(/email/i), data.email);
    await user.type(screen.getByTestId("phone-input"), data.phone);
    await user.type(screen.getByLabelText(/password/i), data.password);
  };

  describe("Form Rendering", () => {
    test("renders all form elements correctly", () => {
      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByTestId("phone-input");
      const passwordInput = screen.getByLabelText(/password/i);
      const registerButton = screen.getByRole("button", { name: /register/i });
      const loginLink = screen.getByText(/login here/i);

      expect(usernameInput).toHaveAttribute("type", "text");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(registerButton).toHaveAttribute("type", "submit");
      expect(loginLink).toHaveClass("text-blue-600");
    });

    test("toggles password visibility", async () => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByTestId("password-toggle");

      expect(passwordInput).toHaveAttribute("type", "password");

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "text");

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("Form Validation", () => {
    test("validates email format", async () => {
      renderRegisterPage();

      await user.type(screen.getByLabelText(/email/i), "invalid-email");
      await user.click(screen.getByRole("button", { name: /register/i }));
      expect(
        screen.getByText(/please enter a valid email address/i)
      ).toBeInTheDocument();

      await user.clear(screen.getByLabelText(/email/i));
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.click(screen.getByRole("button", { name: /register/i }));
      expect(
        screen.queryByText(/please enter a valid email address/i)
      ).not.toBeInTheDocument();
    });

    test("validates password requirements", async () => {
      renderRegisterPage();

      await user.type(screen.getByLabelText(/password/i), "weak");
      await user.click(screen.getByRole("button", { name: /register/i }));
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();

      await user.clear(screen.getByLabelText(/password/i));
      await user.type(screen.getByLabelText(/password/i), "StrongPass123!");
      await user.click(screen.getByRole("button", { name: /register/i }));
      expect(
        screen.queryByText(/password must be at least 8 characters/i)
      ).not.toBeInTheDocument();
    });

    test("shows validation errors for empty fields", async () => {
      renderRegisterPage();
      await user.click(screen.getByRole("button", { name: /register/i }));

      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    test("handles successful registration", async () => {
      renderRegisterPage();
      await fillForm();
      mockRegister.mockResolvedValueOnce({});

      await user.click(screen.getByRole("button", { name: /register/i }));

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
        expect.any(Object)
      );
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    test("handles registration errors", async () => {
      renderRegisterPage();
      await fillForm();

      // Field-specific error
      mockRegister.mockRejectedValueOnce({
        field: "email",
        message: "Email already exists",
      });

      await user.click(screen.getByRole("button", { name: /register/i }));
      await waitFor(() => {
        expect(screen.getByText("Email already exists")).toBeInTheDocument();
      });

      // General error
      mockRegister.mockRejectedValueOnce({
        field: "general",
        message: "Network error occurred",
      });

      await user.click(screen.getByRole("button", { name: /register/i }));
      await waitFor(() => {
        expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    test("navigates to login page", async () => {
      renderRegisterPage();
      await user.click(screen.getByText(/login here/i));
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});
