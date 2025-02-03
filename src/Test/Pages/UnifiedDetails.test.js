import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import UnifiedDetails from "../../pages/UnifiedDetails";
import { cacheService } from "../../utils/cacheService";
import React from "react";

// Mock dependencies
jest.mock("../../utils/cacheService");

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useSearchParams: () => mockUseSearchParams(),
}));

// Mock quiz context
const mockQuiz = {
  _id: "123",
  title: "Test Quiz",
  description: "A test quiz description",
  status: "active",
  questions: [{ id: 1 }, { id: 2 }],
};

const mockQuizContext = {
  currentQuiz: mockQuiz,
  loading: false,
  error: null,
  getQuizById: jest.fn().mockImplementation(() => Promise.resolve(mockQuiz)),
  createSession: jest.fn(),
  setCurrentQuiz: jest.fn(),
  resetQuizState: jest.fn(),
};

jest.mock("../../context/quizContext", () => ({
  QuizContext: {
    Provider: ({ children }) => children,
  },
  useQuizContext: () => mockQuizContext,
}));

// Mock survey context
const mockSurvey = {
  _id: "456",
  title: "Test Survey",
  description: "A test survey description",
  status: "active",
  questions: [{ id: 1 }, { id: 2 }],
  isPublic: true,
  categories: [{ name: "Category 1" }],
  createdAt: "2024-01-01",
};

const mockSurveyContext = {
  currentSurvey: mockSurvey,
  loading: false,
  error: null,
  getSurveyById: jest
    .fn()
    .mockImplementation(() => Promise.resolve(mockSurvey)),
  createSurveySession: jest.fn(),
  setCurrentSurvey: jest.fn(),
  resetSurveyState: jest.fn(),
};

jest.mock("../../context/surveyContext", () => ({
  SurveyContext: {
    Provider: ({ children }) => children,
  },
  useSurveyContext: () => mockSurveyContext,
}));

// Mock session contexts
const mockSessionContext = {
  createSession: jest.fn(),
  loading: false,
  error: null,
};

jest.mock("../../context/sessionContext", () => ({
  SessionContext: {
    Provider: ({ children }) => children,
  },
  useSessionContext: () => mockSessionContext,
}));

const mockSurveySessionContext = {
  createSurveySession: jest.fn(),
  loading: false,
  error: null,
};

jest.mock("../../context/surveySessionContext", () => ({
  SurveySessionContext: {
    Provider: ({ children }) => children,
  },
  useSurveySessionContext: () => mockSurveySessionContext,
}));

// Create a wrapper component that provides all contexts
const AllTheProviders = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

const renderWithContexts = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

describe("UnifiedDetails Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.getSession.mockResolvedValue(null);
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams({ type: "quiz", quizId: "123" }),
    ]);
    mockQuizContext.loading = false;
    mockQuizContext.error = null;
    mockSurveyContext.loading = false;
    mockSurveyContext.error = null;
    mockSessionContext.error = null;
    mockSurveySessionContext.error = null;
  });

  it("displays quiz details correctly", async () => {
    renderWithContexts(<UnifiedDetails />);

    // Wait for the content to be loaded
    await waitFor(() => {
      const titleElement = screen.getByTestId("content-title");
      expect(titleElement).toBeInTheDocument();
    });

    // Now check the content
    expect(screen.getByTestId("content-title")).toHaveTextContent("Test Quiz");
    expect(screen.getByTestId("content-description")).toHaveTextContent(
      "A test quiz description"
    );
    expect(screen.getByTestId("questions-count")).toHaveTextContent("2");
    expect(screen.getByTestId("content-status")).toHaveTextContent("active");
  });

  it("handles start session for quiz", async () => {
    const mockSessionData = { _id: "session123" };
    mockSessionContext.createSession.mockResolvedValue(mockSessionData);

    renderWithContexts(<UnifiedDetails />);

    // Wait for the button to be rendered
    await waitFor(() => {
      expect(screen.getByTestId("host-button")).toBeInTheDocument();
    });

    // Click the button
    const hostButton = screen.getByTestId("host-button");
    fireEvent.click(hostButton);

    await waitFor(() => {
      expect(mockSessionContext.createSession).toHaveBeenCalledWith("123");
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/lobby", {
        state: { sessionData: mockSessionData },
        search: "?type=quiz&quizId=123&sessionId=session123",
      });
    });
  });

  it("handles resume session when cached session exists", async () => {
    const cachedSession = { _id: "cached123" };
    cacheService.getSession.mockResolvedValue(cachedSession);

    renderWithContexts(<UnifiedDetails />);

    // Wait for the resume button to be rendered
    await waitFor(() => {
      expect(screen.getByTestId("resume-button")).toBeInTheDocument();
    });

    const resumeButton = screen.getByTestId("resume-button");
    fireEvent.click(resumeButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/lobby", {
        state: { sessionData: cachedSession },
        search: "?type=quiz&quizId=123&sessionId=cached123",
      });
    });
  });

  it("handles resume survey session when cached session exists", async () => {
    // Set survey params
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams({ type: "survey", surveyId: "456" }),
    ]);

    const cachedSession = { _id: "cached456" };
    cacheService.getSession.mockResolvedValue(cachedSession);

    renderWithContexts(<UnifiedDetails />);

    await waitFor(() => {
      expect(screen.getByTestId("resume-button")).toBeInTheDocument();
      fireEvent.click(screen.getByTestId("resume-button"));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/survey-lobby", {
        state: { sessionData: cachedSession },
        search: "?type=survey&surveyId=456&sessionId=cached456",
      });
    });
  });

  it("cleans up expired sessions on unmount", async () => {
    const { unmount } = renderWithContexts(<UnifiedDetails />);
    unmount();

    await waitFor(() => {
      expect(cacheService.getSession).toHaveBeenCalledWith("quiz");
    });

    await waitFor(() => {
      expect(cacheService.getSession).toHaveBeenCalledWith("survey");
    });
  });
});
