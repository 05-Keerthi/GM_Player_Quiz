import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "../../pages/ProfilePage";
import { useAuthContext } from "../../context/AuthContext";
import { useUserContext } from "../../context/userContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Mock the required hooks and modules
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("../../context/AuthContext", () => ({
  useAuthContext: jest.fn(),
}));

jest.mock("../../context/userContext", () => ({
  useUserContext: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
  },
}));

// Mock FontAwesome components
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: ({ "data-testid": testId }) => <div data-testid={testId} />,
}));

jest.mock("../../components/NavbarComp", () => {
  return function MockedNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

describe("ProfilePage", () => {
  const mockNavigate = jest.fn();
  const mockUser = {
    id: "123",
    _id: "123",
    username: "testuser",
    email: "test@example.com",
    mobile: "1234567890",
    role: "user",
  };

  const mockFetchUserById = jest.fn();
  const mockUpdateUser = jest.fn();
  const mockChangePassword = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { id: "123" },
      logout: mockLogout,
    });
    useUserContext.mockReturnValue({
      fetchUserById: mockFetchUserById,
      updateUser: mockUpdateUser,
      changePassword: mockChangePassword,
    });

    // Reset all mocks before each test
    mockNavigate.mockClear();
    mockFetchUserById.mockClear();
    mockUpdateUser.mockClear();
    mockChangePassword.mockClear();
    mockLogout.mockClear();
    toast.success.mockClear();

    // Setup initial user data
    mockFetchUserById.mockResolvedValue(mockUser);
  });

  // Existing tests remain the same...
  it("renders loading spinner initially", () => {
    mockFetchUserById.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<ProfilePage />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders user profile data when loaded", async () => {
    mockFetchUserById.mockResolvedValue(mockUser);

    render(<ProfilePage />);

    await waitFor(() =>
      expect(screen.getByLabelText("username")).toHaveValue("testuser")
    );
    await waitFor(() =>
      expect(screen.getByLabelText("email")).toHaveValue("test@example.com")
    );
    await waitFor(() =>
      expect(screen.getByLabelText("mobile")).toHaveValue("1234567890")
    );
    await waitFor(() =>
      expect(screen.getByLabelText("role")).toHaveValue("user")
    );
  });

  it("handles profile update successfully", async () => {
    const user = userEvent.setup();
    mockFetchUserById.mockResolvedValue(mockUser);
    mockUpdateUser.mockResolvedValue({
      ...mockUser,
      username: "newusername",
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText("username")).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText("username");
    await user.clear(usernameInput);
    await user.type(usernameInput, "newusername");

    const saveButton = screen.getByText("Save Changes");
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith("123", {
        username: "newusername",
        mobile: "1234567890",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Profile updated successfully!",
        expect.any(Object)
      );
    });
  });

  it("handles password change successfully", async () => {
    const user = userEvent.setup();
    mockFetchUserById.mockResolvedValue(mockUser);
    mockChangePassword.mockResolvedValue({});

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText("current password")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("current password"), "oldpass123");
    await user.type(screen.getByLabelText("New Password"), "newpass123");
    await user.type(
      screen.getByLabelText("Confirm New Password"),
      "newpass123"
    );

    const changePasswordButton = screen.getByRole("button", {
      name: "Change Password",
    });
    await user.click(changePasswordButton);

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
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    mockFetchUserById.mockResolvedValue(mockUser);

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("current password"), "oldpass123");
    await user.type(screen.getByLabelText("New Password"), "newpass123");
    await user.type(
      screen.getByLabelText("Confirm New Password"),
      "differentpass"
    );

    const changePasswordButton = screen.getByRole("button", {
      name: "Change Password",
    });
    await user.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("redirects to login when user is not authenticated", async () => {
    // Setup authenticated state initially
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { id: "123" },
      logout: mockLogout,
    });

    // Mock fetchUserById to throw a 401 error
    mockFetchUserById.mockRejectedValue({
      response: {
        status: 401,
      },
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("handles fetch user error", async () => {
    mockFetchUserById.mockRejectedValue(new Error("Failed to fetch user"));

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Error:")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch user")).toBeInTheDocument();
    });
  });

  describe("Password Toggle Functionality", () => {
    it("toggles visibility for current password", async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("current password")).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText("current password");
      const toggleButton = screen.getByTestId("toggle-current-password");

      // Initially password should be hidden
      expect(currentPasswordInput).toHaveAttribute("type", "password");

      // Click toggle button
      await user.click(toggleButton);
      expect(currentPasswordInput).toHaveAttribute("type", "text");

      // Click toggle button again
      await user.click(toggleButton);
      expect(currentPasswordInput).toHaveAttribute("type", "password");
    });

    it("toggles visibility for new password", async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("New Password")).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText("New Password");
      const toggleButton = screen.getByTestId("toggle-new-password");

      expect(newPasswordInput).toHaveAttribute("type", "password");
      await user.click(toggleButton);
      expect(newPasswordInput).toHaveAttribute("type", "text");
      await user.click(toggleButton);
      expect(newPasswordInput).toHaveAttribute("type", "password");
    });

    it("toggles visibility for confirm password", async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("Confirm New Password")
        ).toBeInTheDocument();
      });

      const confirmPasswordInput = screen.getByLabelText(
        "Confirm New Password"
      );
      const toggleButton = screen.getByTestId("toggle-confirm-password");

      expect(confirmPasswordInput).toHaveAttribute("type", "password");
      await user.click(toggleButton);
      expect(confirmPasswordInput).toHaveAttribute("type", "text");
      await user.click(toggleButton);
      expect(confirmPasswordInput).toHaveAttribute("type", "password");
    });

    it("maintains password value when toggling visibility", async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("current password")).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText("current password");
      const toggleButton = screen.getByTestId("toggle-current-password");

      // Type a password
      await user.type(currentPasswordInput, "mypassword123");
      expect(currentPasswordInput).toHaveValue("mypassword123");

      // Toggle visibility
      await user.click(toggleButton);
      expect(currentPasswordInput).toHaveValue("mypassword123");
      expect(currentPasswordInput).toHaveAttribute("type", "text");

      // Toggle back
      await user.click(toggleButton);
      expect(currentPasswordInput).toHaveValue("mypassword123");
      expect(currentPasswordInput).toHaveAttribute("type", "password");
    });

    it("shows toggle buttons for all password fields", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("current password")).toBeInTheDocument();
      });

      // Check if all three password fields have toggle buttons
      expect(screen.getByTestId("toggle-current-password")).toBeInTheDocument();
      expect(screen.getByTestId("toggle-new-password")).toBeInTheDocument();
      expect(screen.getByTestId("toggle-confirm-password")).toBeInTheDocument();
    });

    it("shows appropriate icons for password visibility states", async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText("current password")).toBeInTheDocument();
      });

      // Test each password field's icon state
      const passwordFields = [
        {
          toggleId: "toggle-current-password",
          iconId: "current-password-icon",
        },
        {
          toggleId: "toggle-new-password",
          iconId: "new-password-icon",
        },
        {
          toggleId: "toggle-confirm-password",
          iconId: "confirm-password-icon",
        },
      ];

      for (const field of passwordFields) {
        const toggleButton = screen.getByTestId(field.toggleId);
        expect(screen.getByTestId(field.iconId)).toBeInTheDocument();

        // Check icon state changes on toggle
        await user.click(toggleButton);
        expect(screen.getByTestId(field.iconId)).toBeInTheDocument();
      }
    });
  });
});
