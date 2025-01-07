// src/Test/pages/SelectSurveyCategory.test.js
import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNavigate } from "react-router-dom";
import SelectSurveyCategory from "../../pages/SelectSurveyCategory";
import { useCategoryContext } from "../../context/categoryContext";
import { useSurveyContext } from "../../context/surveyContext";
import { toast } from "react-toastify";

// Mock dependencies
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("../../context/categoryContext", () => ({
  useCategoryContext: jest.fn(),
}));

jest.mock("../../context/surveyContext", () => ({
  useSurveyContext: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock NavbarComp component
jest.mock("../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

// Mock modal components
jest.mock("../../models/Category/CreateCategoryModal", () => {
  return function MockCreateCategoryModal({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="create-category-modal">
        <button onClick={onClose} data-testid="close-create-modal">
          Close
        </button>
      </div>
    );
  };
});

jest.mock("../../models/Category/EditCategoryModal", () => {
  return function MockEditCategoryModal({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="edit-category-modal">
        <button onClick={onClose} data-testid="close-edit-modal">
          Close
        </button>
      </div>
    );
  };
});

jest.mock("../../models/ConfirmationModal", () => {
  return function MockConfirmationModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirmation-modal">
        <button onClick={onConfirm} data-testid="confirm-delete">
          Confirm
        </button>
        <button onClick={onClose} data-testid="cancel-delete">
          Cancel
        </button>
      </div>
    );
  };
});

// Mock data
const mockCategories = [
  { _id: "1", name: "Health Survey" },
  { _id: "2", name: "Employee Feedback" },
  { _id: "3", name: "Customer Satisfaction" },
];

describe("SelectSurveyCategory", () => {
  const mockNavigate = jest.fn();
  const mockGetAllCategories = jest.fn();
  const mockDeleteCategory = jest.fn();
  const mockCreateSurvey = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useCategoryContext.mockReturnValue({
      categories: mockCategories,
      getAllCategories: mockGetAllCategories,
      deleteCategory: mockDeleteCategory,
      loading: false,
      error: null,
    });
    useSurveyContext.mockReturnValue({
      createSurvey: mockCreateSurvey,
    });
  });

  test("renders initial page with survey categories", async () => {
    render(<SelectSurveyCategory />);

    expect(screen.getByText("Select Survey Categories")).toBeInTheDocument();
    expect(screen.getByTestId("category-search")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search survey categories...")
    ).toBeInTheDocument();

    mockCategories.forEach((category) => {
      expect(
        screen.getByTestId(`category-item-${category._id}`)
      ).toBeInTheDocument();
      expect(screen.getByText(category.name)).toBeInTheDocument();
    });

    expect(mockGetAllCategories).toHaveBeenCalled();
  });

  test("handles category search", async () => {
    render(<SelectSurveyCategory />);

    const searchInput = screen.getByTestId("category-search");
    await user.type(searchInput, "health");

    expect(screen.getByText("Health Survey")).toBeInTheDocument();
    expect(screen.queryByText("Employee Feedback")).not.toBeInTheDocument();
  });

  test("handles category selection with checkbox", async () => {
    render(<SelectSurveyCategory />);

    const categoryItem = screen.getByTestId("category-item-1");
    const checkbox = within(categoryItem).getByRole("checkbox");

    await user.click(checkbox);

    const createButton = screen.getByTestId("create-survey-button");
    expect(
      within(createButton).getByText("Create Survey (1)")
    ).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  test("creates new survey with selected categories", async () => {
    mockCreateSurvey.mockResolvedValue({
      surveyQuiz: { _id: "new-survey-id" },
    });

    render(<SelectSurveyCategory />);

    const categoryItem = screen.getByTestId("category-item-1");
    await user.click(within(categoryItem).getByRole("checkbox"));

    const createButton = screen.getByTestId("create-survey-button");
    await user.click(createButton);

    expect(mockCreateSurvey).toHaveBeenCalledWith({
      categoryId: ["1"],
      status: "draft",
    });
    expect(mockNavigate).toHaveBeenCalledWith("/createSurvey/new-survey-id");
  });

  test("handles survey creation error", async () => {
    mockCreateSurvey.mockRejectedValue({
      response: { data: { message: "Creation failed" } },
    });

    render(<SelectSurveyCategory />);

    const categoryItem = screen.getByTestId("category-item-1");
    await user.click(within(categoryItem).getByRole("checkbox"));

    const createButton = screen.getByTestId("create-survey-button");
    await user.click(createButton);

    expect(toast.error).toHaveBeenCalledWith("Creation failed");
  });

  test("handles category deletion", async () => {
    mockDeleteCategory.mockResolvedValue({});

    render(<SelectSurveyCategory />);

    const deleteButton = screen.getByTestId("delete-category-1");
    await user.click(deleteButton);

    const confirmButton = screen.getByTestId("confirm-delete");
    await user.click(confirmButton);

    expect(mockDeleteCategory).toHaveBeenCalledWith("1");
    expect(toast.success).toHaveBeenCalledWith(
      "Category deleted successfully!"
    );
  });

  test("handles loading state", () => {
    useCategoryContext.mockReturnValue({
      categories: [],
      getAllCategories: mockGetAllCategories,
      loading: true,
      error: null,
    });

    render(<SelectSurveyCategory />);
    expect(screen.getByText("Loading categories...")).toBeInTheDocument();
  });

  test("handles error state", () => {
    const errorMessage = "Failed to load categories";
    useCategoryContext.mockReturnValue({
      categories: [],
      getAllCategories: mockGetAllCategories,
      loading: false,
      error: { message: errorMessage },
    });

    render(<SelectSurveyCategory />);
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
  });

  test("opens and closes edit category modal", async () => {
    render(<SelectSurveyCategory />);

    const editButton = screen.getByTestId("edit-category-1");
    await user.click(editButton);

    expect(screen.getByTestId("edit-category-modal")).toBeInTheDocument();

    const closeButton = screen.getByTestId("close-edit-modal");
    await user.click(closeButton);

    expect(screen.queryByTestId("edit-category-modal")).not.toBeInTheDocument();
  });

  test("displays no categories found message", async () => {
    useCategoryContext.mockReturnValue({
      categories: [],
      getAllCategories: mockGetAllCategories,
      loading: false,
      error: null,
    });

    render(<SelectSurveyCategory />);
    expect(screen.getByText("No categories found")).toBeInTheDocument();
  });
});
