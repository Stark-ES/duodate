import React, { useState, useEffect } from 'react';

const GAMES = {
  LOL: { name: '롤 (LoL)', icon: '⚔️', desc: '서로 넥서스 지키다 정들고 싶을 때', color: '#C89B3C' },
  TFT: { name: '전략적 팀 전투 (TFT)', icon: '🎲', desc: '느긋하게 수다 떨며 운명적인 조합을 찾을 때', color: '#9D48E0' },
  OW: { name: '오버워치', icon: '🎯', desc: '나노 강화제처럼 당신의 텐션을 확 끌어올리고 싶을 때', color: '#F99E1A' },
  PUBG: { name: '배틀그라운드', icon: '🚗', desc: '자기장 좁혀올 때 우리 둘만 차 안에 남겨진다면?', color: '#F2A900' }
};

const TYPES = {
  V: { name: 'Victory', label: '캐리형', color: '#EF4444', icon: '🏆', desc: '압도적인 실력과 짜릿한 승리' },
  F: { name: 'Funny', label: '분위기 메이커', color: '#F59E0B', icon: '😂', desc: '끊이지 않는 웃음과 광대 승천' },
  R: { name: 'Romantic', label: '설렘 유발형', color: '#EC4899', icon: '💕', desc: '간질간질한 설렘과 목소리 플러팅' },
  C: { name: 'Comfort', label: '힐링형', color: '#10B981', icon: '☕', desc: '따뜻한 위로와 편안한 힐링' }
};

const TYPE_QUESTIONS = {
  V: '"져본 적 없는데.. 오늘 나랑 연승 고?"',
  F: '"게임은 핑계고, 나랑 티키타카 하느라 배꼽 빠질걸요?"',
  R: '"목소리에 좀 예민한 편인가요? 저 오늘 고막 남친/여친 예약인데."',
  C: '"시끄러운 건 딱 질색. 우리 둘이 조용히 새벽 감성이나 나눌까요?"'
};

const DEEP_DIVE = {
  LOL: {
    situation: '억제기 다 밀리고 넥서스만 남은 상황, 당신 옆의 파트너가 "아, 이건 좀 힘들겠는데.."라며 한숨 쉰다면?',
    answers: {
      V: '"조용히 해. 아직 안 끝났어. 나만 믿고 따라와."',
      F: '"괜찮아! 우리가 지는 게 아니라 넥서스가 양보하는 거야ㅋㅋ"',
      R: '"너무 속상해하지 마요. 지면 어때, 당신이랑 한 판 더 할 수 있어서 좋은데."',
      C: '"고생 많았어요. 이번 판 끝나고 같이 좀 쉴까요?"'
    }
  },
  TFT: {
    situation: '새벽 2시, 파트너가 8등만 계속해서 멘탈이 나갔을 때, 당신이 건넬 첫마디는?',
    answers: {
      V: '"덱 구성이 엉망이네. 지금부터 내가 시키는 대로만 해봐. 1등 만들어줄게."',
      F: '"와, 이건 운빨 ㅈㅁㄱ.. 아니, 신이 당신을 시기하나 본데? 다음 판은 내가 액땜해줌!"',
      R: '"원래 이 게임이 그래요. 근데.. 목소리가 왜 이렇게 시무룩해, 마음 아프게."',
      C: '"잠깐 기물 사고파는 거 멈추고, 그냥 나랑 일상 얘기나 좀 할래요?"'
    }
  },
  OW: {
    situation: '난전 중에 당신이 파트너에게 나노 강화제(아나 궁)를 줬을 때, 파트너가 "와! 대박!"이라고 소리친다면?',
    answers: {
      V: '"당연한 거 아냐? 이제 가서 다 쓸어버려. 내가 뒤에서 다 보고 있어."',
      F: '"이거 받았으니까 5인궁 못하면 오늘 집 못 가요!ㅋㅋㅋ"',
      R: '"내가 준 선물이에요. 당신이 제일 빛나는 거 보고 싶어서."',
      C: '"당황하지 말고 천천히 해요. 내가 옆에서 지켜줄 테니까."'
    }
  },
  PUBG: {
    situation: '자기장을 피해 단둘이 차를 타고 노을 지는 에란겔을 달리고 있습니다. 어색한 침묵이 흐를 때 당신은?',
    answers: {
      V: '"전방 2시 방향 보급 떨어졌다. 뺏으러 간다. 꽉 잡아."',
      F: '"오우! 방금 봤음? 제 운전 실력 쩔죠?" (차로 갑자기 점프 묘기를 부리며)',
      R: '"노을 진짜 예쁘다.. 근데 옆에 탄 사람 때문에 풍경이 눈에 안 들어오네."',
      C: '"오늘 하루는 어땠어요? 게임 말고 그냥 당신 이야기가 듣고 싶어서요."'
    }
  }
};

export default function DuoDateTest() {
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [deepDiveAnswer, setDeepDiveAnswer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [silhouetteOpacity, setSilhouetteOpacity] = useState(0.1);

  useEffect(() => {
    setSilhouetteOpacity(0.1 + step * 0.25);
  }, [step]);

  const handleSelect = (setter, value, nextStep) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setter(value);
    
    setTimeout(() => {
      setStep(nextStep);
      setIsAnimating(false);
    }, 400);
  };

  const resetTest = () => {
    setStep(0);
    setGender(null);
    setSelectedType(null);
    setSelectedGame(null);
    setDeepDiveAnswer(null);
  };

  const getResult = () => {
    const scores = { V: 0, F: 0, R: 0, C: 0 };
    if (selectedType) scores[selectedType] += 2;
    if (deepDiveAnswer) scores[deepDiveAnswer] += 1;
    
    const maxScore = Math.max(...Object.values(scores));
    const resultType = Object.keys(scores).find(k => scores[k] === maxScore);
    return resultType;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg relative">
        
        {/* Silhouette Background */}
        <div 
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 transition-opacity duration-700"
          style={{ opacity: silhouetteOpacity }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-b from-pink-500/30 to-purple-500/30 blur-3xl" />
          <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-50">
            {gender === 'M' ? '👩' : gender === 'F' ? '👨' : '💫'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 relative z-10">
          <div className="flex justify-between text-xs text-purple-300 mb-2">
            <span>Phase {Math.min(step + 1, 4)}</span>
            <span>{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Card Container */}
        <div className={`bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-purple-500/20 transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
          
          {/* Step 0: Gender Selection */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">당신은 누구인가요?</h2>
                <p className="text-purple-300 text-sm">오늘 밤의 시작</p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleSelect(setGender, 'M', 1)}
                  className="w-full p-6 rounded-2xl bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🛡️</span>
                    <div className="text-left">
                      <p className="text-white font-semibold text-lg">오늘 밤 당신을 지켜줄 '그'</p>
                      <p className="text-blue-300 text-sm group-hover:text-blue-200">남성으로 참여하기</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelect(setGender, 'F', 1)}
                  className="w-full p-6 rounded-2xl bg-gradient-to-r from-pink-600/20 to-pink-500/10 border border-pink-500/30 hover:border-pink-400 hover:bg-pink-500/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🌙</span>
                    <div className="text-left">
                      <p className="text-white font-semibold text-lg">함께 밤새워 게임할 '그녀'</p>
                      <p className="text-pink-300 text-sm group-hover:text-pink-200">여성으로 참여하기</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Type Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">
                  오늘 밤, 당신의 게임은 어떤 색깔이었으면 좋겠나요?
                </h2>
                <p className="text-purple-300 text-sm">
                  {gender === 'M' ? '당신의 매력을 선택하세요' : '원하는 파트너 스타일을 선택하세요'}
                </p>
              </div>
              
              <div className="space-y-3">
                {Object.entries(TYPES).map(([key, type]) => (
                  <button
                    key={key}
                    onClick={() => handleSelect(setSelectedType, key, 2)}
                    className="w-full p-4 rounded-xl border transition-all text-left hover:scale-[1.02]"
                    style={{ 
                      borderColor: `${type.color}40`,
                      background: `linear-gradient(135deg, ${type.color}10, transparent)`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = type.color;
                      e.currentTarget.style.background = `linear-gradient(135deg, ${type.color}25, ${type.color}10)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${type.color}40`;
                      e.currentTarget.style.background = `linear-gradient(135deg, ${type.color}10, transparent)`;
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1">
                        <p className="text-white font-medium">{TYPE_QUESTIONS[key]}</p>
                        <p className="text-sm mt-1" style={{ color: type.color }}>{type.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Game Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">우리, 어떤 판에서 만날까요?</h2>
                <p className="text-purple-300 text-sm">오늘의 전장을 선택하세요</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(GAMES).map(([key, game]) => (
                  <button
                    key={key}
                    onClick={() => handleSelect(setSelectedGame, key, 3)}
                    className="p-4 rounded-xl border border-slate-600 hover:border-purple-400 bg-slate-700/50 hover:bg-slate-700 transition-all text-center group"
                  >
                    <span className="text-3xl block mb-2">{game.icon}</span>
                    <p className="text-white font-medium text-sm">{game.name}</p>
                    <p className="text-purple-300 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{game.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Deep Dive */}
          {step === 3 && selectedGame && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm mb-4">
                  {GAMES[selectedGame].icon} {GAMES[selectedGame].name}
                </div>
                <h2 className="text-lg font-bold text-white leading-relaxed">
                  {DEEP_DIVE[selectedGame].situation}
                </h2>
              </div>
              
              <div className="space-y-3">
                {Object.entries(DEEP_DIVE[selectedGame].answers).map(([key, answer]) => (
                  <button
                    key={key}
                    onClick={() => handleSelect(setDeepDiveAnswer, key, 4)}
                    className="w-full p-4 rounded-xl border transition-all text-left hover:scale-[1.01]"
                    style={{ 
                      borderColor: `${TYPES[key].color}30`,
                      background: `linear-gradient(135deg, ${TYPES[key].color}08, transparent)`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = TYPES[key].color;
                      e.currentTarget.style.background = `linear-gradient(135deg, ${TYPES[key].color}20, ${TYPES[key].color}05)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${TYPES[key].color}30`;
                      e.currentTarget.style.background = `linear-gradient(135deg, ${TYPES[key].color}08, transparent)`;
                    }}
                  >
                    <p className="text-white text-sm">{answer}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              {(() => {
                const resultType = getResult();
                const result = TYPES[resultType];
                return (
                  <>
                    <div 
                      className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl"
                      style={{ background: `linear-gradient(135deg, ${result.color}40, ${result.color}20)` }}
                    >
                      {result.icon}
                    </div>
                    
                    <div>
                      <p className="text-purple-300 text-sm mb-1">당신의 유형은</p>
                      <h2 className="text-3xl font-bold mb-2" style={{ color: result.color }}>
                        TYPE_{resultType}
                      </h2>
                      <p className="text-xl text-white font-medium">{result.label}</p>
                      <p className="text-purple-300 mt-2">{result.desc}</p>
                    </div>

                    <div className="pt-4 space-y-3">
                      <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600">
                        <p className="text-sm text-purple-300 mb-1">선택한 게임</p>
                        <p className="text-white font-medium flex items-center justify-center gap-2">
                          {GAMES[selectedGame].icon} {GAMES[selectedGame].name}
                        </p>
                      </div>

                      <button 
                        className="w-full py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: `linear-gradient(135deg, ${result.color}, ${result.color}CC)` }}
                      >
                        🎮 매칭 시작하기
                      </button>

                      <button 
                        onClick={resetTest}
                        className="w-full py-3 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                      >
                        다시 테스트하기
                      </button>
                    </div>

                    {/* Result Data (for development) */}
                    <div className="mt-6 p-3 rounded-lg bg-slate-900/50 text-left">
                      <p className="text-xs text-slate-500 font-mono">
                        Result Data: {JSON.stringify({
                          gender,
                          type: resultType,
                          game: selectedGame,
                          bucket: `${selectedGame}_${resultType}`
                        }, null, 2)}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Brand Footer */}
        <div className="text-center mt-6 text-purple-400/60 text-sm">
          <p>💜 DuoDate</p>
          <p className="text-xs mt-1">게임은 핑계고, 우리 사이엔 묘한 기류가 흐른다.</p>
        </div>
      </div>
    </div>
  );
}
