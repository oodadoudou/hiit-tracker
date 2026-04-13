import { HIGH_IMPACT_ROUTINE_IDS } from './constants';
import { summarizeRoutineSemantics } from './workout';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sortRecentEntries(workoutHistory) {
  return [...(Array.isArray(workoutHistory) ? workoutHistory : [])]
    .filter((entry) => entry && entry.dateIso && !Number.isNaN(new Date(entry.dateIso).getTime()))
    .sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso));
}

export function buildWorkoutGuidance({ routine, workoutHistory = [], hasConsecutiveHighImpact = false }) {
  const recentHistory = sortRecentEntries(workoutHistory).slice(0, 5);
  const recentCluster = recentHistory.slice(0, 3);
  const lastSession = recentHistory[0] || null;
  const semantics = summarizeRoutineSemantics(routine);

  const recentRpeValues = recentCluster.map((entry) => toNumber(entry.rpe)).filter((value) => value !== null);
  const recentJointValues = recentCluster.map((entry) => toNumber(entry.jointComfort)).filter((value) => value !== null);
  const lastRpe = toNumber(lastSession?.rpe);
  const lastJoint = toNumber(lastSession?.jointComfort);
  const avgRpe = average(recentRpeValues);
  const avgJoint = average(recentJointValues);
  const avgIntensity = average(
    recentCluster
      .map((entry) => toNumber(entry.intensityMultiplier))
      .filter((value) => value !== null),
  );

  let readinessScore = 76;
  if (!recentHistory.length) readinessScore = 82;
  if (routine?.mode === 'finite') readinessScore += 2;
  if (routine && HIGH_IMPACT_ROUTINE_IDS.has(routine.id)) readinessScore -= 8;
  if (routine?.id === 'builtin-knee-recovery') readinessScore += 10;
  if (semantics.avgImpactLevel === 'high') readinessScore -= 7;
  else if (semantics.avgImpactLevel === 'low') readinessScore += 3;
  if (semantics.avgJointLoad === 'high') readinessScore -= 6;
  else if (semantics.avgJointLoad === 'low') readinessScore += 2;
  if (semantics.controlledTempoShare >= 0.5) readinessScore += 2;
  if (semantics.rhythmicTempoShare >= 0.5 && semantics.avgImpactLevel !== 'low') readinessScore -= 3;
  if (semantics.recoveryShare >= 0.5) readinessScore += 5;
  if (hasConsecutiveHighImpact) readinessScore -= 18;
  if (lastRpe !== null) {
    if (lastRpe >= 8) readinessScore -= 16;
    else if (lastRpe >= 6) readinessScore -= 8;
  }
  if (lastJoint !== null) {
    if (lastJoint <= 3) readinessScore -= 18;
    else if (lastJoint <= 5) readinessScore -= 10;
  }
  if (avgRpe !== null) {
    if (avgRpe >= 7) readinessScore -= 8;
    else if (avgRpe <= 4) readinessScore += 4;
  }
  if (avgJoint !== null) {
    if (avgJoint <= 5) readinessScore -= 8;
    else if (avgJoint >= 8) readinessScore += 4;
  }
  if (avgIntensity !== null) {
    if (avgIntensity >= 1.15) readinessScore -= 8;
    else if (avgIntensity <= 0.85) readinessScore += 3;
  }
  readinessScore = clamp(Math.round(readinessScore), 20, 96);

  const isHighImpactRoutine = Boolean(routine && HIGH_IMPACT_ROUTINE_IDS.has(routine.id));
  const shouldCaution = readinessScore < 55 || hasConsecutiveHighImpact || (lastJoint !== null && lastJoint <= 4) || (lastRpe !== null && lastRpe >= 8);
  const shouldSuggestRecovery = isHighImpactRoutine && (shouldCaution || readinessScore < 65);
  const shouldProtectJoints = shouldCaution || semantics.avgJointLoad === 'high' || semantics.avgImpactLevel === 'high';

  let audioMode = 'steady';
  if (routine?.id === 'builtin-knee-recovery') {
    audioMode = 'recovery';
  } else if (shouldCaution) {
    audioMode = 'caution';
  } else if (readinessScore >= 78 && !isHighImpactRoutine) {
    audioMode = 'power';
  }

  const prompts = [];
  const focusLabel = getFocusLabel(semantics.dominantFocus);
  const loadLabel = getLevelLabel(semantics.avgJointLoad, 'joint');
  const impactLabel = getLevelLabel(semantics.avgImpactLevel, 'impact');
  const tempoLabel = getTempoLabel(semantics.dominantTempo);

  if (!recentHistory.length) {
    prompts.push(`这是第一次训练记录，这套动作以${focusLabel}为主，先按${tempoLabel}节奏做一轮，观察呼吸和动作控制。`);
  } else if (readinessScore < 55) {
    prompts.push(`今天建议保守开局，这套动作的关节负荷${loadLabel}、冲击${impactLabel}，前半段先把动作质量放在速度前面。`);
  } else if (readinessScore < 75) {
    prompts.push(`今天适合稳住节奏，这组动作更偏${focusLabel}，先做 1-2 组再决定是否提速。`);
  } else {
    prompts.push(`状态不错，可以正常推进；这套动作偏${focusLabel}，但前半程仍然优先维持${tempoLabel}节奏。`);
  }

  if (isHighImpactRoutine) {
    prompts.push('当前是高冲击训练，先把落地和关节轨迹做稳，再追求强度。');
  }
  if (semantics.avgJointLoad === 'high') {
    prompts.push('这套动作对下肢或支撑位稳定要求更高，先把关节轨迹和受力顺序做稳。');
  }
  if (semantics.controlledTempoShare >= 0.5) {
    prompts.push('今天的动作更吃控制，不要为了赶时间把离心阶段直接丢掉。');
  }
  if (lastRpe !== null && lastRpe >= 8) {
    prompts.push('最近一次主观疲劳偏高，这次把恢复段当成真正恢复。');
  }
  if (lastJoint !== null && lastJoint <= 4) {
    prompts.push('最近关节舒适度偏低，如果出现不稳感，立刻降阶或切换恢复动作。');
  }
  if (avgJoint !== null && avgJoint <= 5) {
    prompts.push('近几次关节反馈不稳定，今天尽量避免额外冲击。');
  }
  if (avgIntensity !== null && avgIntensity >= 1.15) {
    prompts.push('最近训练强度偏高，这次先把节奏放回可控区间。');
  }
  if (shouldProtectJoints && semantics.primaryRegression) {
    prompts.push(`如果动作开始发飘，直接降阶：${semantics.primaryRegression}。`);
  }

  return {
    readinessScore,
    readinessLabel: readinessScore >= 78 ? 'ready' : readinessScore >= 55 ? 'steady' : 'caution',
    audioMode,
    shouldSuggestRecovery,
    prompts,
    summary: {
      recentSessions: recentHistory.length,
      avgRpe: avgRpe !== null ? Math.round(avgRpe * 10) / 10 : null,
      avgJoint: avgJoint !== null ? Math.round(avgJoint * 10) / 10 : null,
      avgIntensity: avgIntensity !== null ? Math.round(avgIntensity * 100) / 100 : null,
      lastRpe,
      lastJoint,
      semantics,
    },
  };
}

function getFocusLabel(focus) {
  if (focus === 'legs') return '腿臀发力';
  if (focus === 'core') return '核心控制';
  if (focus === 'cardio') return '心肺推进';
  if (focus === 'upper') return '上肢发力';
  if (focus === 'recovery') return '恢复激活';
  return '全身协调';
}

function getLevelLabel(level, kind) {
  if (kind === 'joint') {
    if (level === 'high') return '偏高';
    if (level === 'low') return '偏低';
    return '中等';
  }
  if (level === 'high') return '偏高';
  if (level === 'low') return '偏低';
  return '中等';
}

function getTempoLabel(tempo) {
  if (tempo === 'slow') return '偏慢';
  if (tempo === 'controlled') return '受控';
  if (tempo === 'rhythmic') return '节奏型';
  return '稳定';
}
