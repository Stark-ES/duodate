import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    nickname: '', 
    gender: '' 
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGender = (gender) => {
    setForm({ ...form, gender });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.gender) {
      setError('성별을 선택해주세요');
      return;
    }

    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    const result = await register(form.email, form.password, form.nickname, form.gender);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || '회원가입에 실패했습니다');
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-8 border border-purple-500/20">
      <h2 className="text-2xl font-bold text-white text-center mb-6">회원가입</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm mb-2">이메일</label>
          <input 
            type="email" 
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="email@example.com" 
            className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:outline-none" 
            required 
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm mb-2">비밀번호</label>
          <input 
            type="password" 
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="6자 이상" 
            className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:outline-none" 
            required 
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm mb-2">닉네임</label>
          <input 
            type="text" 
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            placeholder="게임에서 사용할 닉네임" 
            className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:outline-none" 
            required 
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm mb-2">성별</label>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => handleGender('M')}
              className={`flex-1 py-3 rounded-xl border transition-all ${
                form.gender === 'M' 
                  ? 'border-blue-500 bg-blue-500/20 text-white' 
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              🛡️ 남성
            </button>
            <button 
              type="button" 
              onClick={() => handleGender('F')}
              className={`flex-1 py-3 rounded-xl border transition-all ${
                form.gender === 'F' 
                  ? 'border-pink-500 bg-pink-500/20 text-white' 
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              🌙 여성
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold disabled:opacity-50"
        >
          {isLoading ? '가입 중...' : '가입하기'}
        </button>
      </form>

      <p className="mt-4 text-center text-slate-400">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="text-purple-400 hover:text-purple-300">
          로그인
        </Link>
      </p>
    </div>
  );
}
