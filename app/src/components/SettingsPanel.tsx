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
  // проміжне значення («1» на шляху до «15») ще не має потрапляти в гру.
  const [draft, setDraft] = useState(String(settings.boardSize));
  useEffect(() => setDraft(String(settings.boardSize)), [settings.boardSize]);

  const parse = (value: string) => {
    const parsed = Number(value);
    if (value.trim() === '' || !Number.isFinite(parsed)) return null;
    return parsed === clampBoardSize(parsed) ? parsed : null;
  };

  const invalid = parse(draft) === null;

  /**
   * Валідне значення застосовуємо одразу під час введення, а не на blur:
   * інакше клік по «Грати» спершу зняв би фокус, і партія стартувала б
   * зі старим розміром поля.
   */
  const handleInput = (value: string) => {
    setDraft(value);
    const size = parse(value);
    if (size !== null) onChange({ boardSize: size });
  };

  // Недописане або хибне значення повертаємо до останнього прийнятого.
  const restoreOnBlur = () => {
    if (invalid) setDraft(String(settings.boardSize));
  };

  return (
    // Відступи задає внутрішній div: вміст потрапляє у слот PFieldset, тож
    // flex-gap з класу на самому компоненті до нього не дістає.
    <PFieldset label="Налаштування партії">
      <div className="stack">
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
          onInput={(event) => handleInput((event.detail.target as HTMLInputElement).value)}
          onBlur={restoreOnBlur}
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
      </div>
    </PFieldset>
  );
};
