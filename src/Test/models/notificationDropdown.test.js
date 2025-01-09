import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationDropdown from '../../models/notificationDropdown';
import { useAuthContext } from '../../context/AuthContext';
import { useNotificationContext } from '../../context/notificationContext';
import { useSurveyNotificationContext } from '../../context/SurveynotificationContext';
import io from 'socket.io-client';

// Mock the socket.io-client
jest.mock('socket.io-client');

// Mock the react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));
jest.mock('socket.io-client', () => jest.fn(() => ({ emit: jest.fn() })));

// Mock the contexts
jest.mock('../../context/AuthContext');
jest.mock('../../context/notificationContext');
jest.mock('../../context/SurveynotificationContext');

describe('NotificationDropdown', () => {
  // Mock data
  const mockUser = { id: 'user123' };
  const mockRegularNotifications = [
    {
      _id: '1',
      type: 'quiz_result',
      message: 'Quiz Result Available',
      sessionId: 'session123',
      read: false,
      createdAt: '2024-09-01T15:30:00Z',
    },
  ];
  
  const mockSurveyNotifications = [
    {
      _id: '2',
      type: 'Survey-Invitation',
      message: 'You have been invited to a survey',
      joinCode: 'ABC123',
      read: false,
      createdAt: '2024-01-09T11:00:00Z'
    }
  ];

  // Mock socket instance
  const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock socket.io-client implementation
    io.mockReturnValue(mockSocket);

    // Mock context values
    useAuthContext.mockReturnValue({ user: mockUser });
    useNotificationContext.mockReturnValue({
      notifications: mockRegularNotifications,
      loading: false,
      error: null,
      getNotificationsByUserId: jest.fn(),
      markAsRead: jest.fn()
    });
    useSurveyNotificationContext.mockReturnValue({
      notifications: mockSurveyNotifications,
      loading: false,
      error: null,
      getNotificationsByUserId: jest.fn(),
      markAsRead: jest.fn()
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<NotificationDropdown />);
    const bellIcon = screen.getByTestId('notification-bell');
    const svgElement = container.querySelector('svg');
    
    expect(bellIcon).toBeInTheDocument();
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveClass('text-gray-600', 'hover:text-gray-800');
  });

  it('shows correct unread count', () => {
    render(<NotificationDropdown />);
    const unreadBadge = screen.getByText('2');
    expect(unreadBadge).toBeInTheDocument();
    expect(unreadBadge).toHaveClass('bg-red-500', 'text-white');
  });

  it('opens dropdown when bell icon is clicked', async () => {
    render(<NotificationDropdown />);
    const bellIcon = screen.getByTestId('notification-bell');
    fireEvent.click(bellIcon);
  
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText(/quiz result available/i)).toBeInTheDocument();
    expect(screen.getByText('You have been invited to a survey')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    useNotificationContext.mockReturnValue({
      ...useNotificationContext(),
      loading: true
    });
    useSurveyNotificationContext.mockReturnValue({
      ...useSurveyNotificationContext(),
      loading: true
    });

    render(<NotificationDropdown />);
    const bellIcon = screen.getByTestId('notification-bell');
    fireEvent.click(bellIcon);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error state correctly', () => {
    const errorMessage = 'Failed to fetch notifications';
    useNotificationContext.mockReturnValue({
      ...useNotificationContext(),
      error: new Error(errorMessage)
    });

    render(<NotificationDropdown />);
    const bellIcon = screen.getByTestId('notification-bell');
    fireEvent.click(bellIcon);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles quiz  notification click correctly', async () => {
    const mockNavigate = jest.fn();
    
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);
  
    const { markAsRead } = useNotificationContext();
    io.mockReturnValue(mockSocket);
  
    render(<NotificationDropdown />);
    const bellIcon = screen.getByTestId('notification-bell');
    fireEvent.click(bellIcon);
  
    // Ensure notification is rendered
    screen.debug(); // Optional: Debug rendered DOM
  
    const notification = await screen.findByText(/quiz result available/i);
    fireEvent.click(notification);
  
    await waitFor(() => {
      expect(markAsRead).toHaveBeenCalledWith('1');
      expect(mockSocket.emit).toHaveBeenCalledWith('mark-notification-read', {
        notificationId: '1',
        userId: 'user123',
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/leaderboard?sessionId=session123');
    });
    
  });
  
  
  
  
  

  it('handles survey notification click correctly', async () => {
    const mockNavigate = jest.fn();
    const originalModule = jest.requireActual('react-router-dom');
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);

    const { markAsRead } = useSurveyNotificationContext();

    render(<NotificationDropdown />);
    const bellIcon = screen.getByTestId('notification-bell');
    fireEvent.click(bellIcon);
    
    const notification = screen.getByText('You have been invited to a survey');
    fireEvent.click(notification);

    await waitFor(() => {
      expect(markAsRead).toHaveBeenCalledWith('2');
      expect(mockSocket.emit).toHaveBeenCalledWith('mark-survey-notification-read', {
        notificationId: '2',
        userId: 'user123'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/joinsurvey?code=ABC123');
    });
  });

  it('establishes socket connection on mount', () => {
    render(<NotificationDropdown />);
    expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
    expect(mockSocket.emit).toHaveBeenCalledWith('join-user-room', { userId: 'user123' });
  });

  it('cleans up socket connection on unmount', () => {
    const { unmount } = render(<NotificationDropdown />);
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('handles socket events correctly', async () => {
    // Track socket event callbacks
    const socketCallbacks = {};
    
    // Mock the socket.on implementation before rendering
    mockSocket.on.mockImplementation((event, callback) => {
      socketCallbacks[event] = callback;
    });

    render(<NotificationDropdown />);

    // Get the context functions
    const { getNotificationsByUserId: getRegularNotifications } = useNotificationContext();
    const { getNotificationsByUserId: getSurveyNotifications } = useSurveyNotificationContext();

    // Clear the mock call counts before triggering events
    getRegularNotifications.mockClear();
    getSurveyNotifications.mockClear();

    await act(async () => {
      // Make sure the callbacks exist before calling them
      if (socketCallbacks['receive-notification']) {
        socketCallbacks['receive-notification']({ id: 'new-notification' });
      }
      
      if (socketCallbacks['receive-survey-notification']) {
        socketCallbacks['receive-survey-notification']({ id: 'new-survey-notification' });
      }
    });

    // Verify that the notification fetching functions were called
    expect(getRegularNotifications).toHaveBeenCalledWith('user123');
    expect(getSurveyNotifications).toHaveBeenCalledWith('user123');
  });

  it('displays no notifications message when empty', () => {
    useNotificationContext.mockReturnValue({
      ...useNotificationContext(),
      notifications: []
    });
    useSurveyNotificationContext.mockReturnValue({
      ...useSurveyNotificationContext(),
      notifications: []
    });

    render(<NotificationDropdown />);
    const bellIcon = screen.getByTestId('notification-bell');
    fireEvent.click(bellIcon);
    
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });
});