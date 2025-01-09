import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminStart from "../../../../pages/Session/Start/AdminStart";
import { useSessionContext } from "../../../../context/sessionContext";
import io from "socket.io-client";

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

  describe("Initial Rendering", () => {
    test("renders loading state correctly", () => {
      useSessionContext.mockImplementation(() => ({
        ...defaultProps,
        loading: true,
      }));

      render(<AdminStart />);
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    test("initializes socket connection", () => {
      render(<AdminStart />);
      expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
      expect(mockSocket.emit).toHaveBeenCalledWith("create-session", {
        sessionId: "456",
      });
    });
  });

  describe("Question Navigation", () => {
    const mockQuestion = {
      _id: "q1",
      type: "multiple_choice",
      timer: 30,
      options: [{ text: "Option 1" }, { text: "Option 2" }],
    };

    beforeEach(() => {
      defaultProps.nextQuestion.mockResolvedValue({
        item: mockQuestion,
        isLastItem: false,
      });
    });

    test("fetches first question on mount", async () => {
      render(<AdminStart />);

      await waitFor(() => {
        expect(defaultProps.nextQuestion).toHaveBeenCalledWith("789", "456");
      });
    });

    test("handles next question button click", async () => {
      render(<AdminStart />);

      const nextButton = await screen.findByTestId("next-button");
      fireEvent.click(nextButton);

      expect(defaultProps.nextQuestion).toHaveBeenCalledTimes(2);
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "next-item",
        expect.any(Object)
      );
    });
  });

  describe("Timer Functionality", () => {
    test("initializes timer for timed questions", async () => {
      const mockQuestion = {
        _id: "q1",
        type: "multiple_choice",
        timer: 30,
        options: [],
      };

      defaultProps.nextQuestion.mockResolvedValue({
        item: mockQuestion,
        isLastItem: false,
      });

      jest.useFakeTimers();
      render(<AdminStart />);

      await waitFor(() => {
        expect(screen.getByTestId("timer-display")).toHaveTextContent("30");
      });

      jest.advanceTimersByTime(1000);
      expect(screen.getByTestId("timer-display")).toHaveTextContent("29");

      jest.useRealTimers();
    });
  });

  describe("Answer Handling", () => {
    test("updates answer counts for multiple choice questions", async () => {
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
        // Simulate socket receiving an answer
        const answerHandler = mockSocket.on.mock.calls.find(
          (call) => call[0] === "answer-submitted"
        )[1];

        answerHandler({
          answerDetails: {
            questionId: "q1",
            answer: "Option 1",
          },
        });

        expect(screen.getByTestId("option-count-0")).toHaveTextContent("1");
      });
    });
  });

  describe("Quiz Completion", () => {
    test("shows final leaderboard when quiz ends", async () => {
      defaultProps.nextQuestion.mockRejectedValue({
        response: {
          data: {
            message: "No more items left in the session",
          },
        },
      });

      render(<AdminStart />);

      await waitFor(() => {
        expect(screen.getByTestId("final-leaderboard")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("End Session")).toBeInTheDocument();
      });
    });

    test("handles end quiz button click", async () => {
      const mockNavigate = jest.fn();
      jest
        .spyOn(require("react-router-dom"), "useNavigate")
        .mockImplementation(() => mockNavigate);

      render(<AdminStart />);

      const endButton = screen.getByTestId("end-quiz-button");
      fireEvent.click(endButton);

      await waitFor(() => {
        expect(defaultProps.endSession).toHaveBeenCalledWith("789", "456");
      });

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith("end-session", {
          sessionId: "456",
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/quiz-list");
      });
    });
  });

  describe("Error Handling", () => {
    test("handles missing join code gracefully", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      jest
        .spyOn(require("react-router-dom"), "useSearchParams")
        .mockImplementation(() => [
          new URLSearchParams("?quizId=123&sessionId=456"),
        ]);

      render(<AdminStart />);

      const nextButton = screen.getByTestId("next-button");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith("Join code is missing");
      });

      consoleError.mockRestore();
    });
  });
});
