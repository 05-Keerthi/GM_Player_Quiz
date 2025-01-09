import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SurveyInviteModal from '../../models/SurveyInviteModal';
import { useAuthContext } from '../../context/AuthContext';
import { useSurveyNotificationContext } from '../../context/SurveynotificationContext';

// Mock the context hooks
jest.mock('../../context/AuthContext');
jest.mock('../../context/SurveynotificationContext');

describe('SurveyInviteModal', () => {
  // Mock data
  const mockCurrentUser = { _id: 'current-user-id', username: 'currentUser' };
  const mockUsers = [
    { _id: 'user1', username: 'testUser1', email: 'test1@example.com' },
    { _id: 'user2', username: 'testUser2', email: 'test2@example.com' },
    { _id: mockCurrentUser._id, username: 'currentUser', email: 'current@example.com' },
  ];
  const mockSessionData = { sessionId: 'test-session-id' };

  // Mock functions
  const mockListUsers = jest.fn();
  const mockCreateNotification = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnInvite = jest.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock return values for context hooks
    useAuthContext.mockReturnValue({
      user: mockCurrentUser,
      users: mockUsers,
      listUsers: mockListUsers,
      loading: false,
      error: null,
    });

    useSurveyNotificationContext.mockReturnValue({
      createNotification: mockCreateNotification,
    });
  });

  test('renders nothing when isOpen is false', () => {
    render(
      <SurveyInviteModal
        isOpen={false}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );
    
    expect(screen.queryByText('Invite Users to Survey')).not.toBeInTheDocument();
  });

  test('renders modal content when isOpen is true', () => {
    render(
      <SurveyInviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    expect(screen.getByText('Invite Users to Survey')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    expect(screen.getByText('0 users selected')).toBeInTheDocument();
  });

  test('fetches users list when opened', () => {
    render(
      <SurveyInviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    expect(mockListUsers).toHaveBeenCalled();
  });

  test('filters out current user from the list', () => {
    render(
      <SurveyInviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    expect(screen.queryByText('currentUser')).not.toBeInTheDocument();
    expect(screen.getByText('testUser1')).toBeInTheDocument();
    expect(screen.getByText('testUser2')).toBeInTheDocument();
  });

  test('filters users based on search query', async () => {
    render(
      <SurveyInviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search users...');
    await userEvent.type(searchInput, 'test1');

    expect(screen.getByText('testUser1')).toBeInTheDocument();
    expect(screen.queryByText('testUser2')).not.toBeInTheDocument();
  });

  test('handles user selection', async () => {
    render(
      <SurveyInviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    const userCard = screen.getByText('testUser1').closest('div[class*="cursor-pointer"]');
    await userEvent.click(userCard);

    expect(screen.getByText('1 users selected')).toBeInTheDocument();
  });

  test('handles invitation submission', async () => {
    render(
      <SurveyInviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    // Select a user
    const userCard = screen.getByText('testUser1').closest('div[class*="cursor-pointer"]');
    await userEvent.click(userCard);

    // Click invite button
    const inviteButton = screen.getByText('Invite Selected');
    await userEvent.click(inviteButton);

    await waitFor(() => {
      expect(mockCreateNotification).toHaveBeenCalledWith({
        type: 'Survey-Invitation',
        message: expect.any(String),
        users: ['user1'],
        sessionId: 'test-session-id',
      });
    });

    expect(mockOnInvite).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('handles invitation without user selection', async () => {
    render(
      <SurveyInviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    // Verify that the Invite button is disabled
    const inviteButton = screen.getByText('Invite Selected');
    expect(inviteButton).toBeDisabled();
    expect(inviteButton).toHaveClass('bg-gray-300', 'cursor-not-allowed');
  });

  test('displays loading state', () => {
    useAuthContext.mockReturnValue({
      user: mockCurrentUser,
      users: [],
      listUsers: mockListUsers,
      loading: true,
      error: null,
    });

    render(
      <SurveyInviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('handles close button click', async () => {
    render(
      <SurveyInviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    const closeButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('displays error from context', () => {
    useAuthContext.mockReturnValue({
      user: mockCurrentUser,
      users: mockUsers,
      listUsers: mockListUsers,
      loading: false,
      error: 'Failed to load users',
    });

    render(
      <SurveyInviteModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        onInvite={mockOnInvite}
      />
    );

    expect(screen.getByText('Failed to load users')).toBeInTheDocument();
  });
});