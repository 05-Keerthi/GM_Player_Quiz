import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UnifiedDetails from "../../pages/UnifiedDetails";
import { useQuizContext } from "../../context/quizContext";
import { useSurveyContext } from "../../context/surveyContext";
import { useSessionContext } from "../../context/sessionContext";
import { useSurveySessionContext } from "../../context/surveySessionContext";

// Mock the router hooks
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams({ type: "quiz", quizId: "123" })],
}));

// Mock the Navbar component
jest.mock(
  "../../components/NavbarComp",
  () =>
    function MockNavbar() {
      return <div data-testid="mock-navbar">Mock Navbar</div>;
    }
);

// Mock context hooks
jest.mock("../../context/quizContext", () => ({
  useQuizContext: jest.fn(),
}));

jest.mock("../../context/surveyContext", () => ({
  useSurveyContext: jest.fn(),
}));

jest.mock("../../context/sessionContext", () => ({
  useSessionContext: jest.fn(),
}));

jest.mock("../../context/surveySessionContext", () => ({
  useSurveySessionContext: jest.fn(),
}));

describe("UnifiedDetails Component", () => {
  // Mock data
  const mockQuizData = {
    _id: "123",
    title: "Test Quiz",
    description: "A test quiz description",
    questions: [{ id: 1 }, { id: 2 }],
    status: "active",
  };

  const mockSurveyData = {
    _id: "456",
    title: "Test Survey",
    description: "A test survey description",
    questions: [{ id: 1 }, { id: 2 }, { id: 3 }],
    status: "active",
    isPublic: true,
    categories: [{ name: "Category 1" }, { name: "Category 2" }],
    createdAt: "2024-01-08T12:00:00.000Z",
  };

  // Mock functions
  const mockGetQuizById = jest.fn();
  const mockGetSurveyById = jest.fn();
  const mockCreateSession = jest.fn().mockResolvedValue({ _id: "session123" });
  const mockCreateSurveySession = jest
    .fn()
    .mockResolvedValue({ _id: "session456" });

  // Reset all mocks before each test
  beforeEach(() => {
    mockNavigate.mockClear();
    mockGetQuizById.mockClear();
    mockGetSurveyById.mockClear();
    mockCreateSession.mockClear();
    mockCreateSurveySession.mockClear();
  });

  // Set up default mock implementations
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations for all context hooks
    useQuizContext.mockImplementation(() => ({
      currentQuiz: null,
      getQuizById: mockGetQuizById,
      loading: false,
      error: null,
    }));

    useSurveyContext.mockImplementation(() => ({
      currentSurvey: null,
      getSurveyById: mockGetSurveyById,
      loading: false,
      error: null,
    }));

    useSessionContext.mockImplementation(() => ({
      createSession: mockCreateSession,
      loading: false,
      error: null,
    }));

    useSurveySessionContext.mockImplementation(() => ({
      createSurveySession: mockCreateSurveySession,
      loading: false,
      error: null,
    }));
  });

  describe("Quiz Mode", () => {
    beforeEach(() => {
      // Override just the quiz context for quiz-specific tests
      useQuizContext.mockImplementation(() => ({
        currentQuiz: mockQuizData,
        getQuizById: mockGetQuizById,
        loading: false,
        error: null,
      }));
    });

    test("renders quiz details correctly", () => {
      render(<UnifiedDetails />);

      expect(screen.getByTestId("content-title")).toHaveTextContent(
        "Test Quiz"
      );
      expect(screen.getByTestId("content-description")).toHaveTextContent(
        "A test quiz description"
      );
      expect(screen.getByTestId("questions-count")).toHaveTextContent("2");
      expect(screen.getByTestId("content-status")).toHaveTextContent("active");
      expect(screen.getByTestId("host-button")).toBeEnabled();
    });

    test("handles quiz session creation and navigation", async () => {
      // Setup mock createSession to resolve immediately
      const mockSessionData = { _id: "session123" };
      const mockCreateSession = jest.fn().mockResolvedValue(mockSessionData);

      useSessionContext.mockImplementation(() => ({
        createSession: mockCreateSession,
        loading: false,
        error: null,
      }));

      render(<UnifiedDetails />);

      fireEvent.click(screen.getByTestId("host-button"));

      // Wait for session creation
      await waitFor(() => {
        expect(mockCreateSession).toHaveBeenCalledWith("123");
      });

      // Wait for navigation
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/lobby",
          expect.objectContaining({
            state: { sessionData: mockSessionData },
            search: "?type=quiz&quizId=123&sessionId=session123",
          })
        );
      });
    });

    test("displays loading state when quiz data is being fetched", () => {
      useQuizContext.mockImplementation(() => ({
        currentQuiz: null,
        getQuizById: mockGetQuizById,
        loading: true,
        error: null,
      }));

      render(<UnifiedDetails />);
      expect(screen.getByTestId("loading-state")).toBeInTheDocument();
      expect(screen.getByTestId("loading-state")).toHaveTextContent(
        "Loading quiz details..."
      );
    });

    test("disables host button for inactive quiz", () => {
      useQuizContext.mockImplementation(() => ({
        currentQuiz: { ...mockQuizData, status: "draft" },
        getQuizById: mockGetQuizById,
        loading: false,
        error: null,
      }));

      render(<UnifiedDetails />);

      expect(screen.getByTestId("host-button")).toBeDisabled();
      expect(screen.getByTestId("inactive-quiz-message")).toBeInTheDocument();
      expect(screen.getByTestId("inactive-quiz-message")).toHaveTextContent(
        "This quiz is currently draft"
      );
    });


    test("handles session creation error for quiz", async () => {
      useSessionContext.mockImplementation(() => ({
        createSession: jest
          .fn()
          .mockRejectedValue(new Error("Failed to create quiz session")),
        loading: false,
        error: { message: "Failed to create quiz session" },
      }));

      render(<UnifiedDetails />);

      fireEvent.click(screen.getByTestId("host-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Failed to create quiz session"
        );
      });
    });
  });

  describe("Survey Mode", () => {
    beforeEach(() => {
      // Mock URL params for survey mode
      jest
        .spyOn(URLSearchParams.prototype, "get")
        .mockImplementation((param) => {
          if (param === "type") return "survey";
          if (param === "surveyId") return "456";
          return null;
        });

      // Override survey context for survey-specific tests
      useSurveyContext.mockImplementation(() => ({
        currentSurvey: mockSurveyData,
        getSurveyById: mockGetSurveyById,
        loading: false,
        error: null,
      }));
    });

    test("renders survey details correctly", () => {
      render(<UnifiedDetails />);

      expect(screen.getByTestId("content-title")).toHaveTextContent(
        "Test Survey"
      );
      expect(screen.getByTestId("content-description")).toHaveTextContent(
        "A test survey description"
      );
      expect(screen.getByTestId("questions-count")).toHaveTextContent("3");
      expect(screen.getByTestId("content-visibility")).toHaveTextContent(
        "Public"
      );
      expect(screen.getByTestId("content-categories")).toHaveTextContent(
        "Category 1, Category 2"
      );
    });

    test("handles survey session creation and navigation", async () => {
      // Setup mock createSurveySession to resolve immediately
      const mockSessionData = { _id: "session456" };
      const mockCreateSurveySession = jest
        .fn()
        .mockResolvedValue(mockSessionData);

      useSurveySessionContext.mockImplementation(() => ({
        createSurveySession: mockCreateSurveySession,
        loading: false,
        error: null,
      }));

      render(<UnifiedDetails />);

      fireEvent.click(screen.getByTestId("host-button"));

      // Wait for session creation
      await waitFor(() => {
        expect(mockCreateSurveySession).toHaveBeenCalledWith("456");
      });

      // Wait for navigation
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/survey-lobby",
          expect.objectContaining({
            state: { sessionData: mockSessionData },
            search: "?type=survey&surveyId=456&sessionId=session456",
          })
        );
      });
    });

    test("displays loading state when survey data is being fetched", () => {
      useSurveyContext.mockImplementation(() => ({
        currentSurvey: null,
        getSurveyById: mockGetSurveyById,
        loading: true,
        error: null,
      }));

      render(<UnifiedDetails />);
      expect(screen.getByTestId("loading-state")).toBeInTheDocument();
      expect(screen.getByTestId("loading-state")).toHaveTextContent(
        "Loading survey details..."
      );
    });

    test("disables host button for inactive survey", () => {
      useSurveyContext.mockImplementation(() => ({
        currentSurvey: { ...mockSurveyData, status: "draft" },
        getSurveyById: mockGetSurveyById,
        loading: false,
        error: null,
      }));

      render(<UnifiedDetails />);

      expect(screen.getByTestId("host-button")).toBeDisabled();
      expect(screen.getByTestId("inactive-survey-message")).toBeInTheDocument();
      expect(screen.getByTestId("inactive-survey-message")).toHaveTextContent(
        "This survey is currently draft"
      );
    });

    test("handles session creation error for survey", async () => {
      useSurveySessionContext.mockImplementation(() => ({
        createSurveySession: jest
          .fn()
          .mockRejectedValue(new Error("Failed to create survey session")),
        loading: false,
        error: { message: "Failed to create survey session" },
      }));

      render(<UnifiedDetails />);

      fireEvent.click(screen.getByTestId("host-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Failed to create survey session"
        );
      });
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      useQuizContext.mockImplementation(() => ({
        currentQuiz: mockQuizData,
        getQuizById: mockGetQuizById,
        loading: false,
        error: null,
      }));
    });

    test("displays error message when session creation fails", async () => {
      useSessionContext.mockImplementation(() => ({
        createSession: jest
          .fn()
          .mockRejectedValue(new Error("Failed to create session")),
        loading: false,
        error: { message: "Failed to create session" },
      }));

      render(<UnifiedDetails />);

      fireEvent.click(screen.getByTestId("host-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Failed to create session"
        );
      });
    });
  });

  describe("Edge Cases", () => {
    test("handles missing questions array", () => {
      useQuizContext.mockImplementation(() => ({
        currentQuiz: { ...mockQuizData, questions: undefined },
        getQuizById: mockGetQuizById,
        loading: false,
        error: null,
      }));

      render(<UnifiedDetails />);
      expect(screen.getByTestId("questions-count")).toHaveTextContent("0");
    });

    test("handles missing categories for survey", () => {
      jest
        .spyOn(URLSearchParams.prototype, "get")
        .mockImplementation((param) => {
          if (param === "type") return "survey";
          if (param === "surveyId") return "456";
          return null;
        });

      useSurveyContext.mockImplementation(() => ({
        currentSurvey: { ...mockSurveyData, categories: undefined },
        getSurveyById: mockGetSurveyById,
        loading: false,
        error: null,
      }));

      render(<UnifiedDetails />);
      expect(screen.getByTestId("content-categories")).toHaveTextContent(
        "No categories"
      );
    });
  });
});
