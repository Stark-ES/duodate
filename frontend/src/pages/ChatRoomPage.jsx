import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatchStore } from '../stores';

export default function ChatRoomPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { fetchMatch, matchStatus } = useMatchStore();

  useEffect(() => {
    fetchMatch(matchId);
  }, [matchId]);

  useEffect(() => {
    if (matchStatus === 'VOICE_1HOUR') {
      navigate(`/voice/${matchId}`);
    }
  }, [matchStatus, matchId, navigate]);

  // 실제로는 duodate-chatroom.jsx 컴포넌트를 import
  return (
    <div className="p-4">
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-white mb-4">5분 채팅방</h1>
        <p className="text-purple-300">Match ID: {matchId}</p>
        <p className="text-slate-400 mt-4">DuoDateChatRoom 컴포넌트가 렌더링됩니다</p>
      </div>
    </div>
  );
}
