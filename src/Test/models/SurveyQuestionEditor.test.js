import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SurveyQuestionEditor from '../../models/SurveyQuestionEditor';

// Mock the environment variables
process.env.REACT_APP_API_URL = 'http://test-api.com';

// Mock the Lucide icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert</div>,
}));

// Mock the framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock the ColorPicker component
jest.mock('../../components/ColorPicker', () => ({
  __esModule: true,
  default: ({ color, onChange }) => (
    <div data-testid="color-picker">
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        data-testid="color-input"
      />
    </div>
  ),
}));

describe('SurveyQuestionEditor', () => {
  const mockQuestion = {
    title: 'Test Question',
    description: 'Test Description',
    dimension: 'Test Dimension',
    year: '2024',
    imageUrl: 'test-image.jpg',
    timer: 45,
    answerOptions: [
      { optionText: 'Option 1', color: '#FF0000' },
      { optionText: 'Option 2', color: '#00FF00' },
    ],
  };

  const mockOnUpdate = jest.fn();
  const mockOnClose = jest.fn();
  let originalFetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('renders correctly with initial empty state', () => {
    render(<SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);
    
    expect(screen.getByText('Add New Question')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your question title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter question description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument();
  });

  it('renders correctly with existing question data', () => {
    render(
      <SurveyQuestionEditor
        question={mockQuestion}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Edit Question')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Question')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument();
  });

  it('validates required fields before submission', async () => {
    render(<SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);

    // Try to submit with empty fields
    fireEvent.click(screen.getByText('Add Question'));

    expect(await screen.findByText('Question title is required')).toBeInTheDocument();
    expect(screen.getByText('Question description is required')).toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('handles adding and removing answer options', async () => {
    render(<SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);

    // Add new option
    fireEvent.click(screen.getByText('Add Option'));
    expect(screen.getAllByTestId('color-picker')).toHaveLength(2);

    // Remove option
    const trashIcons = screen.getAllByTestId('trash-icon');
    fireEvent.click(trashIcons[0]);
    
    // Should not remove last option
    fireEvent.click(trashIcons[0]);
    expect(screen.getAllByTestId('color-picker')).toHaveLength(1);
  });

  it('handles image upload successfully', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        media: [{ _id: 'test-id', filename: 'test-image.jpg' }],
      }),
    };

    global.fetch = jest.fn().mockResolvedValueOnce(mockResponse);

    render(<SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Click to upload image/i);

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/media/upload`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
          body: expect.any(FormData),
        })
      );
    });

    // Verify image preview is shown
    expect(screen.getByAltText('Question')).toBeInTheDocument();
  });

  it('handles image upload failure', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
    };

    global.fetch = jest.fn().mockResolvedValueOnce(mockResponse);

    render(<SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Click to upload image/i);

    await userEvent.upload(input, file);

    expect(await screen.findByText('Failed to upload image')).toBeInTheDocument();
  });

  it('prompts for unsaved changes when closing', () => {
    const mockConfirm = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);

    // Make a change to trigger isDirty
    fireEvent.change(screen.getByPlaceholderText('Enter your question title'), {
      target: { value: 'New Title' },
    });

    // Try to close
    fireEvent.click(screen.getByTestId('x-icon'));

    expect(mockConfirm).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to close?'
    );
    expect(mockOnClose).toHaveBeenCalled();

    mockConfirm.mockRestore();
  });

  it('submits form with valid data', async () => {
    render(<SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);

    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText('Enter your question title'), {
      target: { value: 'New Question' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter question description'), {
      target: { value: 'New Description' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 1'), {
      target: { value: 'New Option 1' },
    });
    
    // Add and fill second option
    fireEvent.click(screen.getByText('Add Option'));
    const options = screen.getAllByPlaceholderText(/Option \d/);
    fireEvent.change(options[1], {
      target: { value: 'New Option 2' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Add Question'));

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Question',
          description: 'New Description',
          answerOptions: expect.arrayContaining([
            expect.objectContaining({ optionText: 'New Option 1' }),
            expect.objectContaining({ optionText: 'New Option 2' }),
          ]),
        })
      );
    });
  });

  it('handles timer value changes', () => {
    render(<SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);
    
    const timerInput = screen.getByLabelText(/Timer \(seconds\)/i);
    fireEvent.change(timerInput, { target: { value: '30' } });
    
    expect(timerInput.value).toBe('30');
  });
  
});