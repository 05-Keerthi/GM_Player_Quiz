// src/Test/pages/SelectCategoryPage.test.js


// SelectCategoryPage.test.js
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from 'react-router-dom';
import SelectCategoryPage from '../../pages/SelectCategoryPage';
import { useCategoryContext } from '../../context/categoryContext';
import { useQuizContext } from '../../context/quizContext';
import { toast } from 'react-toastify';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

jest.mock('../../context/categoryContext', () => ({
  useCategoryContext: jest.fn()
}));

jest.mock('../../context/quizContext', () => ({
  useQuizContext: jest.fn()
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock NavbarComp component
jest.mock('../../components/NavbarComp', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

// Mock modal components
jest.mock('../../models/Category/CreateCategoryModal', () => {
  return function MockCreateCategoryModal({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="create-category-modal">
        <button onClick={onClose} data-testid="close-create-modal">Close</button>
      </div>
    );
  };
});

jest.mock('../../models/Category/EditCategoryModal', () => {
  return function MockEditCategoryModal({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="edit-category-modal">
        <button onClick={onClose} data-testid="close-edit-modal">Close</button>
      </div>
    );
  };
});

jest.mock('../../models/ConfirmationModal', () => {
  return function MockConfirmationModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirmation-modal">
        <button onClick={onConfirm} data-testid="confirm-delete">Confirm</button>
        <button onClick={onClose} data-testid="cancel-delete">Cancel</button>
      </div>
    );
  };
});

// Mock data
const mockCategories = [
  { _id: '1', name: 'Math' },
  { _id: '2', name: 'Science' },
  { _id: '3', name: 'History' }
];

describe('SelectCategoryPage', () => {
  const mockNavigate = jest.fn();
  const mockGetAllCategories = jest.fn();
  const mockDeleteCategory = jest.fn();
  const mockCreateQuiz = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useCategoryContext.mockReturnValue({
      categories: mockCategories,
      getAllCategories: mockGetAllCategories,
      deleteCategory: mockDeleteCategory,
      loading: false,
      error: null
    });
    useQuizContext.mockReturnValue({
      createQuiz: mockCreateQuiz
    });
  });

  test('renders initial page with categories', async () => {
    render(<SelectCategoryPage />);

    expect(screen.getByText('Select Categories')).toBeInTheDocument();
    expect(screen.getByTestId('category-search')).toBeInTheDocument();
    
    // Check for each category
    mockCategories.forEach(category => {
      expect(screen.getByTestId(`category-item-${category._id}`)).toBeInTheDocument();
      expect(screen.getByText(category.name)).toBeInTheDocument();
    });

    expect(mockGetAllCategories).toHaveBeenCalled();
  });

  test('handles category search correctly', async () => {
    render(<SelectCategoryPage />);

    const searchInput = screen.getByTestId('category-search');
    await user.type(searchInput, 'math');

    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.queryByText('Science')).not.toBeInTheDocument();
  });

  test('handles category selection', async () => {
    render(<SelectCategoryPage />);

    const categoryItem = screen.getByTestId('category-item-1');
    await user.click(categoryItem);

    const createQuizButton = screen.getByTestId('create-quiz-button');
    expect(within(createQuizButton).getByText('Create Quiz (1)')).toBeInTheDocument();
    expect(createQuizButton).not.toBeDisabled();
  });

  test('creates new quiz with selected categories', async () => {
    mockCreateQuiz.mockResolvedValue({ quiz: { _id: 'new-quiz-id' } });
    
    render(<SelectCategoryPage />);

    // Select a category
    const categoryItem = screen.getByTestId('category-item-1');
    await user.click(categoryItem);

    // Click create quiz
    const createQuizButton = screen.getByTestId('create-quiz-button');
    await user.click(createQuizButton);

    expect(mockCreateQuiz).toHaveBeenCalledWith({
      categoryId: ['1'],
      status: 'draft'
    });
    expect(mockNavigate).toHaveBeenCalledWith('/createQuiz/new-quiz-id');
  });

  test('handles category deletion', async () => {
    mockDeleteCategory.mockResolvedValue({});
    
    render(<SelectCategoryPage />);

    const deleteButton = screen.getByTestId('delete-category-1');
    await user.click(deleteButton);

    const confirmButton = screen.getByTestId('confirm-delete');
    await user.click(confirmButton);

    expect(mockDeleteCategory).toHaveBeenCalledWith('1');
    expect(toast.success).toHaveBeenCalledWith('Category deleted successfully!');
  });

  test('handles loading state', () => {
    useCategoryContext.mockReturnValue({
      categories: [],
      getAllCategories: mockGetAllCategories,
      loading: true,
      error: null
    });

    render(<SelectCategoryPage />);
    expect(screen.getByText('Loading categories...')).toBeInTheDocument();
  });

  test('handles error state', () => {
    useCategoryContext.mockReturnValue({
      categories: [],
      getAllCategories: mockGetAllCategories,
      loading: false,
      error: { message: 'Failed to load categories' }
    });

    render(<SelectCategoryPage />);
    expect(screen.getByText('Error: Failed to load categories')).toBeInTheDocument();
  });

  test('opens and closes create category modal', async () => {
    render(<SelectCategoryPage />);

    const createButton = screen.getByTestId('create-category-button');
    await user.click(createButton);
    
    expect(screen.getByTestId('create-category-modal')).toBeInTheDocument();

    const closeButton = screen.getByTestId('close-create-modal');
    await user.click(closeButton);

    expect(mockGetAllCategories).toHaveBeenCalled();
  });

  test('opens and closes edit category modal', async () => {
    render(<SelectCategoryPage />);

    const editButton = screen.getByTestId('edit-category-1');
    await user.click(editButton);
    
    expect(screen.getByTestId('edit-category-modal')).toBeInTheDocument();

    const closeButton = screen.getByTestId('close-edit-modal');
    await user.click(closeButton);

    expect(screen.queryByTestId('edit-category-modal')).not.toBeInTheDocument();
  });

  test('handles category checkbox selection', async () => {
    render(<SelectCategoryPage />);

    // Find and click the checkbox within the category item
    const categoryItem = screen.getByTestId('category-item-1');
    const checkbox = within(categoryItem).getByRole('checkbox');
    await user.click(checkbox);

    // Verify the checkbox is checked
    expect(checkbox).toBeChecked();

    // Verify the create quiz button is updated
    const createQuizButton = screen.getByTestId('create-quiz-button');
    expect(within(createQuizButton).getByText('Create Quiz (1)')).toBeInTheDocument();
  });
});