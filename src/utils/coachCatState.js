// Helper: builds the state object for <CoachCat> in WorkoutPage.

export function buildCoachCatState({
  timer,
  routine,
  currentExercise,
  nextText,
  coachStyle,
  coachPromptFrequency,
  readiness,
  focus,
  idleDurationSec,
  celebrateCompletion,
  coachMemory,
  intensityKey,
}) {
  const exercise = currentExercise || routine?.exercises?.[0] || null;
  const currentName = exercise?.name || routine?.exercises?.[0]?.name || 'Workout';
  const stage = getCoachStage(timer, routine);
  const stagePrompt = getCoachPrompt(stage, coachStyle, focus);
  const techniqueCue = buildTechniqueCue(exercise, readiness);
  const motion = buildMotionProfile({ timer, exercise, intensityKey, celebrateCompletion });
  const idleNudge = buildIdleNudge(idleDurationSec, coachStyle, coachMemory);

  if (celebrateCompletion) {
    const completionTone = coachMemory?.lastCompletedOutcome === 'big-burn'
      ? '今天这一轮烧得很到位。'
      : coachMemory?.lastCompletedOutcome === 'long-session'
        ? '这一轮拉得够长，小猫记住了。'
        : '训练收住了，小猫开始庆祝。';
    return {
      tone: 'complete',
      badge: 'Victory zoomies',
      message: coachStyle === 'strict' || coachStyle === 'cold' ? '这轮完成得像样。' : completionTone,
      caption: '去保存记录，把今天的体感写下来，下一次会更准。',
      footer: 'Session complete',
      motion,
      autonomy: { mode: 'celebrate' },
    };
  }

  if (timer.phase === 'idle') {
    const idleBadge = idleNudge.level > 0 ? 'Little nudge' : readiness.readinessLabel === 'caution' ? 'Recovery-first mode' : 'Waiting to coach';
    return {
      tone: idleNudge.level > 0 ? 'steady' : readiness.readinessLabel === 'caution' ? 'recover' : 'idle',
      badge: idleBadge,
      message: idleNudge.message || (currentName ? `准备好就开始「${currentName}」。` : '选一个训练，猫猫就位。'),
      caption: buildIdleCaption({ readiness, exercise, idleDurationSec, coachPromptFrequency }),
      footer: `${formatFocusLabel(readiness.summary?.semantics?.dominantFocus)} · Next ${nextText}`,
      motion,
      autonomy: { mode: 'idle', idleDurationSec },
      memoryPatch: idleNudge.memoryPatch,
    };
  }

  if (timer.phase === 'rest' || timer.phase === 'circuitRest') {
    return {
      tone: 'recover',
      badge: timer.phase === 'circuitRest' ? 'Between rounds' : 'Recovery window',
      message: stagePrompt.message,
      caption: buildRecoveryCaption(stagePrompt, nextText, timer.remainingSec, techniqueCue, coachPromptFrequency),
      footer: `${timer.remainingSec}s left`,
      motion,
      autonomy: { mode: 'recover' },
    };
  }

  return {
    tone: motion.tone,
    badge: timer.remainingSec <= 3 ? 'Final push' : 'Live coaching',
    message: currentName,
    caption: buildLiveCaption(stagePrompt, techniqueCue, coachPromptFrequency),
    footer: `${timer.remainingSec}s left · Next ${nextText}`,
    motion,
    autonomy: { mode: 'active' },
  };
}

export function getNextText(timer, routine) {
  if (!routine) return '--';
  if (timer.phase === 'idle') return routine.exercises?.[0]?.name || '--';

  const lastExerciseIndex = routine.exercises.length - 1;
  const lastCircuitIndex = routine.circuits - 1;
  const isLastExercise = timer.exerciseIndex >= lastExerciseIndex;
  const isLastCircuit = timer.circuitIndex >= lastCircuitIndex;

  if (timer.phase === 'work') {
    if (!isLastExercise) return routine.exercises[timer.exerciseIndex + 1]?.name || '--';
    if (routine.mode === 'infinite') return routine.restSec > 0 ? 'Rest' : (routine.exercises[0]?.name || '--');
    if (!isLastCircuit) {
      if (routine.circuitRestSec > 0) return 'Circuit Rest';
      return routine.exercises[0]?.name || '--';
    }
    return 'Finish';
  }

  if (timer.phase === 'rest') {
    if (!isLastExercise) return routine.exercises[timer.exerciseIndex + 1]?.name || '--';
    if (routine.mode === 'infinite') return routine.exercises[0]?.name || '--';
    if (!isLastCircuit) return routine.circuitRestSec > 0 ? 'Circuit Rest' : (routine.exercises[0]?.name || '--');
    return 'Finish';
  }

  if (timer.phase === 'circuitRest') return routine.exercises[0]?.name || '--';
  return 'Finish';
}

function getCoachStage(timer, routine) {
  if (timer.phase === 'idle') return 'start';
  if (timer.phase === 'rest') return 'rest';
  if (timer.phase === 'circuitRest') return 'circuitRest';
  if (timer.remainingSec <= 3) return 'finalPush';
  if (timer.remainingSec <= Math.max(3, Math.ceil((routine?.workSec || 0) / 2))) return 'midpoint';
  return 'resume';
}

function buildTechniqueCue(exercise, readiness) {
  if (!exercise) return '';
  const fragments = [];
  if (exercise.impactLevel === 'high') fragments.push('落地放轻，别把冲击全扔给膝盖。');
  if (exercise.jointLoad === 'high') fragments.push('关节轨迹先稳，再补速度和次数。');
  if (exercise.tempo === 'slow') fragments.push('慢速控制，不要靠惯性甩过去。');
  if (exercise.tempo === 'controlled') fragments.push('离心段留住，不要快上快下。');
  if (exercise.tempo === 'rhythmic') fragments.push('呼吸和动作节拍对上，别越做越乱。');
  if (readiness?.readinessLabel === 'caution' && exercise.regression) {
    fragments.push(`不稳就直接降阶：${exercise.regression}。`);
  }
  return fragments.slice(0, 2).join(' ');
}

function buildIdleCaption({ readiness, exercise, idleDurationSec, coachPromptFrequency }) {
  const base = readiness?.prompts?.[0] || '';
  const technique = exercise?.regression ? `今天发飘时就用这个降阶：${exercise.regression}。` : '';
  if (coachPromptFrequency === 'light') return base || technique;
  if (idleDurationSec >= 120) return `${base} ${technique}`.trim();
  if (coachPromptFrequency === 'active') return `${base} ${technique}`.trim();
  return base;
}

function buildRecoveryCaption(stagePrompt, nextText, remainingSec, techniqueCue, frequency) {
  if (frequency === 'light') return `下一步：${nextText}`;
  const extra = frequency === 'active' ? `恢复剩余 ${remainingSec}s。` : '';
  return `${stagePrompt.caption} ${techniqueCue} 下一步：${nextText} ${extra}`.trim();
}

function buildLiveCaption(stagePrompt, techniqueCue, frequency) {
  if (frequency === 'light') return `${stagePrompt.caption} ${techniqueCue}`.trim();
  if (frequency === 'active') return `${stagePrompt.message} ${stagePrompt.caption} ${techniqueCue}`.trim();
  return `${stagePrompt.caption} ${techniqueCue}`.trim();
}

function buildIdleNudge(idleDurationSec, coachStyle, coachMemory) {
  const now = Date.now();
  const sinceCompletionSec = coachMemory?.lastCompletedAt ? Math.floor((now - coachMemory.lastCompletedAt) / 1000) : null;
  const recentlyIgnored = coachMemory?.lastIdleNudgeAt && coachMemory?.lastInteractionAt
    ? coachMemory.lastIdleNudgeAt > coachMemory.lastInteractionAt
    : false;
  if (sinceCompletionSec !== null && sinceCompletionSec < 1800 && idleDurationSec < 45) {
    return {
      level: 0,
      message: coachStyle === 'strict' || coachStyle === 'cold'
        ? '上一轮已经完成，今天别再乱加量。'
        : `上一轮「${coachMemory.lastCompletedRoutine || '训练'}」刚做完，小猫先陪你缓一会儿。`,
      memoryPatch: null,
    };
  }
  if (idleDurationSec >= 120) {
    return {
      level: 2,
      message: coachStyle === 'strict' || coachStyle === 'cold'
        ? '已经拖太久了。先把第一轮开起来。'
        : recentlyIgnored
          ? '你刚才已经被提醒过啦，小猫这次认真催你开第一轮。'
          : '已经歇了一会儿啦，要不要先开第一轮热起来？',
      memoryPatch: coachMemory?.lastIdleNudgeLevel === 2 ? null : { lastIdleNudgeLevel: 2, lastIdleNudgeAt: now, ignoredNudges: recentlyIgnored ? (Number(coachMemory?.ignoredNudges || 0) + 1) : Number(coachMemory?.ignoredNudges || 0) },
    };
  }
  if (idleDurationSec >= 60) {
    return {
      level: 1,
      message: coachStyle === 'steady' ? '可以开始第一轮了，先把节奏立住。' : coachStyle === 'cold' ? '可以开始了。别继续拖。' : '小提醒：越晚开始，身体越不想动。',
      memoryPatch: coachMemory?.lastIdleNudgeLevel === 1 ? null : { lastIdleNudgeLevel: 1, lastIdleNudgeAt: now },
    };
  }
  return {
    level: 0,
    message: '',
    memoryPatch: coachMemory?.lastIdleNudgeLevel ? { lastIdleNudgeLevel: 0 } : null,
  };
}

export function buildMotionProfile({ timer, exercise, intensityKey, celebrateCompletion }) {
  if (celebrateCompletion) {
    return { tone: 'complete', speed: 0.86, amplitude: 1.18, intensity: 'burst' };
  }
  const impact = exercise?.impactLevel || 'medium';
  const tempo = exercise?.tempo || 'steady';
  const sprintBoost = intensityKey === 'sprint' ? 0.14 : intensityKey === 'easy' ? -0.08 : 0;
  const tempoBoost = tempo === 'rhythmic' ? 0.12 : tempo === 'controlled' ? -0.02 : tempo === 'slow' ? -0.08 : 0;
  const impactBoost = impact === 'high' ? 0.12 : impact === 'low' ? -0.05 : 0;
  if (timer.phase === 'rest' || timer.phase === 'circuitRest') {
    return { tone: 'recover', speed: 1.08, amplitude: 0.92, intensity: 'soft' };
  }
  if (timer.phase === 'idle') {
    return { tone: 'idle', speed: 1.18, amplitude: 0.94, intensity: 'soft' };
  }
  if (timer.remainingSec <= 3) {
    return { tone: 'push', speed: Math.max(0.52, 0.7 - sprintBoost), amplitude: 1.08 + impactBoost, intensity: 'sharp' };
  }
  if (timer.remainingSec <= Math.max(3, Math.ceil(((timer.remainingSec || 1) + 1) / 2))) {
    return { tone: 'steady', speed: 0.94 - tempoBoost, amplitude: 1.02, intensity: 'steady' };
  }
  return {
    tone: impact === 'high' || tempo === 'rhythmic' || intensityKey === 'sprint' ? 'hype' : 'steady',
    speed: Math.max(0.68, 0.92 - sprintBoost - tempoBoost),
    amplitude: 1 + impactBoost + (intensityKey === 'sprint' ? 0.06 : 0),
    intensity: impact === 'high' ? 'sharp' : 'steady',
  };
}

function getCoachPrompt(stage, style, exerciseFocus) {
  const prompts = {
    cold: {
      start: { message: '开始。', caption: '动作做干净，别浪费这组。' },
      rest: { message: '休息。把呼吸拉回来。', caption: '恢复不好，下一段只会更散。' },
      circuitRest: { message: '这一轮结束。先把状态收住。', caption: '别急着进下一轮。' },
      resume: { message: '继续。', caption: '前几秒先把节奏立住。' },
      midpoint: { message: '过半。', caption: '疲劳出现了，动作别跟着散。' },
      finalPush: { message: '最后几秒。', caption: '做满，但别做丑。' },
    },
    cute: {
      start: { message: '开练啦，小猫陪你稳稳起步。', caption: '先把动作做漂亮，再去追速度。' },
      rest: { message: '呼一口气，小猫盯着你恢复。', caption: '现在降心率，下一段会更稳。' },
      circuitRest: { message: '这一轮收住，猫猫说先放松肩膀。', caption: '恢复好了，再进下一轮。' },
      resume: { message: '回来啦，小猫继续给你加油。', caption: '第一下先稳，再慢慢提节奏。' },
      midpoint: { message: '已经过半啦，动作别散。', caption: '核心收紧，节奏继续稳。' },
      finalPush: { message: '最后几秒，小猫给你冲刺 buff。', caption: '把动作做满，不要乱。' },
    },
    steady: {
      start: { message: '开始训练，先把节奏定住。', caption: '动作质量优先，速度放后。' },
      rest: { message: '进入恢复段，先把呼吸拉平。', caption: '恢复做得好，下一段更稳。' },
      circuitRest: { message: '这一轮结束，肩颈先放松。', caption: '准备好再推进下一轮。' },
      resume: { message: '重新进入训练段。', caption: '先稳住前几秒，再提速。' },
      midpoint: { message: '训练已过半，保持动作标准。', caption: '不要因为疲劳缩小动作幅度。' },
      finalPush: { message: '最后几秒，完成质量比抢速度更重要。', caption: '稳住呼吸，把动作做完整。' },
    },
    strict: {
      start: { message: '开练。别磨，第一组就做标准。', caption: '动作一乱，强度就没有意义。' },
      rest: { message: '恢复段不是发呆段。认真呼吸。', caption: '你恢复得越差，下一段越散。' },
      circuitRest: { message: '这一轮结束，立刻把状态收回来。', caption: '别让疲劳把动作拖垮。' },
      resume: { message: '继续。前几秒先稳住身体。', caption: '节奏可以快，动作不能乱。' },
      midpoint: { message: '过半了，别开始偷动作。', caption: '核心收紧，落地放轻。' },
      finalPush: { message: '最后几秒，给我做满。', caption: '撑住，不要拿变形动作糊弄。' },
    },
  };
  const base = prompts[style]?.[stage] || prompts.cold[stage] || { message: '继续。', caption: '' };
  const movementCue = getMovementCue(stage, exerciseFocus, style);
  if (!movementCue) return base;
  return { message: base.message, caption: `${base.caption} ${movementCue}`.trim() };
}

function getMovementCue(stage, focus, style) {
  const cues = {
    cold: {
      legs: { start: '膝盖轨迹先管住。', midpoint: '别开始偷深度。', finalPush: '最后几下也别塌。' },
      core: { start: '腹压先锁住。', midpoint: '动作慢一点，别让腰代偿。', finalPush: '最后几秒也别塌腰。' },
      cardio: { start: '呼吸和落地先同步。', midpoint: '脚步放轻，别砸地。', finalPush: '提频率可以，动作别碎。' },
      upper: { start: '肩别耸，轨迹别歪。', midpoint: '别开始借惯性。', finalPush: '最后几下照样控住。' },
      recovery: { rest: '恢复段就认真恢复。' },
    },
    cute: {
      legs: { start: '膝盖跟脚尖同方向，小猫看着你别内扣。', midpoint: '脚跟稳稳踩住，起身时记得把臀腿发力做出来。', finalPush: '最后几下也要轻落地，别让膝盖替你硬扛。' },
      core: { start: '肚肚收紧，小猫提醒你先把腰背稳住。', midpoint: '动作慢一点也没关系，核心发力比次数更重要。', finalPush: '最后几秒别塌腰，稳稳把腹部控制住。' },
      cardio: { start: '先把呼吸和落地节奏对上，小猫陪你热起来。', midpoint: '肩膀放松，脚步轻一点，节奏就会更顺。', finalPush: '最后几秒冲一下，但落地还是要轻轻的。' },
      upper: { start: '肩膀放松，小猫提醒你别耸肩借力。', midpoint: '慢一点没事，把手臂发力轨迹走完整。', finalPush: '最后几下别甩，稳稳控制住手臂。' },
      recovery: { rest: '这段就乖乖放松呼吸，把身体哄回来。' },
    },
    steady: {
      legs: { start: '膝盖跟脚尖同向，重心放在脚中后段。', midpoint: '继续保持下肢轨迹稳定，不要开始塌膝。', finalPush: '最后阶段依然优先控制落地和起身轨迹。' },
      core: { start: '先固定躯干，再做动作幅度。', midpoint: '核心训练宁可慢一点，也不要腰椎代偿。', finalPush: '最后几秒继续收紧腹部，不要让腰拱起来。' },
      cardio: { start: '先建立均匀呼吸，再拉快节奏。', midpoint: '保持轻落地和稳定摆臂，避免动作散掉。', finalPush: '最后阶段可以提频率，但不要牺牲动作控制。' },
      upper: { start: '肩颈放松，发力从目标肌群开始，不要借惯性。', midpoint: '继续控制离心阶段，不要只顾着把动作甩上去。', finalPush: '最后几下保持轨迹，不要耸肩顶替。' },
      recovery: { rest: '恢复阶段重点是把呼吸和肌肉紧张一起放下来。' },
    },
    strict: {
      legs: { start: '膝盖别乱跑，轨迹先做对。', midpoint: '腿还在发力，别开始偷深度。', finalPush: '最后几下也别拿塌膝糊弄。' },
      core: { start: '腹部先锁住，腰别乱顶。', midpoint: '别拿速度遮羞，核心动作一散就没价值。', finalPush: '最后几秒也别塌腰，收紧。' },
      cardio: { start: '先把呼吸和落地做稳，再谈冲。', midpoint: '肩膀别耸，脚步别砸地。', finalPush: '冲可以，动作别炸。' },
      upper: { start: '肩别耸，别借甩。', midpoint: '控制轨迹，不要用惯性混过去。', finalPush: '最后几下照样要标准，不准乱甩。' },
      recovery: { rest: '恢复就恢复，别装作在休息。' },
    },
  };
  return cues[style]?.[focus]?.[stage] || cues[style]?.[focus]?.start || null;
}

function formatFocusLabel(focus) {
  if (focus === 'legs') return '腿臀';
  if (focus === 'core') return '核心';
  if (focus === 'cardio') return '心肺';
  if (focus === 'upper') return '上肢';
  if (focus === 'recovery') return '恢复';
  return '全身';
}
