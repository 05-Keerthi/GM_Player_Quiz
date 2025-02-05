import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, useParams, useNavigate } from "react-router-dom";
import { useTenantContext } from "../../context/TenantContext";
import TenantDetailsPage from "../../pages/TenantDetailsPage";
import { toast } from "react-toastify";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("../../context/TenantContext", () => ({
  useTenantContext: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock components
jest.mock("../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="mock-navbar">Mock Navbar</div>;
  };
});

jest.mock("../../models/Tenant/TenantModal", () => {
  return function MockTenantModal({ isOpen, ...props }) {
    if (!isOpen) return null;
    return (
      <div data-testid="edit-tenant-modal" {...props}>
        Edit Modal
      </div>
    );
  };
});

jest.mock("../../models/Tenant/TenantAdminModal", () => {
  return function MockTenantAdminModal({ isOpen, ...props }) {
    if (!isOpen) return null;
    return (
      <div data-testid="tenant-admin-modal" {...props}>
        Admin Modal
      </div>
    );
  };
});

jest.mock("../../models/ConfirmationModal", () => {
  return function MockConfirmationModal({ isOpen, onConfirm, ...props }) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirmation-modal" {...props}>
        Confirmation Modal
        <button data-testid="confirm-delete-button" onClick={onConfirm}>
          Confirm Delete
        </button>
      </div>
    );
  };
});

const mockTenant = {
  _id: "123",
  name: "Test Tenant",
  logo: "test-logo.png",
  customDomain: "test.domain.com",
  description: "Test Description",
  email: ["test@test.com"],
  mobileNumber: ["1234567890"],
  plan: "Premium",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const mockAdmins = [
  {
    _id: "admin1",
    username: "Admin One",
    email: "admin1@test.com",
  },
  {
    _id: "admin2",
    username: "Admin Two",
    email: "admin2@test.com",
  },
];

const TestWrapper = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

describe("TenantDetailsPage", () => {
  const user = userEvent.setup();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    useParams.mockReturnValue({ id: "123" });
    useNavigate.mockReturnValue(mockNavigate);
    useTenantContext.mockReturnValue({
      getTenantById: jest.fn().mockResolvedValue(mockTenant),
      getTenantAdmins: jest.fn().mockResolvedValue(mockAdmins),
      deleteTenantAdmin: jest.fn().mockResolvedValue(),
      error: null,
      loading: false,
      clearError: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (component) => {
    return render(component, { wrapper: TestWrapper });
  };

  describe("Loading and Initial Render", () => {
    test("displays loading spinner when loading is true", () => {
      useTenantContext.mockReturnValue({
        ...useTenantContext(),
        loading: true,
      });

      renderWithRouter(<TenantDetailsPage />);
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    test("renders all sections of tenant details", async () => {
      renderWithRouter(<TenantDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tenant-details-page")).toBeInTheDocument();
      });

      expect(screen.getByTestId("company-details")).toBeInTheDocument();
      expect(screen.getByTestId("contact-info")).toBeInTheDocument();
      expect(screen.getByTestId("additional-info")).toBeInTheDocument();
    });
  });

  describe("Contact Information Display", () => {
    test("displays email addresses correctly", async () => {
      renderWithRouter(<TenantDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tenant-email-0")).toHaveTextContent(
          "test@test.com"
        );
      });
    });

    test("displays mobile numbers correctly", async () => {
      renderWithRouter(<TenantDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId("tenant-mobile-0")).toHaveTextContent(
          "1234567890"
        );
      });
    });

    test("shows placeholder when no contact information is available", async () => {
      const tenantWithNoContacts = {
        ...mockTenant,
        email: [],
        mobileNumber: [],
      };

      useTenantContext.mockReturnValue({
        ...useTenantContext(),
        getTenantById: jest.fn().mockResolvedValue(tenantWithNoContacts),
      });

      renderWithRouter(<TenantDetailsPage />);

      await waitFor(() => {
        expect(
          screen.getByText("No email addresses available")
        ).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(
          screen.getByText("No mobile numbers available")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Description Handling", () => {
    test("handles description expansion correctly", async () => {
      const longDescription = "A".repeat(200);
      const tenantWithLongDesc = {
        ...mockTenant,
        description: longDescription,
      };

      useTenantContext.mockReturnValue({
        ...useTenantContext(),
        getTenantById: jest.fn().mockResolvedValue(tenantWithLongDesc),
      });

      renderWithRouter(<TenantDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText("View more")).toBeInTheDocument();
      });

      await user.click(screen.getByText("View more"));
      expect(screen.getByText("View less")).toBeInTheDocument();
    });
  });

  describe("Admin Management", () => {
    test("handles admin deletion process", async () => {
      const deleteTenantAdmin = jest.fn().mockResolvedValue();
      useTenantContext.mockReturnValue({
        ...useTenantContext(),
        deleteTenantAdmin,
      });

      renderWithRouter(<TenantDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId("admins-list")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("delete-admin-button-admin1"));
      expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();

      await user.click(screen.getByTestId("confirm-delete-button"));
      expect(deleteTenantAdmin).toHaveBeenCalledWith("123", "admin1");
      expect(toast.success).toHaveBeenCalledWith("Admin deleted successfully");
    });

    test("displays no admins message when admin list is empty", async () => {
      useTenantContext.mockReturnValue({
        ...useTenantContext(),
        getTenantAdmins: jest.fn().mockResolvedValue([]),
      });

      renderWithRouter(<TenantDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId("no-admins-message")).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText("No admins found")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    test("handles tenant fetch error", async () => {
      const getTenantById = jest
        .fn()
        .mockRejectedValue(new Error("Failed to fetch"));
      useTenantContext.mockReturnValue({
        ...useTenantContext(),
        getTenantById,
      });

      renderWithRouter(<TenantDetailsPage />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to fetch tenant details"
        );
      });
    });

    test("handles admin deletion error", async () => {
      const deleteTenantAdmin = jest
        .fn()
        .mockRejectedValue(new Error("Failed to delete"));
      useTenantContext.mockReturnValue({
        ...useTenantContext(),
        deleteTenantAdmin,
      });

      renderWithRouter(<TenantDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId("admins-list")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("delete-admin-button-admin1"));
      await user.click(screen.getByTestId("confirm-delete-button"));

      expect(toast.error).toHaveBeenCalledWith("Failed to delete admin");
    });
  });
});
