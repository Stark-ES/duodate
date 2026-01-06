import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <span className="text-6xl mb-4 block">😢</span>
        <h1 className="text-2xl font-bold text-white mb-2">페이지를 찾을 수 없어요</h1>
        <p className="text-slate-400 mb-6">요청하신 페이지가 존재하지 않습니다</p>
        <Link to="/" className="px-6 py-3 bg-purple-500 text-white rounded-xl">홈으로 가기</Link>
      </div>
    </div>
  );
}
