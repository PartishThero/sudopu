# DESIGN.md — Sudoku Master Technical Design

## 1. Puzzle Generation Algorithm

### Overview
The puzzle generator uses a two-phase approach:

**Phase 1: Generate a valid solved board**
```
generateSolvedBoard(rng):
  board = [0 × 81]
  fill(pos = 0):
    if pos == 81: return true  // done
    candidates = shuffle([1..9], rng)
    for digit in candidates:
      if isPlaceable(board, pos, digit):
        board[pos] = digit
        if fill(pos + 1): return true
        board[pos] = 0  // backtrack
    return false
  fill(0)
  return board
```

- Uses a Mulberry32 seeded PRNG (`SeededRandom`) for deterministic output from a seed.
- `isPlaceable()` checks row, column, and box constraints in O(27) time.
- This always produces a valid complete board.

**Phase 2: Remove cells while maintaining uniqueness**
```
createPuzzle(solution, targetClues, rng):
  puzzle = solution.copy()
  indices = shuffle([0..80], rng)
  for idx in indices:
    if clues_remaining <= targetClues: break
    backup = puzzle[idx]
    puzzle[idx] = 0
    if countSolutions(puzzle, limit=2) != 1:
      puzzle[idx] = backup  // restore — removing broke uniqueness
    else:
      clues_remaining--
  return puzzle
```

- `countSolutions(board, limit)` uses backtracking with MRV (Minimum Remaining Values) heuristic — it stops as soon as `limit` solutions are found, making the uniqueness check efficient.
- Cells are tried in random order to ensure varied puzzle shapes.

**Uniqueness guarantee**: Every generated puzzle is checked to have exactly `countSolutions == 1` before being accepted.

---

## 2. Difficulty Scoring Methodology

Difficulty is classified by simulating a human solver applying techniques in order of complexity. The hardest technique that was *required* determines the difficulty label.

### Technique Hierarchy

| Technique | Score | Difficulty |
|---|---|---|
| Naked Single | 1 | Easy |
| Hidden Single | 2 | Easy |
| Pointing Pair | 3 | Medium |
| Box/Line Reduction | 4 | Medium |
| Naked Pair | 5 | Hard |
| Naked Triple | 6 | Hard |
| X-Wing | 7 | Hard |
| Swordfish | 8 | Expert |
| Coloring | 9 | Expert |
| Backtracking (fallback) | 10 | Expert |

### Classification Algorithm
```
classifyDifficulty(puzzle):
  board = puzzle.copy()
  candidates = buildCandidates(board)
  techniquesUsed = []
  
  loop:
    if nakedSingle found: place it, record technique, continue
    if hiddenSingle found: place it, record technique, continue
    if pointingPairs eliminate candidates: record technique, continue
    if boxLineReduction eliminates: record technique, continue
    if nakedPairs eliminate: record technique, continue
    if nakedTriples eliminate: record technique, continue
    if xWing eliminates: record technique, continue
    if board still unsolved: mark 'backtracking', break
    else: break
  
  hardestTech = max(techniquesUsed by score)
  return mapScoreToDifficulty(hardestTech.score)
```

### Difficulty Mapping
- Score ≤ 2 (only singles) → **Easy**
- Score ≤ 4 (needs pointing/box-line) → **Medium**
- Score ≤ 7 (needs pairs/X-Wing) → **Hard**
- Score > 7 (needs advanced techniques) → **Expert**

### Generator Feedback Loop
The generator attempts up to 20 retries to match the target difficulty. On each attempt:
1. Generates a new solved board (different RNG state)
2. Creates a puzzle with random clue count in the target range
3. Classifies it — if it matches target difficulty, accepts it
4. If last retry, accepts whatever was generated

This prevents infinite loops while maximizing difficulty accuracy.

---

## 3. Theming System

### CSS Custom Properties Architecture

All visual properties are defined as CSS custom properties on the `[data-theme]` attribute selector:

```css
[data-theme='dark'] {
  --cell-bg: #161b22;
  --cell-bg-selected: #1a2c4a;
  --accent: #58a6ff;
  /* ... 40+ more properties */
}
```

The theme is applied at runtime by setting:
```js
document.documentElement.setAttribute('data-theme', theme)
```

**Zero reload required** — CSS variables cascade instantly. No JavaScript bundle changes.

### Property Groups

| Group | Properties |
|---|---|
| Backgrounds | `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-card` |
| Borders | `--border-primary`, `--border-secondary` |
| Text | `--text-primary`, `--text-secondary`, `--text-muted` |
| Accent | `--accent`, `--accent-hover`, `--accent-glow` |
| Cell states | `--cell-bg-{hover,selected,peer,same,given,conflict,hint}` |
| Cell text | `--cell-text-{given,player,conflict,notes,hint}` |
| Buttons | `--btn-{primary,secondary,danger}-{bg,text,hover}` |
| Difficulty | `--diff-{easy,medium,hard,expert}` |
| Confetti | `--confetti-1` through `--confetti-4` |

### Font System
A separate `[data-font]` attribute controls number style:
```css
[data-font='classic']     { --cell-font: 'Playfair Display', serif; }
[data-font='modern']      { --cell-font: 'Inter', sans-serif; }
[data-font='handwritten'] { --cell-font: 'Caveat', cursive; }
```

---

## 4. State Management

**Zustand** was chosen over Redux for:
- Zero boilerplate (no action creators, reducers, or slices)
- Native TypeScript inference
- Built-in `persist` middleware for localStorage
- Simpler devtools integration
- Smaller bundle size

### Stores

| Store | Persistence | Description |
|---|---|---|
| `gameStore` | localStorage | Board, moves, undo/redo, timer, save state |
| `settingsStore` | localStorage | All user preferences |
| `statsStore` | IndexedDB | Game records, achievements (larger data) |

---

## 5. Undo/Redo System

Implemented as a linear history stack with a pointer:
```
history: MoveRecord[]
historyIndex: number   // -1 = no history

undo: historyIndex--
redo: historyIndex++
enterValue: trim history to historyIndex+1, push new record
```

Each `MoveRecord` stores:
- `cellIndex`: which cell changed
- `prevValue` / `nextValue`: board value before/after
- `prevNotes` / `nextNotes`: note bitmask before/after

This gives full bidirectional undo/redo with O(1) memory per move.
