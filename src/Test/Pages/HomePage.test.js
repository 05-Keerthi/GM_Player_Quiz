// src/Test/Pages/HomePage.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "../../pages/Home";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("../../context/AuthContext", () => ({
  useAuthContext: jest.fn(),
}));

jest.mock("../../components/NavbarComp", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock("../../components/CardComp", () => {
  return function MockCard({ title, onClick }) {
    return (
      <div data-testid="card" onClick={onClick}>
        {title}
      </div>
    );
  };
});

jest.mock("../../components/UserManagement", () => {
  return function MockUserManagement() {
    return <div data-testid="user-management">User Management</div>;
  };
});

jest.mock("../../components/TenantManagement", () => {
  return function MockTenantManagement() {
    return <div data-testid="tenant-management">Tenant Management</div>;
  };
});

jest.mock("../../models/Tenant/TenantModal", () => {
  return function MockTenantModal({ isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="tenant-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

describe("HomePage", () => {
  const mockNavigate = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    jest.clearAllMocks();
  });

  test("renders correctly for unauthenticated users", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(<HomePage />);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();

    // Check for Join Quiz section
    expect(
      screen.getByRole("heading", { name: "Join Quiz" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Participate in exciting quizzes")
    ).toBeInTheDocument();
    expect(screen.getByTestId("button-join-now")).toBeInTheDocument();

    // Check for Join Survey section
    expect(
      screen.getByRole("heading", { name: "Join Survey" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Participate in exciting surveys")
    ).toBeInTheDocument();

    // Check plans section
    expect(
      screen.getByRole("heading", { name: "Choose Your Plan" })
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("card")).toHaveLength(4);
  });

  test("renders correctly for tenant_admin role", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: {
        role: "tenant_admin",
        tenantId: { _id: "123" },
      },
    });

    render(<HomePage />);

    // Check for main actions
    expect(
      screen.getByRole("heading", { name: "Manage tenant details" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "View Activity Log" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Dashboard" })
    ).toBeInTheDocument();

    // Check for User Management section
    expect(
      screen.getByRole("heading", { name: "User Management" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("user-management")).toBeInTheDocument();
  });

  test("renders correctly for admin role", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { role: "admin" },
    });

    render(<HomePage />);

    const expectedHeadings = [
      "Create Quiz",
      "View Quizzes",
      "Create Survey",
      "View Surveys",
      "Create ArtPulse",
      "View ArtPulse",
      "View Activity Log",
      "Dashboard",
    ];

    expectedHeadings.forEach((heading) => {
      expect(
        screen.getByRole("heading", { name: heading })
      ).toBeInTheDocument();
    });

    // Admin shouldn't have a second section
    expect(
      screen.queryByRole("heading", { name: "Choose Your Plan" })
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("user-management")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tenant-management")).not.toBeInTheDocument();
  });

  test("handles navigation with survey type", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { role: "admin" },
    });

    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: "Create Survey" }));
    expect(mockNavigate).toHaveBeenCalledWith("/selectSurveyCategory", {
      state: { surveyType: "survey" },
    });

    await user.click(screen.getByRole("button", { name: "Create ArtPulse" }));
    expect(mockNavigate).toHaveBeenCalledWith("/selectSurveyCategory", {
      state: { surveyType: "ArtPulse" },
    });
  });

  test("opens and closes tenant modal for superadmin", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { role: "superadmin" },
    });

    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: "Create Tenant" }));
    expect(screen.getByTestId("tenant-modal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("tenant-modal")).not.toBeInTheDocument();
  });
});