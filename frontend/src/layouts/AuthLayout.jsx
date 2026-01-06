// Auth Layout (Login/Register)

import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 py-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl">💜</span>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            DuoDate
          </h1>
        </div>
        <p className="text-purple-300 mt-2">
          게임은 핑계고, 우리 사이엔 묘한 기류가 흐른다
        </p>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-slate-500 text-sm">
        © 2024 DuoDate. All rights reserved.
      </footer>
    </div>
  );
}
