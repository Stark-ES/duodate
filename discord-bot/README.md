# DuoDate Discord Bot

듀오데이트 시크릿 보이스룸 관리 봇

## 기능

- 🔐 매칭된 두 사람만 접근 가능한 비공개 보이스/텍스트 채널 생성
- ⏰ 60분 후 자동 채널 삭제
- 💬 입장 시 환영 메시지
- ⚠️ 5분 전 종료 알림
- 🔗 딥링크 생성 (discord:// 프로토콜)

## 설치

```bash
npm install
cp .env.example .env
# .env 파일에 토큰 설정
npm start
```

## Discord Developer Portal 설정

1. https://discord.com/developers/applications 에서 앱 생성
2. Bot 탭에서 토큰 발급
3. OAuth2 > URL Generator에서 봇 초대 링크 생성
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Manage Channels`, `Connect`, `Speak`, `Send Messages`, `View Channels`

## API Endpoints

### POST /api/rooms
시크릿룸 생성

```json
{
  "matchId": "MATCH-ABC123",
  "userAId": "123456789",
  "userBId": "987654321",
  "userAName": "새벽감성러",
  "userBName": "밤새겜러",
  "matchType": "R",
  "game": "LoL"
}
```

Response:
```json
{
  "success": true,
  "matchId": "MATCH-ABC123",
  "voiceChannelId": "1234567890",
  "textChannelId": "0987654321",
  "serverId": "SERVER_ID",
  "deepLink": "discord://discord.com/channels/...",
  "webLink": "https://discord.com/channels/...",
  "expiresAt": 1704067200000
}
```

### GET /api/rooms/:matchId
룸 상태 조회

### DELETE /api/rooms/:matchId
룸 수동 삭제

### GET /api/rooms
활성 룸 목록

### GET /health
헬스체크

## 웹앱 연동 예시

```javascript
// 매칭 확정 시 시크릿룸 생성
const response = await fetch('http://bot-server:3001/api/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.BOT_API_SECRET,
  },
  body: JSON.stringify({
    matchId: match.id,
    userAId: match.userA.discordId,
    userBId: match.userB.discordId,
    userAName: match.userA.nickname,
    userBName: match.userB.nickname,
    matchType: match.type,
    game: match.game,
  }),
});

const { deepLink } = await response.json();
// deepLink를 클라이언트에 전달
```

## 유형별 메시지

| Type | Emoji | Name | 메시지 |
|------|-------|------|--------|
| V | ⚔️ | Victory | 오늘 티어 올릴 준비 되셨나요? |
| F | 🤣 | Funny | 광대 승천할 준비 되셨나요? |
| R | 🌸 | Romantic | 묘한 기류가 흐르는 중.. |
| C | ☕ | Comfort | 고요한 새벽 감성을 나눠보세요. |
