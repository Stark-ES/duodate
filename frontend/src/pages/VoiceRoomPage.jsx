import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useMatchStore } from '../stores';

export default function VoiceRoomPage() {
  const { matchId } = useParams();
  const { fetchMatch, discordRoom } = useMatchStore();

  useEffect(() => {
    fetchMatch(matchId);
  }, [matchId]);

  // 실제로는 duodate-voiceroom.jsx 컴포넌트를 import
  return (
    <div className="p-4">
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-white mb-4">보이스룸</h1>
        <p className="text-purple-300">Match ID: {matchId}</p>
        {discordRoom && (
          <a href={discordRoom.deepLink} className="mt-4 inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl">
            디스코드 열기
          </a>
        )}
      </div>
    </div>
  );
}
