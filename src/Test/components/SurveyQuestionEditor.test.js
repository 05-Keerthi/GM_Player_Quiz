import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SurveyQuestionEditor from "../../components/SurveyQuestionEditor";
import { TemplateContext } from "../../context/TemplateContext";

// Mock the environment variables
process.env.REACT_APP_API_URL = "http://test-api.com";

// Mock the Lucide icons
jest.mock("lucide-react", () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert</div>,
  Loader: () => <div data-testid="loader-icon">Loader</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
}));

// Mock the framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock the ColorPicker component
jest.mock("../../components/ColorPicker", () => ({
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

// Mock TemplateModal component
jest.mock("../../models/TemplateModal", () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onTemplateSelect }) =>
    isOpen ? (
      <div data-testid="template-modal">
        <button onClick={onClose}>Close Modal</button>
        <button
          onClick={() =>
            onTemplateSelect({
              _id: "3",
              options: [{ optionText: "New Option", color: "#0000FF" }],
            })
          }
        >
          Select Template
        </button>
      </div>
    ) : null,
}));

describe("SurveyQuestionEditor", () => {
  const mockTemplates = [
    {
      _id: "1",
      name: "Template 1",
      options: [{ optionText: "Option A", color: "#FF0000" }],
    },
    {
      _id: "2",
      name: "Template 2",
      options: [{ optionText: "Option B", color: "#00FF00" }],
    },
  ];

  const mockTemplateContext = {
    templates: mockTemplates,
    loading: false,
    getAllTemplates: jest.fn(),
  };

  const TestWrapper = ({ children, contextValue = mockTemplateContext }) => (
    <TemplateContext.Provider value={contextValue}>
      {children}
    </TemplateContext.Provider>
  );

  const mockQuestion = {
    title: "Test Question",
    description: "Test Description",
    dimension: "Test Dimension",
    year: "2024",
    imageUrl: "test-image.jpg",
    timer: 45,
    answerOptions: [
      { optionText: "Option 1", color: "#FF0000" },
      { optionText: "Option 2", color: "#00FF00" },
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
    localStorage.setItem("token", "test-token");
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const renderWithContext = (
    ui,
    { contextValue = mockTemplateContext, ...renderOptions } = {}
  ) => {
    return render(
      <TestWrapper contextValue={contextValue}>{ui}</TestWrapper>,
      renderOptions
    );
  };

  it("renders correctly with initial empty state", () => {
    renderWithContext(
      <SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />
    );

    expect(screen.getByText("Add New Question")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your question title")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter question description")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Option 1")).toBeInTheDocument();
  });

  it("renders correctly with existing question data", () => {
    renderWithContext(
      <SurveyQuestionEditor
        question={mockQuestion}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Edit Question")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Question")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Option 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Option 2")).toBeInTheDocument();
  });

  it("validates required fields before submission", async () => {
    renderWithContext(
      <SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />
    );

    fireEvent.click(screen.getByText("Add Question"));

    expect(
      await screen.findByText("Question title is required")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Question description is required")
    ).toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it("handles adding and removing answer options", async () => {
    renderWithContext(
      <SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />
    );

    fireEvent.click(screen.getByText("Add Option"));
    expect(screen.getAllByTestId("color-picker")).toHaveLength(2);

    const trashIcons = screen.getAllByTestId("trash-icon");
    fireEvent.click(trashIcons[0]);

    fireEvent.click(trashIcons[0]);
    expect(screen.getAllByTestId("color-picker")).toHaveLength(1);
  });

  it("handles image upload successfully", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          media: [{ _id: "test-id", filename: "test-image.jpg" }],
        }),
    };

    global.fetch = jest.fn().mockResolvedValueOnce(mockResponse);

    renderWithContext(
      <SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />
    );

    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByLabelText(/Click to upload image/i);

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/media/upload`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
          body: expect.any(FormData),
        })
      );
    });

    expect(screen.getByAltText("Question")).toBeInTheDocument();
  });

  it("handles image upload failure", async () => {
    const mockResponse = {
      ok: false,
      status: 400,
    };

    global.fetch = jest.fn().mockResolvedValueOnce(mockResponse);

    renderWithContext(
      <SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />
    );

    const file = new File(["test"], "test.png", { type: "image/png" });
    const input = screen.getByLabelText(/Click to upload image/i);

    await userEvent.upload(input, file);

    expect(
      await screen.findByText("Failed to upload image")
    ).toBeInTheDocument();
  });

  it("submits form with valid data", async () => {
    renderWithContext(
      <SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />
    );

    fireEvent.change(screen.getByPlaceholderText("Enter your question title"), {
      target: { value: "New Question" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Enter question description"),
      {
        target: { value: "New Description" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("Option 1"), {
      target: { value: "New Option 1" },
    });

    fireEvent.click(screen.getByText("Add Option"));
    const options = screen.getAllByPlaceholderText(/Option \d/);
    fireEvent.change(options[1], {
      target: { value: "New Option 2" },
    });

    fireEvent.click(screen.getByText("Add Question"));

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "New Question",
          description: "New Description",
          answerOptions: expect.arrayContaining([
            expect.objectContaining({ optionText: "New Option 1" }),
            expect.objectContaining({ optionText: "New Option 2" }),
          ]),
        })
      );
    });
  });

  it("handles timer value changes", () => {
    renderWithContext(
      <SurveyQuestionEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />
    );

    const timerInput = screen.getByLabelText(/Timer \(seconds\)/i);
    fireEvent.change(timerInput, { target: { value: "30" } });

    expect(timerInput.value).toBe("30");
  });

  it("renders template selector for ArtPulse survey type", () => {
    renderWithContext(
      <SurveyQuestionEditor
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
        surveyType="ArtPulse"
      />
    );

    expect(screen.getByText("Select Template")).toBeInTheDocument();
    expect(screen.getByText("Manage Templates")).toBeInTheDocument();
    expect(mockTemplateContext.getAllTemplates).toHaveBeenCalled();
  });

  it("handles template selection from dropdown", async () => {
    renderWithContext(
      <SurveyQuestionEditor
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
        surveyType="ArtPulse"
      />
    );

    // Find select element using Testing Library queries
    const selectElement = screen.getByRole("combobox", {
      name: /select template/i,
    });

    // Change the selection
    userEvent.selectOptions(selectElement, "1");

    // Verify the changes
    await waitFor(() => {
      const optionInputs = screen.getAllByPlaceholderText(/Option \d/i);
      expect(optionInputs[0]).toHaveValue("Option A");
    });
  });

  it("handles template selection from modal", async () => {
    renderWithContext(
      <SurveyQuestionEditor
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
        surveyType="ArtPulse"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /manage templates/i }));

    const modal = screen.getByTestId("template-modal");
    expect(modal).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /select template/i, within: modal })
    );

    await waitFor(() => {
      const options = screen.getAllByPlaceholderText(/Option \d/);
      expect(options[0]).toHaveValue("New Option");
    });
  });

  it("shows loading state when templates are loading", () => {
    // Create a specific context for this test with loading true
    const loadingContext = {
      templates: mockTemplates,
      loading: true,
      getAllTemplates: jest.fn(),
    };

    render(
      <TestWrapper contextValue={loadingContext}>
        <SurveyQuestionEditor
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
          surveyType="ArtPulse"
        />
      </TestWrapper>
    );

    // Test for loading indicators
    expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    expect(screen.getByText("Loading templates...")).toBeInTheDocument();
  });
});
