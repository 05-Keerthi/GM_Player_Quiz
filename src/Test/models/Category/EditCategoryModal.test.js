import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import EditCategoryModal from '../../../models/Category/EditCategoryModal';
import { useCategoryContext } from '../../../context/categoryContext';

// Mock the dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../context/categoryContext', () => ({
  useCategoryContext: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  X: () => <div data-testid="close-icon">X</div>,
}));

describe('EditCategoryModal', () => {
  const mockCategory = {
    name: 'Test Category',
    description: 'Test Description',
  };

  const mockUpdateCategory = jest.fn();
  const mockGetCategoryById = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useCategoryContext.mockReturnValue({
      updateCategory: mockUpdateCategory,
      getCategoryById: mockGetCategoryById,
      loading: false,
    });
    mockGetCategoryById.mockResolvedValue(mockCategory);
  });

  it('should not render when isOpen is false', () => {
    render(
      <EditCategoryModal
        isOpen={false}
        onClose={mockOnClose}
        categoryId="123"
      />
    );

    expect(screen.queryByText('Edit Category')).not.toBeInTheDocument();
  });

  it('should load category data when opened', async () => {
    render(
      <EditCategoryModal
        isOpen={true}
        onClose={mockOnClose}
        categoryId="123"
      />
    );

    await waitFor(() => {
      expect(mockGetCategoryById).toHaveBeenCalledWith('123');
      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    });
  });

  it('should show error toast when category loading fails', async () => {
    mockGetCategoryById.mockRejectedValue(new Error('Failed to load'));

    render(
      <EditCategoryModal
        isOpen={true}
        onClose={mockOnClose}
        categoryId="123"
      />
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load category data');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should validate required fields', async () => {
    render(
      <EditCategoryModal
        isOpen={true}
        onClose={mockOnClose}
        categoryId="123"
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter category name');
    fireEvent.change(nameInput, { target: { value: '' } });
    
    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    expect(screen.getByText('Category name is required')).toBeInTheDocument();
    expect(mockUpdateCategory).not.toHaveBeenCalled();
  });

  it('should validate minimum name length', async () => {
    render(
      <EditCategoryModal
        isOpen={true}
        onClose={mockOnClose}
        categoryId="123"
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter category name');
    fireEvent.change(nameInput, { target: { value: 'ab' } });
    
    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    expect(screen.getByText('Category name must be at least 3 characters')).toBeInTheDocument();
    expect(mockUpdateCategory).not.toHaveBeenCalled();
  });

  it('should validate description length', async () => {
    render(
      <EditCategoryModal
        isOpen={true}
        onClose={mockOnClose}
        categoryId="123"
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    });

    const descriptionInput = screen.getByPlaceholderText('Enter category description');
    fireEvent.change(descriptionInput, { 
      target: { 
        value: 'a'.repeat(501) 
      } 
    });
    
    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    expect(screen.getByText('Description must be less than 500 characters')).toBeInTheDocument();
    expect(mockUpdateCategory).not.toHaveBeenCalled();
  });

  it('should handle successful form submission', async () => {
    render(
      <EditCategoryModal
        isOpen={true}
        onClose={mockOnClose}
        categoryId="123"
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter category name');
    const descriptionInput = screen.getByPlaceholderText('Enter category description');
    
    fireEvent.change(nameInput, { target: { value: 'Updated Category' } });
    fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });
    
    mockUpdateCategory.mockResolvedValue({});
    
    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith('123', {
        name: 'Updated Category',
        description: 'Updated Description',
      });
      expect(toast.success).toHaveBeenCalledWith('Category updated successfully!');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle duplicate category name error', async () => {
    render(
      <EditCategoryModal
        isOpen={true}
        onClose={mockOnClose}
        categoryId="123"
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter category name');
    fireEvent.change(nameInput, { target: { value: 'Duplicate Name' } });
    
    mockUpdateCategory.mockRejectedValue({
      response: {
        data: {
          message: 'Category name must be unique'
        }
      }
    });
    
    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('This category name already exists')).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('should handle server validation errors', async () => {
    render(
      <EditCategoryModal
        isOpen={true}
        onClose={mockOnClose}
        categoryId="123"
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    });

    mockUpdateCategory.mockRejectedValue({
      response: {
        data: {
          errors: [
            { field: 'name', message: 'Server validation error' }
          ]
        }
      }
    });
    
    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Server validation error')).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('should handle close button click', async () => {
    render(
      <EditCategoryModal
        isOpen={true}
        onClose={mockOnClose}
        categoryId="123"
      />
    );

    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle close icon click', async () => {
    render(
      <EditCategoryModal
        isOpen={true}
        onClose={mockOnClose}
        categoryId="123"
      />
    );

    const closeIcon = screen.getByTestId('close-icon');
    fireEvent.click(closeIcon.parentElement);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show loading state during submission', async () => {
    useCategoryContext.mockReturnValue({
      updateCategory: mockUpdateCategory,
      getCategoryById: mockGetCategoryById,
      loading: true,
    });

    render(
      <EditCategoryModal
        isOpen={true}
        onClose={mockOnClose}
        categoryId="123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      const submitButton = screen.getByText('Saving...');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveClass('bg-gray-400');
    });
  });
});