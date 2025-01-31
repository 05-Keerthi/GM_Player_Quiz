import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import SessionDetails from '../../../../pages/Report/AdminDashboard/SessionDetails';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useParams: jest.fn()
}));

jest.mock('axios');

jest.mock('../../../../components/NavbarComp', () => {
  return function DummyNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://test-api.com';

// Mock data
const mockQuizData = {
  sessionDetails: {
    quiz: {
      _id: '123',
      title: 'Test Quiz'
    },
    host: {
      username: 'TestHost'
    },
    joinCode: 'ABC123',
    status: 'completed',
    createdAt: '2024-01-31T12:00:00Z'
  },
  sessionStats: {
    totalParticipants: 10,
    averageScore: 85,
    highestScore: 100,
    lowestScore: 70
  },
  leaderboard: [
    {
      rank: 1,
      player: { username: 'Player1' },
      score: 100
    },
    {
      rank: 2,
      player: { username: 'Player2' },
      score: 90
    },
    {
      rank: 3,
      player: { username: 'Player3' },
      score: 80
    }
  ],
  questionAnalytics: [
    {
      _id: 'q1',
      questionTitle: 'Question 1',
      description: 'Test description',
      totalAttempts: 10,
      correctAnswers: 8,
      incorrectAnswers: 2,
      successRate: 80,
      responses: [
        {
          username: 'User1',
          email: 'user1@test.com',
          mobile: '1234567890',
          answer: 'Test answer',
          isCorrect: true
        }
      ]
    }
  ]
};

const mockSurveyData = {
  sessionDetails: {
    surveyQuiz: {
      _id: '123',
      title: 'Test Survey'
    },
    surveyHost: {
      username: 'TestHost'
    },
    surveyJoinCode: 'ABC123',
    surveyStatus: 'completed',
    createdAt: '2024-01-31T12:00:00Z'
  },
  questionAnalytics: [
    {
      _id: 'q1',
      questionTitle: 'Survey Question 1',
      description: 'Test description',
      totalResponses: 10,
      averageTimeTaken: 30,
      responses: [
        {
          username: 'User1',
          email: 'user1@test.com',
          mobile: '1234567890',
          answer: 'Survey answer'
        }
      ]
    }
  ]
};

describe('SessionDetails Component', () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Quiz Sessions', () => {
    beforeEach(() => {
      useParams.mockReturnValue({ type: 'quizzes', sessionId: '123' });
    });

    it('renders loading state initially', () => {
      axios.get.mockImplementationOnce(() => new Promise(() => {}));
      const { container } = render(<SessionDetails />);
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders error state when API call fails', async () => {
      const errorMessage = 'Failed to fetch session details';
      axios.get.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });
      
      render(<SessionDetails />);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('renders quiz details successfully', async () => {
      axios.get.mockResolvedValueOnce({ data: mockQuizData });
      
      render(<SessionDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();

      });
    });

    it('displays session statistics correctly', async () => {
      axios.get.mockResolvedValueOnce({ data: mockQuizData });
      
      render(<SessionDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Participants')).toBeInTheDocument();
      });
    });

    it('displays top performers podium', async () => {
      axios.get.mockResolvedValueOnce({ data: mockQuizData });
      
      render(<SessionDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Top Performers')).toBeInTheDocument();
      });
    });
  });

  describe('Survey Sessions', () => {
    beforeEach(() => {
      useParams.mockReturnValue({ type: 'surveys', sessionId: '123' });
    });

    it('renders survey details successfully', async () => {
      axios.get.mockResolvedValueOnce({ data: mockSurveyData });
      
      render(<SessionDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Survey')).toBeInTheDocument();
        expect(screen.getByText(/Host: TestHost/)).toBeInTheDocument();
        expect(screen.getByText(/Join Code: ABC123/)).toBeInTheDocument();
      });
    });

    it('displays survey question analytics', async () => {
      axios.get.mockResolvedValueOnce({ data: mockSurveyData });
      
      render(<SessionDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Survey Question 1')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument(); // Total Responses
        expect(screen.getByText('30s')).toBeInTheDocument(); // Average Time
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back to quiz reports', async () => {
      useParams.mockReturnValue({ type: 'quizzes', sessionId: '123' });
      axios.get.mockResolvedValueOnce({ data: mockQuizData });
      
      render(<SessionDetails />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText(/Back to quizzes-reports/));
        expect(mockNavigate).toHaveBeenCalledWith('/admin/quizzes-reports/quizzes/123');
      });
    });

    it('navigates back to survey reports', async () => {
      useParams.mockReturnValue({ type: 'surveys', sessionId: '123' });
      axios.get.mockResolvedValueOnce({ data: mockSurveyData });
      
      render(<SessionDetails />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText(/Back to surveys-reports/));
        expect(mockNavigate).toHaveBeenCalledWith('/admin/surveys-reports/surveys/123');
      });
    });
  });
});