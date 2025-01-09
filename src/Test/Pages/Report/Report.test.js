// src/Test/Pages/Report.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams } from "react-router-dom";
import ReportsView from "../../../pages/Report/Report";
import { useReportContext } from "../../../context/ReportContext";
import { useAuthContext } from "../../../context/AuthContext";

// Mock the chart.js and react-chartjs-2
jest.mock("react-chartjs-2", () => ({
  Pie: () => null,
}));

// Mock the contexts and router
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
}));

jest.mock("../../../context/ReportContext", () => ({
  useReportContext: jest.fn(),
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuthContext: jest.fn(),
}));

// Mock the Navbar component
jest.mock("../../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

describe("ReportsView Component", () => {
  const mockReports = [
    {
      _id: "1",
      quiz: { title: "Quiz 1" },
      user: { username: "user1" },
      totalQuestions: 10,
      correctAnswers: 8,
      incorrectAnswers: 2,
      totalScore: 80,
      completedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      _id: "2",
      quiz: { title: "Quiz 2" },
      user: { username: "user2" },
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
    getAllReports: jest.fn(),
    getReportByQuiz: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    useReportContext.mockReturnValue(mockContextValue);
    useParams.mockReturnValue({ quizId: null });
    useAuthContext.mockReturnValue({
      user: { role: "admin" },
    });
  });

  test("renders loading spinner when loading", () => {
    useReportContext.mockReturnValue({
      ...mockContextValue,
      loading: true,
    });

    render(<ReportsView />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  test("renders error message when there is an error", () => {
    useReportContext.mockReturnValue({
      ...mockContextValue,
      error: { message: "Test error" },
    });

    render(<ReportsView />);
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByTestId("retry-button")).toBeInTheDocument();
  });

  test("renders no reports message when there are no reports", () => {
    useReportContext.mockReturnValue({
      ...mockContextValue,
      reports: [],
    });

    render(<ReportsView />);
    expect(screen.getByTestId("no-reports-message")).toBeInTheDocument();
  });

  test("renders reports table with correct data", () => {
    render(<ReportsView />);

    expect(screen.getByTestId("reports-table")).toBeInTheDocument();
    expect(screen.getByText("Quiz 1")).toBeInTheDocument();
    expect(screen.getByText("user1")).toBeInTheDocument();
  });

  test("calculates and displays statistics correctly", () => {
    render(<ReportsView />);

    expect(screen.getByTestId("total-quizzes-value")).toHaveTextContent("2");
    expect(screen.getByTestId("total-score-value")).toHaveTextContent("150");
    expect(screen.getByTestId("average-score-value")).toHaveTextContent(
      "75.00"
    );
  });

  test("filters reports by combined search term", async () => {
    const user = userEvent.setup();
    render(<ReportsView />);

    const filterInput = screen.getByTestId("combined-filter");

    // Test filtering by quiz title
    await user.type(filterInput, "Quiz 1");
    expect(screen.getByText("Quiz 1")).toBeInTheDocument();
    expect(screen.queryByText("Quiz 2")).not.toBeInTheDocument();

    // Clear the input
    await user.clear(filterInput);

    // Test filtering by username
    await user.type(filterInput, "user1");
    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.queryByText("user2")).not.toBeInTheDocument();
  });

  test("shows all reports when search term is cleared", async () => {
    const user = userEvent.setup();
    render(<ReportsView />);

    const filterInput = screen.getByTestId("combined-filter");
    await user.type(filterInput, "user1");
    await user.clear(filterInput);

    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.getByText("user2")).toBeInTheDocument();
  });

  test("handles case-insensitive search", async () => {
    const user = userEvent.setup();
    render(<ReportsView />);

    const filterInput = screen.getByTestId("combined-filter");
    await user.type(filterInput, "quiz");

    expect(screen.getByText("Quiz 1")).toBeInTheDocument();
    expect(screen.getByText("Quiz 2")).toBeInTheDocument();
  });

  test("partial search term matches reports correctly", async () => {
    const user = userEvent.setup();
    render(<ReportsView />);

    const filterInput = screen.getByTestId("combined-filter");
    await user.type(filterInput, "user");

    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.getByText("user2")).toBeInTheDocument();
  });

  test("updates filter in real-time as user types", async () => {
    const user = userEvent.setup();
    render(<ReportsView />);

    const filterInput = screen.getByTestId("combined-filter");
    await user.type(filterInput, "u");
    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.getByText("user2")).toBeInTheDocument();

    await user.type(filterInput, "ser1");
    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.queryByText("user2")).not.toBeInTheDocument();
  });

  test("fetches reports for specific quiz when quizId is provided", () => {
    useParams.mockReturnValue({ quizId: "123" });
    render(<ReportsView />);

    expect(mockContextValue.getReportByQuiz).toHaveBeenCalledWith("123");
  });

  test("fetches all reports for admin user when no quizId is provided", () => {
    render(<ReportsView />);

    expect(mockContextValue.getAllReports).toHaveBeenCalled();
  });

  test("displays pie chart with correct data", () => {
    render(<ReportsView />);

    expect(screen.getByTestId("pie-chart-container")).toBeInTheDocument();
  });

  test("clears error on component unmount", () => {
    const { unmount } = render(<ReportsView />);
    unmount();

    expect(mockContextValue.clearError).toHaveBeenCalled();
  });

  test("retry button reloads the page on error", () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { reload: jest.fn() };

    useReportContext.mockReturnValue({
      ...mockContextValue,
      error: { message: "Test error" },
    });

    render(<ReportsView />);
    fireEvent.click(screen.getByTestId("retry-button"));

    expect(window.location.reload).toHaveBeenCalled();

    window.location = originalLocation;
  });

  test("handles pagination correctly", async () => {
    const manyReports = Array.from({ length: 12 }, (_, i) => ({
      ...mockReports[0],
      _id: `id${i}`,
      quiz: { title: `Quiz ${i}` },
      user: { username: `user${i}` },
    }));

    useReportContext.mockReturnValue({
      ...mockContextValue,
      reports: manyReports,
    });

    render(<ReportsView />);

    // Assuming 5 reports per page
    expect(screen.getAllByRole("row")).toHaveLength(6); // 5 reports + header row
  });
});
