// Login Page

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || '로그인에 실패했습니다');
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-8 border border-purple-500/20">
      <h2 className="text-2xl font-bold text-white text-center mb-6">로그인</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm mb-2">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:outline-none"
            placeholder="email@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm mb-2">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:outline-none"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold disabled:opacity-50"
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-400">
          아직 계정이 없으신가요?{' '}
          <Link to="/register" className="text-purple-400 hover:text-purple-300">
            회원가입
          </Link>
        </p>
      </div>

      {/* Discord Login (Future) */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <button className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          디스코드로 로그인
        </button>
      </div>
    </div>
  );
}
