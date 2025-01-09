import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { toast } from "react-toastify";
import { usePasswordReset } from "../../../context/passwordResetContext";
import PasswordResetModal from "../../../models/User/PasswordResetModal";

// Mock dependencies
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../context/passwordResetContext", () => ({
  usePasswordReset: jest.fn(),
}));

describe("PasswordResetModal", () => {
  const mockActions = {
    initiatePasswordReset: jest.fn(),
    verifyResetCode: jest.fn(),
    resetPassword: jest.fn(),
    reset: jest.fn(),
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    initialEmail: "",
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    usePasswordReset.mockImplementation(() => ({
      state: { isLoading: false },
      actions: mockActions,
    }));
  });

  // Test 1: Modal Visibility
  test("should not render when isOpen is false", () => {
    render(<PasswordResetModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Reset Password")).not.toBeInTheDocument();
  });

  test("should render when isOpen is true", () => {
    render(<PasswordResetModal {...defaultProps} />);
    expect(screen.getByText("Reset Password")).toBeInTheDocument();
  });

  // Test 2: Initial Email Step
  describe("Email Step", () => {
    test("should show email input initially", () => {
      render(<PasswordResetModal {...defaultProps} />);
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /send reset code/i })
      ).toBeInTheDocument();
    });

    test("should validate email format", async () => {
      render(<PasswordResetModal {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const sendButton = screen.getByRole("button", {
        name: /send reset code/i,
      });

      // Test empty email
      fireEvent.click(sendButton);
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();

      // Test invalid email
      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      fireEvent.click(sendButton);
      expect(
        screen.getByText(/please enter a valid email/i)
      ).toBeInTheDocument();
    });

    test("should handle successful code send", async () => {
      mockActions.initiatePasswordReset.mockResolvedValueOnce(true);

      render(<PasswordResetModal {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      const sendButton = screen.getByRole("button", {
        name: /send reset code/i,
      });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockActions.initiatePasswordReset).toHaveBeenCalledWith(
          "test@example.com"
        );
      });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(
          screen.getByText(/enter the 6-digit code sent to your email/i)
        ).toBeInTheDocument();
      });
    });
  });

  // Test 3: Code Verification Step
  describe("Code Verification Step", () => {
    beforeEach(async () => {
      mockActions.initiatePasswordReset.mockResolvedValueOnce(true);

      render(<PasswordResetModal {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      const sendButton = screen.getByRole("button", {
        name: /send reset code/i,
      });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
      });
    });

    test("should handle successful code verification", async () => {
      mockActions.verifyResetCode.mockResolvedValueOnce(true);

      const codeInput = screen.getByLabelText(/verification code/i);
      fireEvent.change(codeInput, { target: { value: "123456" } });

      const verifyButton = screen.getByRole("button", { name: /verify code/i });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(mockActions.verifyResetCode).toHaveBeenCalledWith("123456");
      });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(screen.getByText(/create a new password/i)).toBeInTheDocument();
      });
    });
  });

  // Test 4: Password Reset Step
  describe("Password Reset Step", () => {
    beforeEach(async () => {
      mockActions.initiatePasswordReset.mockResolvedValueOnce(true);
      mockActions.verifyResetCode.mockResolvedValueOnce(true);

      render(<PasswordResetModal {...defaultProps} />);

      // Complete email step
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));

      await waitFor(() => {
        // Complete code verification step
        const codeInput = screen.getByLabelText(/verification code/i);
        fireEvent.change(codeInput, { target: { value: "123456" } });
        fireEvent.click(screen.getByRole("button", { name: /verify code/i }));
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });
    });

    test("should validate passwords", async () => {
      const resetButton = screen.getByRole("button", {
        name: /reset password/i,
      });
      fireEvent.click(resetButton);
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(newPasswordInput, { target: { value: "short" } });
      fireEvent.click(resetButton);
      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      fireEvent.change(newPasswordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password124" },
      });
      fireEvent.click(resetButton);
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    test("should handle successful password reset", async () => {
      mockActions.resetPassword.mockResolvedValueOnce(true);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(newPasswordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "password123" },
      });

      const resetButton = screen.getByRole("button", {
        name: /reset password/i,
      });
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(mockActions.resetPassword).toHaveBeenCalledWith("password123");
      });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });
  });

  // Test 5: Navigation
  describe("Navigation", () => {
    test("should allow going back to email step", async () => {
      mockActions.initiatePasswordReset.mockResolvedValueOnce(true);

      render(<PasswordResetModal {...defaultProps} />);

      // Complete email step
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));

      await waitFor(() => {
        const backButton = screen.getByRole("button", {
          name: /back to email/i,
        });
        fireEvent.click(backButton);
        expect(
          screen.getByText(/enter your email to receive a reset code/i)
        ).toBeInTheDocument();
      });
    });
  });
});
