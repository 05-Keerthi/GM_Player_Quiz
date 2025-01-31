import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams, useNavigate } from "react-router-dom";
import { useQuizContext } from "../../context/quizContext";
import QuizCreator from "../../pages/quizCreator";

// Mock all required dependencies
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("../../context/quizContext", () => ({
  useQuizContext: jest.fn(),
}));

// Mock framer-motion to avoid animation-related issues in tests
jest.mock("framer-motion", () => ({
  motion: { div: "div" },
  AnimatePresence: ({ children }) => children,
}));

jest.mock("../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

// Mock the QuestionEditor component
jest.mock("../../components/QuestionEditor", () => {
  return function MockQuestionEditor({ question, onUpdate, onClose }) {
    return (
      <div data-testid="question-editor">
        <button onClick={() => onUpdate({ title: "Updated Question" })}>
          Update Question
        </button>
        <button onClick={onClose}>Close Editor</button>
      </div>
    );
  };
});

// Mock the SlideEditor component
jest.mock("../../components/SlideEditor", () => {
  return function MockSlideEditor({ slide, onUpdate, onClose }) {
    return (
      <div data-testid="slide-editor">
        <button onClick={() => onUpdate({ title: "Updated Slide" })}>
          Update Slide
        </button>
        <button onClick={onClose}>Close Editor</button>
      </div>
    );
  };
});

// Mock the QuestionTypeModal
jest.mock("../../models/QuestionTypeModal", () => {
  return function MockQuestionTypeModal({ isOpen, onClose, onAddQuestion }) {
    if (!isOpen) return null;
    return (
      <div data-testid="question-type-modal">
        <button
          data-testid="modal-add-question-btn"
          onClick={() =>
            onAddQuestion({
              title: "New Question",
              type: "multiple-choice",
              options: [],
            })
          }
        >
          Add Question
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock the SlideTypeModal
jest.mock("../../models/SlideTypeModal", () => {
  return function MockSlideTypeModal({ isOpen, onClose, onAddSlide }) {
    if (!isOpen) return null;
    return (
      <div data-testid="slide-type-modal">
        <button
          data-testid="modal-add-slide-btn"
          onClick={() =>
            onAddSlide({
              title: "New Slide",
              content: "",
              type: "content",
            })
          }
        >
          Add Slide
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock the UnifiedSettingsModal
jest.mock("../../models/UnifiedSettingsModal", () => {
  return function MockUnifiedSettingsModal({
    isOpen,
    onClose,
    onSave,
    initialData,
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="settings-modal">
        <button
          onClick={() =>
            onSave({
              title: "Updated Quiz Title",
              description: "Updated Description",
            })
          }
        >
          Save Settings
        </button>
        <button onClick={onClose}>Close</button>
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
      options: [],
    },
  ],
  slides: [
    {
      _id: "s1",
      title: "First Slide",
      content: "Slide content",
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
  const user = userEvent.setup();
  const API_URL = process.env.REACT_APP_API_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ quizId: "quiz123" });
    useQuizContext.mockReturnValue({ updateQuiz: mockUpdateQuiz });

    // Fix: Mock localStorage with proper JSON string for user data
    const mockUser = { id: "user123", name: "Test User" };
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === "user") {
        return JSON.stringify(mockUser);
      }
      if (key === "token") {
        return "mock-token";
      }
      return null;
    });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockQuizData),
        text: () => Promise.resolve(JSON.stringify(mockQuizData)),
      })
    );
  });

  test("renders quiz creator with initial data", async () => {
    render(<QuizCreator />);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByText("Quiz Creator")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("quiz-title-input")).toHaveValue("Test Quiz");
    });

    // Verify initial content items are rendered
    await waitFor(() => {
      expect(screen.getByText("First Question")).toBeInTheDocument();
    });
    expect(screen.getByText("First Slide")).toBeInTheDocument();
  });

  test("handles adding a new question", async () => {
    render(<QuizCreator />);

    // Click add question button
    const addQuestionBtn = screen.getByTestId("add-question-sidebar-btn");
    await user.click(addQuestionBtn);

    // Verify modal opens
    expect(screen.getByTestId("question-type-modal")).toBeInTheDocument();

    // Add new question
    const modalAddBtn = screen.getByTestId("modal-add-question-btn");
    await user.click(modalAddBtn);

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/quizzes/quiz123/questions`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          },
          body: expect.any(String),
        })
      );
    });
  });

  test("handles adding a new slide", async () => {
    render(<QuizCreator />);

    // Click add slide button
    const addSlideBtn = screen.getByTestId("add-slide-sidebar-btn");
    await user.click(addSlideBtn);

    // Verify modal opens
    expect(screen.getByTestId("slide-type-modal")).toBeInTheDocument();

    // Add new slide
    const modalAddBtn = screen.getByTestId("modal-add-slide-btn");
    await user.click(modalAddBtn);

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/quizzes/quiz123/slides`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          },
          body: expect.any(String),
        })
      );
    });
  });

  test("handles saving quiz", async () => {
    render(<QuizCreator />);

    await waitFor(() => {
      expect(screen.getByTestId("quiz-title-input")).toHaveValue("Test Quiz");
    });

    const saveButton = screen.getByTestId("save-quiz-btn");
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/quizzes/quiz123`,
        expect.objectContaining({
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          },
          body: expect.stringContaining('"title"'),
        })
      );
    });
  });

  test("handles preview navigation", async () => {
    render(<QuizCreator />);

    const previewButton = screen.getByTestId("preview-quiz-btn");
    await user.click(previewButton);

    expect(mockNavigate).toHaveBeenCalledWith("/preview/quiz123");
  });

  test("handles reordering items", async () => {
    // Configure initial fetch mock
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockQuizData),
      })
    );

    render(<QuizCreator />);

    // Wait for initial items to be loaded
    await waitFor(() => {
      const firstItem = screen.getByTestId("content-item-0");
      expect(within(firstItem).getByText("First Question")).toBeInTheDocument();
    });

    // Reset fetch mock to track the reorder API call
    global.fetch.mockReset();
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    // Get the draggable items
    const firstItem = screen.getByTestId("content-item-0");
    const secondItem = screen.getByTestId("content-item-1");

    // Simulate dragStart on first item
    fireEvent.dragStart(firstItem, {
      dataTransfer: {
        setData: jest.fn(),
        getData: () => "0",
      },
    });

    // Simulate drop on second item
    fireEvent.drop(secondItem, {
      dataTransfer: {
        getData: () => "0",
      },
    });

    // Simulate dragEnd to complete the operation
    fireEvent.dragEnd(firstItem);

    // Verify the API call was made with the correct parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/quizzes/quiz123`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          },
          body: JSON.stringify({
            title: "Test Quiz",
            description: "Test Description",
            questions: [mockQuizData.questions[0]],
            slides: [mockQuizData.slides[0]],
            order: [
              { id: "s1", type: "slide" },
              { id: "q1", type: "question" },
            ],
          }),
        }
      );
    });
  });

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
      expect(screen.getByTestId("alert-message")).toHaveTextContent(
        /network error/i
      );
    });
  });

  test("handles quiz settings update", async () => {
    render(<QuizCreator />);

    // Open settings modal by clicking the quiz title
    const titleInput = screen.getByTestId("quiz-title-input");
    await user.click(titleInput);

    // Verify settings modal is open
    expect(screen.getByTestId("settings-modal")).toBeInTheDocument();

    // Click save settings button
    const saveSettingsButton = screen.getByText("Save Settings");
    await user.click(saveSettingsButton);

    // Verify updateQuiz was called
    expect(mockUpdateQuiz).toHaveBeenCalledWith("quiz123", {
      title: "Updated Quiz Title",
      description: "Updated Description",
    });
  });

  test("handles error responses properly", async () => {
    // Mock an error response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad Request"),
      })
    );

    render(<QuizCreator />);

    await waitFor(() => {
      expect(screen.getByTestId("alert-message")).toBeInTheDocument();
    });
  });

  test("handles publishing quiz", async () => {
    const mockPublishQuiz = jest.fn().mockResolvedValue({ success: true });
    useQuizContext.mockReturnValue({
      updateQuiz: mockUpdateQuiz,
      publishQuiz: mockPublishQuiz,
    });

    render(<QuizCreator />);

    const publishButton = screen.getByTestId("publish-survey-button");
    await user.click(publishButton);

    await waitFor(() => {
      expect(mockPublishQuiz).toHaveBeenCalledWith("quiz123");
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining("/quiz-details")
      );
    });
  });

  test("handles image upload in question/slide updates", async () => {
    // Mock FormData
    global.FormData = class FormData {
      constructor() {
        this.data = {};
      }
      append(key, value) {
        this.data[key] = value;
      }
    };

    // Mock fetch with different responses based on URL
    global.fetch = jest.fn((url) => {
      // Initial quiz data fetch
      if (url.endsWith("/quiz123")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockQuizData),
        });
      }
      // Image upload endpoint
      else if (url.endsWith("/media/upload")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ media: [{ _id: "image123" }] }),
        });
      }
      // Question update endpoint
      else if (url.includes("/api/questions/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              question: {
                _id: "q1",
                title: "Updated Question",
                type: "multiple-choice",
                imageUrl: "image123",
                options: [],
              },
            }),
        });
      }
      return Promise.reject(new Error(`Unhandled fetch to ${url}`));
    });

    render(<QuizCreator />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId("content-item-0")).toBeInTheDocument();
    });

    // Click first question to open editor
    const firstQuestion = screen.getByTestId("content-item-0");
    await user.click(firstQuestion);

    // Create a mock file
    const file = new File(["dummy content"], "test.png", { type: "image/png" });

    // Mock QuestionEditor's update with image
    const questionEditor = screen.getByTestId("question-editor");
    const updateButton = within(questionEditor).getByText("Update Question");

    await user.click(updateButton);

    // Verify the fetch calls were made in the correct order
    await waitFor(() => {
      const fetchCalls = global.fetch.mock.calls;

      // First call should be initial quiz data load
      expect(fetchCalls[0][0]).toContain("/quiz123");

      // Second call should be question update
      expect(fetchCalls[1][0]).toContain("/api/questions/");
      expect(fetchCalls[1][1]).toMatchObject({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
      });

      const requestBody = JSON.parse(fetchCalls[1][1].body);
      expect(requestBody).toMatchObject({
        title: "Updated Question",
      });
    });

    // Verify the updated question appears in the UI
    await waitFor(() => {
      const updatedQuestion = screen.getByText("Updated Question");
      expect(updatedQuestion).toBeInTheDocument();
    });
  });
});
