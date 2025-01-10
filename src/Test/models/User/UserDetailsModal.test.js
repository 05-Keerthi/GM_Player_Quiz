import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserDetailsModal from "../../../models/User/UserDetailsModal";

describe("UserDetailsModal", () => {
  const mockUser = {
    username: "testuser",
    email: "test@example.com",
    mobile: "1234567890",
    role: "user",
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    user: mockUser,
    onEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Modal Visibility
  test("should not render when isOpen is false", () => {
    render(<UserDetailsModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("User Details")).not.toBeInTheDocument();
  });

  test("should not render when user is null", () => {
    render(<UserDetailsModal {...defaultProps} user={null} />);
    expect(screen.queryByText("User Details")).not.toBeInTheDocument();
  });

  test("should render when isOpen is true and user is provided", () => {
    render(<UserDetailsModal {...defaultProps} />);
    expect(screen.getByText("User Details")).toBeInTheDocument();
  });

  // Test 2: User Information Display
  test("should display all user information correctly", () => {
    render(<UserDetailsModal {...defaultProps} />);

    expect(screen.getByText(mockUser.username)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockUser.mobile)).toBeInTheDocument();
    expect(screen.getByText(mockUser.role)).toBeInTheDocument();
  });

  // Test 3: Button Actions
  test("close button should trigger onClose", () => {
    render(<UserDetailsModal {...defaultProps} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test("edit button should trigger onEdit with user data and close modal", () => {
    render(<UserDetailsModal {...defaultProps} />);

    const editButton = screen.getByRole("button", { name: /edit user/i });
    fireEvent.click(editButton);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockUser);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  // Test 4: Accessibility
  test("should have accessible buttons", () => {
    render(<UserDetailsModal {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /edit user/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  // Test 5: Modal Structure
  test("should have correct modal structure", () => {
    render(<UserDetailsModal {...defaultProps} />);

    expect(screen.getByText("Mobile")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(document.querySelector(".bg-white")).toBeInTheDocument();
    expect(
      document.querySelector(".bg-black.bg-opacity-50")
    ).toBeInTheDocument();
  });
});
