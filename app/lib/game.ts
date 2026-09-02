export type Player = "X" | "O";
export type Cell = Player | null;
export type Board = Cell[];

/** Index triples that win the game — 3 rows, 3 columns, 2 diagonals. */
export const WINNING_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const EMPTY_BOARD: Board = Array<Cell>(9).fill(null);

export type GameResult =
  | { status: "playing"; winner: null; line: null }
  | { status: "won"; winner: Player; line: readonly [number, number, number] }
  | { status: "draw"; winner: null; line: null };

/** Derives the outcome of a board: a winner with its line, a draw, or still playing. */
export function getResult(board: Board): GameResult {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const mark = board[a];
    if (mark && mark === board[b] && mark === board[c]) {
      return { status: "won", winner: mark, line };
    }
  }

  return board.every((cell) => cell !== null)
    ? { status: "draw", winner: null, line: null }
    : { status: "playing", winner: null, line: null };
}
