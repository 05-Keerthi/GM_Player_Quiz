import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SlideTypeModal } from "../../models/SlideTypeModal";

describe("SlideTypeModal", () => {
  const mockOnClose = jest.fn();
  const mockOnTypeSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (props = {}) => {
    return render(
      <SlideTypeModal
        isOpen={true}
        onClose={mockOnClose}
        onTypeSelect={mockOnTypeSelect}
        {...props}
      />
    );
  };

  describe("Initial Render", () => {
    it("renders slide type selection screen when isOpen is true", () => {
      renderModal();

      // Check heading
      expect(screen.getByText("Select Slide Type")).toBeInTheDocument();

      // Check all slide types are present
      expect(screen.getByText("Classic")).toBeInTheDocument();
      expect(screen.getByText("Big Title")).toBeInTheDocument();
      expect(screen.getByText("Bullet Points")).toBeInTheDocument();

      // Check descriptions
      expect(
        screen.getByText("Give players more context or additional explanation")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Display large text with emphasis")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Present information in a structured list")
      ).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      render(
        <SlideTypeModal
          isOpen={false}
          onClose={mockOnClose}
          onTypeSelect={mockOnTypeSelect}
        />
      );
      expect(screen.queryByText("Select Slide Type")).not.toBeInTheDocument();
    });

    it("renders close button", () => {
      renderModal();
      const closeButton = screen.getByTestId("close-modal-button");
      expect(closeButton).toBeInTheDocument();
    });

    it("renders all slide type icons", () => {
      renderModal();
      // Check that all icons are rendered (they should have the correct CSS class)
      const icons = screen.getAllByTestId("slide-type-icon");
      expect(icons).toHaveLength(3);
      icons.forEach((icon) => {
        expect(icon).toHaveClass("w-5 h-5 text-blue-600");
      });
    });
  });

  describe("Interactions", () => {
    it("calls onClose when clicking the close button", async () => {
      renderModal();
      const closeButton = screen.getByTestId("close-modal-button");
      await userEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when clicking the overlay", async () => {
      renderModal();
      const overlay = screen.getByTestId("modal-overlay");
      await userEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onTypeSelect with correct type ID when selecting Classic", async () => {
      renderModal();
      const classicButton = screen.getByRole("button", { name: /Classic/i });
      await userEvent.click(classicButton);
      expect(mockOnTypeSelect).toHaveBeenCalledWith("classic");
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onTypeSelect with correct type ID when selecting Big Title", async () => {
      renderModal();
      const bigTitleButton = screen.getByRole("button", { name: /Big Title/i });
      await userEvent.click(bigTitleButton);
      expect(mockOnTypeSelect).toHaveBeenCalledWith("big_title");
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onTypeSelect with correct type ID when selecting Bullet Points", async () => {
      renderModal();
      const bulletPointsButton = screen.getByRole("button", {
        name: /Bullet Points/i,
      });
      await userEvent.click(bulletPointsButton);
      expect(mockOnTypeSelect).toHaveBeenCalledWith("bullet_points");
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("applies hover styles when hovering over slide type buttons", async () => {
      renderModal();
      const buttons = screen
        .getAllByRole("button")
        .filter((button) => button.className.includes("border rounded-lg"));

      for (const button of buttons) {
        await userEvent.hover(button);
        expect(button).toHaveClass("hover:border-blue-300");
        expect(button).toHaveClass("hover:bg-blue-50");
      }
    });
  });
});
