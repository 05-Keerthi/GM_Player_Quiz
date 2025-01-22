import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, useNavigate, useLocation } from 'react-router-dom';
import UnifiedJoin from '../../../../pages/Session/UserJoin/UnifiedJoin';
import { useSessionContext } from '../../../../context/sessionContext';
import { useSurveySessionContext } from '../../../../context/surveySessionContext';
import { useAuthContext } from '../../../../context/AuthContext';

// Mock all the hooks and contexts
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('../../../../context/sessionContext');
jest.mock('../../../../context/surveySessionContext');
jest.mock('../../../../context/AuthContext');

describe('UnifiedJoin Component', () => {
  const mockNavigate = jest.fn();
  const mockJoinSession = jest.fn();
  const mockJoinSurveySession = jest.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ search: '' });
    
    useSessionContext.mockReturnValue({
      joinSession: mockJoinSession,
      loading: false
    });

    useSurveySessionContext.mockReturnValue({
      joinSurveySession: mockJoinSurveySession,
      loading: false
    });

    useAuthContext.mockReturnValue({
      user: null
    });
  });

  it('renders the join form correctly', () => {
    render(
      <MemoryRouter>
        <UnifiedJoin />
      </MemoryRouter>
    );

    expect(screen.getByText('Ready to join?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Game PIN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument();
  });

  it('handles quiz join successfully', async () => {
    mockJoinSession.mockResolvedValueOnce({
      session: { _id: 'test-session-id' }
    });

    render(
      <MemoryRouter>
        <UnifiedJoin type="quiz" />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Game PIN');
    const submitButton = screen.getByRole('button', { name: /join/i });

    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockJoinSession).toHaveBeenCalledWith('123456');
      expect(mockNavigate).toHaveBeenCalledWith('/user-lobby?code=123456&sessionId=test-session-id');
    });
  });

  it('handles survey join for authenticated user', async () => {
    useAuthContext.mockReturnValue({ user: { id: 'test-user' } });
    mockJoinSurveySession.mockResolvedValueOnce({
      session: { _id: 'test-survey-id' }
    });

    render(
      <MemoryRouter>
        <UnifiedJoin type="survey" />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Game PIN');
    const submitButton = screen.getByRole('button', { name: /join/i });

    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockJoinSurveySession).toHaveBeenCalledWith('123456', { isGuest: false });
      expect(mockNavigate).toHaveBeenCalledWith('/survey-user-lobby?code=123456&sessionId=test-survey-id');
    });
  });

  it('shows guest form for unauthenticated survey join', async () => {
    render(
      <MemoryRouter>
        <UnifiedJoin type="survey" />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Game PIN');
    fireEvent.change(input, { target: { value: '123456' } });

    const joinButton = screen.getByRole('button', { name: /join as guest/i });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Enter Guest Details')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Mobile (10 digits)')).toBeInTheDocument();
    });
  });

  it('validates guest form inputs', async () => {
    render(
      <MemoryRouter>
        <UnifiedJoin type="survey" />
      </MemoryRouter>
    );

    // Open guest form
    const input = screen.getByPlaceholderText('Game PIN');
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /join as guest/i }));

    // Try to submit empty form
    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('All fields are required')).toBeInTheDocument();
    });

    // Fill invalid email
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByPlaceholderText('Mobile (10 digits)'), { target: { value: '1234567890' } });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('handles successful guest form submission', async () => {
    mockJoinSurveySession.mockResolvedValueOnce({
      session: { _id: 'test-survey-id' }
    });

    render(
      <MemoryRouter>
        <UnifiedJoin type="survey" />
      </MemoryRouter>
    );

    // Open guest form
    const input = screen.getByPlaceholderText('Game PIN');
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /join as guest/i }));

    // Fill valid data
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mobile (10 digits)'), { target: { value: '1234567890' } });

    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockJoinSurveySession).toHaveBeenCalledWith('123456', {
        isGuest: true,
        username: 'testuser',
        email: 'test@example.com',
        mobile: '1234567890'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/survey-user-lobby?code=123456&sessionId=test-survey-id');
    });
  });

  it('handles join code from URL params', () => {
    useLocation.mockReturnValue({ search: '?code=123456' });

    render(
      <MemoryRouter>
        <UnifiedJoin />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Game PIN')).toHaveValue('123456');
  });

  it('shows loading state during submission', async () => {
    useSessionContext.mockReturnValue({
      joinSession: mockJoinSession,
      loading: true
    });

    render(
      <MemoryRouter>
        <UnifiedJoin />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Game PIN');
    fireEvent.change(input, { target: { value: '123456' } });

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Joining.../i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Joining...')).toBeInTheDocument();
    });
  });

  it('handles error responses', async () => {
    const errorMessage = 'Invalid Game PIN';
    mockJoinSession.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

    render(
      <MemoryRouter>
        <UnifiedJoin />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Game PIN');
    fireEvent.change(input, { target: { value: '123456' } });

    const submitButton = screen.getByRole('button', { name: /join/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});