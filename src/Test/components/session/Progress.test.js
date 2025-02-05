// SurveyProgress.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import SurveyProgress from "../../../components/Session/Progress";

describe("SurveyProgress", () => {
  describe("Rendering", () => {
    test("renders with default values when no progress is provided", () => {
      render(<SurveyProgress />);

      expect(screen.getByText("Progress")).toBeInTheDocument();
      expect(screen.getByText("0/0")).toBeInTheDocument();

      const progressBar = screen.getByTestId("progress-indicator");
      expect(progressBar).toHaveStyle({ width: "0%" });
    });

    test("renders with provided progress value", () => {
      render(<SurveyProgress progress="3/10" />);

      expect(screen.getByText("Progress")).toBeInTheDocument();
      expect(screen.getByText("3/10")).toBeInTheDocument();

      const progressBar = screen.getByTestId("progress-indicator");
      expect(progressBar).toHaveStyle({ width: "30%" });
    });

    test("applies custom className when provided", () => {
      const { container } = render(
        <SurveyProgress progress="5/10" className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Progress Calculation", () => {
    test("calculates 0% for 0/10 progress", () => {
      render(<SurveyProgress progress="0/10" />);
      const progressBar = screen.getByTestId("progress-indicator");
      expect(progressBar).toHaveStyle({ width: "0%" });
    });

    test("calculates 50% for 5/10 progress", () => {
      render(<SurveyProgress progress="5/10" />);
      const progressBar = screen.getByTestId("progress-indicator");
      expect(progressBar).toHaveStyle({ width: "50%" });
    });

    test("calculates 100% for 10/10 progress", () => {
      render(<SurveyProgress progress="10/10" />);
      const progressBar = screen.getByTestId("progress-indicator");
      expect(progressBar).toHaveStyle({ width: "100%" });
    });

    test("handles invalid progress format gracefully", () => {
      render(<SurveyProgress progress="invalid" />);
      const progressBar = screen.getByTestId("progress-indicator");
      expect(progressBar).toHaveStyle({ width: "0%" });
      expect(screen.getByText("invalid")).toBeInTheDocument();
    });
  });

  describe("Styling and Structure", () => {
    test("renders progress text with correct styling", () => {
      render(<SurveyProgress progress="5/10" />);

      const progressLabel = screen.getByText("Progress");
      const progressValue = screen.getByText("5/10");

      expect(progressLabel).toHaveClass("text-sm", "text-gray-600");
      expect(progressValue).toHaveClass("text-sm", "text-gray-600");
    });

    test("renders progress bar with correct structure", () => {
      render(<SurveyProgress progress="5/10" />);

      const progressBarContainer = screen.getByTestId("progress-container");
      const progressIndicator = screen.getByTestId("progress-indicator");

      expect(progressBarContainer).toHaveClass(
        "w-full",
        "h-2",
        "bg-gray-200",
        "rounded-full",
        "overflow-hidden"
      );

      expect(progressIndicator).toHaveClass(
        "h-full",
        "bg-blue-600",
        "transition-all",
        "duration-300",
        "ease-in-out"
      );
    });
  });

  describe("Edge Cases", () => {
    test("handles empty string progress", () => {
      render(<SurveyProgress progress="" />);
      expect(screen.getByText("0/0")).toBeInTheDocument();
      const progressBar = screen.getByTestId("progress-indicator");
      expect(progressBar).toHaveStyle({ width: "0%" });
    });

    test("handles null progress", () => {
      render(<SurveyProgress progress={null} />);
      expect(screen.getByText("0/0")).toBeInTheDocument();
      const progressBar = screen.getByTestId("progress-indicator");
      expect(progressBar).toHaveStyle({ width: "0%" });
    });

    test("handles missing progress prop", () => {
      render(<SurveyProgress />);
      expect(screen.getByText("0/0")).toBeInTheDocument();
      const progressBar = screen.getByTestId("progress-indicator");
      expect(progressBar).toHaveStyle({ width: "0%" });
    });

    test("handles zero total progress", () => {
      render(<SurveyProgress progress="0/0" />);
      const progressBar = screen.getByTestId("progress-indicator");
      expect(progressBar).toHaveStyle({ width: "0%" });
    });
  });
});
