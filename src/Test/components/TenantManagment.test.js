import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTenantContext } from "../../context/TenantContext";
import TenantManagement from "../../components/TenantManagement";

// Mock the required dependencies
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  Pencil: () => <div data-testid="edit-icon">Edit</div>,
  Trash2: () => <div data-testid="delete-icon">Delete</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
}));

jest.mock("../../context/TenantContext");

// Mock the modal components
jest.mock("../../models/Tenant/TenantModal", () => {
  return function MockTenantModal({ isOpen, onClose, tenant }) {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-label="Tenant Modal">
        <h2>{tenant ? "Edit Tenant" : "Create Tenant"}</h2>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock("../../models/ConfirmationModal", () => {
  return function MockConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
  }) {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-label="Confirmation Modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  };
});

describe("TenantManagement", () => {
  const mockNavigate = jest.fn();
  const mockGetAllTenants = jest.fn();
  const mockDeleteTenant = jest.fn();
  const mockClearError = jest.fn();

  const mockTenants = [
    {
      _id: "1",
      name: "Test Tenant 1",
      customDomain: "test1.com",
      logo: "test1.jpg",
    },
    {
      _id: "2",
      name: "Test Tenant 2",
      customDomain: "test2.com",
      logo: "test2.jpg",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useTenantContext.mockReturnValue({
      state: { tenants: mockTenants },
      getAllTenants: mockGetAllTenants,
      deleteTenant: mockDeleteTenant,
      clearError: mockClearError,
      loading: false,
      error: null,
    });
  });

  test("renders tenant list correctly", () => {
    render(<TenantManagement />);

    expect(screen.getByText("Test Tenant 1")).toBeInTheDocument();
    expect(screen.getByText("Test Tenant 2")).toBeInTheDocument();
    expect(screen.getByText("test1.com")).toBeInTheDocument();
    expect(screen.getByText("test2.com")).toBeInTheDocument();
  });

  test("handles tenant row click navigation", () => {
    render(<TenantManagement />);

    const tenantName = screen.getByText("Test Tenant 1");
    fireEvent.click(tenantName);

    expect(mockNavigate).toHaveBeenCalledWith("/tenants/1");
  });

  test("handles search functionality", async () => {
    render(<TenantManagement />);

    const searchInput = screen.getByRole("textbox", { name: /search tenant/i });
    await userEvent.type(searchInput, "Test Tenant 1");

    expect(screen.getByText("Test Tenant 1")).toBeInTheDocument();
    expect(screen.queryByText("Test Tenant 2")).not.toBeInTheDocument();
  });

  test("handles edit button click", () => {
    render(<TenantManagement />);

    const editButtons = screen.getAllByRole("button", { name: /edit tenant/i });
    fireEvent.click(editButtons[0]);

    expect(
      screen.getByRole("dialog", { name: /tenant modal/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Edit Tenant")).toBeInTheDocument();
  });

  test("handles delete tenant flow", async () => {
    mockDeleteTenant.mockResolvedValueOnce();
    render(<TenantManagement />);

    // Click delete button
    const deleteButtons = screen.getAllByRole("button", {
      name: /delete tenant/i,
    });
    fireEvent.click(deleteButtons[0]);

    // Verify confirmation modal
    expect(
      screen.getByRole("dialog", { name: /confirmation modal/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Delete Tenant")).toBeInTheDocument();

    // Confirm deletion
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteTenant).toHaveBeenCalledWith("1");
    });
    await waitFor(() => {
      expect(mockGetAllTenants).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Tenant deleted successfully!"
      );
    });
  });

  test("displays loading state", () => {
    useTenantContext.mockReturnValue({
      state: { tenants: [] },
      getAllTenants: mockGetAllTenants,
      loading: true,
      error: null,
      clearError: mockClearError,
    });

    render(<TenantManagement />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("displays empty state message", () => {
    useTenantContext.mockReturnValue({
      state: { tenants: [] },
      getAllTenants: mockGetAllTenants,
      loading: false,
      error: null,
      clearError: mockClearError,
    });

    render(<TenantManagement />);
    expect(screen.getByText("No tenants found")).toBeInTheDocument();
  });

  test("handles error state", () => {
    const error = "Failed to fetch tenants";
    useTenantContext.mockReturnValue({
      state: { tenants: [] },
      getAllTenants: mockGetAllTenants,
      loading: false,
      error,
      clearError: mockClearError,
    });

    render(<TenantManagement />);
    expect(toast.error).toHaveBeenCalledWith(error);
    expect(mockClearError).toHaveBeenCalled();
  });
  test("handles failed tenant deletion", async () => {
    // Mock deletion failure
    mockDeleteTenant.mockRejectedValueOnce(new Error("Deletion failed"));

    render(<TenantManagement />);

    // Click delete button
    const deleteButtons = screen.getAllByRole("button", {
      name: /delete tenant/i,
    });
    fireEvent.click(deleteButtons[0]);

    // Click confirm in modal
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to delete tenant");
    });
  });

  test("handles pagination", () => {
    // Mock many tenants to trigger pagination
    const manyTenants = Array.from({ length: 8 }, (_, i) => ({
      _id: String(i + 1),
      name: `Test Tenant ${i + 1}`,
      customDomain: `test${i + 1}.com`,
      logo: `test${i + 1}.jpg`,
    }));

    useTenantContext.mockReturnValue({
      state: { tenants: manyTenants },
      getAllTenants: mockGetAllTenants,
      deleteTenant: mockDeleteTenant,
      clearError: mockClearError,
      loading: false,
      error: null,
    });

    render(<TenantManagement />);

    // First page should show first 5 tenants
    expect(screen.getByText("Test Tenant 1")).toBeInTheDocument();
    expect(screen.getByText("Test Tenant 5")).toBeInTheDocument();
    expect(screen.queryByText("Test Tenant 6")).not.toBeInTheDocument();

    // Click next page
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    // Second page should show remaining tenants
    expect(screen.getByText("Test Tenant 6")).toBeInTheDocument();
    expect(screen.queryByText("Test Tenant 1")).not.toBeInTheDocument();
  });

  test("closes modals correctly", () => {
    render(<TenantManagement />);

    // Open and close delete confirmation modal
    const deleteButton = screen.getAllByRole("button", {
      name: /delete tenant/i,
    })[0];
    fireEvent.click(deleteButton);
    expect(
      screen.getByRole("dialog", { name: /confirmation modal/i })
    ).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open and close edit modal
    const editButton = screen.getAllByRole("button", {
      name: /edit tenant/i,
    })[0];
    fireEvent.click(editButton);
    expect(
      screen.getByRole("dialog", { name: /tenant modal/i })
    ).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("handles domain search", async () => {
    render(<TenantManagement />);

    const searchInput = screen.getByRole("textbox", { name: /search tenant/i });
    await userEvent.type(searchInput, "test1.com");

    expect(screen.getByText("Test Tenant 1")).toBeInTheDocument();
    expect(screen.queryByText("Test Tenant 2")).not.toBeInTheDocument();
  });

  test("initializes with empty search query", () => {
    render(<TenantManagement />);

    const searchInput = screen.getByRole("textbox", { name: /search tenant/i });
    expect(searchInput).toHaveValue("");
  });

  test("fetches tenants on mount", () => {
    render(<TenantManagement />);
    expect(mockGetAllTenants).toHaveBeenCalledTimes(1);
  });

  test("displays tenant images correctly", () => {
    render(<TenantManagement />);

    const tenantImages = screen.getAllByRole("img");
    expect(tenantImages).toHaveLength(2);
    expect(tenantImages[0]).toHaveAttribute("src", "test1.jpg");
    expect(tenantImages[0]).toHaveAttribute("alt", "Test Tenant 1");
  });

  test("domain links are displayed with correct styling", () => {
    render(<TenantManagement />);

    const domainLinks = screen.getByText("test1.com");
    expect(domainLinks).toHaveClass("text-blue-600");
  });
});
