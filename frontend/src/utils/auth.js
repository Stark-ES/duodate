// DuoDate Frontend Auth Utilities

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================
// API Functions
// ============================================

/**
 * API 요청 헬퍼 (토큰 자동 포함)
 */
export async function authFetch(endpoint, options = {}) {
  const token = useAuthStore.getState().token;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 401 에러 시 로그아웃
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return response;
}

/**
 * 이메일 회원가입
 */
export async function register({ email, password, nickname, gender, birthDate }) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nickname, gender, birthDate }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  return data;
}

/**
 * 이메일 로그인
 */
export async function login({ email, password }) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return data;
}

/**
 * 디스코드 OAuth 시작
 */
export function startDiscordOAuth(state = 'login') {
  window.location.href = `${API_URL}/api/auth/discord?state=${state}`;
}

/**
 * 디스코드 회원가입 완료
 */
export async function completeDiscordRegistration({ discordToken, gender }) {
  const response = await fetch(`${API_URL}/api/auth/discord/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ discordToken, gender }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  return data;
}

/**
 * 디스코드 계정 연동
 */
export async function linkDiscord(discordToken) {
  const response = await authFetch('/api/auth/discord/link', {
    method: 'POST',
    body: JSON.stringify({ discordToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Discord linking failed');
  }

  return data;
}

/**
 * 디스코드 연동 해제
 */
export async function unlinkDiscord() {
  const response = await authFetch('/api/auth/discord/unlink', {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Discord unlinking failed');
  }

  return data;
}

/**
 * 프로필 업데이트
 */
export async function updateProfile(updates) {
  const response = await authFetch('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Profile update failed');
  }

  return data;
}

/**
 * 성향 테스트 결과 저장
 */
export async function saveTestResult({ myType, preferredType, tags }) {
  const response = await authFetch('/api/auth/type', {
    method: 'PUT',
    body: JSON.stringify({ myType, preferredType, tags }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to save test result');
  }

  return data;
}

/**
 * 비밀번호 변경
 */
export async function changePassword({ currentPassword, newPassword }) {
  const response = await authFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Password change failed');
  }

  return data;
}

/**
 * 현재 유저 정보 새로고침
 */
export async function fetchCurrentUser() {
  const response = await authFetch('/api/auth/me');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch user');
  }

  return data;
}

// ============================================
// Custom Hooks
// ============================================

/**
 * 디스코드 OAuth 콜백 처리 훅
 */
export function useDiscordCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (token) {
      // 토큰으로 유저 정보 가져오기
      setToken(token);
      fetchCurrentUser()
        .then((data) => {
          setUser(data.user);
          navigate('/');
        })
        .catch(() => {
          navigate('/login?error=auth_failed');
        });
    }
  }, [searchParams, navigate, setUser, setToken]);
}

/**
 * 디스코드 회원가입 완료 훅
 */
export function useDiscordRegisterComplete() {
  const [searchParams] = useSearchParams();
  const discordToken = searchParams.get('discord');

  return {
    discordToken,
    hasDiscordData: !!discordToken,
  };
}

/**
 * 인증 상태 초기화 훅 (앱 시작 시)
 */
export function useAuthInit() {
  const { token, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchCurrentUser()
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          logout();
        });
    }
  }, []);
}

// ============================================
// Auth Store Extensions (Zustand)
// ============================================

/**
 * 확장된 Auth Store 액션들
 * stores/index.js의 useAuthStore에 추가
 */
export const authStoreExtensions = {
  // 이메일 회원가입
  register: async (data) => {
    const store = useAuthStore.getState();
    store.setLoading?.(true);
    
    try {
      const result = await register(data);
      useAuthStore.setState({ 
        user: result.user, 
        token: result.token, 
        isAuthenticated: true 
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      store.setLoading?.(false);
    }
  },

  // 이메일 로그인
  login: async (email, password) => {
    const store = useAuthStore.getState();
    store.setLoading?.(true);
    
    try {
      const result = await login({ email, password });
      useAuthStore.setState({ 
        user: result.user, 
        token: result.token, 
        isAuthenticated: true 
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      store.setLoading?.(false);
    }
  },

  // 디스코드 로그인 시작
  loginWithDiscord: () => {
    startDiscordOAuth('login');
  },

  // 디스코드 회원가입 완료
  completeDiscordRegister: async (discordToken, gender) => {
    try {
      const result = await completeDiscordRegistration({ discordToken, gender });
      useAuthStore.setState({ 
        user: result.user, 
        token: result.token, 
        isAuthenticated: true 
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 디스코드 연동
  linkDiscord: async (discordToken) => {
    try {
      const result = await linkDiscord(discordToken);
      useAuthStore.setState({ user: result.user });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 성향 테스트 결과 저장
  saveTestResult: async (data) => {
    try {
      const result = await saveTestResult(data);
      useAuthStore.setState({ user: result.user });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};
