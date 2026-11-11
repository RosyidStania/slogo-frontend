function TrendDeltaPill({ trendDelta, totalEvents, presentationMode = false }) {
  if (totalEvents <= 0) {
    return null;
  }

  const sizeClass = presentationMode
    ? 'px-2.5 py-0.5 text-xs'
    : 'px-2 py-0.5 text-[10px]';

  if (trendDelta === null || trendDelta === undefined) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100 font-bold text-slate-600 tabular-nums ${sizeClass}`}
      >
        Baru 1x
      </span>
    );
  }

  const numericDelta = Number(trendDelta);
  if (!Number.isFinite(numericDelta)) {
    return null;
  }

  if (numericDelta > 0) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-teal-200/80 bg-teal-50 font-extrabold text-[#0d9488] tabular-nums ${sizeClass}`}
      >
        ▲ +{numericDelta}%
      </span>
    );
  }

  if (numericDelta < 0) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-rose-200/80 bg-rose-50 font-extrabold text-rose-700 tabular-nums ${sizeClass}`}
      >
        ▼ -{Math.abs(numericDelta)}%
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100 font-bold text-slate-600 tabular-nums ${sizeClass}`}
    >
      Stabil 0%
    </span>
  );
}

function MiniSparkline({ monthlySeries = [], isNegativeTrend = false, isEmpty = false }) {
  const width = 84;
  const height = 28;
  const padX = 4;
  const padY = 4;

  const validValues = Array.isArray(monthlySeries)
    ? monthlySeries
        .filter((item) => item?.has_event && item?.percentage !== null && item?.percentage !== undefined)
        .map((item) => Number(item.percentage))
        .filter((val) => Number.isFinite(val))
    : [];

  const strokeColor = isNegativeTrend ? '#f43f5e' : '#14b8a6';

  if (isEmpty || validValues.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-20 h-7 shrink-0"
        aria-hidden="true"
      >
        <line
          x1={padX}
          y1={height / 2}
          x2={width - padX}
          y2={height / 2}
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (validValues.length === 1) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-20 h-7 shrink-0"
        aria-hidden="true"
      >
        <line
          x1={padX}
          y1={height / 2}
          x2={width - padX}
          y2={height / 2}
          stroke="#e2e8f0"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx={width / 2} cy={height / 2} r="3" fill={strokeColor} />
      </svg>
    );
  }

  const minVal = Math.min(...validValues);
  const maxVal = Math.max(...validValues);
  const range = maxVal - minVal;
  const usableWidth = width - padX * 2;
  const usableHeight = height - padY * 2;

  const coords = validValues.map((val, idx) => {
    const x = padX + (idx / (validValues.length - 1)) * usableWidth;
    const y = range === 0
      ? height / 2
      : padY + (1 - (val - minVal) / range) * usableHeight;
    return { x, y };
  });

  const pointsAttr = coords.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
  const lastPoint = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-20 h-7 shrink-0"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pointsAttr}
      />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="2.75" fill={strokeColor} />
    </svg>
  );
}

export default function CategorySummaryCards({
  categories = [],
  selectedTypeId,
  onSelectCategory,
  presentationMode = false,
}) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  return (
    <div className="flex overflow-x-auto hide-scrollbar pb-1 gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:overflow-visible sm:pb-0">
      {categories.map((cat) => {
        const isSelected = selectedTypeId !== null
          && selectedTypeId !== undefined
          && Number(selectedTypeId) === Number(cat.event_type_id);

        const totalEvents = Number(cat?.summary?.total_events ?? 0);
        const activeMonths = Number(cat?.summary?.active_months ?? 0);
        const avgPercentage = Number(cat?.summary?.avg_percentage ?? 0);
        const trendDelta = cat?.summary?.trend_delta ?? null;
        const isEmpty = totalEvents === 0;
        const isGroupScope = Boolean(cat?.is_group_attendance);
        const numericTrendDelta = trendDelta !== null && trendDelta !== undefined ? Number(trendDelta) : null;
        const isNegativeTrend = numericTrendDelta !== null && Number.isFinite(numericTrendDelta) && numericTrendDelta < 0;

        let stateClass;
        if (isSelected) {
          stateClass = `border-[#14b8a6] bg-teal-50/40 ring-2 ring-[#14b8a6]/20 shadow-[0_4px_12px_rgba(20,184,166,0.08)]${
            isEmpty ? ' opacity-85' : ''
          }`;
        } else if (isEmpty) {
          stateClass = 'opacity-60 bg-slate-50/70 border-slate-200/80 hover:opacity-80 hover:border-slate-300';
        } else {
          stateClass = 'bg-white border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-sm';
        }

        return (
          <button
            key={cat.event_type_id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectCategory?.(cat.event_type_id)}
            className={`w-[235px] sm:w-full text-left rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14b8a6] ${
              presentationMode ? 'p-4 sm:p-5 gap-3.5' : 'p-3.5 sm:p-4 gap-3'
            } ${stateClass}`}
          >
            {/* Header: Category name + Scope badge */}
            <div className="flex items-start justify-between gap-2">
              <h3
                title={cat.name}
                className={`font-extrabold text-slate-900 leading-snug line-clamp-1 ${
                  presentationMode ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                }`}
              >
                {cat.name}
              </h3>
              <span
                className={`shrink-0 inline-flex items-center rounded-full border font-bold ${
                  presentationMode ? 'px-2.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-[10px]'
                } ${
                  isGroupScope
                    ? 'bg-sky-50 text-sky-700 border-sky-200/70'
                    : 'bg-teal-50 text-[#0d9488] border-teal-200/70'
                }`}
              >
                {isGroupScope ? 'Kelompok' : 'Desa'}
              </span>
            </div>

            {/* KPI + Delta + Sparkline */}
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                {isEmpty ? (
                  <p
                    className={`font-bold text-slate-500 ${
                      presentationMode ? 'text-base' : 'text-sm'
                    }`}
                  >
                    Belum ada acara
                  </p>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-extrabold text-slate-900 tracking-tight leading-none tabular-nums ${
                        presentationMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-[26px]'
                      }`}
                    >
                      {avgPercentage}%
                    </span>
                    <TrendDeltaPill
                      trendDelta={trendDelta}
                      totalEvents={totalEvents}
                      presentationMode={presentationMode}
                    />
                  </div>
                )}
              </div>

              <MiniSparkline
                monthlySeries={cat.monthly_series}
                isNegativeTrend={isNegativeTrend}
                isEmpty={isEmpty}
              />
            </div>

            {/* Meta footer */}
            <p
              className={`font-semibold text-slate-500 truncate tabular-nums ${
                presentationMode ? 'text-xs' : 'text-[11px]'
              }`}
            >
              {totalEvents} acara · {activeMonths} bln aktif
            </p>
          </button>
        );
      })}
    </div>
  );
}
