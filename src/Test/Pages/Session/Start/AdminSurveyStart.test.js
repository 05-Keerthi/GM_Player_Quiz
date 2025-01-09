import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminSurveyStart from "../../../../pages/Session/Start/AdminSurveyStart";
import { useSurveySessionContext } from "../../../../context/surveySessionContext";
import io from "socket.io-client";

// Mock child components
jest.mock("../../../../components/Session/SurveyContentDisplay", () => {
  return function MockSurveyContentDisplay({ onNext, onEndSurvey }) {
    return (
      <div data-testid="survey-content-display">
        <button data-testid="next-button" onClick={onNext}>
          Next
        </button>
        <button data-testid="end-button" onClick={onEndSurvey}>
          End Survey
        </button>
      </div>
    );
  };
});

jest.mock("../../../../pages/Session/Start/SurveyResults", () => {
  return function MockSurveyResults({ onBackToSurvey }) {
    return (
      <div data-testid="survey-results">
        <button onClick={onBackToSurvey} data-testid="back-to-survey">
          Back
        </button>
      </div>
    );
  };
});

// Mock socket.io-client
jest.mock("socket.io-client", () => {
  const emit = jest.fn();
  const on = jest.fn();
  const off = jest.fn();
  const disconnect = jest.fn();
  return jest.fn(() => ({
    emit,
    on,
    off,
    disconnect,
  }));
});

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useSearchParams: () => [
    new URLSearchParams("?surveyId=123&sessionId=456&joinCode=789"),
  ],
  useNavigate: () => mockNavigate,
}));

// Mock surveySessionContext
jest.mock("../../../../context/surveySessionContext", () => ({
  useSurveySessionContext: jest.fn(),
}));

describe("AdminSurveyStart Component", () => {
  const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  };

  const defaultProps = {
    nextSurveyQuestion: jest.fn(),
    endSurveySession: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    io.mockImplementation(() => mockSocket);
    useSurveySessionContext.mockImplementation(() => defaultProps);
  });

  // Test 1: Initial Loading State
  test("should show loading spinner when loading is true", () => {
    useSurveySessionContext.mockImplementation(() => ({
      ...defaultProps,
      loading: true,
    }));

    render(<AdminSurveyStart />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  // Test 2: Socket Connection
  test("should initialize socket connection on mount", () => {
    render(<AdminSurveyStart />);
    expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
    expect(mockSocket.emit).toHaveBeenCalledWith("create-survey-session", {
      sessionId: "456",
    });
  });

  // Test 3: Question Navigation - Slide Type
  test("should handle slide type question correctly", async () => {
    const mockSlide = {
      _id: "slide1",
      surveyTitle: "Introduction",
      surveyContent: "Welcome",
      imageUrl: "test.jpg",
      surveyQuiz: "Quiz 1",
    };

    defaultProps.nextSurveyQuestion.mockResolvedValue({
      item: mockSlide,
      type: "slide",
      isLastItem: false,
    });

    render(<AdminSurveyStart />);

    await waitFor(() => {
      expect(screen.getByTestId("survey-content-display")).toBeInTheDocument();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      "next-survey-question",
      expect.objectContaining({
        type: "slide",
        item: expect.objectContaining({
          type: "slide",
          title: "Introduction",
        }),
      })
    );
  });

  // Test 4: Question Navigation - Question Type
  test("should handle question type correctly", async () => {
    const mockQuestion = {
      _id: "q1",
      title: "Test Question",
      timer: 30,
      answerOptions: [
        { _id: "opt1", optionText: "Option 1", color: "#FF0000" },
        { _id: "opt2", optionText: "Option 2", color: "#00FF00" },
      ],
    };

    defaultProps.nextSurveyQuestion.mockResolvedValue({
      question: mockQuestion,
      type: "question",
      isLastItem: false,
    });

    render(<AdminSurveyStart />);

    await waitFor(() => {
      expect(screen.getByTestId("survey-content-display")).toBeInTheDocument();
    });

    const coloredCounters = screen
      .getAllByRole("generic")
      .filter((el) => el.style.backgroundColor);
    expect(coloredCounters).toHaveLength(2);
  });

// Test 5: Answer Submission
test("should handle answer submission correctly", async () => {
    const mockQuestion = {
      _id: "q1",
      title: "Test Question",
      answerOptions: [
        { _id: "opt1", optionText: "Option 1", color: "#FF0000" },
        { _id: "opt2", optionText: "Option 2", color: "#00FF00" },
      ],
    };
  
    defaultProps.nextSurveyQuestion.mockResolvedValue({
      question: mockQuestion,
      type: "question",
      isLastItem: false,
    });
  
    render(<AdminSurveyStart />);
  
    // Wait for the component to render and the counters to appear
    await waitFor(() => {
      const counters = screen.getAllByRole("generic")
        .filter(el => el.style.backgroundColor);
      expect(counters.length).toBe(2);
    });
  
    // Get initial state of counters
    const initialCounters = screen.getAllByRole("generic")
      .filter(el => el.style.backgroundColor);
    expect(initialCounters[0]).toHaveTextContent("0");
    expect(initialCounters[1]).toHaveTextContent("0");
  
    // Simulate answer submission
    const answerData = {
      questionId: "q1",
      answer: "Option 1",
    };
  
    // Get and call the socket event handler
    const submitCallback = mockSocket.on.mock.calls.find(
      call => call[0] === "survey-answer-submitted"
    )[1];
    submitCallback(answerData);
  
    // Wait for first counter to update
    await waitFor(() => {
      const updatedCounters = screen.getAllByRole("generic")
        .filter(el => el.style.backgroundColor);
      expect(updatedCounters[0]).toHaveTextContent("1");
    });
  
    // Verify second counter remains unchanged
    const finalCounters = screen.getAllByRole("generic")
      .filter(el => el.style.backgroundColor);
    expect(finalCounters[1]).toHaveTextContent("0");
  });

  // Test 6: Survey Completion
  test("should handle survey completion correctly", async () => {
    const mockQuestion = {
      _id: "q1",
      title: "Last Question",
      answerOptions: [],
    };

    defaultProps.nextSurveyQuestion
      .mockResolvedValueOnce({
        question: mockQuestion,
        type: "question",
        isLastItem: true,
      })
      .mockRejectedValueOnce({
        response: {
          data: {
            message: "No more questions left in the survey session",
          },
        },
      });

    render(<AdminSurveyStart />);

    await waitFor(() => {
      expect(screen.getByTestId("survey-content-display")).toBeInTheDocument();
    });

    const nextButton = screen.getByTestId("next-button");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith("survey-completed", {
        sessionId: "456",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/results/456?joinCode=789");
  });

  // Test 7: End Survey
  test("should handle end survey correctly", async () => {
    render(<AdminSurveyStart />);

    await waitFor(() => {
      expect(screen.getByTestId("survey-content-display")).toBeInTheDocument();
    });

    const endButton = screen.getByTestId("end-button");
    fireEvent.click(endButton);

    await waitFor(() => {
      expect(defaultProps.endSurveySession).toHaveBeenCalledWith("789", "456");
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("end-survey-session", {
      sessionId: "456",
    });
    expect(mockNavigate).toHaveBeenCalledWith("/survey-list");
  });
});
