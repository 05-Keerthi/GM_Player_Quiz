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
import { AnswerProvider } from "./context/answerContext";
import { LeaderboardProvider } from "./context/leaderboardContext";
import { SurveyProvider } from "./context/surveyContext";
import { QuestionProvider } from "./context/questionContext";
import { SurveySessionProvider } from "./context/surveySessionContext";
import { NotificationProvider } from "./context/notificationContext";
import { SurveyAnswerProvider } from "./context/surveyAnswerContext";
import { SurveyNotificationProvider } from "./context/SurveynotificationContext";
import { ReportProvider } from "./context/ReportContext";
// import { UserReportProvider } from "./context/UserReportContext";  // Import UserReportProvider

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <UserProvider>
      <PasswordResetProvider>
        <TenantProvider>
          <CategoryProvider>
            <QuizProvider>
              <SessionProvider>
                <AnswerProvider>
                  <LeaderboardProvider>
                    <NotificationProvider>
                      <SurveyProvider>
                        <SurveyNotificationProvider>
                          <QuestionProvider>
                            <SurveySessionProvider>
                              <SurveyAnswerProvider>
                                {/* Wrap the context providers with UserReportProvider here */}
                              
                                  <ReportProvider>  {/* Wrap ReportProvider inside UserReportProvider */}
                                    <BrowserRouter>
                                      <App />
                                    </BrowserRouter>
                                  </ReportProvider>
                                
                              </SurveyAnswerProvider>
                            </SurveySessionProvider>
                          </QuestionProvider>
                        </SurveyNotificationProvider>
                      </SurveyProvider>
                    </NotificationProvider>
                  </LeaderboardProvider>
                </AnswerProvider>
              </SessionProvider>
            </QuizProvider>
          </CategoryProvider>
        </TenantProvider>
      </PasswordResetProvider>
    </UserProvider>
  </AuthProvider>
);
