import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionTypeModal } from "../../models/QuestionTypeModal";

describe("QuestionTypeModal", () => {
  const mockOnClose = jest.fn();
  const mockOnTypeSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (props = {}) => {
    return render(
      <QuestionTypeModal
        isOpen={true}
        onClose={mockOnClose}
        onTypeSelect={mockOnTypeSelect}
        {...props}
      />
    );
  };

  describe("Initial Render", () => {
    it("renders question type selection screen when isOpen is true", () => {
      renderModal();

      // Check heading
      expect(screen.getByText("Select Question Type")).toBeInTheDocument();

      // Check all question types are present
      expect(screen.getByText("Multiple Choice")).toBeInTheDocument();
      expect(screen.getByText("Multiple Select")).toBeInTheDocument();
      expect(screen.getByText("True/False")).toBeInTheDocument();
      expect(screen.getByText("Open Ended")).toBeInTheDocument();
      expect(screen.getByText("Poll")).toBeInTheDocument();

      // Check descriptions
      expect(
        screen.getByText("One correct answer from multiple options")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Multiple correct answers can be selected")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Simple true or false question")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Free text response question")
      ).toBeInTheDocument();
      expect(screen.getByText("Poll response question")).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      render(
        <QuestionTypeModal
          isOpen={false}
          onClose={mockOnClose}
          onTypeSelect={mockOnTypeSelect}
        />
      );
      expect(
        screen.queryByText("Select Question Type")
      ).not.toBeInTheDocument();
    });

    it("renders close button", () => {
      renderModal();
      const closeButton = screen.getByRole("button", { name: /x/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("calls onClose when clicking the close button", async () => {
      renderModal();
      const closeButton = screen.getByRole("button", { name: /x/i });
      await userEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when clicking the overlay", async () => {
      renderModal();
      const overlay = screen.getByTestId("modal-overlay");
      await userEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onTypeSelect with correct type ID when selecting Multiple Choice", async () => {
      renderModal();
      const multipleChoiceButton = screen.getByRole("button", {
        name: /Multiple Choice/i,
      });
      await userEvent.click(multipleChoiceButton);
      expect(mockOnTypeSelect).toHaveBeenCalledWith("multiple_choice");
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onTypeSelect with correct type ID when selecting Multiple Select", async () => {
      renderModal();
      const multipleSelectButton = screen.getByRole("button", {
        name: /Multiple Select/i,
      });
      await userEvent.click(multipleSelectButton);
      expect(mockOnTypeSelect).toHaveBeenCalledWith("multiple_select");
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onTypeSelect with correct type ID when selecting True/False", async () => {
      renderModal();
      const trueFalseButton = screen.getByRole("button", {
        name: /True\/False/i,
      });
      await userEvent.click(trueFalseButton);
      expect(mockOnTypeSelect).toHaveBeenCalledWith("true_false");
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onTypeSelect with correct type ID when selecting Open Ended", async () => {
      renderModal();
      const openEndedButton = screen.getByRole("button", {
        name: /Open Ended/i,
      });
      await userEvent.click(openEndedButton);
      expect(mockOnTypeSelect).toHaveBeenCalledWith("open_ended");
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onTypeSelect with correct type ID when selecting Poll", async () => {
      renderModal();
      const pollButton = screen.getByRole("button", { name: /Poll/i });
      await userEvent.click(pollButton);
      expect(mockOnTypeSelect).toHaveBeenCalledWith("poll");
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
