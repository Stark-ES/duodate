import React from 'react';

export default function LinkedPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white mb-6">🔗 연결된 인연</h1>
      <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
        <span className="text-4xl mb-4 block">💜</span>
        <p className="text-slate-400">아직 연결된 인연이 없어요</p>
        <p className="text-slate-500 text-sm mt-2">서로 좋아요를 보내면 연결돼요!</p>
      </div>
    </div>
  );
}
