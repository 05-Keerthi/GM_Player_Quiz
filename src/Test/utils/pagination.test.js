// src/__tests__/pagination.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { paginateData, PaginationControls } from "../../utils/pagination";

describe("paginateData", () => {
  const mockData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

  it("should return correct items for first page", () => {
    const result = paginateData(mockData, 1, 10);

    expect(result.currentItems).toHaveLength(10);
    expect(result.currentItems[0].id).toBe(1);
    expect(result.currentItems[9].id).toBe(10);
    expect(result.totalPages).toBe(3);
  });

  it("should return correct items for middle page", () => {
    const result = paginateData(mockData, 2, 10);

    expect(result.currentItems).toHaveLength(10);
    expect(result.currentItems[0].id).toBe(11);
    expect(result.currentItems[9].id).toBe(20);
  });

  it("should return correct items for last page", () => {
    const result = paginateData(mockData, 3, 10);

    expect(result.currentItems).toHaveLength(5);
    expect(result.currentItems[0].id).toBe(21);
    expect(result.currentItems[4].id).toBe(25);
  });

  it("should handle empty data array", () => {
    const result = paginateData([], 1, 10);

    expect(result.currentItems).toHaveLength(0);
    expect(result.totalPages).toBe(0);
  });

  it("should handle itemsPerPage larger than data length", () => {
    const result = paginateData(mockData, 1, 30);

    expect(result.currentItems).toHaveLength(25);
    expect(result.totalPages).toBe(1);
  });
});

describe("PaginationControls", () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render correctly with few pages", () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText("1")).toHaveClass("bg-blue-500"); // Active page
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByText("...")).not.toBeInTheDocument();
  });

  it("should render correctly with many pages", () => {
    render(
      <PaginationControls
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getAllByText("...")).toHaveLength(2); // There might be two ellipsis
    expect(screen.getByText("5")).toHaveClass("bg-blue-500"); // Active page
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("should handle prev button click", () => {
    render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={mockOnPageChange}
      />
    );

    fireEvent.click(screen.getByText("Prev"));
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it("should handle next button click", () => {
    render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={mockOnPageChange}
      />
    );

    fireEvent.click(screen.getByText("Next"));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it("should disable prev button on first page", () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText("Prev").closest("button")).toBeDisabled();
  });

  it("should disable next button on last page", () => {
    render(
      <PaginationControls
        currentPage={3}
        totalPages={3}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText("Next").closest("button")).toBeDisabled();
  });

  it("should handle page number click", () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
      />
    );

    fireEvent.click(screen.getByText("2"));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it("should render ellipsis correctly for large page numbers", () => {
    render(
      <PaginationControls
        currentPage={50}
        totalPages={100}
        onPageChange={mockOnPageChange}
      />
    );

    const ellipses = screen.getAllByText("...");
    expect(ellipses).toHaveLength(2); // One before and one after current page
  });

  it("should adjust visible pages based on current page position", () => {
    render(
      <PaginationControls
        currentPage={98}
        totalPages={100}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("...")).toBeInTheDocument();
    expect(screen.getByText("98")).toHaveClass("bg-blue-500"); // Active page
    expect(screen.getByText("99")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});
