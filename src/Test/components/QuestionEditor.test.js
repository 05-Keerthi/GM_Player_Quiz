// QuestionEditor.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionEditor from "../../components/QuestionEditor";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock ColorPicker component
jest.mock("../../components/ColorPicker", () => ({
  __esModule: true,
  default: ({ color, onChange }) => (
    <input
      type="color"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      data-testid="color-picker"
    />
  ),
}));

// Mock QuestionTypeModal
jest.mock("../../models/QuestionTypeModal", () => ({
  QuestionTypeModal: ({ isOpen, onClose, onTypeSelect }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="question-type-modal">
        <div className="modal-content">
          <div className="grid grid-cols-1 gap-4">
            <button
              data-testid="type-multiple-choice"
              onClick={() => onTypeSelect("multiple_choice")}
              className="type-button"
            >
              Multiple Choice
            </button>
            <button
              data-testid="type-true-false"
              onClick={() => onTypeSelect("true_false")}
              className="type-button"
            >
              True/False
            </button>
            <button
              data-testid="type-open-ended"
              onClick={() => onTypeSelect("open_ended")}
              className="type-button"
            >
              Open Ended
            </button>
            <button
              data-testid="type-multiple-select"
              onClick={() => onTypeSelect("multiple_select")}
              className="type-button"
            >
              Multiple Select
            </button>
            <button
              data-testid="type-poll"
              onClick={() => onTypeSelect("poll")}
              className="type-button"
            >
              Poll
            </button>
          </div>
        </div>
      </div>
    );
  },
}));

const mockOnSubmit = jest.fn();
const mockOnClose = jest.fn();

describe("QuestionEditor", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    global.fetch = jest.fn();
    mockOnSubmit.mockClear();
    mockOnClose.mockClear();
    // Mock environment variables
    process.env.REACT_APP_API_URL = "http://test-api.com";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Render and Type Selection", () => {
    test("renders type modal when no initial question is provided", () => {
      render(<QuestionEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      expect(screen.getByTestId("question-type-modal")).toBeInTheDocument();
    });

    test("loads initial question data correctly", () => {
      const initialQuestion = {
        title: "Test Question",
        type: "multiple_choice",
        options: [
          { text: "Option 1", isCorrect: true, color: "#ffffff" },
          { text: "Option 2", isCorrect: false, color: "#ffffff" },
        ],
        points: 10,
        timer: 20,
      };

      render(
        <QuestionEditor
          initialQuestion={initialQuestion}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByDisplayValue("Test Question")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Option 1")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Option 2")).toBeInTheDocument();
      expect(screen.getByDisplayValue("10")).toBeInTheDocument();
      expect(screen.getByDisplayValue("20")).toBeInTheDocument();
    });

    test("handles multiple choice type selection", async () => {
      render(<QuestionEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-multiple-choice"));
      expect(screen.getAllByPlaceholderText(/Option \d/)).toHaveLength(2);
    });

    test("handles true/false type selection", async () => {
      render(<QuestionEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-true-false"));
      expect(screen.getByDisplayValue("True")).toBeInTheDocument();
      expect(screen.getByDisplayValue("False")).toBeInTheDocument();
    });

    test("handles open ended type selection", async () => {
      render(<QuestionEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-open-ended"));
      expect(
        screen.getByPlaceholderText("Enter the correct answer")
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    test("validates required title field", async () => {
      render(<QuestionEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByTestId("type-multiple-choice"));
      await user.click(screen.getByText(/Add Question/i));

      expect(
        screen.getByText("Question title is required")
      ).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("validates options for multiple choice questions", async () => {
      render(<QuestionEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByTestId("type-multiple-choice"));
      await user.type(
        screen.getByPlaceholderText("Enter your question"),
        "Test Question"
      );
      await user.click(screen.getByText(/Add Question/i));

      expect(
        screen.getByText("At least two valid options are required")
      ).toBeInTheDocument();
    });

    test("validates correct answer for open-ended questions", async () => {
      render(<QuestionEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByTestId("type-open-ended"));
      await user.type(
        screen.getByPlaceholderText("Enter your question"),
        "Test Question"
      );
      await user.click(screen.getByText(/Add Question/i));

      expect(
        screen.getByText("Correct answer is required for open-ended questions")
      ).toBeInTheDocument();
    });
  });

  describe("Image Upload", () => {
    test("handles successful image upload", async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            media: [{ _id: "123", filename: "test.jpg" }],
          }),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      render(<QuestionEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-multiple-choice"));

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText(/Upload Image/i);

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByAltText("Question")).toBeInTheDocument();
      });
    });

    test("handles image upload failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Upload failed"));

      render(<QuestionEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-multiple-choice"));

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText(/Upload Image/i);

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("Failed to upload image")).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    test("submits multiple choice question correctly", async () => {
      render(<QuestionEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByTestId("type-multiple-choice"));
      await user.type(
        screen.getByPlaceholderText("Enter your question"),
        "Test Question"
      );

      const options = screen.getAllByPlaceholderText(/Option \d/);
      await user.type(options[0], "Option 1");
      await user.type(options[1], "Option 2");

      // Select correct answer
      const radioButtons = screen.getAllByRole("radio");
      await user.click(radioButtons[0]);

      await user.click(screen.getByText(/Add Question/i));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Question",
          type: "multiple_choice",
          options: expect.arrayContaining([
            expect.objectContaining({ text: "Option 1", isCorrect: true }),
            expect.objectContaining({ text: "Option 2", isCorrect: false }),
          ]),
        })
      );
    });
  });
});
