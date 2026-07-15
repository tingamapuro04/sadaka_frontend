import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SadakaAuthProvider } from './contexts/SadakaAuthContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ToastProvider } from './components/ui';
import { queryClient } from './lib/query-client';
import './index.css';
import './config/env.config';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <SadakaAuthProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </SadakaAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
