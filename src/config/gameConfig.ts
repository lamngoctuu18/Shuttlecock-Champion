import {
  AchievementDef,
  ChallengeMission,
  CharacterConfig,
  CostumeConfig,
  ShuttlecockSkinConfig
} from '../types';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const COURT_CONFIG = {
  GROUND_Y: 575,
  COURT_LEFT: 130,
  COURT_RIGHT: 1150,
  COURT_CENTER_X: 640,
  PLAYER_SPEED: 380,
  BASE_GRAVITY: 820,
  MAX_FALL_SPEED: 780,
  SERVE_HEIGHT_OFFSET: -230,
  // Hitbox parameters relative to player foot impact zone
  PERFECT_RADIUS: 44,
  GOOD_RADIUS: 78,
  NORMAL_RADIUS: 118,
  // Vertical window relative to player center/feet
  KICK_MIN_Y_OFFSET: -105,
  KICK_MAX_Y_OFFSET: 65,
  KICK_COOLDOWN_MS: 210
};

export const COMBO_MILESTONES: Record<number, { bonus: number; label: string; specialEffect?: boolean }> = {
  5: { bonus: 10, label: 'COMBO x5! +10' },
  10: { bonus: 25, label: 'COMBO x10! +25' },
  20: { bonus: 50, label: 'COMBO x20! +50' },
  30: { bonus: 100, label: 'SIÊU COMBO x30! +100', specialEffect: true },
  50: { bonus: 250, label: 'HUYỀN THOẠI x50! +250', specialEffect: true },
  100: { bonus: 600, label: 'THẦN ĐỒNG ĐÁ CẦU x100! +600', specialEffect: true }
};

export const CHARACTERS: CharacterConfig[] = [
  {
    id: 'nam_sinh',
    name: 'Minh Khôi',
    title: 'Nam Sinh Việt Nam',
    description: 'Cậu học trò nhanh nhẹn, luôn mang theo quả cầu trong cặp sách mỗi giờ ra chơi.',
    unlockCondition: 'Mặc định',
    unlockCost: 0,
    primaryColor: 0xffffff,
    secondaryColor: 0x1e3a8a,
    hairColor: 0x1f2937,
    skinColor: 0xfde68a,
    gender: 'male'
  },
  {
    id: 'nu_sinh',
    name: 'Lan Anh',
    title: 'Nữ Sinh Việt Nam',
    description: 'Nữ kiện tướng đá cầu của lớp với những cú đỡ cầu khéo léo và nhịp nhàng.',
    unlockCondition: 'Mặc định',
    unlockCost: 0,
    primaryColor: 0xffffff,
    secondaryColor: 0xbe185d,
    hairColor: 0x292524,
    skinColor: 0xfef08a,
    gender: 'female'
  },
  {
    id: 'the_thao',
    name: 'Hoàng Bảo',
    title: 'Tuyển Thủ Trẻ Trung',
    description: 'Vận động viên đá cầu năng động với kỹ thuật tâng cầu tốc độ cao và chuẩn xác.',
    unlockCondition: 'Mặc định',
    unlockCost: 0,
    primaryColor: 0xef4444,
    secondaryColor: 0xfbbf24,
    hairColor: 0x451a03,
    skinColor: 0xfcd34d,
    gender: 'sport'
  }
];

export const COSTUMES: CostumeConfig[] = [
  {
    id: 'dong_phuc',
    name: 'Đồng Phục Học Sinh',
    description: 'Áo trắng khăn quàng đỏ gắn liền với ký ức sân trường Việt Nam.',
    unlockCost: 0,
    shirtColor: 0xffffff,
    pantsColor: 0x1e3a8a,
    accentColor: 0xef4444,
    shoeColor: 0x3b82f6
  },
  {
    id: 'ao_the_thao',
    name: 'Áo Thể Thao Năng Động',
    description: 'Trang phục thi đấu hội khỏe Phù Đổng khỏe khoắn.',
    unlockCost: 50,
    shirtColor: 0xef4444,
    pantsColor: 0x111827,
    accentColor: 0xfbbf24,
    shoeColor: 0xf97316
  },
  {
    id: 'mua_he',
    name: 'Trang Phục Mùa Hè',
    description: 'Áo phông xanh mát mẻ cho những buổi chiều đá cầu dưới tán phượng vĩ.',
    unlockCost: 100,
    shirtColor: 0x06b6d4,
    pantsColor: 0xf59e0b,
    accentColor: 0xffffff,
    shoeColor: 0x10b981
  },
  {
    id: 'truyen_thong',
    name: 'Cách Điệu Truyền Thống',
    description: 'Sắc đỏ vàng rực rỡ lấy cảm hứng từ lễ hội dân gian Việt Nam.',
    unlockCost: 180,
    shirtColor: 0xb91c1c,
    pantsColor: 0x78350f,
    accentColor: 0xfacc15,
    shoeColor: 0xd97706
  },
  {
    id: 'dac_biet',
    name: 'Trang Phục Quán Quân',
    description: 'Bộ giáp ánh kim dành riêng cho nhà vô địch tâng cầu.',
    unlockCost: 300,
    shirtColor: 0x7c3aed,
    pantsColor: 0x312e81,
    accentColor: 0x38bdf8,
    shoeColor: 0xf43f5e
  }
];

export const SHUTTLECOCK_SKINS: ShuttlecockSkinConfig[] = [
  {
    id: 'truyen_thong',
    name: 'Cầu Truyền Thống',
    description: 'Quả cầu đế cao su đen, lông trắng hồng quen thuộc ở cổng trường.',
    unlockCost: 0,
    baseColor: 0x374151,
    featherColors: [0xffffff, 0xf472b6, 0xffffff],
    trailColor: 0xfbcfe8,
    glow: false,
    rainbow: false
  },
  {
    id: 'nhieu_mau',
    name: 'Cầu Sắc Màu Tuổi Thơ',
    description: 'Quả cầu nhựa nhiều tầng rực rỡ sắc xanh, vàng, đỏ.',
    unlockCost: 60,
    baseColor: 0xd97706,
    featherColors: [0xef4444, 0xfacc15, 0x3b82f6],
    trailColor: 0xfde047,
    glow: false,
    rainbow: false
  },
  {
    id: 'phat_sang',
    name: 'Cầu Phát Sáng Neon',
    description: 'Tỏa ánh sáng xanh ngọc bích mỗi khi bay trên không trung.',
    unlockCost: 120,
    baseColor: 0x0f766e,
    featherColors: [0x2dd4bf, 0x38bdf8, 0xa7f3d0],
    trailColor: 0x2dd4bf,
    glow: true,
    rainbow: false
  },
  {
    id: 'rainbow',
    name: 'Cầu Cầu Vồng (Rainbow)',
    description: 'Đổi màu lấp lánh tạo vệt cầu vồng rực rỡ khi đạt combo.',
    unlockCost: 200,
    baseColor: 0x9333ea,
    featherColors: [0xf43f5e, 0xfacc15, 0x22c55e, 0x3b82f6],
    trailColor: 0xc084fc,
    glow: true,
    rainbow: true
  },
  {
    id: 'dac_biet',
    name: 'Cầu Rồng Vàng Đặc Biệt',
    description: 'Phiên bản giới hạn ánh hoàng kim của nhà vô địch.',
    unlockCost: 350,
    baseColor: 0xb45309,
    featherColors: [0xfef08a, 0xf59e0b, 0xef4444],
    trailColor: 0xfbbf24,
    glow: true,
    rainbow: false
  }
];

export const CHALLENGE_MISSIONS: ChallengeMission[] = [
  {
    id: 'kick_10',
    title: 'Khởi Động Giờ Ra Chơi',
    description: 'Tâng cầu thành công 10 lần trong một lượt chơi.',
    type: 'KICKS',
    target: 10,
    rewardCoins: 30,
    rewardLabel: '+30 Sao Vàng'
  },
  {
    id: 'kick_20',
    title: 'Quen Chân Nhịp Nhàng',
    description: 'Tâng cầu thành công 20 lần trong một lượt chơi.',
    type: 'KICKS',
    target: 20,
    rewardCoins: 50,
    rewardLabel: '+50 Sao Vàng'
  },
  {
    id: 'perfect_10',
    title: 'Đôi Chân Chuẩn Xác',
    description: 'Thực hiện 10 cú đá PERFECT trong một lượt chơi.',
    type: 'PERFECTS',
    target: 10,
    rewardCoins: 80,
    rewardLabel: '+80 Sao Vàng'
  },
  {
    id: 'combo_20',
    title: 'Chuỗi Liên Hoàn 20',
    description: 'Đạt chuỗi Combo 20 lần liên tiếp không rơi.',
    type: 'COMBO',
    target: 20,
    rewardCoins: 100,
    rewardLabel: '+100 Sao Vàng'
  },
  {
    id: 'kick_50',
    title: 'Cao Thủ Sân Trường',
    description: 'Tâng cầu thành công 50 lần trong một lượt chơi.',
    type: 'KICKS',
    target: 50,
    rewardCoins: 150,
    rewardLabel: '+150 Sao Vàng'
  },
  {
    id: 'kick_100',
    title: 'Huyền Thoại Đá Cầu 100',
    description: 'Tâng cầu chạm mốc 100 lần trong một lượt chơi.',
    type: 'KICKS',
    target: 100,
    rewardCoins: 300,
    rewardLabel: '+300 Sao Vàng'
  }
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ach_first_kick',
    title: 'Cú Đá Đầu Tiên',
    description: 'Thực hiện cú tâng cầu hợp lệ đầu tiên của bạn.',
    icon: '🦶',
    target: 1,
    metric: 'totalKicks',
    rewardCoins: 15
  },
  {
    id: 'ach_combo_10',
    title: 'Nhịp Điệu Sân Trường',
    description: 'Đạt chuỗi Combo 10 lần liên tiếp.',
    icon: '🔥',
    target: 10,
    metric: 'bestCombo',
    rewardCoins: 30
  },
  {
    id: 'ach_combo_30',
    title: 'Đôi Chân Không Mỏi',
    description: 'Đạt chuỗi Combo 30 lần liên tiếp.',
    icon: '⚡',
    target: 30,
    metric: 'bestCombo',
    rewardCoins: 75
  },
  {
    id: 'ach_combo_50',
    title: 'Nghệ Nhân Tâng Cầu',
    description: 'Đạt chuỗi Combo 50 lần liên tiếp.',
    icon: '🌟',
    target: 50,
    metric: 'bestCombo',
    rewardCoins: 150
  },
  {
    id: 'ach_combo_100',
    title: 'Thần Đồng Đá Cầu (Combo 100)',
    description: 'Đạt mốc Combo 100 lần huyền thoại.',
    icon: '👑',
    target: 100,
    metric: 'bestCombo',
    rewardCoins: 350
  },
  {
    id: 'ach_perfect_25',
    title: 'Bậc Thầy Canh Nhịp',
    description: 'Tích lũy tổng cộng 25 cú đá PERFECT.',
    icon: '🎯',
    target: 25,
    metric: 'totalPerfects',
    rewardCoins: 60
  },
  {
    id: 'ach_kicks_200',
    title: 'Đam Mê Tuổi Thơ',
    description: 'Tích lũy tổng cộng 200 lần tâng cầu.',
    icon: '🏅',
    target: 200,
    metric: 'totalKicks',
    rewardCoins: 100
  },
  {
    id: 'ach_score_1000',
    title: 'Kỷ Lục Gia',
    description: 'Đạt trên 1.000 điểm trong một lượt chơi.',
    icon: '🏆',
    target: 1000,
    metric: 'bestScore',
    rewardCoins: 120
  },
  {
    id: 'ach_challenges_3',
    title: 'Chinh Phục Thử Thách',
    description: 'Hoàn thành ít nhất 3 nhiệm vụ trong Challenge Mode.',
    icon: '🎖️',
    target: 3,
    metric: 'completedChallenges',
    rewardCoins: 100
  }
];

