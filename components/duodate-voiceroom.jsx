import React, { useState, useEffect } from 'react';

const TYPES = {
  V: { name: 'Victory', color: '#EF4444', icon: '⚔️', mission: '지금 파트너에게 "역시 믿음직하네요"라고 한마디 해보세요. 공격력 200% 상승!' },
  F: { name: 'Funny', color: '#F59E0B', icon: '🤣', mission: '갑자기 개그를 던져보세요. 파트너의 웃음소리를 들을 수 있을지도?' },
  R: { name: 'Romantic', color: '#EC4899', icon: '🌸', mission: '잠시 게임 소리를 줄이고, 상대방의 숨소리에 집중해보세요. 3초간 정적을...' },
  C: { name: 'Comfort', color: '#10B981', icon: '☕', mission: '"오늘 하루 힘들었죠?"라고 물어봐 주세요. 따뜻한 위로가 전해질 거예요.' }
};

const RANDOM_MISSIONS = [
  { icon: '🎮', text: '지금 플레이 중인 게임에서 가장 좋아하는 순간을 공유해보세요!' },
  { icon: '🎵', text: '좋아하는 노래 한 소절만 흥얼거려 보세요~' },
  { icon: '💬', text: '상대방의 목소리에서 가장 좋은 점을 칭찬해보세요!' },
  { icon: '🌙', text: '오늘 자기 전에 먹고 싶은 야식 메뉴를 같이 골라보세요!' },
  { icon: '✨', text: '첫인상과 지금 느낌이 어떻게 달라졌는지 솔직하게 말해보세요!' }
];

export default function DuoDateVoiceRoom() {
  // Demo data
  const [matchData] = useState({
    matchId: 'SECRET-A7B3',
    partnerType: 'R',
    partnerNickname: '새벽감성러',
    partnerProfile: {
      mbti: 'INFP',
      hobby: '음악 감상, 산책',
      game: 'LoL 서포터',
      mood: '오늘은 힐링 게임 하고 싶어요'
    },
    discordChannelId: '1234567890',
    discordServerId: '0987654321'
  });

  const [phase, setPhase] = useState('warning'); // warning, connecting, active, lastMinutes, ended
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [isMuted, setIsMuted] = useState(false);
  const [currentMission, setCurrentMission] = useState(null);
  const [showMission, setShowMission] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [myLike, setMyLike] = useState(null);
  const [partnerLike, setPartnerLike] = useState(null);
  const [bgPinkIntensity, setBgPinkIntensity] = useState(0);

  const typeInfo = TYPES[matchData.partnerType];
  const discordDeepLink = `discord://discord.com/channels/${matchData.discordServerId}/${matchData.discordChannelId}`;

  // Timer
  useEffect(() => {
    if (phase !== 'active' && phase !== 'lastMinutes') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('ended');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Last 10 minutes effect
  useEffect(() => {
    if (timeLeft <= 600 && timeLeft > 0 && phase === 'active') {
      setPhase('lastMinutes');
    }
    if (timeLeft <= 600) {
      setBgPinkIntensity(Math.min(1, (600 - timeLeft) / 600));
    }
  }, [timeLeft, phase]);

  // Random mission popup
  useEffect(() => {
    if (phase !== 'active' && phase !== 'lastMinutes') return;
    
    const missionTimes = [3300, 2700, 2100, 1500, 900]; // Every ~10 mins
    if (missionTimes.includes(timeLeft)) {
      const randomMission = RANDOM_MISSIONS[Math.floor(Math.random() * RANDOM_MISSIONS.length)];
      setCurrentMission(randomMission);
      setShowMission(true);
      setTimeout(() => setShowMission(false), 8000);
    }
  }, [timeLeft, phase]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEnterDiscord = () => {
    setPhase('connecting');
    setTimeout(() => {
      setPhase('active');
      // In real app, would open Discord deep link
      // window.location.href = discordDeepLink;
    }, 2000);
  };

  const handleLike = (choice) => {
    setMyLike(choice);
    // Simulate partner response
    setTimeout(() => {
      setPartnerLike(Math.random() > 0.3 ? 'like' : 'pass');
    }, 2500);
  };

  return (
    <div 
      className="min-h-screen flex flex-col max-w-lg mx-auto transition-all duration-1000"
      style={{ 
        background: phase === 'lastMinutes' || phase === 'ended'
          ? `linear-gradient(135deg, rgba(236,72,153,${0.1 + bgPinkIntensity * 0.2}) 0%, rgb(15,23,42) 50%, rgba(168,85,247,${0.1 + bgPinkIntensity * 0.15}) 100%)`
          : 'linear-gradient(135deg, rgb(15,23,42) 0%, rgb(30,20,50) 100%)'
      }}
    >
      
      {/* Warning Screen */}
      {phase === 'warning' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-4xl">🔐</span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">시크릿 보이스룸</h2>
            <p className="text-purple-300 mb-6">두 사람만의 비밀 공간이 열립니다</p>
            
            <div className="bg-slate-800/80 rounded-2xl p-5 mb-6 text-left border border-purple-500/20">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-white font-medium mb-1">디스코드로 이동합니다</p>
                  <p className="text-slate-400 text-sm">디스코드 프로필 사진과 닉네임이 상대방에게 보일 수 있습니다.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="text-white font-medium mb-1">1시간 후 자동 종료</p>
                  <p className="text-slate-400 text-sm">채널은 60분 후 자동으로 삭제됩니다.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleEnterDiscord}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                디스코드에서 만나기
              </button>
              
              <p className="text-slate-500 text-xs">
                채널: <span className="text-purple-400 font-mono">{matchData.matchId}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connecting Screen */}
      {phase === 'connecting' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/30" />
              <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
              <div className="absolute inset-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-3xl">🔗</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">시크릿룸 연결 중...</h3>
            <p className="text-purple-300">{matchData.partnerNickname}님과 연결하고 있어요</p>
          </div>
        </div>
      )}

      {/* Active Voice Room */}
      {(phase === 'active' || phase === 'lastMinutes') && (
        <>
          {/* Header */}
          <div className="bg-slate-800/80 backdrop-blur border-b border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl relative"
                  style={{ background: `${typeInfo.color}30` }}
                >
                  {typeInfo.icon}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800" />
                </div>
                <div>
                  <p className="text-white font-medium">{matchData.partnerNickname}</p>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    보이스 연결됨
                  </p>
                </div>
              </div>
              
              {/* Timer */}
              <div 
                className={`px-4 py-2 rounded-full font-mono text-xl font-bold transition-all ${
                  phase === 'lastMinutes' ? 'animate-pulse' : ''
                }`}
                style={{ 
                  background: timeLeft <= 600 ? 'rgba(236,72,153,0.2)' : 'rgba(139,92,246,0.2)',
                  color: timeLeft <= 600 ? '#EC4899' : '#A78BFA'
                }}
              >
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Partner Profile Button */}
            <button
              onClick={() => setShowProfilePanel(!showProfilePanel)}
              className="w-full p-3 rounded-xl bg-slate-700/50 border border-slate-600 flex items-center justify-between hover:bg-slate-700 transition-colors"
            >
              <span className="text-slate-300 text-sm">🔓 파트너 프로필 보기</span>
              <span className="text-slate-400">{showProfilePanel ? '▲' : '▼'}</span>
            </button>

            {/* Profile Panel */}
            {showProfilePanel && (
              <div className="mt-3 p-4 rounded-xl bg-slate-700/50 border border-slate-600 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 text-sm font-medium w-16">MBTI</span>
                  <span className="text-white">{matchData.partnerProfile.mbti}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 text-sm font-medium w-16">취미</span>
                  <span className="text-white">{matchData.partnerProfile.hobby}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 text-sm font-medium w-16">게임</span>
                  <span className="text-white">{matchData.partnerProfile.game}</span>
                </div>
                <div className="pt-2 border-t border-slate-600">
                  <p className="text-slate-400 text-sm italic">"{matchData.partnerProfile.mood}"</p>
                </div>
              </div>
            )}
          </div>

          {/* Last 10 Minutes Alert */}
          {phase === 'lastMinutes' && timeLeft === 600 && (
            <div className="mx-4 mt-4 p-4 rounded-xl bg-pink-500/20 border border-pink-500/40 text-center animate-pulse">
              <p className="text-pink-300 font-medium">
                💕 이제 헤어지기까지 10분 남았습니다.<br/>
                꼭 하고 싶었던 말이 있다면 지금 하세요.
              </p>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            {/* Voice Visualization */}
            <div className="relative mb-8">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${typeInfo.color}40, ${typeInfo.color}20)` }}
              >
                <span className="text-6xl">{typeInfo.icon}</span>
              </div>
              
              {/* Sound Waves */}
              <div className="absolute inset-0 flex items-center justify-center">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="absolute w-32 h-32 rounded-full border-2 animate-ping"
                    style={{ 
                      borderColor: `${typeInfo.color}${30 - i * 10}`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">🎧 보이스 데이트 중</h3>
            <p className="text-purple-300 text-center mb-8">
              {matchData.partnerNickname}님과 함께하는<br/>특별한 1시간
            </p>

            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`px-8 py-4 rounded-2xl font-medium flex items-center gap-3 transition-all ${
                isMuted 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                  : 'bg-slate-700 text-white border border-slate-600 hover:bg-slate-600'
              }`}
            >
              {isMuted ? (
                <>🔇 음소거 됨</>
              ) : (
                <>🎤 마이크 켜짐</>
              )}
            </button>
          </div>

          {/* Mission Popup */}
          {showMission && currentMission && (
            <div className="fixed bottom-24 left-4 right-4 max-w-lg mx-auto animate-bounce">
              <div 
                className="p-4 rounded-2xl border shadow-xl"
                style={{ 
                  background: `linear-gradient(135deg, ${typeInfo.color}20, rgba(30,20,50,0.95))`,
                  borderColor: `${typeInfo.color}40`
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{currentMission.icon}</span>
                  <div>
                    <p className="text-purple-400 text-xs font-medium mb-1">💫 랜덤 미션</p>
                    <p className="text-white text-sm">{currentMission.text}</p>
                  </div>
                  <button 
                    onClick={() => setShowMission(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Type-specific Mission Button */}
          <div className="p-4 bg-slate-800/80 border-t border-slate-700/50">
            <button
              onClick={() => {
                setCurrentMission({ icon: typeInfo.icon, text: typeInfo.mission });
                setShowMission(true);
                setTimeout(() => setShowMission(false), 6000);
              }}
              className="w-full py-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm hover:bg-purple-500/20 transition-colors"
            >
              ✨ 오늘의 미션 확인하기
            </button>
          </div>
        </>
      )}

      {/* Ended Screen - Like Decision */}
      {phase === 'ended' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            
            {!myLike ? (
              <div className="text-center">
                <div className="text-6xl mb-4">💜</div>
                <h2 className="text-2xl font-bold text-white mb-2">즐거운 데이트였나요?</h2>
                <p className="text-purple-300 mb-8">
                  {matchData.partnerNickname}님과의 인연을<br/>계속 이어가고 싶다면 좋아요를 눌러주세요
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => handleLike('like')}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    ❤️ 좋아요 보내기
                  </button>
                  <button
                    onClick={() => handleLike('pass')}
                    className="w-full py-4 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                  >
                    다음 기회에...
                  </button>
                </div>

                <p className="text-slate-500 text-xs mt-4">
                  오늘의 무료 좋아요: 1/1 남음
                </p>
              </div>
            ) : !partnerLike ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-pink-500/20 flex items-center justify-center mb-4">
                  <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {myLike === 'like' ? '💕 마음을 전달했어요!' : '응답을 확인 중...'}
                </h3>
                <p className="text-purple-300">상대방의 답변을 기다리고 있어요</p>
              </div>
            ) : (
              <div className="text-center">
                {myLike === 'like' && partnerLike === 'like' ? (
                  <>
                    <div className="text-7xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-white mb-2">인연 연결 성공!</h2>
                    <p className="text-purple-300 mb-6">
                      {matchData.partnerNickname}님도 당신에게<br/>호감을 보냈어요!
                    </p>

                    <div className="bg-slate-800/80 rounded-2xl p-5 mb-6 border border-pink-500/30">
                      <p className="text-pink-400 text-sm mb-3">🔓 프로필이 공개되었습니다</p>
                      <div className="space-y-2 text-left">
                        <div className="flex justify-between">
                          <span className="text-slate-400">얼굴 사진</span>
                          <span className="text-white">공개됨 ✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">사는 곳</span>
                          <span className="text-white">서울 강남구</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">개인 메시지</span>
                          <span className="text-green-400">활성화됨</span>
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold">
                      💬 메시지 보내기
                    </button>
                  </>
                ) : myLike === 'like' && partnerLike === 'pass' ? (
                  <>
                    <div className="text-5xl mb-4">💔</div>
                    <h2 className="text-xl font-bold text-white mb-2">아쉽지만...</h2>
                    <p className="text-slate-400 mb-6">
                      상대방이 아직 준비가 안 됐나 봐요<br/>
                      다음에 더 좋은 인연을 만나요!
                    </p>
                    <button className="w-full py-4 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors">
                      새로운 매칭 시작하기
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-4">👋</div>
                    <h2 className="text-xl font-bold text-white mb-2">수고하셨어요!</h2>
                    <p className="text-slate-400 mb-6">
                      다음에 더 좋은 인연이 기다리고 있을 거예요
                    </p>
                    <button className="w-full py-4 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors">
                      새로운 매칭 시작하기
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Brand */}
      <div className="text-center py-4 text-purple-400/40 text-xs">
        💜 DuoDate Secret Room
      </div>
    </div>
  );
}
