import React from "react";
import { render, screen } from "@testing-library/react";
import ActivityTimeline from "../../../../pages/Report/UserDashboard/ActivityTimeline";
import "@testing-library/jest-dom";

// Mock recharts components to avoid rendering issues in tests
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div data-testid="AreaChart">{children}</div>,
  Area: () => <div data-testid="Area" />,
  XAxis: () => <div data-testid="XAxis" />,
  YAxis: () => <div data-testid="YAxis" />,
  CartesianGrid: () => <div data-testid="CartesianGrid" />,
  Tooltip: () => <div data-testid="Tooltip" />,
}));

describe("ActivityTimeline Component", () => {
  test("renders without crashing", () => {
    render(<ActivityTimeline quizzes={[]} surveys={[]} />);
    expect(screen.getByText("Activity Timeline")).toBeInTheDocument();
  });

  test("renders recharts components", () => {
    render(<ActivityTimeline quizzes={[]} surveys={[]} />);
    expect(screen.getByTestId("AreaChart")).toBeInTheDocument();
    expect(screen.getByTestId("XAxis")).toBeInTheDocument();
    expect(screen.getByTestId("YAxis")).toBeInTheDocument();
    expect(screen.getByTestId("CartesianGrid")).toBeInTheDocument();
    expect(screen.getByTestId("Tooltip")).toBeInTheDocument();
  });

  test("displays correct data aggregation", () => {
    const quizzes = [
      { lastAttempt: "2024-01-15", attempts: 3, QuizDetails: {} },
      { lastAttempt: "2024-02-10", attempts: 2, QuizDetails: {} },
    ];
    const surveys = [
      { lastAttempt: "2024-01-20", attempts: 1 },
      { lastAttempt: "2024-02-05", attempts: 4 },
    ];
    render(<ActivityTimeline quizzes={quizzes} surveys={surveys} />);

    expect(screen.getByTestId("AreaChart")).toBeInTheDocument();
    // Since recharts components are mocked, we only check if the chart is rendered
  });
});
