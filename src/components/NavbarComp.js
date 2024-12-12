// NavbarComp.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useNotificationContext } from "../context/notificationContext";
import defaultLogo from "../assets/GMI-Logo.png";
import ProfileDropdown from "../models/ProfileDropDown";
import NotificationDropdown from "../models/notificationDropdown";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthContext();
  const { getNotificationsByUserId } = useNotificationContext();
  const navigate = useNavigate();
  const [logoSrc, setLogoSrc] = useState(defaultLogo);
  const [logoError, setLogoError] = useState(false);

  // Fetch notifications when user is authenticated
  useEffect(() => {
         getNotificationsByUserId(user._id);
  }, [isAuthenticated, user]);

  useEffect(() => {
    setLogoError(false);
    try {
      const tenantLogo = user?.tenantId?.logo;

      if (
        tenantLogo &&
        typeof tenantLogo === "string" &&
        tenantLogo.startsWith("data")
      ) {
        setLogoSrc(tenantLogo);
      } else {
        setLogoSrc(defaultLogo);
      }
    } catch (error) {
      console.error("Error setting logo:", error);
      setLogoSrc(defaultLogo);
    }
  }, [user]);

  const handleLogoError = () => {
    if (!logoError) {
      setLogoError(true);
      setLogoSrc(defaultLogo);
    }
  };

  const getContrastColor = (hexColor) => {
    try {
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128 ? "#FFFFFF" : "#000000";
    } catch (error) {
      console.error("Error calculating contrast color:", error);
      return "#000000";
    }
  };

  const primaryColor = user?.tenantId?.primaryColor || "#2929FF";
  const secondaryColor = user?.tenantId?.secondaryColor || "#FFFFFF";
  const areColorsSame = primaryColor.toLowerCase() === secondaryColor.toLowerCase();

  const navbarStyle = {
    backgroundColor: primaryColor,
  };

  const textStyle = {
    color: areColorsSame ? getContrastColor(primaryColor) : secondaryColor,
    fontFamily: user?.tenantId?.fontFamily || "inherit",
  };

  return (
    <div className="border-b-4 p-2" style={navbarStyle}>
      <div className="flex items-center h-12 p-3 gap-4 justify-between">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="h-10 w-10 relative bg-gray-100 rounded-full overflow-hidden cursor-pointer border-2 group transition-transform duration-200 ease-in-out hover:scale-110"
            onClick={() => navigate("/")}
          >
            <img
              key={logoSrc}
              src={logoSrc}
              alt={user?.tenantId?.name || "GMI"}
              className="h-full w-full object-cover"
              onError={handleLogoError}
            />
          </div>

          <div>
            <h1 className="text-lg font-semibold" style={textStyle}>
              Welcome to {user?.tenantId?.name || "GM Play"}..!
            </h1>
            <p className="text-sm" style={textStyle}>
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
              onClick={() => navigate("/login")}
              className="hover:bg-gray-200 py-1 px-2 rounded-lg bg-red-100 transition-colors duration-200"
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