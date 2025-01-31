// SurveyPreviewPage.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SurveyPreviewPage from "../../pages/SurveyPreview";
import axios from "axios";
import { useParams } from "react-router-dom";

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: () => jest.fn(),
}));

// Mock survey context
jest.mock("../../context/surveyContext", () => ({
  useSurveyContext: () => ({
    publishSurvey: jest.fn().mockResolvedValue(true),
  }),
}));

const mockSurveyData = {
  slides: [
    {
      _id: "slide1",
      surveyTitle: "Welcome",
      surveyContent: "Welcome to the survey",
      imageUrl: "https://example.com/image1.jpg",
    },
  ],
  questions: [
    {
      _id: "question1",
      title: "First Question",
      description: "What is your favorite color?",
      answerOptions: [
        { optionText: "Blue", color: "#0000FF" },
        { optionText: "Red", color: "#FF0000" },
      ],
    },
  ],
  order: [
    { id: "slide1", type: "slide" },
    { id: "question1", type: "question" },
  ],
};

describe("SurveyPreviewPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    localStorage.setItem("token", "mock-token");
    useParams.mockReturnValue({ surveyId: "mock-survey-id" });
    axios.get.mockResolvedValue({ data: mockSurveyData });
    window.history.back = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("Initial Loading", () => {
    test("displays loading state initially", () => {
      render(<SurveyPreviewPage />);
      expect(screen.getByTestId("loading-state")).toBeInTheDocument();
    });

    test("fetches and displays survey data correctly", async () => {
      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      expect(screen.getByTestId("content-title")).toHaveTextContent("Welcome");
      expect(screen.getByTestId("slide-description")).toHaveTextContent(
        "Welcome to the survey"
      );
    });

    test("handles API error gracefully", async () => {
      axios.get.mockRejectedValueOnce(new Error("Failed to fetch"));
      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });
    });
  });

  describe("Navigation and Layout", () => {
    test("renders sidebar with correct slides and questions", async () => {
      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-item-0")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-item-1")).toBeInTheDocument();
    });

    test("allows navigation between slides and questions", async () => {
      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      await user.click(screen.getByTestId("sidebar-item-1"));
      expect(
        screen.getByTestId("preview-question-container-1")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("preview-question-content-1")
      ).toBeInTheDocument();
      expect(screen.getByTestId("question-description")).toHaveTextContent(
        "What is your favorite color?"
      );
    });
  });

  describe("Presentation Mode", () => {
    test("enters and exits presentation mode", async () => {
      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      await user.click(screen.getByTestId("start-presentation"));
      expect(screen.getByTestId("presentation-mode")).toBeInTheDocument();
      expect(
        screen.getByTestId("presentation-slide-container-0")
      ).toBeInTheDocument();

      await user.click(screen.getByTestId("exit-presentation"));
      expect(screen.queryByTestId("presentation-mode")).not.toBeInTheDocument();
    });

    test("displays correct slide progress", async () => {
      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      await user.click(screen.getByTestId("start-presentation"));
      expect(screen.getByTestId("slide-progress")).toHaveTextContent("1 / 2");
    });

    test("handles keyboard navigation", async () => {
      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      // Enter presentation mode
      await user.click(screen.getByTestId("start-presentation"));
      expect(screen.getByTestId("presentation-mode")).toBeInTheDocument();
      expect(
        screen.getByTestId("presentation-slide-container-0")
      ).toBeInTheDocument();

      // Navigate to the question slide
      await user.keyboard("{ArrowRight}");
      expect(
        screen.getByTestId("presentation-question-container-1")
      ).toBeInTheDocument();

      // Navigate back to the initial slide
      await user.keyboard("{ArrowLeft}");
      expect(
        screen.getByTestId("presentation-slide-container-0")
      ).toBeInTheDocument();

      // Exit presentation mode
      await user.keyboard("{Escape}");
      expect(screen.queryByTestId("presentation-mode")).not.toBeInTheDocument();
    });
  });

  describe("Content Rendering", () => {
    test("renders slide content correctly", async () => {
      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      expect(
        screen.getByTestId("preview-slide-container-0")
      ).toBeInTheDocument();
      expect(screen.getByTestId("content-title")).toHaveTextContent("Welcome");
      expect(screen.getByTestId("slide-description")).toHaveTextContent(
        "Welcome to the survey"
      );
      expect(screen.getByTestId("content-image")).toHaveAttribute(
        "src",
        "https://example.com/image1.jpg"
      );
    });

    test("renders question content correctly", async () => {
      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      await user.click(screen.getByTestId("sidebar-item-1"));
      expect(
        screen.getByTestId("preview-question-container-1")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("preview-question-content-1")
      ).toBeInTheDocument();
      expect(screen.getByTestId("question-description")).toHaveTextContent(
        "What is your favorite color?"
      );
      expect(screen.getByTestId("answer-options")).toBeInTheDocument();
      expect(screen.getByTestId("answer-option-0")).toHaveTextContent("Blue");
      expect(screen.getByTestId("answer-option-1")).toHaveTextContent("Red");
    });

    test("handles missing images gracefully", async () => {
      const noImageData = {
        ...mockSurveyData,
        slides: [{ ...mockSurveyData.slides[0], imageUrl: null }],
      };
      axios.get.mockResolvedValueOnce({ data: noImageData });

      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      expect(screen.queryByTestId("content-image")).not.toBeInTheDocument();
    });
  });

  describe("Color Handling", () => {
    test("applies correct text colors based on background", async () => {
      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      await user.click(screen.getByTestId("sidebar-item-1"));

      const blueOption = screen.getByTestId("answer-option-0");
      const redOption = screen.getByTestId("answer-option-1");

      expect(blueOption).toHaveStyle({ backgroundColor: "#0000FF" });
      expect(redOption).toHaveStyle({ backgroundColor: "#FF0000" });

      expect(screen.getByTestId("answer-text-0")).toHaveClass("text-white");
      expect(screen.getByTestId("answer-text-1")).toHaveClass("text-white");
    });
  });

  describe("Accessibility", () => {
    test("has accessible buttons with proper labels", async () => {
      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: /start presentation/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /close preview/i })
      ).toBeInTheDocument();
    });

    test("disables presentation button when loading or no slides", () => {
      render(<SurveyPreviewPage />);
      const startButton = screen.getByTestId("start-presentation");
      expect(startButton).toBeDisabled();
    });

    test("maintains focus management in presentation mode", async () => {
      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      await user.click(screen.getByTestId("start-presentation"));
      expect(screen.getByTestId("exit-presentation")).toHaveFocus();
    });
  });

  describe("Error Handling", () => {
    test("handles missing survey data gracefully", async () => {
      axios.get.mockResolvedValueOnce({ data: {} });

      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      expect(screen.queryByTestId("sidebar-item-0")).not.toBeInTheDocument();
    });

    test("handles malformed survey data", async () => {
      const malformedData = {
        ...mockSurveyData,
        order: null,
      };

      axios.get.mockResolvedValueOnce({ data: malformedData });

      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      expect(
        screen.getByTestId("preview-slide-container-0")
      ).toBeInTheDocument();
    });

    test("handles network errors appropriately", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error("Network Error"));

      render(<SurveyPreviewPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});
