import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UnifiedJoin from '../../../../pages/Session/UserJoin/UnifiedJoin';
import { useSessionContext } from '../../../../context/sessionContext';
import { useSurveySessionContext } from '../../../../context/surveySessionContext';
import { useAuthContext } from '../../../../context/AuthContext';

// Mock the hooks
jest.mock('../../../../context/sessionContext');
jest.mock('../../../../context/surveySessionContext');
jest.mock('../../../../context/AuthContext');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    search: ''
  })
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    search: ''
  })
}));

describe('UnifiedJoin Component', () => {
  const defaultProps = {
    type: 'quiz'
  };

  const mockJoinSession = jest.fn();
  const mockJoinSurveySession = jest.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    useSessionContext.mockImplementation(() => ({
      joinSession: mockJoinSession,
      loading: false
    }));

    useSurveySessionContext.mockImplementation(() => ({
      joinSurveySession: mockJoinSurveySession,
      loading: false
    }));

    useAuthContext.mockImplementation(() => ({
      user: null
    }));
  });

  // Helper function to render component with router
  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <UnifiedJoin {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByText('Ready to join?')).toBeInTheDocument();
  });

  it('handles join code input correctly', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Game PIN');
    
    await userEvent.type(input, 'abc123456');
    expect(input.value).toBe('123456'); // Should only contain numbers and be max 6 digits
  });

  it('shows error when submitting empty join code', async () => {
    renderComponent();
    
    // Find the button even if it's disabled
    const submitButton = screen.getByRole('button', { name: /join/i });
    
    // Forcefully submit the form since the button might be disabled
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    expect(screen.getByText('Please enter a Game PIN')).toBeInTheDocument();
  });

  it('handles successful quiz join', async () => {
    const mockSession = { _id: 'test-session-id' };
    mockJoinSession.mockResolvedValueOnce({ session: mockSession });
    
    renderComponent();
    
    await userEvent.type(screen.getByPlaceholderText('Game PIN'), '123456');
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockJoinSession).toHaveBeenCalledWith('123456');
      expect(mockNavigate).toHaveBeenCalledWith(
        '/user-lobby?code=123456&sessionId=test-session-id'
      );
    });
  });

  describe('Survey Mode', () => {
    const surveyProps = { type: 'survey' };

    it('shows guest fields when user is not authenticated', () => {
      renderComponent(surveyProps);
      
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Mobile (10 digits)')).toBeInTheDocument();
    });

    it('validates guest fields before submission', async () => {
      renderComponent(surveyProps);
      
      // Fill only the game PIN
      await userEvent.type(screen.getByPlaceholderText('Game PIN'), '123456');
      
      // Try to submit the form directly since button will be disabled
      const form = screen.getByRole('form');
      fireEvent.submit(form);

      // Wait for the validation error to appear
      await waitFor(() => {
        const errorElement = screen.getByText(/all fields are required/i);
        expect(errorElement).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      renderComponent(surveyProps);
      
      // Fill in all fields with invalid email
      await userEvent.type(screen.getByPlaceholderText('Game PIN'), '123456');
      await userEvent.type(screen.getByPlaceholderText('Username'), 'testuser');
      await userEvent.type(screen.getByPlaceholderText('Email'), 'invalid-email');
      await userEvent.type(screen.getByPlaceholderText('Mobile (10 digits)'), '1234567890');
      
      // Submit form directly
      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('validates phone number format', async () => {
      renderComponent(surveyProps);
      
      // Fill in all fields with invalid phone
      await userEvent.type(screen.getByPlaceholderText('Game PIN'), '123456');
      await userEvent.type(screen.getByPlaceholderText('Username'), 'testuser');
      await userEvent.type(screen.getByPlaceholderText('Email'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('Mobile (10 digits)'), '123');
      
      // Submit form directly
      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
      });
    });

    it('handles successful survey join for guest user', async () => {
      const mockSession = { _id: 'test-survey-session-id' };
      mockJoinSurveySession.mockResolvedValueOnce({ session: mockSession });
      
      renderComponent(surveyProps);
      
      // Fill in all fields correctly
      await userEvent.type(screen.getByPlaceholderText('Game PIN'), '123456');
      await userEvent.type(screen.getByPlaceholderText('Username'), 'testuser');
      await userEvent.type(screen.getByPlaceholderText('Email'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('Mobile (10 digits)'), '1234567890');
      
      // Submit form directly
      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockJoinSurveySession).toHaveBeenCalledWith('123456', {
          isGuest: true,
          username: 'testuser',
          email: 'test@example.com',
          mobile: '1234567890'
        });
        expect(mockNavigate).toHaveBeenCalledWith(
          '/survey-user-lobby?code=123456&sessionId=test-survey-session-id'
        );
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state during quiz join', () => {
      useSessionContext.mockImplementation(() => ({
        joinSession: mockJoinSession,
        loading: true
      }));

      renderComponent();
      
      expect(screen.getByText('Joining...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /joining/i })).toBeDisabled();
    });

    it('shows loading state during survey join', () => {
      useSurveySessionContext.mockImplementation(() => ({
        joinSurveySession: mockJoinSurveySession,
        loading: true
      }));

      renderComponent({ type: 'survey' });
      
      expect(screen.getByText('Joining...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /joining/i })).toBeDisabled();
    });
  });

  describe('URL Parameters', () => {
    it('pre-fills join code from URL parameter', () => {
      const location = {
        search: '?code=123456'
      };
      
      jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue(location);
      
      renderComponent();
      
      expect(screen.getByPlaceholderText('Game PIN')).toHaveValue('123456');
    });
  });
});