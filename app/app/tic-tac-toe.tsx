"use client";

import { useMemo, useState } from "react";
import {
  PButton,
  PDivider,
  PHeading,
  PInlineNotification,
  PTag,
  PText,
} from "@porsche-design-system/components-react/ssr";
import { EMPTY_BOARD, getResult, type Board, type Player } from "@/lib/game";
import styles from "./tic-tac-toe.module.css";

type Scores = Record<Player | "draws", number>;

const EMPTY_SCORES: Scores = { X: 0, O: 0, draws: 0 };

export function TicTacToe() {
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [xIsNext, setXIsNext] = useState(true);
  const [scores, setScores] = useState<Scores>(EMPTY_SCORES);

  const result = useMemo(() => getResult(board), [board]);
  const currentPlayer: Player = xIsNext ? "X" : "O";
  const isOver = result.status !== "playing";

  function handleCellClick(index: number) {
    if (isOver || board[index]) {
      return;
    }

    const nextBoard = board.map((cell, i) => (i === index ? currentPlayer : cell));
    const nextResult = getResult(nextBoard);

    if (nextResult.status === "won") {
      setScores((prev) => ({ ...prev, [nextResult.winner]: prev[nextResult.winner] + 1 }));
    } else if (nextResult.status === "draw") {
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
    }

    setBoard(nextBoard);
    setXIsNext(!xIsNext);
  }

  function startNewRound() {
    setBoard(EMPTY_BOARD);
    // The loser of the previous round opens the next one; a draw keeps the order.
    setXIsNext(result.status === "won" ? result.winner === "O" : xIsNext);
  }

  function resetEverything() {
    setBoard(EMPTY_BOARD);
    setXIsNext(true);
    setScores(EMPTY_SCORES);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <PHeading tag="h1" size="xl">
          Хрестики-нулики
        </PHeading>
        <PText color="contrast-medium">
          Два гравці, одна дошка 3×3. Хто перший збере лінію — той переміг.
        </PText>
      </header>

      <div className={styles.statusBar}>
        {isOver ? (
          <PTag variant={result.status === "won" ? "success" : "info"} icon="flag">
            {result.status === "won" ? `Переміг ${result.winner}` : "Нічия"}
          </PTag>
        ) : (
          <PTag variant={currentPlayer === "X" ? "info" : "warning"}>
            Ходить {currentPlayer}
          </PTag>
        )}
        <PText size="xs" color="contrast-medium">
          Ходів зроблено: {board.filter(Boolean).length} / 9
        </PText>
      </div>

      <div className={styles.board} role="grid" aria-label="Ігрове поле 3 на 3">
        {board.map((cell, index) => {
          const isWinning = result.line?.includes(index) ?? false;
          const row = Math.floor(index / 3) + 1;
          const column = (index % 3) + 1;

          return (
            <button
              key={index}
              type="button"
              role="gridcell"
              className={[
                styles.cell,
                cell === "X" ? styles.markX : cell === "O" ? styles.markO : "",
                isWinning ? styles.winning : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={isOver || cell !== null}
              onClick={() => handleCellClick(index)}
              aria-label={
                cell
                  ? `Рядок ${row}, колонка ${column}: ${cell}`
                  : `Рядок ${row}, колонка ${column}: порожньо`
              }
            >
              {cell}
            </button>
          );
        })}
      </div>

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
          onAction={startNewRound}
        />
      )}

      <PDivider color="contrast-low" />

      <section aria-label="Рахунок">
        <div className={styles.scores}>
          <div className={styles.score}>
            <PText size="xs" color="contrast-medium">
              X
            </PText>
            <PText size="lg" weight="bold">
              {scores.X}
            </PText>
          </div>
          <div className={styles.score}>
            <PText size="xs" color="contrast-medium">
              Нічиї
            </PText>
            <PText size="lg" weight="bold">
              {scores.draws}
            </PText>
          </div>
          <div className={styles.score}>
            <PText size="xs" color="contrast-medium">
              O
            </PText>
            <PText size="lg" weight="bold">
              {scores.O}
            </PText>
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <PButton type="button" icon="refresh" onClick={startNewRound}>
          Новий раунд
        </PButton>
        <PButton type="button" variant="secondary" icon="delete" onClick={resetEverything}>
          Скинути рахунок
        </PButton>
      </div>
    </div>
  );
}
