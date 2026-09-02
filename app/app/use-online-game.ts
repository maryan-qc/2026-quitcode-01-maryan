"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DataConnection, Peer } from "peerjs";
import { INITIAL_STATE, applyMove, startNextRound, type GameState, type Player } from "@/lib/game";
import {
  createRoomCode,
  parseMessage,
  peerIdForRoom,
  type NetMessage,
} from "@/lib/room";

export type OnlinePhase =
  | "idle"
  | "hosting" // room open, waiting for the opponent
  | "joining" // dialling the host
  | "playing"
  | "error";

export type OnlineGame = {
  phase: OnlinePhase;
  code: string | null;
  /** Which mark this browser plays. Host is always X. */
  role: Player | null;
  state: GameState;
  opponentPresent: boolean;
  error: string | null;
  host: () => void;
  join: (code: string) => void;
  leave: () => void;
  play: (index: number) => void;
  rematch: () => void;
};

const ERROR_MESSAGES: Record<string, string> = {
  "peer-unavailable": "Кімнату не знайдено. Перевірте код — можливо, гру вже закрито.",
  "unavailable-id": "Цей код уже зайнятий. Спробуйте створити гру ще раз.",
  network: "Немає зв'язку із сервером з'єднань. Перевірте інтернет.",
  "socket-error": "Немає зв'язку із сервером з'єднань. Перевірте інтернет.",
  "socket-closed": "З'єднання із сервером обірвалось. Спробуйте ще раз.",
  "browser-incompatible": "Цей браузер не підтримує WebRTC — онлайн-гра недоступна.",
  "webrtc-blocked": "З'єднання не вдалося встановити. Ймовірно, мережа блокує WebRTC.",
};

function describeError(type: string): string {
  return ERROR_MESSAGES[type] ?? "Не вдалося встановити з'єднання. Спробуйте ще раз.";
}

export function useOnlineGame(): OnlineGame {
  const [phase, setPhase] = useState<OnlinePhase>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [role, setRole] = useState<Player | null>(null);
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [opponentPresent, setOpponentPresent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const roleRef = useRef<Player | null>(null);
  // The host owns the authoritative state; keep it out of the render cycle so
  // message handlers registered once always read the latest value.
  const stateRef = useRef<GameState>(INITIAL_STATE);

  const commit = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const send = useCallback((message: NetMessage) => {
    if (connRef.current?.open) {
      connRef.current.send(message);
    }
  }, []);

  const broadcastState = useCallback(
    (next: GameState) => {
      commit(next);
      send({ t: "state", state: next });
    },
    [commit, send],
  );

  const teardown = useCallback(() => {
    connRef.current?.close();
    connRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    roleRef.current = null;
  }, []);

  useEffect(() => teardown, [teardown]);

  const attachConnection = useCallback(
    (conn: DataConnection) => {
      connRef.current = conn;

      conn.on("open", () => {
        setOpponentPresent(true);
        setPhase("playing");
        // The host is the source of truth — hand the fresh guest the board.
        if (roleRef.current === "X") {
          conn.send({ t: "state", state: stateRef.current } satisfies NetMessage);
        }
      });

      conn.on("data", (raw) => {
        const message = parseMessage(raw);
        if (!message) {
          return;
        }

        if (roleRef.current === "X") {
          // Host validates every intent before it becomes state.
          if (message.t === "move") {
            if (stateRef.current.xIsNext) {
              return; // not the guest's turn
            }
            broadcastState(applyMove(stateRef.current, message.index));
          } else if (message.t === "rematch") {
            broadcastState(startNextRound(stateRef.current));
          }
        } else if (message.t === "state") {
          commit(message.state);
        }
      });

      conn.on("close", () => {
        setOpponentPresent(false);
        connRef.current = null;
      });

      conn.on("error", () => {
        setOpponentPresent(false);
      });
    },
    [broadcastState, commit],
  );

  const createPeer = useCallback(
    async (peerId: string | undefined): Promise<Peer> => {
      const { default: PeerCtor } = await import("peerjs");
      const peer = peerId ? new PeerCtor(peerId) : new PeerCtor();
      peerRef.current = peer;

      peer.on("error", (err: Error & { type?: string }) => {
        setError(describeError(err.type ?? ""));
        setPhase("error");
        setOpponentPresent(false);
      });

      return peer;
    },
    [],
  );

  const host = useCallback(() => {
    teardown();
    setError(null);
    setOpponentPresent(false);
    commit(INITIAL_STATE);

    const roomCode = createRoomCode();
    setCode(roomCode);
    setRole("X");
    roleRef.current = "X";
    setPhase("hosting");

    void createPeer(peerIdForRoom(roomCode)).then((peer) => {
      peer.on("connection", (conn) => {
        // One opponent per room — a second dialler is turned away.
        if (connRef.current) {
          conn.close();
          return;
        }
        attachConnection(conn);
      });
    });
  }, [attachConnection, commit, createPeer, teardown]);

  const join = useCallback(
    (roomCode: string) => {
      teardown();
      setError(null);
      setOpponentPresent(false);
      commit(INITIAL_STATE);

      setCode(roomCode);
      setRole("O");
      roleRef.current = "O";
      setPhase("joining");

      void createPeer(undefined).then((peer) => {
        peer.on("open", () => {
          attachConnection(peer.connect(peerIdForRoom(roomCode), { reliable: true }));
        });
      });
    },
    [attachConnection, commit, createPeer, teardown],
  );

  const leave = useCallback(() => {
    teardown();
    setPhase("idle");
    setCode(null);
    setRole(null);
    setOpponentPresent(false);
    setError(null);
    commit(INITIAL_STATE);
  }, [commit, teardown]);

  const play = useCallback(
    (index: number) => {
      if (!opponentPresent || roleRef.current === null) {
        return;
      }
      const isMyTurn = (stateRef.current.xIsNext ? "X" : "O") === roleRef.current;
      if (!isMyTurn) {
        return;
      }

      if (roleRef.current === "X") {
        broadcastState(applyMove(stateRef.current, index));
      } else {
        send({ t: "move", index });
      }
    },
    [broadcastState, opponentPresent, send],
  );

  const rematch = useCallback(() => {
    if (roleRef.current === "X") {
      broadcastState(startNextRound(stateRef.current));
    } else {
      send({ t: "rematch" });
    }
  }, [broadcastState, send]);

  return { phase, code, role, state, opponentPresent, error, host, join, leave, play, rematch };
}
