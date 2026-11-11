import { useId, useState } from 'react';
import { BarChart3, CalendarX2, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MONTH_OPTIONS, formatRupiah } from './categoryStatisticsHelpers';

const MONTH_SHORT_MAP = Object.fromEntries(
  MONTH_OPTIONS.map((option) => [option.value, option.shortLabel])
);

function formatEventDate(dateStr) {
  if (typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (!match) return trimmed;
  const [, year, month, day] = match;
  const monthLabel = MONTH_SHORT_MAP[month] || month;
  return `${Number(day)} ${monthLabel} ${year}`;
}

function formatPercentLabel(value) {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) {
    return '';
  }
  return `${value}%`;
}

function computeYAxisMax(seriesData) {
  let maxPct = 100;
  for (const point of seriesData) {
    if (typeof point.percentage === 'number' && Number.isFinite(point.percentage) && point.percentage > maxPct) {
      maxPct = point.percentage;
    }
  }
  if (maxPct <= 100) return 100;
  return Math.ceil(maxPct / 10) * 10;
}

function TrendChartTooltip({ active, payload, presentationMode = false }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const textSizeClass = presentationMode ? 'text-sm' : 'text-xs';

  if (!point.has_event) {
    return (
      <div
        className={`bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-3.5 min-w-[205px] pointer-events-none ${textSizeClass}`}
      >
        <p className="font-extrabold text-slate-900 pb-1.5 mb-1.5 border-b border-slate-100">
          {point.label}
        </p>
        <p className="text-slate-500 font-medium">
          Tidak ada acara pada bulan ini
        </p>
      </div>
    );
  }

  const events = Array.isArray(point.events) ? point.events : [];
  const eventsCount = Number(point.events_count ?? events.length);
  const visibleEvents = events.slice(0, 2);
  const extraEventsCount = Math.max(0, eventsCount - visibleEvents.length);
  const showInfaq = point.infaq !== null && point.infaq !== undefined && Number(point.infaq) > 0;

  return (
    <div
      className={`bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-3.5 min-w-[240px] max-w-[300px] pointer-events-none ${textSizeClass}`}
    >
      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-100">
        <p className="font-extrabold text-slate-900">{point.label}</p>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-50 text-[#0d9488] border border-teal-200/80 font-black tabular-nums text-[11px]">
          {point.percentage ?? 0}%
        </span>
      </div>

      {visibleEvents.length > 0 && (
        <div className="space-y-1 mb-2.5 pb-2 border-b border-slate-100">
          {visibleEvents.map((ev, idx) => (
            <div key={ev.id ?? `${ev.name}-${idx}`} className="leading-snug">
              <p className="font-bold text-slate-800 truncate">{ev.name}</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {formatEventDate(ev.event_date)}
                {ev.kelompok ? ` · ${ev.kelompok}` : ''}
              </p>
            </div>
          ))}
          {extraEventsCount > 0 && (
            <p className="text-[11px] font-bold text-[#0d9488]">
              +{extraEventsCount} acara lainnya
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-semibold">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Persentase</span>
          <span className="font-black text-[#0d9488] tabular-nums">{point.percentage ?? 0}%</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Target</span>
          <span className="font-bold text-slate-900 tabular-nums">{point.target_total ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Hadir</span>
          <span className="font-bold text-[#14b8a6] tabular-nums">{point.hadir ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Terlambat</span>
          <span className="font-bold text-amber-600 tabular-nums">{point.terlambat ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Izin/Sakit</span>
          <span className="font-bold text-amber-500 tabular-nums">{point.izin_sakit ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Alpa</span>
          <span className="font-bold text-rose-500 tabular-nums">{point.alpa ?? 0}</span>
        </div>
      </div>

      {showInfaq && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 font-bold">
          <span className="text-slate-500">Infaq</span>
          <span className="text-amber-700 font-black tabular-nums">
            {formatRupiah(point.infaq)}
          </span>
        </div>
      )}
    </div>
  );
}

export default function CategoryTrendChart({
  category,
  periodLabel = '',
  presentationMode = false,
}) {
  const [chartMode, setChartMode] = useState('percent');
  const rawId = useId();
  const gradientId = `trend-area-fill-${rawId.replace(/:/g, '')}`;

  const totalEvents = Number(category?.summary?.total_events ?? 0);
  const seriesData = (Array.isArray(category?.monthly_series) ? category.monthly_series : []).map(
    (point) => ({
      ...point,
      percentage:
        point?.has_event && point?.percentage !== null && point?.percentage !== undefined
          ? Number(point.percentage)
          : null,
    })
  );

  const isEmpty = !category || totalEvents === 0 || seriesData.length === 0;
  const isGroupScope = Boolean(category?.is_group_attendance);
  const yMax = computeYAxisMax(seriesData);

  const chartHeightClass = presentationMode ? 'h-80 sm:h-96' : 'h-72 sm:h-80';
  const tickFontSize = presentationMode ? 13 : 11;
  const labelFontSize = presentationMode ? 13 : 11;
  const mobileMinWidthClass = seriesData.length > 6 ? 'min-w-[540px]' : 'min-w-[320px]';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Header */}
      <div
        className={`border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          presentationMode ? 'px-5 py-4 sm:px-6 sm:py-5' : 'px-4 py-3.5 sm:px-6 sm:py-4'
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-1.5 h-5 bg-[#14b8a6] rounded-full shrink-0" />
            <h2
              className={`font-extrabold text-slate-900 tracking-tight truncate ${
                presentationMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
              }`}
            >
              {category?.name || 'Tren Kehadiran Bulanan'}
            </h2>
            {category && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full border font-bold ${
                  presentationMode ? 'text-xs' : 'text-[10px] sm:text-[11px]'
                } ${
                  isGroupScope
                    ? 'bg-sky-50 text-sky-700 border-sky-200/70'
                    : 'bg-teal-50 text-[#0d9488] border-teal-200/70'
                }`}
              >
                {isGroupScope ? 'Kelompok' : 'Desa'}
              </span>
            )}
          </div>
          {periodLabel && (
            <p
              className={`text-slate-500 font-medium mt-1 pl-4 ${
                presentationMode ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs'
              }`}
            >
              Perkembangan bulanan · {periodLabel}
            </p>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/70 self-start sm:self-center shrink-0">
          <button
            type="button"
            aria-pressed={chartMode === 'percent'}
            onClick={() => setChartMode('percent')}
            className={`inline-flex items-center gap-1.5 rounded-full font-bold transition-all cursor-pointer ${
              presentationMode ? 'px-3.5 py-1.5 text-xs sm:text-sm' : 'px-3 py-1.5 text-[11px] sm:text-xs'
            } ${
              chartMode === 'percent'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp size={13} />
            <span>Tren Persentase (%)</span>
          </button>
          <button
            type="button"
            aria-pressed={chartMode === 'counts'}
            onClick={() => setChartMode('counts')}
            className={`inline-flex items-center gap-1.5 rounded-full font-bold transition-all cursor-pointer ${
              presentationMode ? 'px-3.5 py-1.5 text-xs sm:text-sm' : 'px-3 py-1.5 text-[11px] sm:text-xs'
            } ${
              chartMode === 'counts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 size={13} />
            <span>Komposisi Jumlah</span>
          </button>
        </div>
      </div>

      {/* Chart Body */}
      <div className={presentationMode ? 'p-4 sm:p-6' : 'p-3.5 sm:p-5'}>
        {isEmpty ? (
          <div className={`${chartHeightClass} flex flex-col items-center justify-center text-center px-4`}>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <CalendarX2 size={22} strokeWidth={2} />
            </div>
            <p className={`font-bold text-slate-700 ${presentationMode ? 'text-base' : 'text-sm'}`}>
              Belum ada acara pada periode ini
            </p>
            <p className={`text-slate-400 mt-1 max-w-md ${presentationMode ? 'text-sm' : 'text-xs'}`}>
              Pilih kategori lain atau perluas rentang bulan untuk melihat grafik perkembangan kehadiran.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto hide-scrollbar">
            <div className={`${chartHeightClass} ${mobileMinWidthClass} sm:min-w-0 w-full`}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                {chartMode === 'percent' ? (
                  <AreaChart
                    data={seriesData}
                    margin={{
                      top: presentationMode ? 34 : 28,
                      right: 20,
                      left: -8,
                      bottom: 4,
                    }}
                  >
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      padding={{ left: 16, right: 16 }}
                      tick={{ fill: '#64748b', fontSize: tickFontSize, fontWeight: 700 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, yMax]}
                      tick={{ fill: '#94a3b8', fontSize: tickFontSize, fontWeight: 600 }}
                      tickFormatter={(val) => `${val}%`}
                      dx={-4}
                    />
                    <Tooltip
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                      content={<TrendChartTooltip presentationMode={presentationMode} />}
                    />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      name="Kehadiran"
                      stroke="#14b8a6"
                      strokeWidth={presentationMode ? 3.5 : 2.75}
                      fill={`url(#${gradientId})`}
                      connectNulls={false}
                      animationDuration={450}
                      dot={{
                        r: presentationMode ? 6 : 5,
                        fill: '#14b8a6',
                        stroke: '#ffffff',
                        strokeWidth: 2.5,
                      }}
                      activeDot={{
                        r: presentationMode ? 8 : 7,
                        fill: '#0d9488',
                        stroke: '#ffffff',
                        strokeWidth: 2.5,
                      }}
                    >
                      <LabelList
                        dataKey="percentage"
                        position="top"
                        offset={presentationMode ? 12 : 10}
                        formatter={formatPercentLabel}
                        style={{
                          fill: '#0f766e',
                          fontSize: labelFontSize,
                          fontWeight: 800,
                        }}
                      />
                    </Area>
                  </AreaChart>
                ) : (
                  <BarChart
                    data={seriesData}
                    barGap={4}
                    barCategoryGap="22%"
                    margin={{
                      top: presentationMode ? 22 : 16,
                      right: 16,
                      left: -10,
                      bottom: 4,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={{ fill: '#64748b', fontSize: tickFontSize, fontWeight: 700 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fill: '#94a3b8', fontSize: tickFontSize, fontWeight: 600 }}
                      dx={-4}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(20, 184, 166, 0.06)', radius: 6 }}
                      content={<TrendChartTooltip presentationMode={presentationMode} />}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{
                        paddingTop: '14px',
                        fontSize: presentationMode ? '13px' : '12px',
                        fontWeight: 700,
                      }}
                    />
                    <Bar
                      dataKey="hadir"
                      name="Hadir"
                      fill="#14b8a6"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={presentationMode ? 28 : 22}
                      animationDuration={450}
                    />
                    <Bar
                      dataKey="izin_sakit"
                      name="Izin/Sakit"
                      fill="#f59e0b"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={presentationMode ? 28 : 22}
                      animationDuration={450}
                    />
                    <Bar
                      dataKey="alpa"
                      name="Alpa"
                      fill="#f43f5e"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={presentationMode ? 28 : 22}
                      animationDuration={450}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
