# Sudoku Master

> Industrial-grade, fully playable Sudoku web application built with React 18 + TypeScript + Vite.

## Quick Start

```bash
npm install
npm run dev      # Development server at http://localhost:5173
npm run test     # Run test suite
npm run build    # Production build
```

## Architecture

```
src/
├── engine/              # Pure TS — zero UI dependencies
│   ├── types.ts         # Shared type definitions
│   ├── solver.ts        # Constraint propagation + backtracking solver
│   ├── generator.ts     # Randomized puzzle generator
│   ├── difficulty.ts    # Technique-based difficulty classifier + hints
│   ├── daily.ts         # Seeded daily challenge generation
│   ├── index.ts         # Public API barrel
│   └── __tests__/       # Unit tests (Vitest)
│
├── store/
│   ├── gameStore.ts     # Zustand: board, moves, undo/redo, timer
│   ├── settingsStore.ts # Zustand: all user preferences
│   └── statsStore.ts    # Zustand + IndexedDB: game history, achievements
│
├── components/
│   ├── Board/           # Board grid + Cell component
│   ├── NumberPad/       # Mobile number input
│   ├── Controls/        # Undo, Hint, Pencil mode, Pause
│   ├── Header/          # Logo, timer, icon buttons
│   ├── Game/            # GameScreen orchestrator
│   ├── Menu/            # Home screen
│   └── Modals/          # Settings, Stats, Win, Onboarding
│
├── hooks/
│   ├── useKeyboard.ts   # Arrow keys, number entry, Ctrl+Z/Y
│   └── useTimer.ts      # 1-second tick, time formatter
│
├── themes/
│   ├── dark.css         # Default dark theme
│   ├── light.css        # Light theme
│   ├── paper.css        # Classic paper/sepia theme
│   ├── neon.css         # Cyberpunk/neon theme
│   └── seasonal.css     # Winter/Aurora theme
│
└── utils/
    ├── sounds.ts        # Web Audio API procedural sound engine
    ├── seeding.ts       # Mulberry32 seeded PRNG
    └── indexedDB.ts     # IndexedDB key-value utilities
```

### Architecture Diagram

```
┌─────────────────────────────────────────────┐
│                  React UI                    │
│  App.tsx → Menu / GameScreen / Modals        │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │  Board   │ │NumberPad │ │  Controls   │  │
│  │  Cell    │ │          │ │ Undo/Hint   │  │
│  └──────────┘ └──────────┘ └─────────────┘  │
└──────────────────┬──────────────────────────┘
                   │ reads/writes
┌──────────────────▼──────────────────────────┐
│              Zustand Stores                  │
│  gameStore ─── settingsStore ─── statsStore  │
│                                      │       │
│                               IndexedDB      │
└──────────────────┬──────────────────────────┘
                   │ calls pure functions
┌──────────────────▼──────────────────────────┐
│              Engine (zero UI deps)           │
│  generator ─── solver ─── difficulty        │
│                                 │            │
│  daily (seeded puzzles)    hints/classify    │
└─────────────────────────────────────────────┘
```

## Features

| Feature | Status |
|---|---|
| 9×9 puzzle generation (backtracking) | ✅ |
| Unique solution guarantee | ✅ |
| 4 difficulty levels (technique-based) | ✅ |
| Daily challenge (seeded by UTC date) | ✅ |
| Cell selection + keyboard navigation | ✅ |
| Pencil notes mode | ✅ |
| Undo / Redo (full history) | ✅ |
| Conflict detection | ✅ |
| Hint system (technique-based) | ✅ |
| Timer + pause/resume | ✅ |
| Win detection + confetti | ✅ |
| Auto-save (localStorage) | ✅ |
| 5 visual themes | ✅ |
| Sound effects (Web Audio API) | ✅ |
| Statistics dashboard | ✅ |
| Achievements system (10 badges) | ✅ |
| Mobile responsive + touch pad | ✅ |
| Accessibility (ARIA labels) | ✅ |
| Colorblind mode | ✅ |
| TypeScript strict mode | ✅ |
| Unit tests (Vitest) | ✅ |

## How to Add a New Theme

1. Create `src/themes/mytheme.css`
2. Define all CSS custom properties under `[data-theme='mytheme'] { ... }` (copy `dark.css` as a template)
3. Add the theme ID to `Theme` type in `src/store/settingsStore.ts`
4. Add a swatch entry to `THEME_SWATCHES` in `src/components/Modals/SettingsModal.tsx`

## How to Add a New Solving Technique

1. Add the technique name to the `Technique` union type in `src/engine/types.ts`
2. Add its score to `TECHNIQUE_SCORES` in `src/engine/difficulty.ts`
3. Implement a `findXxx()` or `applyXxx()` function following the existing pattern
4. Call it in the main loop inside `classifyDifficulty()` at the appropriate priority level
5. Add unit tests in `src/engine/__tests__/difficulty.test.ts`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Watch mode tests |
| `npm run test:coverage` | Test coverage report |
| `npm run format` | Format source with Prettier |
