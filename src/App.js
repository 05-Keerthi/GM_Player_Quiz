import React from "react";
import { Routes, Route, useSearchParams, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuthContext } from "./context/AuthContext";
import NotFoundPage from "./pages/NotFoundPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/Home";
import ProfilePage from "./pages/ProfilePage";
import TenantDetailsPage from "./pages/TenantDetailsPage";
import AdminDashboard from "./pages/Activity/AdminDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

// Import Content and Session routes components
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
import DetailedReportDashboard from "./pages/Report/UserDashboard/DetailedReport";
import SessionDashboard from "./pages/Report/UserDashboard/SessionDashboard";
import Dashboard from "./pages/Report/UserDashboard/Dashboard";
import ReportAdminDashboard from "./pages/Report/AdminDashboard/ReportAdminDashboard";
import DetailedAdminReportDashboard from "./pages/Report/AdminDashboard/DetailedAdminReportDashboard";
import SessionDetails from "./pages/Report/AdminDashboard/SessionDetails";

export default function App() {
  const { user, isAuthenticated } = useAuthContext();
  const [searchParams] = useSearchParams();

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

        <Route
          path="/user/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<HomePage />} />

        <Route
          path="/tenants/:id"
          element={
            <ProtectedRoute>
              <TenantDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Content Routes */}
        <Route
          path="/selectQuizCategory"
          element={
            <ProtectedRoute>
              <SelectCategoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/selectSurveyCategory"
          element={
            <ProtectedRoute>
              <SelectSurveyCategory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/createQuiz/:quizId"
          element={
            <ProtectedRoute>
              <QuizCreator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/createSurvey/:surveyId"
          element={
            <ProtectedRoute>
              <SurveyCreator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz-list"
          element={
            <ProtectedRoute>
              <UnifiedList contentType="quiz" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/survey-list"
          element={
            <ProtectedRoute>
              <UnifiedList contentType="survey" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/details"
          element={
            <ProtectedRoute>
              <UnifiedDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/preview/:quizId"
          element={
            <ProtectedRoute>
              <PreviewPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/surveyPreview/:surveyId"
          element={
            <ProtectedRoute>
              <SurveyPreviewPage />
            </ProtectedRoute>
          }
        />

        {/* Session Routes */}
        <Route
          path="/lobby"
          element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          }
        />

        <Route
          path="/survey-lobby"
          element={
            <ProtectedRoute>
              <SurveyLobby />
            </ProtectedRoute>
          }
        />

        <Route
          path="/join"
          element={
            <ProtectedRoute>
              <UnifiedJoin type="quiz" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/joinsurvey"
          element={
            <ProtectedRoute>
              <UnifiedJoin type="survey" />
            </ProtectedRoute>
          }
        />

        <Route path="/user-lobby" element={<UserLobby />} />
        <Route path="/survey-user-lobby" element={<SurveyUserLobby />} />

        <Route
          path="/start"
          element={
            <ProtectedRoute>
              <AdminStart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/start-survey"
          element={
            <ProtectedRoute>
              <AdminSurveyStart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/play"
          element={
            <ProtectedRoute>
              <UserPlay />
            </ProtectedRoute>
          }
        />
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

        <Route
          path="/results/:sessionId"
          element={
            <ProtectedRoute>
              <SurveyResults />
            </ProtectedRoute>
          }
        />

        <Route
          path="/question-details/:sessionId/:questionId"
          element={
            <ProtectedRoute>
              <QuestionDetailsResult />
            </ProtectedRoute>
          }
        />

        {/* Report Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <ReportAdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/:type-reports/:type/:id"
          element={
            <ProtectedRoute>
              <DetailedAdminReportDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/:type-reports/:type/:id"
          element={
            <ProtectedRoute>
              <DetailedReportDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/:type/session/:sessionId"
          element={
            <ProtectedRoute>
              <SessionDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/session/:type/:sessionId"
          element={
            <ProtectedRoute>
              <SessionDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Activity-log"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Legacy Redirect Routes */}
        <Route
          path="/quiz-details"
          element={
            <ProtectedRoute>
              <UnifiedDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/survey-details"
          element={
            <ProtectedRoute>
              <UnifiedDetails />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
