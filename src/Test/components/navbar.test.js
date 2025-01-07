import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../../components/NavbarComp';
import { useAuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

// Mock the logo import
jest.mock('../../assets/GMI-Logo.png', () => 'mocked-default-logo.png');

// Mock child components
jest.mock('../../models/ProfileDropDown', () => {
  return function MockProfileDropdown({ user, onLogout }) {
    return (
      <div data-testid="profile-dropdown">
        <button onClick={onLogout}>Logout</button>
      </div>
    );
  };
});

jest.mock('../../models/notificationDropdown', () => {
  return function MockNotificationDropdown() {
    return <div data-testid="notification-dropdown">Notifications</div>;
  };
});

describe('Navbar', () => {
  const mockNavigate = jest.fn();
  const mockLogout = jest.fn();
  
  const mockAuthenticatedUser = {
    tenantId: {
      name: 'Test Tenant',
      logo: 'data:image/png;base64,test',
      primaryColor: '#2929FF',
      secondaryColor: '#FFFFFF',
      fontFamily: 'Arial'
    }
  };

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    jest.clearAllMocks();
  });

  test('renders unauthenticated state correctly', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout
    });

    render(<Navbar />);

    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-dropdown')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
  });

  test('renders authenticated state correctly', async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: mockAuthenticatedUser,
      logout: mockLogout
    });

    render(<Navbar />);

    expect(screen.getByText(`Welcome to ${mockAuthenticatedUser.tenantId.name}..!`)).toBeInTheDocument();
    expect(screen.getByTestId('profile-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
  });

  test('handles logo error and falls back to default logo', async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: mockAuthenticatedUser,
      logout: mockLogout
    });

    render(<Navbar />);
    
    const logoImg = screen.getByAltText(mockAuthenticatedUser.tenantId.name || "GMI");
    fireEvent.error(logoImg);
    
    await waitFor(() => {
      const updatedLogoSrc = logoImg.getAttribute('src');
      expect(updatedLogoSrc).toBe('mocked-default-logo.png');
    });
  });

  test('navigates to home when logo container is clicked', async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: mockAuthenticatedUser,
      logout: mockLogout
    });

    render(<Navbar />);
    
    const logoContainer = screen.getByAltText(mockAuthenticatedUser.tenantId.name || "GMI").parentElement;
    await userEvent.click(logoContainer);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('navigates to login page when Get Started is clicked', async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout
    });

    render(<Navbar />);
    
    const getStartedButton = screen.getByText('Get Started');
    await userEvent.click(getStartedButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('applies correct tenant colors', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: mockAuthenticatedUser,
      logout: mockLogout
    });

    render(<Navbar />);
    
    const navbar = screen.getByTestId('navbar');
    expect(navbar).toHaveStyle({ backgroundColor: mockAuthenticatedUser.tenantId.primaryColor });
  });

  test('handles missing tenant colors gracefully', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: { tenantId: { name: 'Test Tenant' } },
      logout: mockLogout
    });

    render(<Navbar />);
    
    const navbar = screen.getByTestId('navbar');
    expect(navbar).toHaveStyle({ backgroundColor: '#2929FF' }); // Default color
  });

  test('handles contrast color calculation correctly', () => {
    const userWithDarkColor = {
      tenantId: {
        ...mockAuthenticatedUser.tenantId,
        primaryColor: '#000000',
        secondaryColor: '#000000' // Same colors to trigger contrast calculation
      }
    };

    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: userWithDarkColor,
      logout: mockLogout
    });

    render(<Navbar />);
    
    const welcomeText = screen.getByText(/Welcome to/);
    const computedStyles = window.getComputedStyle(welcomeText);
  });
});