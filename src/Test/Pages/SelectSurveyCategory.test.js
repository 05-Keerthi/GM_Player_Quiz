import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SelectSurveyCategory from '../../Pages/SelectSurveyCategory';
import { CategoryContext } from '../../context/categoryContext';
import { SurveyContext } from '../../context/surveyContext';
import { toast } from 'react-toastify';
import { within, act } from '@testing-library/react';
// Mock the react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: { surveyType: 'survey' }
  })
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock data
const mockCategories = [
  { _id: '1', name: 'Category 1' },
  { _id: '2', name: 'Category 2' },
  { _id: '3', name: 'Category 3' }
];

const mockSurveyResponse = {
  surveyQuiz: { _id: 'survey123' }
};

// Mock context values
const mockCategoryContext = {
  categories: mockCategories,
  getAllCategories: jest.fn(),
  deleteCategory: jest.fn(),
  loading: false,
  error: null
};

const mockSurveyContext = {
  createSurvey: jest.fn().mockResolvedValue(mockSurveyResponse)
};

// Helper function to render component with context
const renderWithContext = (categoryContextValue = mockCategoryContext, surveyContextValue = mockSurveyContext) => {
  return render(
    <BrowserRouter>
      <CategoryContext.Provider value={categoryContextValue}>
        <SurveyContext.Provider value={surveyContextValue}>
          <SelectSurveyCategory />
        </SurveyContext.Provider>
      </CategoryContext.Provider>
    </BrowserRouter>
  );
};

describe('SelectSurveyCategory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders component and loads categories', () => {
    renderWithContext();
    expect(mockCategoryContext.getAllCategories).toHaveBeenCalled();
    expect(screen.getByText('Select Survey Categories')).toBeInTheDocument();
  });

  test('displays loading state', () => {
    renderWithContext({
      ...mockCategoryContext,
      loading: true
    });
    expect(screen.getByText('Loading categories...')).toBeInTheDocument();
  });

  test('displays error state', () => {
    renderWithContext({
      ...mockCategoryContext,
      error: { message: 'Failed to load categories' }
    });
    expect(screen.getByText('Error: Failed to load categories')).toBeInTheDocument();
  });

  test('allows searching categories', () => {
    renderWithContext();
    const searchInput = screen.getByTestId('category-search');
    fireEvent.change(searchInput, { target: { value: 'Category 1' } });
    expect(screen.getByText('Category 1')).toBeInTheDocument();
  });

  test('allows selecting categories', () => {
    renderWithContext();
    const categoryItem = screen.getByTestId('category-item-1');
    fireEvent.click(categoryItem);
    const createButton = screen.getByTestId('create-survey-button');
    expect(createButton).not.toHaveClass('bg-gray-400');
  });

  test('creates survey when clicking create button', async () => {
    // Mock the createSurvey response
    const mockCreateSurveyResponse = {
      surveyQuiz: { _id: 'survey123' }
    };
    const mockSurveyContextWithResponse = {
      createSurvey: jest.fn().mockResolvedValue(mockCreateSurveyResponse)
    };
  
    // Render with the mock context
    renderWithContext(mockCategoryContext, mockSurveyContextWithResponse);
    
    // Select a category
    const categoryItem = screen.getByTestId('category-item-1');
    fireEvent.click(categoryItem);
    
    // Verify the category is selected (checkbox is checked)
    const checkbox = within(categoryItem).getByRole('checkbox');
    expect(checkbox.checked).toBeTruthy();
    
    // Click create button
    const createButton = screen.getByTestId('create-survey-button');
    fireEvent.click(createButton);
  
    // Wait for createSurvey to be called with correct parameters
    await waitFor(() => {
      expect(mockSurveyContextWithResponse.createSurvey).toHaveBeenCalledWith({
        categoryId: ['1'],
        status: 'draft',
        type: 'survey'
      });
    });
  
    // Since createSurvey is async, we need to wait for it to resolve
    // and then for the navigation to happen
    await act(async () => {
      await mockSurveyContextWithResponse.createSurvey.mock.results[0].value;
    });
  
    // Now check if navigation was called with the correct path
    expect(mockNavigate).toHaveBeenCalledWith('/createSurvey/survey123');
  });

  test('handles create survey error', async () => {
    const errorMessage = 'Failed to create survey';
    const mockErrorSurveyContext = {
      createSurvey: jest.fn().mockRejectedValue({ response: { data: { message: errorMessage } } })
    };

    renderWithContext(mockCategoryContext, mockErrorSurveyContext);
    
    // Select a category
    const categoryItem = screen.getByTestId('category-item-1');
    fireEvent.click(categoryItem);
    
    // Click create button
    const createButton = screen.getByTestId('create-survey-button');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  test('handles category deletion', async () => {
    mockCategoryContext.deleteCategory.mockResolvedValueOnce();
    renderWithContext();
    
    // Click delete button
    const deleteButton = screen.getByTestId('delete-category-1');
    fireEvent.click(deleteButton);
    
    // Wait for confirmation modal to appear and click confirm
    await waitFor(() => {
      const confirmationMessage = screen.getByText('Are you sure you want to delete this category? This action cannot be undone.');
      expect(confirmationMessage).toBeInTheDocument();
    });

    // Find and click the confirm button in the modal
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockCategoryContext.deleteCategory).toHaveBeenCalledWith('1');
      expect(toast.success).toHaveBeenCalledWith('Category deleted successfully!');
    });
  });

  test('handles category deletion error', async () => {
    const errorMessage = 'Failed to delete category';
    mockCategoryContext.deleteCategory.mockRejectedValueOnce({ 
      response: { data: { message: errorMessage } } 
    });
    
    renderWithContext();
    
    // Click delete button
    const deleteButton = screen.getByTestId('delete-category-1');
    fireEvent.click(deleteButton);
    
    // Wait for confirmation modal and click confirm
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  test('displays no categories message when search returns no results', () => {
    renderWithContext();
    const searchInput = screen.getByTestId('category-search');
    fireEvent.change(searchInput, { target: { value: 'NonexistentCategory' } });
    expect(screen.getByText('No categories found')).toBeInTheDocument();
  });
});