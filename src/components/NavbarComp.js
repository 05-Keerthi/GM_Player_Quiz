import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useUserContext } from "../context/userContext";
import ProfileDropdown from "../models/ProfileDropDown";
import NotificationDropdown from "../models/notificationDropdown";
import DefaultLogo from "../assets/GMI-Logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser, logout } = useAuthContext();
  const { fetchUserById, currentUser } = useUserContext();

  // Local state for UI elements
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoSrc, setLogoSrc] = useState(DefaultLogo);

  // Fetch user data when auth state changes
  useEffect(() => {
    let isMounted = true;

    const getUserData = async () => {
      if (!isAuthenticated || !(authUser?._id || authUser?.id)) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        await fetchUserById(authUser._id || authUser.id);
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching user data:", err);
          setError(err.message || "Failed to load user data");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getUserData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, authUser?.id]);

  // Update logo source when user data changes
  useEffect(() => {
    if (currentUser?.tenantId) {
      setLogoSrc(
        currentUser.tenantId.customLogo ||
          currentUser.tenantId.logo ||
          DefaultLogo
      );
    } else {
      setLogoSrc(DefaultLogo);
    }
  }, [currentUser]);

  const handleLogoError = () => {
    setLogoSrc(DefaultLogo);
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleGetStarted = () => {
    navigate("/login");
  };

  return (
    <>
      {/* Fixed navbar wrapper */}
      <div className="h-20 w-full" />
      <div
        data-testid="navbar"
        className="fixed top-0 left-0 right-0 border-b-4 p-2 z-50"
        style={{
          backgroundColor: currentUser?.tenantId?.primaryColor || "#2929FF",
          opacity: isLoading ? 0.8 : 1,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        <div className="flex items-center h-12 p-3 gap-4 justify-between">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="h-10 w-10 relative bg-gray-100 rounded-full overflow-hidden cursor-pointer border-2 group transition-transform duration-200 ease-in-out hover:scale-110"
              onClick={handleLogoClick}
            >
              <img
                src={logoSrc}
                alt={currentUser?.tenantId?.name || "GMI"}
                className="h-full w-full object-cover"
                onError={handleLogoError}
              />
            </div>
            <div>
              <h1
                className="text-lg font-semibold"
                style={{
                  color: currentUser?.tenantId?.secondaryColor || "#FFFFFF",
                  fontFamily: currentUser?.tenantId?.fontFamily || "Arial",
                }}
              >
                Welcome to {currentUser?.tenantId?.name || "GM Play"}..!
              </h1>
              <p
                className="text-sm"
                style={{
                  color: currentUser?.tenantId?.secondaryColor || "#FFFFFF",
                  fontFamily: currentUser?.tenantId?.fontFamily || "Arial",
                }}
              >
                {error ? "Error loading data" : "Engage, learn, and have fun"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 relative">
            {isAuthenticated ? (
              <>
                <NotificationDropdown />
                <ProfileDropdown
                  user={currentUser}
                  onLogout={logout}
                  isLoading={isLoading}
                />
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
    </>
  );
};

export default Navbar;
