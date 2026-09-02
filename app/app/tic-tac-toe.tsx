"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PButton,
  PDivider,
  PHeading,
  PInlineNotification,
  PInputText,
  PSpinner,
  PTag,
  PText,
} from "@porsche-design-system/components-react/ssr";
import {
  applyMove,
  applyTimeout,
  createGameState,
  currentPlayer,
  getResult,
  isRoundOver,
  opponentOf,
  startNextRound,
  type GameState,
  type Player,
} from "@/lib/game";
import { inviteUrlForRoom, isValidRoomCode, normalizeRoomCode } from "@/lib/room";
import { ALL_THEME_CLASSES, THEME_CLASSES, effectiveTurnSeconds } from "@/lib/settings";
import { Board } from "./board";
import { Scoreboard } from "./scoreboard";
import { SettingsPanel } from "./settings-panel";
import { TurnTimer } from "./turn-timer";
import { useOnlineGame } from "./use-online-game";
import { useRoomInvite } from "./use-room-invite";
import { useSettings } from "./use-settings";
import styles from "./tic-tac-toe.module.css";

type Mode = "menu" | "local" | "online";

export function TicTacToe() {
  const invite = useRoomInvite();
  const settings = useSettings();
  // `null` means the player has not navigated yet, so an invite link decides
  // the opening screen. Once they pick anything, their choice wins — otherwise
  // `?room=` in the URL would drag them back to the online screen forever.
  const [mode, setMode] = useState<Mode | null>(null);
  const activeMode: Mode = mode ?? (invite ? "online" : "menu");

  // Theming in PDS v4 is a single class on the root element.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...ALL_THEME_CLASSES);
    root.classList.add(THEME_CLASSES[settings.theme]);
  }, [settings.theme]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <PHeading tag="h1" size="xl">
          Хрестики-нулики
        </PHeading>
        <PText color="contrast-medium">
          Дошка 3×3. Хто перший збере лінію — той переміг.
        </PText>
      </header>

      {activeMode === "menu" && <Menu onPick={setMode} />}
      {activeMode === "local" && <LocalGame onExit={() => setMode("menu")} />}
      {activeMode === "online" && (
        // The invite is consumed only on the very first screen.
        <OnlineGame initialCode={mode === null ? invite : null} onExit={() => setMode("menu")} />
      )}
    </div>
  );
}

function Menu({ onPick }: { onPick: (mode: Mode) => void }) {
  return (
    <>
      <div className={styles.menu}>
        <PButton type="button" icon="user-group" onClick={() => onPick("local")}>
          Грати вдвох на цьому пристрої
        </PButton>
        <PButton type="button" variant="secondary" icon="wifi" onClick={() => onPick("online")}>
          Грати онлайн із суперником
        </PButton>
      </div>

      <PDivider color="contrast-low" />
      <SettingsPanel />
    </>
  );
}

type OutcomeTone = "success" | "error" | "info";

type Outcome = { state: OutcomeTone; heading: string; description: string };

/** Banner text for a finished round, from the point of view of `you`. */
function roundOutcome(state: GameState, you: Player | null): Outcome {
  const result = getResult(state.board);

  if (state.timedOut) {
    const winner = opponentOf(state.timedOut);
    return {
      state: you === null ? "info" : you === winner ? "success" : "error",
      heading: `Час вийшов у ${state.timedOut}`,
      description:
        you === null
          ? `Раунд зараховано ${winner}.`
          : you === winner
            ? "Суперник не встиг зробити хід. Раунд ваш."
            : "Ви не встигли зробити хід. Раунд за суперником.",
    };
  }

  if (result.status === "draw") {
    return {
      state: "info",
      heading: "Нічия",
      description: "Поле заповнене, переможця немає.",
    };
  }

  const winner = result.winner as Player;
  return {
    state: you === null || you === winner ? "success" : "error",
    heading: you === null ? `${winner} виграв раунд!` : you === winner ? "Ви виграли раунд!" : "Раунд за суперником",
    description: "Лінію зібрано. Рахунок збережено.",
  };
}

/* ---------------------------------------------------------------- local --- */

function LocalGame({ onExit }: { onExit: () => void }) {
  const settings = useSettings();
  const turnSeconds = effectiveTurnSeconds(settings);
  const [state, setState] = useState<GameState>(() => createGameState(turnSeconds));

  const result = useMemo(() => getResult(state.board), [state.board]);
  const isOver = isRoundOver(state);
  const turn = currentPlayer(state);
  const outcome = isOver ? roundOutcome(state, null) : null;

  return (
    <>
      <div className={styles.statusBar}>
        {isOver ? (
          <PTag variant={state.timedOut ? "warning" : result.status === "won" ? "success" : "info"} icon="flag">
            {state.timedOut
              ? `Час вийшов у ${state.timedOut}`
              : result.status === "won"
                ? `Переміг ${result.winner}`
                : "Нічия"}
          </PTag>
        ) : (
          <PTag variant={turn === "X" ? "info" : "warning"}>Ходить {turn}</PTag>
        )}
        <PText size="xs" color="contrast-medium">
          Ходів зроблено: {state.board.filter(Boolean).length} / 9
        </PText>
      </div>

      {state.turnSeconds > 0 && !isOver && (
        <TurnTimer
          key={state.turnId}
          seconds={state.turnSeconds}
          label={`Час на хід — ${turn}`}
          onExpire={() => setState((prev) => applyTimeout(prev))}
        />
      )}

      <Board
        board={state.board}
        result={result}
        locked={isOver}
        onPlay={(index) => setState((prev) => applyMove(prev, index))}
      />

      {outcome && (
        <PInlineNotification
          state={outcome.state}
          heading={outcome.heading}
          description={outcome.description}
          dismissButton={false}
          actionLabel="Новий раунд"
          actionIcon="refresh"
          onAction={() => setState((prev) => startNextRound(prev, turnSeconds))}
        />
      )}

      <PDivider color="contrast-low" />
      <Scoreboard scores={state.scores} />

      <div className={styles.actions}>
        <PButton
          type="button"
          icon="refresh"
          onClick={() => setState((prev) => startNextRound(prev, turnSeconds))}
        >
          Новий раунд
        </PButton>
        <PButton
          type="button"
          variant="secondary"
          icon="delete"
          onClick={() => setState(createGameState(turnSeconds))}
        >
          Скинути рахунок
        </PButton>
        <PButton type="button" variant="secondary" icon="arrow-left" onClick={onExit}>
          У меню
        </PButton>
      </div>
    </>
  );
}

/* --------------------------------------------------------------- online --- */

type OnlineGameProps = { initialCode: string | null; onExit: () => void };

function OnlineGame({ initialCode, onExit }: OnlineGameProps) {
  const game = useOnlineGame();

  if (game.phase === "idle" || game.phase === "error") {
    return <OnlineLobby game={game} initialCode={initialCode} onExit={onExit} />;
  }
  if (game.phase === "hosting" || game.phase === "joining") {
    return <OnlineWaiting game={game} onExit={onExit} />;
  }
  return <OnlineBoard game={game} onExit={onExit} />;
}

type OnlineProps = { game: ReturnType<typeof useOnlineGame>; onExit: () => void };

function OnlineLobby({ game, initialCode, onExit }: OnlineProps & { initialCode: string | null }) {
  const [input, setInput] = useState("");
  const { join, phase } = game;

  // Dial the host automatically when arriving from an invite link. Opening a
  // connection is an external side effect — but never retry after an error,
  // or a dead link would loop forever.
  useEffect(() => {
    if (initialCode && phase === "idle") {
      join(initialCode);
    }
  }, [initialCode, join, phase]);

  const code = normalizeRoomCode(input);

  return (
    <>
      {game.error && (
        <PInlineNotification
          state="error"
          heading="Не вдалося"
          description={game.error}
          dismissButton={false}
        />
      )}

      <PButton type="button" icon="add" onClick={game.host}>
        Створити гру і отримати код
      </PButton>

      <PDivider color="contrast-low" />

      <form
        className={styles.joinForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (isValidRoomCode(code)) {
            join(code);
          }
        }}
      >
        <PInputText
          label="Код кімнати"
          description="5 символів від суперника"
          name="room"
          value={input}
          maxLength={5}
          autoComplete="off"
          onInput={(event) => setInput(normalizeRoomCode((event.target as HTMLInputElement).value))}
        />
        <PButton type="submit" variant="secondary" icon="plug" disabled={!isValidRoomCode(code)}>
          Приєднатись
        </PButton>
      </form>

      <PButton type="button" variant="secondary" icon="arrow-left" onClick={onExit}>
        У меню
      </PButton>
    </>
  );
}

function OnlineWaiting({ game, onExit }: OnlineProps) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  async function copy(kind: "code" | "link") {
    if (!game.code) {
      return;
    }
    const text = kind === "code" ? game.code : inviteUrlForRoom(game.code);
    try {
      // Denied permission or an insecure context rejects here — the code stays
      // selectable on screen, so failing to copy must not break the room.
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopyFailed(true);
    }
  }

  if (game.phase === "joining") {
    return (
      <div className={styles.waiting}>
        <PSpinner size="medium" aria-label="Підключення" />
        <PText align="center">Підключаємось до кімнати {game.code}…</PText>
        <PButton type="button" variant="secondary" icon="close" onClick={game.leave}>
          Скасувати
        </PButton>
      </div>
    );
  }

  return (
    <div className={styles.waiting}>
      <PText size="xs" color="contrast-medium" align="center">
        Передайте код суперникові
      </PText>
      <output className={styles.roomCode} aria-label={`Код кімнати ${game.code}`}>
        {game.code}
      </output>

      <div className={styles.actions}>
        <PButton type="button" variant="secondary" icon="copy" onClick={() => copy("code")}>
          {copied === "code" ? "Скопійовано" : "Копіювати код"}
        </PButton>
        <PButton type="button" variant="secondary" icon="share" onClick={() => copy("link")}>
          {copied === "link" ? "Скопійовано" : "Копіювати посилання"}
        </PButton>
      </div>

      {copyFailed && (
        <PText size="xs" color="warning" align="center">
          Браузер не дав доступу до буфера — скопіюйте код вручну.
        </PText>
      )}

      <PDivider color="contrast-low" />

      <div className={styles.waitingStatus}>
        <PSpinner size="small" aria-label="Очікування" />
        <PText color="contrast-medium">Чекаємо суперника…</PText>
      </div>

      <PButton
        type="button"
        variant="secondary"
        icon="arrow-left"
        onClick={() => {
          game.leave();
          onExit();
        }}
      >
        Скасувати і вийти
      </PButton>
    </div>
  );
}

function OnlineBoard({ game, onExit }: OnlineProps) {
  const { state } = game;
  const result = useMemo(() => getResult(state.board), [state.board]);
  const isOver = isRoundOver(state);
  const isMyTurn = currentPlayer(state) === game.role;
  const outcome = isOver ? roundOutcome(state, game.role) : null;

  return (
    <>
      <div className={styles.statusBar}>
        {isOver ? (
          <PTag variant={outcome?.state === "success" ? "success" : outcome?.state === "error" ? "error" : "info"} icon="flag">
            {outcome?.heading}
          </PTag>
        ) : (
          <PTag variant={isMyTurn ? "success" : "secondary"}>
            {isMyTurn ? "Ваш хід" : "Хід суперника"}
          </PTag>
        )}
        <PTag compact variant={game.opponentPresent ? "secondary" : "warning"} icon="user">
          {game.opponentPresent ? `Ви граєте ${game.role}` : "Суперник відключився"}
        </PTag>
      </div>

      {state.turnSeconds > 0 && !isOver && game.opponentPresent && (
        <TurnTimer
          key={state.turnId}
          seconds={state.turnSeconds}
          label={isMyTurn ? "Ваш час" : "Час суперника"}
          // Only the host arbitrates; the guest's timer is display-only.
          onExpire={game.role === "X" ? game.timeout : undefined}
        />
      )}

      <Board
        board={state.board}
        result={result}
        locked={isOver || !isMyTurn || !game.opponentPresent}
        onPlay={game.play}
      />

      {!game.opponentPresent && (
        <PInlineNotification
          state="warning"
          heading="Суперник вийшов"
          description="З'єднання розірвано. Поверніться в меню, щоб створити нову гру."
          dismissButton={false}
        />
      )}

      {outcome && game.opponentPresent && (
        <PInlineNotification
          state={outcome.state}
          heading={outcome.heading}
          description={`${outcome.description} Готові до реваншу?`}
          dismissButton={false}
          actionLabel="Ще раз"
          actionIcon="refresh"
          onAction={game.rematch}
        />
      )}

      <PDivider color="contrast-low" />
      <Scoreboard scores={state.scores} />

      <div className={styles.actions}>
        <PButton
          type="button"
          icon="refresh"
          // Only after the round ends — otherwise one player could wipe the
          // board out from under the other mid-game.
          disabled={!game.opponentPresent || !isOver}
          onClick={game.rematch}
        >
          Ще раз
        </PButton>
        <PButton
          type="button"
          variant="secondary"
          icon="arrow-left"
          onClick={() => {
            game.leave();
            onExit();
          }}
        >
          Вийти з гри
        </PButton>
      </div>
    </>
  );
}
