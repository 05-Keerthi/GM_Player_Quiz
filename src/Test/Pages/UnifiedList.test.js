import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DragDropContext } from 'react-beautiful-dnd';
import UnifiedList from '../../pages/UnifiedList';
import { QuizContext } from '../../context/quizContext';
import { SurveyContext } from '../../context/surveyContext';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  Droppable: ({ children }) => children({
    draggableProps: {
      style: {},
    },
    innerRef: jest.fn(),
  }, {}),
  Draggable: ({ children }) => children({
    draggableProps: {
      style: {},
    },
    innerRef: jest.fn(),
    dragHandleProps: {},
  }, {}),
  DragDropContext: ({ children }) => children,
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock data
const mockQuizzes = [
  {
    _id: '1',
    title: 'Test Quiz 1',
    description: 'Description 1',
    status: 'draft',
    questions: ['q1', 'q2'],
    slides: ['s1']
  },
  {
    _id: '2',
    title: 'Test Quiz 2',
    description: 'Description 2',
    status: 'active',
    questions: ['q1'],
    slides: ['s1', 's2']
  }
];

const mockSurveys = [
  {
    _id: '3',
    title: 'Test Survey 1',
    description: 'Description 3',
    status: 'draft',
    type: 'survey',
    questions: ['q1'],
    slides: ['s1']
  }
];

// Mock context values
const mockQuizContext = {
  quizzes: mockQuizzes,
  getAllQuizzes: jest.fn(),
  deleteQuiz: jest.fn(),
  updateQuiz: jest.fn()
};

const mockSurveyContext = {
  surveys: mockSurveys,
  getAllSurveys: jest.fn(),
  deleteSurvey: jest.fn(),
  updateSurvey: jest.fn(),
  publishSurvey: jest.fn()
};

const mockAuthContext = {
  user: { id: 'user1' }
};

// Test component wrapper
const renderWithProviders = (contentType = 'quiz') => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <QuizContext.Provider value={mockQuizContext}>
          <SurveyContext.Provider value={mockSurveyContext}>
            <UnifiedList contentType={contentType} />
          </SurveyContext.Provider>
        </QuizContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('UnifiedList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization and Rendering', () => {
    test('renders quiz list correctly', () => {
      renderWithProviders('quiz');
      expect(screen.getByText('My Quizzes')).toBeInTheDocument();
      expect(screen.getByText('Test Quiz 1')).toBeInTheDocument();
      expect(screen.getByText('Test Quiz 2')).toBeInTheDocument();
    });

    test('renders survey list correctly', () => {
      renderWithProviders('survey');
      expect(screen.getByText('My Surveys')).toBeInTheDocument();
      expect(screen.getByText('Test Survey 1')).toBeInTheDocument();
    });

    test('loads data on mount', () => {
      renderWithProviders('quiz');
      expect(mockQuizContext.getAllQuizzes).toHaveBeenCalled();
    });
  });

  describe('Filtering', () => {
    test('filters by status correctly', () => {
      renderWithProviders('quiz');
      const draftFilter = screen.getByTestId('filter-draft');
      fireEvent.click(draftFilter);
      expect(screen.getByText('Test Quiz 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Quiz 2')).not.toBeInTheDocument();
    });

    test('shows all items when "all" filter is selected', () => {
      renderWithProviders('quiz');
      const allFilter = screen.getByTestId('filter-all');
      fireEvent.click(allFilter);
      expect(screen.getByText('Test Quiz 1')).toBeInTheDocument();
      expect(screen.getByText('Test Quiz 2')).toBeInTheDocument();
    });
  });

  describe('Card Actions', () => {
    test('handles edit button click', () => {
      renderWithProviders('quiz');
      const editButton = screen.getByTestId('edit-button-1');
      fireEvent.click(editButton);
      expect(mockNavigate).toHaveBeenCalledWith('/createQuiz/1');
    });

    test('handles delete button click and confirmation', async () => {
      renderWithProviders('quiz');
      const deleteButton = screen.getByTestId('delete-button-1');
      fireEvent.click(deleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockQuizContext.deleteQuiz).toHaveBeenCalledWith('1');
        expect(toast.success).toHaveBeenCalled();
      });
    });

    test('navigates to details page when clicking active item', () => {
      renderWithProviders('quiz');
      const activeQuizCard = screen.getByTestId('quiz-card-2');
      fireEvent.click(activeQuizCard);
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/details?type=quiz&quizId=2')
      );
    });
  });

  describe('Status Changes', () => {
    test('handles publish action correctly', async () => {
      renderWithProviders('quiz');
      const publishButton = screen.getByText('Publish Quiz');
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(mockQuizContext.updateQuiz).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalled();
      });
    });

    test('handles close action correctly', async () => {
      renderWithProviders('quiz');
      const closeButton = screen.getByText('Close Quiz');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(mockQuizContext.updateQuiz).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalled();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));
    });

    test('shows mobile menu button on small screens', () => {
      renderWithProviders('quiz');
      expect(screen.getByTestId('mobile-menu-button')).toBeInTheDocument();
    });

    test('toggles filter menu on mobile', () => {
      renderWithProviders('quiz');
      const menuButton = screen.getByTestId('mobile-menu-button');
      fireEvent.click(menuButton);
      expect(screen.getByTestId('filter-menu')).toHaveClass('translate-x-0');
    });
  });

  describe('Create New Button', () => {
    test('navigates to correct page when creating new quiz', () => {
      renderWithProviders('quiz');
      const createButton = screen.getByTestId('create-button');
      fireEvent.click(createButton);
      expect(mockNavigate).toHaveBeenCalledWith('/selectQuizCategory');
    });

    test('navigates to correct page when creating new survey', () => {
      renderWithProviders('survey');
      const createButton = screen.getByTestId('create-button');
      fireEvent.click(createButton);
      expect(mockNavigate).toHaveBeenCalledWith('/selectSurveyCategory', { state: { surveyType: 'survey' } });
    });
  });

  describe('Error Handling', () => {
    test('shows error toast when delete fails', async () => {
      mockQuizContext.deleteQuiz.mockRejectedValueOnce(new Error('Delete failed'));
      renderWithProviders('quiz');
      
      const deleteButton = screen.getByTestId('delete-button-1');
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    test('shows error toast when status update fails', async () => {
      mockQuizContext.updateQuiz.mockRejectedValueOnce(new Error('Update failed'));
      renderWithProviders('quiz');
      
      const publishButton = screen.getByText('Publish Quiz');
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });
});