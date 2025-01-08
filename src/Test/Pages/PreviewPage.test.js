// src/Test/Pages/PreviewPage.test.js
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PreviewPage from "../../pages/Preview";
import axios from "axios";
import { useParams } from "react-router-dom";

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Play: () => <div data-testid="play-icon">Play</div>,
  ChevronLeft: () => <div data-testid="chevron-left">Left</div>,
  ChevronRight: () => <div data-testid="chevron-right">Right</div>,
}));

const mockQuizData = {
  slides: [
    {
      _id: "slide1",
      title: "Introduction",
      content: "Welcome to the quiz",
      imageUrl: "https://example.com/image1.jpg",
    },
  ],
  questions: [
    {
      _id: "question1",
      title: "First Question",
      content: "What is 2+2?",
      options: [
        { text: "4", isCorrect: true, color: "#ffffff" },
        { text: "3", isCorrect: false, color: "#ffffff" },
      ],
    },
  ],
  order: [
    { id: "slide1", type: "slide" },
    { id: "question1", type: "question" },
  ],
};

describe("PreviewPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    localStorage.setItem("token", "mock-token");
    useParams.mockReturnValue({ quizId: "mock-quiz-id" });
    axios.get.mockResolvedValue({ data: mockQuizData });
    window.history.back = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderAndWaitForLoad = async () => {
    const rendered = render(<PreviewPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
    });
    return rendered;
  };

  describe("Initial Loading", () => {
    test("displays loading state initially", () => {
      render(<PreviewPage />);
      expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
    });

    test("fetches and displays quiz data correctly", async () => {
      await renderAndWaitForLoad();
      
      expect(screen.getByTestId("slide-title")).toHaveTextContent("Introduction");
      expect(screen.getByTestId("slide-content")).toHaveTextContent("Welcome to the quiz");
    });

    test("handles API error gracefully", async () => {
      axios.get.mockRejectedValueOnce(new Error("Failed to fetch"));
      render(<PreviewPage />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
      });
    });

    test("handles missing token", () => {
      localStorage.clear();
      render(<PreviewPage />);
      expect(window.history.back).toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    test("navigates back when close button is clicked", async () => {
      await renderAndWaitForLoad();
      await user.click(screen.getByRole("button", { name: /close preview/i }));
      expect(window.history.back).toHaveBeenCalled();
    });

    test("starts presentation mode", async () => {
      await renderAndWaitForLoad();
      await user.click(screen.getByTestId("start-presentation"));
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });
  });

  describe("Presentation Mode Navigation", () => {
    const renderAndStartPresentation = async () => {
      await renderAndWaitForLoad();
      await user.click(screen.getByTestId("start-presentation"));
    };

    test("navigates through slides using buttons", async () => {
      await renderAndStartPresentation();

      const presentationContent = screen.getByRole('dialog', { name: /presentation/i });
      expect(within(presentationContent).getByTestId("slide-title")).toHaveTextContent("Introduction");

      await user.click(screen.getByTestId("next-slide"));
      expect(within(presentationContent).getByTestId("question-title")).toHaveTextContent("First Question");

      await user.click(screen.getByTestId("prev-slide"));
      expect(within(presentationContent).getByTestId("slide-title")).toHaveTextContent("Introduction");
    });

    test("handles keyboard navigation", async () => {
      await renderAndStartPresentation();

      const presentationContent = screen.getByRole('dialog', { name: /presentation/i });

      await user.keyboard("{ArrowRight}");
      expect(within(presentationContent).getByTestId("question-title")).toHaveTextContent("First Question");

      await user.keyboard("{ArrowLeft}");
      expect(within(presentationContent).getByTestId("slide-title")).toHaveTextContent("Introduction");

      await user.keyboard("{Escape}");
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test("prevents navigation beyond bounds", async () => {
      await renderAndStartPresentation();
      const presentationContent = screen.getByRole('dialog', { name: /presentation/i });

      await user.keyboard("{ArrowLeft}");
      expect(within(presentationContent).getByTestId("slide-title")).toHaveTextContent("Introduction");

      await user.keyboard("{ArrowRight}");
      await user.keyboard("{ArrowRight}");
      expect(within(presentationContent).getByTestId("question-title")).toHaveTextContent("First Question");
    });

    test("exits presentation mode", async () => {
      await renderAndStartPresentation();
      await user.click(screen.getByTestId("exit-presentation"));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe("Quiz Content", () => {
    test("renders question options correctly in presentation mode", async () => {
      await renderAndWaitForLoad();
      await user.click(screen.getByTestId("start-presentation"));
      await user.click(screen.getByTestId("next-slide"));

      const presentationContent = screen.getByRole('dialog', { name: /presentation/i });
      const optionText = within(presentationContent).getByTestId("option-text-0");
      
      expect(optionText).toHaveTextContent("4");
      expect(within(presentationContent).getByTestId("correct-answer-label")).toBeInTheDocument();
    });

    test("renders question options correctly in preview mode", async () => {
      await renderAndWaitForLoad();
      await user.click(screen.getByTestId("sidebar-item-1"));

      const mainContent = screen.getByTestId("preview-content");
      const optionText = within(mainContent).getByTestId("option-text-0");
      
      expect(optionText).toHaveTextContent("4");
      expect(within(mainContent).getByTestId("correct-answer-label")).toBeInTheDocument();
    });

    test("displays images properly", async () => {
      await renderAndWaitForLoad();

      const mainContent = screen.getByTestId("preview-content");
      const image = within(mainContent).getByTestId("slide-image");
      
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "https://example.com/image1.jpg");
    });

    test("handles missing images gracefully", async () => {
      const noImageData = {
        ...mockQuizData,
        slides: [{ ...mockQuizData.slides[0], imageUrl: null }],
      };
      axios.get.mockResolvedValueOnce({ data: noImageData });

      await renderAndWaitForLoad();

      const mainContent = screen.getByTestId("preview-content");
      expect(within(mainContent).queryByTestId("slide-image")).not.toBeInTheDocument();
    });
  });

  describe("Sidebar Navigation", () => {
    test("allows direct navigation to slides", async () => {
      await renderAndWaitForLoad();
      await user.click(screen.getByTestId("sidebar-item-1"));
      
      const mainContent = screen.getByTestId("preview-content");
      expect(within(mainContent).getByTestId("question-title")).toHaveTextContent("First Question");
    });

    test("highlights active slide in sidebar", async () => {
      await renderAndWaitForLoad();

      const firstItem = screen.getByTestId("sidebar-item-0");
      const secondItem = screen.getByTestId("sidebar-item-1");

      expect(firstItem).toHaveClass("bg-blue-50");
      expect(secondItem).not.toHaveClass("bg-blue-50");

      await user.click(secondItem);
      expect(firstItem).not.toHaveClass("bg-blue-50");
      expect(secondItem).toHaveClass("bg-blue-50");
    });

    test("handles empty sidebar gracefully", async () => {
      axios.get.mockResolvedValueOnce({
        data: { ...mockQuizData, order: [] },
      });

      await renderAndWaitForLoad();
      expect(screen.queryByTestId("sidebar-item-0")).not.toBeInTheDocument();
    });
  });
});