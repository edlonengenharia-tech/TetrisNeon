import { useState, useEffect, useCallback, useRef } from 'react';
import { soundManager } from './sounds';

// Tetris constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;

// Tetromino shapes
const TETROMINOES: { [key: string]: { shape: number[][]; color: string; glow: string } } = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#00ffff',
    glow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#ffff00',
    glow: '0 0 10px #ffff00, 0 0 20px #ffff00, 0 0 40px #ffff00',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#ff00ff',
    glow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#00ff00',
    glow: '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 40px #00ff00',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#ff0000',
    glow: '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 40px #ff0000',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#0066ff',
    glow: '0 0 10px #0066ff, 0 0 20px #0066ff, 0 0 40px #0066ff',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#ff6600',
    glow: '0 0 10px #ff6600, 0 0 20px #ff6600, 0 0 40px #ff6600',
  },
};

const TETROMINO_KEYS = Object.keys(TETROMINOES);

type Board = (string | null)[][];
type Piece = {
  shape: number[][];
  color: string;
  glow: string;
  x: number;
  y: number;
  type: string;
};

function createEmptyBoard(): Board {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null));
}

function getRandomPiece(): Piece {
  const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
  const tetromino = TETROMINOES[key];
  return {
    shape: tetromino.shape.map(row => [...row]),
    color: tetromino.color,
    glow: tetromino.glow,
    x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(tetromino.shape[0].length / 2),
    y: 0,
    type: key,
  };
}

function rotatePiece(shape: number[][]): number[][] {
  const N = shape.length;
  const rotated = Array(N)
    .fill(null)
    .map(() => Array(N).fill(0));
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
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
          return false;
        }
        if (newY >= 0 && board[newY][newX]) {
          return false;
        }
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

function getGhostPosition(board: Board, piece: Piece): number {
  let ghostY = piece.y;
  while (isValidPosition(board, piece.shape, piece.x, ghostY + 1)) {
    ghostY++;
  }
  return ghostY;
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
  const [clearingLines, setClearingLines] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('tetris-highscore');
    return saved ? parseInt(saved) : 0;
  });
  const gameLoopRef = useRef<number | null>(null);
  const lastDropRef = useRef<number>(0);

  const getDropSpeed = useCallback(() => {
    return Math.max(100, 800 - (level - 1) * 70);
  }, [level]);

  const startNewGame = useCallback(() => {
    soundManager.resume();
    soundManager.playStart();
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
    setClearingLines([]);
  }, []);

  const lockPiece = useCallback(() => {
    const newBoard = placePiece(board, currentPiece);
    const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

    if (linesCleared > 0) {
      // Find which lines are full for animation
      const fullLines: number[] = [];
      for (let row = 0; row < BOARD_HEIGHT; row++) {
        if (newBoard[row].every(cell => cell !== null)) {
          fullLines.push(row);
        }
      }
      setClearingLines(fullLines);
      
      // Play sound
      if (linesCleared === 4) {
        soundManager.playTetris();
      } else {
        soundManager.playLineClear();
      }
      
      setTimeout(() => {
        setClearingLines([]);
        setBoard(clearedBoard);
      }, 300);

      const points = [0, 100, 300, 500, 800];
      const newScore = score + points[linesCleared] * level;
      setScore(newScore);
      
      // Update high score
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('tetris-highscore', newScore.toString());
      }

      setLines(prev => {
        const newLines = prev + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        if (newLevel > level) {
          soundManager.playLevelUp();
        }
        setLevel(newLevel);
        return newLines;
      });
    } else {
      setBoard(clearedBoard);
    }

    const newCurrentPiece = nextPiece;
    const newNextPiece = getRandomPiece();

    if (!isValidPosition(clearedBoard, newCurrentPiece.shape, newCurrentPiece.x, newCurrentPiece.y)) {
      setGameOver(true);
      setIsStarted(false);
      soundManager.playGameOver();
      return;
    }

    setCurrentPiece(newCurrentPiece);
    setNextPiece(newNextPiece);
  }, [board, currentPiece, nextPiece, level, score, highScore]);

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
      soundManager.playMove();
    }
  }, [board, currentPiece, gameOver, isPaused, isStarted]);

  const moveRight = useCallback(() => {
    if (gameOver || isPaused || !isStarted) return;
    if (isValidPosition(board, currentPiece.shape, currentPiece.x + 1, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, x: prev.x + 1 }));
      soundManager.playMove();
    }
  }, [board, currentPiece, gameOver, isPaused, isStarted]);

  const rotate = useCallback(() => {
    if (gameOver || isPaused || !isStarted) return;
    const rotated = rotatePiece(currentPiece.shape);
    // Wall kick: try original position, then left, then right
    if (isValidPosition(board, rotated, currentPiece.x, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated }));
      soundManager.playRotate();
    } else if (isValidPosition(board, rotated, currentPiece.x - 1, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated, x: prev.x - 1 }));
      soundManager.playRotate();
    } else if (isValidPosition(board, rotated, currentPiece.x + 1, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated, x: prev.x + 1 }));
      soundManager.playRotate();
    } else if (isValidPosition(board, rotated, currentPiece.x - 2, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated, x: prev.x - 2 }));
      soundManager.playRotate();
    } else if (isValidPosition(board, rotated, currentPiece.x + 2, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated, x: prev.x + 2 }));
      soundManager.playRotate();
    }
  }, [board, currentPiece, gameOver, isPaused, isStarted]);

  const hardDrop = useCallback(() => {
    if (gameOver || isPaused || !isStarted) return;
    const ghostY = getGhostPosition(board, currentPiece);
    const dropDistance = ghostY - currentPiece.y;
    setScore(prev => prev + dropDistance * 2);
    setCurrentPiece(prev => ({ ...prev, y: ghostY }));
    soundManager.playDrop();
    setTimeout(() => lockPiece(), 0);
  }, [board, currentPiece, gameOver, isPaused, isStarted, lockPiece]);

  const togglePause = useCallback(() => {
    if (!isStarted || gameOver) return;
    setIsPaused(prev => {
      if (!prev) {
        soundManager.playPause();
      } else {
        soundManager.playResume();
      }
      return !prev;
    });
  }, [isStarted, gameOver]);

  const toggleSound = useCallback(() => {
    const enabled = soundManager.toggle();
    setSoundEnabled(enabled);
  }, []);

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
        togglePause();
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        toggleSound();
        return;
      }
      if (e.key === 'Enter' && (!isStarted || gameOver)) {
        startNewGame();
        return;
      }
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, moveDown, rotate, hardDrop, isStarted, gameOver, startNewGame, togglePause, toggleSound]);

  // Render the board with current piece and ghost
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    const ghostY = getGhostPosition(board, currentPiece);

    // Draw ghost piece
    if (isStarted && !gameOver) {
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const y = ghostY + row;
            const x = currentPiece.x + col;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH && !displayBoard[y][x]) {
              displayBoard[y][x] = `ghost-${currentPiece.color}`;
            }
          }
        }
      }

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

  const renderNextPiece = () => {
    const preview = Array(4)
      .fill(null)
      .map(() => Array(4).fill(null));
    const offsetX = Math.floor((4 - nextPiece.shape[0].length) / 2);
    const offsetY = Math.floor((4 - nextPiece.shape.length) / 2);
    for (let row = 0; row < nextPiece.shape.length; row++) {
      for (let col = 0; col < nextPiece.shape[row].length; col++) {
        if (nextPiece.shape[row][col]) {
          preview[row + offsetY][col + offsetX] = nextPiece.color;
        }
      }
    }
    return preview;
  };

  const displayBoard = renderBoard();
  const nextPreview = renderNextPiece();

  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] flex items-center justify-center grid-bg relative overflow-hidden">
      {/* Scanline effect */}
      <div className="scanline"></div>

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#00ffff', '#ff00ff', '#00ff00', '#ffff00'][i % 4],
              boxShadow: `0 0 5px ${['#00ffff', '#ff00ff', '#00ff00', '#ffff00'][i % 4]}`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 p-2 lg:p-4 relative z-10 w-full max-w-5xl">
        {/* Title */}
        <div className="lg:hidden text-center mb-1">
          <h1 className="text-2xl font-black neon-text text-[#00ffaa] tracking-wider">
            NEON TETRIS
          </h1>
        </div>

        {/* Left panel - Score */}
        <div className="hidden lg:flex flex-col gap-3 w-48">
          <h1 className="text-2xl font-black neon-text text-[#00ffaa] tracking-wider text-center mb-2">
            NEON<br/>TETRIS
          </h1>
          
          <div className="neon-border rounded-lg p-3 bg-black/50">
            <div className="text-[#00ffaa] text-xs tracking-widest mb-1">SCORE</div>
            <div className="text-white text-xl font-bold" style={{ textShadow: '0 0 10px #00ffaa' }}>
              {score.toLocaleString()}
            </div>
            <div className="text-[#00ffaa]/50 text-[10px] mt-1">HIGH: {highScore.toLocaleString()}</div>
          </div>

          <div className="neon-border-pink rounded-lg p-3 bg-black/50">
            <div className="text-[#ff00ff] text-xs tracking-widest mb-1">LEVEL</div>
            <div className="text-white text-xl font-bold" style={{ textShadow: '0 0 10px #ff00ff' }}>
              {level}
            </div>
          </div>

          <div className="neon-border-cyan rounded-lg p-3 bg-black/50">
            <div className="text-[#00aaff] text-xs tracking-widest mb-1">LINES</div>
            <div className="text-white text-xl font-bold" style={{ textShadow: '0 0 10px #00aaff' }}>
              {lines}
            </div>
          </div>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className="neon-border rounded-lg p-3 bg-black/50 text-left hover:bg-black/70 transition-colors"
          >
            <div className="text-[#00ffaa] text-xs tracking-widest mb-1">SOUND</div>
            <div className="text-white text-sm font-bold flex items-center gap-2">
              {soundEnabled ? '🔊 ON' : '🔇 OFF'}
            </div>
          </button>
        </div>

        {/* Game Board */}
        <div className="relative flex-shrink-0">
          <div
            className="neon-border rounded-lg p-1 bg-black/80"
            style={{
              width: BOARD_WIDTH * CELL_SIZE + 8,
              height: BOARD_HEIGHT * CELL_SIZE + 8,
            }}
          >
            <div
              className="relative"
              style={{
                width: BOARD_WIDTH * CELL_SIZE,
                height: BOARD_HEIGHT * CELL_SIZE,
              }}
            >
              {displayBoard.map((row, y) =>
                row.map((cell, x) => {
                  const isGhost = cell?.startsWith('ghost-');
                  const color = isGhost ? cell!.replace('ghost-', '') : cell;
                  const isClearing = clearingLines.includes(y);

                  return (
                    <div
                      key={`${y}-${x}`}
                      className={`absolute cell-glow ${isClearing ? 'line-clear-animation' : ''}`}
                      style={{
                        left: x * CELL_SIZE,
                        top: y * CELL_SIZE,
                        width: CELL_SIZE - 1,
                        height: CELL_SIZE - 1,
                        backgroundColor: color
                          ? isGhost
                            ? 'transparent'
                            : color
                          : 'rgba(0, 255, 170, 0.02)',
                        border: color
                          ? isGhost
                            ? `1px dashed ${color}40`
                            : `1px solid ${color}`
                          : '1px solid rgba(0, 255, 170, 0.05)',
                        boxShadow: color && !isGhost
                          ? `0 0 5px ${color}, 0 0 10px ${color}80, inset 0 0 3px ${color}40`
                          : 'none',
                        borderRadius: '2px',
                      }}
                    />
                  );
                })
              )}

              {/* Start screen overlay */}
              {!isStarted && !gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg z-20">
                  <h2 className="text-2xl font-black text-[#00ffaa] neon-text mb-2 tracking-wider">
                    NEON TETRIS
                  </h2>
                  <p className="text-[#00ffaa]/50 text-xs mb-4">HIGH SCORE: {highScore.toLocaleString()}</p>
                  <p className="text-white/70 text-sm mb-4 tracking-wide">
                    Press ENTER to start
                  </p>
                  <button
                    onClick={startNewGame}
                    className="px-6 py-3 bg-transparent border-2 border-[#00ffaa] text-[#00ffaa] rounded-lg font-bold tracking-wider hover:bg-[#00ffaa]/20 transition-all duration-300"
                    style={{ boxShadow: '0 0 10px #00ffaa40, 0 0 20px #00ffaa20' }}
                  >
                    START GAME
                  </button>
                </div>
              )}

              {/* Game Over overlay */}
              {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-lg z-20">
                  <h2 className="text-2xl font-black text-[#ff0066] mb-2 tracking-wider" style={{ textShadow: '0 0 10px #ff0066, 0 0 20px #ff0066, 0 0 40px #ff0066' }}>
                    GAME OVER
                  </h2>
                  <p className="text-white/70 text-sm mb-1">Score: {score.toLocaleString()}</p>
                  <p className="text-white/70 text-sm mb-1">Level: {level}</p>
                  {score >= highScore && score > 0 && (
                    <p className="text-[#ffff00] text-sm mb-2 font-bold" style={{ textShadow: '0 0 10px #ffff00' }}>
                      🏆 NEW HIGH SCORE! 🏆
                    </p>
                  )}
                  <p className="text-white/50 text-xs mb-4">High Score: {highScore.toLocaleString()}</p>
                  <button
                    onClick={startNewGame}
                    className="px-6 py-3 bg-transparent border-2 border-[#ff0066] text-[#ff0066] rounded-lg font-bold tracking-wider hover:bg-[#ff0066]/20 transition-all duration-300"
                    style={{ boxShadow: '0 0 10px #ff006640, 0 0 20px #ff006620' }}
                  >
                    PLAY AGAIN
                  </button>
                </div>
              )}

              {/* Pause overlay */}
              {isPaused && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg z-20">
                  <h2 className="text-2xl font-black text-[#ffff00] mb-4 tracking-wider" style={{ textShadow: '0 0 10px #ffff00, 0 0 20px #ffff00' }}>
                    PAUSED
                  </h2>
                  <p className="text-white/70 text-sm">Press P to resume</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel - Next piece & Mobile controls */}
        <div className="flex flex-col gap-3 w-48">
          {/* Next piece */}
          <div className="neon-border rounded-lg p-3 bg-black/50">
            <div className="text-[#00ffaa] text-xs tracking-widest mb-2">NEXT</div>
            <div className="flex justify-center">
              <div
                className="relative"
                style={{ width: 4 * 20, height: 4 * 20 }}
              >
                {nextPreview.map((row, y) =>
                  row.map((cell, x) => (
                    <div
                      key={`next-${y}-${x}`}
                      style={{
                        position: 'absolute',
                        left: x * 20,
                        top: y * 20,
                        width: 18,
                        height: 18,
                        backgroundColor: cell || 'transparent',
                        border: cell ? `1px solid ${cell}` : 'none',
                        boxShadow: cell ? `0 0 5px ${cell}, 0 0 10px ${cell}80` : 'none',
                        borderRadius: '2px',
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Mobile info */}
          <div className="lg:hidden neon-border rounded-lg p-3 bg-black/50">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[#00ffaa] text-xs tracking-widest">SCORE</div>
              <button
                onClick={toggleSound}
                className="text-lg"
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
            </div>
            <div className="text-white text-lg font-bold" style={{ textShadow: '0 0 10px #00ffaa' }}>
              {score.toLocaleString()}
            </div>
            <div className="text-[#00ffaa]/50 text-[10px]">HIGH: {highScore.toLocaleString()}</div>
            <div className="flex gap-4 mt-2">
              <div>
                <div className="text-[#ff00ff] text-xs tracking-widest">LVL</div>
                <div className="text-white font-bold" style={{ textShadow: '0 0 10px #ff00ff' }}>{level}</div>
              </div>
              <div>
                <div className="text-[#00aaff] text-xs tracking-widest">LINES</div>
                <div className="text-white font-bold" style={{ textShadow: '0 0 10px #00aaff' }}>{lines}</div>
              </div>
            </div>
          </div>

          {/* Mobile controls */}
          <div className="lg:hidden flex flex-col gap-2">
            <div className="flex justify-center gap-2">
              <button
                onTouchStart={(e) => { e.preventDefault(); rotate(); }}
                onClick={rotate}
                className="w-14 h-14 rounded-lg border border-[#ff00ff] text-[#ff00ff] font-bold text-xl flex items-center justify-center active:bg-[#ff00ff]/20"
                style={{ boxShadow: '0 0 5px #ff00ff40' }}
              >
                ↻
              </button>
            </div>
            <div className="flex justify-center gap-2">
              <button
                onTouchStart={(e) => { e.preventDefault(); moveLeft(); }}
                onClick={moveLeft}
                className="w-14 h-14 rounded-lg border border-[#00ffaa] text-[#00ffaa] font-bold text-xl flex items-center justify-center active:bg-[#00ffaa]/20"
                style={{ boxShadow: '0 0 5px #00ffaa40' }}
              >
                ←
              </button>
              <button
                onTouchStart={(e) => { e.preventDefault(); moveDown(); }}
                onClick={moveDown}
                className="w-14 h-14 rounded-lg border border-[#00ffaa] text-[#00ffaa] font-bold text-xl flex items-center justify-center active:bg-[#00ffaa]/20"
                style={{ boxShadow: '0 0 5px #00ffaa40' }}
              >
                ↓
              </button>
              <button
                onTouchStart={(e) => { e.preventDefault(); moveRight(); }}
                onClick={moveRight}
                className="w-14 h-14 rounded-lg border border-[#00ffaa] text-[#00ffaa] font-bold text-xl flex items-center justify-center active:bg-[#00ffaa]/20"
                style={{ boxShadow: '0 0 5px #00ffaa40' }}
              >
                →
              </button>
            </div>
            <div className="flex justify-center gap-2">
              <button
                onTouchStart={(e) => { e.preventDefault(); hardDrop(); }}
                onClick={hardDrop}
                className="w-full h-12 rounded-lg border border-[#ffff00] text-[#ffff00] font-bold text-sm tracking-wider flex items-center justify-center active:bg-[#ffff00]/20"
                style={{ boxShadow: '0 0 5px #ffff0040' }}
              >
                ⬇ DROP
              </button>
            </div>
            <div className="flex justify-center gap-2 mt-1">
              <button
                onClick={togglePause}
                className="flex-1 h-10 rounded-lg border border-[#00aaff] text-[#00aaff] font-bold text-xs tracking-wider flex items-center justify-center active:bg-[#00aaff]/20"
                style={{ boxShadow: '0 0 5px #00aaff40' }}
              >
                {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
              </button>
              <button
                onClick={startNewGame}
                className="flex-1 h-10 rounded-lg border border-[#ff0066] text-[#ff0066] font-bold text-xs tracking-wider flex items-center justify-center active:bg-[#ff0066]/20"
                style={{ boxShadow: '0 0 5px #ff006640' }}
              >
                🔄 NEW
              </button>
            </div>
          </div>

          {/* Desktop controls hint */}
          <div className="hidden lg:block mt-2">
            <div className="neon-border rounded-lg p-3 bg-black/50">
              <div className="text-[#00ffaa]/70 text-xs mb-2 tracking-widest">CONTROLS</div>
              <div className="text-[#00ffaa]/50 text-[10px] tracking-wider leading-relaxed">
                <div>← → MOVE</div>
                <div>↑ ROTATE</div>
                <div>↓ SOFT DROP</div>
                <div>SPACE HARD DROP</div>
                <div>P PAUSE</div>
                <div>M SOUND ON/OFF</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
