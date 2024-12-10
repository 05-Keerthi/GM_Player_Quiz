import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import defaultLogo from "../assets/GMI-Logo.png";
import ProfileDropdown from "../models/ProfileDropDown";
import NotificationDropdown from "../models/notificationDropdown";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [logoSrc, setLogoSrc] = useState(defaultLogo);
  const [logoError, setLogoError] = useState(false);
  const [notifications, setNotifications] = useState([]);

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
        console.log("Using default logo due to invalid tenant logo");
        setLogoSrc(defaultLogo);
      }
    } catch (error) {
      console.error("Error setting logo:", error);
      setLogoSrc(defaultLogo);
    }
  }, [user]);

  useEffect(() => {
    // Mock fetching notifications (Replace with actual API call)
    const mockNotifications = [
      { id: 1, message: "Welcome to GM Play!", isRead: false, time: "2 mins ago" },
      { id: 2, message: "Your profile is updated.", isRead: true, time: "5 hours ago" },
      { id: 3, message: "Welcome to GM Play!", isRead: false, time: "2 mins ago" },
      { id: 4, message: "Your profile is updated.", isRead: true, time: "5 hours ago" },
      { id: 5, message: "Welcome to GM Play!", isRead: false, time: "2 mins ago" },
      { id: 6, message: "Your profile is updated.", isRead: true, time: "5 hours ago" },
    ];
    setNotifications(mockNotifications);
  }, []);

  const handleLogoError = () => {
    if (!logoError) {
      setLogoError(true);
      setLogoSrc(defaultLogo);
    }
  };

  const handleNotificationClick = (id) => {
    // Mark notification as read
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
    console.log(`Notification with id ${id} clicked`);
  };

  const primaryColor = user?.tenantId?.primaryColor || "#2929FF";
  const secondaryColor = user?.tenantId?.secondaryColor || "#FFFFFF";

  const areColorsSame =
    primaryColor.toLowerCase() === secondaryColor.toLowerCase();

  const navbarStyle = {
    backgroundColor: primaryColor,
  };

  const textStyle = {
    color: areColorsSame ? getContrastColor(primaryColor) : secondaryColor,
    fontFamily: user?.tenantId?.fontFamily || "inherit",
  };

  function getContrastColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128 ? "#FFFFFF" : "#000000";
  }

  return (
    <div className="border-b-4 p-2" style={navbarStyle}>
      <div className="flex items-center h-12 p-3 gap-4 justify-between">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-10 w-10 relative bg-gray-100 rounded-full overflow-hidden cursor-pointer border-2 group transition-transform duration-200 ease-in-out hover:scale-110">
            <img
              key={logoSrc}
              src={logoSrc}
              alt={user?.tenantId?.name || "GMI"}
              className="h-full w-full object-cover"
              onClick={() => navigate("/")}
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
              {/* Notification Dropdown */}
              <NotificationDropdown
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
              />
              <ProfileDropdown user={user} onLogout={logout} />
            </>
          ) : (
            <button
              className="hover:bg-gray-200 py-1 px-2 rounded-lg bg-red-100 transition-colors duration-200"
              onClick={() => navigate("/login")}
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
