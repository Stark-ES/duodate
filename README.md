# DuoDate - 게이머 전용 익명 데이트 매칭 서비스

> 💜 "게임은 핑계고, 우리 사이엔 묘한 기류가 흐른다"

## 📁 프로젝트 구조

```
duodate/
├── backend/                       # Express API 서버
│   ├── src/
│   │   ├── index.js              # 메인 서버 (매칭 API + Socket.io)
│   │   └── auth.js               # 인증 (JWT + Discord OAuth)
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma ORM 스키마
│   │   └── seed.js               # 시드 데이터
│   ├── package.json
│   ├── .env.example
│   └── AUTH.md
│
├── frontend/                      # React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── router.jsx            # React Router
│   │   ├── stores/index.js       # Zustand
│   │   ├── utils/auth.js         # 인증 유틸
│   │   ├── layouts/              # MainLayout, AuthLayout
│   │   └── pages/                # 12개 페이지
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── discord-bot/                   # 디스코드 봇
│   ├── index.js
│   ├── package.json
│   └── .env.example
│
├── database/                      # DB 스키마 (참조용)
│   ├── schema.sql
│   └── erd.mermaid
│
├── components/                    # 독립 UI 컴포넌트
│   ├── duodate-test.jsx          # 성향 테스트
│   ├── duodate-chatroom.jsx      # 5분 채팅방
│   └── duodate-voiceroom.jsx     # 보이스룸
│
└── README.md
```

## 🚀 설치 및 실행

### 1. PostgreSQL 설정
```bash
# DB 생성
createdb duodate
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env   # 환경변수 수정
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev            # http://localhost:3000
```

### 3. Discord Bot
```bash
cd discord-bot
npm install
cp .env.example .env   # BOT_TOKEN 설정
npm start              # http://localhost:3001
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## ⚙️ 환경변수

### backend/.env
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/duodate"
JWT_SECRET=your-secret-key
DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=xxx
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
CLIENT_URL=http://localhost:5173
```

### discord-bot/.env
```env
DISCORD_BOT_TOKEN=xxx
DISCORD_SERVER_ID=xxx
```

## 🎮 핵심 기능

| 기능 | 설명 |
|------|------|
| 성향 테스트 | V/F/R/C 4가지 유형 분류 |
| 16개 버킷 매칭 | 게임×유형 조합, FIFO |
| 5분 채팅 | 아이스브레이킹, 밸런스게임 |
| 1시간 보이스 | 디스코드 비공개 채널 |
| 좋아요 시스템 | 상호 좋아요 → 인연 연결 |

## 📡 주요 API

```
POST /api/auth/register     회원가입
POST /api/auth/login        로그인
GET  /api/auth/discord      디스코드 OAuth

POST /api/queue/join        대기열 참가
POST /api/match/request     매칭 요청
POST /api/match/:id/decision  YES/NO
POST /api/match/:id/like    좋아요/패스
```

## 🛠 기술 스택

- **Frontend**: React, Vite, Zustand, Tailwind
- **Backend**: Express, Socket.io, Prisma
- **Database**: PostgreSQL
- **Auth**: JWT, Discord OAuth2
- **Bot**: discord.js v14
# duodate
