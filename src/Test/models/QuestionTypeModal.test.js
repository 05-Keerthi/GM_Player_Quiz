import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionTypeModal from '../../models/QuestionTypeModal';
import { useParams } from 'react-router-dom';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useParams: jest.fn()
}));

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://test-api.com';

describe('QuestionTypeModal', () => {
  const mockOnClose = jest.fn();
  const mockOnAddQuestion = jest.fn();
  const mockQuizId = 'quiz123';

  beforeEach(() => {
    useParams.mockReturnValue({ quizId: mockQuizId });
    localStorage.setItem('token', 'mock-token');
    jest.clearAllMocks();
  });

  const renderModal = () => {
    return render(
      <QuestionTypeModal 
        isOpen={true}
        onClose={mockOnClose}
        onAddQuestion={mockOnAddQuestion}
      />
    );
  };

  describe('Initial Render', () => {
    it('renders question type selection screen initially', () => {
      renderModal();
      const heading = screen.getByRole('heading', { name: 'Select Question Type' });
      expect(heading).toBeInTheDocument();
      expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
      expect(screen.getByText('True/False')).toBeInTheDocument();
      expect(screen.getByText('Open Ended')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <QuestionTypeModal 
          isOpen={false}
          onClose={mockOnClose}
          onAddQuestion={mockOnAddQuestion}
        />
      );
      expect(screen.queryByRole('heading', { name: 'Select Question Type' })).not.toBeInTheDocument();
    });
  });

  describe('Question Type Selection', () => {
    it('moves to question creation screen when type is selected', async () => {
        renderModal();
        await userEvent.click(screen.getByText('Multiple Choice'));
      
        const heading = screen.getByRole('heading', { name: 'Create Question' });
        expect(heading).toBeInTheDocument();
      
        // Ensure the question input field is available before interacting with it
        await waitFor(() => screen.getByPlaceholderText('Enter your question here...'));
        expect(screen.getByPlaceholderText('Enter your question here...')).toBeInTheDocument();
      });
      
    it('initializes correct number of options for multiple choice', async () => {
      renderModal();
      await userEvent.click(screen.getByText('Multiple Choice'));
      const options = screen.getAllByPlaceholderText(/Option \d/);
      expect(options).toHaveLength(2);
    });

    it('initializes true/false options correctly', async () => {
      renderModal();
      await userEvent.click(screen.getByText('True/False'));
      const inputs = screen.getAllByRole('textbox');
      expect(inputs[1]).toHaveValue('True');
      expect(inputs[2]).toHaveValue('False');
    });
  });

  describe('Question Creation Form', () => {
    beforeEach(async () => {
      renderModal();
      await userEvent.click(screen.getByText('Multiple Choice'));
    });

    it('allows adding new options for multiple choice', async () => {
      const addButton = screen.getByRole('button', { name: 'Add Option' });
      await userEvent.click(addButton);
      const options = screen.getAllByPlaceholderText(/Option \d/);
      expect(options).toHaveLength(3);
    });

    it('allows removing options', async () => {
        // Add a new option to make sure there are more than two options
        await userEvent.click(screen.getByRole('button', { name: 'Add Option' }));
      
        // Debug the current DOM state to see if the remove button is rendered
        screen.debug();
      
        // Wait for the "Remove Option" buttons to be available
        await waitFor(() => screen.getAllByRole('button', { name: /removeOption/i }));
      
        // Click the first remove button
        const deleteButtons = screen.getAllByRole('button', { name: /removeOption/i });
        const deleteButton = deleteButtons[0];
        await userEvent.click(deleteButton);
      
        // Check the number of options
        const options = screen.getAllByPlaceholderText(/Option \d/);
        expect(options).toHaveLength(2);
      });
      
      

    it('updates question title', async () => {
      const titleInput = screen.getByPlaceholderText('Enter your question here...');
      await userEvent.type(titleInput, 'Test Question');
      expect(titleInput).toHaveValue('Test Question');
    });

    it('updates option text', async () => {
      const options = screen.getAllByPlaceholderText(/Option \d/);
      await userEvent.type(options[0], 'Option One');
      expect(options[0]).toHaveValue('Option One');
    });

    it('handles correct answer selection', async () => {
      const radioButtons = screen.getAllByRole('radio');
      await userEvent.click(radioButtons[0]);
      expect(radioButtons[0]).toBeChecked();
      expect(radioButtons[1]).not.toBeChecked();
    });
  });

  describe('Image Upload', () => {
    beforeEach(async () => {
      renderModal();
      await userEvent.click(screen.getByText('Multiple Choice'));
    });

    it('handles image upload successfully', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const uploadInput = screen.getByLabelText(/Upload Image/i);

      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            media: [{ _id: 'media123', filename: 'test.png' }]
          })
        })
      );

      await userEvent.upload(uploadInput, file);

      await waitFor(() => {
        expect(screen.getByAltText('Question')).toBeInTheDocument();
      });
    });

    it('handles image upload error', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const uploadInput = screen.getByLabelText(/Upload Image/i);

      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: false
        })
      );

      await userEvent.upload(uploadInput, file);

      await waitFor(() => {
        expect(screen.getByText('Failed to upload image')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      renderModal();
      await userEvent.click(screen.getByText('Multiple Choice'));
    });

    it('submits form with valid data', async () => {
      // Fill in required fields
      await userEvent.type(screen.getByPlaceholderText('Enter your question here...'), 'Test Question');
      const options = screen.getAllByPlaceholderText(/Option \d/);
      await userEvent.type(options[0], 'Option One');
      await userEvent.type(options[1], 'Option Two');
      await userEvent.click(screen.getAllByRole('radio')[0]);

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Create Question' });
      await userEvent.click(submitButton);

      expect(mockOnAddQuestion).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Question',
        type: 'multiple_choice',
        options: expect.arrayContaining([
          expect.objectContaining({ text: 'Option One', isCorrect: true }),
          expect.objectContaining({ text: 'Option Two', isCorrect: false })
        ])
      }));
    });

    it('validates required fields', async () => {
      const submitButton = screen.getByRole('button', { name: 'Create Question' });
      await userEvent.click(submitButton);
      // Verify that the submit button remains disabled when required fields are empty
      expect(submitButton).toBeDisabled();
    });
  });
});