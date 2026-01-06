// DuoDate Authentication System
// JWT + Discord OAuth2

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();
const router = express.Router();

// ============================================
// Configuration
// ============================================
const config = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

// ============================================
// Helper Functions
// ============================================

/**
 * JWT 토큰 생성
 */
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      gender: user.gender,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

/**
 * JWT 토큰 검증
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * 비밀번호 해시
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * 비밀번호 검증
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * 유저 응답 포맷 (민감 정보 제외)
 */
function formatUserResponse(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// ============================================
// Auth Middleware
// ============================================

/**
 * 인증 미들웨어
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tags: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * 선택적 인증 미들웨어 (인증 없어도 통과)
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);

      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
}

// ============================================
// Local Auth Routes
// ============================================

/**
 * POST /api/auth/register
 * 이메일 회원가입
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname, gender, birthDate } = req.body;

    // 유효성 검사
    if (!email || !password || !nickname || !gender) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!['M', 'F'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender' });
    }

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // 닉네임 중복 체크
    const existingNickname = await prisma.user.findFirst({
      where: { nickname },
    });

    if (existingNickname) {
      return res.status(409).json({ error: 'Nickname already taken' });
    }

    // 유저 생성
    const passwordHash = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        passwordHash,
        nickname,
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * 이메일 로그인
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tags: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // 마지막 활동 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = generateToken(user);

    res.json({
      success: true,
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * 현재 로그인 유저 정보
 */
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    success: true,
    user: formatUserResponse(req.user),
  });
});

/**
 * PUT /api/auth/profile
 * 프로필 업데이트
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, mbti, hobby, bio, gameTier, gamePosition, favoriteGame } = req.body;

    const updateData = {};
    if (nickname) updateData.nickname = nickname;
    if (mbti) updateData.mbti = mbti;
    if (hobby) updateData.hobby = hobby;
    if (bio) updateData.bio = bio;
    if (gameTier) updateData.gameTier = gameTier;
    if (gamePosition) updateData.gamePosition = gamePosition;
    if (favoriteGame) updateData.favoriteGame = favoriteGame;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      include: { tags: true },
    });

    res.json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

/**
 * PUT /api/auth/type
 * 성향 테스트 결과 저장
 */
router.put('/type', authMiddleware, async (req, res) => {
  try {
    const { myType, preferredType, tags } = req.body;

    const updateData = {};
    if (myType) updateData.myType = myType;
    if (preferredType) updateData.preferredType = preferredType;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    // 태그 업데이트
    if (tags && Array.isArray(tags)) {
      // 기존 태그 삭제
      await prisma.userTag.deleteMany({
        where: { userId: req.user.id },
      });

      // 새 태그 추가
      await prisma.userTag.createMany({
        data: tags.map((tag) => ({
          id: uuidv4(),
          userId: req.user.id,
          tag,
        })),
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { tags: true },
    });

    res.json({
      success: true,
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('Type update error:', error);
    res.status(500).json({ error: 'Type update failed' });
  }
});

/**
 * POST /api/auth/change-password
 * 비밀번호 변경
 */
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const isValidPassword = await comparePassword(currentPassword, req.user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// ============================================
// Discord OAuth2 Routes
// ============================================

/**
 * GET /api/auth/discord
 * 디스코드 OAuth 시작 (리다이렉트)
 */
router.get('/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: config.DISCORD_CLIENT_ID,
    redirect_uri: config.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email',
    state: req.query.state || 'login', // 'login', 'link', 'register'
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

/**
 * GET /api/auth/discord/callback
 * 디스코드 OAuth 콜백
 */
router.get('/discord/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.redirect(`${config.CLIENT_URL}/login?error=no_code`);
    }

    // 1. Access Token 교환
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.DISCORD_CLIENT_ID,
        client_secret: config.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Discord token error:', tokenData);
      return res.redirect(`${config.CLIENT_URL}/login?error=token_failed`);
    }

    // 2. 유저 정보 가져오기
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const discordUser = await userResponse.json();

    if (!discordUser.id) {
      return res.redirect(`${config.CLIENT_URL}/login?error=user_failed`);
    }

    // 3. 기존 유저 찾기 (Discord ID로)
    let user = await prisma.user.findUnique({
      where: { discordId: discordUser.id },
      include: { tags: true },
    });

    if (user) {
      // 기존 유저 - 로그인
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastActiveAt: new Date(),
          discordUsername: `${discordUser.username}#${discordUser.discriminator}`,
        },
      });

      const token = generateToken(user);
      return res.redirect(`${config.CLIENT_URL}/auth/callback?token=${token}`);
    }

    // 4. 이메일로 기존 유저 찾기
    if (discordUser.email) {
      user = await prisma.user.findUnique({
        where: { email: discordUser.email },
      });

      if (user) {
        // 이메일 계정에 디스코드 연동
        await prisma.user.update({
          where: { id: user.id },
          data: {
            discordId: discordUser.id,
            discordUsername: `${discordUser.username}#${discordUser.discriminator}`,
            discordLinkedAt: new Date(),
            lastActiveAt: new Date(),
          },
        });

        const token = generateToken(user);
        return res.redirect(`${config.CLIENT_URL}/auth/callback?token=${token}`);
      }
    }

    // 5. 새 유저 생성 (회원가입)
    // 성별 선택이 필요하므로 임시 토큰과 함께 리다이렉트
    const tempData = {
      discordId: discordUser.id,
      discordUsername: `${discordUser.username}#${discordUser.discriminator}`,
      email: discordUser.email,
      nickname: discordUser.global_name || discordUser.username,
      avatar: discordUser.avatar 
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null,
    };

    // 임시 토큰 생성 (10분)
    const tempToken = jwt.sign(tempData, config.JWT_SECRET, { expiresIn: '10m' });

    return res.redirect(`${config.CLIENT_URL}/register/complete?discord=${tempToken}`);
  } catch (error) {
    console.error('Discord callback error:', error);
    return res.redirect(`${config.CLIENT_URL}/login?error=callback_failed`);
  }
});

/**
 * POST /api/auth/discord/complete
 * 디스코드 회원가입 완료 (성별 선택 후)
 */
router.post('/discord/complete', async (req, res) => {
  try {
    const { discordToken, gender } = req.body;

    if (!discordToken || !gender) {
      return res.status(400).json({ error: 'Discord token and gender required' });
    }

    if (!['M', 'F'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender' });
    }

    // 임시 토큰 검증
    const discordData = verifyToken(discordToken);

    if (!discordData || !discordData.discordId) {
      return res.status(401).json({ error: 'Invalid or expired discord token' });
    }

    // 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { discordId: discordData.discordId },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Discord account already registered' });
    }

    // 유저 생성
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: discordData.email || `${discordData.discordId}@discord.local`,
        passwordHash: await hashPassword(uuidv4()), // 랜덤 비밀번호
        nickname: discordData.nickname,
        gender,
        discordId: discordData.discordId,
        discordUsername: discordData.discordUsername,
        discordLinkedAt: new Date(),
        profileImageUrl: discordData.avatar,
        isVerified: true, // 디스코드 인증됨
      },
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error('Discord complete error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/discord/link
 * 기존 계정에 디스코드 연동
 */
router.post('/discord/link', authMiddleware, async (req, res) => {
  try {
    const { discordToken } = req.body;

    if (!discordToken) {
      return res.status(400).json({ error: 'Discord token required' });
    }

    const discordData = verifyToken(discordToken);

    if (!discordData || !discordData.discordId) {
      return res.status(401).json({ error: 'Invalid or expired discord token' });
    }

    // 이미 연동된 계정 체크
    const existingLink = await prisma.user.findUnique({
      where: { discordId: discordData.discordId },
    });

    if (existingLink) {
      return res.status(409).json({ error: 'Discord account already linked to another user' });
    }

    // 연동
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        discordId: discordData.discordId,
        discordUsername: discordData.discordUsername,
        discordLinkedAt: new Date(),
      },
      include: { tags: true },
    });

    res.json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Discord link error:', error);
    res.status(500).json({ error: 'Discord linking failed' });
  }
});

/**
 * DELETE /api/auth/discord/unlink
 * 디스코드 연동 해제
 */
router.delete('/discord/unlink', authMiddleware, async (req, res) => {
  try {
    // 이메일 계정이 있는지 확인 (디스코드만으로 가입한 경우 해제 불가)
    if (req.user.email.endsWith('@discord.local')) {
      return res.status(400).json({ 
        error: 'Cannot unlink Discord. Please set email and password first.' 
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        discordId: null,
        discordUsername: null,
        discordLinkedAt: null,
      },
      include: { tags: true },
    });

    res.json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Discord unlink error:', error);
    res.status(500).json({ error: 'Discord unlinking failed' });
  }
});

/**
 * POST /api/auth/refresh
 * 토큰 갱신
 */
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const token = generateToken(req.user);
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * POST /api/auth/logout
 * 로그아웃 (클라이언트에서 토큰 삭제, 서버는 마지막 활동 기록)
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { lastActiveAt: new Date() },
    });
    res.json({ success: true });
  } catch (error) {
    res.json({ success: true }); // 로그아웃은 항상 성공
  }
});

// ============================================
// Exports
// ============================================

module.exports = {
  authRouter: router,
  authMiddleware,
  optionalAuthMiddleware,
  generateToken,
  verifyToken,
};
