"use client";

import { useEffect, useState } from "react";
import { PText } from "@porsche-design-system/components-react/ssr";
import styles from "./tic-tac-toe.module.css";

type TurnTimerProps = {
  seconds: number;
  /**
   * Called once when the clock hits zero. Only the side that owns the game
   * state passes this — online, that is the host.
   */
  onExpire?: () => void;
  label: string;
};

const TICK_MS = 100;
/** Below this the bar turns red and the seconds get an urgent tone. */
const URGENT_MS = 5000;

/**
 * Runs for as long as it is mounted, so the parent controls the clock purely by
 * rendering it or not. Mount it with `key={turnId}` — a new turn remounts it,
 * which restarts the countdown from a fresh deadline with no syncing effect.
 */
export function TurnTimer({ seconds, onExpire, label }: TurnTimerProps) {
  const [deadline] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const total = seconds * 1000;
  const remaining = Math.max(0, deadline - now);
  const expired = remaining === 0;

  useEffect(() => {
    if (expired) {
      onExpire?.();
    }
  }, [expired, onExpire]);

  const urgent = remaining <= URGENT_MS;

  return (
    <div className={styles.timer}>
      <div className={styles.timerHead}>
        <PText size="xs" color="contrast-medium">
          {label}
        </PText>
        <PText size="xs" weight="bold" color={urgent ? "error" : "primary"}>
          {Math.ceil(remaining / 1000)} с
        </PText>
      </div>
      <div
        className={styles.timerTrack}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={seconds}
        aria-valuenow={Math.ceil(remaining / 1000)}
      >
        <div
          className={urgent ? `${styles.timerFill} ${styles.timerFillUrgent}` : styles.timerFill}
          style={{ inlineSize: `${total > 0 ? (remaining / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}
