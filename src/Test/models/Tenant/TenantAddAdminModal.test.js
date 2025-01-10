import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TenantAddAdminModal from "../../../models/Tenant/TenantAddAdminModal";
import { useTenantContext } from "../../../context/TenantContext";
import { toast } from "react-toastify";

// Mock the dependencies
jest.mock("../../../context/TenantContext");
jest.mock("react-toastify");
jest.mock("react-phone-number-input", () => {
  return function PhoneInput({ value, onChange, className }) {
    return (
      <input
        data-testid="phone-input"
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        aria-label="Mobile number"
      />
    );
  };
});

describe("TenantAddAdminModal", () => {
  const mockTenant = {
    _id: "tenant123",
  };

  const mockRegisterTenantAdmin = jest.fn();
  const mockGetTenantAdmins = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    useTenantContext.mockReturnValue({
      registerTenantAdmin: mockRegisterTenantAdmin,
      getTenantAdmins: mockGetTenantAdmins,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    render(
      <TenantAddAdminModal
        isOpen={false}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    expect(screen.queryByText("Add Tenant Admin")).not.toBeInTheDocument();
  });

  it("should render form fields when isOpen is true", () => {
    render(
      <TenantAddAdminModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    expect(screen.getByText("Add Tenant Admin")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /username/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByTestId("phone-input")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /role/i })).toBeInTheDocument();
  });

  it("should handle input changes", async () => {
    render(
      <TenantAddAdminModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    const usernameInput = screen.getByRole("textbox", { name: /username/i });
    const emailInput = screen.getByRole("textbox", { name: /email/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const phoneInput = screen.getByTestId("phone-input");
    const roleSelect = screen.getByRole("combobox", { name: /role/i });

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(phoneInput, "+1234567890");
    await userEvent.selectOptions(roleSelect, "admin");

    expect(usernameInput).toHaveValue("testuser");
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
    expect(phoneInput).toHaveValue("+1234567890");
    expect(roleSelect).toHaveValue("admin");
  });

  it("should handle successful form submission", async () => {
    mockRegisterTenantAdmin.mockResolvedValueOnce();
    mockGetTenantAdmins.mockResolvedValueOnce();

    render(
      <TenantAddAdminModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    await userEvent.type(
      screen.getByRole("textbox", { name: /username/i }),
      "testuser"
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: /email/i }),
      "test@example.com"
    );
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.type(screen.getByTestId("phone-input"), "+1234567890");

    const submitButton = screen.getByRole("button", { name: /add admin/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegisterTenantAdmin).toHaveBeenCalledWith("tenant123", {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        mobile: "+1234567890",
        role: "tenant_admin",
      });
      expect(toast.success).toHaveBeenCalledWith("Admin added successfully!");
      expect(mockGetTenantAdmins).toHaveBeenCalledWith("tenant123");
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
    mockRegisterTenantAdmin.mockRejectedValueOnce(mockError);

    render(
      <TenantAddAdminModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    await userEvent.type(
      screen.getByRole("textbox", { name: /email/i }),
      "invalid-email"
    );

    const submitButton = screen.getByRole("button", { name: /add admin/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("email: Invalid email");
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it("should handle cancel button click", () => {
    render(
      <TenantAddAdminModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should disable submit button while loading", async () => {
    mockRegisterTenantAdmin.mockImplementationOnce(() => new Promise(() => {}));

    render(
      <TenantAddAdminModal
        isOpen={true}
        onClose={mockOnClose}
        tenant={mockTenant}
      />
    );

    const submitButton = screen.getByRole("button", { name: /add admin/i });
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Adding...")).toBeInTheDocument();
  });
});
