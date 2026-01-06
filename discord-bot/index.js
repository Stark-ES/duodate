// DuoDate Discord Bot - Secret Voice Room Manager
// discord.js v14 + Express API

const { 
  Client, 
  GatewayIntentBits, 
  PermissionFlagsBits, 
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const express = require('express');
const schedule = require('node-schedule');

// ============================================
// Configuration
// ============================================
const config = {
  DISCORD_TOKEN: process.env.DISCORD_BOT_TOKEN,
  GUILD_ID: process.env.DISCORD_GUILD_ID,
  CATEGORY_ID: process.env.DISCORD_CATEGORY_ID, // 시크릿룸 카테고리
  API_PORT: process.env.API_PORT || 3001,
  API_SECRET: process.env.API_SECRET, // 웹앱 <-> 봇 통신용
  ROOM_DURATION_MS: 60 * 60 * 1000, // 1시간
  WARNING_BEFORE_MS: 5 * 60 * 1000, // 5분 전 알림
};

// ============================================
// Type Definitions
// ============================================
const MATCH_TYPES = {
  V: { emoji: '⚔️', name: 'Victory', color: 0xEF4444, message: '오늘 티어 올릴 준비 되셨나요?' },
  F: { emoji: '🤣', name: 'Funny', color: 0xF59E0B, message: '광대 승천할 준비 되셨나요?' },
  R: { emoji: '🌸', name: 'Romantic', color: 0xEC4899, message: '묘한 기류가 흐르는 중..' },
  C: { emoji: '☕', name: 'Comfort', color: 0x10B981, message: '고요한 새벽 감성을 나눠보세요.' }
};

// Active rooms storage (production에서는 Redis 사용 권장)
const activeRooms = new Map();

// ============================================
// Discord Bot Setup
// ============================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ]
});

client.once('ready', () => {
  console.log(`🤖 DuoDate Bot 준비 완료! ${client.user.tag}`);
  console.log(`📡 서버 ID: ${config.GUILD_ID}`);
});

// 보이스 채널 입장 감지
client.on('voiceStateUpdate', async (oldState, newState) => {
  const channelId = newState.channelId;
  if (!channelId) return;

  const room = [...activeRooms.values()].find(r => r.voiceChannelId === channelId);
  if (!room) return;

  // 유저가 입장했을 때
  if (!oldState.channelId && newState.channelId === channelId) {
    const userId = newState.member.id;
    
    if (room.userAId === userId || room.userBId === userId) {
      room.connectedUsers.add(userId);
      
      // 두 명 다 입장하면 환영 메시지
      if (room.connectedUsers.size === 2 && !room.welcomeSent) {
        room.welcomeSent = true;
        await sendWelcomeMessage(room);
      }
    }
  }
});

// ============================================
// Room Management Functions
// ============================================

/**
 * 시크릿 보이스룸 생성
 */
async function createSecretRoom({ matchId, userAId, userBId, userAName, userBName, matchType, game }) {
  try {
    const guild = await client.guilds.fetch(config.GUILD_ID);
    const category = await guild.channels.fetch(config.CATEGORY_ID);
    
    const typeInfo = MATCH_TYPES[matchType] || MATCH_TYPES.R;
    const channelName = `🔐-secret-${matchId.slice(-4).toLowerCase()}`;

    // 보이스 채널 생성
    const voiceChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      parent: category.id,
      userLimit: 2,
      permissionOverwrites: [
        {
          id: guild.id, // @everyone
          deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
        },
        {
          id: userAId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
        },
        {
          id: userBId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
        },
      ],
    });

    // 텍스트 채널 생성 (같은 권한)
    const textChannel = await guild.channels.create({
      name: `💬-${matchId.slice(-4).toLowerCase()}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: userAId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        {
          id: userBId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
      ],
    });

    // 입장 안내 임베드
    const welcomeEmbed = new EmbedBuilder()
      .setColor(typeInfo.color)
      .setTitle(`${typeInfo.emoji} 시크릿 보이스룸`)
      .setDescription(`**${userAName}**님과 **${userBName}**님의\n1시간 데이트가 시작됩니다!`)
      .addFields(
        { name: '🎮 게임', value: game, inline: true },
        { name: '💜 매칭 유형', value: `TYPE_${matchType} (${typeInfo.name})`, inline: true },
        { name: '⏰ 남은 시간', value: '60분', inline: true },
      )
      .setFooter({ text: typeInfo.message })
      .setTimestamp();

    await textChannel.send({ embeds: [welcomeEmbed] });

    // Room 데이터 저장
    const roomData = {
      matchId,
      voiceChannelId: voiceChannel.id,
      textChannelId: textChannel.id,
      userAId,
      userBId,
      userAName,
      userBName,
      matchType,
      game,
      createdAt: Date.now(),
      expiresAt: Date.now() + config.ROOM_DURATION_MS,
      connectedUsers: new Set(),
      welcomeSent: false,
      warningJobId: null,
      deleteJobId: null,
    };

    activeRooms.set(matchId, roomData);

    // 5분 전 경고 스케줄
    const warningTime = new Date(roomData.expiresAt - config.WARNING_BEFORE_MS);
    roomData.warningJobId = schedule.scheduleJob(warningTime, () => {
      sendWarningMessage(roomData);
    });

    // 60분 후 삭제 스케줄
    const deleteTime = new Date(roomData.expiresAt);
    roomData.deleteJobId = schedule.scheduleJob(deleteTime, () => {
      deleteSecretRoom(matchId);
    });

    console.log(`✅ 시크릿룸 생성: ${matchId}`);
    
    return {
      success: true,
      matchId,
      voiceChannelId: voiceChannel.id,
      textChannelId: textChannel.id,
      serverId: config.GUILD_ID,
      deepLink: `discord://discord.com/channels/${config.GUILD_ID}/${voiceChannel.id}`,
      webLink: `https://discord.com/channels/${config.GUILD_ID}/${voiceChannel.id}`,
      expiresAt: roomData.expiresAt,
    };

  } catch (error) {
    console.error('❌ 시크릿룸 생성 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 환영 메시지 전송
 */
async function sendWelcomeMessage(room) {
  try {
    const textChannel = await client.channels.fetch(room.textChannelId);
    const typeInfo = MATCH_TYPES[room.matchType];

    const embed = new EmbedBuilder()
      .setColor(typeInfo.color)
      .setTitle('🎉 두 분 모두 입장하셨습니다!')
      .setDescription(`<@${room.userAId}>님, <@${room.userBId}>님!\n\n두 분의 1시간 데이트가 시작되었습니다.\n오늘 선택하신 **TYPE_${room.matchType}**에 맞춰 즐거운 시간 보내세요!`)
      .addFields(
        { name: '💡 Tip', value: typeInfo.message }
      )
      .setTimestamp();

    await textChannel.send({ embeds: [embed] });
    console.log(`💬 환영 메시지 전송: ${room.matchId}`);

  } catch (error) {
    console.error('환영 메시지 전송 실패:', error);
  }
}

/**
 * 5분 전 경고 메시지
 */
async function sendWarningMessage(room) {
  try {
    const textChannel = await client.channels.fetch(room.textChannelId);

    const embed = new EmbedBuilder()
      .setColor(0xEC4899) // Pink
      .setTitle('💕 종료 5분 전입니다')
      .setDescription('이제 헤어지기까지 5분 남았습니다.\n**꼭 하고 싶었던 말이 있다면 지금 하세요!**')
      .addFields(
        { name: '💜', value: '서로의 마음을 확인할 준비를 하세요.' }
      )
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('extend_request')
          .setLabel('⏰ 연장 요청')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true), // MVP에서는 비활성화
      );

    await textChannel.send({ 
      content: `<@${room.userAId}> <@${room.userBId}>`,
      embeds: [embed],
      components: [row]
    });

    console.log(`⚠️ 5분 경고 전송: ${room.matchId}`);

  } catch (error) {
    console.error('경고 메시지 전송 실패:', error);
  }
}

/**
 * 시크릿룸 삭제
 */
async function deleteSecretRoom(matchId) {
  try {
    const room = activeRooms.get(matchId);
    if (!room) return { success: false, error: 'Room not found' };

    // 스케줄 취소
    if (room.warningJobId) room.warningJobId.cancel();
    if (room.deleteJobId) room.deleteJobId.cancel();

    // 종료 메시지 전송
    try {
      const textChannel = await client.channels.fetch(room.textChannelId);
      const embed = new EmbedBuilder()
        .setColor(0x6366F1)
        .setTitle('⏰ 데이트가 종료되었습니다')
        .setDescription('즐거운 시간이었나요?\n듀오데이트 앱에서 좋아요를 보내 인연을 이어가세요!')
        .setTimestamp();

      await textChannel.send({ embeds: [embed] });
      
      // 3초 후 채널 삭제
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
      // 메시지 전송 실패해도 삭제 진행
    }

    // 채널 삭제
    const voiceChannel = await client.channels.fetch(room.voiceChannelId).catch(() => null);
    const textChannel = await client.channels.fetch(room.textChannelId).catch(() => null);
    
    if (voiceChannel) await voiceChannel.delete();
    if (textChannel) await textChannel.delete();

    activeRooms.delete(matchId);
    console.log(`🗑️ 시크릿룸 삭제: ${matchId}`);

    return { success: true };

  } catch (error) {
    console.error('❌ 시크릿룸 삭제 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 룸 상태 조회
 */
function getRoomStatus(matchId) {
  const room = activeRooms.get(matchId);
  if (!room) return null;

  return {
    matchId: room.matchId,
    voiceChannelId: room.voiceChannelId,
    textChannelId: room.textChannelId,
    connectedUsers: [...room.connectedUsers],
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    remainingMs: Math.max(0, room.expiresAt - Date.now()),
  };
}

// ============================================
// Express API Server
// ============================================
const app = express();
app.use(express.json());

// API 인증 미들웨어
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== config.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    bot: client.isReady() ? 'connected' : 'disconnected',
    activeRooms: activeRooms.size 
  });
});

// 시크릿룸 생성 API
app.post('/api/rooms', authMiddleware, async (req, res) => {
  const { matchId, userAId, userBId, userAName, userBName, matchType, game } = req.body;

  if (!matchId || !userAId || !userBId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = await createSecretRoom({
    matchId,
    userAId,
    userBId,
    userAName: userAName || 'User A',
    userBName: userBName || 'User B',
    matchType: matchType || 'R',
    game: game || 'Unknown',
  });

  res.json(result);
});

// 룸 상태 조회 API
app.get('/api/rooms/:matchId', authMiddleware, (req, res) => {
  const status = getRoomStatus(req.params.matchId);
  if (!status) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(status);
});

// 룸 삭제 API (수동)
app.delete('/api/rooms/:matchId', authMiddleware, async (req, res) => {
  const result = await deleteSecretRoom(req.params.matchId);
  res.json(result);
});

// 활성 룸 목록 API
app.get('/api/rooms', authMiddleware, (req, res) => {
  const rooms = [...activeRooms.values()].map(room => ({
    matchId: room.matchId,
    userAId: room.userAId,
    userBId: room.userBId,
    matchType: room.matchType,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    connectedCount: room.connectedUsers.size,
  }));
  res.json({ count: rooms.length, rooms });
});

// ============================================
// Start Bot & Server
// ============================================
async function start() {
  try {
    // Discord 봇 로그인
    await client.login(config.DISCORD_TOKEN);
    
    // API 서버 시작
    app.listen(config.API_PORT, () => {
      console.log(`🚀 API 서버 시작: http://localhost:${config.API_PORT}`);
    });

  } catch (error) {
    console.error('❌ 시작 실패:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 종료 중...');
  
  // 모든 활성 룸 정리
  for (const matchId of activeRooms.keys()) {
    await deleteSecretRoom(matchId);
  }
  
  client.destroy();
  process.exit(0);
});

module.exports = { createSecretRoom, deleteSecretRoom, getRoomStatus };
