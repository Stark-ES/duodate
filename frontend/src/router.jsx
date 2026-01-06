// DuoDate Router Configuration

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './stores';

// ============================================
// Layouts
// ============================================
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// ============================================
// Pages
// ============================================
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterCompletePage from './pages/RegisterCompletePage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import TestPage from './pages/TestPage';
import MatchingPage from './pages/MatchingPage';
import ChatRoomPage from './pages/ChatRoomPage';
import VoiceRoomPage from './pages/VoiceRoomPage';
import ProfilePage from './pages/ProfilePage';
import LikesPage from './pages/LikesPage';
import LinkedPage from './pages/LinkedPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// ============================================
// Route Guards
// ============================================

// 인증 필요 라우트
function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}

// 비인증 전용 라우트 (로그인/회원가입)
function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
}

// 테스트 완료 필요 라우트
function TestRequiredRoute() {
  const user = useAuthStore((state) => state.user);
  
  if (!user?.myType && !user?.preferredType) {
    return <Navigate to="/test" replace />;
  }
  
  return <Outlet />;
}

// ============================================
// Router Configuration
// ============================================

export const router = createBrowserRouter([
  // Public Routes (인증 불필요)
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/register/complete', element: <RegisterCompletePage /> },
        ],
      },
    ],
  },

  // OAuth Callback (인증 상태 무관)
  { path: '/auth/callback', element: <AuthCallbackPage /> },

  // Protected Routes (인증 필요)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          // Home
          { path: '/', element: <HomePage /> },
          
          // Test (성향 테스트)
          { path: '/test', element: <TestPage /> },
          
          // Matching (테스트 완료 필요)
          {
            element: <TestRequiredRoute />,
            children: [
              { path: '/matching', element: <MatchingPage /> },
            ],
          },
          
          // Chat Room
          { path: '/chat/:matchId', element: <ChatRoomPage /> },
          
          // Voice Room
          { path: '/voice/:matchId', element: <VoiceRoomPage /> },
          
          // Profile & Settings
          { path: '/profile', element: <ProfilePage /> },
          { path: '/likes', element: <LikesPage /> },
          { path: '/linked', element: <LinkedPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);

export default router;
