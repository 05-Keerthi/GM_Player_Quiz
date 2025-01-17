import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import SurveyResults from "../../../../pages/Session/Start/SurveyResults";

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn()
}));

// Mock the Loader2 component
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader">Loading...</div>
}));

const mockQuestions = [
  {
    _id: '1',
    title: 'Test Question 1'
  },
  {
    _id: '2',
    title: 'Test Question 2'
  }
];

const mockUserAnswers = [
  {
    answers: [
      { questionId: '1', answer: 'Answer 1' },
      { questionId: '2', answer: 'Answer 2' }
    ]
  },
  {
    answers: [
      { questionId: '1', answer: 'Answer 3' }
    ]
  }
];

describe('SurveyResults', () => {
  let mockNavigate;
  let mockFetch;
  let consoleErrorSpy;

  beforeEach(() => {
    // Setup console.error spy
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Setup router mocks
    mockNavigate = jest.fn();
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
    require('react-router-dom').useParams.mockReturnValue({ sessionId: 'test-session' });
    require('react-router-dom').useLocation.mockReturnValue({
      search: '?joinCode=TEST123'
    });

    // Setup fetch mock
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => 'mock-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  test('renders loading state initially', () => {
    mockFetch.mockImplementationOnce(() => 
      new Promise(() => {})
    );

    render(<SurveyResults />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  test('renders error state when fetch fails', async () => {
    const errorMessage = 'Failed to fetch';
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      expect(screen.getByText(/Retry/i)).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching session answers:',
        expect.any(Error)
      );
    });
  });

  test('renders error state when response is not ok', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 404
      })
    );

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch session answers/i)).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching session answers:',
        expect.any(Error)
      );
    });
  });

  test('renders error state when response format is invalid', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          invalidData: true
        })
      })
    );

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Invalid response format/i)).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching session answers:',
        expect.any(Error)
      );
    });
  });

  test('renders survey results successfully', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          questions: mockQuestions,
          userAnswers: mockUserAnswers
        })
      })
    );

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText('Survey Results')).toBeInTheDocument();
      expect(screen.getByText('Test Question 1')).toBeInTheDocument();
      expect(screen.getByText('Test Question 2')).toBeInTheDocument();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  test('calculates total responses correctly', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          questions: mockQuestions,
          userAnswers: mockUserAnswers
        })
      })
    );

    render(<SurveyResults />);

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('2'); // First question
      expect(rows[2]).toHaveTextContent('1'); // Second question
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  test('navigates to question details when row is clicked', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          questions: mockQuestions,
          userAnswers: mockUserAnswers
        })
      })
    );

    render(<SurveyResults />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Test Question 1'));
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/question-details/test-session/1?joinCode=TEST123'
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test('handles end quiz functionality', async () => {
    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            questions: mockQuestions,
            userAnswers: mockUserAnswers
          })
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true
        })
      );

    render(<SurveyResults />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('End Survey'));
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/survey-sessions/TEST123/test-session/end'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  test('handles no questions scenario', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          questions: [],
          userAnswers: []
        })
      })
    );

    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText('No questions available.')).toBeInTheDocument();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});