export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'REVIVE' | 'GAMEOVER';

export type EnvironmentId = 'ruins' | 'jungle' | 'underground' | 'cybercity';

export interface EnvironmentInfo {
  id: EnvironmentId;
  name: string;
  tagline: string;
  description: string;
  unlocked: boolean;
  requiredKeys: number;
  requiredDistance: number;
  themeColor: string;
  accentColor: string;
  fogColor: number;
  fogDensity: number;
  skyColor: number;
  groundColor: number;
  ambientIntensity: number;
  sunColor: number;
  sunIntensity: number;
}

export type PowerUpType = 'magnet' | 'shield' | 'boost' | 'multiplier';

export interface PowerUpState {
  type: PowerUpType;
  duration: number; // remaining seconds
  totalDuration: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  rewardCoins: number;
  rewardKeys: number;
  type: 'distance' | 'coins' | 'keys' | 'jumps' | 'slides' | 'dodge_monster';
}

export interface GameStats {
  score: number;
  highScore: number;
  distance: number;
  coins: number;
  totalCoins: number;
  keys: number;
  totalKeys: number;
  jumpsCount: number;
  slidesCount: number;
  gamesPlayed: number;
}

export interface GameSettings {
  playerName: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  hapticFeedback: boolean;
}

export type HeroOutfitVariant = 'teal_rebel' | 'crimson_rebel';

export interface MultiplayerPlayer {
  id: string;
  name: string;
  isHost: boolean;
  colorVariant: HeroOutfitVariant;
  distance: number;
  score: number;
  coins: number;
  isAlive: boolean;
  finished: boolean;
}

export interface RivalState {
  x: number;
  y: number;
  z: number;
  lane: number;
  animState: 'RUN' | 'JUMP' | 'SLIDE' | 'STUMBLE' | 'DEAD';
  speed: number;
  distance: number;
  score: number;
  isAlive: boolean;
}

export type MultiplayerPhase = 'IDLE' | 'LOBBY_HOST' | 'LOBBY_GUEST' | 'COUNTDOWN' | 'RACING' | 'RESULTS';
