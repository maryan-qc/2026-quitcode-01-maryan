"use client";

import { useSyncExternalStore } from "react";
import {
  getDefaultSettings,
  getSettings,
  subscribeSettings,
  type Settings,
} from "@/lib/settings";

/** Settings live in localStorage — an external store, shared across tabs. */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribeSettings, getSettings, getDefaultSettings);
}
