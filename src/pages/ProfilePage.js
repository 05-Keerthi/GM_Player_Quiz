import React, { useState, useEffect, useMemo } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../components/NavbarComp";
import { useUserContext } from "../context/userContext";

export const ProfilePage = () => {
  const { getProfile, logout } = useAuthContext();
  const { updateUser, changePassword } = useUserContext();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Password state with direct input handling
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // New state for inline errors
  const [updateError, setUpdateError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const fetchedProfile = await getProfile();

        if (isMounted) {
          if (fetchedProfile) {
            setProfileData(fetchedProfile);
            setError(null);
          } else {
            throw new Error("No profile data received");
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Profile fetch error:", error);

          if (error.response) {
            switch (error.response.status) {
              case 401:
                await logout();
                navigate("/login");
                break;
              case 403:
                setError("You do not have permission to access this profile.");
                break;
              case 404:
                setError("User profile not found.");
                break;
              default:
                setError("An unexpected error occurred. Please try again.");
            }
          } else {
            setError(
              error.message || "Network error. Please check your connection."
            );
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear any existing update error when user starts typing
    setUpdateError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      setUpdateError(null);
      const updateData = {
        username: profileData.username,
        mobile: profileData.mobile,
      };

      const updatedUser = await updateUser(profileData._id, updateData);
      setProfileData(updatedUser);
    } catch (error) {
      console.error("Update profile error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update profile.";

      setUpdateError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match!");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long!");
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword(oldPassword, newPassword);

      // Clear password fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);

      // Add toast notification
      toast.success("Password changed successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to change password";
      setPasswordError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div
            data-testid="loading-spinner"
            className="animate-spin rounded-full h-16 w-16 md:h-32 md:w-32 border-t-2 border-b-2 border-blue-500"
          ></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="container mx-auto px-4 py-8 text-center">
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto"
            role="alert"
          >
            <strong className="font-bold block mb-2">Error: </strong>
            <span className="block mb-4">{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (!profileData) {
      return (
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md mx-auto">
            No profile data available. Please try logging in again.
          </div>
        </div>
      );
    }

    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
              Profile Settings
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* User Information Section */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-lg font-bold mb-4">User Information</h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="username"
                      className="block font-medium mb-2"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={profileData?.username || ""}
                      onChange={handleInputChange}
                      className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData?.email || ""}
                      onChange={handleInputChange}
                      className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      disabled
                    />
                  </div>
                  <div>
                    <label htmlFor="mobile" className="block font-medium mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      value={profileData?.mobile || ""}
                      onChange={handleInputChange}
                      className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>
              </div>

              {/* Account Details Section */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-lg font-bold mb-4">Account Details</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="role" className="block font-medium mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      id="role"
                      name="role"
                      value={profileData?.role || ""}
                      onChange={handleInputChange}
                      className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            {updateError && (
              <div className="max-w-4xl mx-auto mt-4 text-red-500 text-sm">
                {updateError}
              </div>
            )}

            <div className="flex justify-center md:justify-end mt-6 md:mt-8">
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full md:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors duration-300"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          {/* Password Change Form */}
          <form
            onSubmit={handlePasswordSubmit}
            className="max-w-4xl mx-auto mt-8"
          >
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="oldPassword"
                    className="block font-medium mb-2"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="oldPassword"
                    name="oldPassword"
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block font-medium mb-2"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block font-medium mb-2"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {passwordError && (
                <div className="text-red-500 text-sm mt-4">{passwordError}</div>
              )}

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors duration-300"
                >
                  {isChangingPassword
                    ? "Changing Password..."
                    : "Change Password"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </>
    );
  }, [
    profileData,
    isLoading,
    isUpdating,
    error,
    oldPassword,
    newPassword,
    confirmPassword,
    isChangingPassword,
    updateError,
    passwordError,
  ]);

  return renderContent;
};
