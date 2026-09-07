import { useCallback, useEffect, useState } from 'react';
import {
  PButton,
  PDivider,
  PHeading,
  PInlineNotification,
  PTag,
  PText,
} from '@porsche-design-system/components-react';
import { Board } from './components/Board';
import { Scoreboard } from './components/Scoreboard';
import { SettingsPanel } from './components/SettingsPanel';
import { TouchControls } from './components/TouchControls';
import { POINTS_APPLE, POINTS_BONUS, type Game } from './game/engine';
import { addScore, bestScore, clearScores, loadScores, type Score } from './game/scores';
import { loadSettings, saveSettings, type Settings } from './game/settings';
import { useSnakeGame } from './game/useSnakeGame';

type Screen = 'menu' | 'game';

export const App = () => {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [scores, setScores] = useState<Score[]>(loadScores);
  const [screen, setScreen] = useState<Screen>('menu');
  // Рекорд на момент старту партії — щоб після неї чесно сказати «новий рекорд».
  const [bestBefore, setBestBefore] = useState(0);

  const handleGameOver = useCallback(
    (finished: Game) => {
      setScores((current) =>
        addScore(current, {
          score: finished.score,
          apples: finished.eaten,
          speed: settings.speed,
          boardSize: settings.boardSize,
          passThroughWalls: settings.passThroughWalls,
          playedAt: new Date().toISOString(),
        })
      );
    },
    [settings.speed, settings.boardSize, settings.passThroughWalls]
  );

  const { game, start, reset, togglePause, turn } = useSnakeGame(settings, handleGameOver);

  useEffect(() => saveSettings(settings), [settings]);

  // Тема — це єдиний механізм PDS v4: клас color-scheme на <html>.
  useEffect(() => {
    const root = document.documentElement;
    const className = `scheme-${settings.scheme}`;
    root.classList.add(className);
    return () => root.classList.remove(className);
  }, [settings.scheme]);

  const updateSettings = (patch: Partial<Settings>) => setSettings((current) => ({ ...current, ...patch }));

  const playAgain = () => {
    setBestBefore(bestScore(scores));
    start();
  };

  const openGame = () => {
    setBestBefore(bestScore(scores));
    start();
    setScreen('game');
  };

  const backToMenu = () => {
    reset();
    setScreen('menu');
  };

  const isOver = game.status === 'over';
  const isPaused = game.status === 'paused';
  const isRecord = isOver && game.score > 0 && game.score > bestBefore;
  const best = bestScore(scores);

  return (
    <div className="page">
      <header className="stack stack--tight">
        <PHeading size="xl" tag="h1">
          Змійка
        </PHeading>
        <PText color="contrast-medium">
          Класика на Porsche Design System. Керування — стрілки або WASD, пробіл ставить паузу.
        </PText>
      </header>

      <PDivider />

      {screen === 'menu' ? (
        <main className="stack">
          <SettingsPanel settings={settings} onChange={updateSettings} />
          <PButton type="button" icon="play" onClick={openGame}>
            Грати
          </PButton>
          <PDivider />
          <Scoreboard
            scores={scores}
            onClear={() => setScores(clearScores())}
          />
          <PText size="xs" color="contrast-medium">
            Яблуко дає {POINTS_APPLE} балів. Кожне п'яте викликає золоте — воно варте {POINTS_BONUS},
            але швидко зникає.
          </PText>
        </main>
      ) : (
        <main className="stack">
          <div className="row row--wrap">
            <PTag variant="primary">Бали: {game.score}</PTag>
            <PTag>Яблука: {game.eaten}</PTag>
            <PTag>Довжина: {game.snake.length}</PTag>
            {best > 0 && <PTag variant="info">Рекорд: {best}</PTag>}
            {game.bonus && <PTag variant="warning">Золоте яблуко: {game.bonus.ticksLeft}</PTag>}
          </div>

          <Board game={game} dimmed={isPaused || isOver} />

          {isPaused && (
            <PInlineNotification
              state="info"
              heading="Пауза"
              description="Пробіл або «Далі» повертають гру."
              dismissButton={false}
            />
          )}

          {isOver && (
            <PInlineNotification
              state={isRecord ? 'success' : 'warning'}
              heading={isRecord ? `Новий рекорд — ${game.score}!` : `Партію завершено — ${game.score}`}
              description={
                isRecord
                  ? `Попередній найкращий результат був ${bestBefore}.`
                  : `Зібрано яблук: ${game.eaten}. Найкращий результат — ${best}.`
              }
              dismissButton={false}
              actionLabel="Ще раз"
              actionIcon="refresh"
              onAction={playAgain}
            />
          )}

          {/* Після програшу «Ще раз» уже стоїть у повідомленні — не дублюємо його кнопкою. */}
          <div className="row row--wrap">
            {!isOver && (
              <>
                <PButton type="button" icon={isPaused ? 'play' : 'pause'} onClick={togglePause}>
                  {isPaused ? 'Далі' : 'Пауза'}
                </PButton>
                <PButton type="button" variant="secondary" icon="refresh" onClick={playAgain}>
                  Заново
                </PButton>
              </>
            )}
            <PButton type="button" variant="secondary" icon="arrow-head-left" onClick={backToMenu}>
              У меню
            </PButton>
          </div>

          <TouchControls onTurn={turn} />
        </main>
      )}
    </div>
  );
};
