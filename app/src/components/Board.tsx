import { useMemo, useRef } from 'react';
import type { Direction, Game } from '../game/engine';
import styles from './Board.module.css';

type BoardProps = {
  game: Game;
  dimmed: boolean;
  onSwipe: (direction: Direction) => void;
};

/** Менший зсув вважаємо випадковим тремтінням пальця, а не свайпом. */
const SWIPE_THRESHOLD = 24;

export const Board = ({ game, dimmed, onSwipe }: BoardProps) => {
  const { size, snake, apple, bonus } = game;
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  // Перемальовується кожен тік, тож шукаємо клітинку через Set, а не обходом
  // масиву зміюки для кожної з size² клітинок.
  const bodyCells = useMemo(
    () => new Set(snake.slice(1).map((part) => `${part.x}:${part.y}`)),
    [snake]
  );
  const headCell = `${snake[0].x}:${snake[0].y}`;
  const appleCell = `${apple.x}:${apple.y}`;
  const bonusCell = bonus ? `${bonus.at.x}:${bonus.at.y}` : null;

  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const id = `${x}:${y}`;
      let kind = '';
      if (id === headCell) kind = styles.head;
      else if (bodyCells.has(id)) kind = styles.body;
      else if (id === bonusCell) kind = styles.bonus;
      else if (id === appleCell) kind = styles.apple;
      cells.push(<div key={id} className={`${styles.cell} ${kind}`} />);
    }
  }

  const endSwipe = (x: number, y: number) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;

    const dx = x - start.x;
    const dy = y - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;

    // Виграє та вісь, по якій палець проїхав далі: діагональний рух інакше
    // давав би випадковий поворот.
    if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? 'right' : 'left');
    else onSwipe(dy > 0 ? 'down' : 'up');
  };

  return (
    <div
      className={`${styles.board} ${dimmed ? styles.dimmed : ''}`}
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      role="img"
      aria-label={`Поле ${size} на ${size}, довжина зміюки ${snake.length}`}
      onPointerDown={(event) => {
        swipeStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => endSwipe(event.clientX, event.clientY)}
      onPointerCancel={() => {
        swipeStart.current = null;
      }}
    >
      {cells}
    </div>
  );
};
