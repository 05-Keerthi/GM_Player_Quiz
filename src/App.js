import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
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
import QuizList from './components/QuizList';

import QuizCreator from "./pages/quizCreator";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default function App() {
  const { isAuthenticated } = useAuthContext();

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
        <Route 
            path="/quizzes" 
            element={
              
                <QuizList />
          
            } 
          />
        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
