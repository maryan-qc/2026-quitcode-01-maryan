import { TicTacToe } from "./tic-tac-toe";
import styles from "./tic-tac-toe.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <TicTacToe />
    </main>
  );
}
