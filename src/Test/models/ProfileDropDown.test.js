import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import ProfileDropdown from "../../models/ProfileDropDown"; // Update the path as needed
// Move this to the top of the file, before any imports
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

describe("ProfileDropdown Component", () => {
  const mockOnLogout = jest.fn();

  const userMock = {
    email: "testuser@example.com",
  };

  const renderComponent = (user = userMock, onLogout = mockOnLogout) => {
    return render(
      <BrowserRouter>
        <ProfileDropdown user={user} onLogout={onLogout} />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    renderComponent();
    const button = screen.getByRole("button", { name: /▼/i });
    expect(button).toBeInTheDocument();
  });

  it("displays user email when dropdown is open", () => {
    renderComponent();
    const button = screen.getByRole("button", { name: /▼/i });

    // Open the dropdown
    fireEvent.click(button);

    const email = screen.getByText(userMock.email);
    expect(email).toBeInTheDocument();
  });

  it("navigates to the profile page when Profile button is clicked", async () => {
    renderComponent();
    
    // Open the dropdown
    const dropdownButton = screen.getByRole("button", { "aria-haspopup": "true" });
    fireEvent.click(dropdownButton);
    
    // Wait for the dropdown to be visible and click the profile button
    const profileButton = await screen.findByText(/profile/i);
    fireEvent.click(profileButton);

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith("/user/profile");
  });

  it("logs out and navigates to the home page when Logout button is clicked", async () => {
    // Mock successful logout
    mockOnLogout.mockResolvedValueOnce();
    
    renderComponent();
    
    // Open the dropdown
    const dropdownButton = screen.getByRole("button", { "aria-haspopup": "true" });
    fireEvent.click(dropdownButton);
    
    // Find and click logout button
    const logoutButton = await screen.findByText(/log out/i);
    fireEvent.click(logoutButton);

    // Wait for the async actions to complete
    await waitFor(() => {
      expect(mockOnLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });
  it("closes the dropdown when clicked outside", () => {
    const { container } = renderComponent();
    const button = screen.getByRole("button", { name: /▼/i });
    
    // Open the dropdown
    fireEvent.click(button);
    expect(screen.getByText(userMock.email)).toBeInTheDocument();
    
    // Create a div outside the dropdown
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    
    // Simulate click outside
    fireEvent.mouseDown(outsideElement);
    
    // Clean up
    document.body.removeChild(outsideElement);
    
    expect(screen.queryByText(userMock.email)).not.toBeInTheDocument();
  });
  it("does not render dropdown if no user is provided", () => {
    renderComponent(null);
    expect(screen.queryByText(/▼/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /▼/i }));
    expect(screen.queryByText(/testuser@example.com/i)).not.toBeInTheDocument();
  });
});
