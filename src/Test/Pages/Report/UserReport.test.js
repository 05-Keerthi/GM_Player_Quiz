// src/Test/Pages/Report/UserReport.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams } from "react-router-dom";
import UserReport from "../../../pages/Report/UserReport";
import { useReportContext } from "../../../context/ReportContext";

// Mock the chart.js and react-chartjs-2
jest.mock("react-chartjs-2", () => ({
  Pie: () => null,
}));

// Mock the router
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
}));

// Mock the context
jest.mock("../../../context/ReportContext", () => ({
  useReportContext: jest.fn(),
}));

// Mock the Navbar component
jest.mock("../../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

// Mock the QuizDetailsModal component
jest.mock("../../../models/QuizDetailsModal", () => {
  return function MockQuizDetailsModal({ open, onClose, quiz }) {
    return open ? (
      <div data-testid="quiz-details-modal">
        <button onClick={onClose}>Close</button>
        <div data-testid="modal-quiz-title">{quiz?.quiz?.title}</div>
      </div>
    ) : null;
  };
});

describe("UserReport Component", () => {
  const mockReports = [
    {
      _id: "1",
      quiz: { title: "Quiz 1", questions: [] },
      totalQuestions: 10,
      correctAnswers: 8,
      incorrectAnswers: 2,
      totalScore: 80,
      completedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      _id: "2",
      quiz: { title: "Quiz 2", questions: [] },
      totalQuestions: 10,
      correctAnswers: 7,
      incorrectAnswers: 3,
      totalScore: 70,
      completedAt: "2024-01-02T00:00:00.000Z",
    },
  ];

  const mockContextValue = {
    reports: mockReports,
    loading: false,
    error: null,
    getUserReports: jest.fn(),
  };

  beforeEach(() => {
    useReportContext.mockReturnValue(mockContextValue);
    useParams.mockReturnValue({ userId: "123" });
  });

  test("renders loading spinner when loading", () => {
    useReportContext.mockReturnValue({
      ...mockContextValue,
      loading: true,
    });

    render(<UserReport />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  test("renders error message when there is an error", () => {
    useReportContext.mockReturnValue({
      ...mockContextValue,
      error: "Test error",
    });

    render(<UserReport />);
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByTestId("retry-button")).toBeInTheDocument();
  });

  test("renders no quizzes message when there are no reports", () => {
    useReportContext.mockReturnValue({
      ...mockContextValue,
      reports: [],
    });

    render(<UserReport />);
    expect(screen.getByTestId("no-quizzes-message")).toBeInTheDocument();
  });

  test("calculates and displays statistics correctly", () => {
    render(<UserReport />);

    expect(screen.getByTestId("total-quizzes-value")).toHaveTextContent("2");
    expect(screen.getByTestId("total-score-value")).toHaveTextContent("150");
    expect(screen.getByTestId("average-score-value")).toHaveTextContent(
      "75.00"
    );
  });

  test("renders quiz history table with correct data", () => {
    render(<UserReport />);

    expect(screen.getByTestId("quiz-history-table")).toBeInTheDocument();
    const rows = screen.getAllByTestId("quiz-history-row");
    expect(rows).toHaveLength(2);
    expect(screen.getByText("Quiz 1")).toBeInTheDocument();
    expect(screen.getByText("Quiz 2")).toBeInTheDocument();
  });

  test("opens quiz details modal when clicking on a quiz", async () => {
    const user = userEvent.setup();
    render(<UserReport />);

    // Click the first quiz row
    const rows = screen.getAllByTestId("quiz-history-row");
    await user.click(rows[0]);

    // Verify modal is open
    expect(screen.getByTestId("quiz-details-modal")).toBeInTheDocument();

    // Verify the modal content using the specific test ID
    expect(screen.getByTestId("modal-quiz-title")).toHaveTextContent("Quiz 1");
  });

  test("closes quiz details modal when clicking close button", async () => {
    const user = userEvent.setup();
    render(<UserReport />);

    // Open modal
    const rows = screen.getAllByTestId("quiz-history-row");
    await user.click(rows[0]);
    expect(screen.getByTestId("quiz-details-modal")).toBeInTheDocument();

    // Close modal
    await user.click(screen.getByText("Close"));
    expect(screen.queryByTestId("quiz-details-modal")).not.toBeInTheDocument();
  });

  test("displays pie chart with correct data", () => {
    render(<UserReport />);
    expect(screen.getByTestId("pie-chart-container")).toBeInTheDocument();
  });

  test("fetches user reports with correct userId", () => {
    render(<UserReport />);
    expect(mockContextValue.getUserReports).toHaveBeenCalledWith("123");
  });

  test("retry button reloads the page on error", () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { reload: jest.fn() };

    useReportContext.mockReturnValue({
      ...mockContextValue,
      error: "Test error",
    });

    render(<UserReport />);
    fireEvent.click(screen.getByTestId("retry-button"));

    expect(window.location.reload).toHaveBeenCalled();

    window.location = originalLocation;
  });

  test("handles pagination when there are more than 10 reports", () => {
    const manyReports = Array.from({ length: 15 }, (_, i) => ({
      ...mockReports[0],
      _id: `id${i}`,
      quiz: { title: `Quiz ${i}`, questions: [] },
    }));

    useReportContext.mockReturnValue({
      ...mockContextValue,
      reports: manyReports,
    });

    render(<UserReport />);

    const rows = screen.getAllByTestId("quiz-history-row");
    expect(rows).toHaveLength(10); // Should show 10 items per page
  });
});
