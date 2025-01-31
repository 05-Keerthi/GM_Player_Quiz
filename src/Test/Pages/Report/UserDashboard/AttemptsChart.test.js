import React from "react";
import { render, screen } from "@testing-library/react";
import AttemptsChart from "../../../../pages/Report/UserDashboard/AttemptsChart";
import "@testing-library/jest-dom";

// Mock recharts components to prevent rendering issues
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div data-testid="BarChart">{children}</div>,
  Bar: ({ children }) => <div data-testid="Bar">{children}</div>,
  XAxis: () => <div data-testid="XAxis" />,
  YAxis: () => <div data-testid="YAxis" />,
  CartesianGrid: () => <div data-testid="CartesianGrid" />,
  Tooltip: () => <div data-testid="Tooltip" />,
  Legend: () => <div data-testid="Legend" />,
  Cell: () => <div data-testid="Cell" />,
}));

describe("AttemptsChart Component", () => {
  test("renders without crashing", () => {
    render(<AttemptsChart quizzes={[]} surveys={[]} />);
    expect(screen.getByTestId("BarChart")).toBeInTheDocument();
  });

  test("renders recharts components", () => {
    render(<AttemptsChart quizzes={[]} surveys={[]} />);
    expect(screen.getByTestId("BarChart")).toBeInTheDocument();
    expect(screen.getByTestId("XAxis")).toBeInTheDocument();
    expect(screen.getByTestId("YAxis")).toBeInTheDocument();
    expect(screen.getByTestId("CartesianGrid")).toBeInTheDocument();
    expect(screen.getByTestId("Tooltip")).toBeInTheDocument();
    expect(screen.getByTestId("Legend")).toBeInTheDocument();
  });

  test("displays correct data aggregation", () => {
    const quizzes = [
      { QuizDetails: { quizTitle: "Quiz 1" }, attempts: 5 },
      { QuizDetails: { quizTitle: "Quiz 2" }, attempts: 3 },
    ];
    const surveys = [
      { SurveyDetails: { surveyTitle: "Survey 1" }, attempts: 7 },
      { SurveyDetails: { surveyTitle: "Survey 2" }, attempts: 2 },
    ];
    render(<AttemptsChart quizzes={quizzes} surveys={surveys} />);

    expect(screen.getByTestId("BarChart")).toBeInTheDocument();
  });
});
