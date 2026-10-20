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
  hold: () => playTone(300, 0.1, 'sine', 0.15),
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
  combo: (comboLevel: number) => {
    const baseFreq = 400 + comboLevel * 50;
    [baseFreq, baseFreq + 100, baseFreq + 200].forEach((note, i) => {
      setTimeout(() => playTone(note, 0.1, 'sine', 0.2), i * 80);
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

// Tetris constants - Ajustado para ficar proporcional
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 28; // Reduzido de 30 para 28 para melhor proporção

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
  type: string;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
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
    type: key,
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

function clearLines(board: Board): { newBoard: Board; linesCleared: number; clearedRows: number[] } {
  let linesCleared = 0;
  const clearedRows: number[] = [];
  const newBoard = board.filter((row, rowIndex) => {
    const isFull = row.every(cell => cell !== null);
    if (isFull) {
      linesCleared++;
      clearedRows.push(rowIndex);
    }
    return !isFull;
  });
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }
  return { newBoard, linesCleared, clearedRows };
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
  const [nextPieces, setNextPieces] = useState<Piece[]>([getRandomPiece(), getRandomPiece(), getRandomPiece()]);
  const [holdPiece, setHoldPiece] = useState<Piece | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stats, setStats] = useState({
    piecesPlaced: 0,
    linesCleared: 0,
    tetrisCount: 0,
    timePlayed: 0,
  });
  const [shake, setShake] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const lastDropRef = useRef<number>(0);
  const particleIdRef = useRef(0);

  const getDropSpeed = useCallback(() => {
    return Math.max(100, 800 - (level - 1) * 70);
  }, [level]);

  const createParticles = (rows: number[]) => {
    const newParticles: Particle[] = [];
    rows.forEach(row => {
      for (let i = 0; i < 25; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: Math.random() * BOARD_WIDTH * CELL_SIZE,
          y: row * CELL_SIZE + CELL_SIZE / 2,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          color: ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff0000'][Math.floor(Math.random() * 5)],
          life: 1,
          maxLife: 1,
          size: Math.random() * 5 + 2,
        });
      }
    });
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Particle animation
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.5,
            life: p.life - 0.02,
          }))
          .filter(p => p.life > 0)
      );
    }, 30);
    return () => clearInterval(interval);
  }, [particles.length]);

  // Time tracking
  useEffect(() => {
    if (!isStarted || gameOver || isPaused) return;
    const interval = setInterval(() => {
      setStats(prev => ({ ...prev, timePlayed: prev.timePlayed + 1 }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted, gameOver, isPaused]);

  const startNewGame = useCallback(() => {
    initAudio();
    sounds.start();
    const newPiece = getRandomPiece();
    setBoard(createEmptyBoard());
    setCurrentPiece(newPiece);
    setNextPieces([getRandomPiece(), getRandomPiece(), getRandomPiece()]);
    setHoldPiece(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setLevel(1);
    setCombo(0);
    setMaxCombo(0);
    setGameOver(false);
    setIsPaused(false);
    setIsStarted(true);
    setParticles([]);
    setStats({ piecesPlaced: 0, linesCleared: 0, tetrisCount: 0, timePlayed: 0 });
  }, []);

  const lockPiece = useCallback(() => {
    const newBoard = placePiece(board, currentPiece);
    const { newBoard: clearedBoard, linesCleared, clearedRows } = clearLines(newBoard);

    if (linesCleared > 0) {
      createParticles(clearedRows);
      
      if (linesCleared === 4) {
        sounds.tetris();
        setShake(true);
        setTimeout(() => setShake(false), 300);
        setStats(prev => ({ ...prev, tetrisCount: prev.tetrisCount + 1 }));
      } else {
        sounds.lineClear();
      }

      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      
      if (newCombo > 1) {
        sounds.combo(newCombo);
      }

      const points = [0, 100, 300, 500, 800];
      const comboBonus = newCombo > 1 ? newCombo * 50 : 0;
      setScore(prev => prev + (points[linesCleared] * level) + comboBonus);
      
      setLines(prev => {
        const newLines = prev + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        if (newLevel > level) {
          sounds.levelUp();
        }
        setLevel(newLevel);
        return newLines;
      });

      setStats(prev => ({ ...prev, linesCleared: prev.linesCleared + linesCleared }));
    } else {
      setCombo(0);
    }

    setBoard(clearedBoard);
    setStats(prev => ({ ...prev, piecesPlaced: prev.piecesPlaced + 1 }));

    const newCurrentPiece = nextPieces[0];
    const newNextPieces = [...nextPieces.slice(1), getRandomPiece()];

    if (!isValidPosition(clearedBoard, newCurrentPiece.shape, newCurrentPiece.x, newCurrentPiece.y)) {
      setGameOver(true);
      setIsStarted(false);
      sounds.gameOver();
      return;
    }

    setCurrentPiece(newCurrentPiece);
    setNextPieces(newNextPieces);
    setCanHold(true);
  }, [board, currentPiece, nextPieces, level, combo, maxCombo]);

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

  const hold = useCallback(() => {
    if (gameOver || isPaused || !isStarted || !canHold) return;
    sounds.hold();
    
    if (holdPiece) {
      const tempPiece = holdPiece;
      setHoldPiece({ ...currentPiece, x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(currentPiece.shape[0].length / 2), y: 0 });
      setCurrentPiece({ ...tempPiece, x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(tempPiece.shape[0].length / 2), y: 0 });
    } else {
      setHoldPiece({ ...currentPiece, x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(currentPiece.shape[0].length / 2), y: 0 });
      const newCurrentPiece = nextPieces[0];
      const newNextPieces = [...nextPieces.slice(1), getRandomPiece()];
      setCurrentPiece(newCurrentPiece);
      setNextPieces(newNextPieces);
    }
    setCanHold(false);
  }, [gameOver, isPaused, isStarted, canHold, holdPiece, currentPiece, nextPieces]);

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
      if (e.key === 'm' || e.key === 'M') {
        soundEnabled = !soundEnabled;
        setSoundOn(soundEnabled);
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        hold();
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
  }, [moveLeft, moveRight, moveDown, rotate, hardDrop, hold, isStarted, gameOver, startNewGame]);

  // Render board
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    const ghostY = getGhostPosition(board, currentPiece);

    if (isStarted && !gameOver) {
      // Draw ghost piece
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

  const displayBoard = renderBoard();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate dimensions
  const boardWidth = BOARD_WIDTH * CELL_SIZE;
  const boardHeight = BOARD_HEIGHT * CELL_SIZE;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center p-4 overflow-auto">
      {/* Background grid effect */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0, 255, 170, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 170, 0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      <div className={`relative flex flex-col lg:flex-row items-start gap-6 ${shake ? 'animate-pulse' : ''}`}>
        {/* Title - Mobile only */}
        <h1 className="text-3xl font-black text-[#00ffaa] tracking-wider lg:hidden mb-2 text-center w-full" style={{ textShadow: '0 0 10px #00ffaa, 0 0 20px #00ffaa, 0 0 30px #00ffaa' }}>
          NEON TETRIS
        </h1>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Game Board */}
          <div className="relative">
            <div 
              className="relative rounded-xl overflow-hidden"
              style={{ 
                width: boardWidth + 4,
                height: boardHeight + 4,
                background: 'linear-gradient(135deg, rgba(0, 255, 170, 0.1), rgba(0, 255, 170, 0.05))',
                boxShadow: '0 0 20px rgba(0, 255, 170, 0.3), 0 0 40px rgba(0, 255, 170, 0.2), inset 0 0 20px rgba(0, 255, 170, 0.1)',
                border: '2px solid rgba(0, 255, 170, 0.5)'
              }}
            >
              <div style={{ width: boardWidth, height: boardHeight, position: 'relative', margin: '2px' }}>
                {displayBoard.map((row, y) =>
                  row.map((cell, x) => {
                    const isGhost = cell?.startsWith('ghost-');
                    const color = isGhost ? cell!.replace('ghost-', '') : cell;
                    return (
                      <div
                        key={`${y}-${x}`}
                        style={{
                          position: 'absolute',
                          left: x * CELL_SIZE,
                          top: y * CELL_SIZE,
                          width: CELL_SIZE - 1,
                          height: CELL_SIZE - 1,
                          backgroundColor: color
                            ? isGhost
                              ? 'transparent'
                              : color
                            : 'rgba(0, 255, 170, 0.03)',
                          border: color
                            ? isGhost
                              ? `1px dashed ${color}30`
                              : `1px solid ${color}`
                            : '1px solid rgba(0, 255, 170, 0.08)',
                          boxShadow: color && !isGhost ? `0 0 8px ${color}, 0 0 15px ${color}80, inset 0 0 5px ${color}40` : 'none',
                          opacity: isGhost ? 0.25 : 1,
                          borderRadius: '2px',
                          transition: 'all 0.1s ease'
                        }}
                      />
                    );
                  })
                )}

                {/* Particles */}
                {particles.map(p => (
                  <div
                    key={p.id}
                    style={{
                      position: 'absolute',
                      left: p.x,
                      top: p.y,
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.color,
                      boxShadow: `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 5}px ${p.color}`,
                      borderRadius: '50%',
                      opacity: p.life,
                      pointerEvents: 'none',
                    }}
                  />
                ))}

                {/* Start screen */}
                {!isStarted && !gameOver && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
                    <h2 className="text-4xl font-black text-[#00ffaa] mb-6" style={{ textShadow: '0 0 15px #00ffaa, 0 0 30px #00ffaa, 0 0 45px #00ffaa' }}>
                      NEON TETRIS
                    </h2>
                    <button
                      onClick={startNewGame}
                      className="px-10 py-5 bg-transparent border-2 border-[#00ffaa] text-[#00ffaa] rounded-xl font-bold text-xl hover:bg-[#00ffaa]/20 transition-all duration-300 hover:scale-105"
                      style={{ boxShadow: '0 0 20px #00ffaa, 0 0 40px #00ffaa40' }}
                    >
                      START GAME
                    </button>
                    <p className="text-white/50 text-sm mt-6">Press ENTER or click to start</p>
                  </div>
                )}

                {/* Game Over */}
                {gameOver && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
                    <h2 className="text-4xl font-black text-[#ff0066] mb-4" style={{ textShadow: '0 0 15px #ff0066, 0 0 30px #ff0066, 0 0 45px #ff0066' }}>
                      GAME OVER
                    </h2>
                    <p className="text-white text-2xl mb-2">Score: {score}</p>
                    <p className="text-white/70 text-sm mb-6">Time: {formatTime(stats.timePlayed)}</p>
                    <button
                      onClick={startNewGame}
                      className="px-10 py-5 bg-transparent border-2 border-[#ff0066] text-[#ff0066] rounded-xl font-bold text-xl hover:bg-[#ff0066]/20 transition-all duration-300 hover:scale-105"
                      style={{ boxShadow: '0 0 20px #ff0066, 0 0 40px #ff006640' }}
                    >
                      PLAY AGAIN
                    </button>
                  </div>
                )}

                {/* Pause */}
                {isPaused && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
                    <h2 className="text-4xl font-black text-[#ffff00]" style={{ textShadow: '0 0 15px #ffff00, 0 0 30px #ffff00, 0 0 45px #ffff00' }}>
                      PAUSED
                    </h2>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Ajustado para mesma altura */}
          <div className="flex flex-col gap-3" style={{ width: boardWidth }}>
            {/* Score & Combo */}
            <div className="border-2 border-[#00ffaa] rounded-xl p-4 bg-black/50 backdrop-blur-sm" style={{ boxShadow: '0 0 15px rgba(0, 255, 170, 0.3)' }}>
              <div className="text-[#00ffaa] text-xs mb-1 tracking-wider">SCORE</div>
              <div className="text-white text-3xl font-black">{score.toLocaleString()}</div>
              {combo > 1 && (
                <div className="text-[#ffff00] text-lg font-bold mt-2 animate-pulse" style={{ textShadow: '0 0 10px #ffff00, 0 0 20px #ffff00' }}>
                  🔥 COMBO x{combo}!
                </div>
              )}
            </div>

            {/* Level & Lines */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-[#ff00ff] rounded-xl p-3 bg-black/50 backdrop-blur-sm" style={{ boxShadow: '0 0 10px rgba(255, 0, 255, 0.3)' }}>
                <div className="text-[#ff00ff] text-xs mb-1 tracking-wider">LEVEL</div>
                <div className="text-white text-2xl font-bold">{level}</div>
              </div>
              <div className="border-2 border-[#00aaff] rounded-xl p-3 bg-black/50 backdrop-blur-sm" style={{ boxShadow: '0 0 10px rgba(0, 170, 255, 0.3)' }}>
                <div className="text-[#00aaff] text-xs mb-1 tracking-wider">LINES</div>
                <div className="text-white text-2xl font-bold">{lines}</div>
              </div>
            </div>

            {/* Hold Piece */}
            <div className="border-2 border-[#ff6600] rounded-xl p-3 bg-black/50 backdrop-blur-sm" style={{ boxShadow: '0 0 10px rgba(255, 102, 0, 0.3)' }}>
              <div className="text-[#ff6600] text-xs mb-2 tracking-wider">HOLD (C)</div>
              {holdPiece ? (
                <div className="flex justify-center py-2">
                  <div style={{ width: 4 * 18, height: 4 * 18, position: 'relative' }}>
                    {holdPiece.shape.map((row, y) =>
                      row.map((cell, x) =>
                        cell ? (
                          <div
                            key={`hold-${y}-${x}`}
                            style={{
                              position: 'absolute',
                              left: x * 18,
                              top: y * 18,
                              width: 17,
                              height: 17,
                              backgroundColor: holdPiece.color,
                              border: `1px solid ${holdPiece.color}`,
                              boxShadow: `0 0 8px ${holdPiece.color}, 0 0 15px ${holdPiece.color}80`,
                              borderRadius: '2px',
                            }}
                          />
                        ) : null
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-white/30 text-xs text-center py-4">Empty</div>
              )}
            </div>

            {/* Next Pieces */}
            <div className="border-2 border-[#00ff00] rounded-xl p-3 bg-black/50 backdrop-blur-sm" style={{ boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)' }}>
              <div className="text-[#00ff00] text-xs mb-2 tracking-wider">NEXT</div>
              <div className="flex justify-around">
                {nextPieces.map((piece, idx) => (
                  <div key={idx} style={{ opacity: 1 - idx * 0.25 }}>
                    <div style={{ width: 4 * 15, height: 4 * 15, position: 'relative' }}>
                      {piece.shape.map((row, y) =>
                        row.map((cell, x) =>
                          cell ? (
                            <div
                              key={`next-${idx}-${y}-${x}`}
                              style={{
                                position: 'absolute',
                                left: x * 15,
                                top: y * 15,
                                width: 14,
                                height: 14,
                                backgroundColor: piece.color,
                                border: `1px solid ${piece.color}`,
                                boxShadow: `0 0 5px ${piece.color}, 0 0 10px ${piece.color}80`,
                                borderRadius: '2px',
                              }}
                            />
                          ) : null
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="border-2 border-[#00ffaa]/50 rounded-xl p-3 bg-black/50 backdrop-blur-sm">
              <div className="text-[#00ffaa] text-xs mb-2 tracking-wider">STATISTICS</div>
              <div className="text-white/70 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span>Pieces:</span>
                  <span className="text-white font-bold">{stats.piecesPlaced}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tetris:</span>
                  <span className="text-white font-bold">{stats.tetrisCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Combo:</span>
                  <span className="text-white font-bold">{maxCombo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="text-white font-bold">{formatTime(stats.timePlayed)}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="border-2 border-[#00ffaa]/50 rounded-xl p-3 bg-black/50 backdrop-blur-sm">
              <div className="text-[#00ffaa] text-xs mb-2 tracking-wider">CONTROLS</div>
              <div className="text-white/70 text-xs space-y-1">
                <div className="flex justify-between"><span>← →</span><span>Move</span></div>
                <div className="flex justify-between"><span>↑</span><span>Rotate</span></div>
                <div className="flex justify-between"><span>↓</span><span>Soft drop</span></div>
                <div className="flex justify-between"><span>SPACE</span><span>Hard drop</span></div>
                <div className="flex justify-between"><span>C</span><span>Hold</span></div>
                <div className="flex justify-between"><span>P</span><span>Pause</span></div>
                <div className="flex justify-between"><span>M</span><span>Sound</span></div>
              </div>
            </div>

            {/* Sound toggle */}
            <button
              onClick={() => {
                soundEnabled = !soundEnabled;
                setSoundOn(soundEnabled);
              }}
              className="border-2 border-[#ffff00] rounded-xl p-3 text-[#ffff00] font-bold hover:bg-[#ffff00]/20 transition-all text-sm backdrop-blur-sm"
              style={{ boxShadow: soundOn ? '0 0 15px #ffff00, 0 0 30px #ffff0040' : 'none' }}
            >
              {soundOn ? '🔊 SOUND ON' : '🔇 SOUND OFF'}
            </button>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="lg:hidden flex flex-col gap-3 mt-4 w-full" style={{ maxWidth: boardWidth }}>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={hold} className="h-16 border-2 border-[#ff6600] text-[#ff6600] text-sm font-bold rounded-xl active:bg-[#ff6600]/20 transition-all" style={{ boxShadow: '0 0 10px rgba(255, 102, 0, 0.3)' }}>
              HOLD
            </button>
            <button onClick={rotate} className="h-16 border-2 border-[#ff00ff] text-[#ff00ff] text-3xl rounded-xl active:bg-[#ff00ff]/20 transition-all" style={{ boxShadow: '0 0 10px rgba(255, 0, 255, 0.3)' }}>
              ↻
            </button>
            <div></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={moveLeft} className="h-16 border-2 border-[#00ffaa] text-[#00ffaa] text-3xl rounded-xl active:bg-[#00ffaa]/20 transition-all" style={{ boxShadow: '0 0 10px rgba(0, 255, 170, 0.3)' }}>
              ←
            </button>
            <button onClick={moveDown} className="h-16 border-2 border-[#00ffaa] text-[#00ffaa] text-3xl rounded-xl active:bg-[#00ffaa]/20 transition-all" style={{ boxShadow: '0 0 10px rgba(0, 255, 170, 0.3)' }}>
              ↓
            </button>
            <button onClick={moveRight} className="h-16 border-2 border-[#00ffaa] text-[#00ffaa] text-3xl rounded-xl active:bg-[#00ffaa]/20 transition-all" style={{ boxShadow: '0 0 10px rgba(0, 255, 170, 0.3)' }}>
              →
            </button>
          </div>
          <button onClick={hardDrop} className="h-14 border-2 border-[#ffff00] text-[#ffff00] font-bold rounded-xl active:bg-[#ffff00]/20 transition-all" style={{ boxShadow: '0 0 10px rgba(255, 255, 0, 0.3)' }}>
            ⬇ DROP
          </button>
        </div>
      </div>
    </div>
  );
}
