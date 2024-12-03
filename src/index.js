import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/userContext";
import { PasswordResetProvider } from "./context/passwordResetContext";
import { TenantProvider } from "./context/TenantContext";
import { CategoryProvider } from "./context/categoryContext";
import { QuizProvider } from "./context/quizContext";
import { SessionProvider } from "./context/sessionContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <UserProvider>
      <PasswordResetProvider>
        <TenantProvider>
          <CategoryProvider>
            <QuizProvider>
              <SessionProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </SessionProvider>
            </QuizProvider>
          </CategoryProvider>
        </TenantProvider>
      </PasswordResetProvider>
    </UserProvider>
  </AuthProvider>
);
