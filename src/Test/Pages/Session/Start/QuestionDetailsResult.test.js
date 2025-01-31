import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import QuestionDetailsResult from "../../../../pages/Session/Start/QuestionDetailsResult";
import { useNavigate, useParams } from "react-router-dom";

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("QuestionDetailsResult Component", () => {
  const mockNavigate = jest.fn();
  const defaultParams = {
    questionId: "q123",
    sessionId: "s456",
  };

  const mockQuestionData = {
    question: {
      title: "Test Question",
      dimension: "Test Dimension",
      description: "Test Description",
      answerOptions: [
        { optionText: "Option 1", color: "#000000" },
        { optionText: "Option 2", color: "#000000" },
        { optionText: "Option 3", color: "#000000" },
      ],
    },
    groupedAnswers: {
      "Option 1": {
        count: 2,
        users: [
          { username: "User1", timeTaken: 5 },
          { username: "User2", timeTaken: 3 },
        ],
      },
      "Option 2": {
        count: 1,
        users: [{ username: "User3", timeTaken: 4 }],
      },
      "Option 3": {
        count: 0,
        users: [],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn(() => "mock-token");
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue(defaultParams);
  });

  // Test 1: Loading State
  test("should display loading spinner initially", () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<QuestionDetailsResult />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  // Test 2: Error State
  test("should display error message when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    render(<QuestionDetailsResult />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
  });

  // Test 3: Successful Data Fetch
  test("should display question details when fetch succeeds", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockQuestionData),
    });

    render(<QuestionDetailsResult />);

    await waitFor(() => {
      expect(screen.getByText("Test Question")).toBeInTheDocument();
    });

    expect(screen.getByText("Test Dimension")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  // Test 4: Answer Options Display
  test("should display answer options with their responses in table format", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockQuestionData),
    });

    render(<QuestionDetailsResult />);

    await waitFor(() => {
      // Check for column headers
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();

      // Check for user responses
      expect(screen.getByText("User1")).toBeInTheDocument();
      expect(screen.getByText("User2")).toBeInTheDocument();
      expect(screen.getByText("User3")).toBeInTheDocument();

      // Check for time taken
      expect(screen.getByText("5s")).toBeInTheDocument();
      expect(screen.getByText("3s")).toBeInTheDocument();
      expect(screen.getByText("4s")).toBeInTheDocument();
    });
  });

  // Test 5: No Responses Display
  test("should display empty cells for options with no responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockQuestionData),
    });

    render(<QuestionDetailsResult />);

    await waitFor(() => {
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    // Get all cells in the Option 3 column (excluding header)
    const option3Cells = screen
      .getAllByRole("cell")
      .filter((cell) => cell.textContent === "");
    expect(option3Cells.length).toBeGreaterThan(0);
  });

  // Test 6: Navigation
  test("should handle back navigation", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockQuestionData),
    });

    render(<QuestionDetailsResult />);

    await waitFor(() => {
      expect(screen.getByText("Back to Results")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Back to Results"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  // Test 7: API Call Verification
  test("should make API call with correct parameters", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockQuestionData),
    });

    render(<QuestionDetailsResult />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/survey-answers/s456/q123`,
        expect.objectContaining({
          headers: {
            Authorization: "Bearer mock-token",
          },
        })
      );
    });
  });
});
