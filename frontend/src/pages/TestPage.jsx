import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestStore, useAuthStore } from '../stores';

// 이 페이지는 기존에 만든 DuoDateTest 컴포넌트를 import하여 사용
// 여기서는 store와 연동하는 wrapper

export default function TestPage() {
  const navigate = useNavigate();
  const { completeTest, reset } = useTestStore();
  const { updateProfile } = useAuthStore();
  const user = useAuthStore((state) => state.user);

  const handleComplete = (result) => {
    // 유저 프로필 업데이트
    if (user?.gender === 'M') {
      updateProfile({ myType: result.type });
    } else {
      updateProfile({ preferredType: result.type });
    }
    navigate('/matching');
  };

  // 실제로는 duodate-test.jsx 컴포넌트를 import
  return (
    <div className="p-4">
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-white mb-4">성향 테스트</h1>
        <p className="text-purple-300 mb-8">이 페이지에 DuoDateTest 컴포넌트가 렌더링됩니다</p>
        <button 
          onClick={() => handleComplete({ type: 'R', game: 'LOL' })}
          className="px-6 py-3 bg-purple-500 text-white rounded-xl"
        >
          테스트 완료 (데모)
        </button>
      </div>
    </div>
  );
}
