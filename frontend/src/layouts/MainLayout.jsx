// Main Layout with Navigation

import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore, initSocketListeners, getSocket } from '../stores';

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const { toast, isLoading } = useUIStore();
  const navigate = useNavigate();

  // Socket 초기화
  useEffect(() => {
    if (user) {
      const socket = getSocket();
      socket.emit('join', user.id);
      initSocketListeners();

      return () => {
        socket.off('queue:joined');
        socket.off('match:found');
        socket.off('chat:message');
        socket.off('match:voiceReady');
        socket.off('match:linked');
      };
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: '🏠', label: '홈' },
    { to: '/matching', icon: '💜', label: '매칭' },
    { to: '/likes', icon: '❤️', label: '좋아요' },
    { to: '/linked', icon: '🔗', label: '인연' },
    { to: '/profile', icon: '👤', label: '프로필' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-full shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            'bg-purple-500'
          }`}>
            <p className="text-white font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-slate-800/90 backdrop-blur border-b border-slate-700 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-2xl">💜</span>
            <span className="font-bold text-lg bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              DuoDate
            </span>
          </NavLink>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{user?.nickname}</span>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white text-sm"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-20 min-h-screen">
        <div className="max-w-lg mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur border-t border-slate-700 z-40">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-purple-400'
                    : 'text-slate-400 hover:text-white'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
