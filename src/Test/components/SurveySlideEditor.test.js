import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SurveySlideEditor from "../../components/SurveySlideEditor";

// Mock dependencies
jest.mock("lucide-react", () => ({
  X: () => <div data-testid="icon-x" />,
  Trash2: () => <div data-testid="icon-trash2" />,
  Upload: () => <div data-testid="icon-upload" />,
}));

global.fetch = jest.fn();

describe("SurveySlideEditor", () => {
  const mockOnUpdate = jest.fn();
  const mockOnClose = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders the component with default props", () => {
    render(<SurveySlideEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);

    expect(screen.getByRole('heading', { name: /Add Slide/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter slide title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter slide content/i)).toBeInTheDocument();
    expect(screen.getByText(/Click to upload image/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Slide/i })).toBeInTheDocument();
  });

  test("handles input changes", () => {
    render(<SurveySlideEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);

    const titleInput = screen.getByPlaceholderText(/Enter slide title/i);
    const contentInput = screen.getByPlaceholderText(/Enter slide content/i);

    fireEvent.change(titleInput, { target: { value: "New Slide Title" } });
    fireEvent.change(contentInput, { target: { value: "New Slide Content" } });

    expect(titleInput.value).toBe("New Slide Title");
    expect(contentInput.value).toBe("New Slide Content");
  });

  test("validates form submission", async () => {
    render(<SurveySlideEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('button', { name: /Add Slide/i }));

    expect(screen.getByText(/Please enter a slide title/i)).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/Enter slide title/i);
    fireEvent.change(titleInput, { target: { value: "Valid Title" } });

    fireEvent.click(screen.getByRole('button', { name: /Add Slide/i }));
    expect(screen.getByText(/Please enter slide content/i)).toBeInTheDocument();
  });

  test("submits valid form data", async () => {
    render(<SurveySlideEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);

    const titleInput = screen.getByPlaceholderText(/Enter slide title/i);
    const contentInput = screen.getByPlaceholderText(/Enter slide content/i);

    fireEvent.change(titleInput, { target: { value: "Valid Title" } });
    fireEvent.change(contentInput, { target: { value: "Valid Content" } });

    fireEvent.click(screen.getByRole('button', { name: /Add Slide/i }));

    await waitFor(() => expect(mockOnUpdate).toHaveBeenCalledWith({
      surveyTitle: "Valid Title",
      surveyContent: "Valid Content",
      imageUrl: null,
      position: 0,
    }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  test("handles image upload", async () => {
    const mockFetchResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        media: [{ filename: "uploaded-image.jpg", _id: "12345" }],
      }),
    };
    global.fetch.mockResolvedValue(mockFetchResponse);

    render(<SurveySlideEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />);

    const fileInput = screen.getByLabelText(/Click to upload image/i);
    const file = new File(["dummy content"], "example.jpg", { type: "image/jpeg" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/media/upload`,
        expect.objectContaining({
          method: "POST",
        })
      );
      expect(screen.getByAltText(/Slide/i)).toBeInTheDocument();
    });
  });

  test("handles image removal", async () => {
    render(
      <SurveySlideEditor
        slide={{ surveyTitle: "", surveyContent: "", imageUrl: "test.jpg", position: 0 }}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByAltText(/Slide/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("icon-trash2"));

    expect(screen.queryByAltText(/Slide/i)).not.toBeInTheDocument();
  });
});
