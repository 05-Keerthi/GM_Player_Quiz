// src/providers/QuizProviders.jsx
import React from "react";
import { QuizProvider } from "../context/quizContext";
import { SessionProvider } from "../context/sessionContext";
import { AnswerProvider } from "../context/answerContext";
import { LeaderboardProvider } from "../context/leaderboardContext";

export const QuizProviders = ({ children }) => (
  <QuizProvider>
    <SessionProvider>
      <AnswerProvider>
        <LeaderboardProvider>{children}</LeaderboardProvider>
      </AnswerProvider>
    </SessionProvider>
  </QuizProvider>
);
