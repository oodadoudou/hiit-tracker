import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clearScheduledAudio, playCompletionTone, playCountdownCue, playRhythmPulse, playSessionCue, primeAudio } from '../utils/audio';
import { buildWorkoutSummary } from '../utils/workout';
import { REST_GUIDE } from '../utils/constants';

function createIdleState() {
  return {
    phase: 'idle',
    remainingSec: 0,
    elapsedSec: 0,
    activeWorkSec: 0,
    exerciseIndex: 0,
    circuitIndex: 0,
    isRunning: false,
    isPaused: false,
    lastTickAt: 0,
  };
}

function getEffectiveWorkSec(exercises, index, fallback) {
  const ex = exercises?.[index];
  return (ex?.workSecOverride != null) ? ex.workSecOverride : fallback;
}

function getEffectiveRestSec(exercises, index, fallback) {
  const ex = exercises?.[index];
  return (ex?.restSecOverride != null) ? ex.restSecOverride : fallback;
}

function createStartState(routine) {
  return {
    phase: 'work',
    remainingSec: getEffectiveWorkSec(routine.exercises, 0, routine.workSec),
    elapsedSec: 0,
    activeWorkSec: 0,
    exerciseIndex: 0,
    circuitIndex: 0,
    isRunning: true,
    isPaused: false,
    lastTickAt: Date.now(),
  };
}

export function useTimer(routine, onStop, options = {}) {
  const [timer, setTimer] = useState(createIdleState);
  const intervalRef = useRef(null);
  const rhythmRef = useRef(null);
  const timerRef = useRef(timer);
  const onStopRef = useRef(onStop);
  const cueModeRef = useRef(options.audioMode || 'steady');

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  useEffect(() => {
    cueModeRef.current = options.audioMode || 'steady';
  }, [options.audioMode]);

  const stopTicker = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    clearScheduledAudio();
  }, []);

  const stopRhythmBed = useCallback(() => {
    if (rhythmRef.current) {
      window.clearInterval(rhythmRef.current);
      rhythmRef.current = null;
    }
    clearScheduledAudio();
  }, []);

  const finishAndLog = useCallback((summaryOverride) => {
    stopTicker();
    stopRhythmBed();
    const current = timerRef.current;
    if (!routine) {
      setTimer(createIdleState());
      return;
    }
    const summary = summaryOverride || buildWorkoutSummary({
      routine,
      elapsedSec: current.elapsedSec,
      activeWorkSec: current.activeWorkSec,
      intensityKey: options.intensityKey,
      intensityMultiplier: options.intensityMultiplier,
      weightKg: options.weightKg,
    });
    setTimer(createIdleState());
    playCompletionTone(cueModeRef.current, routine.exercises?.[current.exerciseIndex] || routine.exercises?.[0] || null);
    onStopRef.current?.(summary);
  }, [routine, stopRhythmBed, stopTicker]);

  const advancePhase = useCallback(() => {
    const current = timerRef.current;
    if (!routine) return;

    const lastExerciseIndex = routine.exercises.length - 1;
    const lastCircuitIndex = routine.circuits - 1;
    const cueMode = cueModeRef.current;
    const currentExercise = routine.exercises?.[current.exerciseIndex] || null;

    const effectiveRestSec = getEffectiveRestSec(routine.exercises, current.exerciseIndex, routine.restSec);

    const enterTimedPhase = (phase, patch = {}, durationOverride = null) => {
      playSessionCue('transition', cueMode, currentExercise);
      const nextExIdx = patch.exerciseIndex ?? current.exerciseIndex;
      const duration = durationOverride ?? (
        phase === 'rest'
          ? effectiveRestSec
          : phase === 'circuitRest'
            ? routine.circuitRestSec
            : getEffectiveWorkSec(routine.exercises, nextExIdx, routine.workSec)
      );
      setTimer((prev) => ({
        ...prev,
        ...patch,
        phase,
        remainingSec: duration,
        lastTickAt: Date.now(),
      }));
    };

    if (current.phase === 'work') {
      if (current.exerciseIndex < lastExerciseIndex) {
        if (effectiveRestSec > 0) {
          enterTimedPhase('rest');
        } else {
          const nextIdx = current.exerciseIndex + 1;
          playSessionCue('start', cueMode, routine.exercises?.[nextIdx] || currentExercise);
          setTimer((prev) => ({ ...prev, exerciseIndex: nextIdx, phase: 'work', remainingSec: getEffectiveWorkSec(routine.exercises, nextIdx, routine.workSec), lastTickAt: Date.now() }));
        }
        return;
      }

      if (routine.mode === 'infinite') {
        if (effectiveRestSec > 0) {
          enterTimedPhase('rest');
        } else {
          playSessionCue('start', cueMode, routine.exercises?.[0] || currentExercise);
          setTimer((prev) => ({ ...prev, exerciseIndex: 0, phase: 'work', remainingSec: getEffectiveWorkSec(routine.exercises, 0, routine.workSec), lastTickAt: Date.now() }));
        }
        return;
      }

      if (current.circuitIndex < lastCircuitIndex) {
        if (routine.circuitRestSec > 0) {
          enterTimedPhase('circuitRest');
        } else {
          playSessionCue('start', cueMode, routine.exercises?.[0] || currentExercise);
          setTimer((prev) => ({ ...prev, circuitIndex: prev.circuitIndex + 1, exerciseIndex: 0, phase: 'work', remainingSec: getEffectiveWorkSec(routine.exercises, 0, routine.workSec), lastTickAt: Date.now() }));
        }
        return;
      }

      finishAndLog();
      return;
    }

    if (current.phase === 'rest') {
      if (current.exerciseIndex === lastExerciseIndex) {
        // Rest after the last exercise in the circuit — decide what comes next
        if (routine.mode === 'finite') {
          if (current.circuitIndex >= lastCircuitIndex) {
            // All circuits complete → finish
            finishAndLog();
            return;
          }
          // More circuits remain — enter circuitRest or jump straight to next circuit
          if (routine.circuitRestSec > 0) {
            enterTimedPhase('circuitRest');
          } else {
            playSessionCue('start', cueMode, routine.exercises?.[0] || currentExercise);
            setTimer((prev) => ({ ...prev, circuitIndex: prev.circuitIndex + 1, exerciseIndex: 0, phase: 'work', remainingSec: getEffectiveWorkSec(routine.exercises, 0, routine.workSec), lastTickAt: Date.now() }));
          }
        } else {
          // Infinite mode — loop back to exercise 0
          playSessionCue('start', cueMode, routine.exercises?.[0] || currentExercise);
          setTimer((prev) => ({ ...prev, exerciseIndex: 0, phase: 'work', remainingSec: getEffectiveWorkSec(routine.exercises, 0, routine.workSec), lastTickAt: Date.now() }));
        }
        return;
      }

      // Not at last exercise — advance to the next one
      const nextExerciseIndex = current.exerciseIndex + 1;
      playSessionCue('start', cueMode, routine.exercises?.[nextExerciseIndex] || currentExercise);
      setTimer((prev) => ({
        ...prev,
        phase: 'work',
        remainingSec: getEffectiveWorkSec(routine.exercises, nextExerciseIndex, routine.workSec),
        exerciseIndex: nextExerciseIndex,
        lastTickAt: Date.now(),
      }));
      return;
    }

    if (current.phase === 'circuitRest') {
      playSessionCue('start', cueMode, routine.exercises?.[0] || currentExercise);
      setTimer((prev) => ({ ...prev, circuitIndex: prev.circuitIndex + 1, exerciseIndex: 0, phase: 'work', remainingSec: getEffectiveWorkSec(routine.exercises, 0, routine.workSec), lastTickAt: Date.now() }));
    }
  }, [finishAndLog, routine]);

  const tick = useCallback(() => {
    const current = timerRef.current;
    if (!current.isRunning || current.isPaused) return;
    const now = Date.now();
    const deltaSeconds = Math.floor((now - current.lastTickAt) / 1000);
    if (deltaSeconds <= 0) return;

    setTimer((prev) => {
      let next = { ...prev, lastTickAt: prev.lastTickAt + deltaSeconds * 1000 };
      for (let i = 0; i < deltaSeconds; i += 1) {
        if (next.remainingSec > 0) {
          next.remainingSec -= 1;
          next.elapsedSec += 1;
          if (next.phase === 'work') next.activeWorkSec += 1;
          playCountdownCue(
            next.remainingSec,
            cueModeRef.current,
            routine?.exercises?.[next.exerciseIndex] || null,
            next.phase,
          );
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (timer.isRunning && !timer.isPaused) {
      intervalRef.current = window.setInterval(tick, 250);
      return stopTicker;
    }
    stopTicker();
    return undefined;
  }, [stopTicker, tick, timer.isPaused, timer.isRunning]);

  useEffect(() => {
    stopRhythmBed();
    if (!routine || !timer.isRunning || timer.isPaused || timer.phase !== 'work') return undefined;

    const exercise = routine.exercises?.[timer.exerciseIndex] || null;
    const tempo = String(exercise?.tempo || 'steady').toLowerCase();
    const focus = String(exercise?.focus || 'general').toLowerCase();
    const intervalMs = tempo === 'rhythmic'
      ? 900
      : tempo === 'slow'
        ? 1700
        : tempo === 'controlled'
          ? 1350
          : 1200;
    const leadDelay = focus === 'cardio' ? 180 : focus === 'recovery' ? 420 : 260;

    const kickOff = window.setTimeout(() => {
      playRhythmPulse(cueModeRef.current, exercise);
      rhythmRef.current = window.setInterval(() => {
        playRhythmPulse(cueModeRef.current, routine.exercises?.[timerRef.current.exerciseIndex] || exercise);
      }, intervalMs);
    }, leadDelay);

    return () => {
      window.clearTimeout(kickOff);
      stopRhythmBed();
    };
  }, [routine, stopRhythmBed, timer.exerciseIndex, timer.isPaused, timer.isRunning, timer.phase]);

  useEffect(() => {
    if (timer.isRunning && timer.remainingSec <= 0 && timer.phase !== 'idle') {
      advancePhase();
    }
  }, [advancePhase, timer.isRunning, timer.phase, timer.remainingSec]);

  const actions = useMemo(() => ({
    start() {
      if (!routine) return;
      primeAudio();
      const current = timerRef.current;
      if (current.phase === 'idle') {
        playSessionCue('start', cueModeRef.current, routine.exercises?.[0] || null);
        setTimer(createStartState(routine));
        return;
      }
      setTimer((prev) => ({ ...prev, isRunning: true, isPaused: false, lastTickAt: Date.now() }));
    },
    pause() {
      setTimer((prev) => (prev.phase === 'idle' ? prev : { ...prev, isPaused: !prev.isPaused, lastTickAt: Date.now() }));
    },
    skip() {
      if (!timerRef.current.isRunning) return;
      advancePhase();
    },
    stop() {
      const current = timerRef.current;
      if (!routine || current.phase === 'idle') return;
      finishAndLog(buildWorkoutSummary({
        routine,
        elapsedSec: current.elapsedSec,
        activeWorkSec: current.activeWorkSec,
        intensityKey: options.intensityKey,
        intensityMultiplier: options.intensityMultiplier,
        weightKg: options.weightKg,
      }));
    },
    reset() {
      stopTicker();
      stopRhythmBed();
      setTimer(createIdleState());
    },
  }), [advancePhase, finishAndLog, routine, stopRhythmBed, stopTicker]);

  const currentExercise = routine?.exercises?.[timer.exerciseIndex] || null;
  const guide = timer.phase === 'rest' || timer.phase === 'circuitRest' || timer.phase === 'idle' && !currentExercise
    ? REST_GUIDE
    : currentExercise || REST_GUIDE;

  return {
    timer,
    currentExercise,
    guide,
    actions,
  };
}
