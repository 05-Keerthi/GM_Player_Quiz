import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/userContext";
import { PasswordResetProvider } from "./context/passwordResetContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <UserProvider>
      <PasswordResetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PasswordResetProvider>
    </UserProvider>
  </AuthProvider>
);
