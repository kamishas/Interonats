import { createBrowserRouter } from 'react-router';
import { LoginPage } from './components/login-page';
import { Dashboard } from './components/dashboard-page';
import { ProtectedRoute } from './components/protected-route';
import { PublicResumeSubmit } from './components/public-resume-submit';
import { ZohoCallback } from './components/ui/zoho-callback';

export const router = createBrowserRouter([
  {
    path: '/auth/callback',
    element: <ZohoCallback />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/submit-resume/:linkId',
    element: <PublicResumeSubmit />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
]);