#!/usr/bin/env node
// Build script: assembles index.html with SOWPODS dictionary embedded
const fs = require('fs');

const dictBlock = fs.readFileSync('_dict_block.js', 'utf-8');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>WordStax</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            min-height: 100vh;
            overflow: hidden;
            color: #fff;
        }

        #game-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100vh;
            height: 100dvh;
            padding: 8px;
            max-width: 500px;
            margin: 0 auto;
        }

        /* Header */
        #header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            margin-bottom: 6px;
        }

        .stat { text-align: center; }
        .stat-label {
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .stat-value {
            font-size: 22px;
            font-weight: bold;
            color: #4ecca3;
        }

        /* Phase indicator */
        #phase-indicator {
            background: rgba(102, 126, 234, 0.2);
            border: 2px solid #667eea;
            border-radius: 10px;
            padding: 6px 20px;
            margin-bottom: 6px;
            text-align: center;
            width: 100%;
        }
        #phase-indicator.placing {
            border-color: #e94560;
            background: rgba(233, 69, 96, 0.2);
        }
        #phase-indicator.finding {
            border-color: #4ecca3;
            background: rgba(78, 204, 163, 0.2);
        }
        #phase-text {
            font-size: 14px;
            font-weight: bold;
            color: #fff;
        }
        #phase-hint {
            font-size: 11px;
            color: #aaa;
            margin-top: 2px;
        }

        /* Canvas area */
        #canvas-wrapper {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            min-height: 0;
            padding: 6px;
        }

        #canvas-area {
            position: relative;
            aspect-ratio: 10 / 8;
            width: 100%;
            max-height: 100%;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 12px;
            border: 3px solid rgba(78, 204, 163, 0.4);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
        }

        #grid-container {
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            grid-template-rows: repeat(8, 1fr);
            gap: 3px;
            width: 96%;
            height: 96%;
        }

        .grid-cell {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: min(16px, 3.8vmin);
            font-weight: bold;
            color: transparent;
            transition: all 0.15s ease;
            aspect-ratio: 1;
            position: relative;
        }

        .grid-cell.filled {
            background: linear-gradient(145deg, #3a4a6b, #2a3a5b);
            color: #fff;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .grid-cell.highlight-preview {
            background: linear-gradient(145deg, #4ecca3, #3db892);
            color: #fff;
            box-shadow: 0 0 12px rgba(78, 204, 163, 0.5);
        }

        .grid-cell.selected {
            background: linear-gradient(145deg, #667eea, #5a6fd6) !important;
            color: #fff !important;
            transform: scale(1.05);
            z-index: 10;
        }

        .grid-cell.word-found {
            animation: wordPop 0.4s ease-out;
            background: linear-gradient(145deg, #FFD700, #FFA500) !important;
            color: #000 !important;
            transform: scale(1.1);
            z-index: 20;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
        }

        .grid-cell.missed-word {
            border: 2px dashed #FF6B6B;
        }

        @keyframes wordPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }

        /* Shape dock — 3 shape previews */
        #shape-dock {
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border-top: 2px solid rgba(255, 255, 255, 0.1);
            padding: 10px 8px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            min-height: 90px;
            gap: 8px;
        }

        .shape-slot {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 8px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
            min-height: 70px;
            background: rgba(255, 255, 255, 0.03);
            border: 2px solid transparent;
        }

        .shape-slot:hover { background: rgba(255, 255, 255, 0.08); }

        .shape-slot.selected-slot {
            border-color: #4ecca3;
            background: rgba(78, 204, 163, 0.15);
            box-shadow: 0 0 15px rgba(78, 204, 163, 0.3);
        }

        .shape-slot.placed {
            opacity: 0.2;
            cursor: default;
            pointer-events: none;
        }

        .shape-preview {
            display: grid;
            gap: 2px;
        }

        .preview-cell {
            width: 12px;
            height: 12px;
            background: linear-gradient(145deg, #e94560, #c73e54);
            border-radius: 2px;
        }

        .shape-slot.placed .preview-cell {
            background: rgba(255, 255, 255, 0.2);
        }

        /* Targets panel (Phase 2) */
        #targets-panel {
            width: 100%;
            padding: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            display: none;
        }

        #targets-list {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            max-height: 15vh;
            overflow-y: auto;
        }

        .target-word {
            padding: 5px 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .target-word.found {
            background: linear-gradient(145deg, #4ecca3, #3db892);
            color: #1a1a2e;
        }

        .target-word.bonus {
            background: linear-gradient(145deg, #667eea, #5a6fd6);
            color: #fff;
        }

        /* Word display during drag */
        #word-display {
            position: absolute;
            bottom: 8px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 6px 18px;
            border-radius: 20px;
            font-size: 22px;
            font-weight: bold;
            letter-spacing: 2px;
            color: #fff;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
            z-index: 50;
        }
        #word-display.visible { opacity: 1; }
        #word-display.valid {
            color: #4ecca3;
            box-shadow: 0 0 15px rgba(78, 204, 163, 0.5);
        }

        /* Buttons */
        #action-buttons {
            display: flex;
            gap: 8px;
            margin-top: 6px;
            width: 100%;
        }

        button {
            flex: 1;
            padding: 10px 16px;
            font-size: 13px;
            font-weight: bold;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        #done-btn {
            background: linear-gradient(145deg, #4ecca3, #3db892);
            color: #1a1a2e;
        }

        #give-up-btn {
            background: linear-gradient(180deg, #ff6b6b, #ee5253);
            border-bottom: 3px solid #c0392b;
            color: #fff;
            display: none;
        }

        /* Dragging shape overlay */
        #drag-shape {
            position: fixed;
            pointer-events: none;
            z-index: 1000;
            display: none;
        }

        #drag-shape.active {
            display: grid;
        }

        #drag-shape .drag-cell {
            background: linear-gradient(145deg, #e94560, #c73e54);
            border-radius: 3px;
            box-shadow: 0 4px 15px rgba(233, 69, 96, 0.5);
        }

        /* Screens */
        .screen {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            z-index: 2000;
            transition: opacity 0.3s, visibility 0.3s;
            padding: 20px;
        }

        .screen.hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }

        .screen h1 {
            font-size: 42px;
            margin-bottom: 10px;
            background: linear-gradient(145deg, #4ecca3, #667eea);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .screen h2 {
            font-size: 28px;
            color: #4ecca3;
            margin-bottom: 20px;
        }

        .screen p {
            font-size: 16px;
            color: #aaa;
            text-align: center;
            max-width: 320px;
            margin-bottom: 15px;
            line-height: 1.5;
        }

        .screen button {
            padding: 15px 50px;
            font-size: 18px;
            background: linear-gradient(145deg, #e94560, #c73e54);
            color: #fff;
            margin-top: 20px;
        }

        /* Summary */
        #summary-box {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            min-width: 280px;
        }

        #summary-emojis {
            font-size: 36px;
            margin-bottom: 15px;
            letter-spacing: 8px;
        }

        #summary-stats { display: flex; flex-direction: column; gap: 8px; }

        .summary-stat { display: flex; justify-content: space-between; font-size: 14px; }
        .summary-stat-label { color: #888; }
        .summary-stat-value { color: #4ecca3; font-weight: bold; }

        #share-text {
            background: rgba(0, 0, 0, 0.3);
            padding: 12px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            margin-top: 15px;
            cursor: pointer;
        }

        .instructions {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            max-width: 320px;
            margin: 15px 0;
        }
        .instructions h3 { color: #4ecca3; margin-bottom: 15px; font-size: 16px; }
        .instructions ul { list-style: none; }
        .instructions li {
            margin: 10px 0;
            padding-left: 25px;
            position: relative;
            color: #ccc;
            font-size: 13px;
            line-height: 1.4;
        }
        .instructions li::before {
            content: "\\2192";
            position: absolute;
            left: 0;
            color: #e94560;
        }

        /* Floating score */
        .floating-score {
            position: fixed;
            pointer-events: none;
            font-size: 24px;
            font-weight: bold;
            color: #4ecca3;
            text-shadow: 0 2px 10px rgba(78, 204, 163, 0.8);
            animation: floatUp 1s ease-out forwards;
            z-index: 1500;
        }

        @keyframes floatUp {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-50px) scale(1.2); }
        }

        @keyframes snapIn {
            0% { transform: scale(1.1); }
            50% { transform: scale(0.95); }
            100% { transform: scale(1); }
        }
        .snap-in { animation: snapIn 0.2s ease-out; }

        #words-formed-display {
            width: 100%;
            margin-top: 4px;
            padding: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            text-align: center;
            font-size: 14px;
            color: #4ecca3;
            font-weight: bold;
        }

        /* Responsive */
        @media (max-height: 650px) {
            #shape-dock { min-height: 70px; padding: 6px; }
            .preview-cell { width: 10px; height: 10px; }
            .shape-slot { min-height: 55px; padding: 5px; }
        }
    </style>
</head>

<body>
    <!-- Start Screen -->
    <div id="start-screen" class="screen">
        <h1>WordStax</h1>
        <p>Stack letter shapes, then find hidden words!</p>
        <div class="instructions">
            <h3>How to Play</h3>
            <ul>
                <li><strong>Phase 1:</strong> Pick from 3 shapes and place them on the grid</li>
                <li>Tap a shape to select, then drag it onto the canvas</li>
                <li>Place all 3 shapes to get a new set</li>
                <li>Phase ends when a shape can't fit</li>
                <li><strong>Phase 2:</strong> Drag across letters to form words</li>
                <li>Find all target words to complete the level</li>
            </ul>
        </div>
        <button id="start-btn">Start Game</button>
    </div>

    <!-- Level Complete Screen -->
    <div id="level-complete-screen" class="screen hidden">
        <h2>Level Complete!</h2>
        <div id="summary-box">
            <div id="summary-emojis"></div>
            <div id="summary-stats">
                <div class="summary-stat">
                    <span class="summary-stat-label">Words Found</span>
                    <span class="summary-stat-value" id="stat-words">0/0</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-stat-label">Bonus Words</span>
                    <span class="summary-stat-value" id="stat-bonus">0</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-stat-label">Canvas Fill</span>
                    <span class="summary-stat-value" id="stat-fill">0%</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-stat-label">Level Score</span>
                    <span class="summary-stat-value" id="stat-score">0</span>
                </div>
            </div>
            <div id="share-text">Tap to copy</div>
        </div>
        <button id="next-level-btn">Next Level</button>
    </div>

    <!-- Main Game -->
    <div id="game-container">
        <div id="header">
            <div class="stat">
                <div class="stat-label">Level</div>
                <div class="stat-value" id="level-display">1</div>
            </div>
            <div class="stat">
                <div class="stat-label">Score</div>
                <div class="stat-value" id="score-display">0</div>
            </div>
            <div class="stat">
                <div class="stat-label">Shapes</div>
                <div class="stat-value" id="shapes-display">0</div>
            </div>
        </div>

        <div id="phase-indicator" class="placing">
            <div id="phase-text">Phase 1: Place Shapes</div>
            <div id="phase-hint">Tap a shape below, then drag it onto the grid</div>
        </div>

        <div id="canvas-wrapper">
            <div id="canvas-area">
                <div id="grid-container"></div>
                <div id="word-display"></div>
            </div>
        </div>

        <div id="shape-dock">
            <div class="shape-slot" id="slot-0"></div>
            <div class="shape-slot" id="slot-1"></div>
            <div class="shape-slot" id="slot-2"></div>
        </div>

        <div id="targets-panel">
            <div id="targets-list"></div>
        </div>

        <div id="words-formed-display">Words Formed: 0</div>

        <div id="action-buttons">
            <button id="done-btn" disabled>I'm Done</button>
            <button id="give-up-btn">Give Up</button>
        </div>
    </div>

    <!-- Dragging shape overlay -->
    <div id="drag-shape"></div>

    <script>
        // ============================================
        // WORDSTAX — 3-Shape Selection Model
        // ============================================

        const CONFIG = {
            canvasWidth: 10,
            canvasHeight: 8,
            minShapeSize: 2,
            maxShapeSize: 5,
            vowelRatio: 0.38,
            commonLetterBias: 0.7,
            minWordLength: 3,
            prePopulateCount: 2,
            shapesPerSet: 3          // Show 3 shapes at a time
        };

        // Shape definitions
        const SHAPES = {
            domino_h: [[0,0],[0,1]],
            domino_v: [[0,0],[1,0]],
            line_h3: [[0,0],[0,1],[0,2]],
            line_v3: [[0,0],[1,0],[2,0]],
            corner_br: [[0,0],[1,0],[1,1]],
            corner_bl: [[0,1],[1,0],[1,1]],
            corner_tr: [[0,0],[0,1],[1,0]],
            corner_tl: [[0,0],[0,1],[1,1]],
            line_h4: [[0,0],[0,1],[0,2],[0,3]],
            line_v4: [[0,0],[1,0],[2,0],[3,0]],
            square: [[0,0],[0,1],[1,0],[1,1]],
            t_down: [[0,0],[0,1],[0,2],[1,1]],
            t_up: [[1,0],[1,1],[1,2],[0,1]],
            t_right: [[0,0],[1,0],[2,0],[1,1]],
            t_left: [[0,1],[1,0],[1,1],[2,1]],
            l_1: [[0,0],[1,0],[2,0],[2,1]],
            l_2: [[0,0],[0,1],[0,2],[1,0]],
            l_3: [[0,0],[0,1],[1,1],[2,1]],
            l_4: [[0,2],[1,0],[1,1],[1,2]],
            s_h: [[0,1],[0,2],[1,0],[1,1]],
            s_v: [[0,0],[1,0],[1,1],[2,1]],
            z_h: [[0,0],[0,1],[1,1],[1,2]],
            z_v: [[0,1],[1,0],[1,1],[2,0]],
            plus: [[0,1],[1,0],[1,1],[1,2],[2,1]],
            u_down: [[0,0],[0,2],[1,0],[1,1],[1,2]],
            u_up: [[0,0],[0,1],[0,2],[1,0],[1,2]],
            line_h5: [[0,0],[0,1],[0,2],[0,3],[0,4]],
            line_v5: [[0,0],[1,0],[2,0],[3,0],[4,0]],
            long_L: [[0,0],[1,0],[2,0],[3,0],[3,1]]
        };

        const SHAPES_BY_SIZE = {
            2: ['domino_h','domino_v'],
            3: ['line_h3','line_v3','corner_br','corner_bl','corner_tr','corner_tl'],
            4: ['line_h4','line_v4','square','t_down','t_up','t_right','t_left',
                'l_1','l_2','l_3','l_4','s_h','s_v','z_h','z_v'],
            5: ['plus','u_down','u_up','line_h5','line_v5','long_L']
        };

        const VOWELS = 'AEIOU';
        const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXYZ';

        // SOWPODS Dictionary (3-6 letter words, 41K+ words)
        const VALID_WORDS = new Set([
${dictBlock}
        ]);

        // ============================================
        // GAME STATE
        // ============================================

        let state = {
            level: 1,
            score: 0,
            phase: 'placing',
            grid: [],
            shapeSet: [],           // Array of 3 shape objects: { name, cells, letters, placed }
            selectedShapeIndex: -1,  // Which of the 3 is currently selected for dragging
            shapesPlaced: 0,
            targetWords: [],
            foundWords: [],
            bonusWords: [],
            selectedCells: [],
            isDragging: false,
            dragGridOffset: { r: 0, c: 0 },
            draggedCellIndex: -1
        };

        // DOM elements
        let gridContainer, dragShape, wordDisplay;
        let phaseIndicator, phaseText, phaseHint;
        let levelDisplay, scoreDisplay, shapesDisplay;
        let targetsList, doneBtn, giveUpBtn;
        let wordFindingSetup = false;

        // ============================================
        // INITIALIZATION
        // ============================================

        document.addEventListener('DOMContentLoaded', init);

        function init() {
            gridContainer = document.getElementById('grid-container');
            dragShape = document.getElementById('drag-shape');
            wordDisplay = document.getElementById('word-display');
            phaseIndicator = document.getElementById('phase-indicator');
            phaseText = document.getElementById('phase-text');
            phaseHint = document.getElementById('phase-hint');
            levelDisplay = document.getElementById('level-display');
            scoreDisplay = document.getElementById('score-display');
            shapesDisplay = document.getElementById('shapes-display');
            targetsList = document.getElementById('targets-list');
            doneBtn = document.getElementById('done-btn');
            giveUpBtn = document.getElementById('give-up-btn');

            document.getElementById('start-btn').addEventListener('click', startGame);
            document.getElementById('next-level-btn').addEventListener('click', nextLevel);

            doneBtn.addEventListener('click', enterFindingPhase);
            giveUpBtn.addEventListener('click', giveUp);

            // Shape slot click handlers
            for (let i = 0; i < 3; i++) {
                const slot = document.getElementById('slot-' + i);
                slot.addEventListener('click', () => selectShape(i));
                slot.addEventListener('touchstart', (e) => { e.preventDefault(); selectShape(i); }, { passive: false });
            }

            // Drag events (for placing selected shape)
            document.addEventListener('mousedown', startShapeDrag);
            document.addEventListener('touchstart', startShapeDrag, { passive: false });
            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('touchmove', onDragMove, { passive: false });
            document.addEventListener('mouseup', endShapeDrag);
            document.addEventListener('touchend', endShapeDrag);
        }

        function startGame() {
            state = {
                level: 1, score: 0, phase: 'placing',
                grid: [], shapeSet: [], selectedShapeIndex: -1,
                shapesPlaced: 0, targetWords: [], foundWords: [],
                bonusWords: [], selectedCells: [], isDragging: false,
                dragGridOffset: { r: 0, c: 0 }, draggedCellIndex: -1
            };
            document.getElementById('start-screen').classList.add('hidden');
            initLevel();
        }

        function initLevel() {
            state.phase = 'placing';
            state.grid = Array(CONFIG.canvasHeight).fill(null).map(() =>
                Array(CONFIG.canvasWidth).fill(null)
            );
            state.shapesPlaced = 0;
            state.foundWords = [];
            state.bonusWords = [];
            state.selectedCells = [];
            state.selectedShapeIndex = -1;
            wordFindingSetup = false;
            state.targetWords = [];

            updatePhaseUI();
            renderGrid();

            // Pre-populate a couple shapes
            prePopulateGrid();

            // Generate first set of 3 shapes
            generateShapeSet();

            // Reset UI
            document.getElementById('words-formed-display').style.display = 'block';
            document.getElementById('targets-panel').style.display = 'none';
            document.getElementById('shape-dock').style.display = 'flex';
            doneBtn.style.display = 'inline-block';
            doneBtn.disabled = true;
            giveUpBtn.style.display = 'none';

            updateWordsFormedCount();
            updateStats();
            saveState();
        }

        // ============================================
        // SHAPE SET GENERATION (3 shapes at a time)
        // ============================================

        function generateShapeSet() {
            state.shapeSet = [];
            state.selectedShapeIndex = -1;

            for (let i = 0; i < CONFIG.shapesPerSet; i++) {
                const shape = generateOneShape();
                state.shapeSet.push({
                    ...shape,
                    placed: false
                });
            }

            // Check if ANY shape in the set can be placed
            let anyCanFit = false;
            for (const shape of state.shapeSet) {
                if (shapeCanFitAnywhere(shape.cells)) {
                    anyCanFit = true;
                    break;
                }
            }

            if (!anyCanFit) {
                // No shapes fit — end Phase 1
                enterFindingPhase();
                return;
            }

            renderShapeSlots();
        }

        function generateOneShape() {
            // Weighted: 10% size-2, 25% size-3, 40% size-4, 25% size-5
            const rand = Math.random();
            let size = 4;
            if (rand < 0.10) size = 2;
            else if (rand < 0.35) size = 3;
            else if (rand < 0.75) size = 4;
            else size = 5;

            if (!SHAPES_BY_SIZE[size]) size = 4;

            const shapeNames = SHAPES_BY_SIZE[size];
            const shapeName = shapeNames[Math.floor(Math.random() * shapeNames.length)];
            const cells = SHAPES[shapeName];
            const letters = cells.map(() => generateLetter());

            return { name: shapeName, cells, letters };
        }

        function shapeCanFitAnywhere(cells) {
            // Try all rotations at all positions
            let currentCells = cells;
            for (let rot = 0; rot < 4; rot++) {
                if (rot > 0) currentCells = rotateCells(currentCells);
                for (let r = 0; r < CONFIG.canvasHeight; r++) {
                    for (let c = 0; c < CONFIG.canvasWidth; c++) {
                        if (canPlaceShapeCells(currentCells, r, c)) return true;
                    }
                }
            }
            return false;
        }

        function selectShape(index) {
            if (state.phase !== 'placing') return;
            if (state.shapeSet[index]?.placed) return;

            // Deselect if tapping same one
            if (state.selectedShapeIndex === index) {
                state.selectedShapeIndex = -1;
            } else {
                state.selectedShapeIndex = index;
            }
            renderShapeSlots();
        }

        // ============================================
        // SHAPE PLACEMENT
        // ============================================

        function prePopulateGrid() {
            let placed = 0;
            let attempts = 0;
            while (placed < CONFIG.prePopulateCount && attempts < 50) {
                attempts++;
                const size = 3 + Math.floor(Math.random() * 2);
                const shapeNames = SHAPES_BY_SIZE[size];
                if (!shapeNames) continue;
                const shapeName = shapeNames[Math.floor(Math.random() * shapeNames.length)];
                const cells = SHAPES[shapeName];
                const letters = cells.map(() => generateLetter());

                const r = Math.floor(Math.random() * CONFIG.canvasHeight);
                const c = Math.floor(Math.random() * CONFIG.canvasWidth);

                if (canPlaceShapeCells(cells, r, c)) {
                    cells.forEach(([dr, dc], i) => {
                        state.grid[r + dr][c + dc] = letters[i];
                    });
                    placed++;
                }
            }
            state.shapesPlaced += placed;
            if (state.shapesPlaced > 0) doneBtn.disabled = false;
            renderGrid();
        }

        function placeSelectedShape(baseRow, baseCol) {
            const idx = state.selectedShapeIndex;
            if (idx < 0 || idx >= state.shapeSet.length) return false;
            const shape = state.shapeSet[idx];
            if (shape.placed) return false;

            if (!canPlaceShapeCells(shape.cells, baseRow, baseCol)) return false;

            // Place letters on grid
            shape.cells.forEach(([dr, dc], i) => {
                state.grid[baseRow + dr][baseCol + dc] = shape.letters[i];
            });

            shape.placed = true;
            state.shapesPlaced++;
            state.selectedShapeIndex = -1;
            doneBtn.disabled = false;

            updateStats();
            renderGrid();
            renderShapeSlots();
            updateWordsFormedCount();

            // Snap animation
            document.querySelectorAll('.grid-cell.filled').forEach(cell => {
                cell.classList.add('snap-in');
                setTimeout(() => cell.classList.remove('snap-in'), 200);
            });

            // Check if all 3 shapes in this set are placed
            const allPlaced = state.shapeSet.every(s => s.placed);
            if (allPlaced) {
                // Generate new set of 3
                setTimeout(() => generateShapeSet(), 300);
            } else {
                // Check if remaining shapes can still fit
                const remainingCanFit = state.shapeSet.some(s => !s.placed && shapeCanFitAnywhere(s.cells));
                if (!remainingCanFit) {
                    // Can't fit remaining shapes — end Phase 1
                    setTimeout(() => enterFindingPhase(), 500);
                }
            }

            saveState();
            return true;
        }

        // ============================================
        // DRAG & DROP (Phase 1)
        // ============================================

        let dragOffset = { x: 0, y: 0 };

        function startShapeDrag(e) {
            if (state.phase !== 'placing') return;
            if (state.selectedShapeIndex < 0) return;

            const shape = state.shapeSet[state.selectedShapeIndex];
            if (!shape || shape.placed) return;

            // Only start drag if clicking on the grid area
            const gridRect = gridContainer.getBoundingClientRect();
            const evt = e.touches ? e.touches[0] : e;

            // Allow dragging from anywhere above the dock
            if (evt.clientY > gridRect.bottom + 50) return;

            e.preventDefault();
            state.isDragging = true;

            // Default grab offset to first cell
            state.dragGridOffset = { r: 0, c: 0 };
            state.draggedCellIndex = 0;

            renderDragShape();
            updateDragPosition(evt.clientX, evt.clientY);
            dragShape.classList.add('active');
        }

        function onDragMove(e) {
            if (!state.isDragging || state.phase !== 'placing') return;
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            updateDragPosition(touch.clientX, touch.clientY);
            updateValidPositions(touch.clientX, touch.clientY);
        }

        function endShapeDrag(e) {
            if (!state.isDragging || state.phase !== 'placing') return;
            state.isDragging = false;
            dragShape.classList.remove('active');

            const touch = e.changedTouches ? e.changedTouches[0] : e;
            const gridRect = gridContainer.getBoundingClientRect();
            const cellWidth = gridRect.width / CONFIG.canvasWidth;
            const cellHeight = gridRect.height / CONFIG.canvasHeight;

            let col = Math.floor((touch.clientX - gridRect.left) / cellWidth);
            let row = Math.floor((touch.clientY - gridRect.top) / cellHeight);

            col -= state.dragGridOffset.c;
            row -= state.dragGridOffset.r;

            placeSelectedShape(row, col);
            clearHighlights();
        }

        function updateDragPosition(x, y) {
            dragShape.style.left = (x - dragOffset.x) + 'px';
            dragShape.style.top = (y - dragOffset.y) + 'px';
        }

        function updateValidPositions(x, y) {
            const gridRect = gridContainer.getBoundingClientRect();
            const cellWidth = gridRect.width / CONFIG.canvasWidth;
            const cellHeight = gridRect.height / CONFIG.canvasHeight;

            clearHighlights();

            const col = Math.floor((x - gridRect.left) / cellWidth);
            const row = Math.floor((y - gridRect.top) / cellHeight);

            if (col < 0 || col >= CONFIG.canvasWidth || row < 0 || row >= CONFIG.canvasHeight) return;

            const idx = state.selectedShapeIndex;
            if (idx < 0) return;
            const shape = state.shapeSet[idx];
            if (!shape || shape.placed) return;

            // SUPER SNAP: try all 4 rotations
            let bestCells = null;
            let bestOffset = null;
            let currentCells = shape.cells;
            const myIndex = state.draggedCellIndex >= 0 && state.draggedCellIndex < currentCells.length ? state.draggedCellIndex : 0;

            for (let rot = 0; rot < 4; rot++) {
                if (rot > 0) currentCells = rotateCells(currentCells);

                const anchorIndices = [myIndex];
                for (let i = 0; i < currentCells.length; i++) {
                    if (i !== myIndex) anchorIndices.push(i);
                }

                for (const anchorIdx of anchorIndices) {
                    const idx2 = anchorIdx < currentCells.length ? anchorIdx : 0;
                    const offset = { r: currentCells[idx2][0], c: currentCells[idx2][1] };
                    const baseR = row - offset.r;
                    const baseC = col - offset.c;

                    if (canPlaceShapeCells(currentCells, baseR, baseC)) {
                        bestCells = currentCells;
                        bestOffset = offset;
                        break;
                    }
                }
                if (bestCells) break;
            }

            if (bestCells) {
                // Update shape cells to the rotated version
                shape.cells = bestCells;
                state.dragGridOffset = bestOffset;
                renderDragShape();

                const baseR = row - bestOffset.r;
                const baseC = col - bestOffset.c;

                bestCells.forEach(([dr, dc], i) => {
                    const cell = gridContainer.querySelector(
                        '.grid-cell[data-row="' + (baseR + dr) + '"][data-col="' + (baseC + dc) + '"]'
                    );
                    if (cell) {
                        cell.classList.add('highlight-preview');
                        cell.textContent = shape.letters[i];
                    }
                });
            }
        }

        // ============================================
        // PHASE 2: WORD FINDING
        // ============================================

        function enterFindingPhase() {
            state.phase = 'finding';
            state.selectedShapeIndex = -1;
            if (dragShape) dragShape.classList.remove('active');
            state.isDragging = false;

            updatePhaseUI();
            renderGrid();

            doneBtn.style.display = 'none';
            giveUpBtn.style.display = 'block';
            document.getElementById('words-formed-display').style.display = 'none';
            document.getElementById('shape-dock').style.display = 'none';
            document.getElementById('targets-panel').style.display = 'block';

            generateFinalTargets();
            setupWordFinding();
        }

        function setupWordFinding() {
            const cells = gridContainer.querySelectorAll('.grid-cell.filled');
            cells.forEach(cell => {
                cell.removeEventListener('mousedown', startWordDrag);
                cell.removeEventListener('touchstart', startWordDrag);
                cell.addEventListener('mousedown', startWordDrag);
                cell.addEventListener('touchstart', startWordDrag, { passive: false });
            });

            if (!wordFindingSetup) {
                document.addEventListener('mousemove', onWordDrag);
                document.addEventListener('touchmove', onWordDrag, { passive: false });
                document.addEventListener('mouseup', endWordDrag);
                document.addEventListener('touchend', endWordDrag);
                wordFindingSetup = true;
            }
        }

        function startWordDrag(e) {
            if (state.phase !== 'finding') return;
            e.preventDefault();
            const cell = e.target.closest('.grid-cell');
            if (!cell || !cell.classList.contains('filled')) return;
            state.isDragging = true;
            state.selectedCells = [{
                row: parseInt(cell.dataset.row),
                col: parseInt(cell.dataset.col)
            }];
            updateWordSelection();
        }

        function onWordDrag(e) {
            if (!state.isDragging || state.phase !== 'finding') return;
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            const cell = element?.closest('.grid-cell');
            if (!cell || !cell.classList.contains('filled')) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            // Backtrack
            if (state.selectedCells.length >= 2) {
                const prev = state.selectedCells[state.selectedCells.length - 2];
                if (prev.row === row && prev.col === col) {
                    state.selectedCells.pop();
                    updateWordSelection();
                    return;
                }
            }

            const last = state.selectedCells[state.selectedCells.length - 1];
            const isAdjacent = (Math.abs(row - last.row) + Math.abs(col - last.col) === 1);
            const alreadySelected = state.selectedCells.some(c => c.row === row && c.col === col);

            if (isAdjacent && !alreadySelected) {
                state.selectedCells.push({ row, col });
                updateWordSelection();
            }
        }

        function endWordDrag() {
            if (!state.isDragging) return;
            state.isDragging = false;

            const word = state.selectedCells.map(c => state.grid[c.row][c.col]).join('');
            if (word.length >= CONFIG.minWordLength && VALID_WORDS.has(word.toLowerCase())) {
                handleWordFound(word);
            }

            state.selectedCells = [];
            updateWordSelection();
            wordDisplay.classList.remove('visible', 'valid');
        }

        function updateWordSelection() {
            gridContainer.querySelectorAll('.grid-cell').forEach(cell => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                const isSelected = state.selectedCells.some(c => c.row === row && c.col === col);
                cell.classList.toggle('selected', isSelected);
            });

            if (state.selectedCells.length > 0) {
                const word = state.selectedCells.map(c => state.grid[c.row][c.col]).join('');
                wordDisplay.textContent = word;
                wordDisplay.classList.add('visible');
                const isValid = word.length >= CONFIG.minWordLength && VALID_WORDS.has(word.toLowerCase());
                wordDisplay.classList.toggle('valid', isValid);
            } else {
                wordDisplay.classList.remove('visible');
            }
        }

        // ============================================
        // WORD DETECTION
        // ============================================

        function findStraightLineWords() {
            const found = new Set();
            const H = CONFIG.canvasHeight, W = CONFIG.canvasWidth;

            // Horizontal
            for (let r = 0; r < H; r++) {
                for (let startC = 0; startC < W; startC++) {
                    if (state.grid[r][startC] === null) continue;
                    let word = '';
                    for (let c = startC; c < W && state.grid[r][c] !== null; c++) {
                        word += state.grid[r][c];
                        if (word.length >= CONFIG.minWordLength && VALID_WORDS.has(word.toLowerCase())) found.add(word);
                        if (word.length >= CONFIG.minWordLength) {
                            const rev = word.split('').reverse().join('');
                            if (VALID_WORDS.has(rev.toLowerCase())) found.add(rev);
                        }
                    }
                }
            }

            // Vertical
            for (let c = 0; c < W; c++) {
                for (let startR = 0; startR < H; startR++) {
                    if (state.grid[startR][c] === null) continue;
                    let word = '';
                    for (let r = startR; r < H && state.grid[r][c] !== null; r++) {
                        word += state.grid[r][c];
                        if (word.length >= CONFIG.minWordLength && VALID_WORDS.has(word.toLowerCase())) found.add(word);
                        if (word.length >= CONFIG.minWordLength) {
                            const rev = word.split('').reverse().join('');
                            if (VALID_WORDS.has(rev.toLowerCase())) found.add(rev);
                        }
                    }
                }
            }

            return Array.from(found);
        }

        function findAllWordsOnGrid() {
            const foundWords = new Set();
            const H = CONFIG.canvasHeight, W = CONFIG.canvasWidth;
            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

            function dfs(r, c, currentWord, visited) {
                const newWord = currentWord + state.grid[r][c];
                if (newWord.length >= CONFIG.minWordLength && VALID_WORDS.has(newWord.toLowerCase())) foundWords.add(newWord);
                if (newWord.length >= 6) return;
                for (const [dr, dc] of dirs) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < H && nc >= 0 && nc < W && state.grid[nr][nc] !== null && !visited.has(nr + ',' + nc)) {
                        visited.add(nr + ',' + nc);
                        dfs(nr, nc, newWord, visited);
                        visited.delete(nr + ',' + nc);
                    }
                }
            }

            for (let r = 0; r < H; r++) {
                for (let c = 0; c < W; c++) {
                    if (state.grid[r][c] !== null) {
                        const visited = new Set([r + ',' + c]);
                        dfs(r, c, '', visited);
                    }
                }
            }

            return Array.from(foundWords).map(w => ({ word: w, cells: [] }));
        }

        function generateFinalTargets() {
            const straightWords = findStraightLineWords();
            straightWords.sort((a, b) => b.length - a.length || a.localeCompare(b));
            const maxTargets = Math.min(8, Math.max(5, straightWords.length));
            state.targetWords = straightWords.slice(0, maxTargets);
            renderTargets();
            updateWordCountStat();
        }

        function updateWordsFormedCount() {
            const allWords = findAllWordsOnGrid();
            const count = new Set(allWords.map(w => w.word)).size;
            document.getElementById('words-formed-display').textContent = 'Words Formed: ' + count;
        }

        // ============================================
        // SCORING & LEVEL MANAGEMENT
        // ============================================

        function handleWordFound(word) {
            const upperWord = word.toUpperCase();
            if (state.foundWords.includes(upperWord) || state.bonusWords.includes(upperWord)) return;

            const isTarget = state.targetWords.includes(upperWord);
            if (isTarget) state.foundWords.push(upperWord);
            else state.bonusWords.push(upperWord);

            const baseScore = word.length * 10;
            const lengthBonus = word.length > 4 ? (word.length - 4) * 15 : 0;
            const targetBonus = isTarget ? 50 : 0;
            state.score += baseScore + lengthBonus + targetBonus;

            showFloatingScore(baseScore + lengthBonus + targetBonus);

            state.selectedCells.forEach(c => {
                const cell = gridContainer.querySelector('.grid-cell[data-row="' + c.row + '"][data-col="' + c.col + '"]');
                if (cell) {
                    cell.classList.add('word-found');
                    setTimeout(() => cell.classList.remove('word-found'), 400);
                }
            });

            renderTargets();
            updateStats();
            updateWordCountStat();
            saveState();

            if (state.foundWords.length === state.targetWords.length && state.targetWords.length > 0) {
                setTimeout(finishLevel, 500);
            }
        }

        function showFloatingScore(score) {
            const el = document.createElement('div');
            el.className = 'floating-score';
            el.textContent = '+' + score;
            el.style.left = (window.innerWidth / 2) + 'px';
            el.style.top = (window.innerHeight / 2) + 'px';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1000);
        }

        function giveUp() {
            if (state.phase !== 'finding') return;
            const allWords = findAllWordsOnGrid();
            const missed = allWords.filter(w => !state.foundWords.includes(w.word) && !state.bonusWords.includes(w.word));
            missed.forEach(w => {
                w.cells.forEach(rc => {
                    const cell = gridContainer.querySelector('.grid-cell[data-row="' + rc.r + '"][data-col="' + rc.c + '"]');
                    if (cell) cell.classList.add('missed-word');
                });
            });
            setTimeout(() => finishLevel(missed), 1500);
        }

        function finishLevel(missedWords = []) {
            const fillPercent = calculateFillPercent();
            const fillBonus = Math.floor(fillPercent * 2);
            const allTargetsBonus = state.foundWords.length === state.targetWords.length ? 100 : 0;
            const levelBonus = state.level * 25;
            state.score += fillBonus + allTargetsBonus + levelBonus;

            const emojis = [];
            if (state.foundWords.length === state.targetWords.length) emojis.push('\\u{1F7E9}');
            if (state.bonusWords.length > 0) emojis.push('\\u2B50');
            if (fillPercent > 80) emojis.push('\\u{1F9F1}');
            if (state.bonusWords.length >= 3) emojis.push('\\u{1F525}');

            document.getElementById('summary-emojis').textContent = emojis.join('') || '\\u{1F4DD}';
            document.getElementById('stat-words').textContent = state.foundWords.length + '/' + state.targetWords.length;
            document.getElementById('stat-bonus').textContent = state.bonusWords.length;
            document.getElementById('stat-fill').textContent = Math.round(fillPercent) + '%';
            document.getElementById('stat-score').textContent = state.score;

            const shareText = 'WordStax Level ' + state.level + ': ' + emojis.join('') + ' Score: ' + state.score;
            document.getElementById('share-text').textContent = shareText;
            document.getElementById('share-text').onclick = () => {
                navigator.clipboard.writeText(shareText);
                document.getElementById('share-text').textContent = 'Copied!';
                setTimeout(() => { document.getElementById('share-text').textContent = shareText; }, 1000);
            };

            document.getElementById('level-complete-screen').classList.remove('hidden');
        }

        function calculateFillPercent() {
            let filled = 0;
            for (let r = 0; r < CONFIG.canvasHeight; r++)
                for (let c = 0; c < CONFIG.canvasWidth; c++)
                    if (state.grid[r][c] !== null) filled++;
            return (filled / (CONFIG.canvasHeight * CONFIG.canvasWidth)) * 100;
        }

        function nextLevel() {
            document.getElementById('level-complete-screen').classList.add('hidden');
            state.level++;
            initLevel();
        }

        // ============================================
        // UTILITY FUNCTIONS
        // ============================================

        function generateLetter() {
            const rand = Math.random();
            if (rand < CONFIG.vowelRatio) return VOWELS[Math.floor(Math.random() * VOWELS.length)];
            else if (rand < CONFIG.vowelRatio + CONFIG.commonLetterBias * (1 - CONFIG.vowelRatio)) {
                const common = 'TNRSLDCMFPGBHW';
                return common[Math.floor(Math.random() * common.length)];
            } else return CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
        }

        function rotateCells(cells) {
            let minR = Infinity, minC = Infinity;
            const turned = cells.map(([r, c]) => {
                const nr = c, nc = -r;
                if (nr < minR) minR = nr;
                if (nc < minC) minC = nc;
                return [nr, nc];
            });
            return turned.map(([r, c]) => [r - minR, c - minC]);
        }

        function canPlaceShapeCells(cells, baseRow, baseCol) {
            for (const [dr, dc] of cells) {
                const r = baseRow + dr, c = baseCol + dc;
                if (r < 0 || r >= CONFIG.canvasHeight || c < 0 || c >= CONFIG.canvasWidth) return false;
                if (state.grid[r][c] !== null) return false;
            }
            return true;
        }

        function clearHighlights() {
            gridContainer.querySelectorAll('.grid-cell').forEach(cell => {
                cell.classList.remove('highlight-preview');
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                if (state.grid[row][col] === null) cell.textContent = '';
            });
        }

        // ============================================
        // RENDERING
        // ============================================

        function renderGrid() {
            gridContainer.innerHTML = '';
            for (let r = 0; r < CONFIG.canvasHeight; r++) {
                for (let c = 0; c < CONFIG.canvasWidth; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    if (state.grid[r][c] !== null) {
                        cell.textContent = state.grid[r][c];
                        cell.classList.add('filled');
                    }
                    gridContainer.appendChild(cell);
                }
            }
            if (state.phase === 'finding') setupWordFinding();
        }

        function renderShapeSlots() {
            for (let i = 0; i < CONFIG.shapesPerSet; i++) {
                const slot = document.getElementById('slot-' + i);
                slot.innerHTML = '';
                slot.classList.remove('selected-slot', 'placed');

                if (!state.shapeSet[i]) continue;
                const shape = state.shapeSet[i];

                if (shape.placed) {
                    slot.classList.add('placed');
                }

                if (i === state.selectedShapeIndex && !shape.placed) {
                    slot.classList.add('selected-slot');
                }

                // Render mini preview (no letters, just colored cells)
                const preview = document.createElement('div');
                preview.className = 'shape-preview';

                let maxR = 0, maxC = 0;
                shape.cells.forEach(([r, c]) => {
                    maxR = Math.max(maxR, r);
                    maxC = Math.max(maxC, c);
                });

                preview.style.gridTemplateRows = 'repeat(' + (maxR + 1) + ', 1fr)';
                preview.style.gridTemplateColumns = 'repeat(' + (maxC + 1) + ', 1fr)';

                const cellMap = new Set(shape.cells.map(([r, c]) => r + ',' + c));

                for (let r = 0; r <= maxR; r++) {
                    for (let c = 0; c <= maxC; c++) {
                        if (cellMap.has(r + ',' + c)) {
                            const cell = document.createElement('div');
                            cell.className = 'preview-cell';
                            cell.style.gridRow = r + 1;
                            cell.style.gridColumn = c + 1;
                            slot.appendChild(preview);
                            preview.appendChild(cell);
                        }
                    }
                }

                slot.appendChild(preview);
            }
        }

        function renderDragShape() {
            dragShape.innerHTML = '';
            const idx = state.selectedShapeIndex;
            if (idx < 0 || !state.shapeSet[idx]) return;
            const shape = state.shapeSet[idx];

            let maxR = 0, maxC = 0;
            shape.cells.forEach(([r, c]) => { maxR = Math.max(maxR, r); maxC = Math.max(maxC, c); });

            // Match grid cell size
            const gridRect = gridContainer.getBoundingClientRect();
            const cellSize = Math.floor(gridRect.width / CONFIG.canvasWidth) - 3;
            const dragCellSize = Math.max(20, Math.min(36, cellSize));

            dragShape.style.gridTemplateRows = 'repeat(' + (maxR + 1) + ',' + dragCellSize + 'px)';
            dragShape.style.gridTemplateColumns = 'repeat(' + (maxC + 1) + ',' + dragCellSize + 'px)';
            dragShape.style.gap = '2px';

            const cellMap = new Map();
            shape.cells.forEach(([r, c], i) => cellMap.set(r + ',' + c, shape.letters[i]));

            for (let r = 0; r <= maxR; r++) {
                for (let c = 0; c <= maxC; c++) {
                    if (cellMap.has(r + ',' + c)) {
                        const cell = document.createElement('div');
                        cell.className = 'drag-cell';
                        cell.style.width = dragCellSize + 'px';
                        cell.style.height = dragCellSize + 'px';
                        cell.style.gridRow = r + 1;
                        cell.style.gridColumn = c + 1;
                        cell.style.display = 'flex';
                        cell.style.alignItems = 'center';
                        cell.style.justifyContent = 'center';
                        cell.style.fontSize = '12px';
                        cell.style.fontWeight = 'bold';
                        cell.style.color = '#fff';
                        cell.textContent = cellMap.get(r + ',' + c);
                        dragShape.appendChild(cell);
                    }
                }
            }

            dragOffset.x = (maxC + 1) * dragCellSize / 2;
            dragOffset.y = (maxR + 1) * dragCellSize / 2;
        }

        function renderTargets() {
            targetsList.innerHTML = '';
            state.targetWords.forEach(word => {
                const chip = document.createElement('div');
                chip.className = 'target-word';
                if (state.foundWords.includes(word)) {
                    chip.classList.add('found');
                    chip.textContent = word;
                } else {
                    chip.textContent = word[0] + '_'.repeat(word.length - 1);
                }
                targetsList.appendChild(chip);
            });

            state.bonusWords.forEach(word => {
                const chip = document.createElement('div');
                chip.className = 'target-word bonus';
                chip.textContent = word;
                targetsList.appendChild(chip);
            });
        }

        function updatePhaseUI() {
            phaseIndicator.className = state.phase === 'placing' ? 'placing' : 'finding';
            if (state.phase === 'placing') {
                phaseText.textContent = 'Phase 1: Place Shapes';
                phaseHint.textContent = 'Tap a shape below, then drag it onto the grid';
            } else {
                phaseText.textContent = 'Phase 2: Find Words';
                phaseHint.textContent = 'Drag across letters to form words';
            }
        }

        function updateStats() {
            levelDisplay.textContent = state.level;
            scoreDisplay.textContent = state.score;
            shapesDisplay.textContent = state.shapesPlaced;
        }

        function updateWordCountStat() {
            // Update header or anywhere that shows found/total
        }

        // ============================================
        // PERSISTENCE
        // ============================================

        function saveState() {
            try {
                localStorage.setItem('wordstax_state', JSON.stringify({
                    level: state.level, score: state.score, phase: state.phase,
                    grid: state.grid, shapesPlaced: state.shapesPlaced,
                    targetWords: state.targetWords, foundWords: state.foundWords,
                    bonusWords: state.bonusWords
                }));
            } catch(e) {}
        }
    </script>
</body>
</html>`;

fs.writeFileSync('index.html', html);
console.log('Built index.html:', (html.length / 1024).toFixed(0), 'KB');
console.log('Lines:', html.split('\\n').length);
`;

fs.writeFileSync('_build.js', scriptContent);
console.log('Build script ready.');
