export type ThemeChoice = "system" | "light" | "dark";

export type Settings = {
  theme: ThemeChoice;
  timerEnabled: boolean;
  turnSeconds: number;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  timerEnabled: true,
  turnSeconds: 15,
};

export const MIN_TURN_SECONDS = 3;
export const MAX_TURN_SECONDS = 120;

export const STORAGE_KEY = "quitcode-ttt-settings";

/** Theming in PDS v4 is one CSS class on the root — there is no `theme` prop. */
export const THEME_CLASSES: Record<ThemeChoice, string> = {
  system: "scheme-light-dark",
  light: "scheme-light",
  dark: "scheme-dark",
};

export const ALL_THEME_CLASSES = Object.values(THEME_CLASSES);

export function clampTurnSeconds(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) {
    return DEFAULT_SETTINGS.turnSeconds;
  }
  return Math.min(MAX_TURN_SECONDS, Math.max(MIN_TURN_SECONDS, n));
}

function readStored(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed: unknown = JSON.parse(raw);
    const record = (typeof parsed === "object" && parsed !== null ? parsed : {}) as Record<string, unknown>;
    return {
      theme: record.theme === "light" || record.theme === "dark" ? record.theme : "system",
      timerEnabled:
        typeof record.timerEnabled === "boolean" ? record.timerEnabled : DEFAULT_SETTINGS.timerEnabled,
      turnSeconds: clampTurnSeconds(record.turnSeconds),
    };
  } catch {
    // Private mode, disabled storage, corrupted JSON — defaults are fine.
    return DEFAULT_SETTINGS;
  }
}

// useSyncExternalStore compares snapshots by reference, so the parsed object is
// cached and only replaced when something actually changes.
let cache: Settings | null = null;
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  if (!cache) {
    cache = readStored();
  }
  return cache;
}

/** Server/prerender snapshot — localStorage does not exist there. */
export function getDefaultSettings(): Settings {
  return DEFAULT_SETTINGS;
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);

  // Keep other tabs of the same game in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function updateSettings(patch: Partial<Settings>): void {
  const next: Settings = { ...getSettings(), ...patch };
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Not persisting is survivable; the session still uses the new value.
  }
  for (const listener of listeners) {
    listener();
  }
}

/** Seconds to give each move, honouring the on/off switch. */
export function effectiveTurnSeconds(settings: Settings): number {
  return settings.timerEnabled ? settings.turnSeconds : 0;
}
