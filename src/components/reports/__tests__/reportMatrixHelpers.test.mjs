import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGenerusRolesText,
  buildMobileEventAttendanceChips,
  computeGenerusMatrixSummary,
} from '../reportMatrixHelpers.js';

test('buildGenerusRolesText combines legacy role flags and jenjang without trailing separator', () => {
  assert.equal(
    buildGenerusRolesText({
      is_pengurus: true,
      is_pengurus_muda_mudi: false,
      is_ketua_wakil_kelompok: true,
      jenjang: 'USMAN',
    }),
    'PENGURUS USMAN, KETUA/WAKIL KELOMPOK, USMAN'
  );
  assert.equal(
    buildGenerusRolesText({
      is_pengurus: true,
      is_pengurus_muda_mudi: true,
      is_ketua_wakil_kelompok: false,
      jenjang: '',
    }),
    'PENGURUS USMAN, PENGURUS MUDA MUDI'
  );
  assert.equal(buildGenerusRolesText({}), '-');
  assert.equal(buildGenerusRolesText(null), '-');
  assert.equal(buildGenerusRolesText(undefined), '-');
});

test('computeGenerusMatrixSummary counts Hadir only against non-dash statuses in filteredEventsList', () => {
  const events = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
  const res = computeGenerusMatrixSummary(
    { events_attendance: { 1: 'H', 2: 'I', 3: 'A', 4: 'S', 5: '-', 99: 'H' } },
    events
  );
  assert.deepEqual(res, { present: 1, totalParticipant: 4, percentageText: '25%' });
  assert.deepEqual(computeGenerusMatrixSummary({ events_attendance: { 1: '-' } }, [{ id: 1 }]), {
    present: 0,
    totalParticipant: 0,
    percentageText: '-',
  });
  assert.deepEqual(computeGenerusMatrixSummary(null, null), {
    present: 0,
    totalParticipant: 0,
    percentageText: '-',
  });
  assert.deepEqual(computeGenerusMatrixSummary({}, undefined), {
    present: 0,
    totalParticipant: 0,
    percentageText: '-',
  });
});

test('buildMobileEventAttendanceChips extracts ordered attendance entries for mobile cards', () => {
  const chips = buildMobileEventAttendanceChips(
    { events_attendance: { 10: 'H', 11: '-' } },
    [
      { id: 10, event_date: '2026-11-01', event_type_id: 2 },
      { id: 11, event_date: '2026-11-08', event_type_id: 2 },
    ]
  );
  assert.deepEqual(chips, [
    { id: 10, eventTypeId: 2, eventDate: '2026-11-01', status: 'H' },
    { id: 11, eventTypeId: 2, eventDate: '2026-11-08', status: '-' },
  ]);
  assert.deepEqual(buildMobileEventAttendanceChips(null, null), []);
  assert.deepEqual(
    buildMobileEventAttendanceChips({}, [{ id: 12, event_date: '2026-11-15', event_type_id: 3 }]),
    [{ id: 12, eventTypeId: 3, eventDate: '2026-11-15', status: '-' }]
  );
});
