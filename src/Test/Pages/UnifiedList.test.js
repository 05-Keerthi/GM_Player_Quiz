// import React from "react";
// import {
//   render,
//   screen,
//   fireEvent,
//   waitFor,
//   within,
// } from "@testing-library/react";
// import "@testing-library/jest-dom";
// import UnifiedList from "../../pages/UnifiedList";
// import { toast } from "react-toastify";

// // Setup all mocks first
// jest.mock("react-toastify", () => {
//   return {
//     toast: {
//       success: jest.fn(),
//       error: jest.fn(),
//     },
//   };
// });

// jest.mock("react-router-dom", () => ({
//   useNavigate: () => jest.fn(),
// }));

// jest.mock("react-beautiful-dnd", () => ({
//   DragDropContext: ({ children }) => children,
//   Droppable: ({ children }) =>
//     children(
//       {
//         draggableProps: {
//           style: {},
//         },
//         innerRef: jest.fn(),
//       },
//       {}
//     ),
//   Draggable: ({ children }) =>
//     children(
//       {
//         draggableProps: {
//           style: {},
//         },
//         innerRef: jest.fn(),
//         dragHandleProps: {},
//       },
//       {}
//     ),
// }));

// jest.mock("../../components/NavbarComp", () => {
//   return function MockNavbar() {
//     return <div data-testid="mock-navbar">Mock Navbar</div>;
//   };
// });

// jest.mock("../../models/ConfirmationModal", () => {
//   return function MockConfirmationModal({
//     isOpen,
//     onClose,
//     onConfirm,
//     children,
//   }) {
//     if (!isOpen) return null;
//     return (
//       <div data-testid="confirmation-modal">
//         {children}
//         <button data-testid="confirm-delete-button" onClick={onConfirm}>
//           Confirm
//         </button>
//         <button onClick={onClose}>Cancel</button>
//       </div>
//     );
//   };
// });

// // Mock contexts
// const mockQuizContext = {
//   quizzes: [],
//   getAllQuizzes: jest.fn(),
//   deleteQuiz: jest.fn(),
//   updateQuiz: jest.fn(),
// };

// const mockSurveyContext = {
//   surveys: [],
//   getAllSurveys: jest.fn(),
//   deleteSurvey: jest.fn(),
//   updateSurvey: jest.fn(),
//   publishSurvey: jest.fn(),
// };

// const mockAuthContext = {
//   user: { id: "user123" },
// };

// // Mock the context hooks after context objects are defined
// jest.mock("../../context/quizContext", () => ({
//   useQuizContext: () => mockQuizContext,
// }));

// jest.mock("../../context/surveyContext", () => ({
//   useSurveyContext: () => mockSurveyContext,
// }));

// jest.mock("../../context/AuthContext", () => ({
//   useAuthContext: () => mockAuthContext,
// }));

// const mockNavigate = jest.fn();
// jest.mock("react-router-dom", () => ({
//   useNavigate: () => mockNavigate,
// }));

// describe("UnifiedList Component", () => {
//   const mockQuizData = [
//     {
//       _id: "1",
//       title: "Test Quiz 1",
//       description: "Quiz description 1",
//       status: "draft",
//       questions: [{ id: 1 }, { id: 2 }],
//       slides: [{ id: 1 }],
//     },
//     {
//       _id: "2",
//       title: "Test Quiz 2",
//       description: "Quiz description 2",
//       status: "active",
//       questions: [{ id: 1 }],
//       slides: [{ id: 1 }, { id: 2 }],
//     },
//   ];

//   const mockSurveyData = [
//     {
//       _id: "1",
//       title: "Test Survey 1",
//       description: "Survey description 1",
//       status: "draft",
//       questions: [{ id: 1 }, { id: 2 }],
//       slides: [{ id: 1 }],
//     },
//   ];

//   beforeEach(() => {
//     jest.clearAllMocks();
//     // Reset window dimensions
//     global.innerWidth = 1024;
//     global.dispatchEvent(new Event("resize"));
//   });

//   describe("Quiz Mode", () => {
//     beforeEach(() => {
//       mockQuizContext.quizzes = mockQuizData;
//     });

//     test("renders quiz list correctly", () => {
//       render(<UnifiedList contentType="quiz" />);

//       // Check header text
//       const headerElement = screen.getByTestId("content-header");
//       expect(headerElement).toBeInTheDocument();
//       expect(headerElement).toHaveTextContent("My Quizs");

//       // Check create button
//       const createButton = screen.getByTestId("create-button");
//       expect(createButton).toBeInTheDocument();
//       expect(createButton).toHaveTextContent(/Create New Quiz/i);

//       // Check quiz cards
//       mockQuizData.forEach((quiz) => {
//         const card = screen.getByTestId(`quiz-card-${quiz._id}`);
//         expect(card).toBeInTheDocument();
//         expect(screen.getByTestId(`quiz-title-${quiz._id}`)).toHaveTextContent(
//           quiz.title
//         );
//         expect(card).toHaveTextContent(quiz.description);

//         // Check question count
//         expect(card).toHaveTextContent(`${quiz.questions.length} Questions`);

//         // Check status badge within the specific card
//         const statusBadgeText =
//           quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1);
//         const cardStatusBadge = within(card).getByText(statusBadgeText);
//         expect(cardStatusBadge).toBeInTheDocument();
//       });
//     });

//     test("navigates to quiz creation page", () => {
//       render(<UnifiedList contentType="quiz" />);
//       fireEvent.click(screen.getByTestId("create-button"));
//       expect(mockNavigate).toHaveBeenCalledWith("/selectquizcategory");
//     });

//     test("navigates to quiz edit page", () => {
//       render(<UnifiedList contentType="quiz" />);
//       fireEvent.click(screen.getByTestId("edit-button-1"));
//       expect(mockNavigate).toHaveBeenCalledWith("/createQuiz/1");
//     });
//   });

//   describe("Survey Mode", () => {
//     beforeEach(() => {
//       mockSurveyContext.surveys = mockSurveyData;
//     });

//     test("renders survey list correctly", () => {
//       render(<UnifiedList contentType="survey" />);

//       // Check header text
//       expect(screen.getByTestId("content-header")).toHaveTextContent(
//         "My Surveys"
//       );

//       // Check create button
//       const createButton = screen.getByTestId("create-button");
//       expect(createButton).toBeInTheDocument();
//       expect(createButton).toHaveTextContent(/Create New Survey/i);

//       // Check survey cards
//       mockSurveyData.forEach((survey) => {
//         const card = screen.getByTestId(`survey-card-${survey._id}`);
//         expect(card).toBeInTheDocument();
//         expect(
//           screen.getByTestId(`survey-title-${survey._id}`)
//         ).toHaveTextContent(survey.title);
//         expect(card).toHaveTextContent(survey.description);
//       });
//     });

//     test("navigates to survey creation page", () => {
//       render(<UnifiedList contentType="survey" />);
//       fireEvent.click(screen.getByTestId("create-button"));
//       expect(mockNavigate).toHaveBeenCalledWith("/selectsurveycategory");
//     });

//     test("navigates to survey edit page", () => {
//       render(<UnifiedList contentType="survey" />);
//       fireEvent.click(screen.getByTestId("edit-button-1"));
//       expect(mockNavigate).toHaveBeenCalledWith("/createSurvey/1");
//     });
//   });

//   describe("Delete Functionality", () => {
//     describe("Quiz Delete Tests", () => {
//       test("shows confirmation modal when delete button is clicked", () => {
//         render(<UnifiedList contentType="quiz" />);

//         // Initially modal should not be visible
//         expect(
//           screen.queryByTestId("confirmation-modal")
//         ).not.toBeInTheDocument();

//         // Click delete button
//         fireEvent.click(screen.getByTestId("delete-button-1"));

//         // Modal should now be visible
//         expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
//       });

//       test("closes modal when cancel is clicked", () => {
//         render(<UnifiedList contentType="quiz" />);

//         // Open modal
//         fireEvent.click(screen.getByTestId("delete-button-1"));
//         expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();

//         // Click cancel
//         fireEvent.click(screen.getByText("Cancel"));

//         // Modal should be closed
//         expect(
//           screen.queryByTestId("confirmation-modal")
//         ).not.toBeInTheDocument();
//       });

//       test("successfully deletes quiz and shows success toast", async () => {
//         mockQuizContext.deleteQuiz.mockResolvedValueOnce();

//         render(<UnifiedList contentType="quiz" />);

//         // Trigger deletion
//         fireEvent.click(screen.getByTestId("delete-button-1"));
//         fireEvent.click(screen.getByTestId("confirm-delete-button"));

//         // Verify deleteQuiz was called with correct ID
//         expect(mockQuizContext.deleteQuiz).toHaveBeenCalledWith("1");

//         // Wait for success toast
//         await waitFor(() => {
//           expect(toast.success).toHaveBeenCalledWith(
//             "Quiz deleted successfully!"
//           );
//         });

//         // Modal should be closed
//         expect(
//           screen.queryByTestId("confirmation-modal")
//         ).not.toBeInTheDocument();
//       });

//       test("handles delete failure and shows error toast", async () => {
//         const error = new Error("Network error");
//         mockQuizContext.deleteQuiz.mockRejectedValueOnce(error);

//         render(<UnifiedList contentType="quiz" />);

//         // Trigger deletion
//         fireEvent.click(screen.getByTestId("delete-button-1"));
//         fireEvent.click(screen.getByTestId("confirm-delete-button"));

//         // Verify error toast was shown
//         await waitFor(() => {
//           expect(toast.error).toHaveBeenCalledWith("Failed to delete");
//         });

//         // Modal should be closed after error
//         expect(
//           screen.queryByTestId("confirmation-modal")
//         ).not.toBeInTheDocument();
//       });
//     });

//     describe("Survey Delete Tests", () => {
//       beforeEach(() => {
//         mockSurveyContext.surveys = mockSurveyData;
//       });

//       test("shows confirmation modal when delete button is clicked", () => {
//         render(<UnifiedList contentType="survey" />);

//         // Initially modal should not be visible
//         expect(
//           screen.queryByTestId("confirmation-modal")
//         ).not.toBeInTheDocument();

//         // Click delete button
//         fireEvent.click(screen.getByTestId("delete-button-1"));

//         // Modal should now be visible
//         expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
//       });

//       test("closes modal when cancel is clicked", () => {
//         render(<UnifiedList contentType="survey" />);

//         // Open modal
//         fireEvent.click(screen.getByTestId("delete-button-1"));
//         expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();

//         // Click cancel
//         fireEvent.click(screen.getByText("Cancel"));

//         // Modal should be closed
//         expect(
//           screen.queryByTestId("confirmation-modal")
//         ).not.toBeInTheDocument();
//       });

//       test("successfully deletes survey and shows success toast", async () => {
//         mockSurveyContext.deleteSurvey.mockResolvedValueOnce();

//         render(<UnifiedList contentType="survey" />);

//         fireEvent.click(screen.getByTestId("delete-button-1"));
//         fireEvent.click(screen.getByTestId("confirm-delete-button"));

//         expect(mockSurveyContext.deleteSurvey).toHaveBeenCalledWith("1");

//         await waitFor(() => {
//           expect(toast.success).toHaveBeenCalledWith(
//             "Survey deleted successfully!"
//           );
//         });

//         // Modal should be closed
//         expect(
//           screen.queryByTestId("confirmation-modal")
//         ).not.toBeInTheDocument();
//       });

//       test("handles delete failure and shows error toast", async () => {
//         const error = new Error("Network error");
//         mockSurveyContext.deleteSurvey.mockRejectedValueOnce(error);

//         render(<UnifiedList contentType="survey" />);

//         // Trigger deletion
//         fireEvent.click(screen.getByTestId("delete-button-1"));
//         fireEvent.click(screen.getByTestId("confirm-delete-button"));

//         // Verify error toast was shown
//         await waitFor(() => {
//           expect(toast.error).toHaveBeenCalledWith("Failed to delete");
//         });

//         // Modal should be closed after error
//         expect(
//           screen.queryByTestId("confirmation-modal")
//         ).not.toBeInTheDocument();
//       });
//     });
//   });

//   describe("Mobile Responsiveness", () => {
//     beforeEach(() => {
//       global.innerWidth = 375; // Mobile width
//       global.dispatchEvent(new Event("resize"));
//     });

//     test("displays mobile menu button on small screens", () => {
//       render(<UnifiedList contentType="quiz" />);
//       expect(screen.getByTestId("mobile-menu-button")).toBeInTheDocument();
//     });

//     test("handles filter menu toggle on mobile", () => {
//       render(<UnifiedList contentType="quiz" />);

//       const menuButton = screen.getByTestId("mobile-menu-button");
//       fireEvent.click(menuButton);

//       expect(screen.getByTestId("filter-menu")).toHaveClass("translate-x-0");

//       const closeButton = screen.getByTestId("close-menu-button");
//       fireEvent.click(closeButton);

//       expect(screen.getByTestId("filter-menu")).toHaveClass("translate-x-full");
//     });
//   });

//   describe("Filter Functionality", () => {
//     beforeEach(() => {
//       mockQuizContext.quizzes = mockQuizData;
//     });

//     test("filters content by status", () => {
//       render(<UnifiedList contentType="quiz" />);

//       // Check draft filter
//       fireEvent.click(screen.getByTestId("filter-draft"));
//       expect(screen.getByTestId("quiz-card-1")).toBeInTheDocument();
//       expect(screen.queryByTestId("quiz-card-2")).not.toBeInTheDocument();

//       // Check active filter
//       fireEvent.click(screen.getByTestId("filter-active"));
//       expect(screen.queryByTestId("quiz-card-1")).not.toBeInTheDocument();
//       expect(screen.getByTestId("quiz-card-2")).toBeInTheDocument();

//       // Check all filter
//       fireEvent.click(screen.getByTestId("filter-all"));
//       expect(screen.getByTestId("quiz-card-1")).toBeInTheDocument();
//       expect(screen.getByTestId("quiz-card-2")).toBeInTheDocument();
//     });
//   });
// });
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