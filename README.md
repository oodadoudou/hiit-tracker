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
