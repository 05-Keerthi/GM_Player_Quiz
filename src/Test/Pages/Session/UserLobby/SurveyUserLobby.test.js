import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import SurveyUserLobby from "../../../../pages/Session/UserLobby/SurveyUserLobby";
import { useAuthContext } from "../../../../context/AuthContext";
import { useSurveySessionContext } from "../../../../context/surveySessionContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import io from "socket.io-client";

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
    connect: jest.fn(),
  };

  const mockUser = {
    _id: "user123",
    username: "testuser",
  };

  const mockGuestUser = {
    id: "guest123",
    username: "guestuser",
    isGuest: true,
  };

  const mockSurveyData = {
    title: "Test Survey",
    description: "Test Description",
    categories: [
      { _id: "1", name: "Category 1" },
      { _id: "2", name: "Category 2" },
    ],
  };

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { reload: jest.fn() },
    });
    jest.clearAllMocks();

    useNavigate.mockReturnValue(mockNavigate);
    useSearchParams.mockReturnValue([
      new URLSearchParams({ sessionId: "session123" }),
    ]);

    io.mockReturnValue(mockSocket);

    const createStorageMock = () => {
      const storage = {};
      return {
        getItem: jest.fn((key) => storage[key] ?? null),
        setItem: jest.fn((key, value) => {
          storage[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
          delete storage[key];
        }),
        clear: jest.fn(() => {
          Object.keys(storage).forEach((key) => {
            delete storage[key];
          });
        }),
        get length() {
          return Object.keys(storage).length;
        },
        key: jest.fn((index) => Object.keys(storage)[index]),
      };
    };

    Object.defineProperty(window, "sessionStorage", {
      value: createStorageMock(),
    });

    Object.defineProperty(window, "localStorage", {
      value: createStorageMock(),
    });

    process.env.REACT_APP_API_URL = "http://test-api.example.com";
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("displays loading state when auth is loading", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
    });

    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn(),
    });

    render(<SurveyUserLobby />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("displays error state when no active user", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: () => null,
    });

    render(<SurveyUserLobby />);

    const errorMessage = screen.getByText(/connection error/i);
    expect(errorMessage).toBeInTheDocument();

    const retryButton = screen.getByRole("button", {
      name: /try reconnecting/i,
    });
    fireEvent.click(retryButton);
    expect(window.location.reload).toHaveBeenCalled();
  });

  test("displays guest user information and cached survey data", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: () => mockGuestUser,
    });

    window.sessionStorage.setItem("surveyData", JSON.stringify(mockSurveyData));

    render(<SurveyUserLobby />);

    expect(
      screen.getByText(`Guest: ${mockGuestUser.username}`)
    ).toBeInTheDocument();
    expect(screen.getByText("Waiting for Host")).toBeInTheDocument();
    expect(screen.getByText(mockSurveyData.title)).toBeInTheDocument();
    expect(screen.getByText(mockSurveyData.description)).toBeInTheDocument();
  });

  test("establishes socket connection with correct config and params", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn(),
    });

    render(<SurveyUserLobby />);

    expect(io).toHaveBeenCalledWith("http://test-api.example.com", {
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    const connectCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "connect"
    )[1];

    await act(async () => {
      connectCallback();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("join-survey-session", {
      sessionId: "session123",
      userId: mockUser._id,
      username: mockUser.username,
      isGuest: false,
      isReconnection: true,
    });
  });

  test("handles survey session start correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn(),
    });

    render(<SurveyUserLobby />);

    const sessionStartCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "survey-session-started"
    )[1];

    const mockSessionData = {
      session: {
        surveyQuiz: {
          _id: "survey123",
          title: "Test Survey",
          description: "Test Description",
          categories: [],
        },
      },
    };

    await act(async () => {
      sessionStartCallback(mockSessionData);
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      "/survey-play?surveyId=survey123&sessionId=session123"
    );
  });

  test("handles survey session end correctly", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn(),
    });

    render(<SurveyUserLobby />);

    const sessionEndCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "survey-session-ended"
    )[1];

    await act(async () => {
      sessionEndCallback();
    });

    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith("surveyData");
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(
      "survey_session_data"
    );
    expect(mockNavigate).toHaveBeenCalledWith("/joinsurvey");
  });

  test("handles connection error state", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn(),
    });

    render(<SurveyUserLobby />);

    const errorCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "connect_error"
    )[1];

    await act(async () => {
      errorCallback(new Error("Connection failed"));
    });

    expect(
      screen.getByText("Connection error. Attempting to reconnect...")
    ).toBeInTheDocument();
  });

  test("handles reconnection attempts", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn(),
    });

    render(<SurveyUserLobby />);

    const reconnectCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "reconnect_attempt"
    )[1];

    await act(async () => {
      reconnectCallback(2);
    });

    expect(screen.getByText("Reconnection attempt: 2/3")).toBeInTheDocument();
  });

  test("cleans up on unmount", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });

    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn(),
    });

    const { unmount } = render(<SurveyUserLobby />);
    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
