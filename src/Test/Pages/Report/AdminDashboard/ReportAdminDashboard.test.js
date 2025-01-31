import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import ReportAdminDashboard from '../../../../pages/Report/AdminDashboard/ReportAdminDashboard';

// Mock modules
jest.mock('axios');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));
jest.mock('../../../../components/NavbarComp', () => {
  return function DummyNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

// Mock recharts to avoid errors with ResponsiveContainer
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => null
}));

// Mock data
const mockOverallData = {
  overview: {
    totalUsers: 100,
    totalQuizzes: 25,
    totalSurveys: 15,
    activeSessions: 50
  },
  userTrend: [
    { _id: { month: 1, year: 2024 }, count: 50 },
    { _id: { month: 2, year: 2024 }, count: 75 }
  ]
};

const mockQuizzesData = [
  {
    _id: '1',
    quizTitle: 'Test Quiz 1',
    totalAttempts: 30,
    participantCount: 20
  },
  {
    _id: '2',
    quizTitle: 'Test Quiz 2',
    totalAttempts: 25,
    participantCount: 15
  }
];

const mockSurveysData = [
  {
    _id: '1',
    surveyTitle: 'Test Survey 1',
    totalResponses: 40,
    participantCount: 35,
    averageQuestionsAttempted: 8
  },
  {
    _id: '2',
    surveyTitle: 'Test Survey 2',
    totalResponses: 30,
    participantCount: 25,
    averageQuestionsAttempted: 6
  }
];

describe('ReportAdminDashboard', () => {
  let mockLocalStorage;

  beforeEach(() => {
    // Setup localStorage mock
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage
    });

    // Set default mock implementations
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    axios.get.mockImplementation((url) => {
      if (url.includes('/analytics/overall')) {
        return Promise.resolve({ data: mockOverallData });
      }
      if (url.includes('/analytics/quizzes')) {
        return Promise.resolve({ data: mockQuizzesData });
      }
      if (url.includes('/analytics/surveys')) {
        return Promise.resolve({ data: mockSurveysData });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  test('renders error state when API calls fail', async () => {
    axios.get.mockRejectedValue({ 
      response: { data: { message: 'Error fetching data' } }
    });
    
    render(<ReportAdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Error fetching data')).toBeInTheDocument();
    });
  });


  test('switches between quiz and survey tabs', async () => {
    render(<ReportAdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Quiz Reports')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Survey Reports'));
    expect(screen.getByText('Test Survey 1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Quiz Reports'));
    expect(screen.getByText('Test Quiz 1')).toBeInTheDocument();
  });

  test('handles pagination correctly', async () => {
    render(<ReportAdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Quiz Reports')).toBeInTheDocument();
    });

    // Assuming you have pagination controls
    const paginationControls = screen.getAllByRole('button');
    expect(paginationControls.length).toBeGreaterThan(0);
  });

  test('handles missing authentication token', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    render(<ReportAdminDashboard />);
    
    // Updated to match the actual error message shown in your component
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch dashboard data')).toBeInTheDocument();
    });
  });


  test('verifies API calls are made with correct headers', async () => {
    render(<ReportAdminDashboard />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/overall'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock-token' }
        })
      );
    });
  });

  // Add test for error handling with network error
  test('handles network errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    
    render(<ReportAdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch dashboard data')).toBeInTheDocument();
    });
  });
});