import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SurveyResults from "../../../../pages/Session/Start/SurveyResults";
import { useNavigate, useParams, useLocation } from "react-router-dom";


// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("SurveyResults Component", () => {
  const mockNavigate = jest.fn();
  const defaultParams = { sessionId: "s456" };
  const mockLocation = { search: "?joinCode=abc123" };

  const mockData = {
    questions: [
      {
        _id: "q1",
        title: "Question 1",
        dimension: "Dimension 1",
        description: "Description 1",
      },
      {
        _id: "q2",
        title: "Question 2",
        dimension: "Dimension 2",
        description: "Description 2",
      },
    ],
    userAnswers: [
      {
        userId: "user1",
        answers: [
          { questionId: "q1", answer: "Answer 1" },
          { questionId: "q2", answer: "Answer 2" },
        ],
      },
      {
        userId: "user2",
        answers: [{ questionId: "q1", answer: "Answer 1" }],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn(() => "mock-token");
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue(defaultParams);
    useLocation.mockReturnValue(mockLocation);
  });

  // Test 1: Loading State
  test("should show loading spinner initially", () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<SurveyResults />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  // Test 2: Error State
  test("should display error message when fetch fails", async () => {
    const errorMessage = "Failed to fetch";
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText("Error: Failed to fetch")).toBeInTheDocument();
    });
  });

  // Test 3: Empty State
  test("should display message when no questions are available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ questions: [], userAnswers: [] }),
    });

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText("No questions available.")).toBeInTheDocument();
    });
  });

  // Test 4: Questions Display
  test("should display questions and their responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText("Question 1")).toBeInTheDocument();
    });

    expect(screen.getByText("2")).toBeInTheDocument(); // Total responses for Q1
    expect(screen.getByText("1")).toBeInTheDocument(); // Total responses for Q2
  });

  // Test 5: Question Row Click
  test("should navigate to question details when row is clicked", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText("Question 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Question 1"));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/question-details/s456/q1?joinCode=abc123"
    );
  });

  // Test 6: End Survey
  test("should handle end survey action", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText("End Survey")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("End Survey"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/survey-sessions/abc123/s456/end",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          },
          body: JSON.stringify({ joinCode: "abc123" }),
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/survey-list");
  });

  // Test 7: API Call Verification
  test("should make initial API call with correct parameters", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    render(<SurveyResults />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/survey-answers/s456`,
        expect.objectContaining({
          headers: {
            Authorization: "Bearer mock-token",
          },
        })
      );
    });
  });

  // Test 8: Retry Button
  test("should reload page when retry button is clicked", async () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { reload: jest.fn() };

    mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Retry"));
    expect(window.location.reload).toHaveBeenCalled();

    window.location = originalLocation;
  });
});
