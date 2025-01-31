import React from 'react';
import { render, screen } from '@testing-library/react';
import PerformanceMetrics from '../../../../pages/Report/UserDashboard/PerformanceMetrics';

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Trophy: () => <div data-testid="trophy-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Target: () => <div data-testid="target-icon" />
}));

describe('PerformanceMetrics', () => {
  const mockQuizzes = [
    { id: 1, attempts: 2 },
    { id: 2, attempts: 1 },
    { id: 3, attempts: 3 }
  ];

  const defaultProps = {
    quizzes: mockQuizzes,
    surveys: [],
    totalTime: 3665 // 1 hour, 1 minute, 5 seconds
  };

  it('renders all metric cards', () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Average Attempts')).toBeInTheDocument();
    expect(screen.getByText('Active Time')).toBeInTheDocument();
  });

  it('calculates completion rate correctly', () => {
    render(<PerformanceMetrics {...defaultProps} />);
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('calculates average attempts correctly', () => {
    render(<PerformanceMetrics {...defaultProps} />);
    // (2 + 1 + 3) / 3 = 2.0
    expect(screen.getByText('2.0')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    render(<PerformanceMetrics {...defaultProps} />);
    expect(screen.getByText('1h 1m 5s')).toBeInTheDocument();
  });

  it('handles empty quiz array', () => {
    render(<PerformanceMetrics quizzes={[]} surveys={[]} totalTime={0} />);
    
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0s')).toBeInTheDocument();
  });

  it('renders icons correctly', () => {
    render(<PerformanceMetrics {...defaultProps} />);
    
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    expect(screen.getByTestId('target-icon')).toBeInTheDocument();
  });

  it('caps completion rate at 100%', () => {
    const manyQuizzes = [
      { id: 1, attempts: 5 },
      { id: 2, attempts: 3 },
      { id: 3, attempts: 2 }
    ];
    
    render(
      <PerformanceMetrics
        quizzes={manyQuizzes}
        surveys={[]}
        totalTime={0}
      />
    );
    
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('handles different time formats', () => {
    const longTime = 3_234_567; // About 1 month, 1 week worth of seconds
    render(
      <PerformanceMetrics
        quizzes={mockQuizzes}
        surveys={[]}
        totalTime={longTime}
      />
    );
    
    // Using a more flexible regex that matches the actual output format
    const timeText = screen.getByText(/\d+mo \d+w \d+h \d+m \d+s/);
    expect(timeText).toBeInTheDocument();
  });
});