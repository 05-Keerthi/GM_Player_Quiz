import React, { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoginPage from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { useAuthContext } from "./context/AuthContext";
import Home from "./pages/Home";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import TenantDetailsPage from "./pages/TenantDetailsPage";
import SelectCategoryPage from "./pages/SelectCategoryPage";
import QuizList from "./components/QuizList";

import QuizCreator from "./pages/quizCreator";
import QuizDetails from "./pages/QuizDetails";
import Lobby from "./pages/Session/AdminLobby";
import JoinQuiz from "./pages/Session/JoinQuiz";
import UserLobby from "./pages/Session/UserLobby";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default function App() {
  const { isAuthenticated, sessionExpired, setSessionExpired } =
    useAuthContext();

  useEffect(() => {
    if (sessionExpired) {
      // Show your preferred notification method (toast, modal, etc.)
      toast.error("Your session has expired. Please log in again.");
      // Or use your modal system
      setSessionExpired(false); // Reset the state after showing the message
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
        {/* Home is now public */}
        <Route path="/" element={<Home />} />
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

        {/* Admin routes */}
        <Route path="/quiz-details" element={<QuizDetails />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/join" element={<JoinQuiz />} />
        <Route path="/user-lobby" element={<UserLobby />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
