// src/providers/AppProviders.jsx
import React from "react";
import { CoreProviders } from "./CoreProviders";
import { QuizProviders } from "./QuizProviders";
import { SurveyProviders } from "./SurveyProviders";
import { NotificationProviders } from "./NotificationProviders";
import { CategoryProvider } from "../context/categoryContext";
import { ReportProvider } from "../context/ReportContext";

export const AppProviders = ({ children }) => (
  <CoreProviders>
    <CategoryProvider>
      <ReportProvider>
        <NotificationProviders>
          <QuizProviders>
            <SurveyProviders>{children}</SurveyProviders>
          </QuizProviders>
        </NotificationProviders>
      </ReportProvider>
    </CategoryProvider>
  </CoreProviders>
);
