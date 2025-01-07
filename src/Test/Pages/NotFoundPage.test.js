// src/Test/pages/NotFoundPage.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, Link } from "react-router-dom";
import { NotFoundPage } from "../../pages/NotFoundPage";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Link: jest.fn(),
}));

describe("NotFoundPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    Link.mockImplementation(({ to, children, className }) => (
      <a href={to} className={className} data-testid="home-link">
        {children}
      </a>
    ));
  });

  const renderNotFoundPage = () => {
    return render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );
  };

  test("renders all components correctly", () => {
    renderNotFoundPage();

    // Check main heading
    const heading = screen.getByRole("heading", { level: 1, name: "404" });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("text-6xl");

    // Check sub heading
    const subHeading = screen.getByRole("heading", {
      level: 1,
      name: "Page Not Found",
    });
    expect(subHeading).toBeInTheDocument();
    expect(subHeading).toHaveClass("text-2xl");

    // Check error message
    expect(
      screen.getByText(
        "Sorry, the page you are looking for doesn't exist or has been moved."
      )
    ).toBeInTheDocument();

    // Check home link
    const homeLink = screen.getByRole("link", { name: "Go to Home" });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
  });

  test("home link has correct styling classes", () => {
    renderNotFoundPage();

    const homeLink = screen.getByRole("link", { name: "Go to Home" });
    const expectedClasses = [
      "px-6",
      "py-3",
      "bg-blue-500",
      "text-white",
      "rounded-lg",
      "hover:bg-blue-600",
      "transition",
      "duration-300",
    ];

    expectedClasses.forEach((className) => {
      expect(homeLink).toHaveClass(className);
    });
  });

  test("page layout has correct structure and styling", () => {
    renderNotFoundPage();

    // Test main container
    const mainContainer = screen.getByTestId("not-found-container");
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass(
      "flex",
      "flex-col",
      "items-center",
      "justify-center",
      "min-h-screen",
      "bg-gray-100",
      "p-4"
    );

    // Test content container
    const contentContainer = screen.getByTestId("not-found-content");
    expect(contentContainer).toBeInTheDocument();
    expect(contentContainer).toHaveClass("text-center");
  });

  test("home link is clickable", async () => {
    renderNotFoundPage();

    const homeLink = screen.getByTestId("home-link");
    await user.click(homeLink);

    expect(homeLink).toHaveAttribute("href", "/");
  });

  test("meets accessibility requirements", () => {
    renderNotFoundPage();

    // Check semantic heading structure
    const mainHeading = screen.getByRole("heading", { level: 1, name: "404" });
    expect(mainHeading).toBeInTheDocument();

    // Check link accessibility
    const homeLink = screen.getByRole("link", { name: "Go to Home" });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveTextContent("Go to Home");
  });

  test("error message is visible and readable", () => {
    renderNotFoundPage();

    const errorMessage = screen.getByText(
      "Sorry, the page you are looking for doesn't exist or has been moved."
    );
    expect(errorMessage).toBeVisible();
    expect(errorMessage).toHaveTextContent(
      "Sorry, the page you are looking for doesn't exist or has been moved."
    );
  });
});
