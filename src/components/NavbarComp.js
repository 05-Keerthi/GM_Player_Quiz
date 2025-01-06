import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import ProfileDropDown from '../models/ProfileDropDown';
import NotificationDropdown from '../models/notificationDropdown';
import defaultLogo from '../assets/GMI-Logo.png';

const NavbarComp = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthContext();
  const [logoSrc, setLogoSrc] = useState(user?.tenantId?.logo || defaultLogo);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleLogoError = () => {
    setLogoSrc(defaultLogo);
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  const defaultColor = '#FFFFFF';
  const defaultFontFamily = 'Arial';

  const isValidColor = (color) => {
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  };

  return (
    <nav
      data-testid="navbar"
      style={{
        backgroundColor: isValidColor(user?.tenantId?.primaryColor) ? user?.tenantId?.primaryColor : defaultColor,
        fontFamily: user?.tenantId?.fontFamily || defaultFontFamily
      }}
      className="w-full shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 cursor-pointer" 
              onClick={handleLogoClick}
              data-testid="logo-container"
            >
              <img
                data-testid="tenant-logo"
                src={logoSrc}
                alt={user?.tenantId?.name || 'GM Play'}
                className="h-8 w-auto"
                onError={handleLogoError}
              />
            </div>
            <div className="ml-4">
              <h1 className="text-white text-lg">
                {isAuthenticated
                  ? `Welcome to ${user?.tenantId?.name || 'GM Play'}..!`
                  : 'Welcome to GM Play..!'}
              </h1>
              <p className="text-white text-sm">
                Engage, learn, and have fun
              </p>
            </div>
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <>
                <NotificationDropdown />
                <ProfileDropDown user={user} onLogout={logout} />
              </>
            ) : (
              <button
                onClick={handleGetStarted}
                className="bg-white text-blue-600 px-4 py-2 rounded-md"
                data-testid="get-started-button"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarComp;