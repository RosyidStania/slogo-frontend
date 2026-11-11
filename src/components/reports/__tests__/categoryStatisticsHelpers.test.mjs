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
