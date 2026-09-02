"use client";

import { PText } from "@porsche-design-system/components-react/ssr";
import type { Scores } from "@/lib/game";
import styles from "./tic-tac-toe.module.css";

const COLUMNS: { key: keyof Scores; label: string }[] = [
  { key: "X", label: "X" },
  { key: "draws", label: "Нічиї" },
  { key: "O", label: "O" },
];

export function Scoreboard({ scores }: { scores: Scores }) {
  return (
    <section aria-label="Рахунок">
      <div className={styles.scores}>
        {COLUMNS.map(({ key, label }) => (
          <div key={key} className={styles.score}>
            <PText size="xs" color="contrast-medium">
              {label}
            </PText>
            <PText size="lg" weight="bold">
              {scores[key]}
            </PText>
          </div>
        ))}
      </div>
    </section>
  );
}
