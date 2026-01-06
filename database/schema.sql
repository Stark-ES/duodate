-- ============================================
-- DuoDate Database Schema
-- PostgreSQL 15+
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM Types
-- ============================================

-- 성별
CREATE TYPE gender_type AS ENUM ('M', 'F');

-- 매칭 유형 (V: Victory, F: Funny, R: Romantic, C: Comfort)
CREATE TYPE match_type AS ENUM ('V', 'F', 'R', 'C');

-- 게임 종류
CREATE TYPE game_type AS ENUM ('LOL', 'TFT', 'OW', 'PUBG');

-- 매칭 상태
CREATE TYPE match_status AS ENUM (
  'CHATTING_5MIN',   -- 5분 채팅 중
  'DECIDING',        -- 보이스룸 진입 여부 결정 중
  'VOICE_1HOUR',     -- 1시간 보이스 데이트 중
  'EXPIRED',         -- 시간 종료 (매칭 연장 대기)
  'LINKED',          -- 상호 좋아요로 영구 연결됨
  'CANCELED'         -- 취소됨
);

-- 상호작용 타입
CREATE TYPE interaction_type AS ENUM ('LIKE', 'PASS');

-- 큐 상태
CREATE TYPE queue_status AS ENUM ('WAITING', 'MATCHED', 'CANCELED', 'EXPIRED');

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 기본 정보
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  gender gender_type NOT NULL,
  birth_date DATE,
  
  -- 프로필 (단계별 공개)
  profile_image_url TEXT,
  location VARCHAR(100),        -- 좋아요 후 공개
  mbti VARCHAR(4),
  hobby TEXT,
  bio TEXT,
  
  -- 게임 정보
  favorite_game game_type,
  game_tier VARCHAR(50),        -- ex: "플래티넘", "다이아"
  game_position VARCHAR(50),    -- ex: "원거리딜러", "서포터"
  
  -- 디스코드 연동
  discord_id VARCHAR(50) UNIQUE,
  discord_username VARCHAR(100),
  discord_linked_at TIMESTAMPTZ,
  
  -- 성향 테스트 결과
  my_type match_type,           -- 내 유형 (남성)
  preferred_type match_type,    -- 원하는 상대 유형 (여성)
  
  -- 통계
  total_matches INT DEFAULT 0,
  total_likes_sent INT DEFAULT 0,
  total_likes_received INT DEFAULT 0,
  mutual_likes INT DEFAULT 0,
  
  -- 유료 재화
  free_likes_today INT DEFAULT 1,
  paid_likes INT DEFAULT 0,
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_gender ON users(gender);
CREATE INDEX idx_users_discord_id ON users(discord_id);
CREATE INDEX idx_users_my_type ON users(my_type);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================
-- User Tags (프로필 태그)
-- ============================================
CREATE TABLE user_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,     -- ex: "#플래티넘_원거리딜러"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);

-- ============================================
-- Matching Queue (16개 버킷)
-- ============================================
CREATE TABLE matching_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 버킷 키 (LOL_V, TFT_R, PUBG_C 등)
  game game_type NOT NULL,
  type match_type NOT NULL,
  
  -- 상태
  status queue_status DEFAULT 'WAITING',
  position INT,                 -- 대기 순번
  
  -- 타임스탬프
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  matched_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  
  UNIQUE(user_id, status)       -- 한 유저는 동시에 하나의 대기열만
);

-- Indexes (버킷별 조회 최적화)
CREATE INDEX idx_queue_bucket ON matching_queue(game, type, status, queued_at);
CREATE INDEX idx_queue_user ON matching_queue(user_id);
CREATE INDEX idx_queue_waiting ON matching_queue(status) WHERE status = 'WAITING';

-- ============================================
-- Matches (매칭 기록)
-- ============================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_code VARCHAR(20) UNIQUE NOT NULL,  -- ex: "SECRET-A7B3"
  
  -- 참가자
  user_a_id UUID NOT NULL REFERENCES users(id),  -- 보통 남성
  user_b_id UUID NOT NULL REFERENCES users(id),  -- 보통 여성
  
  -- 매칭 정보
  game game_type NOT NULL,
  match_type match_type NOT NULL,
  
  -- 상태
  status match_status DEFAULT 'CHATTING_5MIN',
  
  -- 5분 채팅 결과
  user_a_chat_decision BOOLEAN,   -- YES: true, NO: false
  user_b_chat_decision BOOLEAN,
  chat_started_at TIMESTAMPTZ,
  chat_ended_at TIMESTAMPTZ,
  
  -- 1시간 보이스 결과
  voice_started_at TIMESTAMPTZ,
  voice_ended_at TIMESTAMPTZ,
  
  -- 디스코드 채널 정보
  discord_voice_channel_id VARCHAR(50),
  discord_text_channel_id VARCHAR(50),
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_matches_users ON matches(user_a_id, user_b_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_code ON matches(match_code);
CREATE INDEX idx_matches_created ON matches(created_at DESC);

-- ============================================
-- Interactions (좋아요/패스)
-- ============================================
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  
  interaction interaction_type NOT NULL,
  
  -- 유료 여부
  is_paid BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(match_id, from_user_id)  -- 매칭당 한 번만 상호작용
);

-- Indexes
CREATE INDEX idx_interactions_match ON interactions(match_id);
CREATE INDEX idx_interactions_from ON interactions(from_user_id);
CREATE INDEX idx_interactions_to ON interactions(to_user_id);
CREATE INDEX idx_interactions_mutual ON interactions(match_id, interaction) 
  WHERE interaction = 'LIKE';

-- ============================================
-- Linked Users (상호 좋아요 성공)
-- ============================================
CREATE TABLE linked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id),
  
  user_a_id UUID NOT NULL REFERENCES users(id),
  user_b_id UUID NOT NULL REFERENCES users(id),
  
  -- 공개된 정보
  profile_shared BOOLEAN DEFAULT true,
  location_shared BOOLEAN DEFAULT true,
  contact_shared BOOLEAN DEFAULT false,
  
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_a_id, user_b_id)
);

CREATE INDEX idx_linked_users ON linked_users(user_a_id, user_b_id);

-- ============================================
-- Chat Messages (5분 채팅 기록)
-- ============================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  
  message_type VARCHAR(20) DEFAULT 'text',  -- text, system, balance_game
  content TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_match ON chat_messages(match_id, created_at);

-- ============================================
-- Icebreaker Messages (아이스브레이킹 메시지 템플릿)
-- ============================================
CREATE TABLE icebreaker_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  message_type VARCHAR(30) NOT NULL,  -- welcome, balance_game, secret_mission, tip
  match_type match_type,              -- NULL이면 모든 유형에 적용
  game game_type,                     -- NULL이면 모든 게임에 적용
  
  icon VARCHAR(10),
  content TEXT NOT NULL,
  
  -- 밸런스 게임용
  option_a TEXT,
  option_b TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_icebreaker_type ON icebreaker_messages(message_type, match_type, game);

-- ============================================
-- Discord Rooms (디스코드 채널 관리)
-- ============================================
CREATE TABLE discord_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  
  voice_channel_id VARCHAR(50) NOT NULL,
  text_channel_id VARCHAR(50) NOT NULL,
  server_id VARCHAR(50) NOT NULL,
  
  deep_link TEXT,
  web_link TEXT,
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  user_a_joined BOOLEAN DEFAULT false,
  user_b_joined BOOLEAN DEFAULT false,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(match_id)
);

CREATE INDEX idx_discord_rooms_match ON discord_rooms(match_id);
CREATE INDEX idx_discord_rooms_active ON discord_rooms(is_active, expires_at);

-- ============================================
-- User Reports (신고)
-- ============================================
CREATE TABLE user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  reporter_id UUID NOT NULL REFERENCES users(id),
  reported_id UUID NOT NULL REFERENCES users(id),
  match_id UUID REFERENCES matches(id),
  
  reason VARCHAR(50) NOT NULL,  -- inappropriate, harassment, spam, other
  description TEXT,
  
  status VARCHAR(20) DEFAULT 'pending',  -- pending, reviewed, resolved
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_reported ON user_reports(reported_id);
CREATE INDEX idx_reports_status ON user_reports(status);

-- ============================================
-- Payments (결제 내역)
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  amount INT NOT NULL,          -- 원 단위
  currency VARCHAR(3) DEFAULT 'KRW',
  
  product_type VARCHAR(30) NOT NULL,  -- likes_pack, premium_sub
  product_quantity INT DEFAULT 1,
  
  payment_method VARCHAR(30),   -- card, kakao, naver
  payment_provider VARCHAR(50), -- toss, iamport
  external_id VARCHAR(100),     -- 외부 결제 ID
  
  status VARCHAR(20) DEFAULT 'pending',  -- pending, completed, failed, refunded
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_matches_updated
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 매일 자정 무료 좋아요 리셋
CREATE OR REPLACE FUNCTION reset_daily_likes()
RETURNS void AS $$
BEGIN
  UPDATE users SET free_likes_today = 1 WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 상호 좋아요 체크 함수
CREATE OR REPLACE FUNCTION check_mutual_like(p_match_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  like_count INT;
BEGIN
  SELECT COUNT(*) INTO like_count
  FROM interactions
  WHERE match_id = p_match_id AND interaction = 'LIKE';
  
  RETURN like_count = 2;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Initial Data (아이스브레이커 메시지)
-- ============================================

-- 웰컴 메시지
INSERT INTO icebreaker_messages (message_type, match_type, icon, content) VALUES
('welcome', 'V', '⚔️', '전장에 승리를 가져다줄 파트너가 도착했습니다. "오늘 티어 올릴 준비 되셨나요?"라고 인사를 건네보세요!'),
('welcome', 'F', '🤣', '웃음 벨 주의! 광대 승천할 준비 되셨나요? 상대방의 유머 감각을 확인해보세요.'),
('welcome', 'R', '🌸', '묘한 기류가 흐르는 중.. 오늘 밤 두 분의 분위기를 책임질 로맨틱 파트너가 입장했습니다.'),
('welcome', 'C', '☕', '고요한 새벽 감성을 함께 나눌 파트너입니다. 오늘 하루 어땠는지 가볍게 물어보며 시작할까요?');

-- 밸런스 게임
INSERT INTO icebreaker_messages (message_type, icon, content, option_a, option_b) VALUES
('balance_game', '⚖️', '게임 중 전멸 상황?', '멘붕 오기', '오히려 좋아!'),
('balance_game', '⚖️', '1시간 뒤 우리의 게임은?', '빡겜 연승', '노가리 힐링'),
('balance_game', '⚖️', '선호하는 목소리 톤?', '낮고 차분한 저음', '텐션 높은 하이톤'),
('balance_game', '⚖️', '첫 판에서 진다면?', '복수전 신청', '그냥 웃고 넘어가기'),
('balance_game', '⚖️', '게임 중 배고프면?', '배달 시켜서 먹방', '참고 끝까지 게임'),
('balance_game', '⚖️', '파트너가 실수했을 때?', '괜찮아~ 위로', 'ㅋㅋㅋ 웃어버리기');

-- 시크릿 미션 (여성용)
INSERT INTO icebreaker_messages (message_type, icon, content) VALUES
('secret_mission', '🤫', '상대방에게 "목소리 궁금해요"라고 말해보세요 🎧'),
('secret_mission', '🤫', '"오늘 컨디션 어때요?"라고 물어보세요 💭'),
('secret_mission', '🤫', '상대방 닉네임 칭찬해보세요 ✨'),
('secret_mission', '🤫', '"다음에 또 게임해요"라고 말해보세요 🎮');

-- ============================================
-- Views (편의용 뷰)
-- ============================================

-- 버킷별 대기 인원 현황
CREATE VIEW queue_stats AS
SELECT 
  game,
  type,
  COUNT(*) as waiting_count,
  MIN(queued_at) as oldest_wait
FROM matching_queue
WHERE status = 'WAITING'
GROUP BY game, type;

-- 매칭 성공률 통계
CREATE VIEW match_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_matches,
  COUNT(*) FILTER (WHERE status = 'VOICE_1HOUR' OR status = 'LINKED') as voice_converted,
  COUNT(*) FILTER (WHERE status = 'LINKED') as linked_count
FROM matches
GROUP BY DATE(created_at)
ORDER BY date DESC;
