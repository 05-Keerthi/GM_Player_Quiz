import  React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SlideEditor from "../../components/SlideEditor";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock environment variables
const mockEnv = {
  REACT_APP_API_URL: "http://localhost:3000",
};

process.env = { ...process.env, ...mockEnv };

describe("SlideEditor", () => {
  // Common test data and mocks
  const mockSlide = {
    id: "slide-123",
    title: "Test Slide",
    type: "bullet_points",
    content: "Point 1\nPoint 2\nPoint 3",
    imageUrl: "/uploads/test-image.jpg",
  };

  const mockClassicSlide = {
    id: "slide-456",
    title: "Classic Slide",
    type: "classic",
    content: "This is a classic slide content",
    imageUrl: null,
  };

  const mockBigTitleSlide = {
    id: "slide-789",
    title: "Big Title Slide",
    type: "big_title",
    content: "This is a big title slide",
    imageUrl: null,
  };

  const mockOnUpdate = jest.fn();
  const mockOnClose = jest.fn();
  
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("token", "mock-token");
    global.fetch = jest.fn();
    global.URL.createObjectURL = jest.fn(() => "mock-object-url");
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Test suites
  describe("Initialization", () => {
    test("renders with bullet points slide data", () => {
      render(
        <SlideEditor
          slide={mockSlide}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByDisplayValue("Test Slide")).toBeInTheDocument();
      expect(screen.getByText("Edit Slide")).toBeInTheDocument();
      
      const points = screen.getAllByRole("textbox").slice(1);
      expect(points).toHaveLength(3);
      expect(points[0]).toHaveValue("Point 1");
      expect(points[1]).toHaveValue("Point 2");
      expect(points[2]).toHaveValue("Point 3");
    });

    test("renders with classic slide data", () => {
      render(
        <SlideEditor
          slide={mockClassicSlide}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByDisplayValue("Classic Slide")).toBeInTheDocument();
      const contentArea = screen.getByRole("textbox", { name: /content/i });
      expect(contentArea).toHaveValue("This is a classic slide content");
    });

    test("returns null when no slide prop is provided", () => {
      const { container } = render(
        <SlideEditor onUpdate={mockOnUpdate} onClose={mockOnClose} />
      );
      expect(container).toBeEmptyDOMElement();
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
        <SlideEditor
          slide={mockSlide}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const file = new File(["test"], "test-image.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText(/upload image/i);

      await act(async () => {
        await userEvent.upload(input, file);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/media/upload",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
        })
      );

      const img = await screen.findByAltText("Slide");
      expect(img).toBeInTheDocument();
    });

    test("handles image upload errors", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Upload failed"));

      render(
        <SlideEditor
          slide={mockSlide}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const file = new File(["test"], "test-image.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText(/upload image/i);

      await act(async () => {
        await userEvent.upload(input, file);
      });

      expect(await screen.findByText("Failed to upload image")).toBeInTheDocument();
    });

    test("allows removing uploaded image", async () => {
      render(
        <SlideEditor
          slide={{ ...mockSlide, imageUrl: "/uploads/test-image.jpg" }}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const removeButton = screen.getByText("Remove");
      await userEvent.click(removeButton);

      expect(screen.queryByAltText("Slide")).not.toBeInTheDocument();
    });
  });

  describe("Bullet Points Handling", () => {
    test("allows adding new bullet points", async () => {
      render(
        <SlideEditor
          slide={mockSlide}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const addButton = screen.getByText("Add Bullet Point");
      await userEvent.click(addButton);

      const points = screen.getAllByRole("textbox").slice(1);
      expect(points).toHaveLength(4);
    });

    test("allows removing bullet points", async () => {
      render(
        <SlideEditor
          slide={mockSlide}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const removeButtons = screen.getAllByRole("button").filter(
        button => button.querySelector('svg[data-icon="trash-2"]')
      );
      await userEvent.click(removeButtons[0]);

      const points = screen.getAllByRole("textbox").slice(1);
      expect(points).toHaveLength(2);
    });

    test("updates bullet point content", async () => {
      render(
        <SlideEditor
          slide={mockSlide}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const points = screen.getAllByRole("textbox").slice(1);
      await userEvent.type(points[0], " updated");

      expect(points[0]).toHaveValue("Point 1 updated");
    });
  });

  describe("Save and Cancel Operations", () => {
    test("saves slide with correct data", async () => {
      render(
        <SlideEditor
          slide={mockSlide}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const titleInput = screen.getByDisplayValue("Test Slide");
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "Updated Title");

      const saveButton = screen.getByText("Save");
      await userEvent.click(saveButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Updated Title",
          type: "bullet_points",
          content: "Point 1\nPoint 2\nPoint 3",
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });

    test("handles save errors", async () => {
      mockOnUpdate.mockRejectedValueOnce(new Error("Save failed"));

      render(
        <SlideEditor
          slide={mockSlide}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />
      );

      const saveButton = screen.getByText("Save");
      await userEvent.click(saveButton);

      expect(await screen.findByText("Save failed")).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test("closes without saving when cancel is clicked", async () => {
      render(
        <SlideEditor
          slide={mockSlide}
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