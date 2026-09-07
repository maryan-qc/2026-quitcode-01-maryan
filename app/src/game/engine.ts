export type Point = { x: number; y: number };
export type Direction = 'up' | 'right' | 'down' | 'left';
export type Status = 'idle' | 'running' | 'paused' | 'over';

/** Скільки тіків живе золоте яблуко, перш ніж зникнути. */
const BONUS_LIFETIME = 45;
/** Кожне N-те звичайне яблуко викликає золоте. */
const BONUS_EVERY = 5;

export const POINTS_APPLE = 10;
export const POINTS_BONUS = 50;

export type Game = {
  size: number;
  /** Голова — перший елемент. */
  snake: Point[];
  dir: Direction;
  /** Черга поворотів: натиснуті клавіші застосовуються по одному за тік. */
  pending: Direction[];
  apple: Point;
  bonus: { at: Point; ticksLeft: number } | null;
  eaten: number;
  score: number;
  status: Status;
};

const VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  right: 'left',
  down: 'up',
  left: 'right',
};

export const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

const key = (p: Point) => `${p.x}:${p.y}`;

/** Випадкова вільна клітинка; null, якщо поле заповнене зміюкою. */
const randomFreeCell = (size: number, occupied: Point[]): Point | null => {
  const taken = new Set(occupied.map(key));
  const free: Point[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!taken.has(`${x}:${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
};

export const createGame = (size: number): Game => {
  const mid = Math.floor(size / 2);
  // Стартова довжина 3, головою вправо — тому хвіст ліворуч від голови.
  const snake: Point[] = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  return {
    size,
    snake,
    dir: 'right',
    pending: [],
    apple: randomFreeCell(size, snake) ?? { x: 0, y: 0 },
    bonus: null,
    eaten: 0,
    score: 0,
    status: 'idle',
  };
};

/**
 * Ставить поворот у чергу. Розворот на 180° неможливий, але звіряємось з
 * останнім поворотом у черзі, а не з поточним напрямком: інакше швидка пара
 * «вгору, вліво» під час руху вправо пропустила б перший поворот і зміюка
 * в'їхала б сама в себе.
 */
export const enqueueTurn = (game: Game, dir: Direction): Game => {
  const last = game.pending.at(-1) ?? game.dir;
  if (dir === last || dir === OPPOSITE[last]) return game;
  if (game.pending.length >= 2) return game;
  return { ...game, pending: [...game.pending, dir] };
};

const wrap = (value: number, size: number) => (value + size) % size;

/** Один тік гри. Викликається лише в статусі 'running'. */
export const step = (game: Game, passThroughWalls: boolean): Game => {
  const dir = game.pending[0] ?? game.dir;
  const pending = game.pending.slice(1);
  const vector = VECTORS[dir];

  let head: Point = { x: game.snake[0].x + vector.x, y: game.snake[0].y + vector.y };

  const outside = head.x < 0 || head.y < 0 || head.x >= game.size || head.y >= game.size;
  if (outside) {
    if (!passThroughWalls) return { ...game, dir, pending, status: 'over' };
    head = { x: wrap(head.x, game.size), y: wrap(head.y, game.size) };
  }

  const ateApple = samePoint(head, game.apple);
  const ateBonus = game.bonus !== null && samePoint(head, game.bonus.at);

  // Хвіст звільняє клітинку цього ж тіку, тому наїзд на неї — не програш.
  // Виняток: щойно з'їдене яблуко, бо тоді хвіст лишається на місці.
  const body = ateApple ? game.snake : game.snake.slice(0, -1);
  if (body.some((part) => samePoint(part, head))) {
    return { ...game, dir, pending, status: 'over' };
  }

  const snake = [head, ...body];
  const eaten = ateApple ? game.eaten + 1 : game.eaten;

  let score = game.score;
  if (ateApple) score += POINTS_APPLE;
  if (ateBonus) score += POINTS_BONUS;

  const apple = ateApple ? (randomFreeCell(game.size, snake) ?? game.apple) : game.apple;

  let bonus = game.bonus;
  if (ateBonus) {
    bonus = null;
  } else if (bonus) {
    bonus = bonus.ticksLeft > 1 ? { ...bonus, ticksLeft: bonus.ticksLeft - 1 } : null;
  }
  // Золоте яблуко з'являється лише коли на полі його ще немає.
  if (ateApple && bonus === null && eaten % BONUS_EVERY === 0) {
    const at = randomFreeCell(game.size, [...snake, apple]);
    if (at) bonus = { at, ticksLeft: BONUS_LIFETIME };
  }

  // Зміюка зайняла все поле — це перемога, а не програш.
  const filled = snake.length === game.size * game.size;

  return {
    ...game,
    snake,
    dir,
    pending,
    apple,
    bonus,
    eaten,
    score,
    status: filled ? 'over' : 'running',
  };
};
