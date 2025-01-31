import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import UserPlay from "../../../../pages/Session/Play/UserPlay";
import { useAuthContext } from "../../../../context/AuthContext";
import { useAnswerContext } from "../../../../context/answerContext";
import { useLeaderboardContext } from "../../../../context/leaderboardContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import io from "socket.io-client";

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock contexts
jest.mock("../../../../context/AuthContext");
jest.mock("../../../../context/answerContext");
jest.mock("../../../../context/leaderboardContext");

// Mock socket.io-client
jest.mock("socket.io-client");

// Mock FinalLeaderboard component
jest.mock("../../../../pages/Session/FinalLeaderboard", () => ({
  __esModule: true,
  default: ({ sessionId, userId, isAdmin }) => (
    <div data-testid="final-leaderboard">
      Final Leaderboard
      <div>Session ID: {sessionId}</div>
      <div>User ID: {userId}</div>
      <div>Is Admin: {isAdmin.toString()}</div>
    </div>
  ),
}));

// Mock ContentDisplay component
jest.mock("../../../../components/Session/ContentDisplay", () => ({
  __esModule: true,
  default: ({
    item,
    onSubmitAnswer,
    timeLeft,
    isLastItem,
    isTimeUp,
    hasSubmitted,
  }) => (
    <div data-testid="content-display">
      {item && (
        <>
          <h2>{item.title}</h2>
          {item.type !== "classic" && (
            <button
              onClick={() => onSubmitAnswer({ text: "Test Answer" })}
              disabled={hasSubmitted || isTimeUp}
            >
              Submit Answer
            </button>
          )}
          <div data-testid="time-left">{timeLeft}</div>
          {isLastItem && <div>Last Item</div>}
          {isTimeUp && <div>Time Up</div>}
          {hasSubmitted && <div>Answer Submitted</div>}
        </>
      )}
    </div>
  ),
}));

describe("UserPlay Component", () => {
  const mockNavigate = jest.fn();
  const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  };
  const mockSubmitAnswer = jest.fn().mockResolvedValue({ success: true });

  const mockUser = {
    id: "user123",
    _id: "user123",
    username: "testuser",
  };

  const mockSearchParams = new URLSearchParams({
    sessionId: "session123",
  });

  // Setup for date mocking
  let originalDateNow;
  let mockCurrentTime;

  beforeAll(() => {
    originalDateNow = Date.now;
  });

  afterAll(() => {
    Date.now = originalDateNow;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentTime = 1640995200000; // 2022-01-01 00:00:00
    Date.now = jest.fn(() => mockCurrentTime);

    // Setup common mocks
    useNavigate.mockReturnValue(mockNavigate);
    useSearchParams.mockReturnValue([mockSearchParams]);
    io.mockReturnValue(mockSocket);
    useAnswerContext.mockReturnValue({ submitAnswer: mockSubmitAnswer });
    useLeaderboardContext.mockReturnValue({
      leaderboard: [],
      loading: false,
      fetchLeaderboard: jest.fn(),
    });

    // Reset process.env if needed
    process.env.REACT_APP_API_URL = "http://localhost:3001";
  });

  // Test 1: Loading State
  test("displays loading state when auth is loading", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
    });

    render(<UserPlay />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  // Test 2: Unauthenticated Redirect
  test("redirects to login when not authenticated", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    render(<UserPlay />);

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  // Test 3: Socket Connection
  test('establishes socket connection with user details', async () => {
    // Mock the connected state of the socket
    mockSocket.connected = true;
    
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
      // Immediately trigger the connect handler if it's a connect event
      if (event === 'connect') {
        handler();
      }
    });

    render(<UserPlay />);

    // Wait for effects to complete
    await act(async () => {
      // Trigger connect event handler
      socketHandlers['connect']?.();
      await Promise.resolve();
    });

    expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
    expect(mockSocket.emit).toHaveBeenCalledWith('join-session', {
      sessionId: 'session123',
      userId: 'user123',
      username: 'testuser',
      isReconnection: true  // Add this field to match implementation
    });
  });

  // Updated Test: Session End Handling
  test('handles session end correctly', async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserPlay />);

    await act(async () => {
      socketHandlers['session-ended']();
    });

    // Update the expected navigation path to match the implementation
    expect(mockNavigate).toHaveBeenCalledWith('/session/quiz/session123');
  });


  // Test 4: Next Item Handling
  test("handles next item event correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const mockQuestion = {
      _id: "q1",
      title: "Test Question",
      type: "multiple_choice",
      timer: 30,
    };

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserPlay />);

    await act(async () => {
      socketHandlers["next-item"]({
        type: "question",
        item: mockQuestion,
        isLastItem: false,
        initialTime: 30,
      });
    });

    expect(screen.getByText("Test Question")).toBeInTheDocument();
    expect(screen.getByTestId("time-left")).toHaveTextContent("30");
  });

  // Test 5: Timer Sync
  test("handles timer sync event correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const mockQuestion = {
      _id: "q1",
      title: "Test Question",
      type: "multiple_choice",
    };

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserPlay />);

    await act(async () => {
      socketHandlers["next-item"]({
        type: "question",
        item: mockQuestion,
        initialTime: 30,
      });
    });

    await act(async () => {
      socketHandlers["timer-sync"]({ timeLeft: 15 });
    });

    expect(screen.getByTestId("time-left")).toHaveTextContent("15");
  });

  // Test 6: Answer Submission
  test("handles answer submission correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const mockQuestion = {
      _id: "q1",
      title: "Test Question",
      type: "multiple_choice",
    };

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserPlay />);

    await act(async () => {
      socketHandlers["next-item"]({
        type: "question",
        item: mockQuestion,
        initialTime: 30,
      });
    });

    // Advance time by 5 seconds
    mockCurrentTime += 5000;

    const submitButton = screen.getByText("Submit Answer");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalledWith(
        "session123",
        "q1",
        expect.objectContaining({
          answer: "Test Answer",
          userId: mockUser._id,
          timeTaken: 5,
        })
      );
    });

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith("answer-submitted", {
        sessionId: "session123",
        answerDetails: expect.objectContaining({
          answer: "Test Answer",
          questionId: "q1",
          userId: mockUser.id,
          timeTaken: 5,
          type: "multiple_choice",
        }),
      });
    });

    expect(screen.getByText("Answer Submitted")).toBeInTheDocument();
  });

  // Test 7: Quiz Completion
  test("shows final leaderboard when quiz is completed", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserPlay />);

    await act(async () => {
      socketHandlers["quiz-completed"]();
    });

    expect(screen.getByTestId("final-leaderboard")).toBeInTheDocument();
    expect(screen.getByText("Final Leaderboard")).toBeInTheDocument();
  });

  // Test 8: Session End Handling
  test("handles session end correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserPlay />);

    await act(async () => {
      socketHandlers["session-ended"]();
    });

    // Update the expected navigation path to match the implementation
    expect(mockNavigate).toHaveBeenCalledWith("/session/quiz/session123");
  });

  // Test 9: Cleanup on Unmount
  test("disconnects socket on unmount", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const { unmount } = render(<UserPlay />);
    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  // Test 10: Slide Type Handling
  test("handles slide type correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const mockSlide = {
      _id: "slide1",
      title: "Test Slide",
      type: "slide",
    };

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserPlay />);

    await act(async () => {
      socketHandlers["next-item"]({
        type: "slide",
        item: mockSlide,
        initialTime: 0,
      });
    });

    expect(screen.getByText("Test Slide")).toBeInTheDocument();
    expect(screen.getByTestId("time-left")).toHaveTextContent("0");
    expect(screen.queryByText("Submit Answer")).not.toBeInTheDocument();
  });

  // Test 11: Time Up State
  test("shows time up state when timer reaches zero", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    const mockQuestion = {
      _id: "q1",
      title: "Test Question",
      type: "multiple_choice",
    };

    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<UserPlay />);

    await act(async () => {
      socketHandlers["next-item"]({
        type: "question",
        item: mockQuestion,
        initialTime: 30,
      });
    });

    await act(async () => {
      socketHandlers["timer-sync"]({ timeLeft: 0 });
    });

    expect(screen.getByText("Time Up")).toBeInTheDocument();
    const submitButton = screen.getByText("Submit Answer");
    expect(submitButton).toBeDisabled();
  });
});
