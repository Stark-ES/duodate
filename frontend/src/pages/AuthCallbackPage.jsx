// Discord OAuth Callback Page
// /auth/callback 경로에서 토큰 처리

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error('Auth error:', error);
      navigate('/login?error=' + error);
      return;
    }

    if (token) {
      setToken(token);
      
      // 유저 정보 가져오기
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            navigate('/');
          } else {
            navigate('/login?error=user_fetch_failed');
          }
        })
        .catch(() => {
          navigate('/login?error=auth_failed');
        });
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, setUser, setToken]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white">로그인 처리 중...</p>
      </div>
    </div>
  );
}
