"use client";

import type { Board as BoardModel, GameResult } from "@/lib/game";
import styles from "./tic-tac-toe.module.css";

type BoardProps = {
  board: BoardModel;
  result: GameResult;
  /** Blocks every cell — round over, or it is the opponent's turn. */
  locked: boolean;
  onPlay: (index: number) => void;
};

export function Board({ board, result, locked, onPlay }: BoardProps) {
  return (
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
            disabled={locked || cell !== null}
            onClick={() => onPlay(index)}
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
  );
}
