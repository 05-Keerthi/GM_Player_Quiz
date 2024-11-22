// App.js
import React, { useContext } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoginPage from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AuthContext } from "./context/AuthContext";
import Home from "./pages/Home";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />}
        />
        <Route path="/" element={<Home />} />
        <Route path="/user/profile" element={<ProfilePage />} />
      </Routes>
    </>
  );
}
