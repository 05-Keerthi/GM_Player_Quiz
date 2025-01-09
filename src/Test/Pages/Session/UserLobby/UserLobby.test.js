import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserLobby from '../../../../pages/Session/UserLobby/UserLobby';
import { useAuthContext } from '../../../../context/AuthContext';
import { useSessionContext } from '../../../../context/sessionContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';


// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useSearchParams: jest.fn()
}));

jest.mock('../../../../context/AuthContext');
jest.mock('../../../../context/sessionContext');
jest.mock('socket.io-client');

describe('UserLobby Component', () => {
  const mockNavigate = jest.fn();
  const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn()
  };

  const mockUser = {
    _id: 'user123',
    username: 'testuser'
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
  });

  // Test 1: Loading State
  test('displays loading state when auth is loading', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false
    });

    render(<UserLobby />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // Test 2: Unauthenticated State
  test('displays authentication required message when not authenticated', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false
    });

    render(<UserLobby />);
    
    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  // Test 3: Session Loading State
  test('displays joining session message when session is loading', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: true
    });

    render(<UserLobby />);
    
    expect(screen.getByText('Joining session...')).toBeInTheDocument();
  });

  // Test 4: Waiting for Session Start
  test('displays waiting message when no current item', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false
    });

    render(<UserLobby />);
    
    expect(screen.getByText('Waiting for session to start...')).toBeInTheDocument();
    expect(screen.getByText('The host will begin the session shortly')).toBeInTheDocument();
  });

  // Test 5: Socket Connection
  test('establishes socket connection when authenticated', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false
    });

    render(<UserLobby />);

    expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
    expect(mockSocket.emit).toHaveBeenCalledWith('join-session', {
      sessionId: 'session123',
      joinCode: 'ABC123',
      userId: mockUser._id,
      username: mockUser.username
    });
  });

  // Test 6: Question Display
  test('displays question and options when received from socket', async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false
    });

    const mockQuestion = {
      _id: 'q1',
      title: 'Test Question',
      options: [
        { _id: 'opt1', text: 'Option 1' },
        { _id: 'opt2', text: 'Option 2' }
      ]
    };

    // Mock socket events before rendering
    let socketCallback;
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'next-item') {
        socketCallback = callback;
      }
    });

    render(<UserLobby />);

    // Trigger the socket event
    socketCallback({ type: 'question', item: mockQuestion });

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });

    // Verify options are displayed
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  // Test 7: Answer Submission
  test('handles answer submission correctly', async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false
    });

    const mockQuestion = {
      _id: 'q1',
      title: 'Test Question',
      options: [
        { _id: 'opt1', text: 'Option 1' },
        { _id: 'opt2', text: 'Option 2' }
      ]
    };

    // Mock socket events
    let socketCallback;
    mockSocket.on.mockImplementation((event, callback) => {
      if (event === 'next-item') {
        socketCallback = callback;
      }
    });

    render(<UserLobby />);

    // Trigger the socket event with the question
    socketCallback({ type: 'question', item: mockQuestion });

    // Wait for the question to be displayed and buttons to be rendered
    await waitFor(() => {
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });

    // Find and click the button by role and content
    const optionButton = screen.getByRole('button', { name: /Option 1/i });
    fireEvent.click(optionButton);

    // Verify socket emission
    expect(mockSocket.emit).toHaveBeenCalledWith('answer-submitted', {
      sessionId: 'session123',
      answerDetails: {
        answer: 'Option 1',
        questionId: 'q1',
        userId: mockUser._id
      }
    });
  });

  // Test 8: Session Navigation
  test('handles session navigation events correctly', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false
    });

    render(<UserLobby />);

    // Test session started navigation
    const sessionStartedCallback = mockSocket.on.mock.calls.find(
      call => call[0] === 'session-started'
    )[1];
    
    sessionStartedCallback({ session: { quiz: { _id: 'quiz123' } } });
    expect(mockNavigate).toHaveBeenCalledWith(
      '/play?quizId=quiz123&sessionId=session123'
    );

    // Test session ended navigation
    const sessionEndedCallback = mockSocket.on.mock.calls.find(
      call => call[0] === 'session-ended'
    )[1];
    
    sessionEndedCallback();
    expect(mockNavigate).toHaveBeenCalledWith('/results');
  });

  // Test 9: Cleanup
  test('disconnects socket on unmount', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: mockUser
    });
    useSessionContext.mockReturnValue({
      joinSession: jest.fn(),
      loading: false
    });

    const { unmount } = render(<UserLobby />);
    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});