
import React from "react";
import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DetailedAdminReportDashboard from "../../../../pages/Report/AdminDashboard/DetailedAdminReportDashboard";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

// Mock axios
jest.mock("axios");

// Mock NavbarComp
jest.mock("../../../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

// Mock utils/pagination with a working implementation
jest.mock("../../../../utils/pagination", () => {
  const paginateData = (data, currentPage, itemsPerPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      currentItems: data.slice(startIndex, endIndex),
      totalPages: Math.ceil(data.length / itemsPerPage)
    };
  };

  return {
    paginateData,
    PaginationControls: ({ currentPage, totalPages, onPageChange }) => (
      <div data-testid="pagination-controls">
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i + 1} onClick={() => onPageChange(i + 1)}>
            {i + 1}
          </button>
        ))}
      </div>
    ),
  };
});

// Mock recharts components
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie">Pie Chart</div>,
  Cell: () => <div data-testid="cell">Cell</div>,
  Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
  Legend: () => <div data-testid="legend">Legend</div>,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ArrowBigLeft: () => <div data-testid="arrow-left-icon">←</div>,
  Trophy: () => <div data-testid="trophy-icon">🏆</div>,
}));

const mockQuizData = {
  quizDetails: {
    title: "Sample Quiz",
    description: "A test quiz",
  },
  overallStats: {
    totalAttempts: 150,
    averageScore: 75.5,
    highestScore: 100,
    lowestScore: 45,
  },
  sessionStats: [
    { status: "completed", count: 80 },
    { status: "in_progress", count: 40 },
    { status: "pending", count: 30 },
  ],
  sessionList: Array(12).fill().map((_, index) => ({
    _id: `session${index}`,
    host: { username: `host${index}` },
    joinCode: `CODE${index}`,
    status: index % 3 === 0 ? "completed" : index % 3 === 1 ? "in_progress" : "pending",
    createdAt: new Date(2025, 0, index + 1).toISOString(),
    playerCount: 10 + index,
  })),
  topPerformers: [
    { username: "topUser1", score: 100 },
    { username: "topUser2", score: 95 },
    { username: "topUser3", score: 90 },
  ],
};

const mockSurveyData = {
  surveyDetails: {
    title: "Sample Survey",
    description: "A test survey",
  },
  overallStats: {
    totalResponses: 200,
    participantCount: 150,
    avgQuestionsAttempted: 8.5,
    avgQuestionsSkipped: 1.5,
  },
  sessionStats: [
    { status: "completed", count: 100 },
    { status: "in_progress", count: 60 },
    { status: "pending", count: 40 },
  ],
  sessionList: Array(12).fill().map((_, index) => ({
    _id: `survey${index}`,
    surveyHost: { username: `host${index}` },
    surveyJoinCode: `SURVEY${index}`,
    surveyStatus: index % 3 === 0 ? "completed" : index % 3 === 1 ? "in_progress" : "pending",
    createdAt: new Date(2025, 0, index + 1).toISOString(),
    playerCount: 15 + index,
  })),
};

describe("DetailedAdminReportDashboard", () => {
  const mockNavigate = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ type: "quizzes", id: "123" });
    localStorage.setItem("token", "mock-token");
    process.env.REACT_APP_API_URL = "http://test-api.com";
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    delete process.env.REACT_APP_API_URL;
  });

  describe("Loading and Error States", () => {
    test("displays loading spinner initially", () => {
      axios.get.mockImplementationOnce(() => new Promise(() => {}));
      render(<DetailedAdminReportDashboard />);

    });

    test("displays error message when API call fails", async () => {
      const errorMessage = "Failed to fetch data";
      axios.get.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });
      
      render(<DetailedAdminReportDashboard />);
      
      expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe("Quiz Dashboard", () => {
    beforeEach(() => {
      useParams.mockReturnValue({ type: "quizzes", id: "123" });
      axios.get.mockResolvedValueOnce({ data: mockQuizData });
    });

    test("displays top performers podium", async () => {
      render(<DetailedAdminReportDashboard />);

      // Check for top performers section using a more flexible matcher
      const topPerformersHeading = await screen.findByRole('heading', { name: /top performers/i });
      expect(topPerformersHeading).toBeInTheDocument();
      
      const firstTopUser = await screen.findByText("topUser1");
      expect(firstTopUser).toBeInTheDocument();
      
    });
  });

  describe("Survey Dashboard", () => {
    beforeEach(() => {
      useParams.mockReturnValue({ type: "surveys", id: "123" });
      axios.get.mockResolvedValueOnce({ data: mockSurveyData });
    });

    test("renders survey title and stats correctly", async () => {
      render(<DetailedAdminReportDashboard />);


      // Wait for and check survey details
      const surveyTitle = await screen.findByRole('heading', { name: /sample survey/i });
      expect(surveyTitle).toBeInTheDocument();
    });
  });

  describe("Navigation and Interaction", () => {
    beforeEach(() => {
      axios.get.mockResolvedValueOnce({ data: mockQuizData });
    });

    test("navigates back to admin dashboard when back button is clicked", async () => {
      render(<DetailedAdminReportDashboard />);
      
      
      // Find and click the back button using aria-label
      const backButton = await screen.findByRole('button', { name: /back/i });
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith("/admin-dashboard");
    });

    test("navigates to session details when session row is clicked", async () => {
      render(<DetailedAdminReportDashboard />);
      
      // Find and click the first session row using the join code cell
      const sessionRow = await screen.findByRole('row', { name: /CODE0/i });
      await user.click(sessionRow);
      
      expect(mockNavigate).toHaveBeenCalledWith("/quizzes/session/session0");
    });
  });

  describe("API Calls", () => {
    test("makes API call with correct parameters", async () => {
      render(<DetailedAdminReportDashboard />);
      
      expect(axios.get).toHaveBeenCalledWith(
        "http://test-api.com/api/admin/analytics/quizzes/123",
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-token" }
        })
      );
    });
  });
});
