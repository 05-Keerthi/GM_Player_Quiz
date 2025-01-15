import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSurveySessionContext } from "../../../context/surveySessionContext";
import { useAuthContext } from "../../../context/AuthContext";
import { Loader2 } from "lucide-react";

const SurveyJoin = () => {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [guestData, setGuestData] = useState({
    username: "",
    email: "",
    mobile: "",
  });

  const { joinSurveySession, loading } = useSurveySessionContext();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = !!user;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeFromUrl = params.get("code");
    if (codeFromUrl) {
      setJoinCode(codeFromUrl.replace(/\D/g, "").slice(0, 6));
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!joinCode.trim()) {
      setError("Please enter a Game PIN");
      return;
    }

    try {
      let response;
      if (!isAuthenticated) {
        // Guest user validation
        if (
          !guestData.username.trim() ||
          !guestData.email.trim() ||
          !guestData.mobile.trim()
        ) {
          setError("All fields are required");
          return;
        }
        if (!isValidEmail(guestData.email)) {
          setError("Please enter a valid email address");
          return;
        }
        if (!isValidPhone(guestData.mobile)) {
          setError("Please enter a valid phone number");
          return;
        }

        // Join as guest
        response = await joinSurveySession(joinCode, {
          isGuest: true,
          ...guestData,
        });
      } else {
        // Join as authenticated user
        response = await joinSurveySession(joinCode, {});
      }

      if (response.session) {
        navigate(
          `/survey-user-lobby?code=${joinCode}&sessionId=${response.session._id}`
        );
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join session");
    }
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (mobile) => {
    return /^\d{10}$/.test(mobile.replace(/[^\d]/g, ""));
  };

  const handleGuestDataChange = (e) => {
    const { name, value } = e.target;
    setGuestData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-center">Ready to join?</h1>
          <p className="text-gray-600 text-center mt-2 mb-6">
            Enter your game PIN below
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Game PIN"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-3xl tracking-wider"
                maxLength={6}
              />
            </div>

            {!isAuthenticated && (
              <div className="space-y-4">
                <input
                  type="text"
                  name="username"
                  value={guestData.username}
                  onChange={handleGuestDataChange}
                  placeholder="Username"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="email"
                  name="email"
                  value={guestData.email}
                  onChange={handleGuestDataChange}
                  placeholder="Email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="tel"
                  name="mobile"
                  value={guestData.mobile}
                  onChange={handleGuestDataChange}
                  placeholder="Mobile (10 digits)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                joinCode.length < 6 ||
                (!isAuthenticated &&
                  (!guestData.username ||
                    !guestData.email ||
                    !guestData.mobile))
              }
              className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join"
              )}
            </button>
          </form>
        </div>

        <div className="border-t border-gray-200 p-4">
          <p className="text-sm text-gray-500 text-center">
            Game PINs are 6 digits long
          </p>
        </div>
      </div>
    </div>
  );
};

export default SurveyJoin;
