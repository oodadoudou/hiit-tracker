export const FALLBACK_GUIDE_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
  <rect width="640" height="360" fill="#18211d"/>
  <rect x="22" y="22" width="596" height="316" rx="28" fill="#222c27" stroke="#3a463f" stroke-width="2"/>
  <circle cx="240" cy="144" r="36" fill="#d4ff6a" opacity="0.9"/>
  <rect x="226" y="182" width="28" height="82" rx="14" fill="#d4ff6a" opacity="0.9"/>
  <rect x="180" y="192" width="120" height="20" rx="10" fill="#d4ff6a" opacity="0.78"/>
  <rect x="188" y="260" width="22" height="58" rx="11" fill="#d4ff6a" opacity="0.78"/>
  <rect x="270" y="260" width="22" height="58" rx="11" fill="#d4ff6a" opacity="0.78"/>
  <text x="356" y="150" fill="#f2f5ef" font-family="Arial, sans-serif" font-size="34" font-weight="700">Visual Guide</text>
  <text x="356" y="190" fill="#aeb7a8" font-family="Arial, sans-serif" font-size="18">Offline-safe fallback image</text>
</svg>
`)}`;

export const STORAGE_KEYS = {
  appState: 'fitness-tracker-react-v1',
  coachCatUi: 'fitness-tracker-react-v1-coach-cat-ui',
};

export const REST_GUIDE = {
  name: 'Rest & Breathe',
  images: [FALLBACK_GUIDE_IMAGE],
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
  exerciseLibrary: [],
  userSettings: {
    sex: 'female',
    age: 30,
    heightCm: 165,
    weightKg: 60,
    calorieGoal: 1800,
    coachStyle: 'cold',
    enableCoachCat: true,
    enableEncouragementAudio: true,
    coachPromptFrequency: 'balanced',
    warmupPreference: 'minimal',
    minimumSavedWorkoutSec: 120,
  },
};
