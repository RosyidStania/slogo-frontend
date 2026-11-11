const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

const jakartaMonthFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
});

export const MONTH_OPTIONS = [
  { value: '01', label: 'Januari', shortLabel: 'Jan' },
  { value: '02', label: 'Februari', shortLabel: 'Feb' },
  { value: '03', label: 'Maret', shortLabel: 'Mar' },
  { value: '04', label: 'April', shortLabel: 'Apr' },
  { value: '05', label: 'Mei', shortLabel: 'Mei' },
  { value: '06', label: 'Juni', shortLabel: 'Jun' },
  { value: '07', label: 'Juli', shortLabel: 'Jul' },
  { value: '08', label: 'Agustus', shortLabel: 'Agu' },
  { value: '09', label: 'September', shortLabel: 'Sep' },
  { value: '10', label: 'Oktober', shortLabel: 'Okt' },
  { value: '11', label: 'November', shortLabel: 'Nov' },
  { value: '12', label: 'Desember', shortLabel: 'Des' },
];

function getJakartaYearMonth(nowDate = new Date()) {
  const date = nowDate instanceof Date && !Number.isNaN(nowDate.getTime())
    ? nowDate
    : new Date();
  const parts = jakartaMonthFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  return { year, month };
}

function parseMonthKey(monthKey) {
  if (typeof monthKey !== 'string') return null;
  const match = MONTH_KEY_PATTERN.exec(monthKey.trim());
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

function formatMonthKey(year, month) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

function toMonthIndex(year, month) {
  return year * 12 + (month - 1);
}

function shiftMonthKey(monthKey, deltaMonths) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return '';
  const totalMonths = toMonthIndex(parsed.year, parsed.month) + deltaMonths;
  const year = Math.floor(totalMonths / 12);
  const month = (((totalMonths % 12) + 12) % 12) + 1;
  return formatMonthKey(year, month);
}

function parseValidYear(year) {
  if (year === null || year === undefined || typeof year === 'boolean') {
    return null;
  }
  if (typeof year === 'string' && year.trim() === '') {
    return null;
  }
  const parsed = Number(year);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Build descending `{ value, label }` year options ensuring `currentYear` is included.
 */
export function buildYearOptions(availableYears = [], currentYear) {
  const resolvedCurrentYear = parseValidYear(currentYear) ?? getJakartaYearMonth(new Date()).year;
  const uniqueYears = new Set([resolvedCurrentYear]);

  if (Array.isArray(availableYears)) {
    for (const item of availableYears) {
      const validYear = parseValidYear(item);
      if (validYear !== null) {
        uniqueYears.add(validYear);
      }
    }
  }

  return Array.from(uniqueYears)
    .sort((a, b) => b - a)
    .map((year) => ({
      value: String(year),
      label: String(year),
    }));
}

/**
 * Ensure `startMonth <= endMonth` using pure calendar month arithmetic, swapping if reversed.
 */
export function normalizeMonthRange(startMonth, endMonth) {
  const parsedStart = parseMonthKey(startMonth);
  const parsedEnd = parseMonthKey(endMonth);

  if (!parsedStart || !parsedEnd) {
    if (
      typeof startMonth === 'string'
      && typeof endMonth === 'string'
      && startMonth
      && endMonth
      && startMonth > endMonth
    ) {
      return {
        startMonth: endMonth,
        endMonth: startMonth,
        wasSwapped: true,
      };
    }

    return {
      startMonth: startMonth || '',
      endMonth: endMonth || '',
      wasSwapped: false,
    };
  }

  const normalizedStart = formatMonthKey(parsedStart.year, parsedStart.month);
  const normalizedEnd = formatMonthKey(parsedEnd.year, parsedEnd.month);

  if (toMonthIndex(parsedStart.year, parsedStart.month) > toMonthIndex(parsedEnd.year, parsedEnd.month)) {
    return {
      startMonth: normalizedEnd,
      endMonth: normalizedStart,
      wasSwapped: true,
    };
  }

  return {
    startMonth: normalizedStart,
    endMonth: normalizedEnd,
    wasSwapped: false,
  };
}

/**
 * Compute inclusive `YYYY-MM` period bounds for quick presets in Asia/Jakarta calendar time.
 */
export function getPresetMonthRange(preset, anchorMonth, nowDate = new Date()) {
  const { year: currentYear, month: currentMonth } = getJakartaYearMonth(nowDate);
  const currentMonthKey = formatMonthKey(currentYear, currentMonth);
  const parsedAnchor = parseMonthKey(anchorMonth);
  const endMonth = parsedAnchor
    ? formatMonthKey(parsedAnchor.year, parsedAnchor.month)
    : currentMonthKey;

  switch (preset) {
    case '3m':
      return {
        startMonth: shiftMonthKey(endMonth, -2),
        endMonth,
      };
    case 'this_year':
      return {
        startMonth: formatMonthKey(currentYear, 1),
        endMonth: currentMonthKey,
      };
    case 'last_year':
      return {
        startMonth: formatMonthKey(currentYear - 1, 1),
        endMonth: formatMonthKey(currentYear - 1, 12),
      };
    case '6m':
    default:
      return {
        startMonth: shiftMonthKey(endMonth, -5),
        endMonth,
      };
  }
}

/**
 * Place categories with qualifying events first while preserving relative order in each group.
 */
export function sortCategoriesForDisplay(categories = []) {
  if (!Array.isArray(categories)) return [];

  const active = [];
  const empty = [];

  for (const category of categories) {
    if (Number(category?.summary?.total_events ?? 0) > 0) {
      active.push(category);
    } else {
      empty.push(category);
    }
  }

  return [...active, ...empty];
}

/**
 * Keep `currentId` if still present; otherwise fall back to first active or first available category.
 */
export function resolveSelectedCategoryId(categories = [], currentId = null) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  const hasCurrentId = currentId !== null
    && currentId !== undefined
    && typeof currentId !== 'boolean'
    && String(currentId).trim() !== '';

  if (hasCurrentId) {
    const numericCurrentId = Number(currentId);
    if (Number.isFinite(numericCurrentId)) {
      const matched = categories.find(
        (category) => Number(category?.event_type_id) === numericCurrentId
      );
      if (matched) {
        return Number(matched.event_type_id);
      }
    }
  }

  const firstActive = categories.find(
    (category) => Number(category?.summary?.total_events ?? 0) > 0
  );
  const fallback = firstActive || categories[0];
  const fallbackId = Number(fallback?.event_type_id);
  return Number.isFinite(fallbackId) ? fallbackId : null;
}

/**
 * Format numeric amounts into whole-integer Indonesian Rupiah strings (`Rp 150.000`).
 */
export function formatRupiah(value) {
  if (
    value === null
    || value === undefined
    || typeof value === 'boolean'
    || (typeof value !== 'number' && typeof value !== 'string')
  ) {
    return 'Rp 0';
  }

  if (typeof value === 'string' && value.trim() === '') {
    return 'Rp 0';
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 'Rp 0';
  }

  const rounded = Math.round(numeric);
  if (rounded === 0) {
    return 'Rp 0';
  }

  const formatted = Math.abs(rounded).toLocaleString('id-ID');
  return rounded < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}
