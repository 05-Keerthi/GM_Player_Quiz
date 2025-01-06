// src/Test/Pages/HomePage.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "../../pages/Home";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Mock dependencies
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

jest.mock("../../components/Usercard", () => {
  return function MockUserManagement() {
    return <div data-testid="user-management">User Management</div>;
  };
});

jest.mock("../../components/TenantManagement", () => {
  return function MockTenantManagement() {
    return <div data-testid="tenant-management">Tenant Management</div>;
  };
});

jest.mock("../../models/Tenant/CreateTenantModel", () => {
  return function MockCreateTenantModal({ isOpen, onClose }) {
    return isOpen ? (
      <div data-testid="create-tenant-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

describe("HomePage", () => {
  const mockNavigate = jest.fn();

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
    expect(
      screen.getByRole("heading", { name: "Join Quiz" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Join Now" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Participate in exciting quizzes")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Choose Your Plan" })
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("card")).toHaveLength(4);
  });

  test("redirects to login when unauthenticated user tries to join quiz", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(<HomePage />);
    const joinButton = screen.getByRole("button", { name: "Join Now" });
    await userEvent.click(joinButton);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  describe("Plan selection navigation", () => {
    test("redirects to login for unauthenticated users", async () => {
      useAuthContext.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(<HomePage />);
      const planCards = screen.getAllByTestId("card");
      await userEvent.click(planCards[0]); // Click Basic Plan
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    test("navigates to correct paths for authenticated users", async () => {
      useAuthContext.mockReturnValue({
        isAuthenticated: true,
        user: { role: "user" },
      });

      render(<HomePage />);
      const planCards = screen.getAllByTestId("card");

      const planPaths = [
        "/basic-plan",
        "/pro-plan",
        "/business-plan",
        "/enterprise",
      ];

      for (let i = 0; i < planPaths.length; i++) {
        await userEvent.click(planCards[i]);
        expect(mockNavigate).toHaveBeenNthCalledWith(i + 1, planPaths[i]);
      }
    });
  });

  test("renders correctly for superadmin role", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { role: "superadmin" },
    });

    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Create Tenant" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Tenant" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Set up new organization spaces")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tenant Management" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("tenant-management")).toBeInTheDocument();
  });

  test("renders correctly for tenant_admin role", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { role: "tenant_admin" },
    });

    render(<HomePage />);

    const expectedHeadings = [
      "Create Quiz",
      "View Quizzes",
      "Create Survey",
      "View Surveys",
      "View Activity Log",
      "View Reports",
    ];

    expectedHeadings.forEach((heading) => {
      expect(
        screen.getByRole("heading", { name: heading })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: "User Management" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("user-management")).toBeInTheDocument();
  });

  test("renders correctly for regular user role", () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { role: "user", id: "123" },
    });

    render(<HomePage />);

    const expectedHeadings = ["Join Quiz", "Join Survey", "View Reports"];
    expectedHeadings.forEach((heading) => {
      expect(
        screen.getByRole("heading", { name: heading })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Participate in exciting quizzes")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Participate in exciting surveys")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Choose Your Plan" })
    ).toBeInTheDocument();
  });

  test("handles navigation correctly for tenant admin actions", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { role: "tenant_admin" },
    });

    render(<HomePage />);

    // Test navigation for Create Quiz
    const createQuizButton = screen.getByRole("button", {
      name: "Create Quiz",
    });
    await userEvent.click(createQuizButton);
    expect(mockNavigate).toHaveBeenCalledWith("/selectQuizCategory");

    // Test navigation for View Quizzes
    const viewQuizzesButton = screen.getByRole("button", {
      name: "Go to Quizzes",
    });
    await userEvent.click(viewQuizzesButton);
    expect(mockNavigate).toHaveBeenCalledWith("/quiz-list");
  });

  test("opens create tenant modal for superadmin", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { role: "superadmin" },
    });

    render(<HomePage />);
    const createTenantButton = screen.getByRole("button", {
      name: "Create Tenant",
    });
    await userEvent.click(createTenantButton);
    expect(screen.getByTestId("create-tenant-modal")).toBeInTheDocument();
  });

  test("handles modal close for superadmin", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { role: "superadmin" },
    });

    render(<HomePage />);
    const createTenantButton = screen.getByRole("button", {
      name: "Create Tenant",
    });
    await userEvent.click(createTenantButton);

    const closeButton = screen.getByRole("button", { name: "Close" });
    await userEvent.click(closeButton);
    expect(screen.queryByTestId("create-tenant-modal")).not.toBeInTheDocument();
  });
});
