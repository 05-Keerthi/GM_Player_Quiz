import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TenantAdminEditModal from "../../../models/Tenant/TenantAdminEditModal";
import { useTenantContext } from "../../../context/TenantContext";
import { toast } from "react-toastify";

// Mock the dependencies
jest.mock("../../../context/TenantContext");
jest.mock("react-toastify");
jest.mock("react-phone-number-input", () => {
  return function PhoneInput({ value, onChange, className, id }) {
    return (
      <input
        data-testid="phone-input"
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        id={id}
        aria-label="Mobile number"
      />
    );
  };
});

describe("TenantAdminEditModal", () => {
  const mockAdmin = {
    _id: "admin123",
    username: "testadmin",
    email: "admin@test.com",
    mobile: "+1234567890",
    role: "tenant_admin",
  };

  const mockTenantId = "tenant123";
  const mockUpdateTenantAdmin = jest.fn();
  const mockGetTenantAdmins = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    useTenantContext.mockReturnValue({
      updateTenantAdmin: mockUpdateTenantAdmin,
      getTenantAdmins: mockGetTenantAdmins,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    render(
      <TenantAdminEditModal
        isOpen={false}
        onClose={mockOnClose}
        admin={mockAdmin}
        tenantId={mockTenantId}
      />
    );

    expect(screen.queryByText("Edit Tenant Admin")).not.toBeInTheDocument();
  });

  it("should not render when admin is null", () => {
    render(
      <TenantAdminEditModal
        isOpen={true}
        onClose={mockOnClose}
        admin={null}
        tenantId={mockTenantId}
      />
    );

    expect(screen.queryByText("Edit Tenant Admin")).not.toBeInTheDocument();
  });

  it("should populate form fields with admin data when opened", () => {
    render(
      <TenantAdminEditModal
        isOpen={true}
        onClose={mockOnClose}
        admin={mockAdmin}
        tenantId={mockTenantId}
      />
    );

    expect(screen.getByRole("textbox", { name: /username/i })).toHaveValue(
      mockAdmin.username
    );
    expect(screen.getByRole("textbox", { name: /email/i })).toHaveValue(
      mockAdmin.email
    );
    expect(screen.getByTestId("phone-input")).toHaveValue(mockAdmin.mobile);
    expect(screen.getByRole("combobox", { name: /role/i })).toHaveValue(
      mockAdmin.role
    );
  });

  it("should handle input changes", async () => {
    render(
      <TenantAdminEditModal
        isOpen={true}
        onClose={mockOnClose}
        admin={mockAdmin}
        tenantId={mockTenantId}
      />
    );

    const usernameInput = screen.getByRole("textbox", { name: /username/i });
    const emailInput = screen.getByRole("textbox", { name: /email/i });
    const phoneInput = screen.getByTestId("phone-input");
    const roleSelect = screen.getByRole("combobox", { name: /role/i });

    await userEvent.clear(usernameInput);
    await userEvent.type(usernameInput, "newusername");
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "newemail@test.com");
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, "+9876543210");
    await userEvent.selectOptions(roleSelect, "admin");

    expect(usernameInput).toHaveValue("newusername");
    expect(emailInput).toHaveValue("newemail@test.com");
    expect(phoneInput).toHaveValue("+9876543210");
    expect(roleSelect).toHaveValue("admin");
  });

  it("should handle successful form submission", async () => {
    mockUpdateTenantAdmin.mockResolvedValueOnce();
    mockGetTenantAdmins.mockResolvedValueOnce();

    render(
      <TenantAdminEditModal
        isOpen={true}
        onClose={mockOnClose}
        admin={mockAdmin}
        tenantId={mockTenantId}
      />
    );

    const emailInput = screen.getByRole("textbox", { name: /email/i });
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "newemail@test.com");

    const submitButton = screen.getByRole("button", { name: /update admin/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateTenantAdmin).toHaveBeenCalledWith(
        mockTenantId,
        mockAdmin._id,
        expect.objectContaining({
          email: "newemail@test.com",
        })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Admin updated successfully!");
    });

    await waitFor(() => {
      expect(mockGetTenantAdmins).toHaveBeenCalledWith(mockTenantId);
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should handle form submission errors", async () => {
    const mockError = {
      response: {
        data: {
          errors: [{ field: "email", message: "Invalid email" }],
        },
      },
    };
    mockUpdateTenantAdmin.mockRejectedValueOnce(mockError);

    render(
      <TenantAdminEditModal
        isOpen={true}
        onClose={mockOnClose}
        admin={mockAdmin}
        tenantId={mockTenantId}
      />
    );

    const emailInput = screen.getByRole("textbox", { name: /email/i });
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "invalid-email");

    const submitButton = screen.getByRole("button", { name: /update admin/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("email: Invalid email");
    });

    await waitFor(() => {
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it("should handle generic error message", async () => {
    const mockError = {
      response: {
        data: {
          message: "Server error occurred",
        },
      },
    };
    mockUpdateTenantAdmin.mockRejectedValueOnce(mockError);

    render(
      <TenantAdminEditModal
        isOpen={true}
        onClose={mockOnClose}
        admin={mockAdmin}
        tenantId={mockTenantId}
      />
    );

    const submitButton = screen.getByRole("button", { name: /update admin/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Server error occurred");
    });

    await waitFor(() => {
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it("should handle cancel button click", async () => {
    render(
      <TenantAdminEditModal
        isOpen={true}
        onClose={mockOnClose}
        admin={mockAdmin}
        tenantId={mockTenantId}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should disable buttons while loading", async () => {
    mockUpdateTenantAdmin.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(
      <TenantAdminEditModal
        isOpen={true}
        onClose={mockOnClose}
        admin={mockAdmin}
        tenantId={mockTenantId}
      />
    );

    const submitButton = screen.getByRole("button", { name: /update admin/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });

    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByText("Updating...")).toBeInTheDocument();
  });

  it("should reset errors when modal is closed and reopened", async () => {
    const mockError = {
      response: {
        data: {
          errors: [{ field: "email", message: "Invalid email" }],
        },
      },
    };
    mockUpdateTenantAdmin.mockRejectedValueOnce(mockError);

    const { rerender } = render(
      <TenantAdminEditModal
        isOpen={true}
        onClose={mockOnClose}
        admin={mockAdmin}
        tenantId={mockTenantId}
      />
    );

    const emailInput = screen.getByRole("textbox", { name: /email/i });
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "invalid-email");

    const submitButton = screen.getByRole("button", { name: /update admin/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
    });

    // Close and reopen the modal
    rerender(
      <TenantAdminEditModal
        isOpen={false}
        onClose={mockOnClose}
        admin={mockAdmin}
        tenantId={mockTenantId}
      />
    );

    rerender(
      <TenantAdminEditModal
        isOpen={true}
        onClose={mockOnClose}
        admin={mockAdmin}
        tenantId={mockTenantId}
      />
    );

    expect(screen.queryByText("Invalid email")).not.toBeInTheDocument();
  });

  it("should update form data when admin prop changes", async () => {
    const { rerender } = render(
      <TenantAdminEditModal
        isOpen={true}
        onClose={mockOnClose}
        admin={mockAdmin}
        tenantId={mockTenantId}
      />
    );

    const newAdmin = {
      ...mockAdmin,
      username: "newadmin",
      email: "newadmin@test.com",
    };

    rerender(
      <TenantAdminEditModal
        isOpen={true}
        onClose={mockOnClose}
        admin={newAdmin}
        tenantId={mockTenantId}
      />
    );

    expect(screen.getByRole("textbox", { name: /username/i })).toHaveValue(
      "newadmin"
    );
    expect(screen.getByRole("textbox", { name: /email/i })).toHaveValue(
      "newadmin@test.com"
    );
  });
});
