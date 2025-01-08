import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import ProfileDropdown from '../models/ProfileDropDown';
import NotificationDropdown from '../models/notificationDropdown';
import DefaultLogo from '../assets/GMI-Logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthContext();
  const [logoSrc, setLogoSrc] = useState(user?.tenantId?.logo || DefaultLogo);

  const handleLogoError = () => {
    setLogoSrc(DefaultLogo);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div 
      data-testid="navbar"
      className="border-b-4 p-2"
      style={{ backgroundColor: user?.tenantId?.primaryColor || '#2929FF' }}
    >
      <div className="flex items-center h-12 p-3 gap-4 justify-between">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div 
            className="h-10 w-10 relative bg-gray-100 rounded-full overflow-hidden cursor-pointer border-2 group transition-transform duration-200 ease-in-out hover:scale-110"
            onClick={handleLogoClick}
          >
            <img
              src={logoSrc}
              alt={user?.tenantId?.name || "GMI"}
              className="h-full w-full object-cover"
              onError={handleLogoError}
            />
          </div>
          <div>
            <h1 
              className="text-lg font-semibold"
              style={{ 
                color: user?.tenantId?.secondaryColor || '#FFFFFF',
                fontFamily: user?.tenantId?.fontFamily || 'Arial'
              }}
            >
              Welcome to {user?.tenantId?.name || "GM Play"}..!
            </h1>
            <p 
              className="text-sm"
              style={{ 
                color: user?.tenantId?.secondaryColor || '#FFFFFF',
                fontFamily: user?.tenantId?.fontFamily || 'Arial'
              }}
            >
              Engage, learn, and have fun
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 relative">
          {isAuthenticated ? (
            <>
              <NotificationDropdown />
              <ProfileDropdown user={user} onLogout={logout} />
            </>
          ) : (
            <button
              onClick={handleGetStarted}
              className="px-4 py-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;