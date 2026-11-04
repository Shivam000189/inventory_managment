import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { AppProvider } from './context/AppContext';
import { DashboardLayout } from './DashboardLayout';

export function DashboardView() {
  const { account, business, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppProvider
      initialUser={account}
      initialBusiness={business}
      onLogout={logout}
      onNavigate={(p: string) => {
        if (p === '/' || p === '/landing') {
          navigate('/landing');
        }
      }}
    >
      <DashboardLayout onLogout={logout} />
    </AppProvider>
  );
}

export default DashboardView;
