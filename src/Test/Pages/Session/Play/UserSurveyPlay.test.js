import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import UserSurveyPlay from "../../../../pages/Session/Play/UserSurveyPlay";
import { useAuthContext } from "../../../../context/AuthContext";
import { useSurveyAnswerContext } from "../../../../context/surveyAnswerContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import io from "socket.io-client";

// Mock dependencies
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("../../../../context/AuthContext");
jest.mock("../../../../context/surveyAnswerContext");
jest.mock("socket.io-client");

// Mock SurveyContentDisplay component
jest.mock("../../../../components/Session/SurveyContentDisplay", () => ({
  __esModule: true,
  default: ({
    item,
    onSubmitAnswer,
    timeLeft,
    isLastItem,
    isSurveyEnded,
    isSubmitted,
  }) => (
    <div data-testid="survey-content-display">
      {item && (
        <>
          <h2>{item.title}</h2>
          {item.type !== "slide" && (
            <div data-testid="answer-options">
              {item.answerOptions?.map((option) => (
                <div
                  key={option._id}
                  data-testid={`option-${option._id}`}
                  onClick={() =>
                    !isSubmitted && onSubmitAnswer({ text: option.optionText })
                  }
                  className={`cursor-pointer ${
                    isSubmitted ? "opacity-50" : ""
                  }`}
                >
                  {option.optionText}
                  {option.color && <div>Color: {option.color}</div>}
                </div>
              ))}
            </div>
          )}
          <div data-testid="time-left">{timeLeft}</div>
          {isLastItem && <div>Last Question</div>}
          {isSurveyEnded && <div>Survey Ended</div>}
          {isSubmitted && (
            <div data-testid="submitted-indicator">Answer Submitted</div>
          )}
        </>
      )}
    </div>
  ),
}));

describe("UserSurveyPlay Component", () => {
  const mockNavigate = jest.fn();
  const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  };
  const mockSubmitSurveyAnswer = jest.fn().mockResolvedValue({ success: true });
  const mockUser = {
    id: "user123",
    username: "testuser",
  };
  const mockSearchParams = new URLSearchParams({
    sessionId: "session123",
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useSearchParams.mockReturnValue([mockSearchParams]);
    io.mockReturnValue(mockSocket);
    useSurveyAnswerContext.mockReturnValue({
      submitSurveyAnswer: mockSubmitSurveyAnswer,
    });
    process.env.REACT_APP_API_URL = "http://localhost:3001";
  });

  // Test 1: Loading State
  test("displays loading state when auth is loading", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
    });

    render(<UserSurveyPlay />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  // Test 2: Authentication Redirect
  test("redirects to login when not authenticated", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    render(<UserSurveyPlay />);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  // Test 3: Socket Connection
  test("establishes socket connection with user details", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    render(<UserSurveyPlay />);

    expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
    expect(mockSocket.emit).toHaveBeenCalledWith("join-survey-session", {
      sessionId: "session123",
      userId: mockUser.id,
      username: mockUser.username,
    });
  });

  // Test 4: Answer Submission
  test("should handle answer submission correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
  
    const mockQuestion = {
      _id: "q1",
      title: "Test Question",
      type: "single_select",
      answerOptions: [{ _id: "opt1", optionText: "Option 1" }],
    };
  
    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });
  
    render(<UserSurveyPlay />);
  
    await act(async () => {
      socketHandlers["next-survey-question"]({
        question: mockQuestion,
        initialTime: 30,
      });
    });
  
    const option = screen.getByTestId("option-opt1");
    expect(option).toHaveClass("cursor-pointer");
    expect(option).not.toHaveClass("opacity-50");
  
    // Submit answer
    fireEvent.click(option);
  
    // Verify submission
    await waitFor(() => {
      expect(mockSubmitSurveyAnswer).toHaveBeenCalledWith(
        "session123",
        "q1",
        expect.objectContaining({
          answer: "Option 1",
        })
      );
    });
  });

  // Test 5: Slide Type Handling
  test("handles slide type correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const mockSlide = {
      _id: "slide1",
      title: "Survey Introduction",
      type: "slide",
      content: "Welcome to the survey",
    };

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserSurveyPlay />);

    await act(async () => {
      socketHandlers["next-survey-question"]({
        question: mockSlide,
        type: "slide",
      });
    });

    expect(screen.getByText("Survey Introduction")).toBeInTheDocument();
    expect(screen.queryByTestId("answer-options")).not.toBeInTheDocument();
  });

  // Test 6: Survey Completion
  test("handles survey completion correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserSurveyPlay />);

    await act(async () => {
      socketHandlers["survey-completed"]();
    });

    expect(screen.getByText("Survey Completed!")).toBeInTheDocument();
    expect(
      screen.getByText("Thank you for your participation.")
    ).toBeInTheDocument();
  });

  // Test 7: Timer Sync
  test("handles timer sync correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const mockQuestion = {
      _id: "q1",
      title: "Test Question",
      type: "single_select",
    };

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserSurveyPlay />);

    await act(async () => {
      socketHandlers["next-survey-question"]({
        question: mockQuestion,
        initialTime: 30,
      });
    });

    await act(async () => {
      socketHandlers["timer-sync"]({ timeLeft: 15 });
    });

    expect(screen.getByTestId("time-left")).toHaveTextContent("15");
  });

  // Test 8: Last Question Indicator
  test("shows last question indicator correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const mockQuestion = {
      _id: "q1",
      title: "Final Question",
      type: "single_select",
      answerOptions: [{ _id: "opt1", optionText: "Option 1" }],
    };

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserSurveyPlay />);

    await act(async () => {
      socketHandlers["next-survey-question"]({
        question: mockQuestion,
        isLastQuestion: true,
        initialTime: 30,
      });
    });

    expect(screen.getByText("Last Question")).toBeInTheDocument();
  });

  // Test 9: Survey Session End
  test("handles survey session end correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    jest.useFakeTimers();

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserSurveyPlay />);

    await act(async () => {
      socketHandlers["survey-session-ended"]();
    });

    expect(screen.getByText("Survey Completed!")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/joinsurvey");

    jest.useRealTimers();
  });

  // Test 10: Cleanup
  test("cleans up socket connections on unmount", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const { unmount } = render(<UserSurveyPlay />);
    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  // Test 11: Time Taken Calculation
  test("calculates time taken correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    // Mock Date.now
    const mockStartTime = 1000000;
    const mockEndTime = 1010000; // 10 seconds later
    jest
      .spyOn(Date, "now")
      .mockImplementationOnce(() => mockStartTime)
      .mockImplementationOnce(() => mockEndTime);

    const mockQuestion = {
      _id: "q1",
      title: "Test Question",
      type: "single_select",
      answerOptions: [{ _id: "opt1", optionText: "Option 1" }],
    };

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserSurveyPlay />);

    await act(async () => {
      socketHandlers["next-survey-question"]({
        question: mockQuestion,
        initialTime: 30,
      });
    });

    const option = screen.getByTestId("option-opt1");
    fireEvent.click(option);

    await waitFor(() => {
      expect(mockSubmitSurveyAnswer).toHaveBeenCalledWith(
        "session123",
        "q1",
        expect.objectContaining({
          answer: "Option 1",
          timeTaken: 10, // 10 seconds difference
        })
      );
    });
  });

});
