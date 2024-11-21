import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const ProfileDropdown = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".profile-dropdown")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleLogoutClick = async () => {
    try {
      await onLogout();
      setIsOpen(false);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="relative profile-dropdown">
      <button
        className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-600 text-sm">
            <FontAwesomeIcon icon={faUser} />
          </span>
        </div>
        <span
          className={`text-gray-600 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fadeIn">
          <div className="p-2">
            <div className="px-4 py-2 text-sm font-medium text-gray-700 truncate">
              {user?.email}
            </div>

            <button
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-300 hover:bg-blue-50 rounded-md transition-colors duration-200"
              onClick={() => navigate("/profile")}
            >
              <span className="text-blue-200">👤</span>
              Profile
            </button>

            <button
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
              onClick={handleLogoutClick}
            >
              <span className="text-red-600">🚪</span>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
