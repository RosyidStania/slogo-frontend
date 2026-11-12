import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MONTH_OPTIONS,
  buildYearOptions,
  normalizeMonthRange,
  getPresetMonthRange,
  sortCategoriesForDisplay,
  resolveSelectedCategoryId,
  formatRupiah,
  formatCompactMonthLabel,
  formatMobileFilterSummary,
  resolveDefaultInspectedMonth,
  formatCompactTickLabel,
  resolveClickedSeriesItem,
  resolveClickedBarItem,
  toFiniteNumber,
  formatPercentLabel,
  subscribeMobileViewport,
  getMobileViewportSnapshot,
  subscribeCompactTouchViewport,
  getCompactTouchViewportSnapshot,
} from '../categoryStatisticsHelpers.js';

test('MONTH_OPTIONS defines 12 Indonesian months from 01 to 12', () => {
  assert.equal(MONTH_OPTIONS.length, 12);
  assert.deepEqual(MONTH_OPTIONS[0], { value: '01', label: 'Januari', shortLabel: 'Jan' });
  assert.deepEqual(MONTH_OPTIONS[4], { value: '05', label: 'Mei', shortLabel: 'Mei' });
  assert.deepEqual(MONTH_OPTIONS[7], { value: '08', label: 'Agustus', shortLabel: 'Agu' });
  assert.deepEqual(MONTH_OPTIONS[9], { value: '10', label: 'Oktober', shortLabel: 'Okt' });
  assert.deepEqual(MONTH_OPTIONS[11], { value: '12', label: 'Desember', shortLabel: 'Des' });
});

test('buildYearOptions deduplicates, includes currentYear, and sorts descending as strings', () => {
  assert.deepEqual(buildYearOptions([2024, 2026, 2025, 2025], 2026), [
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
  ]);
  assert.deepEqual(buildYearOptions([2024, '2025', null, Number.NaN, 'bad'], 2027), [
    { value: '2027', label: '2027' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
  ]);
  assert.deepEqual(buildYearOptions([], 2026), [{ value: '2026', label: '2026' }]);
});

test('normalizeMonthRange swaps reversed startMonth and endMonth', () => {
  assert.deepEqual(normalizeMonthRange('2026-08', '2026-02'), {
    startMonth: '2026-02',
    endMonth: '2026-08',
    wasSwapped: true,
  });
  assert.deepEqual(normalizeMonthRange('2025-11', '2026-02'), {
    startMonth: '2025-11',
    endMonth: '2026-02',
    wasSwapped: false,
  });
  assert.deepEqual(normalizeMonthRange('2026-02', '2026-02'), {
    startMonth: '2026-02',
    endMonth: '2026-02',
    wasSwapped: false,
  });
  assert.deepEqual(normalizeMonthRange('', '2026-02'), {
    startMonth: '',
    endMonth: '2026-02',
    wasSwapped: false,
  });
});

test('getPresetMonthRange computes cross-year 6m, 3m, this_year, and last_year accurately', () => {
  const ref = new Date('2026-11-12T10:00:00Z');
  assert.deepEqual(getPresetMonthRange('6m', '2026-02', ref), { startMonth: '2025-09', endMonth: '2026-02' });
  assert.deepEqual(getPresetMonthRange('3m', '2026-01', ref), { startMonth: '2025-11', endMonth: '2026-01' });
  assert.deepEqual(getPresetMonthRange('this_year', '2026-02', ref), { startMonth: '2026-01', endMonth: '2026-11' });
  assert.deepEqual(getPresetMonthRange('last_year', '2026-02', ref), { startMonth: '2025-01', endMonth: '2025-12' });

  assert.deepEqual(getPresetMonthRange('6m', '', ref), { startMonth: '2026-06', endMonth: '2026-11' });
  assert.deepEqual(getPresetMonthRange('3m', null, ref), { startMonth: '2026-09', endMonth: '2026-11' });

  // 2026-12-31T20:00:00Z is 2027-01-01 03:00 Asia/Jakarta (WIB)
  const wibNewYear = new Date('2026-12-31T20:00:00Z');
  assert.deepEqual(getPresetMonthRange('this_year', '', wibNewYear), { startMonth: '2027-01', endMonth: '2027-01' });
  assert.deepEqual(getPresetMonthRange('last_year', '', wibNewYear), { startMonth: '2026-01', endMonth: '2026-12' });
});

test('sortCategoriesForDisplay and resolveSelectedCategoryId prioritize active categories', () => {
  const cats = [
    { event_type_id: 1, name: 'Kosong', summary: { total_events: 0 } },
    { event_type_id: 2, name: 'Aktif A', summary: { total_events: 4 } },
    { event_type_id: 3, name: 'Aktif B', summary: { total_events: 2 } },
  ];
  const sorted = sortCategoriesForDisplay(cats);
  assert.deepEqual(sorted.map((c) => c.event_type_id), [2, 3, 1]);
  assert.deepEqual(cats.map((c) => c.event_type_id), [1, 2, 3]);
  assert.equal(resolveSelectedCategoryId(sorted, null), 2);
  assert.equal(resolveSelectedCategoryId(sorted, 3), 3);
  assert.equal(resolveSelectedCategoryId(sorted, '3'), 3);
  assert.equal(resolveSelectedCategoryId(sorted, 999), 2);
  assert.equal(resolveSelectedCategoryId([], 1), null);

  const allEmpty = [
    { event_type_id: 10, name: 'Kosong A', summary: { total_events: 0 } },
    { event_type_id: 11, name: 'Kosong B' },
  ];
  assert.equal(resolveSelectedCategoryId(allEmpty, null), 10);
});

test('formatRupiah formats numeric values cleanly', () => {
  assert.match(formatRupiah(150000), /150\.000/);
  assert.equal(formatRupiah(150000), 'Rp 150.000');
  assert.equal(formatRupiah(150000.4), 'Rp 150.000');
  assert.equal(formatRupiah('25000'), 'Rp 25.000');
  assert.equal(formatRupiah(-5000), '-Rp 5.000');
  assert.equal(formatRupiah(0), 'Rp 0');
  assert.equal(formatRupiah(null), 'Rp 0');
  assert.equal(formatRupiah(undefined), 'Rp 0');
  assert.equal(formatRupiah(Number.NaN), 'Rp 0');
  assert.equal(formatRupiah(''), 'Rp 0');
});

test('formatCompactMonthLabel formats YYYY-MM into short Indonesian month + 2-digit year', () => {
  assert.equal(formatCompactMonthLabel('2026-11'), 'Nov 26');
  assert.equal(formatCompactMonthLabel('2025-01'), 'Jan 25');
  assert.equal(formatCompactMonthLabel('invalid'), '');
  assert.equal(formatCompactMonthLabel(''), '');
  assert.equal(formatCompactMonthLabel(null), '');
});

test('formatMobileFilterSummary formats same-year, cross-year, and scoped labels concisely', () => {
  assert.equal(
    formatMobileFilterSummary({ startMonth: '2026-06', endMonth: '2026-11', scope: 'all', selectedKelompok: '' }),
    'Jun-Nov 2026 · Semua'
  );
  assert.equal(
    formatMobileFilterSummary({ startMonth: '2026-11', endMonth: '2026-11', scope: 'all', selectedKelompok: '' }),
    'Nov 2026 · Semua'
  );
  assert.equal(
    formatMobileFilterSummary({ startMonth: '2025-11', endMonth: '2026-02', scope: 'desa', selectedKelompok: 'Slogo' }),
    'Nov 25-Feb 26 · Desa · Slogo'
  );
  assert.equal(
    formatMobileFilterSummary({ startMonth: '', endMonth: '', scope: 'kelompok', selectedKelompok: '' }),
    'Periode Aktif · Kelompok'
  );
  assert.equal(
    formatMobileFilterSummary({}),
    'Periode Aktif · Semua'
  );
});

test('resolveDefaultInspectedMonth picks latest month with event or falls back safely', () => {
  assert.equal(
    resolveDefaultInspectedMonth([
      { month: '2026-08', has_event: true },
      { month: '2026-09', has_event: false },
      { month: '2026-10', has_event: true },
      { month: '2026-11', has_event: false },
    ]),
    '2026-10'
  );
  assert.equal(resolveDefaultInspectedMonth([{ month: '2026-11', has_event: false }]), '2026-11');
  assert.equal(
    resolveDefaultInspectedMonth([
      { month: '2026-09', has_event: false },
      { month: '2026-10', has_event: false },
    ]),
    '2026-10'
  );
  assert.equal(resolveDefaultInspectedMonth([]), '');
  assert.equal(resolveDefaultInspectedMonth(null), '');
});

test('formatCompactTickLabel shortens 4-digit year for narrow chart axis', () => {
  assert.equal(formatCompactTickLabel('Nov 2026'), 'Nov 26');
  assert.equal(formatCompactTickLabel('Jan 2025'), 'Jan 25');
  assert.equal(formatCompactTickLabel('Desember'), 'Desember');
  assert.equal(formatCompactTickLabel('Nov 26'), 'Nov 26');
  assert.equal(formatCompactTickLabel(''), '');
  assert.equal(formatCompactTickLabel(null), '');
});

test('resolveClickedSeriesItem resolves Recharts 3 activeTooltipIndex, activeLabel, and activePayload', () => {
  const items = [
    { month: '2026-09', label: 'Sep 2026' },
    { month: '2026-10', label: 'Okt 2026' },
  ];
  assert.deepEqual(resolveClickedSeriesItem({ activeTooltipIndex: '1' }, items), items[1]);
  assert.deepEqual(resolveClickedSeriesItem({ activeIndex: 0 }, items), items[0]);
  assert.deepEqual(resolveClickedSeriesItem({ activeLabel: 'Okt 2026' }, items), items[1]);
  assert.deepEqual(
    resolveClickedSeriesItem({ activePayload: [{ payload: items[0] }] }, items),
    items[0]
  );
  assert.equal(resolveClickedSeriesItem({ activeTooltipIndex: null, activeLabel: 'Unknown' }, items), null);
  assert.equal(resolveClickedSeriesItem(null, items), null);
  assert.equal(resolveClickedSeriesItem({ activeTooltipIndex: 0 }, []), null);
});

test('mobile viewport store helpers return safe defaults outside browser environment', () => {
  assert.equal(getMobileViewportSnapshot(), false);
  const unsubscribe = subscribeMobileViewport(() => {});
  assert.equal(typeof unsubscribe, 'function');
  unsubscribe();

  assert.equal(getCompactTouchViewportSnapshot(), false);
  const unsubscribeTouch = subscribeCompactTouchViewport(() => {});
  assert.equal(typeof unsubscribeTouch, 'function');
  unsubscribeTouch();
});

test('toFiniteNumber normalizes numeric values and rejects invalid inputs', () => {
  assert.equal(toFiniteNumber(42), 42);
  assert.equal(toFiniteNumber('18'), 18);
  assert.equal(toFiniteNumber(0), 0);
  assert.equal(toFiniteNumber(null), 0);
  assert.equal(toFiniteNumber(undefined, 5), 5);
  assert.equal(toFiniteNumber('', 3), 3);
  assert.equal(toFiniteNumber('   ', 7), 7);
  assert.equal(toFiniteNumber(true, 0), 0);
  assert.equal(toFiniteNumber(Number.NaN, 0), 0);
  assert.equal(toFiniteNumber('abc', 9), 9);
});

test('formatPercentLabel formats finite numbers as percentage strings and skips empty/invalid values', () => {
  assert.equal(formatPercentLabel(85), '85%');
  assert.equal(formatPercentLabel(0), '0%');
  assert.equal(formatPercentLabel('92'), '92%');
  assert.equal(formatPercentLabel(null), '');
  assert.equal(formatPercentLabel(undefined), '');
  assert.equal(formatPercentLabel(''), '');
  assert.equal(formatPercentLabel('   '), '');
  assert.equal(formatPercentLabel(false), '');
  assert.equal(formatPercentLabel(Number.NaN), '');
});

test('resolveClickedBarItem prefers barData payload and falls back to indexed item', () => {
  const items = [
    { kelompok: 'Slogo', percentage: 80 },
    { kelompok: 'Jati', percentage: 75 },
  ];
  assert.deepEqual(resolveClickedBarItem({ payload: items[1] }, 0, items), items[1]);
  assert.deepEqual(resolveClickedBarItem({}, 0, items), items[0]);
  assert.equal(resolveClickedBarItem({}, 5, items), null);
  assert.equal(resolveClickedBarItem(null, -1, items), null);
  assert.equal(resolveClickedBarItem(null, 0, []), null);
});
