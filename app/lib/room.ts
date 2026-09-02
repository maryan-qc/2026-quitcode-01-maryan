import type { GameState } from "./game";

/** Alphabet without look-alikes (0/O, 1/I/L) so a code can be read aloud. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;

/** PeerJS ids are global across the public broker — namespace ours. */
const PEER_ID_PREFIX = "quitcode-ttt-";

export function createRoomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function normalizeRoomCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
}

export function isValidRoomCode(code: string): boolean {
  return (
    code.length === CODE_LENGTH &&
    [...code].every((char) => CODE_ALPHABET.includes(char))
  );
}

export function peerIdForRoom(code: string): string {
  return `${PEER_ID_PREFIX}${code.toLowerCase()}`;
}

/** Shareable link that drops the opponent straight into the room. */
export function inviteUrlForRoom(code: string): string {
  const url = new URL(window.location.href);
  url.search = `?room=${code}`;
  url.hash = "";
  return url.toString();
}

export function roomCodeFromLocation(): string | null {
  const raw = new URLSearchParams(window.location.search).get("room");
  if (!raw) {
    return null;
  }
  const code = normalizeRoomCode(raw);
  return isValidRoomCode(code) ? code : null;
}

/** The whole game, owned by the host and mirrored to the guest. */
export type SharedState = GameState;

export type NetMessage =
  | { t: "state"; state: SharedState }
  | { t: "move"; index: number }
  | { t: "rematch" };

function isCell(value: unknown): boolean {
  return value === null || value === "X" || value === "O";
}

/**
 * Full shape check on the mirrored state. A peer running a different build
 * would otherwise hand us a board the UI cannot render, and the whole page
 * would blank out on the first `board.map`.
 */
function isSharedState(value: unknown): value is SharedState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const s = value as Record<string, unknown>;
  const scores = s.scores as Record<string, unknown> | undefined;

  return (
    Array.isArray(s.board) &&
    s.board.length === 9 &&
    s.board.every(isCell) &&
    typeof s.xIsNext === "boolean" &&
    typeof scores === "object" &&
    scores !== null &&
    Number.isFinite(scores.X) &&
    Number.isFinite(scores.O) &&
    Number.isFinite(scores.draws) &&
    Number.isFinite(s.turnSeconds) &&
    Number.isInteger(s.turnId) &&
    (s.timedOut === null || s.timedOut === "X" || s.timedOut === "O")
  );
}

/** Guards against malformed payloads from the wire. */
export function parseMessage(data: unknown): NetMessage | null {
  if (typeof data !== "object" || data === null || !("t" in data)) {
    return null;
  }
  const msg = data as NetMessage;

  if (msg.t === "state") {
    return isSharedState(msg.state) ? msg : null;
  }
  if (msg.t === "move") {
    return Number.isInteger(msg.index) && msg.index >= 0 && msg.index < 9 ? msg : null;
  }
  if (msg.t === "rematch") {
    return msg;
  }
  return null;
}
