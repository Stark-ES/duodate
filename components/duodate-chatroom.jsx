import React, { useState, useEffect, useRef } from 'react';

const TYPES = {
  V: { name: 'Victory', color: '#EF4444', icon: '⚔️', welcomeMsg: '전장에 승리를 가져다줄 파트너가 도착했습니다. "오늘 티어 올릴 준비 되셨나요?"라고 인사를 건네보세요!' },
  F: { name: 'Funny', color: '#F59E0B', icon: '🤣', welcomeMsg: '웃음 벨 주의! 광대 승천할 준비 되셨나요? 상대방의 유머 감각을 확인해보세요.' },
  R: { name: 'Romantic', color: '#EC4899', icon: '🌸', welcomeMsg: '묘한 기류가 흐르는 중.. 오늘 밤 두 분의 분위기를 책임질 로맨틱 파트너가 입장했습니다.' },
  C: { name: 'Comfort', color: '#10B981', icon: '☕', welcomeMsg: '고요한 새벽 감성을 함께 나눌 파트너입니다. 오늘 하루 어땠는지 가볍게 물어보며 시작할까요?' }
};

const BALANCE_GAMES = [
  { q: "게임 중 전멸 상황?", a: "멘붕 오기", b: "오히려 좋아!" },
  { q: "1시간 뒤 우리의 게임은?", a: "빡겜 연승", b: "노가리 힐링" },
  { q: "선호하는 목소리 톤?", a: "낮고 차분한 저음", b: "텐션 높은 하이톤" },
  { q: "첫 판에서 진다면?", a: "복수전 신청", b: "그냥 웃고 넘어가기" },
  { q: "게임 중 배고프면?", a: "배달 시켜서 먹방", b: "참고 끝까지 게임" },
  { q: "파트너가 실수했을 때?", a: "괜찮아~ 위로", b: "ㅋㅋㅋ 웃어버리기" }
];

const SECRET_MISSIONS = [
  "상대방에게 '목소리 궁금해요'라고 말해보세요 🎧",
  "'오늘 컨디션 어때요?'라고 물어보세요 💭",
  "상대방 닉네임 칭찬해보세요 ✨",
  "'다음에 또 게임해요'라고 말해보세요 🎮"
];

export default function DuoDateChatRoom() {
  // Demo data - would come from matching system
  const [matchData] = useState({
    partnerType: 'R',
    partnerTags: ['#플래티넘_원거리딜러', '#의외로_다정함', '#드립_장전완료'],
    partnerNickname: '새벽감성러',
    myGender: 'F',
    game: 'LOL'
  });

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [showBalanceGame, setShowBalanceGame] = useState(false);
  const [currentBalanceGame, setCurrentBalanceGame] = useState(null);
  const [balanceVotes, setBalanceVotes] = useState({ a: null, b: null });
  const [secretMission, setSecretMission] = useState(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [myDecision, setMyDecision] = useState(null);
  const [partnerDecision, setPartnerDecision] = useState(null);
  const [phase, setPhase] = useState('intro'); // intro, interaction, decision
  
  const messagesEndRef = useRef(null);
  const typeInfo = TYPES[matchData.partnerType];

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowDecisionModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Phase management
  useEffect(() => {
    if (timeLeft > 240) setPhase('intro');
    else if (timeLeft > 60) setPhase('interaction');
    else setPhase('decision');
  }, [timeLeft]);

  // Welcome message
  useEffect(() => {
    const welcomeMsg = {
      id: 'system-welcome',
      type: 'system',
      icon: typeInfo.icon,
      text: typeInfo.welcomeMsg,
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);

    // Secret mission for female users
    if (matchData.myGender === 'F') {
      setTimeout(() => {
        setSecretMission(SECRET_MISSIONS[Math.floor(Math.random() * SECRET_MISSIONS.length)]);
      }, 3000);
    }
  }, []);

  // Auto balance game popup
  useEffect(() => {
    if (timeLeft === 240 || timeLeft === 180 || timeLeft === 120) {
      triggerBalanceGame();
    }
  }, [timeLeft]);

  // Decision phase hint
  useEffect(() => {
    if (phase === 'decision' && timeLeft === 60) {
      addSystemMessage('💝 상대방이 마음에 든다면 칭찬 한마디를 남겨보세요!');
    }
  }, [phase, timeLeft]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, {
      id: `system-${Date.now()}`,
      type: 'system',
      text,
      timestamp: new Date()
    }]);
  };

  const triggerBalanceGame = () => {
    const game = BALANCE_GAMES[Math.floor(Math.random() * BALANCE_GAMES.length)];
    setCurrentBalanceGame(game);
    setBalanceVotes({ a: null, b: null });
    setShowBalanceGame(true);
  };

  const handleBalanceVote = (choice) => {
    setBalanceVotes(prev => ({ ...prev, a: choice }));
    // Simulate partner vote
    setTimeout(() => {
      const partnerChoice = Math.random() > 0.5 ? 'a' : 'b';
      setBalanceVotes(prev => ({ ...prev, b: partnerChoice }));
      
      setTimeout(() => {
        const resultText = balanceVotes.a === partnerChoice 
          ? '🎉 취향이 통했어요!' 
          : '😆 서로 다른 취향이네요!';
        addSystemMessage(`[밸런스 게임] ${currentBalanceGame.q} → ${resultText}`);
        setShowBalanceGame(false);
      }, 1500);
    }, 1000);
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMsg = {
      id: `msg-${Date.now()}`,
      type: 'me',
      text: inputText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulate partner response
    setTimeout(() => {
      const responses = [
        '오 진짜요? ㅋㅋㅋ',
        '저도 그렇게 생각해요!',
        '헐 대박 ㅋㅋ',
        '오늘 게임 기대되네요~',
        '목소리 좋으시네요 👀'
      ];
      const partnerMsg = {
        id: `partner-${Date.now()}`,
        type: 'partner',
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, partnerMsg]);
    }, 1500 + Math.random() * 2000);
  };

  const handleDecision = (decision) => {
    setMyDecision(decision);
    // Simulate partner decision
    setTimeout(() => {
      setPartnerDecision(Math.random() > 0.3 ? 'yes' : 'no');
    }, 2000);
  };

  const getTimerColor = () => {
    if (timeLeft <= 60) return '#EF4444';
    if (timeLeft <= 120) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col max-w-lg mx-auto">
      
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ background: `${typeInfo.color}30` }}
            >
              {typeInfo.icon}
            </div>
            <div>
              <p className="text-white font-medium">{matchData.partnerNickname}</p>
              <p className="text-xs" style={{ color: typeInfo.color }}>TYPE_{matchData.partnerType}</p>
            </div>
          </div>
          
          {/* Timer */}
          <div 
            className="px-4 py-2 rounded-full font-mono text-lg font-bold"
            style={{ 
              background: `${getTimerColor()}20`,
              color: getTimerColor()
            }}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Partner Tags */}
        <div className="flex flex-wrap gap-2">
          {matchData.partnerTags.map((tag, i) => (
            <span 
              key={i}
              className="px-2 py-1 rounded-full text-xs"
              style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Phase Indicator */}
        <div className="mt-3 flex gap-1">
          {['intro', 'interaction', 'decision'].map((p, i) => (
            <div 
              key={p}
              className={`flex-1 h-1 rounded-full transition-all ${phase === p ? 'opacity-100' : 'opacity-30'}`}
              style={{ background: phase === p ? typeInfo.color : '#64748b' }}
            />
          ))}
        </div>
      </div>

      {/* Balance Game Tip Button */}
      <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700">
        <button
          onClick={triggerBalanceGame}
          className="w-full py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <span>💬</span> 오늘의 대화 팁
        </button>
      </div>

      {/* Secret Mission (Female only) */}
      {secretMission && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-pink-500/10 border border-pink-500/30">
          <div className="flex items-start gap-2">
            <span className="text-lg">🤫</span>
            <div>
              <p className="text-pink-400 text-xs font-medium mb-1">시크릿 미션</p>
              <p className="text-pink-200 text-sm">{secretMission}</p>
            </div>
            <button 
              onClick={() => setSecretMission(null)}
              className="text-pink-400/50 hover:text-pink-400 ml-auto"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.type === 'system' ? (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                {msg.icon && <span className="text-xl">{msg.icon}</span>}
                <p className="text-slate-300 text-sm">{msg.text}</p>
              </div>
            ) : msg.type === 'me' ? (
              <div className="flex justify-end">
                <div className="max-w-[75%] px-4 py-2 rounded-2xl rounded-br-sm bg-purple-600 text-white">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div 
                  className="max-w-[75%] px-4 py-2 rounded-2xl rounded-bl-sm"
                  style={{ background: `${typeInfo.color}20`, color: 'white' }}
                >
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Decision Phase Hint */}
      {phase === 'decision' && (
        <div className="mx-4 mb-2 p-2 rounded-lg bg-pink-500/10 text-center">
          <p className="text-pink-300 text-sm">💝 마지막 1분! 보이스룸으로 이동할 준비 되셨나요?</p>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
          >
            전송
          </button>
        </div>
      </div>

      {/* Balance Game Modal */}
      {showBalanceGame && currentBalanceGame && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-6 border border-purple-500/30">
            <div className="text-center mb-6">
              <span className="text-3xl">⚖️</span>
              <h3 className="text-white font-bold text-lg mt-2">밸런스 게임</h3>
              <p className="text-purple-300 mt-1">{currentBalanceGame.q}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleBalanceVote('a')}
                disabled={balanceVotes.a !== null}
                className={`w-full p-4 rounded-xl border transition-all ${
                  balanceVotes.a === 'a' 
                    ? 'bg-blue-500/30 border-blue-500' 
                    : 'bg-slate-700/50 border-slate-600 hover:border-blue-400'
                } ${balanceVotes.a !== null ? 'cursor-default' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">{currentBalanceGame.a}</span>
                  {balanceVotes.b === 'a' && <span className="text-blue-400">← 상대방</span>}
                </div>
              </button>

              <button
                onClick={() => handleBalanceVote('b')}
                disabled={balanceVotes.a !== null}
                className={`w-full p-4 rounded-xl border transition-all ${
                  balanceVotes.a === 'b' 
                    ? 'bg-pink-500/30 border-pink-500' 
                    : 'bg-slate-700/50 border-slate-600 hover:border-pink-400'
                } ${balanceVotes.a !== null ? 'cursor-default' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">{currentBalanceGame.b}</span>
                  {balanceVotes.b === 'b' && <span className="text-pink-400">← 상대방</span>}
                </div>
              </button>
            </div>

            {balanceVotes.a && !balanceVotes.b && (
              <p className="text-center text-slate-400 text-sm mt-4">상대방의 선택을 기다리는 중...</p>
            )}
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-6 border border-purple-500/30">
            
            {!myDecision ? (
              <>
                <div className="text-center mb-6">
                  <span className="text-5xl">💜</span>
                  <h3 className="text-white font-bold text-xl mt-3">5분이 지났어요!</h3>
                  <p className="text-purple-300 mt-2">
                    {matchData.partnerNickname}님과<br/>
                    1시간 보이스 데이트를 시작할까요?
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleDecision('yes')}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-lg hover:opacity-90 transition-opacity"
                  >
                    💕 YES, 보이스룸으로!
                  </button>
                  <button
                    onClick={() => handleDecision('no')}
                    className="w-full py-4 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                  >
                    다음 기회에...
                  </button>
                </div>
              </>
            ) : !partnerDecision ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                  <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-white font-medium">상대방의 답변을 기다리는 중...</p>
                {myDecision === 'yes' && (
                  <p className="text-pink-400 text-sm mt-2 animate-pulse">
                    ❤️ 당신의 마음이 전달되었어요!
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                {myDecision === 'yes' && partnerDecision === 'yes' ? (
                  <>
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-2xl font-bold text-white mb-2">매칭 성공!</h3>
                    <p className="text-purple-300 mb-6">두 분의 1시간 데이트가 시작됩니다</p>
                    <button className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold">
                      🎧 보이스룸 입장하기
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-4">😢</div>
                    <h3 className="text-xl font-bold text-white mb-2">아쉽지만...</h3>
                    <p className="text-slate-400 mb-6">
                      {myDecision === 'no' 
                        ? '다음에 더 좋은 인연을 만나요!' 
                        : '상대방이 아직 준비가 안 됐나 봐요'}
                    </p>
                    <button className="w-full py-3 rounded-xl border border-slate-600 text-slate-300">
                      새로운 매칭 시작하기
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
