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

export function opponentOf(player: Player): Player {
  return player === "X" ? "O" : "X";
}

export type Scores = Record<Player | "draws", number>;

export const EMPTY_SCORES: Scores = { X: 0, O: 0, draws: 0 };

export type GameState = {
  board: Board;
  xIsNext: boolean;
  scores: Scores;
  /** Seconds allowed per move. 0 turns the clock off. */
  turnSeconds: number;
  /** Bumped whenever a new turn begins, so clients can restart the countdown. */
  turnId: number;
  /** Set when the round ended because this player ran out of time. */
  timedOut: Player | null;
};

export function createGameState(turnSeconds = 0): GameState {
  return {
    board: EMPTY_BOARD,
    xIsNext: true,
    scores: EMPTY_SCORES,
    turnSeconds,
    turnId: 0,
    timedOut: null,
  };
}

export function currentPlayer(state: GameState): Player {
  return state.xIsNext ? "X" : "O";
}

/** A round ends on a line, on a full board, or on the clock. */
export function isRoundOver(state: GameState): boolean {
  return state.timedOut !== null || getResult(state.board).status !== "playing";
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
    !isRoundOver(state);

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

  return { ...state, board, xIsNext: !state.xIsNext, scores, turnId: state.turnId + 1 };
}

/** The player on the clock ran out of time and forfeits the round. */
export function applyTimeout(state: GameState): GameState {
  if (state.turnSeconds <= 0 || isRoundOver(state)) {
    return state;
  }

  const loser = currentPlayer(state);
  const winner = opponentOf(loser);

  return {
    ...state,
    scores: { ...state.scores, [winner]: state.scores[winner] + 1 },
    timedOut: loser,
    turnId: state.turnId + 1,
  };
}

/**
 * Clears the board, keeping the score. The loser of the round opens the next
 * one; a draw keeps the previous order. `turnSeconds` is re-read here, so a
 * settings change takes effect from the next round.
 */
export function startNextRound(state: GameState, turnSeconds = state.turnSeconds): GameState {
  const result = getResult(state.board);
  const loser: Player | null =
    state.timedOut ?? (result.status === "won" ? opponentOf(result.winner) : null);

  return {
    board: EMPTY_BOARD,
    xIsNext: loser ? loser === "X" : state.xIsNext,
    scores: state.scores,
    turnSeconds,
    turnId: state.turnId + 1,
    timedOut: null,
  };
}
