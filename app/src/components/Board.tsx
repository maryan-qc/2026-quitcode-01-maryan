import { useMemo } from 'react';
import type { Game } from '../game/engine';
import styles from './Board.module.css';

type BoardProps = {
  game: Game;
  dimmed: boolean;
};

export const Board = ({ game, dimmed }: BoardProps) => {
  const { size, snake, apple, bonus } = game;

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

  return (
    <div
      className={`${styles.board} ${dimmed ? styles.dimmed : ''}`}
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      role="img"
      aria-label={`Поле ${size} на ${size}, довжина зміюки ${snake.length}`}
    >
      {cells}
    </div>
  );
};
