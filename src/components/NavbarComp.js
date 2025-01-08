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
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuthContext } from "../context/AuthContext";
// import defaultLogo from "../assets/GMI-Logo.png";
// import ProfileDropdown from "../models/ProfileDropDown";
// import NotificationDropdown from "../models/notificationDropdown";

// const Navbar = () => {
//   const navigate = useNavigate();
//   const { isAuthenticated, user, logout } = useAuthContext();
//   const [logoSrc, setLogoSrc] = useState(defaultLogo);
//   const [logoError, setLogoError] = useState(false);

//   // Logo handling
//   useEffect(() => {
//     const initializeLogo = () => {
//       setLogoError(false);
//       try {
//         const tenantLogo = user?.tenantId?.logo;
//         setLogoSrc(
//           tenantLogo &&
//             typeof tenantLogo === "string" &&
//             tenantLogo.startsWith("data")
//             ? tenantLogo
//             : defaultLogo
//         );
//       } catch (error) {
//         console.error("Error setting logo:", error);
//         setLogoSrc(defaultLogo);
//       }
//     };

//     initializeLogo();
//   }, [user]);

//   const handleLogoError = () => {
//     if (!logoError) {
//       setLogoError(true);
//       setLogoSrc(defaultLogo);
//     }
//   };

//   // Color contrast handling
//   const getContrastColor = (hexColor) => {
//     try {
//       const r = parseInt(hexColor.slice(1, 3), 16);
//       const g = parseInt(hexColor.slice(3, 5), 16);
//       const b = parseInt(hexColor.slice(5, 7), 16);
//       const brightness = (r * 299 + g * 587 + b * 114) / 1000;
//       return brightness < 128 ? "#FFFFFF" : "#000000";
//     } catch (error) {
//       console.error("Error calculating contrast color:", error);
//       return "#000000";
//     }
//   };

//   // Style configuration
//   const primaryColor = user?.tenantId?.primaryColor || "#2929FF";
//   const secondaryColor = user?.tenantId?.secondaryColor || "#FFFFFF";
//   const areColorsSame =
//     primaryColor.toLowerCase() === secondaryColor.toLowerCase();

//   const styles = {
//     navbar: {
//       backgroundColor: primaryColor,
//     },
//     text: {
//       color: areColorsSame ? getContrastColor(primaryColor) : secondaryColor,
//       fontFamily: user?.tenantId?.fontFamily || "inherit",
//     },
//   };

//   return (
//     <div className="border-b-4 p-2" style={styles.navbar}>
//       <div className="flex items-center h-12 p-3 gap-4 justify-between">
//         {/* Logo and Title Section */}
//         <div className="flex items-center gap-2 flex-shrink-0">
//           <div
//             className="h-10 w-10 relative bg-gray-100 rounded-full overflow-hidden cursor-pointer border-2 group transition-transform duration-200 ease-in-out hover:scale-110"
//             onClick={() => navigate("/")}
//           >
//             <img
//               key={logoSrc}
//               src={logoSrc}
//               alt={user?.tenantId?.name || "GMI"}
//               className="h-full w-full object-cover"
//               onError={handleLogoError}
//             />
//           </div>

//           <div>
//             <h1 className="text-lg font-semibold" style={styles.text}>
//               Welcome to {user?.tenantId?.name || "GM Play"}..!
//             </h1>
//             <p className="text-sm" style={styles.text}>
//               Engage, learn, and have fun
//             </p>
//           </div>
//         </div>

//         {/* Actions Section */}
//         <div className="flex items-center gap-4 relative">
//           {isAuthenticated && user ? (
//             <>
//               <NotificationDropdown />
//               <ProfileDropdown user={user} onLogout={logout} />
//             </>
//           ) : (
//             <button
//               onClick={() => navigate("/login")}
//               className="hover:bg-gray-200 py-1 px-2 rounded-lg bg-red-100 transition-colors duration-200"
//             >
//               Get Started
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Navbar;