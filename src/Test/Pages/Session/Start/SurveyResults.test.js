import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SurveyResults from "../../../../pages/Session/Start/SurveyResults";

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock the Loader2 component
jest.mock("lucide-react", () => ({
  Loader2: () => (
    <div data-testid="loader" role="status" className="w-8 h-8 animate-spin">
      Loading...
    </div>
  ),
}));

const mockQuestions = [
  {
    _id: "1",
    title: "Test Question 1",
    answerOptions: [{ optionText: "Option A" }, { optionText: "Option B" }],
  },
  {
    _id: "2",
    title: "Test Question 2",
    answerOptions: [{ optionText: "Option A" }, { optionText: "Option B" }],
  },
];

const mockUserAnswers = [
  {
    answers: [
      { questionId: "1", answer: "Option A" },
      { questionId: "2", answer: "Option A" },
    ],
  },
  {
    answers: [{ questionId: "1", answer: "Option B" }],
  },
];

describe("SurveyResults", () => {
  let mockNavigate;
  let mockFetch;
  let consoleErrorSpy;

  beforeEach(() => {
    // Setup console.error spy
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Setup router mocks
    mockNavigate = jest.fn();
    require("react-router-dom").useNavigate.mockReturnValue(mockNavigate);
    require("react-router-dom").useParams.mockReturnValue({
      sessionId: "test-session",
    });
    require("react-router-dom").useLocation.mockReturnValue({
      search: "?joinCode=TEST123",
    });

    // Setup fetch mock
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => "mock-token");
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  test("renders loading state initially", () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<SurveyResults />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("renders error state when fetch fails", async () => {
    const errorMessage = "Failed to fetch";
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching session answers:",
        expect.any(Error)
      );
    });
  });

  test("renders survey results successfully", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            questions: mockQuestions,
            userAnswers: mockUserAnswers,
            surveyDetails: { Type: "Standard" },
          }),
      })
    );

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText("Survey Results")).toBeInTheDocument();
      expect(screen.getByText("Test Question 1")).toBeInTheDocument();
      expect(screen.getByText("Test Question 2")).toBeInTheDocument();
      expect(screen.getByText("Session Summary")).toBeInTheDocument();
      expect(screen.getByText("End Survey")).toBeInTheDocument();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  test("displays total responses correctly", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            questions: mockQuestions,
            userAnswers: mockUserAnswers,
            surveyDetails: { Type: "Standard" },
          }),
      })
    );

    render(<SurveyResults />);

    await waitFor(() => {
      // Check total participants
      expect(screen.getByText("2")).toBeInTheDocument();

      // Check response ratios
      expect(screen.getByText("2 / 2")).toBeInTheDocument(); // First question (2 responses)
      expect(screen.getByText("1 / 2")).toBeInTheDocument(); // Second question (1 response)
    });
  });

  test("navigates to question details when row is clicked", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            questions: mockQuestions,
            userAnswers: mockUserAnswers,
            surveyDetails: { Type: "Standard" },
          }),
      })
    );

    render(<SurveyResults />);

    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      fireEvent.click(rows[1]); // Click first question row
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      "/question-details/test-session/1?joinCode=TEST123"
    );
  });

  test("handles end quiz functionality", async () => {
    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              questions: mockQuestions,
              userAnswers: mockUserAnswers,
              surveyDetails: { Type: "Standard" },
            }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
        })
      );

    render(<SurveyResults />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("End Survey"));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/surveys/session/test-session"
      );
    });
  });

  test("handles no questions scenario", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            questions: [],
            userAnswers: [],
            surveyDetails: { Type: "Standard" },
          }),
      })
    );

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText("No questions available.")).toBeInTheDocument();
    });
  });
});
