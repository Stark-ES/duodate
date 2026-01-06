// Home Page

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores';

const TYPES = {
  V: { name: 'Victory', label: '캐리형', color: '#EF4444', icon: '⚔️' },
  F: { name: 'Funny', label: '분위기 메이커', color: '#F59E0B', icon: '🤣' },
  R: { name: 'Romantic', label: '설렘 유발형', color: '#EC4899', icon: '💕' },
  C: { name: 'Comfort', label: '힐링형', color: '#10B981', icon: '☕' },
};

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const hasCompletedTest = user?.myType || user?.preferredType;
  const userType = user?.myType || user?.preferredType;

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-2xl font-bold text-white mb-2">
          안녕하세요, {user?.nickname}님! 👋
        </h2>
        <p className="text-purple-200">
          오늘 밤, 특별한 인연을 만나볼까요?
        </p>
      </div>

      {/* Test Status */}
      {!hasCompletedTest ? (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">성향 테스트 필요</h3>
              <p className="text-slate-400 text-sm mb-4">
                매칭을 시작하려면 먼저 성향 테스트를 완료해주세요!
              </p>
              <Link
                to="/test"
                className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium"
              >
                테스트 시작하기
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{ background: `${TYPES[userType]?.color}30` }}
            >
              {TYPES[userType]?.icon}
            </div>
            <div>
              <p className="text-slate-400 text-sm">나의 유형</p>
              <h3 className="text-xl font-bold" style={{ color: TYPES[userType]?.color }}>
                TYPE_{userType} ({TYPES[userType]?.label})
              </h3>
            </div>
          </div>
          <Link
            to="/matching"
            className="block w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-center"
          >
            💜 매칭 시작하기
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
          <p className="text-2xl font-bold text-white">{user?.totalMatches || 0}</p>
          <p className="text-slate-400 text-xs mt-1">총 매칭</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
          <p className="text-2xl font-bold text-pink-400">{user?.totalLikesReceived || 0}</p>
          <p className="text-slate-400 text-xs mt-1">받은 좋아요</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
          <p className="text-2xl font-bold text-purple-400">{user?.mutualLikes || 0}</p>
          <p className="text-slate-400 text-xs mt-1">연결된 인연</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white px-1">바로가기</h3>
        
        <Link
          to="/likes"
          className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          <span className="text-2xl">❤️</span>
          <div className="flex-1">
            <p className="text-white font-medium">받은 좋아요</p>
            <p className="text-slate-400 text-sm">누가 나에게 호감을 보냈을까요?</p>
          </div>
          <span className="text-slate-500">→</span>
        </Link>

        <Link
          to="/linked"
          className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          <span className="text-2xl">🔗</span>
          <div className="flex-1">
            <p className="text-white font-medium">연결된 인연</p>
            <p className="text-slate-400 text-sm">서로 좋아요를 보낸 특별한 인연들</p>
          </div>
          <span className="text-slate-500">→</span>
        </Link>

        <Link
          to="/test"
          className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          <span className="text-2xl">🔄</span>
          <div className="flex-1">
            <p className="text-white font-medium">테스트 다시하기</p>
            <p className="text-slate-400 text-sm">오늘은 다른 유형으로 도전!</p>
          </div>
          <span className="text-slate-500">→</span>
        </Link>
      </div>

      {/* Free Likes Status */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>💕</span>
            <span className="text-slate-300">오늘의 무료 좋아요</span>
          </div>
          <span className="text-purple-400 font-bold">
            {user?.freeLikesToday || 0}/1
          </span>
        </div>
      </div>
    </div>
  );
}
