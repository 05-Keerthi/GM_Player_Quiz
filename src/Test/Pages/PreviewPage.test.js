// src/Test/Pages/PreviewPage.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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

  describe("Initial Loading", () => {
    test("displays loading state initially", () => {
      render(<PreviewPage />);
      expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
    });

    test("fetches and displays quiz data correctly", async () => {
      render(<PreviewPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
      });

      expect(screen.getByText("Introduction")).toBeInTheDocument();
      expect(screen.getByText("Welcome to the quiz")).toBeInTheDocument();
    });

    test("handles API error gracefully", async () => {
      axios.get.mockRejectedValue(new Error("Failed to fetch"));
      render(<PreviewPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test("handles missing token", async () => {
      localStorage.clear();
      render(<PreviewPage />);
      expect(window.history.back).toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    test("navigates back when close button is clicked", async () => {
      render(<PreviewPage />);
      await user.click(screen.getByTestId("x-icon"));
      expect(window.history.back).toHaveBeenCalled();
    });

    test("starts presentation mode", async () => {
      render(<PreviewPage />);

      await waitFor(() => {
        expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
      });

      await user.click(screen.getByText(/start presentation/i));
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    test("doesn't start presentation if data not loaded", async () => {
      render(<PreviewPage />);
      const startButton = screen.getByText(/start presentation/i);
      await user.click(startButton);
      expect(screen.queryByText("1 / 2")).not.toBeInTheDocument();
    });
  });

  describe("Presentation Mode Navigation", () => {
    beforeEach(async () => {
      render(<PreviewPage />);
      await waitFor(() => {
        expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
      });
      await user.click(screen.getByText(/start presentation/i));
    });

    test("navigates through slides using buttons", async () => {
      expect(screen.getByText("Introduction")).toBeInTheDocument();

      await user.click(screen.getByTestId("chevron-right"));
      expect(screen.getByText("First Question")).toBeInTheDocument();

      await user.click(screen.getByTestId("chevron-left"));
      expect(screen.getByText("Introduction")).toBeInTheDocument();
    });

    test("handles keyboard navigation", async () => {
      await user.keyboard("{ArrowRight}");
      expect(screen.getByText("First Question")).toBeInTheDocument();

      await user.keyboard("{ArrowLeft}");
      expect(screen.getByText("Introduction")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(screen.queryByText("1 / 2")).not.toBeInTheDocument();
    });

    test("prevents navigation beyond bounds", async () => {
      // Try to go left from first slide
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByText("Introduction")).toBeInTheDocument();

      // Go to last slide
      await user.keyboard("{ArrowRight}");
      // Try to go right from last slide
      await user.keyboard("{ArrowRight}");
      expect(screen.getByText("First Question")).toBeInTheDocument();
    });
  });

  describe("Quiz Content", () => {
    test("renders question options correctly", async () => {
      render(<PreviewPage />);
      await waitFor(() => {
        expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
      });

      await user.click(screen.getByText(/start presentation/i));
      await user.click(screen.getByTestId("chevron-right"));

      const correctOption = screen.getByText("4");
      expect(correctOption).toBeInTheDocument();
      expect(screen.getByText("(Correct Answer)")).toBeInTheDocument();
    });

    test("displays images properly", async () => {
      render(<PreviewPage />);
      await waitFor(() => {
        expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
      });

      const image = screen.getByAltText("Introduction");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "https://example.com/image1.jpg");
    });

    test("handles missing images gracefully", async () => {
      const noImageData = {
        ...mockQuizData,
        slides: [{ ...mockQuizData.slides[0], imageUrl: null }],
      };
      axios.get.mockResolvedValueOnce({ data: noImageData });

      render(<PreviewPage />);
      await waitFor(() => {
        expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
      });

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });

  describe("Sidebar Navigation", () => {
    test("allows direct navigation to slides", async () => {
      render(<PreviewPage />);
      await waitFor(() => {
        expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
      });

      const sidebarItems = screen.getAllByText(/slide|question/i);
      await user.click(sidebarItems[1]);
      expect(screen.getByText("First Question")).toBeInTheDocument();
    });

    test("handles empty sidebar gracefully", async () => {
      axios.get.mockResolvedValueOnce({
        data: { ...mockQuizData, order: [] },
      });

      render(<PreviewPage />);
      await waitFor(() => {
        expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
      });

      expect(screen.queryByText(/slide|question/i)).not.toBeInTheDocument();
    });
  });
});
