import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  AlertCircle,
  Calendar,
  CalendarX2,
  Clock,
  Coins,
  Filter,
  Layers,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  RotateCw,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserX,
} from 'lucide-react';
import api from '../../api/axios';
import CustomSelect from '../CustomSelect';
import CategoryBreakdownSection from './CategoryBreakdownSection';
import CategorySummaryCards from './CategorySummaryCards';
import CategoryTrendChart from './CategoryTrendChart';
import {
  MONTH_OPTIONS,
  buildYearOptions,
  formatRupiah,
  getPresetMonthRange,
  normalizeMonthRange,
  resolveSelectedCategoryId,
  sortCategoriesForDisplay,
} from './categoryStatisticsHelpers';

const PRESET_OPTIONS = [
  { key: '3m', label: '3 Bln' },
  { key: '6m', label: '6 Bln' },
  { key: 'this_year', label: 'Tahun Ini' },
  { key: 'last_year', label: 'Tahun Lalu' },
];

const SCOPE_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'desa', label: 'Acara Desa' },
  { value: 'kelompok', label: 'Acara Kelompok' },
];

function splitYearMonth(monthKey) {
  if (typeof monthKey !== 'string') {
    return { year: '', month: '' };
  }
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthKey.trim());
  if (!match) {
    return { year: '', month: '' };
  }
  return { year: match[1], month: match[2] };
}

function getScopeLabel(scope) {
  switch (scope) {
    case 'desa':
      return 'Acara Desa';
    case 'kelompok':
      return 'Acara Kelompok';
    default:
      return 'Semua Cakupan';
  }
}

function getTrendMeta(trendDelta, totalEvents) {
  if (totalEvents <= 0) {
    return {
      text: 'Belum ada acara',
      className: 'bg-slate-100 text-slate-500 border-slate-200/80',
      Icon: Minus,
    };
  }

  if (trendDelta === null || trendDelta === undefined) {
    return {
      text: 'Baru 1 periode',
      className: 'bg-slate-100 text-slate-600 border-slate-200/80',
      Icon: Minus,
    };
  }

  const numeric = Number(trendDelta);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return {
      text: 'Stabil',
      className: 'bg-slate-100 text-slate-600 border-slate-200/80',
      Icon: Minus,
    };
  }

  if (numeric > 0) {
    return {
      text: `Naik +${numeric}%`,
      className: 'bg-teal-50 text-[#0d9488] border-teal-200/80',
      Icon: TrendingUp,
    };
  }

  return {
    text: `Turun -${Math.abs(numeric)}%`,
    className: 'bg-rose-50 text-rose-700 border-rose-200/80',
    Icon: TrendingDown,
  };
}

function StatisticsSkeleton({ presentationMode = false }) {
  return (
    <div className={presentationMode ? 'space-y-5 sm:space-y-6' : 'space-y-4 sm:space-y-5'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="h-28 rounded-2xl bg-white border border-slate-200/80 p-4 animate-pulse flex flex-col justify-between"
          >
            <div className="flex justify-between gap-2">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-4 w-14 rounded-full bg-slate-100" />
            </div>
            <div className="h-7 w-20 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="h-24 rounded-2xl bg-white border border-slate-200/80 p-4 animate-pulse flex flex-col justify-between"
          >
            <div className="h-3.5 w-24 rounded bg-slate-100" />
            <div className="h-6 w-32 rounded bg-slate-200" />
            <div className="h-3 w-28 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="h-80 rounded-2xl bg-white border border-slate-200/80 p-5 animate-pulse flex flex-col justify-between">
        <div className="flex justify-between gap-3">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="h-8 w-52 rounded-full bg-slate-100" />
        </div>
        <div className="h-56 w-full rounded-xl bg-slate-100/80" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-7 h-72 rounded-2xl bg-white border border-slate-200/80 p-5 animate-pulse" />
        <div className="lg:col-span-5 h-72 rounded-2xl bg-white border border-slate-200/80 p-5 animate-pulse" />
      </div>
    </div>
  );
}

export default function CategoryStatisticsTab({ headerSlot }) {
  const [queryRange, setQueryRange] = useState({ startMonth: '', endMonth: '' });
  const [scope, setScope] = useState('all');
  const [selectedKelompok, setSelectedKelompok] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [requestState, setRequestState] = useState({
    data: null,
    error: null,
    loadedKey: null,
  });

  const enteredNativeFullscreenRef = useRef(false);
  const isPresentationOpenRef = useRef(false);

  const requestKey = `${queryRange.startMonth}|${queryRange.endMonth}|${scope}|${selectedKelompok}|${refreshTick}`;
  const isLoading = requestState.loadedKey !== requestKey;
  const data = requestState.data;
  const error = requestState.error;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const params = {};
    if (queryRange.startMonth) params.start_month = queryRange.startMonth;
    if (queryRange.endMonth) params.end_month = queryRange.endMonth;
    if (scope && scope !== 'all') params.scope = scope;
    if (selectedKelompok) params.kelompok = selectedKelompok;

    api
      .get('/admin/reports/category-statistics', {
        params,
        signal: controller.signal,
      })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success === false) {
          setRequestState((prev) => ({
            data: prev.data,
            error: res.data?.message || 'Gagal memuat statistik kategori.',
            loadedKey: requestKey,
          }));
          return;
        }
        setRequestState({
          data: res.data,
          error: null,
          loadedKey: requestKey,
        });
      })
      .catch((err) => {
        if (cancelled || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
          return;
        }
        const message =
          err?.response?.data?.message ||
          'Gagal memuat data statistik kategori. Silakan coba lagi.';
        setRequestState((prev) => ({
          data: prev.data,
          error: message,
          loadedKey: requestKey,
        }));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [queryRange.startMonth, queryRange.endMonth, scope, selectedKelompok, refreshTick, requestKey]);

  useEffect(() => {
    if (!isPresentationMode) return undefined;

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        enteredNativeFullscreenRef.current = true;
      } else if (enteredNativeFullscreenRef.current) {
        enteredNativeFullscreenRef.current = false;
        isPresentationOpenRef.current = false;
        setIsPresentationMode(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        isPresentationOpenRef.current = false;
        setIsPresentationMode(false);
        enteredNativeFullscreenRef.current = false;
        if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
          try {
            Promise.resolve(document.exitFullscreen()).catch(() => {});
          } catch {
            // Ignore fullscreen exit errors
          }
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPresentationMode]);

  useEffect(() => {
    return () => {
      isPresentationOpenRef.current = false;
      if (
        enteredNativeFullscreenRef.current
        && document.fullscreenElement
        && typeof document.exitFullscreen === 'function'
      ) {
        try {
          Promise.resolve(document.exitFullscreen()).catch(() => {});
        } catch {
          // Ignore fullscreen exit errors
        }
      }
    };
  }, []);

  const enterPresentationMode = () => {
    isPresentationOpenRef.current = true;
    setIsPresentationMode(true);
    try {
      if (!document.fullscreenElement && typeof document.documentElement?.requestFullscreen === 'function') {
        Promise.resolve(document.documentElement.requestFullscreen())
          .then(() => {
            if (!isPresentationOpenRef.current && document.fullscreenElement) {
              Promise.resolve(document.exitFullscreen?.()).catch(() => {});
              enteredNativeFullscreenRef.current = false;
              return;
            }
            enteredNativeFullscreenRef.current = Boolean(document.fullscreenElement);
          })
          .catch(() => {
            enteredNativeFullscreenRef.current = false;
          });
      }
    } catch {
      enteredNativeFullscreenRef.current = false;
    }
  };

  const exitPresentationMode = () => {
    isPresentationOpenRef.current = false;
    setIsPresentationMode(false);
    enteredNativeFullscreenRef.current = false;
    try {
      if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        Promise.resolve(document.exitFullscreen()).catch(() => {});
      }
    } catch {
      // Ignore fullscreen exit errors
    }
  };

  const displayStartMonth = queryRange.startMonth || data?.period?.start_month || '';
  const displayEndMonth = queryRange.endMonth || data?.period?.end_month || '';
  const startParts = splitYearMonth(displayStartMonth);
  const endParts = splitYearMonth(displayEndMonth);

  const yearOptions = buildYearOptions([
    ...(Array.isArray(data?.available_years) ? data.available_years : []),
    startParts.year,
    endParts.year,
  ]);

  const rawKelompokOptions = Array.isArray(data?.kelompok_options) ? data.kelompok_options : [];
  const mergedKelompokList = selectedKelompok && !rawKelompokOptions.includes(selectedKelompok)
    ? [selectedKelompok, ...rawKelompokOptions]
    : rawKelompokOptions;
  const kelompokOptions = [
    { value: '', label: 'Semua Kelompok' },
    ...mergedKelompokList.map((k) => ({ value: k, label: k })),
  ];

  const handleRangeChange = (boundary, part, nextVal) => {
    if (!nextVal) return;

    const currentFallbackYear = yearOptions[0]?.value || String(new Date().getFullYear());
    const baseStartYear = startParts.year || currentFallbackYear;
    const baseStartMonth = startParts.month || '01';
    const baseEndYear = endParts.year || currentFallbackYear;
    const baseEndMonth = endParts.month || '12';

    const candidateStart =
      boundary === 'start'
        ? `${part === 'year' ? nextVal : baseStartYear}-${part === 'month' ? nextVal : baseStartMonth}`
        : `${baseStartYear}-${baseStartMonth}`;

    const candidateEnd =
      boundary === 'end'
        ? `${part === 'year' ? nextVal : baseEndYear}-${part === 'month' ? nextVal : baseEndMonth}`
        : `${baseEndYear}-${baseEndMonth}`;

    const normalized = normalizeMonthRange(candidateStart, candidateEnd);
    setQueryRange({
      startMonth: normalized.startMonth,
      endMonth: normalized.endMonth,
    });
  };

  const anchorMonth = data?.period?.end_month || displayEndMonth;

  const handlePresetClick = (presetKey) => {
    const nextRange = getPresetMonthRange(presetKey, anchorMonth);
    setQueryRange(nextRange);
  };

  const isPresetActive = (presetKey) => {
    if (!displayStartMonth || !displayEndMonth) return false;
    const expected = getPresetMonthRange(presetKey, anchorMonth);
    return displayStartMonth === expected.startMonth && displayEndMonth === expected.endMonth;
  };

  const handleRetry = () => {
    setRefreshTick((prev) => prev + 1);
  };

  const sortedCategories = sortCategoriesForDisplay(data?.categories || []);
  const effectiveSelectedId = resolveSelectedCategoryId(sortedCategories, selectedTypeId);
  const selectedCategory =
    sortedCategories.find((cat) => Number(cat.event_type_id) === Number(effectiveSelectedId)) || null;

  const summary = selectedCategory?.summary ?? {};
  const avgPercentage = Number(summary.avg_percentage ?? 0);
  const trendDelta = summary.trend_delta ?? null;
  const totalEvents = Number(summary.total_events ?? 0);
  const activeMonths = Number(summary.active_months ?? 0);
  const totalTarget = Number(summary.total_target ?? 0);
  const totalHadir = Number(summary.total_hadir ?? 0);
  const totalTerlambat = Number(summary.total_terlambat ?? 0);
  const totalIzinSakit = Number(summary.total_izin_sakit ?? 0);
  const totalAlpa = Number(summary.total_alpa ?? 0);
  const totalInfaq = summary.total_infaq;
  const showInfaqCard =
    totalInfaq !== null && totalInfaq !== undefined && Number(totalInfaq) > 0;

  const trendMeta = getTrendMeta(trendDelta, totalEvents);
  const TrendIcon = trendMeta.Icon;

  const categorySwitcherOptions = sortedCategories.map((cat) => ({
    value: String(cat.event_type_id),
    label: cat.name,
  }));

  const monthSelectOptions = MONTH_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  const mobileTopActions =
    headerSlot &&
    !isPresentationMode &&
    ReactDOM.createPortal(
      <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={enterPresentationMode}
          disabled={isLoading && !data}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] disabled:opacity-50 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Maximize2 size={13} strokeWidth={2.5} />
          <span>Presentasi</span>
        </button>
      </div>,
      headerSlot
    );

  const kpiGridClass = isPresentationMode
    ? showInfaqCard
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4'
    : showInfaqCard
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4'
      : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4';

  const kpiPaddingClass = isPresentationMode ? 'p-4 sm:p-5' : 'p-3.5 sm:p-4';
  const kpiLabelClass = isPresentationMode
    ? 'text-xs font-bold text-slate-500 uppercase tracking-wider'
    : 'text-[11px] font-bold text-slate-500 uppercase tracking-wider';
  const kpiSubClass = isPresentationMode
    ? 'text-xs text-slate-500 font-medium mt-1.5'
    : 'text-[11px] text-slate-500 font-medium mt-1';

  return (
    <div
      className={
        isPresentationMode
          ? 'fixed inset-0 z-[120] bg-[#f8f9fa] overflow-y-auto p-4 sm:p-6 lg:p-10'
          : 'space-y-4 sm:space-y-5'
      }
    >
      {mobileTopActions}

      <div className={isPresentationMode ? 'max-w-[1440px] mx-auto space-y-5 sm:space-y-6' : 'space-y-4 sm:space-y-5'}>
        {isPresentationMode ? (
          /* ── Minimalist Presentation Mode Header ─────────────────────────── */
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:px-6 sm:py-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-[#0d9488] border border-teal-200/80 text-xs font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-[#14b8a6]" />
                  Mode Presentasi
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-bold">
                  <Layers size={12} className="text-slate-500" />
                  <span>{getScopeLabel(scope)}</span>
                </span>
                {selectedKelompok && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 text-xs font-bold">
                    <Filter size={12} />
                    <span>Kelompok: {selectedKelompok}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Calendar size={18} className="text-[#14b8a6] shrink-0" />
                <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
                  {data?.period?.label || 'Statistik & Tren Kehadiran'}
                </h2>
                {isLoading && (
                  <Loader2 size={16} className="animate-spin text-[#14b8a6] shrink-0" />
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {categorySwitcherOptions.length > 0 && (
                <div className="w-full sm:w-56">
                  <CustomSelect
                    name="presentation_category"
                    value={effectiveSelectedId !== null ? String(effectiveSelectedId) : ''}
                    onChange={(e) => setSelectedTypeId(Number(e.target.value))}
                    options={categorySwitcherOptions}
                    placeholder="Pilih Kategori..."
                  />
                </div>
              )}

              <div className="w-full sm:w-44">
                <CustomSelect
                  name="presentation_kelompok"
                  value={selectedKelompok}
                  onChange={(e) => setSelectedKelompok(e.target.value)}
                  options={kelompokOptions}
                  placeholder="Semua Kelompok"
                />
              </div>

              <button
                type="button"
                onClick={exitPresentationMode}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <Minimize2 size={15} strokeWidth={2.2} />
                <span>Keluar Presentasi</span>
                <span className="hidden sm:inline text-slate-400 font-semibold text-[11px]">(Esc)</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── Standard Period, Scope & Presentation Control Bar ──────────── */
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5">
            {/* Row 1: Bulan+Tahun Mulai/Akhir + Presets + Desktop Mode Presentasi */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 flex-wrap">
                {/* Bulan + Tahun Mulai */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider w-10 sm:w-auto shrink-0">
                    Mulai
                  </span>
                  <div className="flex-1 sm:flex-none sm:w-[132px]">
                    <CustomSelect
                      name="start_month"
                      value={startParts.month}
                      onChange={(e) => handleRangeChange('start', 'month', e.target.value)}
                      options={monthSelectOptions}
                      placeholder="Bulan"
                      disabled={!displayStartMonth}
                    />
                  </div>
                  <div className="w-[92px] sm:w-[96px] shrink-0">
                    <CustomSelect
                      name="start_year"
                      value={startParts.year}
                      onChange={(e) => handleRangeChange('start', 'year', e.target.value)}
                      options={yearOptions}
                      placeholder="Tahun"
                      disabled={!displayStartMonth}
                    />
                  </div>
                </div>

                <span className="hidden lg:inline text-xs font-bold text-slate-300 select-none">–</span>

                {/* Bulan + Tahun Akhir */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider w-10 sm:w-auto shrink-0">
                    Akhir
                  </span>
                  <div className="flex-1 sm:flex-none sm:w-[132px]">
                    <CustomSelect
                      name="end_month"
                      value={endParts.month}
                      onChange={(e) => handleRangeChange('end', 'month', e.target.value)}
                      options={monthSelectOptions}
                      placeholder="Bulan"
                      disabled={!displayEndMonth}
                    />
                  </div>
                  <div className="w-[92px] sm:w-[96px] shrink-0">
                    <CustomSelect
                      name="end_year"
                      value={endParts.year}
                      onChange={(e) => handleRangeChange('end', 'year', e.target.value)}
                      options={yearOptions}
                      placeholder="Tahun"
                      disabled={!displayEndMonth}
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5 lg:pt-0">
                  {PRESET_OPTIONS.map((preset) => {
                    const active = isPresetActive(preset.key);
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handlePresetClick(preset.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-teal-50 text-[#0d9488] border-[#14b8a6]/60 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Desktop Mode Presentasi Button */}
              <div className="hidden lg:flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={enterPresentationMode}
                  disabled={isLoading && !data}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#14b8a6] hover:bg-[#0d9488] active:scale-95 disabled:opacity-50 text-white rounded-full font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Maximize2 size={14} strokeWidth={2.4} />
                  <span>Mode Presentasi</span>
                </button>
              </div>
            </div>

            {/* Row 2: Scope Pills + Kelompok Filter + Period Indicator */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                {/* Scope Switcher */}
                <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/70 self-start overflow-x-auto max-w-full">
                  {SCOPE_OPTIONS.map((opt) => {
                    const active = scope === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setScope(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-white text-[#0d9488] shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Filter Kelompok */}
                <div className="w-full sm:w-48">
                  <CustomSelect
                    name="filter_kelompok"
                    value={selectedKelompok}
                    onChange={(e) => setSelectedKelompok(e.target.value)}
                    options={kelompokOptions}
                    placeholder="Semua Kelompok"
                  />
                </div>
              </div>

              {/* Active Period Pill & Loading Feedback */}
              <div className="flex items-center gap-2 flex-wrap">
                {isLoading && data && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-[#0d9488] border border-teal-200/70 text-[11px] font-bold">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Memperbarui...</span>
                  </span>
                )}
                {data?.period?.label && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200/80 text-xs font-bold">
                    <Calendar size={12} className="text-[#14b8a6]" />
                    <span>Periode: {data.period.label}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Main Content States: Initial Skeleton / Error / Empty / Dashboard ── */}
        {isLoading && !data ? (
          <StatisticsSkeleton presentationMode={isPresentationMode} />
        ) : !isLoading && error ? (
          <div className="bg-white border border-rose-200/80 rounded-2xl p-8 sm:p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Gagal Memuat Statistik Kategori
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#14b8a6] hover:bg-[#0d9488] active:scale-95 text-white rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <RotateCw size={14} />
              <span>Coba Lagi</span>
            </button>
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <CalendarX2 size={24} />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">
              Belum Ada Kategori Acara
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
              Tidak ada kategori acara yang sesuai dengan filter cakupan atau periode yang dipilih.
            </p>
          </div>
        ) : (
          <div
            className={`${isPresentationMode ? 'space-y-5 sm:space-y-6' : 'space-y-4 sm:space-y-5'} ${
              isLoading ? 'opacity-65 pointer-events-none transition-opacity duration-150' : 'transition-opacity duration-150'
            }`}
          >
            {/* 1. Cross-Category Summary Strip */}
            <CategorySummaryCards
              categories={sortedCategories}
              selectedTypeId={effectiveSelectedId}
              onSelectCategory={(id) => setSelectedTypeId(Number(id))}
              presentationMode={isPresentationMode}
            />

            {/* 2. Selected Category KPI Row (4 or 5 Cards) */}
            <div className={kpiGridClass}>
              {/* KPI 1: Rata-rata Kehadiran */}
              <div
                className={`bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between ${kpiPaddingClass}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={kpiLabelClass}>Rata-rata Kehadiran</p>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#14b8a6] flex items-center justify-center shrink-0">
                    <TrendingUp size={16} strokeWidth={2.2} />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`font-extrabold text-slate-900 tracking-tight leading-none tabular-nums ${
                      isPresentationMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-[28px]'
                    }`}
                  >
                    {avgPercentage}%
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-bold tabular-nums ${
                      isPresentationMode ? 'text-xs' : 'text-[11px]'
                    } ${trendMeta.className}`}
                  >
                    <TrendIcon size={12} strokeWidth={2.4} />
                    <span>{trendMeta.text}</span>
                  </span>
                </div>
                <p className={kpiSubClass}>
                  {selectedCategory?.name ? `Kategori ${selectedCategory.name}` : 'Rata-rata tertimbang periode'}
                </p>
              </div>

              {/* KPI 2: Total Hadir / Target */}
              <div
                className={`bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between ${kpiPaddingClass}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={kpiLabelClass}>Total Hadir / Target</p>
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <UserCheck size={16} strokeWidth={2.2} />
                  </div>
                </div>
                <p
                  className={`mt-2 font-extrabold text-slate-900 tracking-tight leading-none tabular-nums ${
                    isPresentationMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-[28px]'
                  }`}
                >
                  {totalHadir}{' '}
                  <span className="text-slate-400 font-bold text-lg sm:text-xl">/ {totalTarget}</span>
                </p>
                <p className={kpiSubClass}>Akumulasi kehadiran terhadap target</p>
              </div>

              {/* KPI 3: Terlambat & Izin/Sakit */}
              <div
                className={`bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between ${kpiPaddingClass}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={kpiLabelClass}>Terlambat &amp; Izin/Sakit</p>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock size={16} strokeWidth={2.2} />
                  </div>
                </div>
                <p
                  className={`mt-2 font-extrabold text-slate-900 tracking-tight leading-snug tabular-nums ${
                    isPresentationMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                  }`}
                >
                  <span className="text-amber-600">{totalTerlambat}</span> terlambat ·{' '}
                  <span className="text-slate-700">{totalIzinSakit}</span> izin/sakit
                </p>
                <p className={kpiSubClass}>Kedisiplinan &amp; izin berhalangan</p>
              </div>

              {/* KPI 4: Alpa & Pertemuan */}
              <div
                className={`bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between ${kpiPaddingClass}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={kpiLabelClass}>Alpa &amp; Pertemuan</p>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                    <UserX size={16} strokeWidth={2.2} />
                  </div>
                </div>
                <p
                  className={`mt-2 font-extrabold text-slate-900 tracking-tight leading-snug tabular-nums ${
                    isPresentationMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                  }`}
                >
                  <span className="text-rose-600">{totalAlpa}</span> alpa ·{' '}
                  <span className="text-slate-800">{totalEvents}</span> acara ·{' '}
                  <span className="text-[#0d9488]">{activeMonths}</span> bln aktif
                </p>
                <p className={kpiSubClass}>Tanpa keterangan &amp; jumlah pertemuan</p>
              </div>

              {/* KPI 5 (Conditional): Total Infaq */}
              {showInfaqCard && (
                <div
                  className={`bg-white border border-amber-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between ${kpiPaddingClass}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={kpiLabelClass}>Total Infaq</p>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Coins size={16} strokeWidth={2.2} />
                    </div>
                  </div>
                  <p
                    className={`mt-2 font-extrabold text-amber-700 tracking-tight leading-none tabular-nums ${
                      isPresentationMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                    }`}
                  >
                    {formatRupiah(totalInfaq)}
                  </p>
                  <p className={kpiSubClass}>Akumulasi infaq periode ini</p>
                </div>
              )}
            </div>

            {/* 3. Main Monthly Trend Chart */}
            <CategoryTrendChart
              category={selectedCategory}
              periodLabel={data?.period?.label || ''}
              presentationMode={isPresentationMode}
            />

            {/* 4. Group & Gender Breakdown Section */}
            <CategoryBreakdownSection
              category={selectedCategory}
              selectedKelompok={selectedKelompok}
              presentationMode={isPresentationMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
