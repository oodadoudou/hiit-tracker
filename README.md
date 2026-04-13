# hiit-tracker

Desktop HIIT timer and calorie log app built with `React + Vite + Electron`.

## Features

- Workout timer with `Play / Pause / Skip / Stop`
- Custom routine management with JSON-based exercise definitions
- Visual exercise guide with image + form tips
- Daily calorie log with:
  - intake
  - exercise burn
  - estimated metabolic burn
  - auto-generated deficit status
  - editable note
- Workout history logging after each session
- Full JSON backup and restore for:
  - daily diet logs
  - workout history
  - routines
  - body settings

## UI Preview

### Workout — Live Session

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [● Workout]  [ Dashboard]  [ History]  [ Settings]                      │
├──────────────────────────────────────────────────────────────────────────┤
│  G DIRECTION                                                   Apr 12    │
│  Focused Training                                                         │
├─────────────────────────────────────┬────────────────────────────────────┤
│  TRAINING · Live Session            │  GUIDE · Visual Guide              │
│  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │                                    │
│  Routine ▾  HIIT Full Body          │  ┌──────────────────────────────┐  │
│                                     │  │                              │  │
│  ╔═══════════════════════════════╗  │  │      [ exercise image ]      │  │
│  ║  ◆ WORK            [routine] ║  │  │                              │  │
│  ║  Jump Squat                  ║  │  └──────────────────────────────┘  │
│  ║  Next: Push-up               ║  │  Tips:                             │
│  ║                              ║  │  · Keep core tight                 │
│  ║           00:20              ║  │  · Full range of motion            │
│  ║                              ║  │  · Land softly                     │
│  ║  ┌───────────┐ ┌───────────┐ ║  ├────────────────────────────────────┤
│  ║  │  CIRCUIT  │ │TOTAL TIME │ ║  │  ROUTINE · HIIT Full Body          │
│  ║  │    01     │ │  1m 20s   │ ║  │  Mode          routine             │
│  ║  └───────────┘ └───────────┘ ║  │  Work / Rest   40s / 15s          │
│  ╚═══════════════════════════════╝  │  Exercises     8                   │
│                                     │                                    │
│  [▶ Play] [⏸ Pause] [⏭ Skip] [■ Stop] │                                 │
└─────────────────────────────────────┴────────────────────────────────────┘
```

### Dashboard — Daily Log & Calorie Tracking

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [ Workout]  [● Dashboard]  [ History]  [ Settings]                      │
├──────────────────────────────────────────────────────────────────────────┤
│  G DIRECTION                                                   Apr 12    │
│  Focused Training                                                         │
├─────────────────────────────────────┬────────────────────────────────────┤
│  CALORIES · Daily Log               │  HYDRATION · Water                 │
│  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │  ┌──────────────────────────────┐  │
│  ┌─────────────────────────────┐   │  │  💧 1750 ml / 2000 ml        │  │
│  │  PROFILE      Est. Burn     │   │  │  ████████████████░░░░░  88%  │  │
│  │  Metabolism   1 680 kcal    │   │  │  [+ 250 ml]        [Reset]   │  │
│  │  Sex  Female  Age  28       │   │  └──────────────────────────────┘  │
│  │  Height 163   Weight 57.5   │   │                                    │
│  └─────────────────────────────┘   │  ┌──────────────────────────────┐  │
│                                     │  │  🔥 3-Day Streak             │  │
│  Date        2026-04-12             │  │  Workout + calorie deficit   │  │
│  Intake      1 800 kcal            │  │  achieved 3 days in a row.   │  │
│  Exercise    350 kcal              │  └──────────────────────────────┘  │
│  Goal        1 500 kcal            │                                    │
│  Note        Light day                                                   │
│                                     │                                    │
│  [Add Record]  [Delete Record]      │                                    │
│                                     │                                    │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │  Daily Deficit  2026-04-12                  -230 kcal ✓ │            │
│  │  Intake - Estimated Metabolism - Exercise Burn           │            │
│  │  ████████████████████████░░░░░░░░░░░░  (goal progress)  │            │
│  │  Intake  1 800    Metabolism  1 680    Exercise  350     │            │
│  └─────────────────────────────────────────────────────────┘            │
│                                                                          │
│  DATE        INTAKE  EXERCISE  TOTAL BURN  DEFICIT  STATUS  NOTE        │
│  2026-04-12  1800    350       2030        -230     ✓ ok    Light day   │
│  2026-04-11  2100    420       2100        -420     ✓ ok    —           │
└─────────────────────────────────────┴────────────────────────────────────┘
```

### Workout Log History

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [ Workout]  [ Dashboard]  [● History]  [ Settings]                      │
├──────────────────────────────────────────────────────────────────────────┤
│  HISTORY · Workout Log                             [Clear History]        │
│  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │
│  DATE        ROUTINE          DURATION  CALORIES  RPE  JOINTS            │
│  2026-04-12  HIIT Full Body   24m 10s   210 kcal  7    8                 │
│  2026-04-11  Core & Glutes    18m 05s   155 kcal  6    9                 │
│  2026-04-09  HIIT Full Body   22m 30s   195 kcal  8    7                 │
└──────────────────────────────────────────────────────────────────────────┘
```

### Post-Workout Log Modal

```
                ┌───────────────────────────────┐
                │  Log Workout                ✕  │
                │  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │
                │  Routine   HIIT Full Body       │
                │  Duration  24m 10s              │
                │  Calories  210 kcal             │
                │                                 │
                │  心肺疲劳度 (RPE): 7             │
                │  ───────────●───────────        │
                │                                 │
                │  膝盖/关节舒适度: 8              │
                │  ────────────────●──────        │
                │                                 │
                │  [    Save    ]  [  Discard  ]   │
                └───────────────────────────────┘
```

## Development

Install dependencies:

```bash
npm install
```

Run web dev server:

```bash
npm run dev
```

Run Electron in development:

```bash
npm run desktop:dev
```

This command now starts the Vite dev server and Electron together.

## Build

Build web assets:

```bash
npm run build
```

Build Windows portable EXE:

```bash
npm run desktop:build
```

Output file:

`release/FitnessTimerTracker-1.0.0.exe`

## Data Storage

App data is stored in local `localStorage` under:

```text
fitness-tracker-react-v1
```

Use `Settings -> Backup / Restore` to export or import the full app state as JSON.
