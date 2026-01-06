import React from 'react';
import { useAuthStore } from '../stores';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="p-4 space-y-6">
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center text-3xl">
            {user?.gender === 'M' ? '👨' : '👩'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.nickname}</h2>
            <p className="text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">성별</span>
            <span className="text-white">{user?.gender === 'M' ? '남성' : '여성'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">유형</span>
            <span className="text-purple-400">TYPE_{user?.myType || user?.preferredType || '-'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400">디스코드</span>
            <span className="text-white">{user?.discordUsername || '미연동'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
