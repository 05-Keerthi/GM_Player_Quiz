// src/providers/NotificationProviders.jsx
import React from 'react';
import { NotificationProvider } from "../context/notificationContext";
import { SurveyNotificationProvider } from "../context/SurveynotificationContext";

export const NotificationProviders = ({ children }) => (
  <NotificationProvider>
    <SurveyNotificationProvider>
      {children}
    </SurveyNotificationProvider>
  </NotificationProvider>
);
