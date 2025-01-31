import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserActivityTable from "../../../pages/Activity/UserActivityTable";
import { act } from "react-dom/test-utils";

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
};

// Mock fetch and localStorage
global.fetch = jest.fn();
const mockLocalStorage = {
  getItem: jest.fn(() => "mock-token"),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Mock the pagination utilities
jest.mock("../../../utils/pagination", () => {
  return {
    paginateData: (data, currentPage, itemsPerPage) => ({
      currentItems:
        data?.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        ) || [],
      totalPages: Math.ceil((data?.length || 0) / itemsPerPage),
    }),
    PaginationControls: ({ currentPage, totalPages, onPageChange }) => (
      <div>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>{currentPage}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    ),
  };
});

describe("UserActivityTable", () => {
  beforeEach(() => {
    fetch.mockClear();
    mockLocalStorage.getItem.mockClear();
  });

  it("renders activity table with data", async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockActivityData),
      })
    );

    await act(async () => {
      render(<UserActivityTable />);
    });

    await waitFor(() => {
      expect(screen.getByText("User Activity Logs")).toBeInTheDocument();
      expect(screen.getByText("testuser")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(screen.getByText("1234567890")).toBeInTheDocument();
    });
  });

  it("filters activities based on search input", async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockActivityData),
      })
    );

    await act(async () => {
      render(<UserActivityTable />);
    });

    const searchInput = screen.getByPlaceholderText("Search by activity type");
    fireEvent.change(searchInput, { target: { value: "login" } });

    await waitFor(() => {
      expect(screen.getByText("login")).toBeInTheDocument();
    });

    // Test non-matching search
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });
    await waitFor(() => {
      expect(screen.queryByText("testuser")).not.toBeInTheDocument();
    });
  });

  it("handles pagination controls", async () => {
    const extendedMockData = {
      activityLogs: Array(10)
        .fill(null)
        .map((_, index) => ({
          ...mockActivityData.activityLogs[0],
          _id: String(index),
        })),
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(extendedMockData),
      })
    );

    await act(async () => {
      render(<UserActivityTable />);
    });

    await waitFor(() => {
      const [prevButton, nextButton] = screen.getAllByRole("button");
      expect(prevButton).toHaveTextContent("Previous");
      expect(nextButton).toHaveTextContent("Next");
    });
  });

  it("handles fetch error gracefully", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    fetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    await act(async () => {
      render(<UserActivityTable />);
    });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});
