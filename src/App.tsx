import { useState, useEffect, useCallback, useRef } from 'react';

// Sound effects using Web Audio API
let audioContext: AudioContext | null = null;
let soundEnabled = true;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  if (!audioContext || !soundEnabled) return;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

const sounds = {
  move: () => playTone(200, 0.05, 'square', 0.1),
  rotate: () => playTone(400, 0.08, 'sine', 0.15),
  drop: () => playTone(150, 0.15, 'triangle', 0.2),
  lineClear: () => {
    setTimeout(() => playTone(523, 0.1, 'sine', 0.2), 0);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 100);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 200);
  },
  tetris: () => {
    [523, 659, 784, 1047].forEach((note, i) => {
      setTimeout(() => playTone(note, 0.15, 'square', 0.2), i * 100);
    });
  },
  levelUp: () => {
    [440, 554, 659, 880].forEach((note, i) => {
      setTimeout(() => playTone(note, 0.12, 'sine', 0.25), i * 80);
    });
  },
  gameOver: () => {
    [440, 370, 311, 261].forEach((note, i) => {
      setTimeout(() => playTone(note, 0.3, 'sawtooth', 0.2), i * 200);
    });
  },
  start: () => {
    [262, 330, 392, 523].forEach((note, i) => {
      setTimeout(() => playTone(note, 0.1, 'sine', 0.2), i * 100);
    });
  },
};

// Tetris constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;

// Tetromino shapes
const TETROMINOES: { [key: string]: { shape: number[][]; color: string } } = {
  I: {
    shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    color: '#00ffff',
  },
  O: {
    shape: [[1,1],[1,1]],
    color: '#ffff00',
  },
  T: {
    shape: [[0,1,0],[1,1,1],[0,0,0]],
    color: '#ff00ff',
  },
  S: {
    shape: [[0,1,1],[1,1,0],[0,0,0]],
    color: '#00ff00',
  },
  Z: {
    shape: [[1,1,0],[0,1,1],[0,0,0]],
    color: '#ff0000',
  },
  J: {
    shape: [[1,0,0],[1,1,1],[0,0,0]],
    color: '#0066ff',
  },
  L: {
    shape: [[0,0,1],[1,1,1],[0,0,0]],
    color: '#ff6600',
  },
};

const TETROMINO_KEYS = Object.keys(TETROMINOES);

type Board = (string | null)[][];
type Piece = {
  shape: number[][];
  color: string;
  x: number;
  y: number;
};

function createEmptyBoard(): Board {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
}

function getRandomPiece(): Piece {
  const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
  const tetromino = TETROMINOES[key];
  return {
    shape: tetromino.shape.map(row => [...row]),
    color: tetromino.color,
    x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(tetromino.shape[0].length / 2),
    y: 0,
  };
}

function rotatePiece(shape: number[][]): number[][] {
  const N = shape.length;
  const rotated = Array(N).fill(null).map(() => Array(N).fill(0));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      rotated[x][N - 1 - y] = shape[y][x];
    }
  }
  return rotated;
}

function isValidPosition(board: Board, shape: number[][], x: number, y: number): boolean {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col;
        const newY = y + row;
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return false;
        if (newY >= 0 && board[newY][newX]) return false;
      }
    }
  }
  return true;
}

function placePiece(board: Board, piece: Piece): Board {
  const newBoard = board.map(row => [...row]);
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const y = piece.y + row;
        const x = piece.x + col;
        if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
          newBoard[y][x] = piece.color;
        }
      }
    }
  }
  return newBoard;
}

function clearLines(board: Board): { newBoard: Board; linesCleared: number } {
  let linesCleared = 0;
  const newBoard = board.filter(row => {
    const isFull = row.every(cell => cell !== null);
    if (isFull) linesCleared++;
    return !isFull;
  });
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }
  return { newBoard, linesCleared };
}

export default function App() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Piece>(getRandomPiece());
  const [nextPiece, setNextPiece] = useState<Piece>(getRandomPiece());
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const gameLoopRef = useRef<number | null>(null);
  const lastDropRef = useRef<number>(0);

  const toggleSound = () => {
    soundEnabled = !soundEnabled;
    setSoundOn(soundEnabled);
  };

  const getDropSpeed = useCallback(() => {
    return Math.max(100, 800 - (level - 1) * 70);
  }, [level]);

  const startNewGame = useCallback(() => {
    initAudio();
    sounds.start();
    const newPiece = getRandomPiece();
    setBoard(createEmptyBoard());
    setCurrentPiece(newPiece);
    setNextPiece(getRandomPiece());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setIsStarted(true);
  }, []);

  const lockPiece = useCallback(() => {
    const newBoard = placePiece(board, currentPiece);
    const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

    if (linesCleared > 0) {
      if (linesCleared === 4) {
        sounds.tetris();
      } else {
        sounds.lineClear();
      }
      const points = [0, 100, 300, 500, 800];
      setScore(prev => prev + points[linesCleared] * level);
      setLines(prev => {
        const newLines = prev + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        if (newLevel > level) {
          sounds.levelUp();
        }
        setLevel(newLevel);
        return newLines;
      });
    }

    setBoard(clearedBoard);

    const newCurrentPiece = nextPiece;
    const newNextPiece = getRandomPiece();

    if (!isValidPosition(clearedBoard, newCurrentPiece.shape, newCurrentPiece.x, newCurrentPiece.y)) {
      setGameOver(true);
      setIsStarted(false);
      sounds.gameOver();
      return;
    }

    setCurrentPiece(newCurrentPiece);
    setNextPiece(newNextPiece);
  }, [board, currentPiece, nextPiece, level]);

  const moveDown = useCallback(() => {
    if (gameOver || isPaused || !isStarted) return;
    if (isValidPosition(board, currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
      setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      lockPiece();
    }
  }, [board, currentPiece, gameOver, isPaused, isStarted, lockPiece]);

  const moveLeft = useCallback(() => {
    if (gameOver || isPaused || !isStarted) return;
    if (isValidPosition(board, currentPiece.shape, currentPiece.x - 1, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, x: prev.x - 1 }));
      sounds.move();
    }
  }, [board, currentPiece, gameOver, isPaused, isStarted]);

  const moveRight = useCallback(() => {
    if (gameOver || isPaused || !isStarted) return;
    if (isValidPosition(board, currentPiece.shape, currentPiece.x + 1, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, x: prev.x + 1 }));
      sounds.move();
    }
  }, [board, currentPiece, gameOver, isPaused, isStarted]);

  const rotate = useCallback(() => {
    if (gameOver || isPaused || !isStarted) return;
    const rotated = rotatePiece(currentPiece.shape);
    if (isValidPosition(board, rotated, currentPiece.x, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated }));
      sounds.rotate();
    } else if (isValidPosition(board, rotated, currentPiece.x - 1, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated, x: prev.x - 1 }));
      sounds.rotate();
    } else if (isValidPosition(board, rotated, currentPiece.x + 1, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated, x: prev.x + 1 }));
      sounds.rotate();
    }
  }, [board, currentPiece, gameOver, isPaused, isStarted]);

  const hardDrop = useCallback(() => {
    if (gameOver || isPaused || !isStarted) return;
    let dropY = currentPiece.y;
    while (isValidPosition(board, currentPiece.shape, currentPiece.x, dropY + 1)) {
      dropY++;
    }
    setScore(prev => prev + (dropY - currentPiece.y) * 2);
    setCurrentPiece(prev => ({ ...prev, y: dropY }));
    sounds.drop();
    setTimeout(() => lockPiece(), 0);
  }, [board, currentPiece, gameOver, isPaused, isStarted, lockPiece]);

  // Game loop
  useEffect(() => {
    if (!isStarted || gameOver || isPaused) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastDropRef.current > getDropSpeed()) {
        moveDown();
        lastDropRef.current = timestamp;
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isStarted, gameOver, isPaused, moveDown, getDropSpeed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        if (isStarted && !gameOver) setIsPaused(prev => !prev);
        return;
      }
      if (e.key === 'Enter' && (!isStarted || gameOver)) {
        startNewGame();
        return;
      }
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); moveLeft(); break;
        case 'ArrowRight': e.preventDefault(); moveRight(); break;
        case 'ArrowDown': e.preventDefault(); moveDown(); break;
        case 'ArrowUp': e.preventDefault(); rotate(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, moveDown, rotate, hardDrop, isStarted, gameOver, startNewGame]);

  // Render board
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    if (isStarted && !gameOver) {
      // Draw current piece
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const y = currentPiece.y + row;
            const x = currentPiece.x + col;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              displayBoard[y][x] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  const displayBoard = renderBoard();

  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-black text-[#00ffaa] tracking-wider" style={{ textShadow: '0 0 10px #00ffaa, 0 0 20px #00ffaa' }}>
          NEON TETRIS
        </h1>

        <div className="flex gap-4">
          {/* Game Board */}
          <div className="relative border-2 border-[#00ffaa] rounded-lg p-1" style={{ boxShadow: '0 0 10px #00ffaa, 0 0 20px #00ffaa' }}>
            <div style={{ width: BOARD_WIDTH * CELL_SIZE, height: BOARD_HEIGHT * CELL_SIZE, position: 'relative' }}>
              {displayBoard.map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${y}-${x}`}
                    style={{
                      position: 'absolute',
                      left: x * CELL_SIZE,
                      top: y * CELL_SIZE,
                      width: CELL_SIZE - 1,
                      height: CELL_SIZE - 1,
                      backgroundColor: cell || 'rgba(0, 255, 170, 0.05)',
                      border: cell ? `1px solid ${cell}` : '1px solid rgba(0, 255, 170, 0.1)',
                      boxShadow: cell ? `0 0 5px ${cell}, 0 0 10px ${cell}` : 'none',
                    }}
                  />
                ))
              )}

              {/* Start screen */}
              {!isStarted && !gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
                  <h2 className="text-3xl font-black text-[#00ffaa] mb-4" style={{ textShadow: '0 0 10px #00ffaa' }}>
                    NEON TETRIS
                  </h2>
                  <button
                    onClick={startNewGame}
                    className="px-8 py-4 bg-transparent border-2 border-[#00ffaa] text-[#00ffaa] rounded-lg font-bold text-xl hover:bg-[#00ffaa]/20 transition-all"
                    style={{ boxShadow: '0 0 10px #00ffaa' }}
                  >
                    START GAME
                  </button>
                  <p className="text-white/50 text-sm mt-4">Press ENTER or click to start</p>
                </div>
              )}

              {/* Game Over */}
              {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-lg">
                  <h2 className="text-3xl font-black text-[#ff0066] mb-4" style={{ textShadow: '0 0 10px #ff0066' }}>
                    GAME OVER
                  </h2>
                  <p className="text-white text-xl mb-2">Score: {score}</p>
                  <button
                    onClick={startNewGame}
                    className="px-8 py-4 bg-transparent border-2 border-[#ff0066] text-[#ff0066] rounded-lg font-bold text-xl hover:bg-[#ff0066]/20 transition-all mt-4"
                    style={{ boxShadow: '0 0 10px #ff0066' }}
                  >
                    PLAY AGAIN
                  </button>
                </div>
              )}

              {/* Pause */}
              {isPaused && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
                  <h2 className="text-3xl font-black text-[#ffff00]" style={{ textShadow: '0 0 10px #ffff00' }}>
                    PAUSED
                  </h2>
                </div>
              )}
            </div>
          </div>

          {/* Side panel */}
          <div className="flex flex-col gap-4 w-48">
            <div className="border border-[#00ffaa] rounded-lg p-3">
              <div className="text-[#00ffaa] text-xs mb-1">SCORE</div>
              <div className="text-white text-2xl font-bold">{score}</div>
            </div>
            <div className="border border-[#ff00ff] rounded-lg p-3">
              <div className="text-[#ff00ff] text-xs mb-1">LEVEL</div>
              <div className="text-white text-2xl font-bold">{level}</div>
            </div>
            <div className="border border-[#00aaff] rounded-lg p-3">
              <div className="text-[#00aaff] text-xs mb-1">LINES</div>
              <div className="text-white text-2xl font-bold">{lines}</div>
            </div>

            {/* Controls */}
            <div className="border border-[#00ffaa]/50 rounded-lg p-3 text-xs text-white/70">
              <div className="mb-2">CONTROLS:</div>
              <div>← → Move</div>
              <div>↑ Rotate</div>
              <div>↓ Soft drop</div>
              <div>SPACE Hard drop</div>
              <div>P Pause</div>
            </div>

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className="border border-[#ffff00] rounded-lg p-3 text-[#ffff00] font-bold hover:bg-[#ffff00]/20 transition-all"
              style={{ boxShadow: soundOn ? '0 0 10px #ffff00' : 'none' }}
            >
              {soundOn ? '🔊 SOUND ON' : '🔇 SOUND OFF'}
            </button>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="lg:hidden flex flex-col gap-2 mt-4">
          <div className="flex justify-center gap-2">
            <button onClick={rotate} className="w-16 h-16 border-2 border-[#ff00ff] text-[#ff00ff] text-2xl rounded-lg active:bg-[#ff00ff]/20">↻</button>
          </div>
          <div className="flex justify-center gap-2">
            <button onClick={moveLeft} className="w-16 h-16 border-2 border-[#00ffaa] text-[#00ffaa] text-2xl rounded-lg active:bg-[#00ffaa]/20">←</button>
            <button onClick={moveDown} className="w-16 h-16 border-2 border-[#00ffaa] text-[#00ffaa] text-2xl rounded-lg active:bg-[#00ffaa]/20">↓</button>
            <button onClick={moveRight} className="w-16 h-16 border-2 border-[#00ffaa] text-[#00ffaa] text-2xl rounded-lg active:bg-[#00ffaa]/20">→</button>
          </div>
          <button onClick={hardDrop} className="w-full h-12 border-2 border-[#ffff00] text-[#ffff00] font-bold rounded-lg active:bg-[#ffff00]/20">DROP</button>
        </div>
      </div>
    </div>
  );
}
