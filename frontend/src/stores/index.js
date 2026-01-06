// DuoDate State Management - Zustand (Production)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io } from 'socket.io-client';

// 배포 환경에서는 환경변수 사용
const API_URL = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================
// Socket Instance
// ============================================
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

// ============================================
// Auth Store
// ============================================
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => set({ token }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          
          if (data.token) {
            set({ user: data.user, token: data.token, isAuthenticated: true });
            getSocket().emit('join', data.user.id);
            return { success: true };
          }
          return { success: false, error: data.error };
        } catch (error) {
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email, password, nickname, gender) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, nickname, gender }),
          });
          const data = await res.json();
          
          if (data.token) {
            set({ user: data.user, token: data.token, isAuthenticated: true });
            getSocket().emit('join', data.user.id);
            return { success: true };
          }
          return { success: false, error: data.error };
        } catch (error) {
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        socket?.disconnect();
        socket = null;
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
    }),
    {
      name: 'duodate-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

// ============================================
// Test Store (성향 테스트)
// ============================================
export const useTestStore = create((set, get) => ({
  step: 0,
  gender: null,
  selectedType: null,
  selectedGame: null,
  deepDiveAnswer: null,
  isComplete: false,

  setStep: (step) => set({ step }),
  setGender: (gender) => set({ gender }),
  setSelectedType: (type) => set({ selectedType: type }),
  setSelectedGame: (game) => set({ selectedGame: game }),
  setDeepDiveAnswer: (answer) => set({ deepDiveAnswer: answer }),

  nextStep: () => set((state) => ({ step: state.step + 1 })),

  getResult: () => {
    const { selectedType, deepDiveAnswer } = get();
    const scores = { V: 0, F: 0, R: 0, C: 0 };
    if (selectedType) scores[selectedType] += 2;
    if (deepDiveAnswer) scores[deepDiveAnswer] += 1;
    
    const maxScore = Math.max(...Object.values(scores));
    return Object.keys(scores).find((k) => scores[k] === maxScore);
  },

  completeTest: () => {
    const result = get().getResult();
    set({ isComplete: true });
    return {
      gender: get().gender,
      type: result,
      game: get().selectedGame,
      bucket: `${get().selectedGame}_${result}`,
    };
  },

  reset: () => set({
    step: 0,
    gender: null,
    selectedType: null,
    selectedGame: null,
    deepDiveAnswer: null,
    isComplete: false,
  }),
}));

// ============================================
// Queue Store (매칭 대기열)
// ============================================
export const useQueueStore = create((set, get) => ({
  isInQueue: false,
  queueGame: null,
  queueType: null,
  position: null,
  isSearching: false,

  joinQueue: async (game, type) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Not authenticated' };

    set({ isSearching: true });
    
    try {
      const res = await fetch(`${API_URL}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, game, type }),
      });
      const data = await res.json();

      if (data.success) {
        set({
          isInQueue: true,
          queueGame: game,
          queueType: type,
          position: data.position,
          isSearching: false,
        });
        return { success: true, position: data.position };
      }
      return { success: false, error: data.error };
    } catch (error) {
      set({ isSearching: false });
      return { success: false, error: error.message };
    }
  },

  leaveQueue: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      await fetch(`${API_URL}/api/queue/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch (error) {
      console.error('Leave queue error:', error);
    }
    
    set({
      isInQueue: false,
      queueGame: null,
      queueType: null,
      position: null,
    });
  },

  updatePosition: (position) => set({ position }),

  requestMatch: async (game, type) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Not authenticated' };

    set({ isSearching: true });

    try {
      const res = await fetch(`${API_URL}/api/match/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, game, type }),
      });
      const data = await res.json();

      set({ isSearching: false });

      if (data.matched) {
        return { success: true, matched: true, matchId: data.matchId };
      } else {
        set({
          isInQueue: true,
          queueGame: game,
          queueType: type,
          position: data.position,
        });
        return { success: true, matched: false, position: data.position };
      }
    } catch (error) {
      set({ isSearching: false });
      return { success: false, error: error.message };
    }
  },

  reset: () => set({
    isInQueue: false,
    queueGame: null,
    queueType: null,
    position: null,
    isSearching: false,
  }),
}));

// ============================================
// Match Store (현재 매칭)
// ============================================
export const useMatchStore = create((set, get) => ({
  currentMatch: null,
  partner: null,
  matchStatus: null,
  chatMessages: [],
  myDecision: null,
  partnerDecision: null,
  discordRoom: null,

  setMatch: (match, partner) => set({
    currentMatch: match,
    partner,
    matchStatus: match.status,
    chatMessages: [],
    myDecision: null,
    partnerDecision: null,
  }),

  fetchMatch: async (matchId) => {
    try {
      const res = await fetch(`${API_URL}/api/match/${matchId}`);
      const match = await res.json();
      
      const user = useAuthStore.getState().user;
      const partner = match.userAId === user.id ? match.userB : match.userA;
      
      set({
        currentMatch: match,
        partner,
        matchStatus: match.status,
        discordRoom: match.discordRoom,
      });
      
      return match;
    } catch (error) {
      console.error('Fetch match error:', error);
      return null;
    }
  },

  addMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message],
  })),

  sendMessage: (content) => {
    const { currentMatch } = get();
    const user = useAuthStore.getState().user;
    
    if (!currentMatch || !user) return;

    const message = {
      id: Date.now().toString(),
      matchId: currentMatch.id,
      senderId: user.id,
      content,
      timestamp: new Date(),
      type: 'me',
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    }));

    getSocket().emit('chat:message', {
      matchId: currentMatch.id,
      userId: user.id,
      content,
    });
  },

  setDecision: async (decision) => {
    const { currentMatch } = get();
    const user = useAuthStore.getState().user;

    if (!currentMatch || !user) return;

    set({ myDecision: decision });

    try {
      const res = await fetch(`${API_URL}/api/match/${currentMatch.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, decision }),
      });
      const data = await res.json();

      if (data.result === 'voice_ready') {
        set({ 
          matchStatus: 'VOICE_1HOUR', 
          discordRoom: data.discordRoom 
        });
      } else if (data.result === 'ended') {
        set({ matchStatus: 'CANCELED' });
      }

      return data;
    } catch (error) {
      console.error('Decision error:', error);
      return { error: error.message };
    }
  },

  setPartnerDecision: (decision) => set({ partnerDecision: decision }),

  setDiscordRoom: (room) => set({ discordRoom: room }),

  sendLike: async (interaction) => {
    const { currentMatch } = get();
    const user = useAuthStore.getState().user;

    if (!currentMatch || !user) return;

    try {
      const res = await fetch(`${API_URL}/api/match/${currentMatch.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, interaction }),
      });
      const data = await res.json();

      if (data.result === 'linked') {
        set({ matchStatus: 'LINKED' });
      }

      return data;
    } catch (error) {
      console.error('Like error:', error);
      return { error: error.message };
    }
  },

  updateStatus: (status) => set({ matchStatus: status }),

  reset: () => set({
    currentMatch: null,
    partner: null,
    matchStatus: null,
    chatMessages: [],
    myDecision: null,
    partnerDecision: null,
    discordRoom: null,
  }),
}));

// ============================================
// UI Store (전역 UI 상태)
// ============================================
export const useUIStore = create((set) => ({
  isLoading: false,
  toast: null,
  modal: null,

  setLoading: (isLoading) => set({ isLoading }),

  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },

  hideToast: () => set({ toast: null }),

  showModal: (modal) => set({ modal }),
  
  hideModal: () => set({ modal: null }),
}));

// ============================================
// Socket Event Handlers
// ============================================
export const initSocketListeners = () => {
  const socket = getSocket();

  socket.on('queue:joined', (data) => {
    useQueueStore.getState().updatePosition(data.position);
  });

  socket.on('queue:left', () => {
    useQueueStore.getState().reset();
  });

  socket.on('match:found', (data) => {
    useQueueStore.getState().reset();
    useMatchStore.getState().setMatch(
      { id: data.matchId, matchCode: data.matchCode, game: data.game, matchType: data.type },
      data.partner
    );
    useUIStore.getState().showToast('🎉 매칭 성공!', 'success');
  });

  socket.on('chat:message', (data) => {
    useMatchStore.getState().addMessage({
      id: data.timestamp,
      senderId: data.senderId,
      content: data.content,
      timestamp: data.timestamp,
      type: 'partner',
    });
  });

  socket.on('chat:partnerReady', () => {
    useMatchStore.getState().setPartnerDecision(true);
    useUIStore.getState().showToast('💕 상대방이 YES를 선택했어요!', 'success');
  });

  socket.on('match:voiceReady', (data) => {
    useMatchStore.getState().setDiscordRoom(data.discordRoom);
    useMatchStore.getState().updateStatus('VOICE_1HOUR');
  });

  socket.on('match:ended', () => {
    useMatchStore.getState().updateStatus('CANCELED');
    useUIStore.getState().showToast('매칭이 종료되었습니다', 'info');
  });

  socket.on('match:linked', () => {
    useMatchStore.getState().updateStatus('LINKED');
    useUIStore.getState().showToast('🎉 서로 좋아요! 인연이 연결되었어요!', 'success');
  });

  socket.on('like:received', () => {
    useUIStore.getState().showToast('💕 누군가 좋아요를 보냈어요!', 'info');
  });
};
