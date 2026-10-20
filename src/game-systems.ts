// ============================================
// GAME SYSTEMS - Temas, Conquistas, Modos, Música, Replay, Gestos
// ============================================

// ============ TEMAS ============
export type ThemeName = 'cyberpunk' | 'retro' | 'minimalist';

export interface Theme {
  name: string;
  bgGradient: string;
  boardBorder: string;
  boardGlow: string;
  boardBg: string;
  cellEmpty: string;
  cellBorder: string;
  ghostOpacity: number;
  pieceGlow: string;
  colors: {
    I: string;
    O: string;
    T: string;
    S: string;
    Z: string;
    J: string;
    L: string;
  };
  accent: string;
  accent2: string;
  accent3: string;
  textPrimary: string;
  textSecondary: string;
  panelBg: string;
  panelBorder: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  cyberpunk: {
    name: 'Cyberpunk',
    bgGradient: 'linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)',
    boardBorder: 'rgba(0, 255, 170, 0.5)',
    boardGlow: '0 0 20px rgba(0, 255, 170, 0.3), 0 0 40px rgba(0, 255, 170, 0.2)',
    boardBg: 'linear-gradient(135deg, rgba(0, 255, 170, 0.1), rgba(0, 255, 170, 0.05))',
    cellEmpty: 'rgba(0, 255, 170, 0.03)',
    cellBorder: 'rgba(0, 255, 170, 0.08)',
    ghostOpacity: 0.25,
    pieceGlow: 'intense',
    colors: {
      I: '#00ffff',
      O: '#ffff00',
      T: '#ff00ff',
      S: '#00ff00',
      Z: '#ff0000',
      J: '#0066ff',
      L: '#ff6600',
    },
    accent: '#00ffaa',
    accent2: '#ff00ff',
    accent3: '#00aaff',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    panelBg: 'rgba(0,0,0,0.5)',
    panelBorder: 'rgba(0, 255, 170, 0.3)',
  },
  retro: {
    name: 'Retro',
    bgGradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)',
    boardBorder: 'rgba(255, 100, 200, 0.6)',
    boardGlow: '0 0 20px rgba(255, 100, 200, 0.3), 0 0 40px rgba(100, 200, 255, 0.2)',
    boardBg: 'linear-gradient(135deg, rgba(255, 100, 200, 0.1), rgba(100, 200, 255, 0.05))',
    cellEmpty: 'rgba(255, 100, 200, 0.03)',
    cellBorder: 'rgba(255, 100, 200, 0.1)',
    ghostOpacity: 0.2,
    pieceGlow: 'soft',
    colors: {
      I: '#ff6ec7',
      O: '#ffd93d',
      T: '#c77dff',
      S: '#95e616',
      Z: '#ff5e5e',
      J: '#6ec6ff',
      L: '#ffa94d',
    },
    accent: '#ff6ec7',
    accent2: '#ffd93d',
    accent3: '#6ec6ff',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    panelBg: 'rgba(26, 10, 46, 0.7)',
    panelBorder: 'rgba(255, 100, 200, 0.4)',
  },
  minimalist: {
    name: 'Minimalist',
    bgGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
    boardBorder: 'rgba(255, 255, 255, 0.2)',
    boardGlow: 'none',
    boardBg: 'rgba(255, 255, 255, 0.02)',
    cellEmpty: 'rgba(255, 255, 255, 0.02)',
    cellBorder: 'rgba(255, 255, 255, 0.05)',
    ghostOpacity: 0.15,
    pieceGlow: 'none',
    colors: {
      I: '#ffffff',
      O: '#e0e0e0',
      T: '#c0c0c0',
      S: '#a0a0a0',
      Z: '#808080',
      J: '#606060',
      L: '#d0d0d0',
    },
    accent: '#ffffff',
    accent2: '#a0a0a0',
    accent3: '#606060',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.5)',
    panelBg: 'rgba(255,255,255,0.03)',
    panelBorder: 'rgba(255, 255, 255, 0.15)',
  },
};

// ============ MODOS DE JOGO ============
export type GameMode = 'marathon' | 'sprint' | 'ultra';

export interface GameModeConfig {
  name: string;
  description: string;
  icon: string;
  target: string;
  timeLimit?: number; // em segundos
  lineTarget?: number;
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  marathon: {
    name: 'Marathon',
    description: 'Jogo infinito, velocidade aumenta',
    icon: '🏃',
    target: 'Sobreviva o máximo possível',
  },
  sprint: {
    name: 'Sprint',
    description: 'Complete 40 linhas o mais rápido',
    icon: '⚡',
    target: '40 linhas',
    lineTarget: 40,
  },
  ultra: {
    name: 'Ultra',
    description: 'Máxima pontuação em 2 minutos',
    icon: '⏱️',
    target: '2 minutos',
    timeLimit: 120,
  },
};

// ============ CONQUISTAS ============
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  linesCleared: number;
  tetrisCount: number;
  maxCombo: number;
  level: number;
  piecesPlaced: number;
  timePlayed: number;
  perfectClears: number;
  tSpins: number;
  gamesPlayed: number;
  totalScore: number;
  sprintBestTime?: number;
  ultraBestScore?: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_line',
    name: 'First Blood',
    description: 'Limpe sua primeira linha',
    icon: '🎯',
    condition: (s) => s.linesCleared >= 1,
  },
  {
    id: 'ten_lines',
    name: 'Getting Started',
    description: 'Limpe 10 linhas',
    icon: '📏',
    condition: (s) => s.linesCleared >= 10,
  },
  {
    id: 'hundred_lines',
    name: 'Centurion',
    description: 'Limpe 100 linhas',
    icon: '💯',
    condition: (s) => s.linesCleared >= 100,
  },
  {
    id: 'five_hundred_lines',
    name: 'Master Builder',
    description: 'Limpe 500 linhas',
    icon: '🏗️',
    condition: (s) => s.linesCleared >= 500,
  },
  {
    id: 'first_tetris',
    name: 'Tetris Master',
    description: 'Faça seu primeiro Tetris',
    icon: '⭐',
    condition: (s) => s.tetrisCount >= 1,
  },
  {
    id: 'ten_tetris',
    name: 'Tetris Legend',
    description: 'Faça 10 Tetris',
    icon: '🌟',
    condition: (s) => s.tetrisCount >= 10,
  },
  {
    id: 'combo_3',
    name: 'Combo Starter',
    description: 'Alcance combo x3',
    icon: '🔥',
    condition: (s) => s.maxCombo >= 3,
  },
  {
    id: 'combo_5',
    name: 'Combo Master',
    description: 'Alcance combo x5',
    icon: '💥',
    condition: (s) => s.maxCombo >= 5,
  },
  {
    id: 'combo_10',
    name: 'Combo God',
    description: 'Alcance combo x10',
    icon: '👑',
    condition: (s) => s.maxCombo >= 10,
  },
  {
    id: 'level_5',
    name: 'Speed Demon',
    description: 'Alcance nível 5',
    icon: '⚡',
    condition: (s) => s.level >= 5,
  },
  {
    id: 'level_10',
    name: 'Lightning Fast',
    description: 'Alcance nível 10',
    icon: '🌩️',
    condition: (s) => s.level >= 10,
  },
  {
    id: 'level_20',
    name: 'Unstoppable',
    description: 'Alcance nível 20',
    icon: '🚀',
    condition: (s) => s.level >= 20,
  },
  {
    id: 'pieces_100',
    name: 'Piece Collector',
    description: 'Coloque 100 peças',
    icon: '🧩',
    condition: (s) => s.piecesPlaced >= 100,
  },
  {
    id: 'pieces_500',
    name: 'Piece Master',
    description: 'Coloque 500 peças',
    icon: '🎨',
    condition: (s) => s.piecesPlaced >= 500,
  },
  {
    id: 'score_10k',
    name: 'Ten Thousand',
    description: 'Alcance 10.000 pontos',
    icon: '💰',
    condition: (s) => s.totalScore >= 10000,
  },
  {
    id: 'score_100k',
    name: 'High Roller',
    description: 'Alcance 100.000 pontos',
    icon: '💎',
    condition: (s) => s.totalScore >= 100000,
  },
  {
    id: 'games_10',
    name: 'Dedicated',
    description: 'Jogue 10 partidas',
    icon: '🎮',
    condition: (s) => s.gamesPlayed >= 10,
  },
  {
    id: 'games_50',
    name: 'Addicted',
    description: 'Jogue 50 partidas',
    icon: '🏆',
    condition: (s) => s.gamesPlayed >= 50,
  },
  {
    id: 'sprint_complete',
    name: 'Sprinter',
    description: 'Complete o modo Sprint',
    icon: '🏁',
    condition: (s) => s.sprintBestTime !== undefined,
  },
  {
    id: 'time_30min',
    name: 'Marathon Runner',
    description: 'Jogue por 30 minutos no total',
    icon: '⏰',
    condition: (s) => s.timePlayed >= 1800,
  },
];

// ============ LEADERBOARD ============
export interface LeaderboardEntry {
  name: string;
  score: number;
  mode: GameMode;
  level: number;
  lines: number;
  time: number;
  date: string;
}

const LEADERBOARD_KEY = 'neon-tetris-leaderboard';

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToLeaderboard(entry: LeaderboardEntry): number {
  const leaderboard = getLeaderboard();
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.score - a.score);
  const top10 = leaderboard.slice(0, 10);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top10));
  return top10.findIndex(e => e.date === entry.date && e.score === entry.score);
}

// ============ REPLAY ============
export type ReplayAction = 
  | { type: 'move'; direction: 'left' | 'right'; time: number }
  | { type: 'rotate'; time: number }
  | { type: 'softDrop'; time: number }
  | { type: 'hardDrop'; time: number }
  | { type: 'hold'; time: number }
  | { type: 'lock'; time: number; pieceType: string; x: number; y: number };

export interface ReplayData {
  actions: ReplayAction[];
  startTime: number;
  mode: GameMode;
  finalScore: number;
}

const REPLAY_KEY = 'neon-tetris-replay';

export function saveReplay(replay: ReplayData) {
  localStorage.setItem(REPLAY_KEY, JSON.stringify(replay));
}

export function getReplay(): ReplayData | null {
  try {
    const data = localStorage.getItem(REPLAY_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ============ MÚSICA DE FUNDO ============
export class BackgroundMusic {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private intervalId: number | null = null;
  private noteIndex = 0;
  private volume = 0.08;
  private enabled = true;

  // Escalas para diferentes modos
  private scales = {
    marathon: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25], // C major
    sprint: [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25, 739.99], // D major (mais rápido)
    ultra: [261.63, 311.04, 349.23, 415.30, 466.16, 523.25, 622.25, 698.46], // C minor (tenso)
  };

  private patterns = {
    marathon: [0, 2, 4, 5, 4, 2, 0, 3, 5, 7, 5, 3],
    sprint: [0, 4, 7, 4, 0, 3, 7, 3],
    ultra: [0, 3, 5, 7, 5, 3, 0, 2, 4, 6, 4, 2],
  };

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  start(mode: GameMode = 'marathon') {
    if (!this.enabled) return;
    this.init();
    if (this.isPlaying) this.stop();
    this.isPlaying = true;
    
    const scale = this.scales[mode];
    const pattern = this.patterns[mode];
    const tempo = mode === 'sprint' ? 200 : mode === 'ultra' ? 250 : 300;

    this.intervalId = window.setInterval(() => {
      if (!this.audioContext || !this.gainNode) return;
      
      const noteIdx = pattern[this.noteIndex % pattern.length];
      const freq = scale[noteIdx];
      
      this.playNote(freq, tempo / 1000 * 0.8);
      this.noteIndex++;
    }, tempo);
  }

  private playNote(frequency: number, duration: number) {
    if (!this.audioContext || !this.gainNode) return;
    
    const osc = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();
    
    osc.connect(noteGain);
    noteGain.connect(this.gainNode);
    
    osc.type = 'sine';
    osc.frequency.value = frequency;
    
    noteGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + duration);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPlaying = false;
    this.noteIndex = 0;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  setVolume(vol: number) {
    this.volume = vol;
    if (this.gainNode) {
      this.gainNode.gain.value = vol;
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

// ============ CONTROLES GESTUAIS ============
export interface GestureConfig {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeDown: () => void;
  onSwipeUp: () => void;
  onTap: () => void;
  onLongPress: () => void;
}

export class GestureController {
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private config: GestureConfig | null = null;
  private longPressTimer: number | null = null;
  private enabled = true;

  attach(element: HTMLElement, config: GestureConfig) {
    this.config = config;
    
    element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  detach(element: HTMLElement) {
    element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private handleTouchStart(e: TouchEvent) {
    if (!this.enabled) return;
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();

    // Long press detection
    this.longPressTimer = window.setTimeout(() => {
      if (this.config) this.config.onLongPress();
    }, 500);
  }

  private handleTouchMove(e: TouchEvent) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    if (!this.enabled || !this.config) return;
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;
    const deltaTime = Date.now() - this.startTime;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Tap (short time, small movement)
    if (deltaTime < 200 && absDeltaX < 20 && absDeltaY < 20) {
      this.config.onTap();
      return;
    }

    // Swipe detection
    const minSwipeDistance = 30;
    if (absDeltaX > minSwipeDistance || absDeltaY > minSwipeDistance) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) this.config.onSwipeRight();
        else this.config.onSwipeLeft();
      } else {
        // Vertical swipe
        if (deltaY > 0) this.config.onSwipeDown();
        else this.config.onSwipeUp();
      }
    }
  }
}

// ============ VIBRAÇÃO TÁTIL ============
export const vibration = {
  light: () => {
    if ('vibrate' in navigator) navigator.vibrate(20);
  },
  medium: () => {
    if ('vibrate' in navigator) navigator.vibrate(50);
  },
  heavy: () => {
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
  },
  tetris: () => {
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
  },
  gameOver: () => {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 400]);
  },
  enable: () => {
    // Testa se funciona
    if ('vibrate' in navigator) navigator.vibrate(1);
  },
};

// ============ ACHIEVEMENTS MANAGER ============
const ACHIEVEMENTS_KEY = 'neon-tetris-achievements';

export function getUnlockedAchievements(): string[] {
  try {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function checkNewAchievements(stats: AchievementStats): Achievement[] {
  const unlocked = getUnlockedAchievements();
  const newAchievements: Achievement[] = [];
  
  for (const achievement of ACHIEVEMENTS) {
    if (!unlocked.includes(achievement.id) && achievement.condition(stats)) {
      unlocked.push(achievement.id);
      newAchievements.push(achievement);
    }
  }
  
  if (newAchievements.length > 0) {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
  }
  
  return newAchievements;
}

export function getAllAchievementsWithStatus(): Array<Achievement & { unlocked: boolean }> {
  const unlocked = getUnlockedAchievements();
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlocked.includes(a.id),
  }));
}
