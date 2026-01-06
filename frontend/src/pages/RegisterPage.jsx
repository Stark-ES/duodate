import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', nickname: '', gender: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: API call
    navigate('/login');
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-8 border border-purple-500/20">
      <h2 className="text-2xl font-bold text-white text-center mb-6">회원가입</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder="이메일" className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600" required />
        <input type="password" placeholder="비밀번호" className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600" required />
        <input type="text" placeholder="닉네임" className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600" required />
        <div className="flex gap-3">
          <button type="button" className="flex-1 py-3 rounded-xl border border-slate-600 text-white">남성</button>
          <button type="button" className="flex-1 py-3 rounded-xl border border-slate-600 text-white">여성</button>
        </div>
        <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold">가입하기</button>
      </form>
      <p className="mt-4 text-center text-slate-400">이미 계정이 있으신가요? <Link to="/login" className="text-purple-400">로그인</Link></p>
    </div>
  );
}
