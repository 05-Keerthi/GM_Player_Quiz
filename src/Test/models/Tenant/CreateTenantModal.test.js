import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { act } from "react-dom/test-utils";
import { toast } from "react-toastify";
import { useTenantContext } from "../../../context/TenantContext";
import CreateTenantModal from "../../../models/Tenant/CreateTenantModel";

// Mock dependencies
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../context/TenantContext", () => ({
  useTenantContext: jest.fn(),
}));

describe("CreateTenantModal", () => {
  const mockCreateTenant = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  const fillForm = (screen, values = {}) => {
    // Find inputs by their placeholder text or role
    const nameInput = screen.getByPlaceholderText("Enter tenant name");
    const domainInput = screen.getByPlaceholderText("e.g., tenant.example.com");
    const logoInput = screen.getByPlaceholderText("Enter logo URL");
    const themeSelect = screen.getByRole("combobox"); // for select element
    const fontInput = screen.getByPlaceholderText("e.g., Arial, sans-serif");

    // Find color inputs by their type
    const [primaryColorInput, secondaryColorInput] = screen.getAllByRole(
      "textbox",
      { type: "color" }
    );

    fireEvent.change(nameInput, {
      target: { name: "name", value: values.name || "Test Tenant" },
    });
    fireEvent.change(domainInput, {
      target: {
        name: "customDomain",
        value: values.customDomain || "test.example.com",
      },
    });
    fireEvent.change(logoInput, {
      target: {
        name: "logo",
        value: values.logo || "https://example.com/logo.png",
      },
    });
    fireEvent.change(themeSelect, {
      target: { name: "theme", value: values.theme || "light" },
    });
    fireEvent.change(primaryColorInput, {
      target: { name: "primaryColor", value: values.primaryColor || "#FF0000" },
    });
    fireEvent.change(secondaryColorInput, {
      target: {
        name: "secondaryColor",
        value: values.secondaryColor || "#00FF00",
      },
    });
    fireEvent.change(fontInput, {
      target: {
        name: "fontFamily",
        value: values.fontFamily || "Arial, sans-serif",
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useTenantContext.mockImplementation(() => ({
      createTenant: mockCreateTenant,
    }));
  });

  // Test 1: Modal Visibility
  test("should not render when isOpen is false", () => {
    render(<CreateTenantModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Create New Tenant")).not.toBeInTheDocument();
  });

  test("should render when isOpen is true", () => {
    render(<CreateTenantModal {...defaultProps} />);
    expect(screen.getByText("Create New Tenant")).toBeInTheDocument();
  });

  // Test 2: Form Fields Presence
  test("should render all form fields", () => {
    render(<CreateTenantModal {...defaultProps} />);

    // Text inputs
    expect(
      screen.getByPlaceholderText("Enter tenant name")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g., tenant.example.com")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter logo URL")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g., Arial, sans-serif")
    ).toBeInTheDocument();

    // Select input
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    const themeOptions = screen.getAllByRole("option");
    expect(themeOptions).toHaveLength(3); // Including the default "Select Theme" option

    // Color inputs
    const colorInputs = screen.getAllByDisplayValue("#000000");
    expect(colorInputs).toHaveLength(2);
    expect(colorInputs[0]).toHaveAttribute("type", "color");
    expect(colorInputs[1]).toHaveAttribute("type", "color");
  });

  // Test 3: Form Validation
  test("should show validation errors for required fields", async () => {
    mockCreateTenant.mockRejectedValueOnce({
      response: {
        data: {
          errors: [
            { field: "name", message: "Name is required" },
            { field: "customDomain", message: "Custom domain is required" },
          ],
        },
      },
    });

    render(<CreateTenantModal {...defaultProps} />);

    // Submit empty form
    fireEvent.click(screen.getByRole("button", { name: /create tenant/i }));

    await waitFor(() => {
      const errorMessages = screen.getAllByText((content, element) => {
        return (
          element.tagName.toLowerCase() === "p" &&
          element.className.includes("text-red-500")
        );
      });
      expect(errorMessages).toHaveLength(2);
    });

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Custom domain is required")).toBeInTheDocument();
    });
  });

  // Test 4: Form Submission Success
  test("should handle successful form submission", async () => {
    const expectedFormData = {
      name: "Test Tenant",
      customDomain: "test.example.com",
      theme: "light",
      primaryColor: "#FF0000",
      secondaryColor: "#00FF00",
      fontFamily: "Arial, sans-serif",
      logo: "https://example.com/logo.png",
    };

    mockCreateTenant.mockResolvedValueOnce({ success: true });

    render(<CreateTenantModal {...defaultProps} />);

    fillForm(screen, expectedFormData);

    fireEvent.click(screen.getByRole("button", { name: /create tenant/i }));

    await waitFor(() => {
      expect(mockCreateTenant).toHaveBeenCalledWith(expectedFormData);
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Tenant created successfully!"
      );
    });

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  // Test 5: Form Submission Error
  test("should handle form submission error", async () => {
    const error = {
      response: {
        data: {
          errors: [{ field: "name", message: "Name already exists" }],
        },
      },
    };

    mockCreateTenant.mockRejectedValueOnce(error);

    render(<CreateTenantModal {...defaultProps} />);

    fillForm(screen);

    fireEvent.click(screen.getByRole("button", { name: /create tenant/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("name: Name already exists");
    });

    await waitFor(() => {
      expect(screen.getByText("Name already exists")).toBeInTheDocument();
    });
  });

  // Test 6: Loading State
  test("should show loading state during submission", async () => {
    mockCreateTenant.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<CreateTenantModal {...defaultProps} />);

    fillForm(screen);

    fireEvent.click(screen.getByRole("button", { name: /create tenant/i }));

    expect(screen.getByText("Creating...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /creating\.\.\./i })
    ).toBeDisabled();
  });

  // Test 7: Form Reset
  test("should reset form after successful submission", async () => {
    mockCreateTenant.mockResolvedValueOnce({ success: true });

    render(<CreateTenantModal {...defaultProps} />);

    fillForm(screen);

    fireEvent.click(screen.getByRole("button", { name: /create tenant/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter tenant name")).toHaveValue("");
    });

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("e.g., tenant.example.com")
      ).toHaveValue("");
    });

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveValue("");
    });
  });

  // Test 8: Cancel Button
  test("should call onClose when cancel button is clicked", () => {
    render(<CreateTenantModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
