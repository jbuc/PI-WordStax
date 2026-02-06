# WordStax (PI-WordStax)

A block-stacking word puzzle game: Tetris-style shape placement + word search.

## Architecture

- **Built file**: `index.html` (~4500 lines) — HTML + CSS + vanilla JS with embedded dictionary
- **Build system**: `_build2.js` assembles `index.html` from `_template.html` + `_dict_block.js`
- **Zero runtime dependencies** — no npm, no frameworks
- **Mobile + desktop** — touch and mouse events, responsive layout (max 420px)

### Build Files
- `_template.html` — Complete game code with `/* DICT_PLACEHOLDER */` marker
- `_dict_block.js` — SOWPODS 3-6 letter dictionary as JS string literals (41,381 words, ~383KB)
- `_build2.js` — Node script: reads template, injects dictionary, writes `index.html`
- `sowpods_3to6.txt` — Raw filtered word list source

### Building
```bash
node _build2.js
# Output: index.html (~429KB, ~4500 lines)
```

## Game Flow

### Phase 1: Block Placement (3-Shape Selection Model)
- Player is presented with **3 shapes** at once in a dock below the grid
- Shapes shown as small colored block previews (no letters visible)
- Player **taps a shape** to select it (green highlight), then **taps a grid cell** to place it
- Auto-rotation: system tries all 4 rotations via "SUPER SNAP" algorithm
- Pre-populates 2 starter shapes (size 3-4) on the grid
- Shape distribution: 10% size-2, 25% size-3, 40% size-4, 25% size-5
- When all 3 shapes are placed, a **new set of 3** is generated
- Phase ends when **any remaining unplaced shape can't fit** OR player clicks "I'm Done"

### Phase 2: Word Finding
- **Target words**: found via straight-line H/V scan (always traceable)
- **Bonus words**: any valid word the player traces via snake path (DFS-validated)
- Targets capped at 5-8 words, shown as hints (first letter + underscores)
- Player drags across adjacent letters (orthogonal only) to form words
- Level complete when all targets found OR player clicks "Give Up"

## Key Systems

### Word Detection (dual system)
- `findStraightLineWords()` — scans horizontal/vertical lines + reversed for targets
- `findAllWordsOnGrid()` — Boggle-style DFS for bonus word validation and "give up" display
- Dictionary: SOWPODS 3-6 letters (41,381 words) in `VALID_WORDS` Set

### Shape System (3-Shape Selection)
- 27 shapes across sizes 2-5 in `SHAPES` object
- Each shape: array of `[row, col]` offsets from origin
- `SHAPES_BY_SIZE` groups them for weighted random selection
- Rotation: `(r,c) -> (c,-r)` normalized to origin
- `shapeSet[]` — array of 3 shapes with `placed` boolean and `letters[]`
- `selectedShapeIndex` — which slot is currently selected (-1 = none)
- `generateShapeSet()` — creates 3 new shapes, checks all can fit
- `generateOneShape()` — weighted random with size fallback cascade
- `selectShape(index)` — tap to select/deselect a shape slot
- `shapeCanFitAnywhere(cells)` — tries all 4 rotations at all grid positions
- `placeSelectedShape(row, col)` — places selected shape with SUPER SNAP

### State
- `state` object holds grid, phase, shapes, words, scores, shapeSet
- Persisted to `localStorage` as `wordblocks_state`
- Grid: 2D array `[row][col]` of letters or null

## Configuration
```javascript
CONFIG = {
    canvasWidth: 10, canvasHeight: 8,   // 80 cells
    minShapeSize: 2, maxShapeSize: 5,
    vowelRatio: 0.38,
    commonLetterBias: 0.7,
    targetWordCount: 6,
    minWordLength: 3,
    prePopulateCount: 2
}
```

## Scoring
- Base: `word.length * 10`
- Length bonus: `(length - 4) * 15` for 5+ letter words
- Target bonus: +50 for target words
- Level complete bonuses: fill %, all-targets, level multiplier

## Known Limitations / Future Work
- Game never ends (infinite levels, no game-over trigger)
- No difficulty presets (Easy/Medium/Hard)
- No timed mode
- Dictionary limited to 3-6 letter words (SOWPODS 3-8 would be ~1MB)
- No combo multiplier or speed bonus (scoring is length-based only)
- No celebration animation on level complete (just summary screen)
- No drag preview (shape jumps to grid on tap, no follow-cursor)

## Development Notes
- All event listeners properly cleaned up between phases via `wordFindingSetup` flag
- Shape previews are 12x12px colored blocks rendered in CSS grid (no letters)
- Selected shape slot gets green border highlight
- Placed shape slots are dimmed (opacity 0.3)
- `generateTargetWords()` (random pre-pick) was removed; targets now derived from actual grid
- Shape definitions are clean: sizes 2-5 only, no broken/duplicate shapes
- Build approach avoids template literal backtick conflicts with embedded JS
