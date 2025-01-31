import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminDashboard from "../../../pages/Activity/AdminDashboard";
import { act } from "react-dom/test-utils";

// Mock recharts components
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => children,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div>Line</div>,
  Area: () => <div>Area</div>,
  Bar: () => <div>Bar</div>,
  Pie: () => <div>Pie</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
  Cell: () => <div>Cell</div>,
}));

// Mock icons
jest.mock("lucide-react", () => ({
  ChevronLeft: () => <div>ChevronLeft</div>,
  ChevronRight: () => <div>ChevronRight</div>,
}));

// Mock navbar
jest.mock("../../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

// Mock activity data
const mockActivityData = {
  activityLogs: [
    {
      _id: "1",
      activityType: "login",
      createdAt: "2025-01-30T10:00:00.000Z",
      details: {
        username: "testuser",
        email: "test@example.com",
        mobile: "1234567890",
      },
      status: "completed",
    },
  ],
  counts: {
    login: 10,
    quiz_status: {
      draft: 5,
      active: 3,
      closed: 2,
    },
    quiz_session_status: {
      waiting: 2,
      in_progress: 3,
      completed: 5,
    },
    survey_status: {
      survey: {
        draft: 3,
        active: 2,
        closed: 1,
      },
      ArtPulse: {
        draft: 1,
        active: 1,
        closed: 1,
      },
    },
    survey_session_status: {
      waiting: 1,
      in_progress: 2,
      completed: 3,
    },
  },
};

// Mock fetch and localStorage
global.fetch = jest.fn();
const mockLocalStorage = {
  getItem: jest.fn(() => "mock-token"),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

describe("AdminDashboard", () => {
  beforeEach(() => {
    fetch.mockClear();
    mockLocalStorage.getItem.mockClear();
  });

  it("renders loading state initially", () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));
    render(<AdminDashboard />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    fetch.mockRejectedValueOnce(new Error("Failed to fetch"));
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it("renders dashboard components when data is loaded", async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockActivityData),
      })
    );

    await act(async () => {
      render(<AdminDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText("Activity Dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });
  });

  it("updates filter selection", async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockActivityData),
      })
    );

    await act(async () => {
      render(<AdminDashboard />);
    });

    const filterSelect = screen.getByRole("combobox");
    fireEvent.change(filterSelect, { target: { value: "login" } });
    expect(filterSelect.value).toBe("login");
  });
});

describe("StatsCard Component", () => {
  it("correctly calculates total quizzes and surveys", async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockActivityData),
      })
    );

    await act(async () => {
      render(<AdminDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText("Total Quizzes")).toBeInTheDocument();
      expect(screen.getByText("Total Surveys")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument(); // Total Quizzes count
      expect(screen.getByText("9")).toBeInTheDocument(); // Total Surveys count
    });
  });
});
