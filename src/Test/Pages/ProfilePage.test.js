import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfilePage } from "../../pages/ProfilePage";
import { useAuthContext } from "../../context/AuthContext";
import { useUserContext } from "../../context/userContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Mock the required hooks and modules
jest.mock("../../context/AuthContext");
jest.mock("../../context/userContext");
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock NavbarComp component
jest.mock("../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

// Mock profile data
const mockProfileData = {
  _id: "123",
  username: "testuser",
  email: "test@example.com",
  mobile: "1234567890",
  role: "user",
};

describe("ProfilePage", () => {
  const user = userEvent.setup();
  const mockNavigate = jest.fn();
  const mockGetProfile = jest.fn();
  const mockLogout = jest.fn();
  const mockUpdateUser = jest.fn();
  const mockChangePassword = jest.fn();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up localStorage mock
    localStorage.setItem("token", "mock-token");

    // Mock context values
    useAuthContext.mockReturnValue({
      getProfile: mockGetProfile,
      logout: mockLogout,
    });

    useUserContext.mockReturnValue({
      updateUser: mockUpdateUser,
      changePassword: mockChangePassword,
    });

    useNavigate.mockReturnValue(mockNavigate);

    // Default successful profile fetch
    mockGetProfile.mockResolvedValue(mockProfileData);
  });

  describe("Initial Loading", () => {
    test("displays loading spinner initially", () => {
      render(<ProfilePage />);
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    test("displays profile data after successful load", async () => {
      render(<ProfilePage />);

      // Wait for loading spinner to disappear
      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      // Check if profile data is displayed correctly
      const usernameInput = screen.getByLabelText("username");
      const emailInput = screen.getByLabelText("email");
      const mobileInput = screen.getByLabelText("mobile");
      const roleInput = screen.getByLabelText("role");

      expect(usernameInput).toHaveValue("testuser");
      expect(emailInput).toHaveValue("test@example.com");
      expect(mobileInput).toHaveValue("1234567890");
      expect(roleInput).toHaveValue("user");
    });

    test("handles missing token error", async () => {
      localStorage.clear();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(
          screen.getByText("No authentication token found")
        ).toBeInTheDocument();
      });
    });

    test("handles API error", async () => {
      mockGetProfile.mockRejectedValueOnce(new Error("Network error"));
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    test("redirects to login on 401 error", async () => {
      mockGetProfile.mockRejectedValueOnce({ response: { status: 401 } });
      render(<ProfilePage />);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  describe("Profile Update", () => {
    test("allows updating profile information", async () => {
      render(<ProfilePage />);

      // Wait for profile data to load
      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      // Get form elements
      const usernameInput = screen.getByLabelText("username");
      const mobileInput = screen.getByLabelText("mobile");
      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });

      // Update form values
      await user.clear(usernameInput);
      await user.type(usernameInput, "newusername");
      await user.clear(mobileInput);
      await user.type(mobileInput, "9876543210");

      // Mock successful update
      mockUpdateUser.mockResolvedValueOnce({
        ...mockProfileData,
        username: "newusername",
        mobile: "9876543210",
      });

      // Submit form
      await user.click(submitButton);

      // Verify update call and new values
      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith("123", {
          username: "newusername",
          mobile: "9876543210",
        });
      });

      expect(usernameInput).toHaveValue("newusername");
      expect(mobileInput).toHaveValue("9876543210");
    });

    test("displays error when update fails", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      // Mock failed update
      mockUpdateUser.mockRejectedValueOnce(new Error("Update failed"));

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(
          screen.getByText("Failed to update profile")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Password Change", () => {
    test("allows changing password with valid inputs", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      // Get password form elements
      const oldPasswordInput = screen.getByLabelText("current password");
      const newPasswordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password"
      );
      const submitButton = screen.getByRole("button", {
        name: /^change password$/i,
      });

      // Fill in password form
      await user.type(oldPasswordInput, "oldpass123");
      await user.type(newPasswordInput, "newpass123");
      await user.type(confirmPasswordInput, "newpass123");

      // Mock successful password change
      mockChangePassword.mockResolvedValueOnce();

      // Submit password form
      await user.click(submitButton);

      // Verify password change call
      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith(
          "oldpass123",
          "newpass123"
        );
      });

      // Verify success message
      expect(toast.success).toHaveBeenCalledWith(
        "Password changed successfully!",
        expect.any(Object)
      );

      // Verify fields are cleared
      expect(oldPasswordInput).toHaveValue("");
      expect(newPasswordInput).toHaveValue("");
      expect(confirmPasswordInput).toHaveValue("");
    });

    test("shows error when passwords do not match", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      // Get password form elements
      const newPasswordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password"
      );
      const submitButton = screen.getByRole("button", {
        name: /^change password$/i,
      });

      // Fill in password form with different passwords
      await user.type(newPasswordInput, "newpass123");
      await user.type(confirmPasswordInput, "different123");

      // Submit password form
      await user.click(submitButton);

      // Verify error message
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    test("shows error when new password is too short", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      // Get password form elements
      const newPasswordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password"
      );
      const submitButton = screen.getByRole("button", {
        name: /^change password$/i,
      });

      // Fill in password form with short password
      await user.type(newPasswordInput, "short");
      await user.type(confirmPasswordInput, "short");

      // Submit password form
      await user.click(submitButton);

      // Verify error message
      expect(
        screen.getByText("Password must be at least 8 characters long")
      ).toBeInTheDocument();
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    test("handles password change API error", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      // Get password form elements
      const oldPasswordInput = screen.getByLabelText("current password");
      const newPasswordInput = screen.getByLabelText("New Password");
      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password"
      );
      const submitButton = screen.getByRole("button", {
        name: /^change password$/i,
      });

      // Fill in password form
      await user.type(oldPasswordInput, "oldpass123");
      await user.type(newPasswordInput, "newpass123");
      await user.type(confirmPasswordInput, "newpass123");

      // Mock failed password change
      mockChangePassword.mockRejectedValueOnce(
        new Error("Invalid current password")
      );

      // Submit password form
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(
          screen.getByText("Failed to change password")
        ).toBeInTheDocument();
      });
    });
  });
});
