import { useState, useSyncExternalStore } from 'react';
import { AlertTriangle, Award, Filter, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatPercentLabel,
  getCompactTouchViewportSnapshot,
  getMobileViewportSnapshot,
  resolveClickedBarItem,
  resolveClickedSeriesItem,
  subscribeCompactTouchViewport,
  subscribeMobileViewport,
  toFiniteNumber,
} from './categoryStatisticsHelpers';
import AttendanceStatMiniGrid from './AttendanceStatMiniGrid';

function clampPercentage(value) {
  return Math.min(100, Math.max(0, toFiniteNumber(value, 0)));
}

function computeYAxisMax(groupBreakdown, avgPercentage) {
  let maxPct = toFiniteNumber(avgPercentage, 0);
  for (const row of groupBreakdown) {
    if (Number.isFinite(row.percentage) && row.percentage > maxPct) {
      maxPct = row.percentage;
    }
  }
  if (maxPct <= 100) return 100;
  return Math.ceil((maxPct + 10) / 10) * 10;
}

function computeStatusPercent(count, denominator) {
  if (denominator <= 0) return 0;
  return Math.round((count / denominator) * 100);
}

function CustomGroupTooltip({ active, payload, avgPercentage = 0, presentationMode = false }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const textSizeClass = presentationMode ? 'text-sm' : 'text-xs';
  const pct = toFiniteNumber(row.percentage, 0);
  const isAboveOrEqualAvg = pct >= avgPercentage;

  return (
    <div
      className={`bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-3.5 min-w-[190px] sm:min-w-[230px] max-w-[min(290px,calc(100vw-2.5rem))] pointer-events-none ${textSizeClass}`}
    >
      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-100">
        <p className="font-extrabold text-slate-900 min-w-0 truncate">{row.kelompok}</p>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full border font-black tabular-nums text-[11px] shrink-0 ${
            isAboveOrEqualAvg
              ? 'bg-teal-50 text-[#0d9488] border-teal-200/80'
              : 'bg-amber-50 text-amber-700 border-amber-200/80'
          }`}
        >
          {pct}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 font-semibold">
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <span className="text-slate-500 truncate">Capaian</span>
          <span
            className={`font-black tabular-nums shrink-0 ${
              isAboveOrEqualAvg ? 'text-[#0d9488]' : 'text-amber-600'
            }`}
          >
            {pct}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <span className="text-slate-500 truncate">Target</span>
          <span className="font-bold text-slate-900 tabular-nums shrink-0">{row.target_total ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <span className="text-slate-500 truncate">Hadir</span>
          <span className="font-bold text-[#14b8a6] tabular-nums shrink-0">{row.hadir ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <span className="text-slate-500 truncate">Terlambat</span>
          <span className="font-bold text-amber-600 tabular-nums shrink-0">{row.terlambat ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <span className="text-slate-500 truncate">Izin/Sakit</span>
          <span className="font-bold text-amber-500 tabular-nums shrink-0">{row.izin_sakit ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <span className="text-slate-500 truncate">Alpa</span>
          <span className="font-bold text-rose-500 tabular-nums shrink-0">{row.alpa ?? 0}</span>
        </div>
      </div>
    </div>
  );
}

export default function CategoryBreakdownSection({
  category,
  selectedKelompok = '',
  presentationMode = false,
}) {
  const [inspectedGroup, setInspectedGroup] = useState(null);
  const isMobileViewport = useSyncExternalStore(
    subscribeMobileViewport,
    getMobileViewportSnapshot,
    () => false
  );
  const isCompactMobile = useSyncExternalStore(
    subscribeCompactTouchViewport,
    getCompactTouchViewportSnapshot,
    () => false
  );
  const rawGroups = Array.isArray(category?.group_breakdown) ? category.group_breakdown : [];
  const groupBreakdown = rawGroups.map((row) => ({
    kelompok: String(row?.kelompok ?? '-'),
    target_total: toFiniteNumber(row?.target_total, 0),
    hadir: toFiniteNumber(row?.hadir, 0),
    terlambat: toFiniteNumber(row?.terlambat, 0),
    izin_sakit: toFiniteNumber(row?.izin_sakit, 0),
    alpa: toFiniteNumber(row?.alpa, 0),
    percentage: toFiniteNumber(row?.percentage, 0),
  }));

  const summary = category?.summary ?? {};
  const avgPercentage = toFiniteNumber(summary.avg_percentage, 0);
  const totalTarget = toFiniteNumber(summary.total_target, 0);
  const totalHadir = toFiniteNumber(summary.total_hadir, 0);
  const totalTerlambat = toFiniteNumber(summary.total_terlambat, 0);
  const totalIzinSakit = toFiniteNumber(summary.total_izin_sakit, 0);
  const totalAlpa = toFiniteNumber(summary.total_alpa, 0);

  const trimmedSelectedKelompok = typeof selectedKelompok === 'string' ? selectedKelompok.trim() : '';

  const genderBreakdown = category?.gender_breakdown ?? {};
  const genderRows = [
    {
      key: 'putra',
      label: 'Putra',
      target: toFiniteNumber(genderBreakdown?.putra?.target, 0),
      hadir: toFiniteNumber(genderBreakdown?.putra?.hadir, 0),
      percentage: toFiniteNumber(genderBreakdown?.putra?.percentage, 0),
      dotClass: 'bg-blue-500',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/70',
      barClass: 'bg-blue-500',
    },
    {
      key: 'putri',
      label: 'Putri',
      target: toFiniteNumber(genderBreakdown?.putri?.target, 0),
      hadir: toFiniteNumber(genderBreakdown?.putri?.hadir, 0),
      percentage: toFiniteNumber(genderBreakdown?.putri?.percentage, 0),
      dotClass: 'bg-pink-500',
      badgeClass: 'bg-pink-50 text-pink-700 border-pink-200/70',
      barClass: 'bg-pink-500',
    },
  ];

  const totalStatusCount = totalHadir + totalIzinSakit + totalAlpa;
  const statusItems = [
    {
      key: 'hadir',
      label: 'Hadir',
      count: totalHadir,
      pctLabel: `${computeStatusPercent(totalHadir, totalTarget)}% dari target`,
      cardClass: 'bg-teal-50/70 border-teal-200/70',
      dotClass: 'bg-[#14b8a6]',
      countClass: 'text-[#0d9488]',
    },
    {
      key: 'terlambat',
      label: 'Terlambat',
      count: totalTerlambat,
      pctLabel: `${computeStatusPercent(totalTerlambat, totalHadir)}% dari hadir`,
      cardClass: 'bg-orange-50/70 border-orange-200/70',
      dotClass: 'bg-orange-500',
      countClass: 'text-orange-700',
    },
    {
      key: 'izin_sakit',
      label: 'Izin/Sakit',
      count: totalIzinSakit,
      pctLabel: `${computeStatusPercent(totalIzinSakit, totalTarget)}% dari target`,
      cardClass: 'bg-amber-50/70 border-amber-200/70',
      dotClass: 'bg-[#f59e0b]',
      countClass: 'text-amber-700',
    },
    {
      key: 'alpa',
      label: 'Alpa',
      count: totalAlpa,
      pctLabel: `${computeStatusPercent(totalAlpa, totalTarget)}% dari target`,
      cardClass: 'bg-rose-50/70 border-rose-200/70',
      dotClass: 'bg-[#f43f5e]',
      countClass: 'text-rose-600',
    },
  ];

  const showHighlights = groupBreakdown.length > 1;
  const highlightItems = showHighlights
    ? [
        {
          key: 'top',
          title: 'Kelompok Teraktif',
          row: groupBreakdown[0],
          Icon: Award,
          cardClass: 'bg-teal-50/70 border-teal-200/80',
          iconWrapClass: 'bg-teal-100/80 text-[#0d9488]',
          labelClass: 'text-[#0d9488]',
          pctClass: 'text-[#0f766e]',
        },
        {
          key: 'attention',
          title: 'Perlu Perhatian',
          row: groupBreakdown[groupBreakdown.length - 1],
          Icon: AlertTriangle,
          cardClass: 'bg-amber-50/70 border-amber-200/80',
          iconWrapClass: 'bg-amber-100/80 text-amber-700',
          labelClass: 'text-amber-700',
          pctClass: 'text-amber-700',
        },
      ]
    : [];

  const effectiveInspectedGroup =
    inspectedGroup && groupBreakdown.some((g) => g.kelompok === inspectedGroup)
      ? inspectedGroup
      : groupBreakdown[0]?.kelompok ?? '';
  const inspectedRow =
    groupBreakdown.find((g) => g.kelompok === effectiveInspectedGroup) || groupBreakdown[0] || null;
  const isInspectedAboveOrEqualAvg = inspectedRow ? inspectedRow.percentage >= avgPercentage : true;

  const handleBarChartClick = (chartState) => {
    const clickedRow = resolveClickedSeriesItem(chartState, groupBreakdown, 'kelompok');
    if (clickedRow?.kelompok) {
      setInspectedGroup(clickedRow.kelompok);
    }
  };

  const handleBarClick = (barData, index, event) => {
    event?.stopPropagation?.();
    const clickedRow = resolveClickedBarItem(barData, index, groupBreakdown);
    if (clickedRow?.kelompok) {
      setInspectedGroup(clickedRow.kelompok);
    }
  };

  const yMax = computeYAxisMax(groupBreakdown, avgPercentage);
  const chartHeightClass = presentationMode ? 'h-72 sm:h-80' : 'h-60 sm:h-72';
  const tickFontSize = presentationMode ? 13 : 11;
  const labelFontSize = presentationMode ? 13 : 11;
  const mobileMinWidthClass = groupBreakdown.length > 6 ? 'min-w-[520px]' : 'min-w-0';
  const showInlineRefLabel = !isMobileViewport && groupBreakdown.length <= 4;

  const headerPaddingClass = presentationMode ? 'px-5 py-4 sm:px-6 sm:py-5' : 'px-4 py-3.5 sm:px-6 sm:py-4';
  const bodyPaddingClass = presentationMode ? 'p-4 sm:p-6' : 'p-3.5 sm:p-5';
  const titleSizeClass = presentationMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base';
  const subtitleSizeClass = presentationMode ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
      {/* Left Column: Capaian Kehadiran per Kelompok */}
      <div className="lg:col-span-7 min-w-0 bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
        <div
          className={`border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${headerPaddingClass}`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-1.5 h-5 bg-[#14b8a6] rounded-full shrink-0" />
              <h2 className={`font-extrabold text-slate-900 tracking-tight min-w-0 ${titleSizeClass}`}>
                Capaian Kehadiran per Kelompok
              </h2>
              {trimmedSelectedKelompok && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border border-sky-200/80 bg-sky-50 text-sky-700 font-bold max-w-full min-w-0 ${
                    presentationMode ? 'px-3 py-0.5 text-xs' : 'px-2.5 py-0.5 text-[10px] sm:text-[11px]'
                  }`}
                >
                  <Filter size={11} className="shrink-0" />
                  <span className="truncate">Filter: {trimmedSelectedKelompok}</span>
                </span>
              )}
            </div>
            <p className={`text-slate-500 font-medium mt-1 pl-4 tabular-nums ${subtitleSizeClass}`}>
              Perbandingan capaian tiap kelompok terhadap rata-rata ({avgPercentage}%)
            </p>
          </div>

          {groupBreakdown.length > 0 && (
            <div
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 shrink-0 pl-4 sm:pl-0 sm:justify-end font-bold text-slate-500 ${
                presentationMode ? 'text-xs' : 'text-[11px]'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6] shrink-0" />
                <span>≥ Rata-rata</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
                <span>&lt; Rata-rata</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#0f766e] tabular-nums">
                <span className="w-3.5 border-t-2 border-dashed border-[#0f766e] shrink-0" />
                <span>Rata-rata {avgPercentage}%</span>
              </span>
            </div>
          )}
        </div>

        <div className={`flex-1 flex flex-col justify-center ${bodyPaddingClass}`}>
          {groupBreakdown.length === 0 ? (
            <div className={`${chartHeightClass} flex flex-col items-center justify-center text-center px-4`}>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Users size={22} strokeWidth={2} />
              </div>
              <p className={`font-bold text-slate-700 ${presentationMode ? 'text-base' : 'text-sm'}`}>
                Belum ada data rincian kelompok pada periode ini.
              </p>
              <p className={`text-slate-400 mt-1 max-w-md ${presentationMode ? 'text-sm' : 'text-xs'}`}>
                Pilih kategori yang memiliki acara atau sesuaikan filter kelompok untuk melihat perbandingan capaian.
              </p>
            </div>
          ) : (
            <>
              {groupBreakdown.length > 6 && (
                <div className="sm:hidden text-[11px] font-medium text-slate-400 mb-2 flex items-center justify-between gap-2">
                  <span>Ketuk kelompok di bawah untuk detail</span>
                  <span className="shrink-0 font-semibold text-slate-500">Geser grafik ke samping -&gt;</span>
                </div>
              )}
              <div className="w-full overflow-x-auto pb-1">
                <div className={`${chartHeightClass} ${mobileMinWidthClass} sm:min-w-0 w-full`}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                      data={groupBreakdown}
                      onClick={handleBarChartClick}
                      margin={{
                        top: presentationMode ? 36 : 30,
                        right: 18,
                        left: -10,
                        bottom: 4,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="kelompok"
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
                        domain={[0, yMax]}
                        tick={{ fill: '#94a3b8', fontSize: tickFontSize, fontWeight: 600 }}
                        tickFormatter={(val) => `${val}%`}
                        dx={-4}
                      />
                      <Tooltip
                        trigger={isCompactMobile ? 'click' : 'hover'}
                        cursor={{ fill: 'rgba(20, 184, 166, 0.06)', radius: 6 }}
                        content={
                          <CustomGroupTooltip
                            avgPercentage={avgPercentage}
                            presentationMode={presentationMode}
                          />
                        }
                      />
                      <ReferenceLine
                        y={avgPercentage}
                        stroke="#0f766e"
                        strokeDasharray="5 4"
                        strokeWidth={1.75}
                        ifOverflow="extendDomain"
                        label={
                          showInlineRefLabel
                            ? {
                                value: `Rata-rata ${avgPercentage}%`,
                                position: 'insideBottomRight',
                                fill: '#0f766e',
                                fontSize: presentationMode ? 12 : 11,
                                fontWeight: 800,
                                offset: 6,
                                stroke: '#ffffff',
                                strokeWidth: 4,
                                paintOrder: 'stroke',
                              }
                            : undefined
                        }
                      />
                      <Bar
                        dataKey="percentage"
                        name="Kehadiran"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={presentationMode ? 48 : 40}
                        animationDuration={450}
                        className="cursor-pointer"
                        onClick={handleBarClick}
                      >
                        {groupBreakdown.map((entry, idx) => (
                          <Cell
                            key={`${entry.kelompok}-${idx}`}
                            fill={entry.percentage >= avgPercentage ? '#14b8a6' : '#f59e0b'}
                          />
                        ))}
                        <LabelList
                          dataKey="percentage"
                          position="top"
                          offset={presentationMode ? 8 : 6}
                          formatter={formatPercentLabel}
                          fill="#334155"
                          fontSize={labelFontSize}
                          fontWeight={800}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tap-to-Inspect Group Readout (< lg) */}
              {inspectedRow && (
                <div className="lg:hidden mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Detail Kelompok
                    </p>
                    <span className="text-[11px] font-medium text-slate-400">
                      Ketuk batang atau kelompok
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {groupBreakdown.map((row, idx) => {
                      const isSelected = row.kelompok === inspectedRow.kelompok;
                      const isRowAboveOrEqualAvg = row.percentage >= avgPercentage;
                      return (
                        <button
                          key={`${row.kelompok}-${idx}`}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setInspectedGroup(row.kelompok)}
                          className={`min-h-[38px] px-3 py-1.5 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 max-w-full transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                            isSelected
                              ? 'bg-teal-50 text-[#0f766e] border-[#14b8a6] shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isRowAboveOrEqualAvg ? 'bg-[#14b8a6]' : 'bg-[#f59e0b]'
                            }`}
                          />
                          <span className="truncate">{row.kelompok}</span>
                          <span className="shrink-0 tabular-nums opacity-80">{row.percentage}%</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`font-extrabold text-slate-900 min-w-0 truncate ${
                          presentationMode ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                        }`}
                      >
                        {inspectedRow.kelompok}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border font-bold text-[11px] ${
                            isInspectedAboveOrEqualAvg
                              ? 'bg-teal-50 text-[#0d9488] border-teal-200/80'
                              : 'bg-amber-50 text-amber-700 border-amber-200/80'
                          }`}
                        >
                          {isInspectedAboveOrEqualAvg ? '≥ Rata-rata' : '< Rata-rata'}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border font-black tabular-nums text-xs ${
                            isInspectedAboveOrEqualAvg
                              ? 'bg-teal-50 text-[#0d9488] border-teal-200/80'
                              : 'bg-amber-50 text-amber-700 border-amber-200/80'
                          }`}
                        >
                          {inspectedRow.percentage}%
                        </span>
                      </div>
                    </div>

                    <AttendanceStatMiniGrid
                      hadir={inspectedRow.hadir}
                      targetTotal={inspectedRow.target_total}
                      terlambat={inspectedRow.terlambat}
                      izinSakit={inspectedRow.izin_sakit}
                      alpa={inspectedRow.alpa}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Column: Putra / Putri & Ringkasan Status */}
      <div className="lg:col-span-5 min-w-0 bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
        <div className={`border-b border-slate-100 ${headerPaddingClass}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-5 bg-blue-500 rounded-full shrink-0" />
            <h2 className={`font-extrabold text-slate-900 tracking-tight min-w-0 ${titleSizeClass}`}>
              Putra / Putri &amp; Ringkasan Status
            </h2>
          </div>
          <p className={`text-slate-500 font-medium mt-1 pl-4 ${subtitleSizeClass}`}>
            Proporsi kehadiran gender dan komposisi status periode
          </p>
        </div>

        <div
          className={`flex-1 ${bodyPaddingClass} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5 lg:content-between`}
        >
          {/* Putra vs Putri Progress Bars */}
          <div className={`min-w-0 ${presentationMode ? 'space-y-3.5' : 'space-y-3'}`}>
            <p
              className={`font-extrabold text-slate-700 uppercase tracking-wider ${
                presentationMode ? 'text-xs' : 'text-[11px]'
              }`}
            >
              Kehadiran Putra vs Putri
            </p>
            <div className={presentationMode ? 'space-y-3.5' : 'space-y-2.5'}>
              {genderRows.map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dotClass}`} />
                      <span
                        className={`font-bold text-slate-800 ${
                          presentationMode ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border font-extrabold tabular-nums shrink-0 ${
                        item.badgeClass
                      } ${presentationMode ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs'}`}
                    >
                      {item.hadir}/{item.target} ({item.percentage}%)
                    </span>
                  </div>
                  <div
                    className={`w-full rounded-full bg-slate-100 overflow-hidden ${
                      presentationMode ? 'h-3' : 'h-2.5'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.barClass}`}
                      style={{ width: `${clampPercentage(item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ringkasan Status Periode */}
          <div className="min-w-0 pt-3.5 border-t border-slate-100 sm:pt-0 sm:border-t-0 sm:pl-4 sm:border-l lg:pl-0 lg:border-l-0 lg:pt-3.5 lg:border-t space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p
                className={`font-extrabold text-slate-700 uppercase tracking-wider min-w-0 ${
                  presentationMode ? 'text-xs' : 'text-[11px]'
                }`}
              >
                Ringkasan Status Periode
              </p>
              <span
                className={`font-semibold text-slate-400 tabular-nums shrink-0 ${
                  presentationMode ? 'text-xs' : 'text-[11px]'
                }`}
              >
                Total target: {totalTarget}
              </span>
            </div>

            {/* Proportional Composition Bar (Hadir / Izin-Sakit / Alpa) */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
              {totalStatusCount > 0 && (
                <>
                  {totalHadir > 0 && (
                    <div
                      className="h-full bg-[#14b8a6]"
                      style={{ width: `${(totalHadir / totalStatusCount) * 100}%` }}
                    />
                  )}
                  {totalIzinSakit > 0 && (
                    <div
                      className="h-full bg-[#f59e0b]"
                      style={{ width: `${(totalIzinSakit / totalStatusCount) * 100}%` }}
                    />
                  )}
                  {totalAlpa > 0 && (
                    <div
                      className="h-full bg-[#f43f5e]"
                      style={{ width: `${(totalAlpa / totalStatusCount) * 100}%` }}
                    />
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {statusItems.map((item) => (
                <div
                  key={item.key}
                  className={`min-w-0 rounded-xl border ${item.cardClass} ${
                    presentationMode ? 'p-3' : 'p-2.5'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.dotClass}`} />
                    <span
                      className={`font-bold text-slate-600 truncate ${
                        presentationMode ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <p
                    className={`font-extrabold tabular-nums mt-1 leading-tight ${item.countClass} ${
                      presentationMode ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
                    }`}
                  >
                    {item.count}
                  </p>
                  <p
                    className={`font-semibold text-slate-500 mt-0.5 tabular-nums ${
                      presentationMode ? 'text-xs' : 'text-[10px] sm:text-[11px]'
                    }`}
                  >
                    {item.pctLabel}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Highlights: Kelompok Teraktif & Perlu Perhatian */}
          {showHighlights && (
            <div className="sm:col-span-2 lg:col-span-1 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {highlightItems.map(({ key, title, row, Icon, cardClass, iconWrapClass, labelClass, pctClass }) => (
                <div
                  key={key}
                  className={`min-w-0 rounded-xl border ${cardClass} ${
                    presentationMode ? 'p-3.5' : 'p-3'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconWrapClass}`}
                    >
                      <Icon size={14} strokeWidth={2.3} />
                    </div>
                    <span
                      className={`font-extrabold uppercase tracking-wider ${labelClass} ${
                        presentationMode ? 'text-[11px]' : 'text-[10px]'
                      }`}
                    >
                      {title}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 mt-2">
                    <p
                      title={row.kelompok}
                      className={`font-extrabold text-slate-900 min-w-0 truncate ${
                        presentationMode ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                      }`}
                    >
                      {row.kelompok}
                    </p>
                    <span
                      className={`font-black tabular-nums shrink-0 ${pctClass} ${
                        presentationMode ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                      }`}
                    >
                      {row.percentage}%
                    </span>
                  </div>
                  <p
                    className={`font-semibold text-slate-500 mt-0.5 tabular-nums ${
                      presentationMode ? 'text-xs' : 'text-[11px]'
                    }`}
                  >
                    {row.hadir}/{row.target_total} hadir
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
