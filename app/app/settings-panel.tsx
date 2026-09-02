"use client";

import {
  PDivider,
  PHeading,
  PInputNumber,
  PSegmentedControl,
  PSegmentedControlItem,
  PSwitch,
  PText,
} from "@porsche-design-system/components-react/ssr";
import {
  MAX_TURN_SECONDS,
  MIN_TURN_SECONDS,
  clampTurnSeconds,
  updateSettings,
  type ThemeChoice,
} from "@/lib/settings";
import { useSettings } from "./use-settings";
import styles from "./tic-tac-toe.module.css";

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "Системна" },
  { value: "light", label: "Світла" },
  { value: "dark", label: "Темна" },
];

export function SettingsPanel() {
  const settings = useSettings();

  return (
    <section className={styles.settings} aria-label="Налаштування">
      <PHeading tag="h2" size="sm">
        Налаштування
      </PHeading>

      <PSegmentedControl
        label="Тема"
        value={settings.theme}
        onChange={(event) => updateSettings({ theme: event.detail.value as ThemeChoice })}
      >
        {THEMES.map(({ value, label }) => (
          <PSegmentedControlItem key={value} value={value}>
            {label}
          </PSegmentedControlItem>
        ))}
      </PSegmentedControl>

      <PDivider color="contrast-lower" />

      <PSwitch
        checked={settings.timerEnabled}
        onUpdate={(event) => updateSettings({ timerEnabled: event.detail.checked })}
      >
        Таймер на хід
      </PSwitch>

      <PInputNumber
        name="turnSeconds"
        label="Секунд на хід"
        description={`Від ${MIN_TURN_SECONDS} до ${MAX_TURN_SECONDS}. Хто не встиг — програв раунд.`}
        value={settings.turnSeconds}
        min={MIN_TURN_SECONDS}
        max={MAX_TURN_SECONDS}
        step={1}
        disabled={!settings.timerEnabled}
        // `change` fires on blur and on the stepper, once the value has settled —
        // clamping on every keystroke would fight the person typing "20".
        onChange={(event) =>
          updateSettings({
            turnSeconds: clampTurnSeconds((event.target as HTMLInputElement).value),
          })
        }
      />

      <PText size="xs" color="contrast-medium">
        В онлайн-грі діють налаштування того, хто створив кімнату. Зміни застосуються
        з наступного раунду.
      </PText>
    </section>
  );
}
