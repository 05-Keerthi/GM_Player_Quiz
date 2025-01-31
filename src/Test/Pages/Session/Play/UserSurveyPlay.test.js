import React from "react";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import UserSurveyPlay from "../../../../pages/Session/Play/UserSurveyPlay";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../../../../context/AuthContext";
import { useSurveyAnswerContext } from "../../../../context/surveyAnswerContext";
import { useSurveySessionContext } from "../../../../context/surveySessionContext";
import io from "socket.io-client";

// Mock all required dependencies
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("../../../../context/AuthContext", () => ({
  useAuthContext: jest.fn(),
}));

jest.mock("../../../../context/surveyAnswerContext", () => ({
  useSurveyAnswerContext: jest.fn(),
}));

jest.mock("../../../../context/surveySessionContext", () => ({
  useSurveySessionContext: jest.fn(),
}));

jest.mock("socket.io-client");

// Mock data
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

const mockUser = {
  _id: "user123",
  username: "testuser",
  isGuest: false,
};

const mockGuestUser = {
  _id: "guest123",
  username: "guestuser",
  isGuest: true,
};

const mockQuestion = {
  _id: "question123",
  title: "Test Question",
  type: "single_select",
  description: "Test description",
  timer: 30,
  answerOptions: [
    { _id: "option1", optionText: "Option 1", color: "blue" },
    { _id: "option2", optionText: "Option 2", color: "red" },
  ],
};

describe("UserSurveyPlay", () => {
  // Setup before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock router hooks
    useNavigate.mockReturnValue(jest.fn());
    useSearchParams.mockReturnValue([
      new URLSearchParams("?sessionId=test123"),
    ]);

    // Mock socket.io
    io.mockReturnValue(mockSocket);

    // Mock context hooks with default values
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    useSurveyAnswerContext.mockReturnValue({
      submitSurveyAnswer: jest.fn().mockResolvedValue({}),
    });

    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn().mockReturnValue(null),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders loading state when auth is loading", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
    });

    render(<UserSurveyPlay />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("renders error state when no active user", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    render(<UserSurveyPlay />);
    expect(screen.getByText("Session Error")).toBeInTheDocument();
    expect(
      screen.getByText("Please rejoin the survey session.")
    ).toBeInTheDocument();
  });

  test("renders survey completed state", () => {
    render(<UserSurveyPlay />);

    // Simulate survey completion
    act(() => {
      const surveyCompletedHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "survey-completed"
      )[1];
      surveyCompletedHandler();
    });

    expect(screen.getByText("Survey Completed!")).toBeInTheDocument();
    expect(
      screen.getByText("Thank you for your participation.")
    ).toBeInTheDocument();
  });

  test("handles socket connection and events properly", async () => {
    render(<UserSurveyPlay />);

    // Verify socket connection
    expect(io).toHaveBeenCalledWith(expect.any(String));
    expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(
      "next-survey-question",
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      "timer-sync",
      expect.any(Function)
    );
  });

  test("handles answer submission correctly", async () => {
    const submitSurveyAnswer = jest.fn().mockResolvedValue({});
    useSurveyAnswerContext.mockReturnValue({ submitSurveyAnswer });

    render(<UserSurveyPlay />);

    // Simulate receiving question
    act(() => {
      const nextQuestionHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "next-survey-question"
      )[1];
      nextQuestionHandler({
        type: "single_select",
        question: mockQuestion,
        isLastQuestion: false,
        initialTime: 30,
      });
    });

    // Wait for the question to be displayed and click the first option
    await waitFor(() => {
      expect(screen.getByText("Option 1")).toBeInTheDocument();
    });

    const optionButton = screen.getByText("Option 1");
    fireEvent.click(optionButton);

    // Verify submission
    await waitFor(() => {
      expect(submitSurveyAnswer).toHaveBeenCalledWith(
        "test123",
        "question123",
        expect.objectContaining({
          answer: expect.any(String),
          timeTaken: expect.any(Number),
          isGuest: false,
        })
      );
    });
  });

  test("handles session end properly for guest users", async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);

    // Mock guest user context
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    // Mock survey session context to return guest user
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn().mockReturnValue(mockGuestUser),
    });

    // Set up socket event handlers
    const mockHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      mockHandlers[event] = handler;
    });

    render(<UserSurveyPlay />);

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText("Guest: guestuser")).toBeInTheDocument();
    });

    // Trigger session end event using stored handler
    act(() => {
      if (mockHandlers["survey-session-ended"]) {
        mockHandlers["survey-session-ended"]();
      }
    });

    // Advance timers to trigger navigation
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Check if navigation occurred (should go to joinsurvey for guest users)
    expect(navigate).toHaveBeenCalledWith("/joinsurvey");
  });

  test("handles session end properly for authenticated users", async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);

    // Mock authenticated user context
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    render(<UserSurveyPlay />);

    // Simulate session end
    act(() => {
      const sessionEndHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === "survey-session-ended"
      )[1];
      sessionEndHandler();
    });

    // Advance timers to trigger navigation
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Check if navigation occurred (should go to session survey page for authenticated users)
    expect(navigate).toHaveBeenCalledWith("/session/survey/test123");
  });

  // Cleanup after all tests
  afterAll(() => {
    jest.resetModules();
  });
});
