// src/providers/SurveyProviders.jsx
import React from "react";
import { SurveyProvider } from "../context/surveyContext";
import { QuestionProvider } from "../context/questionContext";
import { SurveySlideProvider } from "../context/surveySlideContext";
import { SurveySessionProvider } from "../context/surveySessionContext";
import { SurveyAnswerProvider } from "../context/surveyAnswerContext";
import { TemplateProvider } from "../context/TemplateContext";

export const SurveyProviders = ({ children }) => (
  <SurveyProvider>
    <QuestionProvider>
      <TemplateProvider>
        <SurveySlideProvider>
          <SurveySessionProvider>
            <SurveyAnswerProvider>{children}</SurveyAnswerProvider>
          </SurveySessionProvider>
        </SurveySlideProvider>
      </TemplateProvider>
    </QuestionProvider>
  </SurveyProvider>
);
