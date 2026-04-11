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

export const DEFAULT_ROUTINE = {
  id: 'builtin-home-cardio',
  name: '居家燃脂有氧',
  mode: 'infinite',
  workSec: 40,
  restSec: 20,
  circuitRestSec: 0,
  circuits: 1,
  exercises: [
    {
      name: '正常开合跳 (Jumping Jacks)',
      images: [
        'https://images.openai.com/static-rsc-4/QqMcKpqGYZzYINRAXi_esqplHIG5f-PI91lChYWmz1ZlnmHYF8JIOolLyWbxbHQs17inWSOMkKoTchzYVzUanMMUDU6LcIWyoV6fF39OAtX04EW8NggljPyLOCLBnpqvUllQVqdYtaFJ2RWsbnZitCaTpnMVu9rTQ0cplVuTOuE?purpose=inline',
        'https://images.openai.com/static-rsc-4/-VoXnnupG5NNQJx-cxZq3K3IqnFLzcEnpaIGW2EDT4_DSDFDev0pDzV_JMjy5qU_bfm3k9CyVw57bLa9Nx2DnwsQw8P-iDifBUhBrw-cXMllw6RAz51kM_zEK-eWn5iYYuSzb9ujpWdhPZhnDglQe_oOnqN2edR7tPZTi8S-mZ4?purpose=inline',
      ],
      tips: ['前脚掌轻落地', '膝盖微屈，不锁死', '核心收紧'],
    },
    {
      name: '哑铃快速出拳 (Dumbbell Punches)',
      images: [
        'https://images.openai.com/static-rsc-4/_1lsgs-9CPnEXdgv0BZYNH1CamVlOWwZkupXAZSZxsAqKux3C0c2gCYL1H7pSD5Rn0MQnN8MpR8m7R_BafWVyhdqP28ghr4wlpYeYo7nrR1Fpuj54NZ0dLBk6jv7Tpq4QhU0Le-qd9jSaU6aU584Grv_271gHbxjpA00-_xUFSs?purpose=inline',
        'https://images.openai.com/static-rsc-4/0MNvextRpSdzZ7Cz5Tvex9x98PyN0kR5tyZWS7jNpH5ST3t3vc-K1IWOJDanMThdD3cGCImdSuPjxCmWO-4WN1_OpFETSygANfwQ8ZH9pbysELFXafFSjz64pPfAe-y35crgEVwSZtfIw8asGzUnFTsIVo_gRFOefGnm5jdfRfU?purpose=inline',
      ],
      tips: ['核心收紧，身体稳定', '出拳不锁肘', '节奏快且受控'],
    },
    {
      name: '高抬腿 (High Knees)',
      images: [
        'https://images.openai.com/static-rsc-4/0MEkklkgSICCxrg8DGryFvbsIWMLdKIjJwFZWDlnDr8xvHfdMoubLFg1dCHKIeJ4txhy_nLg9REVGVJXb0xDpI8aeTx8OBWHccaaHL03e4pUVPJYFIvOOnUkcf2brWyNBuVAFKfC14ha2FycHnd6cKOETplzX-Vz48H_NsA25Iw?purpose=inline',
        'https://images.openai.com/static-rsc-4/7SwDfcWD736VpAq8lRAE98a_EjwBTJ8hMbaGbmpROQej4ezpQKnhaBYlaqo8jWPS57j8eeaOT1zjsGhTsX_DO5xNmiYsQ6eX_jdpXT8zg7mDIHBl6pxZ1uWTfIZ7rd4dfW6TFfTZfiAz4yvwdubiORAz8qazlR1Fu6be3RZLurs?purpose=inline',
      ],
      tips: ['大腿尽量抬高（接近水平）', '前脚掌着地，动作轻盈'],
    },
    {
      name: '原地慢跑 (Jogging in Place)',
      images: [
        'https://images.openai.com/static-rsc-4/XMLeVytDRWCatryaAwpnc-h7-gLEyt_jkiqKPZjNDZf5I0n7j7K2QqYzhXVahiijcld4X3RGenO14zCY0-okEJi53hh03BExDZyJBo9V-Brq00ShmqnvAZQphjLyGrDy5y7qWa5_vf3niGWF7TCMEgkOFtKVJ3BRS7A0VQEcspDsR-3XxZa1hMD9-9aGiuCY?purpose=inline',
        'https://images.openai.com/static-rsc-4/4PG7SML1v6w8SDFJcKeJSGD_21TmeU7Z7rZcSoHXtc3PbYSuZZWRnIVsU5MAqeGsuYQygvFH0m79DpwwclnjTUtTFnb1miV75s_KTtOvl0SYW0SQT_Jbuvq-dWOm69nNx55jSWKtbxzdHihWjfh6O_B3eMGIwQfqsa9EyWkqGdw?purpose=inline',
      ],
      tips: ['身体直立不前倾', '放松呼吸', '作为动态恢复阶段'],
    },
    {
      name: '哑铃提膝推举 (Dumbbell March and Press)',
      images: [
        'https://images.openai.com/static-rsc-4/0BPmEn6rrcCNmiU6qG2Tl3CJCLI3Brx_1C7ansWGEqnNIVosrS_R5zuTUQjQ7CUQVQmz9Lz1ZAR5XXp-19gCQ3mUsaotg26h2YLx6iOb12WyNyRD3wVCEyUoXqSBG5dsjpIhI9ndzf0aMqiE1GQ7LYFGafILGX6D-k7y9O8Q8j4?purpose=inline',
        'https://images.openai.com/static-rsc-4/g0lPOdeC482mxMG8s5hV10R2oUoC6AcQFRuLeOOEQi-kKP5UXbeedEaZwfKQr3zLU3SoOtctfM_WJG2TnIDpijZ3_w7LFUUb_mjgqiJyxK2Kc2Xyiah-OlRc9E6jux6nQxi3ztxYAp-hBO6tdwYlCFLqGHIw5_PRrBAy1MVS8dw?purpose=inline',
      ],
      tips: ['推举时核心收紧', '手臂不过度锁死', '控制节奏，不晃动'],
    },
  ],
};

export const ARM_CORE_ROUTINE = {
  id: 'builtin-arm-core-sculpt',
  name: '手臂 + 腰腹碎片化塑形训练',
  mode: 'finite',
  workSec: 40,
  restSec: 15,
  circuitRestSec: 30,
  circuits: 1,
  exercises: [
    {
      name: '哑铃弯举（手臂前侧）',
      images: [
        'https://images.openai.com/static-rsc-4/7AxGGmKFiIUfHsFmj68aUyqLnqDKgodBQQsC4Vzn2R9JUSln6ZT1TgbIkkh0mcGKVs7nQ07qXeyGJmlcLK2fyyDD38JBIZpiSLJtjXq4OLYo_5cLjick083-r_L3i_M2JT2exizV6A7uoZdJi9S5_mMJMKUuMnPLZssWNRHkFzw?purpose=inline',
        'https://images.openai.com/static-rsc-4/o4kIWZq2aBAzXtkgEFF0GRUTkv8Q9mlaNR2WgnfjaCXM_dxhUTrJDfgFV4972LLEagLTdjOrDgU0QFCZG5ZCiTzfmBFuT_EPtU7HiGojhaB65ZoYZwjvH_NO_CLfyPvWcRuY4mNdHzOZoKRYfwkko7z8yvUNECwep6gjxaypA3E?purpose=inline',
      ],
      tips: ['手肘固定在身体两侧', '不甩，慢上慢下', '12-15 次，约 40 秒'],
    },
    {
      name: '过头臂屈伸（手臂后侧，拜拜肉核心）',
      images: [
        'https://images.openai.com/static-rsc-4/TLKATc9nHfJ09hfNkjaciP7cykJFSX5_5pVw9gLQAcFxIEkRX_Y_jNlt6O3x-9DRHotvcTI16m9xrU3LJNUxXjlR9efF1IkTphaNhJqBVN8rOzCJrte95L3KvfX72KtzRLE1tbZl164PGDQ63zvZigLCmigEPduHyR3IbFyr0A5SlIN2bk1k3RPaj8mwsmyF?purpose=inline',
        'https://images.openai.com/static-rsc-4/BswNFB405eYm1X6Zcy9d-FQKIBvCkge4DKf6-9lWpDeK20fEuiIkamukY24cGT-71wfT2xv0TKqVurpxUsH1w81Z1KRErKbj9h3mcBpzwW3Kb6kgZ2Nqo9KbSwx6L-3aubgiJi_9V8jKD_eChmT5jAozoovaP3nTBc02Ps_zgVw?purpose=inline',
      ],
      tips: ['手肘尽量内收', '不要塌腰', '10-12 次，约 40 秒'],
    },
    {
      name: '平板支撑（核心稳定）',
      images: [
        'https://images.openai.com/static-rsc-4/v7na401X5xwgpqv1rA-c_Ba0hT_OTzsn1XS-bbsCvHN_plfCcO1-ty0wGRWMo-0URGY6PI3QeAfGREy5b4GHK_IRf8wiT7FW_Q4U9XgtPvU9qAV0wXMoyLUvPZrxa44K2dS5f3kqDktHKR-dpQCvf1cd460kQTkSplKAC6jkcgk?purpose=inline',
        'https://images.openai.com/static-rsc-4/7Xcd1UVRENjqisDcodh-Rx3XrdHrqPWiiNfrPFpO9pJj0mJCT21muMh_lQHC9gv-VAj3ONVFITnoMEANEYY5XTMQfenUIwmQmZhdSQmTLeKimhid0tFbUzGAFI3nAncOco3k0Pq1g3yRruejN-Yq2g8DS58p5jjOXv3gSvrkXfE?purpose=inline',
      ],
      tips: ['身体一条直线', '腹部收紧，不塌腰', '30-45 秒'],
    },
    {
      name: '哑铃俄罗斯转体（侧腹）',
      images: [
        'https://images.openai.com/static-rsc-4/JGwIpI1y8e-EX3LAIQcU2s0LD7ITJRBrxjn6_zzmRhum07HnMsnXyUhfBu1yRATkVVtHdlm64IVnUfZv_-2GjnApoZdfjUwTtNd8kEA-tDVOTfO0oGek1M2TweNyiRcvHvwKeXH-V9aKr-cRfyOEm-7yK3aIFZ3DqCB-gQz2ci0?purpose=inline',
        'https://images.openai.com/static-rsc-4/a6mhZ_nW60horKF5dgKCwp5kWDdLL1UNAsFm6sCfUQMaLku7ngPdHDKXbVTxLF3l0hVtGMIAqm9lOpAhYFkAh3jaKXaaYj6RGVa4qpoOGf8st7IY6srrohkitQI0I-XTV0fmGDXTtUkJzg7G0X51JFJjN9XCLhog24uJPTwDXiE?purpose=inline',
      ],
      tips: ['动作慢', '用腹部转，不是甩手', '20 次（左右各算一次）'],
    },
    {
      name: '抬腿（下腹核心）',
      images: [
        'https://images.openai.com/static-rsc-4/_7XmLLLHHwmA_50KUIjWfmeDJMA_H65HHqkO1_YU6BvTPmKhOL14AdbGH7IBlj8bMadYzkLa_QfQqcK1FNv4aNwkQQe8-tfPQp25HTw09CjfgthijrYNAOYH5ddHLe4BrcTrqz0JVMfJPVz1H-IYq68-oNYhUDF4fg2M4_7p_NA?purpose=inline',
        'https://images.openai.com/static-rsc-4/9ykMjjLwkJkM4vT1Rx5lors4SO1PiE1Q7v-MRT7cQtqPWjhrRHdGLbjbQQFR2R_f953N0Pb_8TEUihFMOlPluOCJd20SpCSHiF2NsZz1ZoES7RuJzqT1hsysKRnkd2b8fvsyt5mFb_oKVKYILA6FOdTyV2Kl3sFUqkEK5VPjCRI?purpose=inline',
      ],
      tips: ['下背贴地', '不要甩腿', '12-15 次，动作末尾休息 30 秒'],
    },
  ],
};

export const BUILTIN_ROUTINES = [DEFAULT_ROUTINE, ARM_CORE_ROUTINE];

export const SEEDED_DAILY_METRICS = {};

export const DEFAULT_APP_STATE = {
  routines: BUILTIN_ROUTINES,
  selectedRoutineId: DEFAULT_ROUTINE.id,
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
