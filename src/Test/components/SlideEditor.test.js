// SlideEditor.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SlideEditor from "../../components/SlideEditor";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock SlideTypeModal with proper test ids
jest.mock("../../models/SlideTypeModal", () => ({
  SlideTypeModal: ({ isOpen, onClose, onTypeSelect }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="slide-type-modal">
        <div className="modal-content">
          <div className="grid grid-cols-1 gap-4">
            <button
              data-testid="type-bullet-points"
              onClick={() => onTypeSelect("bullet_points")}
              className="type-button"
            >
              Bullet Points
            </button>
            <button
              data-testid="type-text"
              onClick={() => onTypeSelect("text")}
              className="type-button"
            >
              Text
            </button>
            <button
              data-testid="type-big-title"
              onClick={() => onTypeSelect("big_title")}
              className="type-button"
            >
              Big Title
            </button>
          </div>
        </div>
      </div>
    );
  },
}));

const mockOnSubmit = jest.fn();
const mockOnClose = jest.fn();

describe("SlideEditor", () => {
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
    test("renders type modal when no initial slide is provided", () => {
      render(<SlideEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      expect(screen.getByTestId("slide-type-modal")).toBeInTheDocument();
    });

    test("does not render type modal when initial slide is provided", () => {
      const initialSlide = {
        title: "Test Slide",
        type: "bullet_points",
        content: "Point 1\nPoint 2",
        position: 1,
      };

      render(
        <SlideEditor
          initialSlide={initialSlide}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByTestId("slide-type-modal")).not.toBeInTheDocument();
    });

    test("handles bullet points type selection", async () => {
      render(<SlideEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-bullet-points"));
      expect(screen.getByText("Add Point")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Point 1")).toBeInTheDocument();
    });

    test("handles text type selection", async () => {
      render(<SlideEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-text"));
      expect(
        screen.getByPlaceholderText("Enter slide content")
      ).toBeInTheDocument();
    });

    test("handles big title type selection", async () => {
      render(<SlideEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-big-title"));
      expect(
        screen.getByPlaceholderText("Enter title text")
      ).toBeInTheDocument();
    });
  });

  describe("Bullet Points Management", () => {
    beforeEach(async () => {
      render(<SlideEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-bullet-points"));
    });

    test("allows adding up to 6 bullet points", async () => {
      const addPointButton = screen.getByText("Add Point");

      // Add points until limit
      for (let i = 0; i < 5; i++) {
        await user.click(addPointButton);
      }

      const points = screen.getAllByPlaceholderText(/Point \d/);
      expect(points).toHaveLength(6);

      // Try to add one more
      await user.click(addPointButton);
      expect(screen.getAllByPlaceholderText(/Point \d/)).toHaveLength(6);
    });

    test("allows removing points but maintains minimum of one", async () => {
      // Add an extra point first
      await user.click(screen.getByText("Add Point"));

      const removeButtons = screen.getAllByRole("button", {
        name: /Remove point/i,
      });
      await user.click(removeButtons[0]);

      const remainingPoints = screen.getAllByPlaceholderText(/Point \d/);
      expect(remainingPoints).toHaveLength(1);
    });
  });

  describe("Form Validation", () => {
    test("shows error when submitting without title", async () => {
      render(<SlideEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-bullet-points"));
      await user.click(screen.getByText(/Add Slide/i));

      expect(screen.getByText("Slide title is required")).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("validates bullet points content", async () => {
      render(<SlideEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-bullet-points"));

      await user.type(
        screen.getByPlaceholderText("Enter slide title"),
        "Test Slide"
      );
      await user.click(screen.getByText(/Add Slide/i));

      expect(
        screen.getByText("At least one bullet point is required")
      ).toBeInTheDocument();
    });
  });

  describe("Image Upload", () => {
    beforeEach(async () => {
      render(<SlideEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-text"));
    });

    test("handles successful image upload", async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            media: [{ _id: "123", filename: "test.jpg" }],
          }),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText(/Upload Image/i);

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByAltText("Slide")).toBeInTheDocument();
      });
    });

    test("allows image removal", async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            media: [{ _id: "123", filename: "test.jpg" }],
          }),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText(/Upload Image/i);
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("Remove")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Remove"));

      expect(screen.queryByAltText("Slide")).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    test("submits bullet points correctly", async () => {
      render(<SlideEditor onSubmit={mockOnSubmit} onClose={mockOnClose} />);
      await user.click(screen.getByTestId("type-bullet-points"));

      await user.type(
        screen.getByPlaceholderText("Enter slide title"),
        "Test Title"
      );
      await user.type(screen.getByPlaceholderText("Point 1"), "First Point");
      await user.click(screen.getByText("Add Point"));
      await user.type(
        screen.getAllByPlaceholderText(/Point \d/)[1],
        "Second Point"
      );

      await user.click(screen.getByText(/Add Slide/i));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Title",
          type: "bullet_points",
          content: "First Point\nSecond Point",
        })
      );
    });
  });
});
