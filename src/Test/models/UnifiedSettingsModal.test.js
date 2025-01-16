import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import UnifiedSettingsModal from "../../models/UnifiedSettingsModal";

describe('UnifiedSettingsModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnTitleUpdate = jest.fn();
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    onTitleUpdate: mockOnTitleUpdate,
    type: 'quiz',
    initialData: {
      title: 'Test Quiz',
      description: 'Test Description'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<UnifiedSettingsModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Quiz Settings')).not.toBeInTheDocument();
  });

  it('renders modal with correct initial data', () => {
    render(<UnifiedSettingsModal {...defaultProps} />);
    
    expect(screen.getByText('Quiz Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Test Quiz');
    expect(screen.getByLabelText('Description')).toHaveValue('Test Description');
  });

  it('updates form data when typing', () => {
    render(<UnifiedSettingsModal {...defaultProps} />);
    
    const titleInput = screen.getByLabelText('Title');
    const descriptionInput = screen.getByLabelText('Description');

    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });

    expect(titleInput).toHaveValue('New Title');
    expect(descriptionInput).toHaveValue('New Description');
  });

  it('disables Save Changes button when title is empty', () => {
    render(<UnifiedSettingsModal {...defaultProps} initialData={{ title: '', description: '' }} />);
    
    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeDisabled();

    // Test that button becomes enabled when title is entered
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    expect(saveButton).toBeEnabled();
  });

  it('calls onSave and onTitleUpdate when form is submitted successfully', async () => {
    render(<UnifiedSettingsModal {...defaultProps} />);
    
    const titleInput = screen.getByLabelText('Title');
    const descriptionInput = screen.getByLabelText('Description');
    const submitButton = screen.getByText('Save Changes');

    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'New Title',
        description: 'New Description'
      });
      expect(mockOnTitleUpdate).toHaveBeenCalledWith('New Title');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles save error correctly', async () => {
    const errorMessage = 'Failed to save';
    const mockOnSaveError = jest.fn().mockRejectedValue(new Error(errorMessage));
    
    render(
      <UnifiedSettingsModal
        {...defaultProps}
        onSave={mockOnSaveError}
      />
    );

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('closes modal when cancel button is clicked', () => {
    render(<UnifiedSettingsModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables form inputs and buttons while saving', async () => {
    const mockSlowSave = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <UnifiedSettingsModal
        {...defaultProps}
        onSave={mockSlowSave}
      />
    );

    const submitButton = screen.getByText('Save Changes');
    const titleInput = screen.getByLabelText('Title');
    const descriptionInput = screen.getByLabelText('Description');
    const cancelButton = screen.getByText('Cancel');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(titleInput).toBeDisabled();
      expect(descriptionInput).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  it('updates form when initialData changes', () => {
    const { rerender } = render(<UnifiedSettingsModal {...defaultProps} />);
    
    const newInitialData = {
      title: 'Updated Title',
      description: 'Updated Description'
    };

    rerender(<UnifiedSettingsModal {...defaultProps} initialData={newInitialData} />);

    expect(screen.getByLabelText('Title')).toHaveValue('Updated Title');
    expect(screen.getByLabelText('Description')).toHaveValue('Updated Description');
  });
});