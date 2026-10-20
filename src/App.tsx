import { useState, useEffect, useCallback, useRef } from 'react';
import {
  THEMES, ThemeName, Theme,
  GAME_MODES, GameMode,
  ACHIEVEMENTS, Achievement, AchievementStats,
  checkNewAchievements, getAllAchievementsWithStatus,
  getLeaderboard, addToLeaderboard, LeaderboardEntry,
  BackgroundMusic, GestureController, vibration,
  ReplayAction, ReplayData, saveReplay,
} from './game-systems';

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
  achievement: () => {
    [523, 659, 784, 1047, 1319].forEach((note, i) => {
      setTimeout(() => playTone(note, 0.2, 'sine', 0.25), i * 100);
    });
  },
};

// Tetris constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 28;

const TETROMINOES: { [key: string]: { shape: number[][]; colorKey: keyof Theme['colors'] } } = {
  I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], colorKey: 'I' },
  O: { shape: [[1,1],[1,1]], colorKey: 'O' },
  T: { shape: [[0,1,0],[1,1,1],[0,0,0]], colorKey: 'T' },
  S: { shape: [[0,1,1],[1,1,0],[0,0,0]], colorKey: 'S' },
  Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], colorKey: 'Z' },
  J: { shape: [[1,0,0],[1,1,1],[0,0,0]], colorKey: 'J' },
  L: { shape: [[0,0,1],[1,1,1],[0,0,0]], colorKey: 'L' },
};

const TETROMINO_KEYS = Object.keys(TETROMINOES);

type Board = (string | null)[][];
type Piece = {
  shape: number[][];
  color: string;
  type: string;
  x: number;
  y: number;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
};

function createEmptyBoard(): Board {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
}

function getRandomPiece(theme: Theme): Piece {
  const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
  const t = TETROMINOES[key];
  return {
    shape: t.shape.map(row => [...row]),
    color: theme.colors[t.colorKey],
    type: key,
    x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(t.shape[0].length / 2),
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

// ============ MAIN APP ============
type Screen = 'menu' | 'game' | 'achievements' | 'leaderboard' | 'settings' | 'gameover';

export default function App() {
  // Theme & Mode
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    return (localStorage.getItem('neon-tetris-theme') as ThemeName) || 'cyberpunk';
  });
  const [gameMode, setGameMode] = useState<GameMode>('marathon');
  const theme = THEMES[themeName];

  // Game state
  const [screen, setScreen] = useState<Screen>('menu');
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Piece>(getRandomPiece(theme));
  const [nextPieces, setNextPieces] = useState<Piece[]>([]);
  const [holdPiece, setHoldPiece] = useState<Piece | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shake, setShake] = useState(false);
  const [notification, setNotification] = useState<Achievement | null>(null);
  const [vibrationOn, setVibrationOn] = useState(true);

  // Stats
  const [stats, setStats] = useState<AchievementStats>({
    piecesPlaced: 0, linesCleared: 0, tetrisCount: 0,
    timePlayed: 0, perfectClears: 0, tSpins: 0,
    gamesPlayed: 0, totalScore: 0, maxCombo: 0, level: 1,
  });

  // Refs
  const gameLoopRef = useRef<number | null>(null);
  const lastDropRef = useRef<number>(0);
  const particleIdRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const musicRef = useRef<BackgroundMusic>(new BackgroundMusic());
  const gestureRef = useRef<GestureController>(new GestureController());
  const boardRef = useRef<HTMLDivElement>(null);
  const replayActionsRef = useRef<ReplayAction[]>([]);
  const gameStartTimeRef = useRef<number>(0);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('neon-tetris-theme', themeName);
  }, [themeName]);

  const getDropSpeed = useCallback(() => {
    return Math.max(80, 800 - (level - 1) * 70);
  }, [level]);

  const createParticles = (rows: number[], color: string) => {
    const newParticles: Particle[] = [];
    rows.forEach(row => {
      for (let i = 0; i < 30; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: Math.random() * BOARD_WIDTH * CELL_SIZE,
          y: row * CELL_SIZE + CELL_SIZE / 2,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.5) * 14,
          color,
          life: 1,
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
        prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.5,
          life: p.life - 0.025,
        })).filter(p => p.life > 0)
      );
    }, 30);
    return () => clearInterval(interval);
  }, [particles.length > 0]);

  // Time tracking
  useEffect(() => {
    if (screen !== 'game' || gameOver || isPaused) return;
    const interval = setInterval(() => {
      setStats(prev => ({ ...prev, timePlayed: prev.timePlayed + 1 }));
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, gameOver, isPaused]);

  // Ultra mode timer
  useEffect(() => {
    if (screen !== 'game' || gameOver || isPaused || gameMode !== 'ultra') return;
    if (stats.timePlayed >= (GAME_MODES.ultra.timeLimit || 120)) {
      endGame();
    }
  }, [stats.timePlayed, screen, gameOver, isPaused, gameMode]);

  // Check achievements
  const checkAchievements = useCallback((currentStats: AchievementStats) => {
    const newAchievements = checkNewAchievements(currentStats);
    if (newAchievements.length > 0) {
      setNotification(newAchievements[0]);
      sounds.achievement();
      if (vibrationOn) vibration.heavy();
      setTimeout(() => setNotification(null), 3000);
    }
  }, [vibrationOn]);

  // Start game
  const startGame = useCallback((mode: GameMode) => {
    initAudio();
    sounds.start();
    if (vibrationOn) vibration.light();
    
    setGameMode(mode);
    setBoard(createEmptyBoard());
    const first = getRandomPiece(theme);
    setCurrentPiece(first);
    setNextPieces([getRandomPiece(theme), getRandomPiece(theme), getRandomPiece(theme)]);
    setHoldPiece(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setLevel(1);
    setCombo(0);
    setMaxCombo(0);
    setGameOver(false);
    setIsPaused(false);
    setParticles([]);
    setStats(prev => ({ ...prev, piecesPlaced: 0, linesCleared: 0, tetrisCount: 0, timePlayed: 0, perfectClears: 0, tSpins: 0, gamesPlayed: prev.gamesPlayed + 1, totalScore: prev.totalScore }));
    setScreen('game');
    startTimeRef.current = Date.now();
    gameStartTimeRef.current = Date.now();
    replayActionsRef.current = [];

    // Start music
    if (musicOn) {
      musicRef.current.setEnabled(true);
      musicRef.current.start(mode);
    }
  }, [theme, musicOn, vibrationOn]);

  // End game
  const endGame = useCallback(() => {
    setGameOver(true);
    sounds.gameOver();
    if (vibrationOn) vibration.gameOver();
    musicRef.current.stop();

    // Save replay
    const replay: ReplayData = {
      actions: replayActionsRef.current,
      startTime: gameStartTimeRef.current,
      mode: gameMode,
      finalScore: score,
    };
    saveReplay(replay);

    // Add to leaderboard
    const entry: LeaderboardEntry = {
      name: 'Player',
      score,
      mode: gameMode,
      level,
      lines,
      time: stats.timePlayed,
      date: new Date().toISOString(),
    };
    addToLeaderboard(entry);

    // Update total score
    setStats(prev => {
      const newStats = { ...prev, totalScore: prev.totalScore + score };
      checkAchievements(newStats);
      return newStats;
    });

    setTimeout(() => setScreen('gameover'), 500);
  }, [gameMode, score, level, lines, stats.timePlayed, vibrationOn, checkAchievements]);

  const lockPiece = useCallback(() => {
    const newBoard = placePiece(board, currentPiece);
    const { newBoard: clearedBoard, linesCleared, clearedRows } = clearLines(newBoard);

    // Record action
    replayActionsRef.current.push({
      type: 'lock',
      time: Date.now() - gameStartTimeRef.current,
      pieceType: currentPiece.type,
      x: currentPiece.x,
      y: currentPiece.y,
    });

    if (linesCleared > 0) {
      createParticles(clearedRows, currentPiece.color);
      
      if (linesCleared === 4) {
        sounds.tetris();
        setShake(true);
        setTimeout(() => setShake(false), 300);
        if (vibrationOn) vibration.tetris();
        setStats(prev => ({ ...prev, tetrisCount: prev.tetrisCount + 1 }));
      } else {
        sounds.lineClear();
        if (vibrationOn) vibration.medium();
      }

      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      if (newCombo > 1) sounds.combo(newCombo);

      const points = [0, 100, 300, 500, 800];
      const comboBonus = newCombo > 1 ? newCombo * 50 : 0;
      const newScore = score + (points[linesCleared] * level) + comboBonus;
      setScore(newScore);

      const newLines = lines + linesCleared;
      const newLevel = Math.floor(newLines / 10) + 1;
      if (newLevel > level) {
        sounds.levelUp();
        if (vibrationOn) vibration.medium();
      }
      setLines(newLines);
      setLevel(newLevel);

      setStats(prev => {
        const updated = { ...prev, linesCleared: newLines, totalScore: prev.totalScore + (points[linesCleared] * level) + comboBonus };
        checkAchievements(updated);
        return updated;
      });

      // Check sprint mode win
      if (gameMode === 'sprint' && GAME_MODES.sprint.lineTarget && newLines >= GAME_MODES.sprint.lineTarget) {
        endGame();
        return;
      }
    } else {
      setCombo(0);
    }

    setBoard(clearedBoard);
    setStats(prev => ({ ...prev, piecesPlaced: prev.piecesPlaced + 1 }));

    const newCurrentPiece = nextPieces[0];
    const newNextPieces = [...nextPieces.slice(1), getRandomPiece(theme)];

    if (!isValidPosition(clearedBoard, newCurrentPiece.shape, newCurrentPiece.x, newCurrentPiece.y)) {
      endGame();
      return;
    }

    setCurrentPiece(newCurrentPiece);
    setNextPieces(newNextPieces);
    setCanHold(true);
  }, [board, currentPiece, nextPieces, level, combo, maxCombo, theme, gameMode, lines, score, vibrationOn, checkAchievements, endGame]);

  const moveDown = useCallback(() => {
    if (gameOver || isPaused || screen !== 'game') return;
    if (isValidPosition(board, currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
      setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      lockPiece();
    }
  }, [board, currentPiece, gameOver, isPaused, screen, lockPiece]);

  const moveLeft = useCallback(() => {
    if (gameOver || isPaused || screen !== 'game') return;
    if (isValidPosition(board, currentPiece.shape, currentPiece.x - 1, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, x: prev.x - 1 }));
      sounds.move();
      if (vibrationOn) vibration.light();
      replayActionsRef.current.push({ type: 'move', direction: 'left', time: Date.now() - gameStartTimeRef.current });
    }
  }, [board, currentPiece, gameOver, isPaused, screen, vibrationOn]);

  const moveRight = useCallback(() => {
    if (gameOver || isPaused || screen !== 'game') return;
    if (isValidPosition(board, currentPiece.shape, currentPiece.x + 1, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, x: prev.x + 1 }));
      sounds.move();
      if (vibrationOn) vibration.light();
      replayActionsRef.current.push({ type: 'move', direction: 'right', time: Date.now() - gameStartTimeRef.current });
    }
  }, [board, currentPiece, gameOver, isPaused, screen, vibrationOn]);

  const rotate = useCallback(() => {
    if (gameOver || isPaused || screen !== 'game') return;
    const rotated = rotatePiece(currentPiece.shape);
    if (isValidPosition(board, rotated, currentPiece.x, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated }));
      sounds.rotate();
      if (vibrationOn) vibration.light();
      replayActionsRef.current.push({ type: 'rotate', time: Date.now() - gameStartTimeRef.current });
    } else if (isValidPosition(board, rotated, currentPiece.x - 1, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated, x: prev.x - 1 }));
      sounds.rotate();
    } else if (isValidPosition(board, rotated, currentPiece.x + 1, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated, x: prev.x + 1 }));
      sounds.rotate();
    }
  }, [board, currentPiece, gameOver, isPaused, screen, vibrationOn]);

  const hardDrop = useCallback(() => {
    if (gameOver || isPaused || screen !== 'game') return;
    let dropY = currentPiece.y;
    while (isValidPosition(board, currentPiece.shape, currentPiece.x, dropY + 1)) {
      dropY++;
    }
    setScore(prev => prev + (dropY - currentPiece.y) * 2);
    setCurrentPiece(prev => ({ ...prev, y: dropY }));
    sounds.drop();
    if (vibrationOn) vibration.medium();
    replayActionsRef.current.push({ type: 'hardDrop', time: Date.now() - gameStartTimeRef.current });
    setTimeout(() => lockPiece(), 0);
  }, [board, currentPiece, gameOver, isPaused, screen, lockPiece, vibrationOn]);

  const hold = useCallback(() => {
    if (gameOver || isPaused || screen !== 'game' || !canHold) return;
    sounds.hold();
    if (vibrationOn) vibration.light();
    replayActionsRef.current.push({ type: 'hold', time: Date.now() - gameStartTimeRef.current });

    if (holdPiece) {
      const tempPiece = holdPiece;
      setHoldPiece({ ...currentPiece, x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(currentPiece.shape[0].length / 2), y: 0 });
      setCurrentPiece({ ...tempPiece, x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(tempPiece.shape[0].length / 2), y: 0 });
    } else {
      setHoldPiece({ ...currentPiece, x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(currentPiece.shape[0].length / 2), y: 0 });
      const newCurrentPiece = nextPieces[0];
      const newNextPieces = [...nextPieces.slice(1), getRandomPiece(theme)];
      setCurrentPiece(newCurrentPiece);
      setNextPieces(newNextPieces);
    }
    setCanHold(false);
  }, [gameOver, isPaused, screen, canHold, holdPiece, currentPiece, nextPieces, theme, vibrationOn]);

  // Game loop
  useEffect(() => {
    if (screen !== 'game' || gameOver || isPaused) {
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
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [screen, gameOver, isPaused, moveDown, getDropSpeed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'game') return;
      if (e.key === 'p' || e.key === 'P') {
        setIsPaused(prev => !prev);
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        soundEnabled = !soundEnabled;
        setSoundOn(soundEnabled);
        return;
      }
      if (e.key === 'c' || e.key === 'C') { hold(); return; }
      if (e.key === 'Escape') {
        setScreen('menu');
        musicRef.current.stop();
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
  }, [moveLeft, moveRight, moveDown, rotate, hardDrop, hold, screen]);

  // Gestures
  useEffect(() => {
    if (!boardRef.current) return;
    const el = boardRef.current;
    gestureRef.current.attach(el, {
      onSwipeLeft: moveLeft,
      onSwipeRight: moveRight,
      onSwipeDown: hardDrop,
      onSwipeUp: rotate,
      onTap: rotate,
      onLongPress: hold,
    });
    return () => gestureRef.current.detach(el);
  }, [moveLeft, moveRight, hardDrop, rotate, hold]);

  // Render board
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    if (screen === 'game' && !gameOver) {
      const ghostY = getGhostPosition(board, currentPiece);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const boardWidth = BOARD_WIDTH * CELL_SIZE;
  const boardHeight = BOARD_HEIGHT * CELL_SIZE;

  // ============ RENDER ============
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 overflow-auto relative"
      style={{ background: theme.bgGradient }}
    >
      {/* Background grid */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `linear-gradient(${theme.accent}22 1px, transparent 1px), linear-gradient(90deg, ${theme.accent}22 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl border-2 animate-bounce"
          style={{
            background: 'rgba(0,0,0,0.9)',
            borderColor: theme.accent,
            boxShadow: `0 0 20px ${theme.accent}, 0 0 40px ${theme.accent}40`,
          }}>
          <div className="text-2xl mb-1">{notification.icon}</div>
          <div className="text-white font-bold text-sm">{notification.name}</div>
          <div className="text-white/70 text-xs">{notification.description}</div>
        </div>
      )}

      {/* MENU SCREEN */}
      {screen === 'menu' && (
        <div className="flex flex-col items-center gap-6 max-w-md w-full">
          <h1 className="text-5xl font-black tracking-wider text-center" style={{
            color: theme.accent,
            textShadow: `0 0 15px ${theme.accent}, 0 0 30px ${theme.accent}, 0 0 45px ${theme.accent}`,
          }}>
            NEON TETRIS
          </h1>
          <p className="text-white/50 text-sm">Ultimate Edition</p>

          {/* Game Modes */}
          <div className="w-full space-y-3">
            <div className="text-center text-white/70 text-sm tracking-wider mb-2">SELECT MODE</div>
            {(Object.keys(GAME_MODES) as GameMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => startGame(mode)}
                className="w-full p-4 rounded-xl border-2 transition-all hover:scale-105 text-left"
                style={{
                  borderColor: theme.accent,
                  background: theme.panelBg,
                  boxShadow: `0 0 10px ${theme.accent}40`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{GAME_MODES[mode].icon}</span>
                  <div>
                    <div className="text-white font-bold">{GAME_MODES[mode].name}</div>
                    <div className="text-white/60 text-xs">{GAME_MODES[mode].description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Menu buttons */}
          <div className="w-full grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => setScreen('achievements')}
              className="p-3 rounded-xl border-2 transition-all hover:scale-105"
              style={{ borderColor: theme.accent2, background: theme.panelBg }}
            >
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-white text-sm font-bold">Achievements</div>
            </button>
            <button
              onClick={() => setScreen('leaderboard')}
              className="p-3 rounded-xl border-2 transition-all hover:scale-105"
              style={{ borderColor: theme.accent3, background: theme.panelBg }}
            >
              <div className="text-2xl mb-1">📊</div>
              <div className="text-white text-sm font-bold">Leaderboard</div>
            </button>
            <button
              onClick={() => setScreen('settings')}
              className="p-3 rounded-xl border-2 transition-all hover:scale-105 col-span-2"
              style={{ borderColor: theme.accent, background: theme.panelBg }}
            >
              <div className="text-2xl mb-1">⚙️</div>
              <div className="text-white text-sm font-bold">Settings</div>
            </button>
          </div>
        </div>
      )}

      {/* GAME SCREEN */}
      {screen === 'game' && (
        <div className={`flex flex-col lg:flex-row items-start gap-4 ${shake ? 'animate-pulse' : ''}`}>
          {/* Board */}
          <div ref={boardRef} className="relative touch-none select-none">
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                width: boardWidth + 4,
                height: boardHeight + 4,
                background: theme.boardBg,
                boxShadow: theme.boardGlow,
                border: `2px solid ${theme.boardBorder}`,
              }}
            >
              <div style={{ width: boardWidth, height: boardHeight, position: 'relative', margin: '2px' }}>
                {renderBoard().map((row, y) =>
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
                            ? isGhost ? 'transparent' : color
                            : theme.cellEmpty,
                          border: color
                            ? isGhost ? `1px dashed ${color}30` : `1px solid ${color}`
                            : `1px solid ${theme.cellBorder}`,
                          boxShadow: color && !isGhost && theme.pieceGlow !== 'none'
                            ? theme.pieceGlow === 'intense'
                              ? `0 0 8px ${color}, 0 0 15px ${color}80, inset 0 0 5px ${color}40`
                              : `0 0 5px ${color}80`
                            : 'none',
                          opacity: isGhost ? theme.ghostOpacity : 1,
                          borderRadius: '2px',
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
                      left: p.x, top: p.y,
                      width: p.size, height: p.size,
                      backgroundColor: p.color,
                      boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                      borderRadius: '50%',
                      opacity: p.life,
                      pointerEvents: 'none',
                    }}
                  />
                ))}

                {/* Pause overlay */}
                {isPaused && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
                    <h2 className="text-4xl font-black mb-4" style={{ color: theme.accent2, textShadow: `0 0 15px ${theme.accent2}` }}>
                      PAUSED
                    </h2>
                    <button
                      onClick={() => setIsPaused(false)}
                      className="px-6 py-3 border-2 rounded-xl font-bold"
                      style={{ borderColor: theme.accent, color: theme.accent }}
                    >
                      RESUME
                    </button>
                    <button
                      onClick={() => { setScreen('menu'); musicRef.current.stop(); }}
                      className="px-6 py-3 border-2 rounded-xl font-bold mt-2"
                      style={{ borderColor: theme.accent3, color: theme.accent3 }}
                    >
                      QUIT
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mode indicator */}
            <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.7)', color: theme.accent, border: `1px solid ${theme.accent}40` }}>
              {GAME_MODES[gameMode].icon} {GAME_MODES[gameMode].name.toUpperCase()}
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-3" style={{ width: boardWidth }}>
            {/* Score */}
            <div className="border-2 rounded-xl p-3 backdrop-blur-sm" style={{ borderColor: theme.accent, background: theme.panelBg, boxShadow: `0 0 10px ${theme.accent}40` }}>
              <div className="text-xs tracking-wider" style={{ color: theme.accent }}>SCORE</div>
              <div className="text-white text-2xl font-black">{score.toLocaleString()}</div>
              {combo > 1 && (
                <div className="text-sm font-bold mt-1 animate-pulse" style={{ color: theme.accent2, textShadow: `0 0 10px ${theme.accent2}` }}>
                  🔥 COMBO x{combo}!
                </div>
              )}
              {gameMode === 'ultra' && (
                <div className="text-xs mt-1" style={{ color: theme.accent3 }}>
                  ⏱️ {(GAME_MODES.ultra.timeLimit || 120) - stats.timePlayed}s
                </div>
              )}
              {gameMode === 'sprint' && (
                <div className="text-xs mt-1" style={{ color: theme.accent3 }}>
                  🎯 {lines}/{GAME_MODES.sprint.lineTarget} lines
                </div>
              )}
            </div>

            {/* Level & Lines */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border-2 rounded-xl p-2 backdrop-blur-sm" style={{ borderColor: theme.accent2, background: theme.panelBg }}>
                <div className="text-xs" style={{ color: theme.accent2 }}>LEVEL</div>
                <div className="text-white text-xl font-bold">{level}</div>
              </div>
              <div className="border-2 rounded-xl p-2 backdrop-blur-sm" style={{ borderColor: theme.accent3, background: theme.panelBg }}>
                <div className="text-xs" style={{ color: theme.accent3 }}>LINES</div>
                <div className="text-white text-xl font-bold">{lines}</div>
              </div>
            </div>

            {/* Hold & Next */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border-2 rounded-xl p-2 backdrop-blur-sm" style={{ borderColor: theme.colors.L, background: theme.panelBg }}>
                <div className="text-xs mb-1" style={{ color: theme.colors.L }}>HOLD (C)</div>
                {holdPiece ? (
                  <div className="flex justify-center">
                    <div style={{ width: 4 * 12, height: 4 * 12, position: 'relative' }}>
                      {holdPiece.shape.map((row, y) =>
                        row.map((cell, x) => cell ? (
                          <div key={`h-${y}-${x}`} style={{
                            position: 'absolute', left: x * 12, top: y * 12,
                            width: 11, height: 11, backgroundColor: holdPiece.color,
                            border: `1px solid ${holdPiece.color}`, borderRadius: '1px',
                          }} />
                        ) : null)
                      )}
                    </div>
                  </div>
                ) : <div className="text-white/30 text-xs text-center py-2">Empty</div>}
              </div>
              <div className="border-2 rounded-xl p-2 backdrop-blur-sm" style={{ borderColor: theme.colors.S, background: theme.panelBg }}>
                <div className="text-xs mb-1" style={{ color: theme.colors.S }}>NEXT</div>
                <div className="flex justify-center">
                  <div style={{ width: 4 * 12, height: 4 * 12, position: 'relative' }}>
                    {nextPieces[0]?.shape.map((row, y) =>
                      row.map((cell, x) => cell ? (
                        <div key={`n-${y}-${x}`} style={{
                          position: 'absolute', left: x * 12, top: y * 12,
                          width: 11, height: 11, backgroundColor: nextPieces[0].color,
                          border: `1px solid ${nextPieces[0].color}`, borderRadius: '1px',
                        }} />
                      ) : null)
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="border-2 rounded-xl p-2 backdrop-blur-sm text-xs" style={{ borderColor: `${theme.accent}50`, background: theme.panelBg }}>
              <div className="grid grid-cols-2 gap-1" style={{ color: theme.textSecondary }}>
                <div>Pieces: <span className="text-white font-bold">{stats.piecesPlaced}</span></div>
                <div>Tetris: <span className="text-white font-bold">{stats.tetrisCount}</span></div>
                <div>Combo: <span className="text-white font-bold">{maxCombo}</span></div>
                <div>Time: <span className="text-white font-bold">{formatTime(stats.timePlayed)}</span></div>
              </div>
            </div>

            {/* Controls */}
            <div className="border-2 rounded-xl p-2 backdrop-blur-sm text-xs hidden lg:block" style={{ borderColor: `${theme.accent}50`, background: theme.panelBg }}>
              <div style={{ color: theme.accent }} className="mb-1">CONTROLS</div>
              <div className="grid grid-cols-2 gap-1" style={{ color: theme.textSecondary }}>
                <div>← → Move</div>
                <div>↑ Rotate</div>
                <div>↓ Soft drop</div>
                <div>SPACE Hard drop</div>
                <div>C Hold</div>
                <div>P Pause</div>
              </div>
            </div>

            {/* Mobile controls */}
            <div className="lg:hidden flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={hold} className="h-14 border-2 rounded-xl font-bold text-sm active:opacity-50" style={{ borderColor: theme.colors.L, color: theme.colors.L }}>HOLD</button>
                <button onClick={rotate} className="h-14 border-2 rounded-xl text-2xl active:opacity-50" style={{ borderColor: theme.accent2, color: theme.accent2 }}>↻</button>
                <button onClick={() => setIsPaused(true)} className="h-14 border-2 rounded-xl text-sm active:opacity-50" style={{ borderColor: theme.accent3, color: theme.accent3 }}>⏸</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={moveLeft} className="h-14 border-2 rounded-xl text-2xl active:opacity-50" style={{ borderColor: theme.accent, color: theme.accent }}>←</button>
                <button onClick={moveDown} className="h-14 border-2 rounded-xl text-2xl active:opacity-50" style={{ borderColor: theme.accent, color: theme.accent }}>↓</button>
                <button onClick={moveRight} className="h-14 border-2 rounded-xl text-2xl active:opacity-50" style={{ borderColor: theme.accent, color: theme.accent }}>→</button>
              </div>
              <button onClick={hardDrop} className="h-12 border-2 rounded-xl font-bold active:opacity-50" style={{ borderColor: theme.accent2, color: theme.accent2 }}>⬇ DROP</button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {screen === 'gameover' && (
        <div className="flex flex-col items-center gap-4 max-w-md w-full">
          <h2 className="text-5xl font-black" style={{ color: theme.accent2, textShadow: `0 0 15px ${theme.accent2}, 0 0 30px ${theme.accent2}` }}>
            GAME OVER
          </h2>
          <div className="border-2 rounded-xl p-6 w-full backdrop-blur-sm" style={{ borderColor: theme.accent, background: theme.panelBg }}>
            <div className="text-center mb-4">
              <div className="text-white/60 text-sm">Final Score</div>
              <div className="text-white text-4xl font-black">{score.toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-white/60">Mode:</span> <span className="text-white font-bold">{GAME_MODES[gameMode].name}</span></div>
              <div><span className="text-white/60">Level:</span> <span className="text-white font-bold">{level}</span></div>
              <div><span className="text-white/60">Lines:</span> <span className="text-white font-bold">{lines}</span></div>
              <div><span className="text-white/60">Time:</span> <span className="text-white font-bold">{formatTime(stats.timePlayed)}</span></div>
              <div><span className="text-white/60">Tetris:</span> <span className="text-white font-bold">{stats.tetrisCount}</span></div>
              <div><span className="text-white/60">Max Combo:</span> <span className="text-white font-bold">{maxCombo}</span></div>
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => startGame(gameMode)}
              className="flex-1 p-4 border-2 rounded-xl font-bold transition-all hover:scale-105"
              style={{ borderColor: theme.accent, color: theme.accent }}
            >
              PLAY AGAIN
            </button>
            <button
              onClick={() => setScreen('menu')}
              className="flex-1 p-4 border-2 rounded-xl font-bold transition-all hover:scale-105"
              style={{ borderColor: theme.accent3, color: theme.accent3 }}
            >
              MENU
            </button>
          </div>
        </div>
      )}

      {/* ACHIEVEMENTS SCREEN */}
      {screen === 'achievements' && (
        <div className="flex flex-col items-center gap-4 max-w-lg w-full">
          <h2 className="text-3xl font-black" style={{ color: theme.accent, textShadow: `0 0 15px ${theme.accent}` }}>
            🏆 ACHIEVEMENTS
          </h2>
          <div className="w-full space-y-2 max-h-[70vh] overflow-y-auto">
            {getAllAchievementsWithStatus().map(a => (
              <div
                key={a.id}
                className="p-3 rounded-xl border-2 flex items-center gap-3"
                style={{
                  borderColor: a.unlocked ? theme.accent : `${theme.accent}30`,
                  background: a.unlocked ? theme.panelBg : 'rgba(0,0,0,0.3)',
                  opacity: a.unlocked ? 1 : 0.5,
                }}
              >
                <div className="text-3xl">{a.icon}</div>
                <div className="flex-1">
                  <div className="text-white font-bold text-sm">{a.name}</div>
                  <div className="text-white/60 text-xs">{a.description}</div>
                </div>
                {a.unlocked && <div className="text-green-400 text-xl">✓</div>}
              </div>
            ))}
          </div>
          <button
            onClick={() => setScreen('menu')}
            className="px-6 py-3 border-2 rounded-xl font-bold"
            style={{ borderColor: theme.accent, color: theme.accent }}
          >
            BACK
          </button>
        </div>
      )}

      {/* LEADERBOARD SCREEN */}
      {screen === 'leaderboard' && (
        <div className="flex flex-col items-center gap-4 max-w-lg w-full">
          <h2 className="text-3xl font-black" style={{ color: theme.accent3, textShadow: `0 0 15px ${theme.accent3}` }}>
            📊 LEADERBOARD
          </h2>
          <div className="w-full space-y-2">
            {getLeaderboard().length === 0 ? (
              <div className="text-center text-white/50 p-8">No scores yet. Play a game!</div>
            ) : (
              getLeaderboard().map((entry, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border-2 flex items-center gap-3"
                  style={{ borderColor: theme.accent3, background: theme.panelBg }}
                >
                  <div className="text-2xl font-black w-8" style={{ color: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : theme.textSecondary }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-bold">{entry.score.toLocaleString()}</div>
                    <div className="text-white/60 text-xs">
                      {GAME_MODES[entry.mode].icon} {GAME_MODES[entry.mode].name} • Lvl {entry.level} • {entry.lines} lines
                    </div>
                  </div>
                  <div className="text-white/50 text-xs">{formatTime(entry.time)}</div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setScreen('menu')}
            className="px-6 py-3 border-2 rounded-xl font-bold"
            style={{ borderColor: theme.accent3, color: theme.accent3 }}
          >
            BACK
          </button>
        </div>
      )}

      {/* SETTINGS SCREEN */}
      {screen === 'settings' && (
        <div className="flex flex-col items-center gap-4 max-w-lg w-full">
          <h2 className="text-3xl font-black" style={{ color: theme.accent, textShadow: `0 0 15px ${theme.accent}` }}>
            ⚙️ SETTINGS
          </h2>

          {/* Theme */}
          <div className="w-full border-2 rounded-xl p-4" style={{ borderColor: theme.accent, background: theme.panelBg }}>
            <div className="text-white font-bold mb-3">THEME</div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(THEMES) as ThemeName[]).map(t => (
                <button
                  key={t}
                  onClick={() => setThemeName(t)}
                  className="p-3 rounded-lg border-2 transition-all"
                  style={{
                    borderColor: themeName === t ? THEMES[t].accent : `${THEMES[t].accent}40`,
                    background: THEMES[t].bgGradient,
                    boxShadow: themeName === t ? `0 0 10px ${THEMES[t].accent}` : 'none',
                  }}
                >
                  <div className="text-white text-xs font-bold">{THEMES[t].name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="w-full border-2 rounded-xl p-4 space-y-3" style={{ borderColor: theme.accent, background: theme.panelBg }}>
            <div className="text-white font-bold mb-2">AUDIO & EFFECTS</div>
            <button
              onClick={() => { soundEnabled = !soundEnabled; setSoundOn(soundEnabled); }}
              className="w-full p-3 rounded-lg border-2 flex justify-between items-center"
              style={{ borderColor: soundOn ? theme.accent : `${theme.accent}40` }}
            >
              <span className="text-white">Sound Effects</span>
              <span className="text-white font-bold">{soundOn ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={() => {
                const newState = !musicOn;
                setMusicOn(newState);
                musicRef.current.setEnabled(newState);
                if (!newState) musicRef.current.stop();
              }}
              className="w-full p-3 rounded-lg border-2 flex justify-between items-center"
              style={{ borderColor: musicOn ? theme.accent2 : `${theme.accent2}40` }}
            >
              <span className="text-white">Background Music</span>
              <span className="text-white font-bold">{musicOn ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={() => {
                const newState = !vibrationOn;
                setVibrationOn(newState);
                if (newState) vibration.enable();
              }}
              className="w-full p-3 rounded-lg border-2 flex justify-between items-center"
              style={{ borderColor: vibrationOn ? theme.accent3 : `${theme.accent3}40` }}
            >
              <span className="text-white">Vibration (Mobile)</span>
              <span className="text-white font-bold">{vibrationOn ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Gestures info */}
          <div className="w-full border-2 rounded-xl p-4" style={{ borderColor: theme.accent2, background: theme.panelBg }}>
            <div className="text-white font-bold mb-2">📱 MOBILE GESTURES</div>
            <div className="text-white/70 text-xs space-y-1">
              <div>• Swipe Left/Right: Move piece</div>
              <div>• Swipe Down: Hard drop</div>
              <div>• Tap: Rotate</div>
              <div>• Long Press: Hold piece</div>
            </div>
          </div>

          <button
            onClick={() => setScreen('menu')}
            className="px-6 py-3 border-2 rounded-xl font-bold"
            style={{ borderColor: theme.accent, color: theme.accent }}
          >
            BACK
          </button>
        </div>
      )}
    </div>
  );
}
