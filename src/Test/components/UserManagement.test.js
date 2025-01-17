import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import UserManagement from "../../components/UserManagement";
import { useUserContext } from "../../context/userContext";
import { useAuthContext } from "../../context/AuthContext";

// Mock the required dependencies
jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("../../context/userContext");
jest.mock("../../context/AuthContext");
jest.mock("lucide-react", () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  Pencil: () => <div data-testid="edit-icon">Edit</div>,
  Trash2: () => <div data-testid="delete-icon">Delete</div>,
}));

const mockUsers = [
  {
    _id: "1",
    username: "testuser1",
    email: "test1@example.com",
    mobile: "1234567890",
    role: "user",
  },
  {
    _id: "2",
    username: "testuser2",
    email: "test2@example.com",
    mobile: "0987654321",
    role: "admin",
  },
];

describe("UserManagement", () => {
  const mockFetchUsers = jest.fn();
  const mockDeleteUser = jest.fn();
  const mockClearError = jest.fn();
  const mockFetchUserById = jest.fn();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock UserContext
    useUserContext.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      deleteUser: mockDeleteUser,
      clearError: mockClearError,
      fetchUserById: mockFetchUserById,
    });

    // Mock AuthContext with tenant_admin role by default
    useAuthContext.mockReturnValue({
      user: { role: "tenant_admin" },
    });
  });

  test("renders loading spinner when loading", () => {
    useUserContext.mockReturnValue({
      ...useUserContext(),
      loading: true,
    });

    render(<UserManagement />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("renders user table with correct data", () => {
    render(<UserManagement />);

    // Check if table headers are present
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Mobile Number")).toBeInTheDocument();
    expect(screen.getByText("User Role")).toBeInTheDocument();

    // Check if user data is displayed
    expect(screen.getByText("testuser1")).toBeInTheDocument();
    expect(screen.getByText("test1@example.com")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
  });

  test("search functionality filters users correctly", async () => {
    render(<UserManagement />);

    const searchInput = screen.getByPlaceholderText("Search User");
    await userEvent.type(searchInput, "testuser1");

    expect(screen.getByText("testuser1")).toBeInTheDocument();
    expect(screen.queryByText("testuser2")).not.toBeInTheDocument();
  });

  test("shows error toast when error occurs", () => {
    const errorMessage = "Failed to fetch users";
    useUserContext.mockReturnValue({
      ...useUserContext(),
      error: errorMessage,
    });

    render(<UserManagement />);
    expect(toast.error).toHaveBeenCalledWith(errorMessage, expect.any(Object));
  });

  test("handles user deletion", async () => {
    render(<UserManagement />);

    // Find and click delete button for first user
    const deleteButtons = screen.getAllByTestId("delete-icon");
    fireEvent.click(deleteButtons[0].parentElement);

    // Check if confirmation modal appears
    expect(
      screen.getByText(/Are you sure you want to delete/)
    ).toBeInTheDocument();

    // Confirm deletion
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith("1");
      expect(mockFetchUsers).toHaveBeenCalled();
    });
  });

  test("handles edit user click", async () => {
    render(<UserManagement />);

    // Find and click edit button for first user
    const editButtons = screen.getAllByTestId("edit-icon");
    fireEvent.click(editButtons[0].parentElement);

    await waitFor(() => {
      expect(mockFetchUserById).toHaveBeenCalledWith("1");
    });
  });

  test("hides action buttons for non-admin users", () => {
    useAuthContext.mockReturnValue({
      user: { role: "user" },
    });

    render(<UserManagement />);

    expect(screen.queryByTestId("edit-icon")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-icon")).not.toBeInTheDocument();
  });

  test("shows no users message when user list is empty", () => {
    useUserContext.mockReturnValue({
      ...useUserContext(),
      users: [],
    });

    render(<UserManagement />);
    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  test("pagination controls are shown and work correctly with more than 5 users", async () => {
    // Create array of 7 users (more than the usersPerPage limit of 5)
    const manyUsers = Array.from({ length: 7 }, (_, i) => ({
      _id: String(i),
      username: `user${i}`,
      email: `user${i}@example.com`,
      mobile: String(i).repeat(10),
      role: "user",
    }));

    useUserContext.mockReturnValue({
      ...useUserContext(),
      users: manyUsers,
    });

    render(<UserManagement />);

    // Check if only 5 users are displayed initially (plus header row)
    const initialRows = screen.getAllByRole("row");
    expect(initialRows.length).toBe(6); // 5 users + 1 header row

    // Verify first and last visible users
    expect(screen.getByText("user0")).toBeInTheDocument();
    expect(screen.getByText("user4")).toBeInTheDocument();
    expect(screen.queryByText("user5")).not.toBeInTheDocument();

    // Verify pagination component is rendered
    const pageNumbers = screen.getByText("1");
    expect(pageNumbers).toBeInTheDocument();

    // Get second page button by role and number
    const page2Button = screen.getByRole("button", { name: "2" });
    expect(page2Button).toBeInTheDocument();

    // Click to go to second page
    fireEvent.click(page2Button);

    // Verify the users on second page
    await waitFor(() => {
      expect(screen.queryByText("user0")).not.toBeInTheDocument();
      expect(screen.getByText("user5")).toBeInTheDocument();
      expect(screen.getByText("user6")).toBeInTheDocument();
    });
  });
});
