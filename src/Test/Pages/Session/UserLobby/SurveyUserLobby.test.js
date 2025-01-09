import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import SurveyUserLobby from "../../../../pages/Session/UserLobby/SurveyUserLobby";
import { useAuthContext } from "../../../../context/AuthContext";
import { useSurveySessionContext } from "../../../../context/surveySessionContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import io from "socket.io-client";

// Mock dependencies
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("../../../../context/AuthContext");
jest.mock("../../../../context/surveySessionContext");
jest.mock("socket.io-client");

describe("SurveyUserLobby Component", () => {
  const mockNavigate = jest.fn();
  const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  };

  const mockUser = {
    _id: "user123",
    username: "testuser",
    email: "test@example.com",
  };

  const mockSearchParams = new URLSearchParams({
    code: "SURVEY123",
    sessionId: "session123",
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useSearchParams.mockReturnValue([mockSearchParams]);
    io.mockReturnValue(mockSocket);
  });

  // Test 1: Loading State
  test("displays loading state when auth is loading", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
    });
    useSurveySessionContext.mockReturnValue({
      loading: false,
    });

    render(<SurveyUserLobby />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  // Test 2: Unauthenticated State
  test("displays authentication required message when not authenticated", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });
    useSurveySessionContext.mockReturnValue({
      loading: false,
    });

    render(<SurveyUserLobby />);

    expect(
      screen.getByRole("heading", { name: /Authentication Required/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register/i })
    ).toBeInTheDocument();
  });

  // Test 3: Session Loading State
  test("displays joining survey session message when session is loading", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSurveySessionContext.mockReturnValue({
      loading: true,
    });

    render(<SurveyUserLobby />);

    expect(screen.getByText("Joining survey session...")).toBeInTheDocument();
  });

  // Test 4: Waiting for Survey Start
  test("displays waiting message when no current item", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSurveySessionContext.mockReturnValue({
      loading: false,
    });

    render(<SurveyUserLobby />);

    expect(
      screen.getByText("Waiting for survey to start...")
    ).toBeInTheDocument();
    expect(
      screen.getByText("The host will begin the survey shortly")
    ).toBeInTheDocument();
  });

  // Test 5: Socket Connection with User Details
  test("establishes socket connection with full user details when authenticated", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSurveySessionContext.mockReturnValue({
      loading: false,
    });

    render(<SurveyUserLobby />);

    expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
    expect(mockSocket.emit).toHaveBeenCalledWith("join-survey-session", {
      sessionId: "session123",
      userId: mockUser._id,
      username: mockUser.username,
      email: mockUser.email,
    });
  });

  // Test 6: Survey Question Display
  test("displays survey question and options when received from socket", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSurveySessionContext.mockReturnValue({
      loading: false,
    });

    const mockQuestion = {
      _id: "q1",
      title: "Survey Question",
      options: [
        { _id: "opt1", text: "Survey Option 1" },
        { _id: "opt2", text: "Survey Option 2" },
      ],
    };

    // Mock socket events
    let socketCallback;
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === "next-survey-question") {
        socketCallback = callback;
      }
    });

    render(<SurveyUserLobby />);

    // Trigger the socket event
    socketCallback({ item: mockQuestion });

    // Wait for the component to update and verify title
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Survey Question/i })
      ).toBeInTheDocument();
    });

    // Verify options are displayed as buttons
    expect(
      screen.getByRole("button", { name: /Survey Option 1/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Survey Option 2/i })
    ).toBeInTheDocument();
  });

  // Test 7: Survey Answer Submission
  test("handles survey answer submission correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSurveySessionContext.mockReturnValue({
      loading: false,
    });

    const mockQuestion = {
      _id: "q1",
      title: "Survey Question",
      options: [
        { _id: "opt1", text: "Survey Option 1" },
        { _id: "opt2", text: "Survey Option 2" },
      ],
    };

    // Set up socket event handlers
    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<SurveyUserLobby />);

    // Clear previous socket emissions (including join-survey-session)
    mockSocket.emit.mockClear();

    // Trigger next-survey-question event
    await act(async () => {
      socketHandlers["next-survey-question"]({ item: mockQuestion });
    });

    // Wait for the component to update and find the option button
    const optionButton = await screen.findByRole("button", {
      name: /Survey Option 1/i,
    });

    // Click the option
    fireEvent.click(optionButton);

    // Verify socket emission with correct payload and event name
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith("survey-submit-answer", {
        sessionId: "session123",
        answerDetails: {
          answer: "Survey Option 1",
          questionId: "q1",
          userId: "user123",
        },
      });
    });
  });

  // Test 8: Survey Session Navigation
  test("handles survey session navigation events correctly", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSurveySessionContext.mockReturnValue({
      loading: false,
    });

    render(<SurveyUserLobby />);

    // Test survey session started navigation
    const sessionStartedCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "survey-session-started"
    )[1];

    sessionStartedCallback({ session: { surveyQuiz: { _id: "survey123" } } });
    expect(mockNavigate).toHaveBeenCalledWith(
      "/survey-play?surveyId=survey123&sessionId=session123"
    );

    // Test survey session ended navigation
    const sessionEndedCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "survey-session-ended"
    )[1];

    sessionEndedCallback();
    expect(mockNavigate).toHaveBeenCalledWith("/survey-results");
  });

  // Test 9: Last Question Indicator
  test("displays last question indicator when isLastItem is true", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSurveySessionContext.mockReturnValue({
      loading: false,
    });

    const mockQuestion = {
      _id: "q1",
      title: "Last Survey Question",
      options: [
        { _id: "opt1", text: "Option 1" },
        { _id: "opt2", text: "Option 2" },
      ],
    };

    // Set up socket event handlers
    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    render(<SurveyUserLobby />);

    // Simulate receiving the last question
    await act(async () => {
      socketHandlers["next-survey-question"]({
        item: mockQuestion,
        isLast: true,
      });
    });

    // Wait for the component to update and verify the content
    await waitFor(() => {
      // Check for the question title
      expect(
        screen.getByRole("heading", { name: /Last Survey Question/i })
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      // Check for the last question indicator text
      expect(
        screen.getByText("This is the last question in the survey")
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      // Verify the first option is present
      expect(
        screen.getByRole("button", { name: /Option 1/i })
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      // Verify the second option is present
      expect(
        screen.getByRole("button", { name: /Option 2/i })
      ).toBeInTheDocument();
    });
  });
  // Test 10: Cleanup
  test("disconnects socket on unmount", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSurveySessionContext.mockReturnValue({
      loading: false,
    });

    const { unmount } = render(<SurveyUserLobby />);
    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
