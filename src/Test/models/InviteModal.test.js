import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InviteModal from '../../models/InviteModal';
import { useAuthContext } from '../../context/AuthContext';
import { useNotificationContext } from '../../context/notificationContext';

// Mock the context hooks
jest.mock('../../context/AuthContext');
jest.mock('../../context/notificationContext');

describe('InviteModal', () => {
  // Mock data
  const mockUsers = [
    { _id: '1', username: 'user1', email: 'user1@example.com' },
    { _id: '2', username: 'user2', email: 'user2@example.com' },
    { _id: '3', username: 'user3', email: 'user3@example.com' },
  ];

  const mockSessionData = {
    sessionId: 'session123',
    joinCode: 'ABC123',
    quiz: { title: 'Test Quiz' }
  };

  const mockCurrentUser = { _id: 'currentUser', username: 'currentUser' };

  // Mock functions
  const mockListUsers = jest.fn();
  const mockCreateNotification = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnInvite = jest.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    useAuthContext.mockReturnValue({
      user: mockCurrentUser,
      users: mockUsers,
      listUsers: mockListUsers,
      loading: false,
      error: null
    });

    useNotificationContext.mockReturnValue({
      createNotification: mockCreateNotification
    });
  });

  it('renders correctly when open', () => {
    render(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    expect(screen.getByText('Invite Users')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    expect(mockListUsers).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    render(
      <InviteModal
        isOpen={false}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    expect(screen.queryByText('Invite Users')).not.toBeInTheDocument();
  });

  it('filters users based on search query', async () => {
    render(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search users...');
    await userEvent.type(searchInput, 'user1');

    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.queryByText('user2')).not.toBeInTheDocument();
  });

  it('handles user selection correctly', async () => {
    render(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    // Find and click the user card div
    const userCard = screen.getByText('user1').closest('div');
    await userEvent.click(userCard);

    // Check if the selection is reflected in the counter
    expect(screen.getByText('1 users selected')).toBeInTheDocument();
  });

  it('handles invitation process correctly', async () => {
    render(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    // Select a user
    const userCard = screen.getByText('user1').closest('div');
    await userEvent.click(userCard);

    // Click invite button
    const inviteButton = screen.getByText('Invite Selected');
    await userEvent.click(inviteButton);

    // Verify notification was created
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'invitation',
        sessionId: mockSessionData.sessionId,
        users: expect.arrayContaining([mockUsers[0]._id])
      })
    );

    // Verify callbacks were called
    expect(mockOnInvite).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays error message when session data is invalid', () => {
    render(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={{}}
        onInvite={mockOnInvite}
      />
    );

    expect(screen.getByText('Invalid session data')).toBeInTheDocument();
  });

  it('handles loading state correctly', () => {
    useAuthContext.mockReturnValue({
      user: mockCurrentUser,
      users: [],
      listUsers: mockListUsers,
      loading: true,
      error: null
    });

    render(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    // Look for the loading spinner element directly
    const loadingSpinner = screen.getByTestId('loading-spinner');
    expect(loadingSpinner).toBeInTheDocument();
    expect(loadingSpinner).toHaveClass('animate-spin');
  });

  it('displays error from context', () => {
    const errorMessage = 'Failed to load users';
    useAuthContext.mockReturnValue({
      user: mockCurrentUser,
      users: [],
      listUsers: mockListUsers,
      loading: false,
      error: errorMessage
    });

    render(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('resets state when modal is closed and reopened', async () => {
    const { rerender } = render(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    // Select a user
    const userCard = screen.getByText('user1').closest('div');
    await userEvent.click(userCard);

    // Close modal
    rerender(
      <InviteModal
        isOpen={false}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    // Reopen modal
    rerender(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    expect(screen.getByText('0 users selected')).toBeInTheDocument();
  });
});