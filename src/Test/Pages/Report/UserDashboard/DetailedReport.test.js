import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams, useNavigate } from 'react-router-dom';
import DetailedReportDashboard from '../../../../pages/Report/UserDashboard/DetailedReport';

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
    useParams: jest.fn(),
    useNavigate: jest.fn()
  }));
  
  // Mock NavbarComp component
  jest.mock('../../../../components/NavbarComp', () => {
    return function MockNavbar() {
      return <div data-testid="navbar">Navbar</div>;
    };
  });
  
  describe('DetailedReportDashboard', () => {
    const mockNavigate = jest.fn();
    const mockFetch = jest.fn();
    const originalFetch = global.fetch;
    const mockLocalStorage = {
      getItem: jest.fn()
    };
  
    beforeEach(() => {
      global.fetch = mockFetch;
      global.localStorage = mockLocalStorage;
      useNavigate.mockReturnValue(mockNavigate);
      mockLocalStorage.getItem.mockReturnValue('mock-token');
    });
  
    afterEach(() => {
      jest.clearAllMocks();
      global.fetch = originalFetch;
    });
  
    describe('Quiz Report Tests', () => {
      const mockQuizData = [
        {
          _id: '1',
          sessionDetails: {
            sessionId: 'quiz-session-1',
            quiz: { quizTitle: 'Test Quiz' },
            host: 'Test Host',
            status: 'completed',
            startTime: '2024-01-01T00:00:00Z',
            endTime: '2024-01-01T00:10:00Z'
          },
          correctAnswers: 8,
          incorrectAnswers: 2,
          completedAt: '2024-01-01T00:10:00Z'
        }
      ];
  
      beforeEach(() => {
        useParams.mockReturnValue({ type: 'quiz', id: '123' });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockQuizData)
        });
      });
  
      test('renders quiz dashboard with correct metrics', async () => {
        render(<DetailedReportDashboard />);
  
        await waitFor(() => {
          expect(screen.getByText('Quiz Performance Dashboard')).toBeInTheDocument();
          expect(screen.getByText('Total Attempts')).toBeInTheDocument();
          expect(screen.getByText('1')).toBeInTheDocument();
          expect(screen.getByText('Average Score')).toBeInTheDocument();
          expect(screen.getByText('80.0%')).toBeInTheDocument();
          expect(screen.getByText('Average Duration')).toBeInTheDocument();
          expect(screen.getByText('600s')).toBeInTheDocument();
        });
      });
  
      test('navigates to quiz session on attempt click', async () => {
        render(<DetailedReportDashboard />);
  
        await waitFor(() => {
          fireEvent.click(screen.getByText('Test Quiz'));
        });
  
        expect(mockNavigate).toHaveBeenCalledWith('/session/quiz/quiz-session-1');
      });
    });
  
    describe('Survey Report Tests', () => {
      const mockSurveyData = [
        {
          _id: '1',
          surveySessionDetails: {
            sessionId: 'survey-session-1',
            status: 'completed'
          },
          surveyQuiz: { quizTitle: 'Test Survey' },
          questionsAttempted: 8,
          questionsSkipped: 2,
          completedAt: '2024-01-01T00:10:00Z'
        }
      ];
  
      beforeEach(() => {
        useParams.mockReturnValue({ type: 'survey', id: '123' });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockSurveyData)
        });
      });
  
      test('renders survey dashboard with correct metrics', async () => {
        render(<DetailedReportDashboard />);
  
        await waitFor(() => {
          expect(screen.getByText('Survey Response Dashboard')).toBeInTheDocument();
          expect(screen.getByText('Total Responses')).toBeInTheDocument();
          expect(screen.getByText('1')).toBeInTheDocument();
          expect(screen.getByText('Completion Rate')).toBeInTheDocument();
          expect(screen.getByText('100.0%')).toBeInTheDocument();
          expect(screen.getByText('Avg Questions Answered')).toBeInTheDocument();
          expect(screen.getByText('8')).toBeInTheDocument();
        });
      });
  
      test('navigates to survey session on response click', async () => {
        render(<DetailedReportDashboard />);
  
        await waitFor(() => {
          fireEvent.click(screen.getByText('Test Survey'));
        });
  
        expect(mockNavigate).toHaveBeenCalledWith('/session/survey/survey-session-1');
      });
    });
  
    describe('Error and Loading States', () => {
      test('displays loading state', () => {
        useParams.mockReturnValue({ type: 'quiz', id: '123' });
        mockFetch.mockImplementation(() => new Promise(() => {}));
  
        render(<DetailedReportDashboard />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
  
      test('displays error state', async () => {
        useParams.mockReturnValue({ type: 'quiz', id: '123' });
        mockFetch.mockRejectedValue(new Error('Failed to fetch'));
  
        render(<DetailedReportDashboard />);
  
        await waitFor(() => {
          expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
        });
      });
  
      test('handles empty data state', async () => {
        useParams.mockReturnValue({ type: 'quiz', id: '123' });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([])
        });
  
        render(<DetailedReportDashboard />);
  
        await waitFor(() => {
          expect(screen.getByText('No data available')).toBeInTheDocument();
        });
      });
    });
  
    describe('Navigation Tests', () => {
      test('navigates back to dashboard on back button click', async () => {
        useParams.mockReturnValue({ type: 'quiz', id: '123' });
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([])
        });
  
        render(<DetailedReportDashboard />);
  
        await waitFor(() => {
          fireEvent.click(screen.getByText('Back to Dashboard'));
        });
  
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });