import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
jest.mock('../../assets/GMI-Logo.png', () => 'default-logo-path');

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
      primaryColor: '#FF0000',
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

  test('renders authenticated state correctly', () => {
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

  test('handles logo error by falling back to default logo', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: mockAuthenticatedUser,
      logout: mockLogout
    });

    render(<Navbar />);
    
    const logoImg = screen.getByTestId('tenant-logo');
    const initialSrc = logoImg.src;
    fireEvent.error(logoImg);
    
    // Verify the src has changed from the initial value
    expect(logoImg.src).not.toBe(initialSrc);
    // Verify the new src contains our mocked default logo path
    expect(logoImg.src).toContain('default-logo-path');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('navigates to home when logo is clicked', async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: mockAuthenticatedUser,
      logout: mockLogout
    });

    render(<Navbar />);
    
    const logoContainer = screen.getByTestId('logo-container');
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
    
    await userEvent.click(screen.getByTestId('get-started-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('handles logout functionality', async () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: mockAuthenticatedUser,
      logout: mockLogout
    });

    render(<Navbar />);
    
    const logoutButton = screen.getByText('Logout');
    await userEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
  });

  test('applies correct styling based on tenant colors', () => {
    const customUser = {
      tenantId: {
        ...mockAuthenticatedUser.tenantId,
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF'
      }
    };

    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: customUser,
      logout: mockLogout
    });

    render(<Navbar />);
    
    const navbar = screen.getByTestId('navbar');
    expect(navbar).toHaveStyle({ backgroundColor: '#000000' });
  });

  test('handles missing tenant information gracefully', () => {
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: {},
      logout: mockLogout
    });

    render(<Navbar />);
    
    expect(screen.getByText('Welcome to GM Play..!')).toBeInTheDocument();
    expect(screen.getByText('Engage, learn, and have fun')).toBeInTheDocument();
  });

  test('handles invalid tenant colors gracefully', () => {
    const userWithInvalidColors = {
      tenantId: {
        ...mockAuthenticatedUser.tenantId,
        primaryColor: 'invalid-color',
      }
    };
    
    useAuthContext.mockReturnValue({
      isAuthenticated: true,
      user: userWithInvalidColors,
      logout: mockLogout
    });

    render(<Navbar />);
    const navbar = screen.getByTestId('navbar');
    expect(navbar).toHaveStyle({ backgroundColor: '#FFFFFF' });
  });
});