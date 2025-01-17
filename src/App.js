import React, { useEffect } from "react";
import { Routes, Route, useSearchParams, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuthContext } from "./context/AuthContext";
import NotFoundPage from "./pages/NotFoundPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/Home";
import ProfilePage from "./pages/ProfilePage";
import TenantDetailsPage from "./pages/TenantDetailsPage";
import Reports from "./pages/Report/Report";
import UserReport from "./pages/Report/UserReport";
import ActivityLogPage from "./pages/Activity/ActivityLog";
import ProtectedRoute from "./routes/ProtectedRoute";

// Import all necessary components for Content and Session routes
import SelectCategoryPage from "./pages/SelectCategoryPage";
import SelectSurveyCategory from "./pages/SelectSurveyCategory";
import QuizCreator from "./pages/quizCreator";
import SurveyCreator from "./pages/SurveyCreator";
import UnifiedList from "./pages/UnifiedList";
import UnifiedDetails from "./pages/UnifiedDetails";
import PreviewPage from "./pages/Preview";
import SurveyPreviewPage from "./pages/SurveyPreview";
import Lobby from "./pages/Session/Lobby/AdminLobby";
import SurveyLobby from "./pages/Session/Lobby/SurveyLobby";
import UserLobby from "./pages/Session/UserLobby/UserLobby";
import SurveyUserLobby from "./pages/Session/UserLobby/SurveyUserLobby";
import AdminStart from "./pages/Session/Start/AdminStart";
import AdminSurveyStart from "./pages/Session/Start/AdminSurveyStart";
import UserPlay from "./pages/Session/Play/UserPlay";
import UserSurveyPlay from "./pages/Session/Play/UserSurveyPlay";
import UnifiedJoin from "./pages/Session/UserJoin/UnifiedJoin";
import FinalLeaderboard from "./pages/Session/FinalLeaderboard";
import SurveyResults from "./pages/Session/Start/SurveyResults";
import QuestionDetailsResult from "./pages/Session/Start/QuestionDetailsResult";

export default function App() {
  const { user, isAuthenticated, sessionExpired, resetSessionState } =
    useAuthContext();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (sessionExpired) {
      toast.error("Your session has expired. Please log in again.");
      resetSessionState();
    }
  }, [sessionExpired, resetSessionState]);

  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />}
        />

        {/* Core Routes */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/user/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants/:id"
          element={
            <ProtectedRoute>
              <TenantDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Content Routes */}
        <Route path="/selectQuizCategory" element={<SelectCategoryPage />} />
        <Route
          path="/selectSurveyCategory"
          element={<SelectSurveyCategory />}
        />
        <Route path="/createQuiz/:quizId" element={<QuizCreator />} />
        <Route path="/createSurvey/:surveyId" element={<SurveyCreator />} />
        <Route path="/quiz-list" element={<UnifiedList contentType="quiz" />} />
        <Route
          path="/survey-list"
          element={<UnifiedList contentType="survey" />}
        />
        <Route path="/details" element={<UnifiedDetails />} />
        <Route path="/preview/:quizId" element={<PreviewPage />} />
        <Route
          path="/surveyPreview/:surveyId"
          element={<SurveyPreviewPage />}
        />

        {/* Session Routes */}
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/survey-lobby" element={<SurveyLobby />} />
        <Route
          path="/join"
          element={
            <ProtectedRoute>
              <UnifiedJoin type="quiz" />
            </ProtectedRoute>
          }
        />
        <Route path="/joinsurvey" element={<UnifiedJoin type="survey" />} />
        <Route path="/user-lobby" element={<UserLobby />} />
        <Route path="/survey-user-lobby" element={<SurveyUserLobby />} />
        <Route path="/start" element={<AdminStart />} />
        <Route path="/start-survey" element={<AdminSurveyStart />} />
        <Route path="/play" element={<UserPlay />} />
        <Route path="/survey-play" element={<UserSurveyPlay />} />
        <Route
          path="/leaderboard"
          element={
            <FinalLeaderboard
              sessionId={searchParams.get("sessionId")}
              userId={user?.id}
              isAdmin={searchParams.get("isAdmin") === "true"}
            />
          }
        />
        <Route path="/results/:sessionId" element={<SurveyResults />} />
        <Route
          path="/question-details/:sessionId/:questionId"
          element={<QuestionDetailsResult />}
        />

        {/* Report Routes */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/userreports/:userId"
          element={
            <ProtectedRoute>
              <UserReport />
            </ProtectedRoute>
          }
        />
        <Route path="/Activity-log" element={<ActivityLogPage />} />

        {/* Legacy Redirect Routes */}
        <Route
          path="/quiz-details"
          element={
            <Navigate
              to={(location) => ({
                pathname: "/details",
                search: `type=quiz&${location.search.substring(1)}`,
              })}
              replace
            />
          }
        />
        <Route
          path="/survey-details"
          element={
            <Navigate
              to={(location) => ({
                pathname: "/details",
                search: `type=survey&${location.search.substring(1)}`,
              })}
              replace
            />
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
