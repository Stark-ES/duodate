// Matching Page

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useQueueStore, useMatchStore, getSocket } from '../stores';

const GAMES = {
  LOL: { name: '롤 (LoL)', icon: '⚔️', color: '#C89B3C' },
  TFT: { name: '전략적 팀 전투', icon: '🎲', color: '#9D48E0' },
  OW: { name: '오버워치', icon: '🎯', color: '#F99E1A' },
  PUBG: { name: '배틀그라운드', icon: '🚗', color: '#F2A900' },
};

const TYPES = {
  V: { name: 'Victory', label: '캐리형', color: '#EF4444', icon: '⚔️', desc: '압도적인 실력으로 승리!' },
  F: { name: 'Funny', label: '분위기 메이커', color: '#F59E0B', icon: '🤣', desc: '웃음이 끊이지 않는!' },
  R: { name: 'Romantic', label: '설렘 유발형', color: '#EC4899', icon: '💕', desc: '묘한 기류가 흐르는...' },
  C: { name: 'Comfort', label: '힐링형', color: '#10B981', icon: '☕', desc: '편안한 새벽 감성' },
};

export default function MatchingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { isInQueue, position, isSearching, joinQueue, leaveQueue, requestMatch } = useQueueStore();
  const { currentMatch } = useMatchStore();

  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const isMale = user?.gender === 'M';

  // 매칭 성공 시 채팅방으로 이동
  useEffect(() => {
    if (currentMatch) {
      navigate(`/chat/${currentMatch.id}`);
    }
  }, [currentMatch, navigate]);

  // Socket 매칭 이벤트 리스너
  useEffect(() => {
    const socket = getSocket();
    
    socket.on('match:found', (data) => {
      navigate(`/chat/${data.matchId}`);
    });

    return () => {
      socket.off('match:found');
    };
  }, [navigate]);

  const handleStartMatching = async () => {
    if (!selectedGame) return;

    const type = isMale ? user.myType : selectedType;
    if (!type) return;

    if (isMale) {
      // 남성: 대기열에 등록
      await joinQueue(selectedGame, type);
    } else {
      // 여성: 즉시 매칭 요청
      const result = await requestMatch(selectedGame, type);
      if (result.matched) {
        navigate(`/chat/${result.matchId}`);
      }
    }
  };

  const handleCancelMatching = async () => {
    await leaveQueue();
  };

  // 매칭 대기 중 화면
  if (isInQueue || isSearching) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          {/* Searching Animation */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30" />
            <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
            <div className="absolute inset-4 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-4xl">{GAMES[selectedGame]?.icon}</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {isSearching ? '파트너를 찾고 있어요...' : '매칭 대기 중'}
          </h2>
          
          <p className="text-purple-300 mb-2">
            {GAMES[selectedGame]?.name} • TYPE_{isMale ? user.myType : selectedType}
          </p>

          {position && (
            <p className="text-slate-400 mb-6">
              현재 대기 순번: <span className="text-purple-400 font-bold">{position}번</span>
            </p>
          )}

          <p className="text-slate-500 text-sm mb-8">
            나와 딱 맞는 파트너를 찾고 있어요!<br/>
            조금만 기다려 주세요 💜
          </p>

          <button
            onClick={handleCancelMatching}
            className="px-8 py-3 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            매칭 취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-white mb-2">💜 매칭 시작</h1>
        <p className="text-purple-300">오늘 밤, 누구와 게임할까요?</p>
      </div>

      {/* Game Selection */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 px-1">🎮 게임 선택</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(GAMES).map(([key, game]) => (
            <button
              key={key}
              onClick={() => setSelectedGame(key)}
              className={`p-4 rounded-xl border transition-all text-center ${
                selectedGame === key
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
            >
              <span className="text-3xl block mb-2">{game.icon}</span>
              <p className="text-white font-medium text-sm">{game.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Type Selection (여성만) */}
      {!isMale && (
        <div>
          <h3 className="text-lg font-bold text-white mb-3 px-1">
            💕 원하는 파트너 유형
          </h3>
          <div className="space-y-2">
            {Object.entries(TYPES).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`w-full p-4 rounded-xl border transition-all text-left ${
                  selectedType === key
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <p className="text-white font-medium">
                      TYPE_{key} - {type.label}
                    </p>
                    <p className="text-slate-400 text-sm">{type.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* My Type Display (남성) */}
      {isMale && user?.myType && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-2">나의 매력 유형</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{TYPES[user.myType]?.icon}</span>
            <div>
              <p className="text-white font-bold">
                TYPE_{user.myType} - {TYPES[user.myType]?.label}
              </p>
              <p className="text-slate-400 text-sm">{TYPES[user.myType]?.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStartMatching}
        disabled={!selectedGame || (!isMale && !selectedType)}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          selectedGame && (isMale || selectedType)
            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
        }`}
      >
        {isMale ? '🎮 대기열 참가하기' : '💜 매칭 시작하기'}
      </button>

      {/* Info */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <p className="text-slate-400 text-sm">
          {isMale
            ? '💡 선택한 게임의 대기열에 참가합니다. 여성 유저가 매칭을 요청하면 자동으로 연결됩니다.'
            : '💡 선택한 조건에 맞는 파트너를 즉시 찾아드려요. 대기자가 없으면 잠시 기다려주세요.'}
        </p>
      </div>
    </div>
  );
}
