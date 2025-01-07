// src/Test/Pages/ProfilePage.test.js
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
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

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText(/username/i)).toHaveValue("testuser");
      expect(screen.getByLabelText(/email/i)).toHaveValue("test@example.com");
      expect(screen.getByLabelText(/mobile/i)).toHaveValue("1234567890");
      expect(screen.getByLabelText(/role/i)).toHaveValue("user");
    });

    test("handles missing token error", async () => {
      localStorage.clear();
      render(<ProfilePage />);

      await waitFor(() => {
        const errorMessage = screen.getByText("No authentication token found");
        expect(errorMessage).toBeInTheDocument();
      });
    });

    test("handles API error", async () => {
      mockGetProfile.mockRejectedValueOnce(new Error("Failed to fetch"));
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(/Network error/i);
      });
    });

    test("redirects to login on 401 error", async () => {
      mockGetProfile.mockRejectedValueOnce({
        response: { status: 401 },
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("Profile Update", () => {
    test("allows updating profile information", async () => {
      render(<ProfilePage />);
      await waitFor(() =>
        expect(screen.queryByRole("status")).not.toBeInTheDocument()
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const mobileInput = screen.getByLabelText(/mobile/i);
      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });

      await user.clear(usernameInput);
      await user.type(usernameInput, "newusername");
      await user.clear(mobileInput);
      await user.type(mobileInput, "9876543210");

      mockUpdateUser.mockResolvedValueOnce({
        ...mockProfileData,
        username: "newusername",
        mobile: "9876543210",
      });

      await user.click(submitButton);

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
      await waitFor(() =>
        expect(screen.queryByRole("status")).not.toBeInTheDocument()
      );

      mockUpdateUser.mockRejectedValueOnce(new Error("Update failed"));

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to update profile/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Password Change", () => {
    test("allows changing password with valid inputs", async () => {
      render(<ProfilePage />);
      await waitFor(() =>
        expect(screen.queryByRole("status")).not.toBeInTheDocument()
      );

      const oldPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password/i);
      const confirmPasswordInput =
        screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole("button", {
        name: /^change password$/i,
      });

      await user.type(oldPasswordInput, "oldpass123");
      await user.type(newPasswordInput, "newpass123");
      await user.type(confirmPasswordInput, "newpass123");

      mockChangePassword.mockResolvedValueOnce();

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith(
          "oldpass123",
          "newpass123"
        );
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Password changed successfully!",
        expect.any(Object)
      );
      // Fields should be cleared
      expect(oldPasswordInput).toHaveValue("");
      expect(newPasswordInput).toHaveValue("");
      expect(confirmPasswordInput).toHaveValue("");
    });

    test("shows error when passwords do not match", async () => {
      render(<ProfilePage />);
      await waitFor(() =>
        expect(screen.queryByRole("status")).not.toBeInTheDocument()
      );

      const newPasswordInput = screen.getByLabelText(/^new password/i);
      const confirmPasswordInput =
        screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole("button", {
        name: /^change password$/i,
      });

      await user.type(newPasswordInput, "newpass123");
      await user.type(confirmPasswordInput, "different123");
      await user.click(submitButton);

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    test("shows error when new password is too short", async () => {
      render(<ProfilePage />);
      await waitFor(() =>
        expect(screen.queryByRole("status")).not.toBeInTheDocument()
      );

      const newPasswordInput = screen.getByLabelText(/^new password/i);
      const confirmPasswordInput =
        screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole("button", {
        name: /^change password$/i,
      });

      await user.type(newPasswordInput, "short");
      await user.type(confirmPasswordInput, "short");
      await user.click(submitButton);

      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    test("handles password change API error", async () => {
      render(<ProfilePage />);
      await waitFor(() =>
        expect(screen.queryByRole("status")).not.toBeInTheDocument()
      );

      const oldPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password/i);
      const confirmPasswordInput =
        screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole("button", {
        name: /^change password$/i,
      });

      await user.type(oldPasswordInput, "oldpass123");
      await user.type(newPasswordInput, "newpass123");
      await user.type(confirmPasswordInput, "newpass123");

      mockChangePassword.mockRejectedValueOnce(
        new Error("Invalid current password")
      );

      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to change password/i)
        ).toBeInTheDocument();
      });
    });
  });
});
