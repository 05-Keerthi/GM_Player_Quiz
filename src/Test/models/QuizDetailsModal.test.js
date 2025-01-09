import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal, Box, Typography, Button, Table, TableBody, TableCell, TableRow } from '@mui/material';
import QuizDetailsModal from '../../models/QuizDetailsModal';

// Mock the console for any warnings or errors
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('QuizDetailsModal', () => {
  const quiz = {
    quiz: { title: 'Sample Quiz' },
    completedAt: '2025-01-09T12:00:00Z',
    totalScore: 80,
    correctAnswers: 7,
    incorrectAnswers: 3,
    totalQuestions: 10,
  };

  it('renders quiz details correctly', () => {
    render(<QuizDetailsModal open={true} onClose={jest.fn()} quiz={quiz} />);

    // Check that the modal title is rendered
    expect(screen.getByText(/Quiz Details/i)).toBeInTheDocument();

    // Check that quiz title is displayed
    expect(screen.getByText(/Sample Quiz/i)).toBeInTheDocument();

    // Check the completion date is formatted correctly
    expect(screen.getByText('9/1/2025, 5:30:00 pm')).toBeInTheDocument();

    // Check the score, correct answers, and incorrect answers
    expect(screen.getByText(/80/i)).toBeInTheDocument();
    expect(screen.getByText(/7/i)).toBeInTheDocument();
    expect(screen.getByText('3', { selector: '.text-red-500' })).toBeInTheDocument();

    // Check the total number of questions
    expect(screen.getByText(/10/i)).toBeInTheDocument();
  });

  it('closes the modal when the close button is clicked', async () => {
    const onClose = jest.fn();
    render(<QuizDetailsModal open={true} onClose={onClose} quiz={quiz} />);

    // Click the "Close" button
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));

    // Ensure the onClose function is called
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('does not render modal if quiz is not passed', () => {
    render(<QuizDetailsModal open={true} onClose={jest.fn()} quiz={null} />);

    // Modal should not be in the document if quiz is null
    expect(screen.queryByText(/Quiz Details/i)).not.toBeInTheDocument();
  });

  it('does not render modal when open is false', () => {
    render(<QuizDetailsModal open={false} onClose={jest.fn()} quiz={quiz} />);

    // Modal should not be in the document when open is false
    expect(screen.queryByText(/Quiz Details/i)).not.toBeInTheDocument();
  });
});
