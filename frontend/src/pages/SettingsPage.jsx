import React from 'react';

export default function SettingsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white mb-6">⚙️ 설정</h1>
      <div className="space-y-3">
        <button className="w-full p-4 bg-slate-800 rounded-xl text-left text-white border border-slate-700">알림 설정</button>
        <button className="w-full p-4 bg-slate-800 rounded-xl text-left text-white border border-slate-700">디스코드 연동</button>
        <button className="w-full p-4 bg-slate-800 rounded-xl text-left text-white border border-slate-700">계정 관리</button>
        <button className="w-full p-4 bg-slate-800 rounded-xl text-left text-red-400 border border-slate-700">로그아웃</button>
      </div>
    </div>
  );
}
