import { useEffect, useState } from 'react';
import {
  PFieldset,
  PInputNumber,
  PSegmentedControl,
  PSegmentedControlItem,
  PSwitch,
} from '@porsche-design-system/components-react';
import {
  BOARD_MAX,
  BOARD_MIN,
  SPEED_LABELS,
  clampBoardSize,
  type Scheme,
  type Settings,
  type Speed,
} from '../game/settings';

type SettingsPanelProps = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
};

const SPEEDS: Speed[] = ['chill', 'normal', 'fast'];

const SCHEMES: { value: Scheme; label: string }[] = [
  { value: 'light-dark', label: 'Системна' },
  { value: 'light', label: 'Світла' },
  { value: 'dark', label: 'Темна' },
];

export const SettingsPanel = ({ settings, onChange }: SettingsPanelProps) => {
  // Поле розміру тримає власний чернетковий рядок: поки користувач друкує,
  // проміжне значення може бути поза межами, і підставляти його в гру рано.
  const [draft, setDraft] = useState(String(settings.boardSize));
  useEffect(() => setDraft(String(settings.boardSize)), [settings.boardSize]);

  const parsed = Number(draft);
  const invalid = draft.trim() === '' || !Number.isFinite(parsed) || parsed !== clampBoardSize(parsed);

  const commitBoardSize = () => {
    if (!Number.isFinite(parsed) || draft.trim() === '') {
      setDraft(String(settings.boardSize));
      return;
    }
    const size = clampBoardSize(parsed);
    setDraft(String(size));
    onChange({ boardSize: size });
  };

  return (
    <PFieldset label="Налаштування партії" className="stack">
      <PSegmentedControl
        label="Темп"
        description="Як часто зміюка робить крок"
        value={settings.speed}
        onChange={(event) => onChange({ speed: event.detail.value as Speed })}
      >
        {SPEEDS.map((speed) => (
          <PSegmentedControlItem key={speed} value={speed}>
            {SPEED_LABELS[speed]}
          </PSegmentedControlItem>
        ))}
      </PSegmentedControl>

      <PInputNumber
        name="boardSize"
        label="Розмір поля"
        description={`Кількість клітинок по стороні, від ${BOARD_MIN} до ${BOARD_MAX}`}
        controls
        min={BOARD_MIN}
        max={BOARD_MAX}
        value={draft}
        state={invalid ? 'error' : 'none'}
        message={invalid ? `Треба ціле число від ${BOARD_MIN} до ${BOARD_MAX}` : ''}
        onInput={(event) => setDraft((event.detail.target as HTMLInputElement).value)}
        onBlur={commitBoardSize}
      />

      <PSwitch
        checked={settings.passThroughWalls}
        onUpdate={(event) => onChange({ passThroughWalls: event.detail.checked })}
        alignLabel="start"
        stretch
      >
        Проходити крізь стіни
      </PSwitch>

      <PSegmentedControl
        label="Тема"
        value={settings.scheme}
        onChange={(event) => onChange({ scheme: event.detail.value as Scheme })}
      >
        {SCHEMES.map(({ value, label }) => (
          <PSegmentedControlItem key={value} value={value}>
            {label}
          </PSegmentedControlItem>
        ))}
      </PSegmentedControl>
    </PFieldset>
  );
};
