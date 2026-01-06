# DuoDate Database Schema

## 개요

듀오데이트 서비스를 위한 PostgreSQL 데이터베이스 스키마입니다.

## 핵심 테이블

### 1. users
유저 정보 및 프로필

| 컬럼 | 설명 |
|------|------|
| `my_type` | 내 성향 (남성이 테스트 후 저장) |
| `preferred_type` | 원하는 상대 유형 (여성이 선택) |
| `discord_id` | 디스코드 OAuth 연동 ID |
| `free_likes_today` | 오늘 남은 무료 좋아요 (매일 리셋) |

### 2. matching_queue
16개 버킷 매칭 대기열

```
버킷 키 = game + type
예: LOL_V, TFT_R, PUBG_C, OW_F
```

| 컬럼 | 설명 |
|------|------|
| `game` | LOL, TFT, OW, PUBG |
| `type` | V, F, R, C |
| `status` | WAITING → MATCHED |
| `position` | 대기 순번 (남성에게 노출) |

### 3. matches
매칭 기록

| 상태 | 설명 |
|------|------|
| `CHATTING_5MIN` | 5분 채팅 중 |
| `DECIDING` | YES/NO 결정 중 |
| `VOICE_1HOUR` | 보이스 데이트 중 |
| `EXPIRED` | 종료 (좋아요 대기) |
| `LINKED` | 상호 좋아요 성공 |

### 4. interactions
좋아요/패스 기록

```sql
-- 상호 좋아요 체크
SELECT check_mutual_like('match-uuid');
```

### 5. discord_rooms
디스코드 채널 관리

| 컬럼 | 설명 |
|------|------|
| `voice_channel_id` | 보이스 채널 ID |
| `deep_link` | `discord://...` 딥링크 |
| `expires_at` | 60분 후 자동 삭제 |

## ENUM 타입

```sql
-- 성별
gender_type: 'M', 'F'

-- 매칭 유형
match_type: 'V', 'F', 'R', 'C'

-- 게임
game_type: 'LOL', 'TFT', 'OW', 'PUBG'

-- 매칭 상태
match_status: 'CHATTING_5MIN', 'DECIDING', 'VOICE_1HOUR', 'EXPIRED', 'LINKED', 'CANCELED'
```

## 주요 쿼리 예시

### 버킷에서 매칭 대기자 조회 (FIFO)
```sql
SELECT * FROM matching_queue
WHERE game = 'LOL' AND type = 'V' AND status = 'WAITING'
ORDER BY queued_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

### 버킷별 대기 현황
```sql
SELECT * FROM queue_stats;
-- game | type | waiting_count | oldest_wait
-- LOL  | V    | 5             | 2024-01-01 12:00:00
```

### 상호 좋아요 확인
```sql
SELECT * FROM interactions
WHERE match_id = 'xxx'
  AND interaction = 'LIKE'
HAVING COUNT(*) = 2;
```

### 매칭 성공률 통계
```sql
SELECT * FROM match_stats;
-- date       | total | voice_converted | linked
-- 2024-01-01 | 100   | 70              | 45
```

## 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| `matching_queue` | `(game, type, status, queued_at)` | 버킷별 FIFO 조회 |
| `matches` | `(status)` | 상태별 필터링 |
| `interactions` | `(match_id, interaction)` | 상호 좋아요 체크 |
| `discord_rooms` | `(is_active, expires_at)` | 만료 채널 정리 |

## 데이터 정규화

### 아이스브레이커 메시지 분리
```sql
-- 유형/게임별 메시지 템플릿
SELECT * FROM icebreaker_messages
WHERE message_type = 'welcome'
  AND (match_type = 'V' OR match_type IS NULL)
  AND (game = 'LOL' OR game IS NULL);
```

### 태그 분리
```sql
-- 유저 태그 (1:N)
SELECT tag FROM user_tags WHERE user_id = 'xxx';
-- #플래티넘_원거리딜러
-- #의외로_다정함
```

## 마이그레이션

```bash
# 스키마 적용
psql -U postgres -d duodate -f schema.sql

# 시드 데이터 포함
psql -U postgres -d duodate -f schema.sql
```

## 자동화 함수

| 함수 | 설명 |
|------|------|
| `update_updated_at()` | updated_at 자동 갱신 트리거 |
| `reset_daily_likes()` | 매일 무료 좋아요 리셋 (cron 연동) |
| `check_mutual_like(match_id)` | 상호 좋아요 여부 확인 |
