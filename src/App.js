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
import QuizCreator from "./pages/quizCreator";
import AdminStart from "./pages/Session/AdminStart";
import UserPlay from "./pages/Session/UserPlay";
import FinalLeaderboard from "./pages/Session/FinalLeaderboard";
import HomePage from "./pages/Home";
import SelectSurveyCategory from "./pages/SelectSurveyCategory";
import SurveyCreator from "./pages/SurveyCreator";
import UnifiedList from "./components/UnifiedList";
import UnifiedDetails from "./pages/UnifiedDetails";
import UnifiedAdminLobby from "./pages/Session/UnifiedAdminLobby";
import UnifiedUserLobby from "./pages/Session/UnifiedUserLobby";
import UnifiedJoin from "./pages/Session/unifiedJoin";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default function App() {
  const { user, isAuthenticated, sessionExpired, setSessionExpired } =
    useAuthContext();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (sessionExpired) {
      toast.error("Your session has expired. Please log in again.");

      setSessionExpired(false);
    }
  }, [sessionExpired]);

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
        <Route path="/select-category" element={<SelectCategoryPage />} />
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
        {/* Add new PreviewPage route */}
        <Route path="/preview/:quizId" element={<PreviewPage />} />{" "}
        <Route path="/admin-lobby" element={<UnifiedAdminLobby />} />
        <Route path="/join" element={<UnifiedJoin />} />
        <Route path="/lobby" element={<UnifiedUserLobby />} />
        <Route path="/start" element={<AdminStart />} />
        <Route path="/play" element={<UserPlay />} />
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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
