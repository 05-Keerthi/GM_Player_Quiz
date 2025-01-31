import React from "react";
import { render, screen } from "@testing-library/react";
import DistributionChart from "../../../../pages/Report/UserDashboard/DistributionChart";

// Mocking the recharts components
jest.mock("recharts", () => ({
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => <div>Cell</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

describe("DistributionChart", () => {
  it("renders correctly with given quizCount and surveyCount", () => {
    const quizCount = 10;
    const surveyCount = 5;

    render(<DistributionChart quizCount={quizCount} surveyCount={surveyCount} />);

    // Check if the pie chart elements are rendered
    expect(screen.getAllByText("Cell")).toHaveLength(2); // There should be 2 "Cell" elements
    expect(screen.getByText("Tooltip")).toBeInTheDocument();
    expect(screen.getByText("Legend")).toBeInTheDocument();

  });
});
