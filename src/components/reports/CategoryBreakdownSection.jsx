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

function toFiniteNumber(value, fallback = 0) {
  if (value === null || value === undefined || typeof value === 'boolean' || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampPercentage(value) {
  return Math.min(100, Math.max(0, toFiniteNumber(value, 0)));
}

function formatPercentLabel(value) {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) {
    return '';
  }
  return `${value}%`;
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
      className={`bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-3.5 min-w-[230px] max-w-[290px] pointer-events-none ${textSizeClass}`}
    >
      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-100">
        <p className="font-extrabold text-slate-900 truncate">{row.kelompok}</p>
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

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-semibold">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Capaian</span>
          <span
            className={`font-black tabular-nums ${
              isAboveOrEqualAvg ? 'text-[#0d9488]' : 'text-amber-600'
            }`}
          >
            {pct}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Target</span>
          <span className="font-bold text-slate-900 tabular-nums">{row.target_total ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Hadir</span>
          <span className="font-bold text-[#14b8a6] tabular-nums">{row.hadir ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Terlambat</span>
          <span className="font-bold text-amber-600 tabular-nums">{row.terlambat ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Izin/Sakit</span>
          <span className="font-bold text-amber-500 tabular-nums">{row.izin_sakit ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Alpa</span>
          <span className="font-bold text-rose-500 tabular-nums">{row.alpa ?? 0}</span>
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

  const yMax = computeYAxisMax(groupBreakdown, avgPercentage);
  const chartHeightClass = presentationMode ? 'h-72 sm:h-80' : 'h-64 sm:h-72';
  const tickFontSize = presentationMode ? 13 : 11;
  const labelFontSize = presentationMode ? 13 : 11;
  const mobileMinWidthClass = groupBreakdown.length > 6 ? 'min-w-[520px]' : 'min-w-[300px]';

  const headerPaddingClass = presentationMode ? 'px-5 py-4 sm:px-6 sm:py-5' : 'px-4 py-3.5 sm:px-6 sm:py-4';
  const bodyPaddingClass = presentationMode ? 'p-4 sm:p-6' : 'p-3.5 sm:p-5';
  const titleSizeClass = presentationMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base';
  const subtitleSizeClass = presentationMode ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
      {/* Left Column: Capaian Kehadiran per Kelompok */}
      <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
        <div
          className={`border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${headerPaddingClass}`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-1.5 h-5 bg-[#14b8a6] rounded-full shrink-0" />
              <h2 className={`font-extrabold text-slate-900 tracking-tight ${titleSizeClass}`}>
                Capaian Kehadiran per Kelompok
              </h2>
              {trimmedSelectedKelompok && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border border-sky-200/80 bg-sky-50 text-sky-700 font-bold ${
                    presentationMode ? 'px-3 py-0.5 text-xs' : 'px-2.5 py-0.5 text-[10px] sm:text-[11px]'
                  }`}
                >
                  <Filter size={11} />
                  <span>Filter: {trimmedSelectedKelompok}</span>
                </span>
              )}
            </div>
            <p className={`text-slate-500 font-medium mt-1 pl-4 ${subtitleSizeClass}`}>
              Perbandingan capaian tiap kelompok terhadap rata-rata ({avgPercentage}%)
            </p>
          </div>

          {groupBreakdown.length > 0 && (
            <div
              className={`flex items-center gap-3 shrink-0 pl-4 sm:pl-0 font-bold text-slate-500 ${
                presentationMode ? 'text-xs' : 'text-[11px]'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6]" />
                <span>≥ Rata-rata</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <span>&lt; Rata-rata</span>
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
            <div className="w-full overflow-x-auto hide-scrollbar">
              <div className={`${chartHeightClass} ${mobileMinWidthClass} sm:min-w-0 w-full`}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    data={groupBreakdown}
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
                      label={{
                        value: `Rata-rata ${avgPercentage}%`,
                        position: 'insideBottomRight',
                        fill: '#0f766e',
                        fontSize: presentationMode ? 12 : 11,
                        fontWeight: 800,
                        offset: 6,
                        stroke: '#ffffff',
                        strokeWidth: 4,
                        paintOrder: 'stroke',
                      }}
                    />
                    <Bar
                      dataKey="percentage"
                      name="Kehadiran"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={presentationMode ? 48 : 40}
                      animationDuration={450}
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
          )}
        </div>
      </div>

      {/* Right Column: Putra / Putri & Ringkasan Status */}
      <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
        <div className={`border-b border-slate-100 ${headerPaddingClass}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-5 bg-blue-500 rounded-full shrink-0" />
            <h2 className={`font-extrabold text-slate-900 tracking-tight ${titleSizeClass}`}>
              Putra / Putri &amp; Ringkasan Status
            </h2>
          </div>
          <p className={`text-slate-500 font-medium mt-1 pl-4 ${subtitleSizeClass}`}>
            Proporsi kehadiran gender dan komposisi status periode
          </p>
        </div>

        <div
          className={`flex-1 flex flex-col justify-between ${bodyPaddingClass} ${
            presentationMode ? 'space-y-5 sm:space-y-6' : 'space-y-4 sm:space-y-5'
          }`}
        >
          {/* Putra vs Putri Progress Bars */}
          <div className={presentationMode ? 'space-y-3.5' : 'space-y-3'}>
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
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border font-extrabold tabular-nums ${
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
          <div className="pt-3.5 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p
                className={`font-extrabold text-slate-700 uppercase tracking-wider ${
                  presentationMode ? 'text-xs' : 'text-[11px]'
                }`}
              >
                Ringkasan Status Periode
              </p>
              <span
                className={`font-semibold text-slate-400 tabular-nums ${
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
                  className={`rounded-xl border ${item.cardClass} ${
                    presentationMode ? 'p-3' : 'p-2.5'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.dotClass}`} />
                    <span
                      className={`font-bold text-slate-600 ${
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
            <div className="pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {highlightItems.map(({ key, title, row, Icon, cardClass, iconWrapClass, labelClass, pctClass }) => (
                <div
                  key={key}
                  className={`rounded-xl border ${cardClass} ${
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
                      className={`font-extrabold text-slate-900 truncate ${
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
