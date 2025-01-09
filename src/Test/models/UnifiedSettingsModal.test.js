import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UnifiedSettingsModal from "../../models/UnifiedSettingsModal";

// Mock dependencies
jest.mock("lucide-react", () => ({
  AlertCircle: () => <div data-testid="icon-alert-circle" />,
}));

describe("UnifiedSettingsModal", () => {
  // Mock variables
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnTitleUpdate = jest.fn();

  const initialData = {
    title: "Sample Quiz Title",
    description: "Sample description",
    id: "quiz-123",
  };

  // Setup and teardown
  beforeAll(() => {
    process.env.REACT_APP_API_URL = 'http://test-api';
  });

  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // Helper function to render modal with default props
  const renderModal = (props = {}) => {
    return render(
      <UnifiedSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialData={initialData}
        type="quiz"
        {...props}
      />
    );
  };

  // Tests
  test("renders the modal when open", () => {
    renderModal();

    expect(screen.getByText(/Quiz Settings/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter a title for your quiz/i)).toHaveValue(initialData.title);
    expect(screen.getByPlaceholderText(/Provide a short description for your quiz/i)).toHaveValue(
      initialData.description
    );
  });

  test("does not render the modal when not open", () => {
    const { container } = render(
      <UnifiedSettingsModal
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialData={initialData}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  test("handles input changes", () => {
    renderModal();

    const titleInput = screen.getByPlaceholderText(/Enter a title for your quiz/i);
    const descriptionInput = screen.getByPlaceholderText(/Provide a short description for your quiz/i);

    fireEvent.change(titleInput, { target: { value: "Updated Title" } });
    fireEvent.change(descriptionInput, { target: { value: "Updated Description" } });

    expect(titleInput).toHaveValue("Updated Title");
    expect(descriptionInput).toHaveValue("Updated Description");
  });

  test("validates form submission - empty title", async () => {
    renderModal({ initialData: {} });
    
    const doneButton = screen.getByText(/Done/i);
    expect(doneButton).toBeDisabled();
    
    const titleInput = screen.getByPlaceholderText(/Enter a title for your quiz/i);
    fireEvent.change(titleInput, { target: { value: "Test" } });
    fireEvent.change(titleInput, { target: { value: "" } });
    
    expect(doneButton).toBeDisabled();
  });

  test("submits valid form data", async () => {
    const mockResponse = { 
      title: "Updated Title", 
      description: "Updated Description" 
    };
    
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    renderModal({ onTitleUpdate: mockOnTitleUpdate });

    // Fill in form
    fireEvent.change(screen.getByPlaceholderText(/Enter a title for your quiz/i), {
      target: { value: "Updated Title" }
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Provide a short description for your quiz/i), {
      target: { value: "Updated Description" }
    });

    // Submit form
    fireEvent.click(screen.getByText(/Done/i));

    // Wait for and verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `http://test-api/api/quizzes/${initialData.id}`,
        expect.objectContaining({
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer test-token"
          },
          body: JSON.stringify({
            title: "Updated Title",
            description: "Updated Description",
          }),
        })
      );
    });

    expect(mockOnSave).toHaveBeenCalledWith(mockResponse);
    expect(mockOnTitleUpdate).toHaveBeenCalledWith("Updated Title");
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("handles API errors gracefully", async () => {
    const errorMessage = "Failed to update quiz";
    
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: errorMessage })
      })
    );

    renderModal();

    fireEvent.change(screen.getByPlaceholderText(/Enter a title for your quiz/i), {
      target: { value: "Test Title" }
    });

    fireEvent.click(screen.getByText(/Done/i));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test("handles missing auth token", async () => {
    localStorage.clear(); // Remove token
    renderModal();

    fireEvent.change(screen.getByPlaceholderText(/Enter a title for your quiz/i), {
      target: { value: "Test Title" }
    });

    fireEvent.click(screen.getByText(/Done/i));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Authentication token not found/i);
    });
  });

  test("disables inputs and buttons while loading", async () => {
    global.fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({})
      }), 100))
    );

    renderModal();

    // Ensure form has a title to enable the Done button
    const titleInput = screen.getByPlaceholderText(/Enter a title for your quiz/i);
    fireEvent.change(titleInput, { target: { value: "Test Title" } });

    // Click Done and verify loading state
    fireEvent.click(screen.getByText(/Done/i));
    
    await waitFor(() => {
      expect(screen.getByText(/Saving.../i)).toBeDisabled();
      expect(titleInput).toBeDisabled();
      expect(screen.getByPlaceholderText(/Provide a short description for your quiz/i)).toBeDisabled();
    });
  });

  test("calls onClose when Cancel is clicked", () => {
    renderModal();

    fireEvent.click(screen.getByText(/Cancel/i));
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("handles survey type correctly", () => {
    renderModal({ type: "survey" });

    expect(screen.getByText(/Survey Settings/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter a title for your survey/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Provide a short description for your survey/i)).toBeInTheDocument();
  });

  test("resets form data when modal is reopened", () => {
    const { rerender } = renderModal({ isOpen: false });

    rerender(
      <UnifiedSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialData={{ ...initialData, title: "New Title" }}
        type="quiz"
      />
    );

    expect(screen.getByPlaceholderText(/Enter a title for your quiz/i)).toHaveValue("New Title");
  });
});