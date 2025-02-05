import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams, useNavigate } from "react-router-dom";
import { useQuizContext } from "../../context/quizContext";
import QuizCreator from "../../pages/quizCreator";

// Mock dependencies
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("../../context/quizContext", () => ({
  useQuizContext: jest.fn(),
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: { div: "div" },
  AnimatePresence: ({ children }) => children,
}));

// Mock components
jest.mock("../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock("../../components/QuestionEditor", () => {
  return function MockQuestionEditor({ onSubmit, onClose }) {
    return (
      <div data-testid="question-editor">
        <button onClick={() => onSubmit({ title: "Updated Question" })}>
          Update Question
        </button>
        <button onClick={onClose}>Close Editor</button>
      </div>
    );
  };
});

jest.mock("../../components/SlideEditor", () => {
  return function MockSlideEditor({ onSubmit, onClose }) {
    return (
      <div data-testid="slide-editor">
        <button onClick={() => onSubmit({ title: "Updated Slide" })}>
          Update Slide
        </button>
        <button onClick={onClose}>Close Editor</button>
      </div>
    );
  };
});

// Mock modals
jest.mock("../../models/UnifiedSettingsModal", () => {
  return function MockSettingsModal({
    isOpen,
    onClose,
    onSave,
    onTitleUpdate,
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="settings-modal">
        <button
          data-testid="save-settings"
          onClick={() => {
            const updatedData = {
              title: "Updated Quiz Title",
              description: "Updated Description",
            };
            onSave(updatedData);
            onTitleUpdate(updatedData.title);
          }}
        >
          Save Settings
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock("../../models/ConfirmationModal", () => {
  return function MockConfirmationModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirmation-modal">
        <button data-testid="confirm-delete" onClick={onConfirm}>
          Confirm Delete
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  };
});

// Mock data
const mockQuizData = {
  _id: "quiz123",
  title: "Test Quiz",
  description: "Test Description",
  questions: [
    {
      _id: "q1",
      title: "First Question",
      type: "multiple-choice",
    },
  ],
  slides: [
    {
      _id: "s1",
      title: "First Slide",
      type: "content",
    },
  ],
  order: [
    { id: "q1", type: "question" },
    { id: "s1", type: "slide" },
  ],
};

describe("QuizCreator", () => {
  const mockNavigate = jest.fn();
  const mockUpdateQuiz = jest.fn();
  const mockPublishQuiz = jest.fn();
  const user = userEvent.setup();
  const API_URL = process.env.REACT_APP_API_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ quizId: "quiz123" });
    useQuizContext.mockReturnValue({
      updateQuiz: mockUpdateQuiz,
      publishQuiz: mockPublishQuiz,
    });

    // Mock localStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === "user") return JSON.stringify({ id: "user123" });
      if (key === "token") return "mock-token";
      return null;
    });

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockQuizData),
        text: () => Promise.resolve(JSON.stringify(mockQuizData)),
      })
    );
  });

  // Basic rendering tests
  test("renders quiz creator with initial data", async () => {
    render(<QuizCreator />);

    await waitFor(() => {
      expect(screen.getByTestId("quiz-title-input")).toHaveValue("Test Quiz");
    });
    await waitFor(() => {
      expect(screen.getByText("First Question")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("First Slide")).toBeInTheDocument();
    });
  });

  // Navigation tests
  test("handles quiz preview navigation", async () => {
    render(<QuizCreator />);

    await user.click(screen.getByTestId("preview-quiz-btn"));
    expect(mockNavigate).toHaveBeenCalledWith("/preview/quiz123");
  });

  // Quiz settings tests
  test("handles quiz settings update", async () => {
    render(<QuizCreator />);

    await user.click(screen.getByTestId("quiz-title-input"));
    expect(screen.getByTestId("settings-modal")).toBeInTheDocument();

    await user.click(screen.getByTestId("save-settings"));

    expect(mockUpdateQuiz).toHaveBeenCalledWith("quiz123", {
      title: "Updated Quiz Title",
      description: "Updated Description",
    });
  });

  // Question/Slide management tests
  test("adds new question", async () => {
    render(<QuizCreator />);

    await waitFor(() => {
      expect(screen.getByText("Add Question")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Add Question"));
    expect(screen.getByTestId("question-editor")).toBeInTheDocument();

    await user.click(screen.getByText("Update Question"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/quizzes/quiz123/questions`,
        expect.any(Object)
      );
    });
  });

  test("adds new slide", async () => {
    render(<QuizCreator />);

    await waitFor(() => {
      expect(screen.getByText("Add Slide")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Add Slide"));
    expect(screen.getByTestId("slide-editor")).toBeInTheDocument();

    await user.click(screen.getByText("Update Slide"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/quizzes/quiz123/slides`,
        expect.any(Object)
      );
    });
  });

  test("deletes question", async () => {
    render(<QuizCreator />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText("First Question")).toBeInTheDocument();
    });

    // Find and click delete button for the first question
    const deleteButton = screen.getByTestId(
      `delete-question-${mockQuizData.questions[0]._id}`
    );
    await user.click(deleteButton);

    // Verify confirmation modal appears
    expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();

    // Confirm deletion
    await user.click(screen.getByTestId("confirm-delete"));

    // Verify API call was made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/questions/q1`,
        expect.objectContaining({
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          },
        })
      );
    });
  });

  // Save and publish tests
  test("saves quiz successfully", async () => {
    render(<QuizCreator />);

    await user.click(screen.getByTestId("save-quiz-btn"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/quizzes/quiz123`,
        expect.objectContaining({
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          },
        })
      );
    });
  });

  test("publishes quiz successfully", async () => {
    mockPublishQuiz.mockResolvedValueOnce({ success: true });

    render(<QuizCreator />);

    await user.click(screen.getByTestId("publish-quiz-button"));

    await waitFor(() => {
      expect(mockPublishQuiz).toHaveBeenCalledWith("quiz123");
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        `/quiz-details?type=quiz&quizId=quiz123&hostId=user123`
      );
    });
  });

  // Error handling tests
  test("handles authentication failure", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
      })
    );

    render(<QuizCreator />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("handles network error", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("Network error")));

    render(<QuizCreator />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });
});
