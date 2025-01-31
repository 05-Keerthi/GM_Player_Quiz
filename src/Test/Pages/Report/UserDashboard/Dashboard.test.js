import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../../../pages/Report/UserDashboard/Dashboard';

// Mock child components
jest.mock('../../../../pages/Report/UserDashboard/ActivityTimeline', () => {
  return function MockActivityTimeline({ quizzes, surveys }) {
    return <div data-testid="activity-timeline">Activity Timeline Mock</div>;
  };
});

jest.mock('../../../../pages/Report/UserDashboard/PerformanceMetrics', () => {
  return function MockPerformanceMetrics({ quizzes, surveys, totalTime }) {
    return <div data-testid="performance-metrics">Performance Metrics Mock</div>;
  };
});

jest.mock('../../../../pages/Report/UserDashboard/DistributionChart', () => {
  return function MockDistributionChart({ quizCount, surveyCount }) {
    return <div data-testid="distribution-chart">Distribution Chart Mock</div>;
  };
});

jest.mock('../../../../pages/Report/UserDashboard/AttemptsChart', () => {
  return function MockAttemptsChart({ quizzes, surveys }) {
    return <div data-testid="attempts-chart">Attempts Chart Mock</div>;
  };
});

jest.mock('../../../../components/NavbarComp', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar Mock</div>;
  };
});

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://test-api.com';

// Mock data
const mockReportsData = {
  quizzes: [
    {
      QuizId: 1,
      QuizDetails: {
        quizTitle: 'Test Quiz 1',
        quizDescription: 'Test Description 1'
      },
      attempts: 5,
      lastAttempt: '2024-01-30T10:00:00Z'
    },
    {
      QuizId: 2,
      QuizDetails: {
        quizTitle: 'Test Quiz 2',
        quizDescription: 'Test Description 2'
      },
      attempts: 3,
      lastAttempt: '2024-01-29T10:00:00Z'
    }
  ],
  surveys: [
    {
      SurveyId: 1,
      SurveyDetails: {
        surveyTitle: 'Test Survey 1'
      },
      attempts: 4,
      lastAttempt: '2024-01-28T10:00:00Z'
    }
  ],
  totalTime: 3600
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('renders loading state initially', () => {
    global.fetch.mockImplementationOnce(() => new Promise(() => {}));
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  });

  it('fetches and displays reports data successfully', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReportsData)
      })
    );

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Quiz 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Description 1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles API error state', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('filters data based on search term', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReportsData)
      })
    );

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Quiz 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Quiz 1' } });

    expect(screen.getByText('Test Quiz 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Quiz 2')).not.toBeInTheDocument();
  });

  it('switches between quiz and survey tabs', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReportsData)
      })
    );

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Quiz 1')).toBeInTheDocument();
    });

    const surveyTab = screen.getByText('Survey Reports');
    fireEvent.click(surveyTab);

    expect(screen.getByText('Test Survey 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Quiz 1')).not.toBeInTheDocument();
  });

  it('navigates to report detail when clicking on a row', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReportsData)
      })
    );

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Quiz 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Quiz 1'));
    expect(mockNavigate).toHaveBeenCalledWith('/quiz-reports/quiz/1');
  });

  it('exports data to CSV when clicking export button', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReportsData)
      })
    );

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockCreateObjectURL = jest.fn();
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Quiz 1')).toBeInTheDocument();
    });
  });
});