import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import {
  MemoryRouter,
  useSearchParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useSurveySessionContext } from "../../../../context/surveySessionContext";
import SurveyLobby from "../../../../pages/Session/Lobby/SurveyLobby";
import io from "socket.io-client";



// Mock the required modules
jest.mock('socket.io-client');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));
jest.mock('../../../../context/surveySessionContext');
jest.mock('../../../../components/NavbarComp', () => {
  return function DummyNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});
jest.mock('../../../../models/SurveyInviteModal', () => {
  return function DummyModal({ isOpen, onClose, onInvite }) {
    return isOpen ? (
      <div data-testid="invite-modal">
        <button onClick={() => onInvite([{ _id: 'test-user' }])}>Invite Users</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

describe('SurveyLobby', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
  
  const mockSessionData = {
    _id: 'test-session',
    surveyJoinCode: '123456',
    surveyPlayers: [],
    surveyQuiz: { _id: 'quiz-id' },
    surveyQrCodeImageUrl: 'test-url.png'
  };

  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    io.mockReturnValue(mockSocket);
    useSearchParams.mockReturnValue([new URLSearchParams({ surveyId: 'test-id' })]);
    useLocation.mockReturnValue({ state: { sessionData: mockSessionData } });
    useNavigate.mockReturnValue(mockNavigate);
    useSurveySessionContext.mockReturnValue({
      startSurveySession: jest.fn().mockResolvedValue({ questions: [] }),
      loading: false
    });
  });

  it('renders loading state initially', () => {
    render(
      <MemoryRouter>
        <SurveyLobby />
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-title')).toBeInTheDocument();
    expect(screen.getByTestId('loading-status')).toBeInTheDocument();
  });

  it('shows game PIN after loading', async () => {
    jest.useFakeTimers();
    
    render(
      <MemoryRouter>
        <SurveyLobby />
      </MemoryRouter>
    );

    // Advance timers to trigger the showPin state change
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Game PIN:')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('123 456')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('initializes socket connection and creates survey session', async () => {
    render(
      <MemoryRouter>
        <SurveyLobby />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
    });

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('create-survey-session', {
        sessionId: mockSessionData._id,
        joinCode: mockSessionData.surveyJoinCode,
      });
    });
  });

  it('handles new players joining', async () => {
    jest.useFakeTimers();
    
    render(
      <MemoryRouter>
        <SurveyLobby />
      </MemoryRouter>
    );

    // Advance timers to trigger the showPin state change
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Get the callback function for user-joined-survey event
    const handleUserJoined = mockSocket.on.mock.calls.find(
      call => call[0] === 'user-joined-survey'
    )[1];

    // Simulate a player joining
    act(() => {
      handleUserJoined({
        user: {
          _id: 'player1',
          username: 'TestPlayer',
          email: 'test@example.com'
        }
      });
    });

    await waitFor(() => {
      // The username is inside a p tag with specific styles
      const playerElements = screen.getAllByText(/TestPlayer/i);
      expect(playerElements.length).toBeGreaterThan(0);
    });

    jest.useRealTimers();
  });

  it('handles start session button click', async () => {
    jest.useFakeTimers();
    const { startSurveySession } = useSurveySessionContext();

    render(
      <MemoryRouter>
        <SurveyLobby />
      </MemoryRouter>
    );

    // Advance timers to trigger the showPin state change
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Add a test player to enable the start button
    const handleUserJoined = mockSocket.on.mock.calls.find(
      call => call[0] === 'user-joined-survey'
    )[1];

    act(() => {
      handleUserJoined({
        user: {
          _id: 'player1',
          username: 'TestPlayer',
          email: 'test@example.com'
        }
      });
    });

    // Find and click the start button
    const startButton = await screen.findByText('Start Survey');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(startSurveySession).toHaveBeenCalledWith(
        mockSessionData.surveyJoinCode,
        mockSessionData._id
      );
    });

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'survey-session-started',
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/start-survey')
      );
    });

    jest.useRealTimers();
  });

  it('handles invite modal interactions', async () => {
    jest.useFakeTimers();
    
    render(
      <MemoryRouter>
        <SurveyLobby />
      </MemoryRouter>
    );

    // Advance timers to trigger the showPin state change
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Click the invite button using exact text match and case-insensitive
    const inviteButton = screen.getByRole('button', { name: /^invite$/i });
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(screen.getByTestId('invite-modal')).toBeInTheDocument();
    });

    // Test inviting users
    const inviteUsersButton = screen.getByText('Invite Users');
    fireEvent.click(inviteUsersButton);

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'invite-user',
      expect.objectContaining({
        sessionId: mockSessionData._id,
        userId: 'test-user',
        joinCode: mockSessionData.surveyJoinCode
      })
    );

    jest.useRealTimers();
  });

  it('cleans up socket connection on unmount', () => {
    const { unmount } = render(
      <MemoryRouter>
        <SurveyLobby />
      </MemoryRouter>
    );

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('handles errors during session start', async () => {
    jest.useFakeTimers();
    
    const mockError = new Error('Failed to start session');
    useSurveySessionContext.mockReturnValue({
      startSurveySession: jest.fn().mockRejectedValue(mockError),
      loading: false
    });

    render(
      <MemoryRouter>
        <SurveyLobby />
      </MemoryRouter>
    );

    // Advance timers to trigger the showPin state change
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Add a test player to enable the start button
    const handleUserJoined = mockSocket.on.mock.calls.find(
      call => call[0] === 'user-joined-survey'
    )[1];

    act(() => {
      handleUserJoined({
        user: {
          _id: 'player1',
          username: 'TestPlayer',
          email: 'test@example.com'
        }
      });
    });

    // Find and click the start button
    const startButton = screen.getByText('Start Survey');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to start survey session. Please try again.')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});