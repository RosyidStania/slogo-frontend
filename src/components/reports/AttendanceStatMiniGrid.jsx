import { toFiniteNumber } from './categoryStatisticsHelpers';

/**
 * Compact 4-metric attendance summary grid used in tap-to-inspect chart readouts.
 */
export default function AttendanceStatMiniGrid({
  hadir,
  targetTotal,
  terlambat,
  izinSakit,
  alpa,
}) {
  const safeHadir = toFiniteNumber(hadir, 0);
  const safeTargetTotal = toFiniteNumber(targetTotal, 0);
  const safeTerlambat = toFiniteNumber(terlambat, 0);
  const safeIzinSakit = toFiniteNumber(izinSakit, 0);
  const safeAlpa = toFiniteNumber(alpa, 0);

  const metrics = [
    {
      key: 'hadir_target',
      label: 'Hadir / Target',
      value: `${safeHadir}/${safeTargetTotal}`,
      valueClass: 'text-[#0d9488]',
    },
    {
      key: 'terlambat',
      label: 'Terlambat',
      value: safeTerlambat,
      valueClass: 'text-amber-600',
    },
    {
      key: 'izin_sakit',
      label: 'Izin/Sakit',
      value: safeIzinSakit,
      valueClass: 'text-amber-500',
    },
    {
      key: 'alpa',
      label: 'Alpa',
      value: safeAlpa,
      valueClass: 'text-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {metrics.map((metric) => (
        <div
          key={metric.key}
          className="bg-white border border-slate-200/70 rounded-lg px-2.5 py-2 min-w-0"
        >
          <p className="text-[11px] font-semibold text-slate-500 truncate">
            {metric.label}
          </p>
          <p className={`text-xs sm:text-sm font-extrabold tabular-nums mt-0.5 ${metric.valueClass}`}>
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  );
}
