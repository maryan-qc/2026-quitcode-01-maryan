import {
  PButtonPure,
  PHeading,
  PTable,
  PTableBody,
  PTableCell,
  PTableHead,
  PTableHeadCell,
  PTableHeadRow,
  PTableRow,
  PTag,
  PText,
} from '@porsche-design-system/components-react';
import { SPEED_LABELS } from '../game/settings';
import type { Score } from '../game/scores';

type ScoreboardProps = {
  scores: Score[];
  onClear: () => void;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(
    date
  );
};

export const Scoreboard = ({ scores, onClear }: ScoreboardProps) => (
  <section className="stack">
    <div className="row row--between">
      <PHeading size="sm" tag="h2">
        Рекорди
      </PHeading>
      {scores.length > 0 && (
        <PButtonPure type="button" icon="delete" size="xs" onClick={onClear}>
          Очистити
        </PButtonPure>
      )}
    </div>

    {scores.length === 0 ? (
      <PText color="contrast-medium">
        Тут з'явиться п'ятірка найкращих партій. Зіграй першу — рекорди зберігаються у цьому браузері.
      </PText>
    ) : (
      <PTable caption="Найкращі партії">
        <PTableHead>
          <PTableHeadRow>
            <PTableHeadCell>Бали</PTableHeadCell>
            <PTableHeadCell>Яблука</PTableHeadCell>
            <PTableHeadCell>Темп</PTableHeadCell>
            <PTableHeadCell>Поле</PTableHeadCell>
            <PTableHeadCell>Дата</PTableHeadCell>
          </PTableHeadRow>
        </PTableHead>
        <PTableBody>
          {scores.map((score, index) => (
            <PTableRow key={`${score.playedAt}-${score.score}`}>
              <PTableCell>
                <PTag variant={index === 0 ? 'success' : 'secondary'} compact>
                  {score.score}
                </PTag>
              </PTableCell>
              <PTableCell>{score.apples}</PTableCell>
              <PTableCell>{SPEED_LABELS[score.speed]}</PTableCell>
              <PTableCell>
                {score.boardSize}×{score.boardSize}
                {score.passThroughWalls ? ', без стін' : ''}
              </PTableCell>
              <PTableCell>{formatDate(score.playedAt)}</PTableCell>
            </PTableRow>
          ))}
        </PTableBody>
      </PTable>
    )}
  </section>
);
