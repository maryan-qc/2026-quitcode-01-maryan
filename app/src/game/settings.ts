export type Speed = 'chill' | 'normal' | 'fast';
export type Scheme = 'light-dark' | 'light' | 'dark';

export type Settings = {
  speed: Speed;
  boardSize: number;
  passThroughWalls: boolean;
  scheme: Scheme;
};

export const BOARD_MIN = 10;
export const BOARD_MAX = 30;

/** Мілісекунди на тік. Менше — швидше. */
export const TICK_MS: Record<Speed, number> = {
  chill: 180,
  normal: 120,
  fast: 75,
};

export const SPEED_LABELS: Record<Speed, string> = {
  chill: 'Спокійно',
  normal: 'Звично',
  fast: 'Швидко',
};

export const DEFAULT_SETTINGS: Settings = {
  speed: 'normal',
  boardSize: 17,
  passThroughWalls: false,
  scheme: 'light-dark',
};

const STORAGE_KEY = 'snake.settings.v1';

const isSpeed = (value: unknown): value is Speed =>
  value === 'chill' || value === 'normal' || value === 'fast';

const isScheme = (value: unknown): value is Scheme =>
  value === 'light-dark' || value === 'light' || value === 'dark';

export const clampBoardSize = (value: number) =>
  Math.min(BOARD_MAX, Math.max(BOARD_MIN, Math.round(value)));

/**
 * Читає налаштування поштучно: якщо у сховищі лежить запис старої версії або
 * хтось руками зіпсував JSON, гра має стартувати на дефолтах, а не впасти.
 */
export const loadSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SETTINGS;
    const value = parsed as Partial<Record<keyof Settings, unknown>>;
    return {
      speed: isSpeed(value.speed) ? value.speed : DEFAULT_SETTINGS.speed,
      boardSize:
        typeof value.boardSize === 'number' && Number.isFinite(value.boardSize)
          ? clampBoardSize(value.boardSize)
          : DEFAULT_SETTINGS.boardSize,
      passThroughWalls:
        typeof value.passThroughWalls === 'boolean'
          ? value.passThroughWalls
          : DEFAULT_SETTINGS.passThroughWalls,
      scheme: isScheme(value.scheme) ? value.scheme : DEFAULT_SETTINGS.scheme,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: Settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Приватний режим або переповнене сховище — грати це не заважає.
  }
};
