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

export type Scores = Record<Player | "draws", number>;

export const EMPTY_SCORES: Scores = { X: 0, O: 0, draws: 0 };

export type GameState = {
  board: Board;
  xIsNext: boolean;
  scores: Scores;
};

export const INITIAL_STATE: GameState = {
  board: EMPTY_BOARD,
  xIsNext: true,
  scores: EMPTY_SCORES,
};

export function currentPlayer(state: GameState): Player {
  return state.xIsNext ? "X" : "O";
}

/**
 * Applies a move and folds the round's outcome into the score. Returns the
 * state unchanged when the move is illegal, so it is safe to call on moves
 * arriving from the network.
 */
export function applyMove(state: GameState, index: number): GameState {
  const isPlayable =
    Number.isInteger(index) &&
    index >= 0 &&
    index < 9 &&
    state.board[index] === null &&
    getResult(state.board).status === "playing";

  if (!isPlayable) {
    return state;
  }

  const mark = currentPlayer(state);
  const board = state.board.map((cell, i) => (i === index ? mark : cell));
  const result = getResult(board);

  const scores: Scores =
    result.status === "won"
      ? { ...state.scores, [result.winner]: state.scores[result.winner] + 1 }
      : result.status === "draw"
        ? { ...state.scores, draws: state.scores.draws + 1 }
        : state.scores;

  return { board, xIsNext: !state.xIsNext, scores };
}

/** Clears the board, keeping the score. The loser of the round opens the next. */
export function startNextRound(state: GameState): GameState {
  const result = getResult(state.board);
  return {
    board: EMPTY_BOARD,
    xIsNext: result.status === "won" ? result.winner === "O" : state.xIsNext,
    scores: state.scores,
  };
}
