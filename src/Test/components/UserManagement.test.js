import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import UserManagement from "../../components/UserManagement";
import { useUserContext } from "../../context/userContext";
import { useAuthContext } from "../../context/AuthContext";

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
    username: "adminuser1",
    email: "admin1@example.com",
    mobile: "1234567890",
    role: "admin",
  },
  {
    _id: "2",
    username: "regularuser1",
    email: "user1@example.com",
    mobile: "0987654321",
    role: "user",
  },
  {
    _id: "3",
    username: "adminuser2",
    email: "admin2@example.com",
    mobile: "5555555555",
    role: "admin",
  },
];

describe("UserManagement", () => {
  const mockFetchUsers = jest.fn();
  const mockDeleteUser = jest.fn();
  const mockClearError = jest.fn();
  const mockFetchUserById = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useUserContext.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      fetchUsers: mockFetchUsers,
      deleteUser: mockDeleteUser,
      clearError: mockClearError,
      fetchUserById: mockFetchUserById,
    });

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

  test("renders separate admin and regular user tables", () => {
    render(<UserManagement />);

    expect(screen.getByText("Administrators")).toBeInTheDocument();
    expect(screen.getByText("Regular Users")).toBeInTheDocument();

    // Check if admin users are in admin section
    const adminTable = screen.getAllByRole("table")[0];
    expect(within(adminTable).getByText("adminuser1")).toBeInTheDocument();
    expect(within(adminTable).getByText("adminuser2")).toBeInTheDocument();

    // Check if regular users are in regular users section
    const userTable = screen.getAllByRole("table")[1];
    expect(within(userTable).getByText("regularuser1")).toBeInTheDocument();
  });

  test("admin search functionality filters admin users correctly", async () => {
    render(<UserManagement />);

    const adminSearchInput = screen.getByPlaceholderText(
      "Search Administrators"
    );
    await userEvent.type(adminSearchInput, "admin1");

    const adminTable = screen.getAllByRole("table")[0];
    expect(within(adminTable).getByText("adminuser1")).toBeInTheDocument();
    expect(
      within(adminTable).queryByText("adminuser2")
    ).not.toBeInTheDocument();
  });

  test("user search functionality filters regular users correctly", async () => {
    render(<UserManagement />);

    const userSearchInput = screen.getByPlaceholderText("Search Users");
    await userEvent.type(userSearchInput, "regularuser1");

    const userTable = screen.getAllByRole("table")[1];
    expect(within(userTable).getByText("regularuser1")).toBeInTheDocument();
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

    const deleteButton = within(screen.getAllByRole("table")[0]).getAllByTestId(
      "delete-icon"
    )[0];
    fireEvent.click(deleteButton);

    // Check for the exact confirmation message
    expect(
      screen.getByText(
        'Are you sure you want to delete the user "adminuser1"? This action cannot be undone.'
      )
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith("1");
    });

    await waitFor(() => {
      expect(mockFetchUsers).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "User deleted successfully!",
        expect.any(Object)
      );
    });
  });

  test("handles edit user click", async () => {
    render(<UserManagement />);

    // First verify the EditUserModal is not initially visible
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const editButton = within(screen.getAllByRole("table")[0]).getAllByTestId(
      "edit-icon"
    )[0];
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockFetchUserById).toHaveBeenCalledWith("1");
    });

    // Add a small delay to allow the modal to appear
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Now check if the EditUserModal is open
    expect(screen.getByTestId("edit-user-modal")).toBeInTheDocument();
  });

  test("hides action buttons for non-admin users", () => {
    useAuthContext.mockReturnValue({
      user: { role: "user" },
    });

    render(<UserManagement />);

    expect(screen.queryByTestId("edit-icon")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-icon")).not.toBeInTheDocument();
  });

  test("shows no users message when both user lists are empty", () => {
    useUserContext.mockReturnValue({
      ...useUserContext(),
      users: [],
    });

    render(<UserManagement />);
    const noUsersMessages = screen.getAllByText("No users found");
    expect(noUsersMessages).toHaveLength(2); // One for each table
  });

  test("pagination controls work correctly for admin users", async () => {
    const manyAdminUsers = Array.from({ length: 7 }, (_, i) => ({
      _id: String(i),
      username: `adminuser${i}`,
      email: `admin${i}@example.com`,
      mobile: String(i).repeat(10),
      role: "admin",
    }));

    useUserContext.mockReturnValue({
      ...useUserContext(),
      users: manyAdminUsers,
    });

    render(<UserManagement />);

    const adminTable = screen.getAllByRole("table")[0];
    const initialRows = within(adminTable).getAllByRole("row");
    expect(initialRows.length).toBe(6); // 5 users + 1 header row

    expect(screen.getByText("adminuser0")).toBeInTheDocument();
    expect(screen.getByText("adminuser4")).toBeInTheDocument();
    expect(screen.queryByText("adminuser5")).not.toBeInTheDocument();

    const page2Button = screen.getByRole("button", { name: "2" });
    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(screen.queryByText("adminuser0")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("adminuser5")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("adminuser6")).toBeInTheDocument();
    });
  });
});
