# hiit-tracker

Desktop HIIT timer and training tracker built with React + Vite + Electron.

## Features

### Timer
- Work / Rest / Circuit Rest phase machine with finite and infinite circuit modes
- Per-exercise timing overrides — set custom work and rest seconds per exercise; falls back to routine global if unset
- Intensity modifier: Easy (0.75×) / Normal (1×) / Sprint (1.25×) scales work duration on the fly
- Play / Pause / Skip / Stop controls
- Rhythm pulse audio cues tuned to each exercise's tempo (slow / controlled / steady / rhythmic)
- Countdown beeps in the final 3 seconds of each phase

### Coach Cat
- ASCII art cat companion that reacts to workout state (idle, hype, rest, celebrating)
- Delivers contextual coaching messages during sessions based on exercise type and timer phase
- Persistent memory across sessions (encouragement, warnings, streaks)
- Three coach styles: Cold / Warm / Hype — configurable in Settings
- Optional audio encouragement cues, configurable prompt frequency

### Routine Management (Routines page)
- Full routine editor with collapsible exercise cards (expand one at a time)
- Per-exercise fields: name, image URL, tips, focus, joint load, impact level, tempo, regression cue, breathing cue, common mistakes, per-exercise work/rest overrides
- Routine-level fields: work sec, rest sec, circuit rest sec, circuit count, mode (finite / infinite)
- Routine name deduplication — saving a duplicate name appends a numeric suffix automatically
- Exercises auto-saved to the library whenever a routine is saved

### Routine Generator (Routines page)
- Filter by target muscle group, exercise tags (OR logic — matches any selected tag), difficulty, tempo, equipment
- Choose exercise count (3–12) and number of routines to generate (1–8)
- Reroll individual generated routines; create named variants
- Save and load generator filter presets

### Exercise Library (Routines page)
- Built-in exercise library with categorised metadata (focus, impact, tempo, tags, tips)
- Add, edit, and delete custom exercises
- Quick-add tag chips for common tags; free-text input for custom tags
- Custom exercises are included as candidates in the routine generator

### Dashboard
- Daily calorie log: intake, exercise burn, estimated metabolic burn (Mifflin-St Jeor BMR), deficit status
- MET-based calorie calculation for exercise sessions — weight-aware and exercise-focus-aware (cardio / upper / core / legs / recovery)
- Water intake tracker with daily goal and quick-add buttons
- 7-day training heatmap — workout + deficit / trained / deficit met / no record
- Training insights: recent RPE trend, joint comfort trend, average session duration, streak alert

### Workout History (History page)
- Session log: date, routine, duration, calories, RPE, joint comfort
- Routine frequency table
- Clear history with confirmation

### Post-Workout Modal
- Auto-appears after each completed session
- RPE (1–10) and joint comfort (1–10) sliders
- Personal record detection — flags calorie PR and duration PR for the routine
- Save Record or Discard

### Settings
- Body profile: sex, age, height, weight — used for BMR and MET calorie estimates
- Daily calorie goal
- Coach Cat style, prompt frequency, audio cues, warmup preference
- Minimum session length threshold for auto-saving to history

### Data (Data page)
- Export full backup as JSON (custom routines, custom exercises, history, diet logs, settings)
- Import with four modes:
  - **Full Restore** — overwrites all data
  - **Routines Only** — imports routines, leaves everything else untouched
  - **Exercises Only** — imports custom exercise library
  - **Merge** — adds new routines and exercises; existing same-name entries are kept

---

## UI Overview

### Workout — Live Session

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [● Workout]  [ Dashboard]  [ History]  [ Routines]  [ Settings]         │
├──────────────────────────────────────────────────────────────────────────┤
│  Routine ▾  HIIT Full Body          Intensity  [Easy] [● Normal] [Sprint] │
├─────────────────────────────────────┬────────────────────────────────────┤
│  ◆ WORK                             │  Visual Guide                       │
│                                     │  ┌──────────────────────────────┐  │
│  Jump Squat                         │  │      [ exercise image ]      │  │
│  Next: Push-Up                      │  └──────────────────────────────┘  │
│                                     │  Tips:                             │
│           00:34                     │  · Keep core tight                 │
│                                     │  · Land softly                     │
│   CIRCUIT 01 / 03    TOTAL  1m 20s  │  · Full range of motion            │
│                                     ├────────────────────────────────────┤
│  [▶ Play] [⏸ Pause] [⏭ Skip] [■ Stop] │  Focus  cardio · Impact  high   │
│                                     │  Tempo  rhythmic · Load  medium    │
├─────────────────────────────────────┴────────────────────────────────────┤
│  Coach Cat: "Don't slow down now — you're almost through circuit 1."      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Dashboard — Daily Log

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Daily Deficit · 2026-04-12                                 -350 kcal ✓  │
│  Intake 1 800  Metabolism 1 680  Exercise 470                            │
│  ████████████████████████░░░░░░░  goal progress                          │
├────────────────────────────┬─────────────────────────────────────────────┤
│  Hydration                 │  Last 7 Days                                │
│  💧 1 750 ml / 2 000 ml   │  Mo Tu We Th Fr Sa Su                       │
│  ████████████░░░░  88%     │  ○  ●  ●  ○  ●  ●  ○                       │
│  [+250ml] [+500ml] [Reset] │  ● Workout+deficit  ◑ Trained  ○ No record  │
└────────────────────────────┴─────────────────────────────────────────────┘
│  Training Insights                                                        │
│  Avg RPE 6.8 · Joint comfort 7.5 · Avg session 22 min                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Routines — Editor + Generator

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Routine Lab · Generate Random Routines                                  │
│  Targets: [Upper] [Core] [●Legs]   Tags: [●jump] [squat] [no-jump]      │
│  Exercises: 6   Routines: 2   [Generate]                                 │
│  ─────────────────────────────────────────────────────────────────────── │
│  Generated: [● Leg Burner A]  [Leg Burner B]  [↺ Reroll]  [+ Variant]   │
├──────────────────────────────────────────────────────────────────────────┤
│  Routine Editor                                                           │
│  Name: Leg Burner A   Work: 40s   Rest: 15s   Circuits: 3               │
│  ▼ Exercise 1: Jump Squat  [custom: work 50s / rest 10s]                 │
│  ▶ Exercise 2: Reverse Lunge  [global timing]                            │
│  ▶ Exercise 3: Glute Bridge  [global timing]                             │
│  [+ Add Exercise]                         [Save Routine]  [Delete]       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Development

```bash
npm install

# Web dev server
npm run dev

# Electron dev (starts Vite + Electron together)
npm run desktop:dev
```

## Build

```bash
# Web assets only
npm run build

# Windows portable EXE
npm run desktop:build
# Output: release/FitnessTimerTracker-1.0.0.exe
```

## Data Storage

App state is persisted in `localStorage` under the key `fitness-tracker-react-v1`.

Use the **Data** page to export a JSON backup or restore from one. The export includes only custom routines and exercises (built-ins are re-merged automatically on import, so they are excluded to avoid duplication).
