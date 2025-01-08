import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ActivityLogPage from "../../../pages/Activity/ActivityLog";
import * as XLSX from "xlsx";

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock XLSX
jest.mock("xlsx", () => ({
  utils: {
    json_to_sheet: jest.fn(),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

// Mock NavbarComp
jest.mock("../../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="mock-navbar">Mock Navbar</div>;
  };
});

// Mock fetch
global.fetch = jest.fn();
process.env.REACT_APP_API_URL = "http://test-api.com";

// Rest of your test file remains the same...

describe("ActivityLogPage", () => {
  const mockActivityLogs = [
    {
      _id: "1",
      activityType: "login",
      details: { username: "user1", email: "user1@test.com" },
      createdAt: "2024-01-01T10:00:00.000Z",
      processedUsername: "user1",
    },
    {
      _id: "2",
      activityType: "quiz_play",
      details: { username: "user2", quizId: "123" },
      createdAt: "2024-01-02T11:00:00.000Z",
      processedUsername: "user2",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("token", "mock-token");
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ activityLogs: mockActivityLogs }),
    });
  });

  describe("Rendering", () => {
    test("renders loading state initially", () => {
      render(<ActivityLogPage />);
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    test("renders activity logs after loading", async () => {
      render(<ActivityLogPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      mockActivityLogs.forEach((log) => {
        expect(
          screen.getByTestId(`username-cell-${log._id}`)
        ).toHaveTextContent(log.processedUsername);
        expect(
          screen.getByTestId(`activity-type-cell-${log._id}`)
        ).toHaveTextContent(log.activityType);
      });
    });

    test("renders error state when API call fails", async () => {
      // Reset fetch mock and set it to reject
      global.fetch.mockReset();
      global.fetch.mockRejectedValueOnce(new Error("API Error"));

      render(<ActivityLogPage />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      // Use a more flexible query that matches both role and text content
      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(/Failed to fetch activity logs/i);
    });
  });

  describe("Filtering", () => {
    test("filters logs by username search", async () => {
      render(<ActivityLogPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      const searchInput = screen.getByTestId("username-search");
      await userEvent.type(searchInput, "user1");

      await waitFor(() => {
        expect(screen.getByTestId(`username-cell-1`)).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.queryByTestId(`username-cell-2`)).not.toBeInTheDocument();
      });
    });

    test("filters logs by date range", async () => {
      render(<ActivityLogPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      // Initial state check
      expect(screen.getByTestId(`username-cell-1`)).toBeInTheDocument();
      expect(screen.getByTestId(`username-cell-2`)).toBeInTheDocument();

      // Set date range
      const startDateInput = screen.getByTestId("start-date-input");
      const endDateInput = screen.getByTestId("end-date-input");

      fireEvent.change(startDateInput, { target: { value: "2024-01-01" } });
      fireEvent.change(endDateInput, { target: { value: "2024-01-01" } });

      await waitFor(() => {
        expect(screen.queryByTestId(`username-cell-1`)).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.queryByTestId(`username-cell-2`)).not.toBeInTheDocument();
      });
    });
  });

  describe("Modal and Details", () => {
    test("opens details modal when view button is clicked", async () => {
      render(<ActivityLogPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });
      const viewButton = screen.getByTestId(
        `view-details-button-${mockActivityLogs[0]._id}`
      );
      fireEvent.click(viewButton);

      expect(screen.getByTestId("details-modal")).toBeInTheDocument();
      expect(screen.getByTestId("modal-username")).toHaveTextContent(
        mockActivityLogs[0].processedUsername
      );
      expect(screen.getByTestId("modal-activity-type")).toHaveTextContent(
        mockActivityLogs[0].activityType
      );
    });

    test("closes modal when close button is clicked", async () => {
      render(<ActivityLogPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      const viewButton = screen.getByTestId(
        `view-details-button-${mockActivityLogs[0]._id}`
      );
      fireEvent.click(viewButton);

      const closeButton = screen.getByTestId("close-modal-button");
      fireEvent.click(closeButton);

      expect(screen.queryByTestId("details-modal")).not.toBeInTheDocument();
    });
  });

  describe("Export Functionality", () => {
    test("exports data to Excel when export button is clicked", async () => {
      render(<ActivityLogPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      const exportButton = screen.getByTestId("export-button");
      fireEvent.click(exportButton);

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
    });
  });

  describe("Pagination", () => {
    test("changes page when pagination buttons are clicked", async () => {
      const manyLogs = Array(10)
        .fill(null)
        .map((_, index) => ({
          _id: String(index),
          activityType: "login",
          details: { username: `user${index}` },
          createdAt: new Date().toISOString(),
          processedUsername: `user${index}`,
        }));

      global.fetch.mockReset();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activityLogs: manyLogs }),
      });

      render(<ActivityLogPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      // Initial page check
      expect(screen.getByTestId("username-cell-0")).toBeInTheDocument();
      expect(screen.queryByTestId("username-cell-6")).not.toBeInTheDocument();

      // Click next page
      const pagination = screen.getByTestId("activity-log-pagination");
      const nextPageButton = within(pagination).getByRole("button", {
        name: /go to page 2/i,
      });
      fireEvent.click(nextPageButton);

      // Check new page content
      await waitFor(() => {
        expect(screen.queryByTestId("username-cell-0")).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByTestId("username-cell-6")).toBeInTheDocument();
      });
    });
  });

  describe("Activity Type Filter", () => {
    test("filters logs by activity type", async () => {
      render(<ActivityLogPage />);

      // Wait for initial load to complete
      await waitFor(() => {
        expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      });

      // Open select dropdown using the Select component
      const select = screen.getByLabelText(/Activity Type/i);
      userEvent.click(select);

      // Find and click the Login option using more reliable queries
      const loginOption = await screen.findByRole("option", { name: /Login/i });
      userEvent.click(loginOption);

      // Verify the filtered results
      await waitFor(() => {
        const loginActivity = screen.getByTestId("username-cell-1");
        expect(loginActivity).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.queryByTestId("username-cell-2")).not.toBeInTheDocument();
      });
    });
  });
});
