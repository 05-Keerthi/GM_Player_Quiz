// In Navbar.jsx

import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/GMI-Logo.png";
import ProfileDropdown from "../models/ProfileDropDown";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="border-b-4 p-2">
      <div className="flex items-center h-12 p-3 gap-4 justify-between">
        {/* Left: Logo with Welcome Message */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <img
            src={logo}
            alt="GMI"
            className="h-10 w-10 rounded-full cursor-pointer"
            onClick={() => navigate("/")}
          />
          <div>
            <h1 className="text-lg font-semibold">Welcome to GMI!</h1>
            <p className="text-sm text-gray-500">Engage, learn, and have fun</p>
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
