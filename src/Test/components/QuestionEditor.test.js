import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionEditor from "../../components/QuestionEditor";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock ColorPicker component
jest.mock("../../components/ColorPicker", () => ({ color, onChange }) => (
  <div data-testid="color-picker">
    <input
      type="color"
      value={color}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
));

describe("QuestionEditor", () => {
  // Common test data
  const mockQuestion = {
    id: "test-id",
    title: "Sample Question",
    type: "multiple_choice",
    options: [
      { text: "Option 1", isCorrect: false, color: "#ffffff" },
      { text: "Option 2", isCorrect: true, color: "#ffffff" },
      { text: "Option 3", isCorrect: false, color: "#ffffff" },
    ],
    points: 5,
    timer: 30,
    imageUrl: "/uploads/test-image.jpg",
  };

  const mockOnUpdate = jest.fn();
  const mockOnClose = jest.fn();

  // Mock environment variables
  const mockEnv = {
    REACT_APP_API_URL: "http://localhost:3000",
  };

  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...process.env, ...mockEnv };
    localStorage.clear();
    localStorage.setItem("token", "mock-token");
    global.fetch = jest.fn();
    global.URL.createObjectURL = jest.fn(() => "mock-object-url");
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Initialization", () => {
    test("renders with initial question data", () => {
      render(
        <QuestionEditor
          question={mockQuestion}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByDisplayValue("Sample Question")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Option 1")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Option 2")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Option 3")).toBeInTheDocument();
      expect(screen.getByDisplayValue("5")).toBeInTheDocument();
      expect(screen.getByDisplayValue("30")).toBeInTheDocument();
    });

    test("returns null when no question prop is provided", () => {
      const { container } = render(
        <QuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Question Type Handling", () => {
    test("renders multiple choice options correctly", () => {
      render(
        <QuestionEditor
          question={mockQuestion}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const radioInputs = screen.getAllByRole("radio");
      expect(radioInputs).toHaveLength(3);
    });

    test("renders true/false options correctly", () => {
      const trueFalseQuestion = {
        ...mockQuestion,
        type: "true_false",
        options: [
          { text: "True", isCorrect: true, color: "#ffffff" },
          { text: "False", isCorrect: false, color: "#ffffff" },
        ],
      };

      render(
        <QuestionEditor
          question={trueFalseQuestion}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByDisplayValue("True")).toBeInTheDocument();
      expect(screen.getByDisplayValue("False")).toBeInTheDocument();
      expect(screen.queryByText("Add Option")).not.toBeInTheDocument();
    });

    test("renders open-ended question correctly", () => {
      const openEndedQuestion = {
        ...mockQuestion,
        type: "open_ended",
        correctAnswer: "Test answer",
      };

      render(
        <QuestionEditor
          question={openEndedQuestion}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByPlaceholderText("Enter the correct answer")).toBeInTheDocument();
    });
  });

  describe("Options Management", () => {
    test("allows removing options when more than 2 exist", async () => {
      render(
        <QuestionEditor
          question={mockQuestion}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );
  
      // Get all buttons
      const buttons = screen.getAllByRole("button");
  
      // Filter for remove option buttons by checking for both the className and Trash2 icon
      const removeButtons = buttons.filter(button => {
        const hasTrashIcon = button.querySelector('[data-testid="trash-2-icon"]');
        const hasCorrectClass = button.className.includes('text-red-500');
        return hasTrashIcon && hasCorrectClass;
      });
      
      expect(removeButtons).toHaveLength(3); // Should have 3 remove buttons initially
      
      await userEvent.click(removeButtons[0]);
      
      const remainingOptions = screen.getAllByPlaceholderText(/Option \d+/);
      expect(remainingOptions).toHaveLength(2);
    });
  });

  describe("Image Handling", () => {
    test("handles successful image upload", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          media: [{ _id: "media-123", filename: "uploaded-image.jpg" }]
        })
      });

      render(
        <QuestionEditor
          question={mockQuestion}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const file = new File(["test"], "test-image.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText(/Upload Image/i);

      await userEvent.upload(input, file);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/media/upload",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
        })
      );

      await waitFor(() => {
        const image = screen.getByAltText("Question");
        expect(image).toBeInTheDocument();
        expect(image.src).toContain("/uploads/uploaded-image.jpg");
      });
    });

    test("handles image upload failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Upload failed"));

      render(
        <QuestionEditor
          question={mockQuestion}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const file = new File(["test"], "test-image.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText(/Upload Image/i);

      await userEvent.upload(input, file);

      expect(await screen.findByText("Failed to upload image")).toBeInTheDocument();
    });

    test("allows removing uploaded image", async () => {
      render(
        <QuestionEditor
          question={mockQuestion}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const removeButton = screen.getByText("Remove");
      await userEvent.click(removeButton);

      expect(screen.queryByAltText("Question")).not.toBeInTheDocument();
    });
  });

  describe("Save and Cancel Operations", () => {
    test("saves question with updated data", async () => {
      render(
        <QuestionEditor
          question={mockQuestion}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const titleInput = screen.getByDisplayValue("Sample Question");
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "Updated Question");

      const pointsInput = screen.getByDisplayValue("5");
      await userEvent.clear(pointsInput);
      await userEvent.type(pointsInput, "10");

      const saveButton = screen.getByText("Save");
      await userEvent.click(saveButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Updated Question",
          points: 10,
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });

    test("closes without saving when cancel is clicked", async () => {
      render(
        <QuestionEditor
          question={mockQuestion}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const cancelButton = screen.getByText("Cancel");
      await userEvent.click(cancelButton);

      expect(mockOnUpdate).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});