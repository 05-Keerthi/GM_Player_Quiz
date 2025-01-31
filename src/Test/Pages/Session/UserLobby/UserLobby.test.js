import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserLobby from "../../../../pages/Session/UserLobby/UserLobby";
import { useAuthContext } from "../../../../context/AuthContext";
import { useSessionContext } from "../../../../context/sessionContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import io from "socket.io-client";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("../../../../context/AuthContext");
jest.mock("../../../../context/sessionContext");
jest.mock("socket.io-client");

describe("UserLobby Component", () => {
  const mockNavigate = jest.fn();
  const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  };

  const mockUser = {
    id: "user123",
    username: "testuser",
  };

  const mockSearchParams = new URLSearchParams({
    code: "ABC123",
    sessionId: "session123",
  });

  const mockQuizData = {
    title: "Test Quiz",
    description: "Test Description",
    categories: [
      { _id: "cat1", name: "Category 1" },
      { _id: "cat2", name: "Category 2" },
    ],
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useSearchParams.mockReturnValue([mockSearchParams]);
    useSessionContext.mockReturnValue({  // Add this mock implementation
      joinSession: jest.fn(),
      loading: false
    });
    io.mockReturnValue(mockSocket);

    localStorage.clear();
    sessionStorage.clear();
  });
  test("displays loading state when auth is loading", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
    });
    useSessionContext.mockImplementation(() => ({
      joinSession: jest.fn(),
      loading: false,
    }));

    render(<UserLobby />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("establishes socket connection when authenticated", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false,
    });

    render(<UserLobby />);

    expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL, {
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("join-session", {
      sessionId: "session123",
      joinCode: "ABC123",
      userId: mockUser.id,
      username: mockUser.username,
      isReconnection: true,
    });
  });

  test("displays quiz data when available", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false,
    });

    sessionStorage.setItem("quizData", JSON.stringify(mockQuizData));

    render(<UserLobby />);

    expect(screen.getByText("Test Quiz")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Category 1")).toBeInTheDocument();
    expect(screen.getByText("Category 2")).toBeInTheDocument();
  });

  test("handles session navigation events", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false,
    });

    render(<UserLobby />);

    // Find and execute the session-started callback
    const sessionStartedCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "session-started"
    )[1];

    sessionStartedCallback({
      session: {
        quiz: { _id: "quiz123" },
      },
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      "/play?quizId=quiz123&sessionId=session123"
    );

    // Find and execute the session-ended callback
    const sessionEndedCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "session-ended"
    )[1];

    sessionEndedCallback();
    expect(mockNavigate).toHaveBeenCalledWith("/join");
  });

 
  test("disconnects socket on unmount", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false,
    });

    const { unmount } = render(<UserLobby />);
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  test("handles quiz data updates", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser,
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false,
    });

    render(<UserLobby />);

    // Find and execute the quiz-data-update callback
    const quizDataUpdateCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "quiz-data-update"
    )[1];

    quizDataUpdateCallback({
      quiz: {
        title: "Updated Quiz",
        description: "Updated Description",
        categories: [{ _id: "cat1", name: "Updated Category" }],
      },
    });

    // Verify local storage was updated
    const storedData = JSON.parse(localStorage.getItem("quiz_session_data"));
    expect(storedData.data.title).toBe("Updated Quiz");
  });
});
