import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SessionDashboard from '../../../../pages/Report/UserDashboard/SessionDashboard';

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({
    type: 'quiz',
    sessionId: '123'
  })
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowBigLeft: () => <div data-testid="arrow-left-icon" />,
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />
}));

// Mock Navbar component
jest.mock('../../../../components/NavbarComp', () => {
  return function DummyNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

describe('SessionDashboard', () => {
  // Mock quiz response data
  const mockQuizData = {
    summary: {
      correctAnswers: 3,
      totalTime: 300
    },
    answers: [
      {
        question: 'Test Question 1',
        question_description: 'Description 1',
        questionType: 'multiple_choice',
        options: [
          { _id: '1', text: 'Option 1', isCorrect: true },
          { _id: '2', text: 'Option 2', isCorrect: false }
        ],
        submittedAnswer: 'Option 1',
        isCorrect: true,
        timeTaken: 30
      },
      {
        question: 'Test Question 2',
        question_description: 'Description 2',
        questionType: 'true_false',
        options: [
          { _id: '3', text: 'True', isCorrect: true },
          { _id: '4', text: 'False', isCorrect: false }
        ],
        submittedAnswer: 'False',
        isCorrect: false,
        timeTaken: 25
      }
    ],
    sessionDetails: {
      quiz: {
        _id: 'quiz123'
      }
    }
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => 'fake-token');
    
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockQuizData)
      })
    );
  });

  it('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <SessionDashboard />
      </BrowserRouter>
    );
    
    // Find the loading spinner by its unique class combination
    const loadingSpinner = document.querySelector('.animate-spin.rounded-full.h-12.w-12.border-b-2.border-blue-500');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('renders quiz data successfully', async () => {
    render(
      <BrowserRouter>
        <SessionDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quiz Session Analysis')).toBeInTheDocument();
    });

    // Check metrics
    expect(screen.getByText('Total Questions')).toBeInTheDocument();
    expect(screen.getByText('Correct Answers')).toBeInTheDocument();
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Total Time')).toBeInTheDocument();

    // Check questions
    expect(screen.getByText('Test Question 1')).toBeInTheDocument();
    expect(screen.getByText('Test Question 2')).toBeInTheDocument();
  });

  it('handles back navigation correctly', async () => {
    render(
      <BrowserRouter>
        <SessionDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quiz Session Analysis')).toBeInTheDocument();
    });

    const backButton = screen.getByText(/Back to Performance/i);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/quiz-reports/quiz/quiz123');
  });

  it('handles API error gracefully', async () => {
    // Mock fetch to return error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404
      })
    );

    render(
      <BrowserRouter>
        <SessionDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/HTTP error! status: 404/i)).toBeInTheDocument();
    });
  });

  it('renders correct status indicators for answers', async () => {
    render(
      <BrowserRouter>
        <SessionDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quiz Session Analysis')).toBeInTheDocument();
    });

    // Check for correct/incorrect indicators
    const correctIndicators = screen.getAllByText('Correct');
    const incorrectIndicators = screen.getAllByText('Incorrect');
    
    expect(correctIndicators).toHaveLength(1);
    expect(incorrectIndicators).toHaveLength(1);
  });

  it('calculates and displays metrics correctly', async () => {
    const mockData = {
      ...mockQuizData,
      answers: [
        { isCorrect: true, timeTaken: 30 },
        { isCorrect: false, timeTaken: 20 }
      ],
      summary: {
        correctAnswers: 1,
        totalTime: 50
      }
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    );

    render(
      <BrowserRouter>
        <SessionDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Total Questions = 2
      expect(screen.getByText('2')).toBeInTheDocument();
      // Correct Answers = 1
      expect(screen.getByText('1')).toBeInTheDocument();
      // Accuracy = (1/2) * 100 = 50.0%
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      // Total Time = 50s
      expect(screen.getByText('50s')).toBeInTheDocument();
    });
  });

  it('handles survey type correctly', async () => {
    // Mock useParams to return survey type
    jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({
      type: 'survey',
      sessionId: '123'
    });

    const mockSurveyData = {
      ...mockQuizData,
      sessionDetails: {
        surveyQuiz: {
          _id: 'survey123'
        }
      }
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSurveyData)
      })
    );

    render(
      <BrowserRouter>
        <SessionDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Survey Response Analysis')).toBeInTheDocument();
    });

    // Verify survey-specific metrics
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Answered Questions')).toBeInTheDocument();
  });
});