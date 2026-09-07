import type { Speed } from './settings';

export type Score = {
  score: number;
  apples: number;
  speed: Speed;
  boardSize: number;
  passThroughWalls: boolean;
  playedAt: string;
};

export const TOP_SIZE = 5;

const STORAGE_KEY = 'snake.scores.v1';

const isScore = (value: unknown): value is Score => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Record<keyof Score, unknown>>;
  return (
    typeof candidate.score === 'number' &&
    typeof candidate.apples === 'number' &&
    typeof candidate.boardSize === 'number' &&
    typeof candidate.passThroughWalls === 'boolean' &&
    typeof candidate.playedAt === 'string' &&
    (candidate.speed === 'chill' || candidate.speed === 'normal' || candidate.speed === 'fast')
  );
};

export const loadScores = (): Score[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isScore).slice(0, TOP_SIZE);
  } catch {
    return [];
  }
};

const save = (scores: Score[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // Сховище недоступне — рекорд просто не переживе перезавантаження.
  }
};

/** Додає результат і повертає новий топ. Порожні партії не потрапляють у таблицю. */
export const addScore = (scores: Score[], score: Score): Score[] => {
  if (score.score === 0) return scores;
  const next = [...scores, score]
    .sort((a, b) => b.score - a.score || a.playedAt.localeCompare(b.playedAt))
    .slice(0, TOP_SIZE);
  save(next);
  return next;
};

export const clearScores = (): Score[] => {
  save([]);
  return [];
};

export const bestScore = (scores: Score[]) => (scores.length > 0 ? scores[0].score : 0);
