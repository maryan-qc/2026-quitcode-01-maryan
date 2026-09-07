import type { Direction } from '../game/engine';
import styles from './TouchControls.module.css';

type TouchControlsProps = {
  onTurn: (direction: Direction) => void;
};

const KEYS: { direction: Direction; glyph: string; label: string; className: string }[] = [
  { direction: 'up', glyph: '↑', label: 'Вгору', className: styles.up },
  { direction: 'left', glyph: '←', label: 'Вліво', className: styles.left },
  { direction: 'down', glyph: '↓', label: 'Вниз', className: styles.down },
  { direction: 'right', glyph: '→', label: 'Вправо', className: styles.right },
];

export const TouchControls = ({ onTurn }: TouchControlsProps) => (
  <div className={styles.pad}>
    {KEYS.map(({ direction, glyph, label, className }) => (
      <button
        key={direction}
        type="button"
        className={`${styles.key} ${className}`}
        aria-label={label}
        // Поворот має спрацювати одразу від дотику, не чекаючи 300 мс до click.
        onPointerDown={(event) => {
          event.preventDefault();
          onTurn(direction);
        }}
        // Активація з клавіатури не породжує pointer-події. У такого click
        // detail === 0 — саме цим він відрізняється від мишиного, який тут
        // дав би другий поворот поверх уже обробленого pointerdown.
        onClick={(event) => {
          if (event.detail === 0) onTurn(direction);
        }}
      >
        {glyph}
      </button>
    ))}
  </div>
);
