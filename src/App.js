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
import QuizList from "./components/QuizList";
import PreviewPage from "./pages/Preview";
import QuizCreator from "./pages/quizCreator";
import QuizDetails from "./pages/QuizDetails";
import Lobby from "./pages/Session/AdminLobby";
import JoinQuiz from "./pages/Session/JoinQuiz";
import UserLobby from "./pages/Session/UserLobby";
import AdminStart from "./pages/Session/AdminStart";
import UserPlay from "./pages/Session/UserPlay";
import FinalLeaderboard from "./pages/Session/FinalLeaderboard";
<<<<<<< HEAD
<<<<<<< HEAD
import SurveyPage from "./pages/SurveyPage";
=======
import HomePage from "./pages/Home";

>>>>>>> 900ff0f7f564742ded6531bdc00d159175d56b21
=======
import HomePage from "./pages/Home";

>>>>>>> 900ff0f7f564742ded6531bdc00d159175d56b21

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
        <Route path="/createQuiz/:quizId" element={<QuizCreator />} />
        <Route path="/quizzes" element={<QuizList />} />
        {/* Add new PreviewPage route */}
        <Route path="/preview/:quizId" element={<PreviewPage />} />{" "}
        {/* New path */}
        {/* Admin routes */}
        <Route path="/quiz-details" element={<QuizDetails />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/join" element={<JoinQuiz />} />
        <Route path="/user-lobby" element={<UserLobby />} />
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
<<<<<<< HEAD
<<<<<<< HEAD
        <Route path="survey" element={<SurveyPage />} />
=======
    
>>>>>>> 900ff0f7f564742ded6531bdc00d159175d56b21
=======
    
>>>>>>> 900ff0f7f564742ded6531bdc00d159175d56b21
        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
