import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import UnifiedList from "../../pages/UnifiedList";
import { toast } from "react-toastify";

// Setup all mocks first
jest.mock("react-toastify", () => {
  return {
    toast: {
      success: jest.fn(),
      error: jest.fn(),
    },
  };
});

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock("react-beautiful-dnd", () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) =>
    children(
      {
        draggableProps: {
          style: {},
        },
        innerRef: jest.fn(),
      },
      {}
    ),
  Draggable: ({ children }) =>
    children(
      {
        draggableProps: {
          style: {},
        },
        innerRef: jest.fn(),
        dragHandleProps: {},
      },
      {}
    ),
}));

jest.mock("../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="mock-navbar">Mock Navbar</div>;
  };
});

jest.mock("../../models/ConfirmationModal", () => {
  return function MockConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    children,
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirmation-modal">
        {children}
        <button data-testid="confirm-delete-button" onClick={onConfirm}>
          Confirm
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  };
});

// Mock contexts
const mockQuizContext = {
  quizzes: [],
  getAllQuizzes: jest.fn(),
  deleteQuiz: jest.fn(),
  updateQuiz: jest.fn(),
};

const mockSurveyContext = {
  surveys: [],
  getAllSurveys: jest.fn(),
  deleteSurvey: jest.fn(),
  updateSurvey: jest.fn(),
  publishSurvey: jest.fn(),
};

const mockAuthContext = {
  user: { id: "user123" },
};

// Mock the context hooks after context objects are defined
jest.mock("../../context/quizContext", () => ({
  useQuizContext: () => mockQuizContext,
}));

jest.mock("../../context/surveyContext", () => ({
  useSurveyContext: () => mockSurveyContext,
}));

jest.mock("../../context/AuthContext", () => ({
  useAuthContext: () => mockAuthContext,
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("UnifiedList Component", () => {
  const mockQuizData = [
    {
      _id: "1",
      title: "Test Quiz 1",
      description: "Quiz description 1",
      status: "draft",
      questions: [{ id: 1 }, { id: 2 }],
      slides: [{ id: 1 }],
    },
    {
      _id: "2",
      title: "Test Quiz 2",
      description: "Quiz description 2",
      status: "active",
      questions: [{ id: 1 }],
      slides: [{ id: 1 }, { id: 2 }],
    },
  ];

  const mockSurveyData = [
    {
      _id: "1",
      title: "Test Survey 1",
      description: "Survey description 1",
      status: "draft",
      questions: [{ id: 1 }, { id: 2 }],
      slides: [{ id: 1 }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window dimensions
    global.innerWidth = 1024;
    global.dispatchEvent(new Event("resize"));
  });

  describe("Quiz Mode", () => {
    beforeEach(() => {
      mockQuizContext.quizzes = mockQuizData;
    });

    test("renders quiz list correctly", () => {
      render(<UnifiedList contentType="quiz" />);

      // Check header text
      const headerElement = screen.getByTestId("content-header");
      expect(headerElement).toBeInTheDocument();
      expect(headerElement).toHaveTextContent("My Quizs");

      // Check create button
      const createButton = screen.getByTestId("create-button");
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveTextContent(/Create New Quiz/i);

      // Check quiz cards
      mockQuizData.forEach((quiz) => {
        const card = screen.getByTestId(`quiz-card-${quiz._id}`);
        expect(card).toBeInTheDocument();
        expect(screen.getByTestId(`quiz-title-${quiz._id}`)).toHaveTextContent(
          quiz.title
        );
        expect(card).toHaveTextContent(quiz.description);

        // Check question count
        expect(card).toHaveTextContent(`${quiz.questions.length} Questions`);

        // Check status badge within the specific card
        const statusBadgeText =
          quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1);
        const cardStatusBadge = within(card).getByText(statusBadgeText);
        expect(cardStatusBadge).toBeInTheDocument();
      });
    });

    test("navigates to quiz creation page", () => {
      render(<UnifiedList contentType="quiz" />);
      fireEvent.click(screen.getByTestId("create-button"));
      expect(mockNavigate).toHaveBeenCalledWith("/selectquizcategory");
    });

    test("navigates to quiz edit page", () => {
      render(<UnifiedList contentType="quiz" />);
      fireEvent.click(screen.getByTestId("edit-button-1"));
      expect(mockNavigate).toHaveBeenCalledWith("/createQuiz/1");
    });
  });

  describe("Survey Mode", () => {
    beforeEach(() => {
      mockSurveyContext.surveys = mockSurveyData;
    });

    test("renders survey list correctly", () => {
      render(<UnifiedList contentType="survey" />);

      // Check header text
      expect(screen.getByTestId("content-header")).toHaveTextContent(
        "My Surveys"
      );

      // Check create button
      const createButton = screen.getByTestId("create-button");
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveTextContent(/Create New Survey/i);

      // Check survey cards
      mockSurveyData.forEach((survey) => {
        const card = screen.getByTestId(`survey-card-${survey._id}`);
        expect(card).toBeInTheDocument();
        expect(
          screen.getByTestId(`survey-title-${survey._id}`)
        ).toHaveTextContent(survey.title);
        expect(card).toHaveTextContent(survey.description);
      });
    });

    test("navigates to survey creation page", () => {
      render(<UnifiedList contentType="survey" />);
      fireEvent.click(screen.getByTestId("create-button"));
      expect(mockNavigate).toHaveBeenCalledWith("/selectsurveycategory");
    });

    test("navigates to survey edit page", () => {
      render(<UnifiedList contentType="survey" />);
      fireEvent.click(screen.getByTestId("edit-button-1"));
      expect(mockNavigate).toHaveBeenCalledWith("/createSurvey/1");
    });
  });

  describe("Delete Functionality", () => {
    describe("Quiz Delete Tests", () => {
      test("shows confirmation modal when delete button is clicked", () => {
        render(<UnifiedList contentType="quiz" />);

        // Initially modal should not be visible
        expect(
          screen.queryByTestId("confirmation-modal")
        ).not.toBeInTheDocument();

        // Click delete button
        fireEvent.click(screen.getByTestId("delete-button-1"));

        // Modal should now be visible
        expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
      });

      test("closes modal when cancel is clicked", () => {
        render(<UnifiedList contentType="quiz" />);

        // Open modal
        fireEvent.click(screen.getByTestId("delete-button-1"));
        expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();

        // Click cancel
        fireEvent.click(screen.getByText("Cancel"));

        // Modal should be closed
        expect(
          screen.queryByTestId("confirmation-modal")
        ).not.toBeInTheDocument();
      });

      test("successfully deletes quiz and shows success toast", async () => {
        mockQuizContext.deleteQuiz.mockResolvedValueOnce();

        render(<UnifiedList contentType="quiz" />);

        // Trigger deletion
        fireEvent.click(screen.getByTestId("delete-button-1"));
        fireEvent.click(screen.getByTestId("confirm-delete-button"));

        // Verify deleteQuiz was called with correct ID
        expect(mockQuizContext.deleteQuiz).toHaveBeenCalledWith("1");

        // Wait for success toast
        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith(
            "Quiz deleted successfully!"
          );
        });

        // Modal should be closed
        expect(
          screen.queryByTestId("confirmation-modal")
        ).not.toBeInTheDocument();
      });

      test("handles delete failure and shows error toast", async () => {
        const error = new Error("Network error");
        mockQuizContext.deleteQuiz.mockRejectedValueOnce(error);

        render(<UnifiedList contentType="quiz" />);

        // Trigger deletion
        fireEvent.click(screen.getByTestId("delete-button-1"));
        fireEvent.click(screen.getByTestId("confirm-delete-button"));

        // Verify error toast was shown
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Failed to delete");
        });

        // Modal should be closed after error
        expect(
          screen.queryByTestId("confirmation-modal")
        ).not.toBeInTheDocument();
      });
    });

    describe("Survey Delete Tests", () => {
      beforeEach(() => {
        mockSurveyContext.surveys = mockSurveyData;
      });

      test("shows confirmation modal when delete button is clicked", () => {
        render(<UnifiedList contentType="survey" />);

        // Initially modal should not be visible
        expect(
          screen.queryByTestId("confirmation-modal")
        ).not.toBeInTheDocument();

        // Click delete button
        fireEvent.click(screen.getByTestId("delete-button-1"));

        // Modal should now be visible
        expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
      });

      test("closes modal when cancel is clicked", () => {
        render(<UnifiedList contentType="survey" />);

        // Open modal
        fireEvent.click(screen.getByTestId("delete-button-1"));
        expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();

        // Click cancel
        fireEvent.click(screen.getByText("Cancel"));

        // Modal should be closed
        expect(
          screen.queryByTestId("confirmation-modal")
        ).not.toBeInTheDocument();
      });

      test("successfully deletes survey and shows success toast", async () => {
        mockSurveyContext.deleteSurvey.mockResolvedValueOnce();

        render(<UnifiedList contentType="survey" />);

        fireEvent.click(screen.getByTestId("delete-button-1"));
        fireEvent.click(screen.getByTestId("confirm-delete-button"));

        expect(mockSurveyContext.deleteSurvey).toHaveBeenCalledWith("1");

        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith(
            "Survey deleted successfully!"
          );
        });

        // Modal should be closed
        expect(
          screen.queryByTestId("confirmation-modal")
        ).not.toBeInTheDocument();
      });

      test("handles delete failure and shows error toast", async () => {
        const error = new Error("Network error");
        mockSurveyContext.deleteSurvey.mockRejectedValueOnce(error);

        render(<UnifiedList contentType="survey" />);

        // Trigger deletion
        fireEvent.click(screen.getByTestId("delete-button-1"));
        fireEvent.click(screen.getByTestId("confirm-delete-button"));

        // Verify error toast was shown
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith("Failed to delete");
        });

        // Modal should be closed after error
        expect(
          screen.queryByTestId("confirmation-modal")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Mobile Responsiveness", () => {
    beforeEach(() => {
      global.innerWidth = 375; // Mobile width
      global.dispatchEvent(new Event("resize"));
    });

    test("displays mobile menu button on small screens", () => {
      render(<UnifiedList contentType="quiz" />);
      expect(screen.getByTestId("mobile-menu-button")).toBeInTheDocument();
    });

    test("handles filter menu toggle on mobile", () => {
      render(<UnifiedList contentType="quiz" />);

      const menuButton = screen.getByTestId("mobile-menu-button");
      fireEvent.click(menuButton);

      expect(screen.getByTestId("filter-menu")).toHaveClass("translate-x-0");

      const closeButton = screen.getByTestId("close-menu-button");
      fireEvent.click(closeButton);

      expect(screen.getByTestId("filter-menu")).toHaveClass("translate-x-full");
    });
  });

  describe("Filter Functionality", () => {
    beforeEach(() => {
      mockQuizContext.quizzes = mockQuizData;
    });

    test("filters content by status", () => {
      render(<UnifiedList contentType="quiz" />);

      // Check draft filter
      fireEvent.click(screen.getByTestId("filter-draft"));
      expect(screen.getByTestId("quiz-card-1")).toBeInTheDocument();
      expect(screen.queryByTestId("quiz-card-2")).not.toBeInTheDocument();

      // Check active filter
      fireEvent.click(screen.getByTestId("filter-active"));
      expect(screen.queryByTestId("quiz-card-1")).not.toBeInTheDocument();
      expect(screen.getByTestId("quiz-card-2")).toBeInTheDocument();

      // Check all filter
      fireEvent.click(screen.getByTestId("filter-all"));
      expect(screen.getByTestId("quiz-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("quiz-card-2")).toBeInTheDocument();
    });
  });
});
