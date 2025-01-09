import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { toast } from "react-toastify";
import { useUserContext } from "../../../context/userContext";
import EditUserModal from "../../../models/User/EditUserModel";

// Mock dependencies
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../context/userContext", () => ({
  useUserContext: jest.fn(),
}));

describe("EditUserModal", () => {
  const mockUser = {
    _id: "user123",
    username: "testuser",
    email: "test@example.com",
    mobile: "1234567890",
    role: "user",
  };

  const mockUpdateUser = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useUserContext.mockImplementation(() => ({
      updateUser: mockUpdateUser,
    }));
  });

  // Test 1: Modal Visibility
  test("should not render when isOpen is false", () => {
    render(
      <EditUserModal isOpen={false} onClose={mockOnClose} user={mockUser} />
    );
    expect(screen.queryByText("Edit User")).not.toBeInTheDocument();
  });

  test("should render when isOpen is true", () => {
    render(
      <EditUserModal isOpen={true} onClose={mockOnClose} user={mockUser} />
    );
    expect(screen.getByText("Edit User")).toBeInTheDocument();
  });

  // Test 2: Initial Form Data
  test("should populate form with user data", () => {
    render(
      <EditUserModal isOpen={true} onClose={mockOnClose} user={mockUser} />
    );

    // Use getByRole with name option to find inputs
    expect(screen.getByRole("textbox", { name: /username/i })).toHaveValue(
      mockUser.username
    );
    expect(screen.getByRole("textbox", { name: /email/i })).toHaveValue(
      mockUser.email
    );
    expect(screen.getByRole("textbox", { name: /mobile/i })).toHaveValue(
      mockUser.mobile
    );
    expect(screen.getByRole("combobox", { name: /role/i })).toHaveValue(
      mockUser.role
    );
  });

  // Test 3: Form Updates
  test("should update form fields when user types", () => {
    render(
      <EditUserModal isOpen={true} onClose={mockOnClose} user={mockUser} />
    );

    const usernameInput = screen.getByRole("textbox", { name: /username/i });
    fireEvent.change(usernameInput, {
      target: { name: "username", value: "newusername" },
    });
    expect(usernameInput).toHaveValue("newusername");
  });

  // Test 4: Successful Form Submission
  test("should handle successful form submission", async () => {
    mockUpdateUser.mockResolvedValueOnce({
      ...mockUser,
      username: "newusername",
    });

    render(
      <EditUserModal isOpen={true} onClose={mockOnClose} user={mockUser} />
    );

    const usernameInput = screen.getByRole("textbox", { name: /username/i });
    fireEvent.change(usernameInput, {
      target: { name: "username", value: "newusername" },
    });

    const submitButton = screen.getByRole("button", { name: /update user/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith("user123", {
        username: "newusername",
        email: mockUser.email,
        mobile: mockUser.mobile,
        role: mockUser.role,
      });
      expect(toast.success).toHaveBeenCalledWith("User updated successfully!");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // Test 5: Form Validation Errors
  test("should handle validation errors", async () => {
    const validationError = {
      response: {
        data: {
          errors: [{ field: "email", message: "Invalid email format" }],
        },
      },
    };
    mockUpdateUser.mockRejectedValueOnce(validationError);

    render(
      <EditUserModal isOpen={true} onClose={mockOnClose} user={mockUser} />
    );

    const submitButton = screen.getByRole("button", { name: /update user/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email format")).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("email: Invalid email format");
    });
  });

  // Test 6: Generic Error Handling
  test("should handle generic errors", async () => {
    const genericError = {
      response: {
        data: {
          message: "Server error occurred",
        },
      },
    };
    mockUpdateUser.mockRejectedValueOnce(genericError);

    render(
      <EditUserModal isOpen={true} onClose={mockOnClose} user={mockUser} />
    );

    const submitButton = screen.getByRole("button", { name: /update user/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Server error occurred");
    });
  });

  // Test 7: Loading State
  test("should show loading state during submission", async () => {
    mockUpdateUser.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <EditUserModal isOpen={true} onClose={mockOnClose} user={mockUser} />
    );

    const submitButton = screen.getByRole("button", { name: /update user/i });
    fireEvent.click(submitButton);

    expect(screen.getByText("Updating...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  // Test 8: Cancel Button
  test("should call onClose when cancel button is clicked", () => {
    render(
      <EditUserModal isOpen={true} onClose={mockOnClose} user={mockUser} />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  // Test 9: Role Selection
  test("should handle role selection change", () => {
    render(
      <EditUserModal isOpen={true} onClose={mockOnClose} user={mockUser} />
    );

    const roleSelect = screen.getByRole("combobox", { name: /role/i });
    fireEvent.change(roleSelect, { target: { name: "role", value: "admin" } });

    expect(roleSelect).toHaveValue("admin");
  });

  // Test 10: Required Fields
  test("should validate required fields", () => {
    render(
      <EditUserModal isOpen={true} onClose={mockOnClose} user={mockUser} />
    );

    const usernameInput = screen.getByRole("textbox", { name: /username/i });
    const emailInput = screen.getByRole("textbox", { name: /email/i });
    const mobileInput = screen.getByRole("textbox", { name: /mobile/i });
    const roleSelect = screen.getByRole("combobox", { name: /role/i });

    expect(usernameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(mobileInput).toBeRequired();
    expect(roleSelect).toBeRequired();
  });
});
