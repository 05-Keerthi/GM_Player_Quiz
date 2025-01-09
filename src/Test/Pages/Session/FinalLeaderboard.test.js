import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FinalLeaderboard from '../../../pages/Session/FinalLeaderboard';
import { useLeaderboardContext } from '../../../context/leaderboardContext';
import { useNotificationContext } from '../../../context/notificationContext';

// Mock the contexts
jest.mock('../../../context/leaderboardContext');
jest.mock('../../../context/notificationContext');

// Mock fetch
global.fetch = jest.fn();

describe('FinalLeaderboard Component', () => {
  const mockGetLeaderboard = jest.fn();
  const mockGetUserScore = jest.fn();
  const mockSendNotificationToUsers = jest.fn();
  
  const mockLeaderboardData = [
    {
      user: { _id: '1', username: 'User1' },
      totalPoints: 100
    },
    {
      user: { _id: '2', username: 'User2' },
      totalPoints: 90
    },
    {
      user: { _id: '3', username: 'User3' },
      totalPoints: 80
    }
  ];

  const mockUserScore = {
    totalPoints: 90,
    rank: 2
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock context values
    useLeaderboardContext.mockReturnValue({
      getLeaderboard: mockGetLeaderboard,
      getUserScore: mockGetUserScore
    });
    
    useNotificationContext.mockReturnValue({
      sendNotificationToUsers: mockSendNotificationToUsers
    });

    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => 'mock-token');
  });

  // Test 1: Loading State
  test('displays loading spinner initially', () => {
    mockGetLeaderboard.mockImplementation(() => new Promise(() => {}));
    
    render(<FinalLeaderboard sessionId="123" isAdmin={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // Test 2: Admin View - Successful Leaderboard Load
  test('displays leaderboard data for admin view', async () => {
    mockGetLeaderboard.mockResolvedValueOnce({ leaderboard: mockLeaderboardData });
    
    render(<FinalLeaderboard sessionId="123" isAdmin={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('User1')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('100 pts')).toBeInTheDocument();
    });

    // Verify trophy/medals are displayed
    await waitFor(() => {
      expect(screen.getByText('User2')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('User3')).toBeInTheDocument();
    });
  });

  // Test 3: Admin View - Empty Leaderboard
  test('displays no participants message when leaderboard is empty', async () => {
    mockGetLeaderboard.mockResolvedValueOnce({ leaderboard: [] });
    
    render(<FinalLeaderboard sessionId="123" isAdmin={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('No participants in this quiz')).toBeInTheDocument();
    });
  });

  // Test 4: User View - Score Display
  test('displays user score and rank for regular user view', async () => {
    mockGetUserScore.mockResolvedValueOnce({ user: mockUserScore });
    
    render(<FinalLeaderboard sessionId="123" userId="user1" isAdmin={false} />);
    
    await waitFor(() => {
      expect(screen.getByText('90 pts')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('#2')).toBeInTheDocument();
    });
  });

  // Test 5: User View - No Score
  test('displays no score message for user without score', async () => {
    mockGetUserScore.mockResolvedValueOnce({ user: null });
    
    render(<FinalLeaderboard sessionId="123" userId="user1" isAdmin={false} />);
    
    await waitFor(() => {
      expect(screen.getByText('No score recorded')).toBeInTheDocument();
    });
  });

  // Test 6: Send Results Functionality
  test('handles sending results correctly', async () => {
    mockGetLeaderboard.mockResolvedValueOnce({ leaderboard: mockLeaderboardData });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Success' })
    });
    
    render(<FinalLeaderboard sessionId="123" isAdmin={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Send Results')).toBeInTheDocument();
    });

    // Click send results button
    fireEvent.click(screen.getByText('Send Results'));
    
    // Verify popup appears
    expect(screen.getByText('Are you sure you want to send the results to all users?')).toBeInTheDocument();
    
    // Confirm sending results
    fireEvent.click(screen.getByText('Yes, Send Results'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/notifications`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            type: 'quiz_result',
            sessionId: '123',
            users: ['1', '2', '3']
          })
        })
      );
    });
  });

  // Test 7: Error Handling
  test('handles API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetLeaderboard.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    render(<FinalLeaderboard sessionId="123" isAdmin={true} />);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in fetchLeaderboardData:',
        expect.any(Error)
      );
    });
    
    consoleErrorSpy.mockRestore();
  });

  // Test 8: Cancel Send Results
  test('closes popup when cancel is clicked', async () => {
    mockGetLeaderboard.mockResolvedValueOnce({ leaderboard: mockLeaderboardData });
    
    render(<FinalLeaderboard sessionId="123" isAdmin={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Send Results')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Send Results'));
    
    expect(screen.getByText('Are you sure you want to send the results to all users?')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(screen.queryByText('Are you sure you want to send the results to all users?')).not.toBeInTheDocument();
  });
});