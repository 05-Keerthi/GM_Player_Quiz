import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSessionContext } from "../../../context/sessionContext";
import { useSurveySessionContext } from "../../../context/surveySessionContext";
import { useAuthContext } from "../../../context/AuthContext";
import { Loader2, X } from "lucide-react";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="relative w-full max-w-md bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
        {children}
      </div>
    </div>
  );
};

const GuestForm = ({ guestData, onChange, error }) => (
  <div className="p-6 space-y-4">
    <h2 className="text-xl font-bold text-center mb-4">Enter Guest Details</h2>
    <div className="space-y-4">
      <input
        type="text"
        name="username"
        value={guestData.username}
        onChange={onChange}
        placeholder="Username"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <input
        type="email"
        name="email"
        value={guestData.email}
        onChange={onChange}
        placeholder="Email"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <input
        type="tel"
        name="mobile"
        value={guestData.mobile}
        onChange={onChange}
        placeholder="Mobile (10 digits)"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    {error && (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    )}
  </div>
);

const UnifiedJoin = ({ type = "quiz" }) => {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestData, setGuestData] = useState({
    username: "",
    email: "",
    mobile: "",
  });

  const { joinSession, loading: quizLoading } = useSessionContext();
  const { joinSurveySession, loading: surveyLoading } =
    useSurveySessionContext();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = !!user;
  const loading = type === "quiz" ? quizLoading : surveyLoading;
  const isSurvey = type === "survey";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeFromUrl = params.get("code");
    if (codeFromUrl) {
      setJoinCode(codeFromUrl.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6));
    }
  }, [location]);

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (mobile) => {
    return /^\d{10}$/.test(mobile.replace(/[^\d]/g, ""));
  };

  const validateGuestData = () => {
    if (
      !guestData.username.trim() ||
      !guestData.email.trim() ||
      !guestData.mobile.trim()
    ) {
      setError("All fields are required");
      return false;
    }
    if (!isValidEmail(guestData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!isValidPhone(guestData.mobile)) {
      setError("Please enter a valid phone number");
      return false;
    }
    return true;
  };

  const cacheQuizData = (sessionData) => {
    const quizInfo = {
      title: sessionData.quiz.title,
      description: sessionData.quiz.description,
      questions: sessionData.quiz.questions,
      slides: sessionData.quiz.slides || [],
      categories: sessionData.quiz.categories || [],
      order: sessionData.quiz.order || [],
      status: sessionData.status,
    };

    // Store in both sessionStorage and localStorage
    sessionStorage.setItem("quizData", JSON.stringify(quizInfo));
    localStorage.setItem(
      "quiz_session_data",
      JSON.stringify({
        data: quizInfo,
        timestamp: Date.now(),
        sessionId: sessionData._id,
      })
    );
  };

  const cacheSurveyData = (sessionData) => {
    const surveyInfo = {
      title: sessionData.surveyQuiz.title,
      description: sessionData.surveyQuiz.description,
      categories: sessionData.surveyQuiz.categories || [],
      slides: sessionData.surveyQuiz.slides || [],
      questions: sessionData.surveyQuiz.questions || [],
      order: sessionData.surveyQuiz.order || [],
      status: sessionData.status,
    };

    // Store in both sessionStorage and localStorage
    sessionStorage.setItem("surveyData", JSON.stringify(surveyInfo));
    localStorage.setItem(
      "survey_session_data",
      JSON.stringify({
        data: surveyInfo,
        timestamp: Date.now(),
        sessionId: sessionData._id,
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!joinCode.trim()) {
      setError("Please enter a Game PIN");
      return;
    }

    if (isSurvey && !isAuthenticated && !showGuestForm) {
      setShowGuestForm(true);
      return;
    }

    try {
      let response;

      if (isSurvey) {
        if (!isAuthenticated && !validateGuestData()) {
          return;
        }

        response = await joinSurveySession(joinCode, {
          isGuest: !isAuthenticated,
          ...(!isAuthenticated && guestData),
        });

        if (response.session?.surveyQuiz) {
          cacheSurveyData(response.session);
        }
      } else {
        response = await joinSession(joinCode);
        if (response.session?.quiz) {
          cacheQuizData(response.session);
        }
      }

      if (response.session) {
        const baseUrl = isSurvey ? "survey-user-lobby" : "user-lobby";
        navigate(
          `/${baseUrl}?code=${joinCode}&sessionId=${response.session._id}`
        );
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message;

      if (errorMessage?.includes("Already joined")) {
        const sessionId = err.response?.data?.session?._id;

        if (isSurvey) {
          const surveyData = err.response?.data?.session?.surveyQuiz;
          if (sessionId && surveyData) {
            cacheSurveyData(err.response.data.session);
            navigate(
              `/survey-user-lobby?code=${joinCode}&sessionId=${sessionId}`
            );
            return;
          }
        } else {
          const quizData = err.response?.data?.session?.quiz;
          if (sessionId && quizData) {
            cacheQuizData(err.response.data.session);
            navigate(`/user-lobby?code=${joinCode}&sessionId=${sessionId}`);
            return;
          }
        }
      }

      setError(errorMessage || "Invalid Game PIN");
    }
  };

  const handleGuestDataChange = (e) => {
    const { name, value } = e.target;
    setGuestData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmitGuestForm = async () => {
    if (validateGuestData()) {
      await handleSubmit({ preventDefault: () => {} });
    }
  };

  const isSubmitDisabled = () => {
    return loading || joinCode.length < 6;
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
                  setJoinCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6))
                }
                placeholder="Game PIN"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-3xl tracking-wider"
                maxLength={6}
              />
            </div>

            {error && !showGuestForm && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitDisabled()}
              className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Joining...
                </>
              ) : isSurvey && !isAuthenticated ? (
                "Join as Guest"
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

      <Modal
        isOpen={showGuestForm}
        onClose={() => {
          setShowGuestForm(false);
          setError("");
        }}
      >
        <GuestForm
          guestData={guestData}
          onChange={handleGuestDataChange}
          error={error}
        />
        <div className="p-6 pt-0">
          <button
            onClick={handleSubmitGuestForm}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default UnifiedJoin;
