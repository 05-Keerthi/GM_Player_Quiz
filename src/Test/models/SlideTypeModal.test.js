import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SlideTypeModal from '../../models/SlideTypeModal';
import { act } from 'react-dom/test-utils';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useParams: () => ({ quizId: 'test-quiz-id' }),
}));

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://test-api.com';

describe('SlideTypeModal', () => {
  const mockOnClose = jest.fn();
  const mockOnAddSlide = jest.fn();
  
  // Mock localStorage
  beforeEach(() => {
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue('test-token');
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onAddSlide: mockOnAddSlide,
  };

  const renderModal = (props = {}) => {
    return render(<SlideTypeModal {...defaultProps} {...props} />);
  };

  describe('Initial Render', () => {
    it('should not render when isOpen is false', () => {
      renderModal({ isOpen: false });
      expect(screen.queryByText('Select Slide Type')).not.toBeInTheDocument();
    });

    it('should render slide type selection screen initially', () => {
      renderModal();
      expect(screen.getByText('Select Slide Type')).toBeInTheDocument();
      expect(screen.getByText('Classic')).toBeInTheDocument();
      expect(screen.getByText('Big Title')).toBeInTheDocument();
      expect(screen.getByText('Bullet Points')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should handle bullet point additions and removals', async () => {
      renderModal();
      
      // Select bullet points type
      await userEvent.click(screen.getByText('Bullet Points'));
      
      // Check initial point input
      const initialPointInput = screen.getByPlaceholderText('Point 1');
      expect(initialPointInput).toBeInTheDocument();
      
      // Add a new point
      await userEvent.click(screen.getByRole('button', { name: /add point/i }));
      
      // Get all point inputs
      const pointInputs = screen.getAllByPlaceholderText(/point \d/i);
      expect(pointInputs).toHaveLength(2);
      
      // Remove a point
      const removeButtons = screen.getAllByRole('button', { name: /remove point/i });
      await userEvent.click(removeButtons[0]);
      
      // Check that one point input remains
      const remainingInputs = screen.getAllByPlaceholderText(/point \d/i);
      expect(remainingInputs).toHaveLength(1);
    });
  });

  describe('Slide Submission', () => {
    it('should submit classic slide correctly', async () => {
      renderModal();
      
      await userEvent.click(screen.getByText('Classic'));
      
      // Use getByRole for better accessibility
      const titleInput = screen.getByRole('textbox', { name: /slide title/i });
      const contentInput = screen.getByPlaceholderText('Enter slide content...');
      
      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(contentInput, 'Test Content');
      
      await userEvent.click(screen.getByRole('button', { name: /create slide/i }));
      
      expect(mockOnAddSlide).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          content: 'Test Content',
          type: 'classic',
          quizId: 'test-quiz-id'
        })
      );
    });

    it('should submit bullet points slide correctly', async () => {
      renderModal();
      
      await userEvent.click(screen.getByText('Bullet Points'));
      
      const titleInput = screen.getByRole('textbox', { name: /slide title/i });
      const pointInput = screen.getByPlaceholderText('Point 1');
      
      await userEvent.type(titleInput, 'Test Title');
      await userEvent.type(pointInput, 'Test Point');
      
      await userEvent.click(screen.getByRole('button', { name: /create slide/i }));
      
      expect(mockOnAddSlide).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          content: 'Test Point',
          type: 'bullet_points',
          quizId: 'test-quiz-id'
        })
      );
    });

    it('should prevent submission without title', async () => {
      renderModal();
      
      await userEvent.click(screen.getByText('Classic'));
      
      const submitButton = screen.getByRole('button', { name: /create slide/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Image Upload', () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

    beforeEach(() => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            media: [{ _id: 'test-media-id', filename: 'test.png' }]
          })
        })
      );
    });

    it('should handle image upload successfully', async () => {
      renderModal();
      await userEvent.click(screen.getByText('Classic'));
      
      const fileInput = screen.getByLabelText(/upload image/i);
      await userEvent.upload(fileInput, mockFile);
      
      await waitFor(() => {
        expect(screen.getByAltText('Slide')).toBeInTheDocument();
      });
    });

    it('should handle image removal', async () => {
      renderModal();
      await userEvent.click(screen.getByText('Classic'));
      
      const fileInput = screen.getByLabelText(/upload image/i);
      await userEvent.upload(fileInput, mockFile);
      
      await waitFor(() => {
        expect(screen.getByAltText('Slide')).toBeInTheDocument();
      });
      
      const removeButton = screen.getByTitle('Remove image');
      await userEvent.click(removeButton);
      
      expect(screen.queryByAltText('Slide')).not.toBeInTheDocument();
    });
  });
});