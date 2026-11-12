/**
 * Build a readable role and jenjang label string for a generus record.
 * @param {object|null|undefined} generus
 * @returns {string}
 */
export function buildGenerusRolesText(generus) {
  if (!generus) return '-';

  const parts = [];
  if (generus.is_pengurus) parts.push('PENGURUS USMAN');
  if (generus.is_pengurus_muda_mudi) parts.push('PENGURUS MUDA MUDI');
  if (generus.is_ketua_wakil_kelompok) parts.push('KETUA/WAKIL KELOMPOK');
  if (generus.jenjang) parts.push(generus.jenjang);

  return parts.length > 0 ? parts.join(', ') : '-';
}

/**
 * Compute attendance summary counts and percentage for a generus across filtered events.
 * @param {object|null|undefined} generus
 * @param {Array<{ id: number|string }>|null|undefined} filteredEventsList
 * @returns {{ present: number, totalParticipant: number, percentageText: string }}
 */
export function computeGenerusMatrixSummary(generus, filteredEventsList) {
  let present = 0;
  let totalParticipant = 0;
  const events = Array.isArray(filteredEventsList) ? filteredEventsList : [];
  const attendanceMap = generus?.events_attendance || {};

  for (const e of events) {
    const stat = attendanceMap[e.id];
    if (stat && stat !== '-') {
      totalParticipant += 1;
      if (stat === 'H') present += 1;
    }
  }

  const percentageText = totalParticipant === 0
    ? '-'
    : `${Math.round((present / totalParticipant) * 100)}%`;

  return { present, totalParticipant, percentageText };
}

/**
 * Build ordered attendance chip entries for mobile generus matrix cards.
 * @param {object|null|undefined} generus
 * @param {Array<{ id: number|string, event_date: string, event_type_id: number|string }>|null|undefined} filteredEventsList
 * @returns {Array<{ id: number|string, eventTypeId: number|string, eventDate: string, status: string }>}
 */
export function buildMobileEventAttendanceChips(generus, filteredEventsList) {
  const events = Array.isArray(filteredEventsList) ? filteredEventsList : [];
  const attendanceMap = generus?.events_attendance || {};

  return events.map((e) => {
    const rawStatus = attendanceMap[e.id];
    const status = rawStatus && rawStatus !== '-' ? rawStatus : '-';
    return {
      id: e.id,
      eventTypeId: e.event_type_id,
      eventDate: e.event_date,
      status,
    };
  });
}
