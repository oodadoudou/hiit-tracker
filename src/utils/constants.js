export const STORAGE_KEYS = {
  appState: 'fitness-tracker-react-v1',
};

export const REST_GUIDE = {
  name: 'Rest & Breathe',
  images: [
    'https://chatgpt.com/backend-api/estuary/content?id=file_000000005d8c720abfb64807b6035980&ts=493317&p=fs&cid=1&sig=2bee393c7af5214a0a5e5be54d55373c485f1e9733c726baa554af26a31e9d64&v=0',
  ],
  tips: ['Slow your breathing', 'Relax your shoulders', 'Get ready for the next round'],
};

export const HIGH_IMPACT_ROUTINE_IDS = new Set([
  'builtin-home-cardio',
  'builtin-full-body-fat-burn',
  'builtin-glute-leg',
]);

export const WARMUP_SUGGESTIONS = {
  cardio: {
    title: '有氧热身',
    items: ['原地慢跑 30 秒', '绕踝关节各 10 圈', '摆臂转肩 10 次'],
  },
  arms: {
    title: '手臂热身',
    items: ['绕肩向前 10 圈', '绕肩向后 10 圈', '手腕绕圈各 10 次', '轻拉伸三头肌 15 秒/侧'],
  },
  core: {
    title: '核心热身',
    items: ['猫牛伸展 8 次', '骨盆转圈 10 次', '平板支撑 15 秒（轻度激活）'],
  },
  legs: {
    title: '腿臀热身',
    items: ['绕髋关节各 10 圈', '腿摆前后各 10 次/侧', '半程深蹲 × 10', '小腿拉伸 15 秒/侧'],
  },
  recovery: {
    title: '恢复前准备',
    items: ['深呼吸 5 次', '轻度踝关节绕圈', '慢速髋屈伸 × 8'],
  },
};

export const ROUTINE_WARMUP_CATEGORY = {
  'builtin-home-cardio': 'cardio',
  'builtin-full-body-fat-burn': 'cardio',
  'builtin-arm-core-sculpt': 'arms',
  'builtin-arm-sculpt': 'arms',
  'builtin-core-sculpt': 'core',
  'builtin-glute-leg': 'legs',
  'builtin-knee-recovery': 'recovery',
};

export const SEEDED_DAILY_METRICS = {};

export const DEFAULT_APP_STATE = {
  routines: [],
  selectedRoutineId: null,
  workoutHistory: [],
  dailyMetrics: SEEDED_DAILY_METRICS,
  userSettings: {
    sex: 'female',
    age: 30,
    heightCm: 165,
    weightKg: 60,
    calorieGoal: 1800,
  },
};
