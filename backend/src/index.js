// DuoDate Matching API Server
// Express + Prisma + Socket.io

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

// Auth 라우터 import
const { authRouter, authMiddleware } = require('./auth');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*' }
});

app.use(cors());
app.use(express.json());

// ============================================
// Auth Routes 연결
// ============================================
app.use('/api/auth', authRouter);

// ============================================
// Constants
// ============================================
const GAMES = ['LOL', 'TFT', 'OW', 'PUBG'];
const TYPES = ['V', 'F', 'R', 'C'];
const CHAT_DURATION_MS = 5 * 60 * 1000; // 5분
const VOICE_DURATION_MS = 60 * 60 * 1000; // 1시간

// Discord Bot API
const DISCORD_BOT_URL = process.env.DISCORD_BOT_URL || 'http://localhost:3001';
const DISCORD_API_KEY = process.env.DISCORD_API_KEY;

// ============================================
// Helper Functions
// ============================================

function generateMatchCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SECRET-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function callDiscordBot(endpoint, method = 'POST', body = null) {
  try {
    const response = await fetch(`${DISCORD_BOT_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DISCORD_API_KEY,
      },
      body: body ? JSON.stringify(body) : null,
    });
    return await response.json();
  } catch (error) {
    console.error('Discord Bot API Error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Matching Queue Logic
// ============================================

async function joinQueue(userId, game, type) {
  await prisma.matchingQueue.updateMany({
    where: { userId, status: 'WAITING' },
    data: { status: 'CANCELED' }
  });

  const position = await prisma.matchingQueue.count({
    where: { game, type, status: 'WAITING' }
  }) + 1;

  const queue = await prisma.matchingQueue.create({
    data: {
      id: uuidv4(),
      userId,
      game,
      type,
      status: 'WAITING',
      position,
      queuedAt: new Date(),
    }
  });

  return { success: true, position, queueId: queue.id };
}

async function popFromQueue(game, type) {
  return await prisma.$transaction(async (tx) => {
    const waiting = await tx.matchingQueue.findFirst({
      where: { game, type, status: 'WAITING' },
      orderBy: { queuedAt: 'asc' },
    });

    if (!waiting) return null;

    await tx.matchingQueue.update({
      where: { id: waiting.id },
      data: { status: 'MATCHED', matchedAt: new Date() }
    });

    return waiting;
  });
}

async function createMatch(userAId, userBId, game, type) {
  const matchCode = generateMatchCode();
  
  const match = await prisma.match.create({
    data: {
      id: uuidv4(),
      matchCode,
      userAId,
      userBId,
      game,
      matchType: type,
      status: 'CHATTING_5MIN',
      chatStartedAt: new Date(),
    },
    include: {
      userA: { select: { id: true, nickname: true, discordId: true } },
      userB: { select: { id: true, nickname: true, discordId: true } },
    }
  });

  await prisma.user.updateMany({
    where: { id: { in: [userAId, userBId] } },
    data: { totalMatches: { increment: 1 } }
  });

  return match;
}

// ============================================
// REST API Routes
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ----------------------------------------
// Queue APIs
// ----------------------------------------

app.post('/api/queue/join', async (req, res) => {
  try {
    const { userId, game, type } = req.body;

    if (!userId || !GAMES.includes(game) || !TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const result = await joinQueue(userId, game, type);
    
    io.to(userId).emit('queue:joined', { 
      game, 
      type, 
      position: result.position 
    });

    res.json(result);
  } catch (error) {
    console.error('Queue join error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/queue/leave', async (req, res) => {
  try {
    const { userId } = req.body;

    await prisma.matchingQueue.updateMany({
      where: { userId, status: 'WAITING' },
      data: { status: 'CANCELED' }
    });

    io.to(userId).emit('queue:left');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/queue/status', async (req, res) => {
  try {
    const stats = await prisma.matchingQueue.groupBy({
      by: ['game', 'type'],
      where: { status: 'WAITING' },
      _count: true,
    });

    const result = {};
    GAMES.forEach(g => {
      result[g] = {};
      TYPES.forEach(t => {
        const found = stats.find(s => s.game === g && s.type === t);
        result[g][t] = found?._count || 0;
      });
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/queue/position/:userId', async (req, res) => {
  try {
    const queue = await prisma.matchingQueue.findFirst({
      where: { userId: req.params.userId, status: 'WAITING' }
    });

    if (!queue) {
      return res.json({ inQueue: false });
    }

    const position = await prisma.matchingQueue.count({
      where: {
        game: queue.game,
        type: queue.type,
        status: 'WAITING',
        queuedAt: { lte: queue.queuedAt }
      }
    });

    res.json({ inQueue: true, game: queue.game, type: queue.type, position });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------
// Matching APIs
// ----------------------------------------

app.post('/api/match/request', async (req, res) => {
  try {
    const { userId, game, type } = req.body;

    if (!userId || !GAMES.includes(game) || !TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const waiting = await popFromQueue(game, type);

    if (!waiting) {
      const result = await joinQueue(userId, game, type);
      return res.json({ 
        matched: false, 
        message: '나와 딱 맞는 파트너를 찾고 있어요!',
        position: result.position
      });
    }

    const match = await createMatch(waiting.userId, userId, game, type);

    io.to(waiting.userId).emit('match:found', {
      matchId: match.id,
      matchCode: match.matchCode,
      partner: match.userB,
      game,
      type,
    });

    io.to(userId).emit('match:found', {
      matchId: match.id,
      matchCode: match.matchCode,
      partner: match.userA,
      game,
      type,
    });

    res.json({ 
      matched: true, 
      matchId: match.id,
      matchCode: match.matchCode,
    });
  } catch (error) {
    console.error('Match request error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/match/:matchId', async (req, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.matchId },
      include: {
        userA: {
          select: {
            id: true, nickname: true, mbti: true, hobby: true,
            gameTier: true, gamePosition: true,
            tags: { select: { tag: true } }
          }
        },
        userB: {
          select: {
            id: true, nickname: true, mbti: true, hobby: true,
            gameTier: true, gamePosition: true,
            tags: { select: { tag: true } }
          }
        },
        discordRoom: true,
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------
// Chat Decision APIs
// ----------------------------------------

app.post('/api/match/:matchId/decision', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { userId, decision } = req.body;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { userA: true, userB: true }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const updateData = {};
    const isUserA = match.userAId === userId;
    
    if (isUserA) {
      updateData.userAChatDecision = decision;
    } else {
      updateData.userBChatDecision = decision;
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
    });

    const partnerId = isUserA ? match.userBId : match.userAId;
    if (decision) {
      io.to(partnerId).emit('chat:partnerReady', { matchId });
    }

    const userADecision = isUserA ? decision : updated.userAChatDecision;
    const userBDecision = isUserA ? updated.userBChatDecision : decision;

    if (userADecision !== null && userBDecision !== null) {
      if (userADecision && userBDecision) {
        await createVoiceRoom(match);
        
        const updatedMatch = await prisma.match.update({
          where: { id: matchId },
          data: { 
            status: 'VOICE_1HOUR',
            chatEndedAt: new Date(),
            voiceStartedAt: new Date(),
          },
          include: { discordRoom: true }
        });

        io.to(match.userAId).emit('match:voiceReady', { 
          matchId, 
          discordRoom: updatedMatch.discordRoom 
        });
        io.to(match.userBId).emit('match:voiceReady', { 
          matchId, 
          discordRoom: updatedMatch.discordRoom 
        });

        return res.json({ result: 'voice_ready', discordRoom: updatedMatch.discordRoom });
      } else {
        await prisma.match.update({
          where: { id: matchId },
          data: { status: 'CANCELED', chatEndedAt: new Date() }
        });

        io.to(match.userAId).emit('match:ended', { matchId, reason: 'declined' });
        io.to(match.userBId).emit('match:ended', { matchId, reason: 'declined' });

        return res.json({ result: 'ended' });
      }
    }

    res.json({ result: 'waiting', myDecision: decision });
  } catch (error) {
    console.error('Decision error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function createVoiceRoom(match) {
  const discordResult = await callDiscordBot('/api/rooms', 'POST', {
    matchId: match.matchCode,
    userAId: match.userA.discordId,
    userBId: match.userB.discordId,
    userAName: match.userA.nickname,
    userBName: match.userB.nickname,
    matchType: match.matchType,
    game: match.game,
  });

  if (discordResult.success) {
    await prisma.discordRoom.create({
      data: {
        id: uuidv4(),
        matchId: match.id,
        voiceChannelId: discordResult.voiceChannelId,
        textChannelId: discordResult.textChannelId,
        serverId: discordResult.serverId,
        deepLink: discordResult.deepLink,
        webLink: discordResult.webLink,
        isActive: true,
        expiresAt: new Date(discordResult.expiresAt),
      }
    });
  }

  return discordResult;
}

// ----------------------------------------
// Like/Pass APIs
// ----------------------------------------

app.post('/api/match/:matchId/like', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { userId, interaction } = req.body;

    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const toUserId = match.userAId === userId ? match.userBId : match.userAId;

    if (interaction === 'LIKE') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      
      if (user.freeLikesToday <= 0 && user.paidLikes <= 0) {
        return res.status(402).json({ 
          error: 'No likes remaining',
          needPayment: true 
        });
      }

      if (user.freeLikesToday > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { freeLikesToday: { decrement: 1 } }
        });
      } else {
        await prisma.user.update({
          where: { id: userId },
          data: { paidLikes: { decrement: 1 } }
        });
      }
    }

    await prisma.interaction.create({
      data: {
        id: uuidv4(),
        matchId,
        fromUserId: userId,
        toUserId,
        interaction,
        isPaid: false,
      }
    });

    if (interaction === 'LIKE') {
      await prisma.user.update({
        where: { id: userId },
        data: { totalLikesSent: { increment: 1 } }
      });
      await prisma.user.update({
        where: { id: toUserId },
        data: { totalLikesReceived: { increment: 1 } }
      });
    }

    const otherLike = await prisma.interaction.findFirst({
      where: { matchId, fromUserId: toUserId, interaction: 'LIKE' }
    });

    if (interaction === 'LIKE' && otherLike) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: 'LINKED' }
      });

      await prisma.linkedUser.create({
        data: {
          id: uuidv4(),
          matchId,
          userAId: match.userAId,
          userBId: match.userBId,
          linkedAt: new Date(),
        }
      });

      await prisma.user.updateMany({
        where: { id: { in: [match.userAId, match.userBId] } },
        data: { mutualLikes: { increment: 1 } }
      });

      io.to(match.userAId).emit('match:linked', { matchId });
      io.to(match.userBId).emit('match:linked', { matchId });

      return res.json({ result: 'linked', mutual: true });
    }

    if (interaction === 'LIKE') {
      io.to(toUserId).emit('like:received', { matchId, fromUserId: userId });
    }

    res.json({ result: 'sent', mutual: false });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:userId/likes', async (req, res) => {
  try {
    const likes = await prisma.interaction.findMany({
      where: { 
        toUserId: req.params.userId, 
        interaction: 'LIKE' 
      },
      include: {
        fromUser: {
          select: { id: true, nickname: true, profileImageUrl: true }
        },
        match: {
          select: { matchCode: true, game: true, matchType: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(likes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:userId/linked', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const linked = await prisma.linkedUser.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      include: {
        userA: {
          select: { 
            id: true, nickname: true, profileImageUrl: true, 
            location: true, mbti: true 
          }
        },
        userB: {
          select: { 
            id: true, nickname: true, profileImageUrl: true, 
            location: true, mbti: true 
          }
        },
        match: {
          select: { matchCode: true, game: true }
        }
      },
      orderBy: { linkedAt: 'desc' }
    });

    const result = linked.map(l => ({
      linkedId: l.id,
      linkedAt: l.linkedAt,
      match: l.match,
      partner: l.userAId === userId ? l.userB : l.userA,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------
// Icebreaker APIs
// ----------------------------------------

app.get('/api/icebreaker/welcome/:type', async (req, res) => {
  try {
    const message = await prisma.icebreakerMessage.findFirst({
      where: { messageType: 'welcome', matchType: req.params.type }
    });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/icebreaker/balance-game', async (req, res) => {
  try {
    const games = await prisma.icebreakerMessage.findMany({
      where: { messageType: 'balance_game', isActive: true }
    });
    const random = games[Math.floor(Math.random() * games.length)];
    res.json(random);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/icebreaker/secret-mission', async (req, res) => {
  try {
    const missions = await prisma.icebreakerMessage.findMany({
      where: { messageType: 'secret_mission', isActive: true }
    });
    const random = missions[Math.floor(Math.random() * missions.length)];
    res.json(random);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Socket.io Events
// ============================================

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('chat:message', async (data) => {
    const { matchId, userId, content } = data;

    await prisma.chatMessage.create({
      data: {
        id: uuidv4(),
        matchId,
        senderId: userId,
        messageType: 'text',
        content,
      }
    });

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    const partnerId = match.userAId === userId ? match.userBId : match.userAId;
    
    io.to(partnerId).emit('chat:message', {
      matchId,
      senderId: userId,
      content,
      timestamp: new Date(),
    });
  });

  socket.on('chat:typing', (data) => {
    const { matchId, partnerId, isTyping } = data;
    io.to(partnerId).emit('chat:typing', { matchId, isTyping });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ============================================
// Server Start
// ============================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 DuoDate API Server running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { app, io };
