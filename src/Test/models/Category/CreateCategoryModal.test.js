import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import CreateCategoryModal from "../../../models/Category/CreateCategoryModal";
import { useCategoryContext } from "../../../context/categoryContext";

// Mock dependencies
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../context/categoryContext", () => ({
  useCategoryContext: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  X: () => <div data-testid="close-icon">X</div>,
}));

describe("CreateCategoryModal", () => {
  const mockCreateCategory = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useCategoryContext.mockReturnValue({
      createCategory: mockCreateCategory,
      loading: false,
    });
  });

  it("renders the modal with all fields when isOpen is true", () => {
    render(<CreateCategoryModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByRole('heading', { name: "Create Category" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter category name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter category description")).toBeInTheDocument();
  });

  it("does not render the modal when isOpen is false", () => {
    render(<CreateCategoryModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText("Create Category")).not.toBeInTheDocument();
  });

  it("shows error when category name is empty", async () => {
    render(<CreateCategoryModal isOpen={true} onClose={mockOnClose} />);
    
    const submitButton = screen.getByRole('button', { name: "Create Category" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Category name is required")).toBeInTheDocument();
      expect(mockCreateCategory).not.toHaveBeenCalled();
    });
  });

  it("calls createCategory and shows success toast on successful submission", async () => {
    mockCreateCategory.mockResolvedValueOnce({});
    render(<CreateCategoryModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByPlaceholderText("Enter category name"), {
      target: { value: "New Category" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter category description"), {
      target: { value: "A description" },
    });

    const submitButton = screen.getByRole('button', { name: "Create Category" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: "New Category",
        description: "A description",
      });
      expect(toast.success).toHaveBeenCalledWith("Category created successfully!");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("shows error toast and does not close modal on failure", async () => {
    mockCreateCategory.mockRejectedValueOnce({
      response: { data: { message: "Failed to create category" } },
    });
    render(<CreateCategoryModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByPlaceholderText("Enter category name"), {
      target: { value: "New Category" },
    });
    
    const submitButton = screen.getByRole('button', { name: "Create Category" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: "New Category",
        description: "",
      });
      expect(toast.error).toHaveBeenCalledWith("Failed to create category");
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it("shows field-specific error when name is not unique", async () => {
    mockCreateCategory.mockRejectedValueOnce({
      response: { data: { message: "Category name must be unique" } },
    });
    render(<CreateCategoryModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByPlaceholderText("Enter category name"), {
      target: { value: "Duplicate Category" },
    });
    
    const submitButton = screen.getByRole('button', { name: "Create Category" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("This category name already exists")).toBeInTheDocument();
      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: "Duplicate Category",
        description: "",
      });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it("disables the submit button when loading", () => {
    useCategoryContext.mockReturnValueOnce({
      createCategory: mockCreateCategory,
      loading: true,
    });
    render(<CreateCategoryModal isOpen={true} onClose={mockOnClose} />);

    const submitButton = screen.getByRole('button', { name: "Creating..." });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveClass('bg-gray-400');
  });

  it("clears field errors when the user starts typing", async () => {
    render(<CreateCategoryModal isOpen={true} onClose={mockOnClose} />);
    
    const submitButton = screen.getByRole('button', { name: "Create Category" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Category name is required")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Enter category name"), {
      target: { value: "Valid Name" },
    });

    expect(screen.queryByText("Category name is required")).not.toBeInTheDocument();
  });
});