// src/providers/CoreProviders.jsx
import React from 'react';
import { AuthProvider } from "../context/AuthContext";
import { UserProvider } from "../context/userContext";
import { PasswordResetProvider } from "../context/passwordResetContext";
import { TenantProvider } from "../context/TenantContext";

export const CoreProviders = ({ children }) => (
  <AuthProvider>
    <UserProvider>
      <PasswordResetProvider>
        <TenantProvider>
          {children}
        </TenantProvider>
      </PasswordResetProvider>
    </UserProvider>
  </AuthProvider>
);