import React, { useEffect } from "react";
import { Route, Routes, Navigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoginPage from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { useAuthContext } from "./context/AuthContext";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import TenantDetailsPage from "./pages/TenantDetailsPage";
import SelectCategoryPage from "./pages/SelectCategoryPage";
import PreviewPage from "./pages/Preview";
import SurveyPreviewPage from "./pages/SurveyPreview";
import QuizCreator from "./pages/quizCreator";
import Lobby from "./pages/Session/Lobby/AdminLobby";
import JoinQuiz from "./pages/Session/UserJoin/JoinQuiz";
import UserLobby from "./pages/Session/UserLobby/UserLobby";
import AdminStart from "./pages/Session/Start/AdminStart";
import UserPlay from "./pages/Session/Play/UserPlay";
import FinalLeaderboard from "./pages/Session/FinalLeaderboard";
import HomePage from "./pages/Home";
import SelectSurveyCategory from "./pages/SelectSurveyCategory";
import SurveyCreator from "./pages/SurveyCreator";
import UnifiedDetails from "./pages/UnifiedDetails";
import UnifiedList from "./pages/UnifiedList";
import SurveyLobby from "./pages/Session/Lobby/SurveyLobby";
import SurveyJoin from "./pages/Session/UserJoin/SurveyJoin";
import SurveyUserLobby from "./pages/Session/UserLobby/SurveyUserLobby";
import AdminSurveyStart from "./pages/Session/Start/AdminSurveyStart";
import UserSurveyPlay from "./pages/Session/Play/UserSurveyPlay";
import SurveyResults from "./pages/Session/Start/SurveyResults";
import QuestionDetailsResult from "./pages/Session/Start/QuestionDetailsResult";
import ActivityLogPage from "./pages/Activity/ActivityLog";
import Reports from "./pages/Report/Report";
import UserReport from "./pages/Report/UserReport";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

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
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />}
        />
        <Route path="/" element={<HomePage />} />

        {/* Protected Routes */}
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

        {/* Reports Route */}
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

        {/* Redirect routes for backward compatibility */}
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

        {/* Preview and Session Routes */}
        <Route path="/preview/:quizId" element={<PreviewPage />} />
        <Route
          path="/surveyPreview/:surveyId"
          element={<SurveyPreviewPage />}
        />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/survey-lobby" element={<SurveyLobby />} />
        <Route path="/join" element={<JoinQuiz />} />
        <Route path="/joinsurvey" element={<SurveyJoin />} />
        <Route path="/user-lobby" element={<UserLobby />} />
        <Route path="/survey-user-lobby" element={<SurveyUserLobby />} />
        <Route path="/start" element={<AdminStart />} />
        <Route path="/play" element={<UserPlay />} />

        <Route path="/start-survey" element={<AdminSurveyStart />} />
        <Route
          path="/question-details/:sessionId/:questionId"
          element={<QuestionDetailsResult />}
        />
        <Route path="/results/:sessionId" element={<SurveyResults />} />
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
        <Route path="/Activity-log" element={<ActivityLogPage />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
