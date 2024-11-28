import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import defaultLogo from "../assets/GMI-Logo.png";
import ProfileDropdown from "../models/ProfileDropDown";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [logoSrc, setLogoSrc] = useState(defaultLogo);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
    console.log("Current user data:", user);

    try {
      const tenantLogo = user?.tenantId?.logo;
      console.log("Tenant logo URL:", tenantLogo);

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

  const handleLogoError = (e) => {
    console.error("Logo loading failed:", {
      attemptedSrc: e.target.src,
      tenantId: user?.tenantId?._id,
      tenantName: user?.tenantId?.name,
      fallbackAvailable: !!defaultLogo,
    });

    if (!logoError) {
      setLogoError(true);
      setLogoSrc(defaultLogo);
    }
  };

  // Custom styling based on tenant configuration
  const navbarStyle = {
    backgroundColor: user?.tenantId?.primaryColor || "#2929FF",
  };

  const textStyle = {
    color: user?.tenantId?.secondaryColor || "#FFFFFF",
    fontFamily: user?.tenantId?.fontFamily || "inherit",
  };

  return (
    <div className="border-b-4 p-2" style={navbarStyle}>
      <div className="flex items-center h-12 p-3 gap-4 justify-between">
        {/* Left: Logo with Welcome Message */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-10 w-10 relative bg-gray-100 rounded-full overflow-hidden">
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
            <p className="text-sm text-gray-500" style={textStyle}>
              Engage, learn, and have fun
            </p>
          </div>
        </div>

        {/* Right: Authentication Conditional Rendering */}
        <div className="flex items-center gap-4 relative">
          {isAuthenticated ? (
            <ProfileDropdown user={user} onLogout={logout} />
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
