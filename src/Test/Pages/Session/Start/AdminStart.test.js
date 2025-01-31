import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminStart from "../../../../pages/Session/Start/AdminStart";
import { useSessionContext } from "../../../../context/sessionContext";
import io from "socket.io-client";

// Mock child components
jest.mock("../../../../components/Session/ContentDisplay", () => {
  return function MockContentDisplay({ onNext, onEndQuiz }) {
    return (
      <div data-testid="content-display">
        <button data-testid="next-button" onClick={onNext}>
          Next
        </button>
        <button data-testid="mock-end-button" onClick={onEndQuiz}>
          End
        </button>
      </div>
    );
  };
});

jest.mock("../../../../components/Session/AnswerCountDisplay", () => {
  return function MockAnswerCountDisplay() {
    return <div data-testid="answer-count-display">Answer Counts</div>;
  };
});

jest.mock("../../../../pages/Session/FinalLeaderboard", () => {
  return function MockFinalLeaderboard() {
    return <div data-testid="mock-leaderboard">Final Leaderboard</div>;
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
jest.mock("react-router-dom", () => ({
  useSearchParams: () => [
    new URLSearchParams("?quizId=123&sessionId=456&joinCode=789"),
  ],
  useNavigate: () => jest.fn(),
}));

// Mock sessionContext
jest.mock("../../../../context/sessionContext", () => ({
  useSessionContext: jest.fn(),
}));

describe("AdminStart Component", () => {
  const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  };

  const defaultProps = {
    nextQuestion: jest.fn(),
    endSession: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    io.mockImplementation(() => mockSocket);
    useSessionContext.mockImplementation(() => defaultProps);
  });

  // Test 1: Initial Loading State
  test("should show loading spinner when loading is true", () => {
    useSessionContext.mockImplementation(() => ({
      ...defaultProps,
      loading: true,
    }));

    render(<AdminStart />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  // Test 2: Socket Connection
  test("should initialize socket connection on mount", () => {
    render(<AdminStart />);
    expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
    expect(mockSocket.emit).toHaveBeenCalledWith("create-session", {
      sessionId: "456",
    });
  });

  // Test 3: Question Navigation
  test("should fetch first question on mount", async () => {
    const mockQuestion = {
      _id: "q1",
      type: "multiple_choice",
      timer: 30,
      options: [{ text: "Option 1" }, { text: "Option 2" }],
    };

    defaultProps.nextQuestion.mockResolvedValue({
      item: mockQuestion,
      isLastItem: false,
    });

    render(<AdminStart />);

    await waitFor(() => {
      expect(defaultProps.nextQuestion).toHaveBeenCalledWith("789", "456");
    });

    expect(screen.getByTestId("content-display")).toBeInTheDocument();
  });

  // Test 4: Answer Handling
  test("should handle answer submissions correctly", async () => {
    const mockQuestion = {
      _id: "q1",
      type: "multiple_choice",
      options: [{ text: "Option 1" }, { text: "Option 2" }],
    };

    defaultProps.nextQuestion.mockResolvedValue({
      item: mockQuestion,
      isLastItem: false,
    });

    render(<AdminStart />);

    await waitFor(() => {
      expect(screen.getByTestId("answer-count-display")).toBeInTheDocument();
    });

    expect(mockSocket.on).toHaveBeenCalledWith(
      "answer-submitted",
      expect.any(Function)
    );
  });

  // Test 5: Quiz Completion
  test("should handle quiz completion", async () => {
    const mockQuestion = {
      _id: "q1",
      type: "multiple_choice",
      options: [],
    };

    defaultProps.nextQuestion
      .mockResolvedValueOnce({
        item: mockQuestion,
        isLastItem: false,
      })
      .mockResolvedValueOnce({
        item: null,
        isLastItem: true,
      });

    render(<AdminStart />);

    await waitFor(() => {
      expect(screen.getByTestId("content-display")).toBeInTheDocument();
    });

    const nextButton = screen.getByTestId("next-button");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByTestId("mock-leaderboard")).toBeInTheDocument();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("quiz-completed", {
      sessionId: "456",
    });
  });

  // Test 6: End Quiz
  test("should handle end quiz correctly", async () => {
    const mockNavigate = jest.fn();
    jest
      .spyOn(require("react-router-dom"), "useNavigate")
      .mockImplementation(() => mockNavigate);

    defaultProps.nextQuestion.mockResolvedValue({
      item: {
        _id: "q1",
        type: "multiple_choice",
        options: [],
      },
      isLastItem: true,
    });

    render(<AdminStart />);

    await waitFor(() => {
      expect(screen.getByTestId("content-display")).toBeInTheDocument();
    });

    const mockEndButton = screen.getByTestId("mock-end-button");
    fireEvent.click(mockEndButton);

    await waitFor(() => {
      expect(defaultProps.endSession).toHaveBeenCalledWith("789", "456");
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("end-session", {
      sessionId: "456",
    });
    expect(mockNavigate).toHaveBeenCalledWith("/quizzes/session/456");
  });
});
