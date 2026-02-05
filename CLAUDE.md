# Word Blocks - Game Design Specification

## Overview
A block-stacking word puzzle game combining Tetris-style shape placement with word search mechanics.

## Game Phases

### Phase 1: Block Placement
- Tetris-style shapes (2-5 blocks each) appear one at a time at bottom
- Each block in a shape contains a letter (always readable, any orientation)
- Player drags shape up onto canvas
- **All valid positions highlight** (in any orientation that fits) when dragging
- Highlights should preview where letters will land
- Once placed, shapes are locked and cannot be moved
- **No rotation controls** - all valid orientations shown automatically
- **No skipping shapes** - must place each one
- **No shape preview** - only see current shape (future: maybe offer choice of 3)
- Phase ends **automatically** when no shapes can fit
- Shapes must always have at least 1 valid position when generated

### Phase 2: Word Finding
- Backend calculates all possible words (horizontal + vertical only)
- Player **drags to highlight letters** to form words (like circling on paper)
- Word being formed shows at bottom of canvas as they drag
- **No hints**
- Points for: word length, speed, rarity
- Target words: 5-8 curated words guaranteed to exist
- Level complete when: all target words found OR click "I'm Done"

## Configuration (Backend Tweakable)
```javascript
const CONFIG = {
    // Canvas
    canvasWidth: 10,
    canvasHeight: 8,        // ~80 cells, roughly 2x original

    // Shapes
    minShapeSize: 2,
    maxShapeSize: 4,        // increases with level

    // Letters
    vowelRatio: 0.35,       // decreases with level
    commonLetterBias: 0.7,  // decreases with level

    // Gameplay
    targetWordCount: 5,     // words needed to "win"
    minWordsPerCanvas: 3,   // guaranteed minimum
}
```

## Shape Library
| Size | Shapes |
|------|--------|
| 2 | Domino (horizontal, vertical) |
| 3 | L, Line, Corner |
| 4 | T, L, S, Z, Square, Line |
| 5 | Plus/Cross, U, W |

## Scoring
- Word length bonus
- Speed bonus (quick finds)
- Rarity bonus (uncommon letters like Q, X, Z)
- Combo multiplier for successive finds
- Full canvas bonus (used all space)

## Gamification
- Satisfying "snap" animation when placing blocks
- Screen pulse + floating score on word find
- Combo multiplier display
- Celebration animation on level complete

## Level Completion - Wordle-Style Summary
Shareable emoji summary showing achievements:
- 🟩 Found all target words
- ⭐ Found the longest word
- 🧱 Filled entire canvas
- 🔥 Found X bonus words
- Example: "Word Blocks Level 5: 🟩⭐🧱 Score: 1,250"

## State Persistence
- Save game state to localStorage
- Player can leave and return without losing progress
- Fresh canvas each level

## Future Considerations
- Timed mode (optional)
- Choice of 3 shapes instead of 1
- Restrict highlighted positions based on drag direction
- Difficulty presets (Easy/Medium/Hard)

## Tech Stack
- Single HTML file with embedded CSS/JS
- No external dependencies
- Mobile and desktop support (touch + mouse)
- Same visual style as current game (dark theme, gradients)
