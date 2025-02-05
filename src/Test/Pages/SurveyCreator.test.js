// src/Test/pages/SurveyCreator.test.js
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
import SurveyCreator from "../../pages/SurveyCreator";
import { useSurveyContext } from "../../context/surveyContext";
import { useQuestionContext } from "../../context/questionContext";
import { useSurveySlideContext } from "../../context/surveySlideContext";

// Mock dependencies
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("../../context/surveyContext", () => ({
  useSurveyContext: jest.fn(),
}));

jest.mock("../../context/questionContext", () => ({
  useQuestionContext: jest.fn(),
}));

jest.mock("../../context/surveySlideContext", () => ({
  useSurveySlideContext: jest.fn(),
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: { div: "div" },
  AnimatePresence: ({ children }) => children,
}));

// Mock NavbarComp component
jest.mock("../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

// Mock the modals
jest.mock("../../components/SurveyQuestionEditor", () => {
  return function MockSurveyQuestionEditor({ question, onUpdate, onClose }) {
    return (
      <div data-testid="survey-question-editor">
        <button onClick={() => onUpdate({ title: "Updated Question" })}>
          Save Question
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock("../../components/SurveySlideEditor", () => {
  return function MockSurveySlideEditor({ slide, onUpdate, onClose }) {
    return (
      <div data-testid="survey-slide-editor">
        <button onClick={() => onUpdate({ surveyTitle: "Updated Slide" })}>
          Save Slide
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock("../../models/UnifiedSettingsModal", () => {
  return function MockUnifiedSettingsModal({ isOpen, onClose, onSave }) {
    if (!isOpen) return null;
    return (
      <div data-testid="settings-modal">
        <button
          data-testid="save-settings"
          onClick={() =>
            onSave({
              title: "Updated Survey",
              description: "Updated Description",
            })
          }
        >
          Save
        </button>
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
      <div data-testid="confirmation-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <button data-testid="confirm-delete-button" onClick={onConfirm}>
          Confirm Delete
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  };
});

// Mock data
const mockSurvey = {
  _id: "survey123",
  title: "Test Survey",
  description: "Test Description",
};

const mockQuestions = [
  { _id: "q1", title: "First Question", type: "text" },
  { _id: "q2", title: "Second Question", type: "text" },
];

const mockSlides = [
  { _id: "s1", surveyTitle: "First Slide", content: "Slide content" },
  { _id: "s2", surveyTitle: "Second Slide", content: "Slide content" },
];

describe("SurveyCreator", () => {
  const mockNavigate = jest.fn();
  const mockGetSurveyById = jest.fn();
  const mockUpdateSurvey = jest.fn();
  const mockGetAllQuestions = jest.fn();
  const mockCreateQuestion = jest.fn();
  const mockUpdateQuestion = jest.fn();
  const mockDeleteQuestion = jest.fn();
  const mockGetAllSlides = jest.fn();
  const mockCreateSlide = jest.fn();
  const mockUpdateSlide = jest.fn();
  const mockDeleteSlide = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    useParams.mockReturnValue({ surveyId: "survey123" });
    useNavigate.mockReturnValue(mockNavigate);

    // Setup default mock implementations
    mockGetSurveyById.mockResolvedValue(mockSurvey);
    mockGetAllQuestions.mockResolvedValue(mockQuestions);
    mockGetAllSlides.mockResolvedValue(mockSlides);

    useSurveyContext.mockReturnValue({
      currentSurvey: mockSurvey,
      loading: false,
      getSurveyById: mockGetSurveyById,
      updateSurvey: mockUpdateSurvey,
    });

    useQuestionContext.mockReturnValue({
      loading: false,
      getAllQuestions: mockGetAllQuestions,
      createQuestion: mockCreateQuestion,
      updateQuestion: mockUpdateQuestion,
      deleteQuestion: mockDeleteQuestion,
    });

    useSurveySlideContext.mockReturnValue({
      loading: false,
      getAllSlides: mockGetAllSlides,
      createSlide: mockCreateSlide,
      updateSlide: mockUpdateSlide,
      deleteSlide: mockDeleteSlide,
    });
  });

  test("renders initial survey creator with content", async () => {
    const mockSurveyWithOrder = {
      ...mockSurvey,
      questions: mockQuestions,
      slides: mockSlides,
      order: [
        { id: "q1", type: "question" },
        { id: "q2", type: "question" },
        { id: "s1", type: "slide" },
        { id: "s2", type: "slide" },
      ],
    };

    mockGetSurveyById.mockResolvedValue(mockSurveyWithOrder);

    render(<SurveyCreator />);

    expect(screen.getByText("Survey Creator")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Survey")).toBeInTheDocument();
    });

    // Wait for first question to be rendered
    await waitFor(() => {
      expect(screen.getByText("First Question")).toBeInTheDocument();
    });

    // After first item is rendered, verify all other content
    const questionItems = screen.getAllByText(/^Question \d+$/);
    const slideItems = screen.getAllByText(/^Slide \d+$/);

    expect(questionItems).toHaveLength(2);
    expect(slideItems).toHaveLength(2);

    expect(screen.getByText("Second Question")).toBeInTheDocument();
    expect(screen.getByText("First Slide")).toBeInTheDocument();
    expect(screen.getByText("Second Slide")).toBeInTheDocument();
  });

  test("handles adding a new question", async () => {
    mockCreateQuestion.mockResolvedValue({
      _id: "new-q",
      title: "New Question",
      type: "text",
    });

    render(<SurveyCreator />);

    const addQuestionButton = screen.getByTestId("add-question-button");
    await user.click(addQuestionButton);

    expect(screen.getByTestId("survey-question-editor")).toBeInTheDocument();

    const saveButton = screen.getByText("Save Question");
    await user.click(saveButton);

    expect(mockCreateQuestion).toHaveBeenCalled();
    expect(mockUpdateSurvey).toHaveBeenCalled();
  });

  test("handles adding a new slide", async () => {
    mockCreateSlide.mockResolvedValue({
      _id: "new-s",
      surveyTitle: "New Slide",
      content: "New content",
    });

    render(<SurveyCreator />);

    const addSlideButton = screen.getByTestId("add-slide-button");
    await user.click(addSlideButton);

    expect(screen.getByTestId("survey-slide-editor")).toBeInTheDocument();

    const saveButton = screen.getByText("Save Slide");
    await user.click(saveButton);

    expect(mockCreateSlide).toHaveBeenCalled();
    expect(mockUpdateSurvey).toHaveBeenCalled();
  });

  test("handles reordering items", async () => {
    const mockSurveyWithOrder = {
      ...mockSurvey,
      questions: [mockQuestions[0]],
      slides: [mockSlides[0]],
      order: [
        { id: "q1", type: "question" },
        { id: "s1", type: "slide" },
      ],
    };

    mockGetSurveyById.mockResolvedValue(mockSurveyWithOrder);

    render(<SurveyCreator />);

    // Wait for first item to be rendered
    await waitFor(() => {
      expect(screen.getByTestId("content-item-0")).toBeInTheDocument();
    });

    // After first item is rendered, verify second item
    expect(screen.getByTestId("content-item-1")).toBeInTheDocument();

    const firstItem = screen.getByTestId("content-item-0");
    const secondItem = screen.getByTestId("content-item-1");

    // Simulate drag and drop
    fireEvent.dragStart(firstItem, {
      dataTransfer: { setData: jest.fn() },
    });

    fireEvent.drop(secondItem, {
      dataTransfer: { getData: () => "0" },
    });

    fireEvent.dragEnd(firstItem);

    await waitFor(() => {
      expect(mockUpdateSurvey).toHaveBeenCalledWith(
        "survey123",
        expect.objectContaining({
          order: [
            { id: "s1", type: "slide" },
            { id: "q1", type: "question" },
          ],
        })
      );
    });
  });

  test("handles deleting a question", async () => {
    const mockSurveyWithOrder = {
      ...mockSurvey,
      questions: [mockQuestions[0]],
      slides: [],
      order: [{ id: "q1", type: "question" }],
    };

    mockGetSurveyById.mockResolvedValue(mockSurveyWithOrder);
    mockDeleteQuestion.mockResolvedValue({});

    render(<SurveyCreator />);

    await waitFor(() => {
      expect(screen.getByTestId("delete-question-q1")).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId("delete-question-q1");
    await userEvent.click(deleteButton);

    // Verify modal appears
    const modal = screen.getByTestId("confirmation-modal");
    expect(modal).toBeInTheDocument();

    const confirmButton = screen.getByTestId("confirm-delete-button");
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteQuestion).toHaveBeenCalledWith("survey123", "q1");
    });

    expect(mockUpdateSurvey).toHaveBeenCalled();
  });
  test("handles updating survey settings", async () => {
    render(<SurveyCreator />);

    const titleInput = screen.getByTestId("survey-title-input");
    await user.click(titleInput);

    expect(screen.getByTestId("settings-modal")).toBeInTheDocument();

    const saveButton = screen.getByTestId("save-settings");
    await user.click(saveButton);

    expect(mockUpdateSurvey).toHaveBeenCalledWith(
      "survey123",
      expect.objectContaining({
        title: "Updated Survey",
        description: "Updated Description",
        // Other properties from currentSurvey should be preserved
        _id: "survey123",
      })
    );
  });

  test("handles preview navigation", async () => {
    render(<SurveyCreator />);

    const previewButton = screen.getByTestId("preview-button");
    await user.click(previewButton);

    expect(mockNavigate).toHaveBeenCalledWith("/SurveyPreview/survey123");
  });

  test("handles loading state", async () => {
    // Mock initial loading states
    const mockGetSurveyById = jest.fn();
    const mockUpdateSurvey = jest.fn();
    const mockGetAllQuestions = jest.fn();
    const mockGetAllSlides = jest.fn();

    // Set all contexts with loading true
    useSurveyContext.mockReturnValue({
      currentSurvey: null,
      loading: true,
      getSurveyById: mockGetSurveyById,
      updateSurvey: mockUpdateSurvey,
    });

    useQuestionContext.mockReturnValue({
      loading: true,
      getAllQuestions: mockGetAllQuestions,
      createQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      deleteQuestion: jest.fn(),
    });

    useSurveySlideContext.mockReturnValue({
      loading: true,
      getAllSlides: mockGetAllSlides,
      createSlide: jest.fn(),
      updateSlide: jest.fn(),
      deleteSlide: jest.fn(),
    });

    render(<SurveyCreator />);

    // Check for loading overlay and text
    expect(screen.getByTestId("loading-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("loading-text")).toHaveTextContent("Loading...");

    // Verify that the main content is not visible while loading
    expect(screen.queryByTestId("content-list")).not.toBeInTheDocument();
  });

  test("handles error state", async () => {
    mockGetSurveyById.mockRejectedValue(new Error("Failed to load survey"));

    render(<SurveyCreator />);

    expect(await screen.findByTestId("error-alert")).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/survey-list");
  });
});
