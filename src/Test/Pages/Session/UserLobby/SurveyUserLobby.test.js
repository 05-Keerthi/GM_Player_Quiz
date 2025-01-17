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

describe('SurveyUserLobby Component', () => {
  const mockNavigate = jest.fn();
  const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn()
  };

  const mockUser = {
    _id: 'user123',
    username: 'testuser'
  };

  const mockGuestUser = {
    id: 'guest123',
    username: 'guestuser',
    isGuest: true
  };

  const mockSearchParams = new URLSearchParams({
    code: 'ABC123',
    sessionId: 'session123'
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useSearchParams.mockReturnValue([mockSearchParams]);
    io.mockReturnValue(mockSocket);

    // Mock console methods to suppress expected logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test 1: Auth Loading State
  test('displays loading state when auth is loading', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null
    });
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn()
    });

    render(<SurveyUserLobby />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  // Test 2: No Active User State
  test('displays session error when no active user', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null
    });
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: () => null
    });

    render(<SurveyUserLobby />);
    
    expect(screen.getByText('Session Error')).toBeInTheDocument();
    expect(screen.getByText('Please rejoin the survey session.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Return to Join Page' })).toBeInTheDocument();
  });

  // Test 3: Guest User Display
  test('displays guest user information correctly', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null
    });
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: () => mockGuestUser
    });

    render(<SurveyUserLobby />);
    
    expect(screen.getByText(`Guest: ${mockGuestUser.username}`)).toBeInTheDocument();
    expect(screen.getByText('Waiting for Host')).toBeInTheDocument();
    expect(screen.getByText('The survey will begin when the host starts the session')).toBeInTheDocument();
  });

  // Test 4: Authenticated User Socket Connection
  test('establishes socket connection for authenticated user', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn()
    });

    render(<SurveyUserLobby />);

    // Simulate socket connection
    const connectCallback = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect'
    )[1];
    connectCallback();

    expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
    expect(mockSocket.emit).toHaveBeenCalledWith('join-survey-session', {
      sessionId: 'session123',
      userId: mockUser._id,
      username: mockUser.username,
      isGuest: false
    });
  });

  // Test 5: Guest User Socket Connection
  test('establishes socket connection for guest user', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null
    });
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: () => mockGuestUser
    });

    render(<SurveyUserLobby />);

    // Simulate socket connection
    const connectCallback = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect'
    )[1];
    connectCallback();

    expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
    expect(mockSocket.emit).toHaveBeenCalledWith('join-survey-session', {
      sessionId: 'session123',
      userId: mockGuestUser.id,
      username: mockGuestUser.username,
      isGuest: true
    });
  });

  // Test 6: Session Started Navigation
  test('handles survey session started event correctly', async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn()
    });

    render(<SurveyUserLobby />);

    // Find and call the session started callback
    const sessionStartedCallback = mockSocket.on.mock.calls.find(
      call => call[0] === 'survey-session-started'
    )[1];
    
    sessionStartedCallback({ session: { surveyQuiz: { _id: 'survey123' } } });
    
    expect(mockNavigate).toHaveBeenCalledWith(
      '/survey-play?surveyId=survey123&sessionId=session123'
    );
  });

  // Test 7: Session Ended Navigation
  test('handles survey session ended event correctly', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn()
    });

    render(<SurveyUserLobby />);

    // Find and call the session ended callback
    const sessionEndedCallback = mockSocket.on.mock.calls.find(
      call => call[0] === 'survey-session-ended'
    )[1];
    
    sessionEndedCallback();
    
    expect(mockNavigate).toHaveBeenCalledWith('/joinsurvey');
  });

  // Test 8: Connection Error Handling
  test('displays error message on socket connection error', async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn()
    });

    render(<SurveyUserLobby />);

    // Find and call the connection error callback
    const connectErrorCallback = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect_error'
    )[1];
    
    connectErrorCallback(new Error('Connection failed'));

    await waitFor(() => {
      expect(screen.getByText('Connection error. Please try again.')).toBeInTheDocument();
    });
  });

  // Test 9: Cleanup on Unmount
  test('disconnects socket and cleans up event listeners on unmount', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn()
    });

    const { unmount } = render(<SurveyUserLobby />);
    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  // Test 10: Return to Join Page Navigation
  test('navigates to join survey page when return button is clicked', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null
    });
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: () => null
    });

    render(<SurveyUserLobby />);
    
    const returnButton = screen.getByRole('button', { name: 'Return to Join Page' });
    fireEvent.click(returnButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/joinsurvey');
  });

  // Test 11: Effect Cleanup
  test('cleans up socket event listeners on unmount', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn()
    });

    const { unmount } = render(<SurveyUserLobby />);

    // Verify socket event listeners are set up
    expect(mockSocket.on).toHaveBeenCalledWith('survey-session-started', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('survey-session-ended', expect.any(Function));

    unmount();

    // Verify cleanup
    expect(mockSocket.off).toHaveBeenCalledWith('survey-session-started');
    expect(mockSocket.off).toHaveBeenCalledWith('survey-session-ended');
  });

  // Test 12: Environment Variable Usage
  test('uses correct API URL from environment variable', () => {
    const originalEnv = process.env.REACT_APP_API_URL;
    process.env.REACT_APP_API_URL = 'http://test-api.example.com';

    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSurveySessionContext.mockReturnValue({
      checkGuestStatus: jest.fn()
    });

    render(<SurveyUserLobby />);

    expect(io).toHaveBeenCalledWith('http://test-api.example.com');

    // Cleanup
    process.env.REACT_APP_API_URL = originalEnv;
  });
});