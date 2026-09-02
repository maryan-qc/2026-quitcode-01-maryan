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
  INITIAL_STATE,
  applyMove,
  currentPlayer,
  getResult,
  startNextRound,
  type GameState,
} from "@/lib/game";
import { inviteUrlForRoom, isValidRoomCode, normalizeRoomCode } from "@/lib/room";
import { Board } from "./board";
import { Scoreboard } from "./scoreboard";
import { useOnlineGame } from "./use-online-game";
import { useRoomInvite } from "./use-room-invite";
import styles from "./tic-tac-toe.module.css";

type Mode = "menu" | "local" | "online";

export function TicTacToe() {
  const [mode, setMode] = useState<Mode>("menu");
  const invite = useRoomInvite();
  // An invite link opens straight into the online screen, until the player
  // deliberately navigates somewhere else.
  const activeMode: Mode = mode === "menu" && invite ? "online" : mode;

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
      {activeMode === "online" && <OnlineGame onExit={() => setMode("menu")} />}
    </div>
  );
}

function Menu({ onPick }: { onPick: (mode: Mode) => void }) {
  return (
    <div className={styles.menu}>
      <PButton type="button" icon="user-group" onClick={() => onPick("local")}>
        Грати вдвох на цьому пристрої
      </PButton>
      <PButton type="button" variant="secondary" icon="wifi" onClick={() => onPick("online")}>
        Грати онлайн із суперником
      </PButton>
    </div>
  );
}

/* ---------------------------------------------------------------- local --- */

function LocalGame({ onExit }: { onExit: () => void }) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const result = useMemo(() => getResult(state.board), [state.board]);
  const isOver = result.status !== "playing";

  return (
    <>
      <div className={styles.statusBar}>
        {isOver ? (
          <PTag variant={result.status === "won" ? "success" : "info"} icon="flag">
            {result.status === "won" ? `Переміг ${result.winner}` : "Нічия"}
          </PTag>
        ) : (
          <PTag variant={currentPlayer(state) === "X" ? "info" : "warning"}>
            Ходить {currentPlayer(state)}
          </PTag>
        )}
        <PText size="xs" color="contrast-medium">
          Ходів зроблено: {state.board.filter(Boolean).length} / 9
        </PText>
      </div>

      <Board
        board={state.board}
        result={result}
        locked={isOver}
        onPlay={(index) => setState(applyMove(state, index))}
      />

      {isOver && (
        <PInlineNotification
          state={result.status === "won" ? "success" : "info"}
          heading={result.status === "won" ? `${result.winner} виграв раунд!` : "Нічия"}
          description={
            result.status === "won"
              ? "Лінію зібрано. Починаємо наступний раунд?"
              : "Поле заповнене, переможця немає. Спробуйте ще раз."
          }
          dismissButton={false}
          actionLabel="Новий раунд"
          actionIcon="refresh"
          onAction={() => setState(startNextRound(state))}
        />
      )}

      <PDivider color="contrast-low" />
      <Scoreboard scores={state.scores} />

      <div className={styles.actions}>
        <PButton type="button" icon="refresh" onClick={() => setState(startNextRound(state))}>
          Новий раунд
        </PButton>
        <PButton
          type="button"
          variant="secondary"
          icon="delete"
          onClick={() => setState(INITIAL_STATE)}
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

function OnlineGame({ onExit }: { onExit: () => void }) {
  const game = useOnlineGame();

  if (game.phase === "idle" || game.phase === "error") {
    return <OnlineLobby game={game} onExit={onExit} />;
  }
  if (game.phase === "hosting" || game.phase === "joining") {
    return <OnlineWaiting game={game} onExit={onExit} />;
  }
  return <OnlineBoard game={game} onExit={onExit} />;
}

type OnlineProps = { game: ReturnType<typeof useOnlineGame>; onExit: () => void };

function OnlineLobby({ game, onExit }: OnlineProps) {
  const [input, setInput] = useState("");
  const invite = useRoomInvite();
  const { join, phase } = game;

  // Dial the host automatically when arriving from an invite link. Opening a
  // connection is an external side effect — but never retry after an error,
  // or a failed link would loop forever.
  useEffect(() => {
    if (invite && phase === "idle") {
      join(invite);
    }
  }, [invite, join, phase]);

  const code = normalizeRoomCode(input);

  return (
    <>
      {game.error && (
        <PInlineNotification state="error" heading="Не вдалося" description={game.error} dismissButton={false} />
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
  const result = useMemo(() => getResult(game.state.board), [game.state.board]);
  const isOver = result.status !== "playing";
  const turn = currentPlayer(game.state);
  const isMyTurn = turn === game.role;
  const youWon = result.status === "won" && result.winner === game.role;

  return (
    <>
      <div className={styles.statusBar}>
        {isOver ? (
          <PTag variant={youWon ? "success" : result.status === "draw" ? "info" : "error"} icon="flag">
            {result.status === "draw" ? "Нічия" : youWon ? "Ви перемогли" : "Ви програли"}
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

      <Board
        board={game.state.board}
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

      {isOver && game.opponentPresent && (
        <PInlineNotification
          state={youWon ? "success" : result.status === "draw" ? "info" : "error"}
          heading={
            result.status === "draw" ? "Нічия" : youWon ? "Ви виграли раунд!" : "Раунд за суперником"
          }
          description="Рахунок збережено. Готові до реваншу?"
          dismissButton={false}
          actionLabel="Ще раз"
          actionIcon="refresh"
          onAction={game.rematch}
        />
      )}

      <PDivider color="contrast-low" />
      <Scoreboard scores={game.state.scores} />

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
