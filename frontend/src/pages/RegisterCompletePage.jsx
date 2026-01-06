// Discord Registration Complete Page
// 디스코드 OAuth 후 성별 선택

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function RegisterCompletePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setToken } = useAuthStore();

  const [discordToken, setDiscordToken] = useState(null);
  const [discordData, setDiscordData] = useState(null);
  const [gender, setGender] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('discord');
    
    if (!token) {
      navigate('/register');
      return;
    }

    setDiscordToken(token);

    // 토큰에서 기본 정보 파싱 (JWT payload)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setDiscordData({
        nickname: payload.nickname,
        avatar: payload.avatar,
        email: payload.email,
      });
    } catch (e) {
      console.error('Invalid discord token');
      navigate('/register');
    }
  }, [searchParams, navigate]);

  const handleComplete = async () => {
    if (!gender) {
      setError('성별을 선택해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/discord/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordToken, gender }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setUser(data.user);
      setToken(data.token);
      navigate('/test'); // 성향 테스트로 이동
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!discordData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-8 border border-purple-500/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-slate-700">
              {discordData.avatar ? (
                <img src={discordData.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              환영합니다, {discordData.nickname}님!
            </h2>
            <p className="text-purple-300">
              마지막으로 성별을 선택해주세요
            </p>
          </div>

          {/* Discord Info */}
          <div className="bg-slate-700/50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            <div>
              <p className="text-white font-medium">디스코드 연동됨</p>
              <p className="text-slate-400 text-sm">{discordData.email || '이메일 비공개'}</p>
            </div>
            <span className="ml-auto text-green-400">✓</span>
          </div>

          {/* Gender Selection */}
          <div className="space-y-3 mb-6">
            <p className="text-slate-300 text-sm font-medium">성별 선택</p>
            
            <button
              onClick={() => setGender('M')}
              className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${
                gender === 'M'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              <span className="text-3xl">🛡️</span>
              <div className="text-left">
                <p className="text-white font-medium">남성</p>
                <p className="text-slate-400 text-sm">오늘 밤 당신을 지켜줄 '그'</p>
              </div>
              {gender === 'M' && <span className="ml-auto text-blue-400">✓</span>}
            </button>

            <button
              onClick={() => setGender('F')}
              className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${
                gender === 'F'
                  ? 'border-pink-500 bg-pink-500/20'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              <span className="text-3xl">🌙</span>
              <div className="text-left">
                <p className="text-white font-medium">여성</p>
                <p className="text-slate-400 text-sm">함께 밤새워 게임할 '그녀'</p>
              </div>
              {gender === 'F' && <span className="ml-auto text-pink-400">✓</span>}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-400 text-sm text-center mb-4">{error}</p>
          )}

          {/* Submit Button */}
          <button
            onClick={handleComplete}
            disabled={!gender || isLoading}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              gender && !isLoading
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                처리 중...
              </span>
            ) : (
              '가입 완료'
            )}
          </button>

          {/* Terms */}
          <p className="text-slate-500 text-xs text-center mt-4">
            가입 시 <span className="text-purple-400">이용약관</span> 및{' '}
            <span className="text-purple-400">개인정보처리방침</span>에 동의합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
