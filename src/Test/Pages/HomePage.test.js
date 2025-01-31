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
    expect(
      screen.getByRole("heading", { name: "Join Quiz" })
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("button-join-now")
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
    await user.click(screen.getByTestId("button-join-now"));
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
      await user.click(planCards[0]); // Click Basic Plan
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
        await user.click(planCards[i]);
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
      "Create ArtPulse",
      "View ArtPulse",
      "View Activity Log",
      "Dashboard"
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

  test("handles navigation correctly for tenant admin actions", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { role: "tenant_admin" },
    });

    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: "Create Quiz" }));
    expect(mockNavigate).toHaveBeenCalledWith("/selectQuizCategory");

    await user.click(screen.getByRole("button", { name: "Go to Quizzes" }));
    expect(mockNavigate).toHaveBeenCalledWith("/quiz-list");
  });

  test("opens and closes create tenant modal for superadmin", async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { role: "superadmin" },
    });

    render(<HomePage />);
    await user.click(screen.getByRole("button", { name: "Create Tenant" }));
    expect(screen.getByTestId("create-tenant-modal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("create-tenant-modal")).not.toBeInTheDocument();
  });
});
