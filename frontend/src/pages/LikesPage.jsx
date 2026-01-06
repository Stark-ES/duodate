import React from 'react';

export default function LikesPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white mb-6">❤️ 받은 좋아요</h1>
      <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
        <span className="text-4xl mb-4 block">💕</span>
        <p className="text-slate-400">아직 받은 좋아요가 없어요</p>
        <p className="text-slate-500 text-sm mt-2">매칭을 시작해보세요!</p>
      </div>
    </div>
  );
}
