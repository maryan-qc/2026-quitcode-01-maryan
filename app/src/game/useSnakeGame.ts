import { useCallback, useEffect, useRef, useState } from 'react';
import { createGame, enqueueTurn, step, type Direction, type Game } from './engine';
import { TICK_MS, type Settings } from './settings';

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowRight: 'right',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  w: 'up',
  d: 'right',
  s: 'down',
  a: 'left',
  ц: 'up',
  в: 'right',
  и: 'down',
  ф: 'left',
};

export const useSnakeGame = (settings: Settings, onGameOver: (game: Game) => void) => {
  const [game, setGame] = useState<Game>(() => createGame(settings.boardSize));

  // Колбек і налаштування читаються всередині таймера й слухача, тож тримаємо
  // їх у ref — інакше кожен рендер перезапускав би інтервал і збивав темп.
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;
  const passThroughWallsRef = useRef(settings.passThroughWalls);
  passThroughWallsRef.current = settings.passThroughWalls;

  const start = useCallback(() => {
    setGame({ ...createGame(settings.boardSize), status: 'running' });
  }, [settings.boardSize]);

  const reset = useCallback(() => {
    setGame(createGame(settings.boardSize));
  }, [settings.boardSize]);

  const togglePause = useCallback(() => {
    setGame((current) => {
      if (current.status === 'running') return { ...current, status: 'paused' };
      if (current.status === 'paused') return { ...current, status: 'running' };
      return current;
    });
  }, []);

  const turn = useCallback((direction: Direction) => {
    setGame((current) => (current.status === 'running' ? enqueueTurn(current, direction) : current));
  }, []);

  // Ігровий такт.
  useEffect(() => {
    if (game.status !== 'running') return;
    const id = window.setInterval(() => {
      setGame((current) =>
        current.status === 'running' ? step(current, passThroughWallsRef.current) : current
      );
    }, TICK_MS[settings.speed]);
    return () => window.clearInterval(id);
  }, [game.status, settings.speed]);

  // Кінець партії повідомляємо одноразово, вже після рендера.
  useEffect(() => {
    if (game.status === 'over') onGameOverRef.current(game);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      /*
       * Слухач висить на window, тож без цієї перевірки стрілки в полі
       * «Розмір поля» діставались би зміюці, а preventDefault нижче ще й
       * блокував би рідну зміну числа з клавіатури. composedPath потрібен
       * тому, що справжній <input> у PDS живе всередині shadow DOM.
       */
      const typing = event.composedPath().some(
        (node) =>
          node instanceof HTMLInputElement ||
          node instanceof HTMLTextAreaElement ||
          node instanceof HTMLSelectElement ||
          (node instanceof HTMLElement && node.isContentEditable)
      );
      if (typing) return;

      const direction = KEY_TO_DIRECTION[event.key] ?? KEY_TO_DIRECTION[event.key.toLowerCase()];
      if (direction) {
        event.preventDefault();
        turn(direction);
        return;
      }
      if (event.key === ' ') {
        event.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [turn, togglePause]);

  return { game, start, reset, togglePause, turn };
};
