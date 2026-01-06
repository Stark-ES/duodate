// DuoDate Database Seed

const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // Icebreaker Messages
  // ============================================

  // Welcome Messages
  const welcomeMessages = [
    { matchType: 'V', icon: '⚔️', content: '전장에 승리를 가져다줄 파트너가 도착했습니다. "오늘 티어 올릴 준비 되셨나요?"라고 인사를 건네보세요!' },
    { matchType: 'F', icon: '🤣', content: '웃음 벨 주의! 광대 승천할 준비 되셨나요? 상대방의 유머 감각을 확인해보세요.' },
    { matchType: 'R', icon: '🌸', content: '묘한 기류가 흐르는 중.. 오늘 밤 두 분의 분위기를 책임질 로맨틱 파트너가 입장했습니다.' },
    { matchType: 'C', icon: '☕', content: '고요한 새벽 감성을 함께 나눌 파트너입니다. 오늘 하루 어땠는지 가볍게 물어보며 시작할까요?' },
  ];

  for (const msg of welcomeMessages) {
    await prisma.icebreakerMessage.upsert({
      where: { id: uuidv4() },
      update: {},
      create: {
        id: uuidv4(),
        messageType: 'welcome',
        matchType: msg.matchType,
        icon: msg.icon,
        content: msg.content,
      },
    });
  }

  // Balance Games
  const balanceGames = [
    { content: '게임 중 전멸 상황?', optionA: '멘붕 오기', optionB: '오히려 좋아!' },
    { content: '1시간 뒤 우리의 게임은?', optionA: '빡겜 연승', optionB: '노가리 힐링' },
    { content: '선호하는 목소리 톤?', optionA: '낮고 차분한 저음', optionB: '텐션 높은 하이톤' },
    { content: '첫 판에서 진다면?', optionA: '복수전 신청', optionB: '그냥 웃고 넘어가기' },
    { content: '게임 중 배고프면?', optionA: '배달 시켜서 먹방', optionB: '참고 끝까지 게임' },
    { content: '파트너가 실수했을 때?', optionA: '괜찮아~ 위로', optionB: 'ㅋㅋㅋ 웃어버리기' },
  ];

  for (const game of balanceGames) {
    await prisma.icebreakerMessage.create({
      data: {
        id: uuidv4(),
        messageType: 'balance_game',
        icon: '⚖️',
        content: game.content,
        optionA: game.optionA,
        optionB: game.optionB,
      },
    });
  }

  // Secret Missions
  const secretMissions = [
    '상대방에게 "목소리 궁금해요"라고 말해보세요 🎧',
    '"오늘 컨디션 어때요?"라고 물어보세요 💭',
    '상대방 닉네임 칭찬해보세요 ✨',
    '"다음에 또 게임해요"라고 말해보세요 🎮',
  ];

  for (const mission of secretMissions) {
    await prisma.icebreakerMessage.create({
      data: {
        id: uuidv4(),
        messageType: 'secret_mission',
        icon: '🤫',
        content: mission,
      },
    });
  }

  // ============================================
  // Test Users (Development Only)
  // ============================================

  if (process.env.NODE_ENV !== 'production') {
    const testUsers = [
      {
        email: 'test-male-1@duodate.test',
        nickname: '밤새겜러',
        gender: 'M',
        myType: 'V',
        gameTier: '플래티넘',
        gamePosition: '원거리딜러',
        discordId: '111111111111111111',
      },
      {
        email: 'test-male-2@duodate.test',
        nickname: '드립장인',
        gender: 'M',
        myType: 'F',
        gameTier: '골드',
        gamePosition: '서포터',
        discordId: '222222222222222222',
      },
      {
        email: 'test-female-1@duodate.test',
        nickname: '새벽감성러',
        gender: 'F',
        preferredType: 'R',
        gameTier: '실버',
        gamePosition: '미드',
        discordId: '333333333333333333',
      },
    ];

    for (const user of testUsers) {
      const created = await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          id: uuidv4(),
          email: user.email,
          passwordHash: 'test_hash_not_for_production',
          nickname: user.nickname,
          gender: user.gender,
          myType: user.myType,
          preferredType: user.preferredType,
          gameTier: user.gameTier,
          gamePosition: user.gamePosition,
          discordId: user.discordId,
          favoriteGame: 'LOL',
        },
      });

      // Add tags
      const tags = [
        `#${user.gameTier}_${user.gamePosition}`,
        user.myType === 'V' ? '#캐리_가능' : user.myType === 'F' ? '#드립_장전완료' : '#힐링_전문',
      ];

      for (const tag of tags) {
        await prisma.userTag.create({
          data: {
            id: uuidv4(),
            userId: created.id,
            tag,
          },
        });
      }
    }

    console.log('✅ Test users created');
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
