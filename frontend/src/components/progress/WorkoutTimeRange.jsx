import React from 'react';
import { Play, Flag } from 'lucide-react';
import { getWorkoutTimeWindow } from '../../utils/dateUtils';

const WorkoutTimeRange = ({ startDate, durationSeconds = 0, showYear = false, className = '' }) => {
  const windowInfo = getWorkoutTimeWindow(startDate, durationSeconds);
  if (!windowInfo) return null;

  const startDateText = showYear ? windowInfo.startDateLabel : windowInfo.startShortDateLabel;
  const endDateText = showYear ? windowInfo.endDateLabel : windowInfo.endShortDateLabel;

  return (
    <div className={`grid grid-cols-1 xs:grid-cols-2 gap-2 ${className}`}>
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-glass-border min-w-0">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary shrink-0">
          <Play size={11} className="text-accent" />
          Inicio
        </span>
        <span className="text-xs font-bold text-text-primary font-mono truncate">
          {startDateText} · {windowInfo.startTimeLabel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-glass-border min-w-0">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary shrink-0">
          <Flag size={11} className="text-text-muted" />
          Fin
          {windowInfo.crossesMidnight && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-accent/15 text-accent uppercase tracking-tight">
              +1 día
            </span>
          )}
        </span>
        <span className="text-xs font-bold text-text-primary font-mono truncate">
          {endDateText} · {windowInfo.endTimeLabel}
        </span>
      </div>
    </div>
  );
};

export default WorkoutTimeRange;
