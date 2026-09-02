"use client";

import { useSyncExternalStore } from "react";
import { roomCodeFromLocation } from "@/lib/room";

// The query string is external, immutable state for the lifetime of the page.
// useSyncExternalStore gives it a server snapshot (null), so the statically
// prerendered HTML and the first client render agree — no hydration mismatch,
// and no setState-in-effect.
const subscribe = () => () => {};
const getServerSnapshot = () => null;

/** Room code from `?room=…`, or null when the page was opened directly. */
export function useRoomInvite(): string | null {
  return useSyncExternalStore(subscribe, roomCodeFromLocation, getServerSnapshot);
}
