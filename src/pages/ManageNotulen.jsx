import { useEffect, useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  FileText, Plus, Search, Calendar, Clock, MapPin, Users,
  Trash2, X, Loader2
} from 'lucide-react';

const FULL_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatShortDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString + 'T00:00:00');
  if (isNaN(d.getTime())) return dateString;
  const day = d.getDate();
  const monthName = FULL_MONTHS[d.getMonth()]?.substring(0, 3);
  const year = d.getFullYear();
  return `${day} ${monthName} ${year}`;
}

function ModalPortal({ open, onClose, children, maxWidth = 'max-w-md' }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-200" onClick={onClose} />
      <div className={`relative bg-white/95 backdrop-blur-xl rounded-[24px] sm:rounded-[28px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.25)] w-full ${maxWidth} animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col overflow-hidden border border-white/60`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function ManageNotulen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventIdParam = searchParams.get('eventId');

  const [notes, setNotes] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Pilih Acara Sederhana
  const [showEventPickerModal, setShowEventPickerModal] = useState(false);
  const [pickerEventId, setPickerEventId] = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);

  // Hapus State
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, title: '' });

  // Load Notes & Acara Umum
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [notesRes, eventsRes] = await Promise.all([
        api.get('/admin/notulen'),
        api.get('/admin/notulen/events-list')
      ]);

      const notesData = notesRes.data.data || [];
      const eventsData = eventsRes.data.data || [];

      setNotes(notesData);
      setEventsList(eventsData);

      // Jika dibuka dengan parameter ?eventId=...
      if (eventIdParam) {
        const existingNote = notesData.find(n => String(n.event_id) === String(eventIdParam));
        if (existingNote) {
          navigate(`/admin/notulen/${existingNote.id}`, { replace: true });
        } else {
          const foundEvent = eventsData.find(e => String(e.id) === String(eventIdParam));
          if (foundEvent) {
            setPickerEventId(String(foundEvent.id));
            setShowEventPickerModal(true);
          }
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data notulen:', err);
    } finally {
      setLoading(false);
    }
  }, [eventIdParam, navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(false);
  }, [fetchData]);

  // Simpan Pilihan Acara Umum -> Langsung buka halaman Kanvas Edit
  const handleSavePickedEvent = async (e) => {
    e.preventDefault();
    if (!pickerEventId) {
      alert('Silakan pilih salah satu acara umum!');
      return;
    }

    try {
      setPickerLoading(true);
      const res = await api.post('/admin/notulen', {
        event_id: pickerEventId
      });

      const note = res.data.data;
      setShowEventPickerModal(false);
      setPickerEventId('');

      navigate(`/admin/notulen/${note.id}`);
    } catch (err) {
      console.error('Gagal membuat notulen acara:', err);
      alert(err.response?.data?.message || 'Terjadi kesalahan saat memilih acara.');
    } finally {
      setPickerLoading(false);
    }
  };

  // Hapus Notulen
  const handleDeleteNote = async () => {
    if (!deleteConfirm.id) return;
    try {
      await api.delete(`/admin/notulen/${deleteConfirm.id}`);
      setNotes(prev => prev.filter(n => n.id !== deleteConfirm.id));
      setDeleteConfirm({ open: false, id: null, title: '' });
    } catch (err) {
      console.error('Gagal menghapus notulen:', err);
      alert('Gagal menghapus notulen.');
    }
  };

  // Filter Card Berdasarkan Pencarian
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n => {
      const matchTitle = (n.judul || '').toLowerCase().includes(q);
      const matchText = (n.pembahasan || '').toLowerCase().includes(q);
      const matchLocation = (n.lokasi || '').toLowerCase().includes(q);
      return matchTitle || matchText || matchLocation;
    });
  }, [notes, searchQuery]);

  const existingEventIds = useMemo(() => {
    return new Set(notes.map(n => String(n.event_id)));
  }, [notes]);

  return (
    <div className="w-full py-3 sm:py-6 pb-28 sm:pb-12 space-y-3.5 sm:space-y-5">
      {/* ── iOS LARGE TITLE NAVIGATION HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Notulen Musyawarah
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/70 tabular-nums">
              {filteredNotes.length} Acara
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Pilih acara umum musyawarah, lalu klik kartu untuk membuka kanvas catatan.
          </p>
        </div>

        {/* iOS Primary Action Button */}
        <button
          onClick={() => {
            setPickerEventId('');
            setShowEventPickerModal(true);
          }}
          className="w-full sm:w-auto py-2.5 px-4 rounded-full bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(20,184,166,0.25)] cursor-pointer active:scale-95 transition-all"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Pilih Acara Musyawarah</span>
        </button>
      </div>

      {/* ── iOS SEARCH FIELD ── */}
      <div className="relative w-full bg-slate-100/80 focus-within:bg-white rounded-2xl border border-transparent focus-within:border-slate-300 transition-all p-1">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari acara musyawarah atau catatan..."
          className="w-full pl-9 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 bg-transparent focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── iOS INSET GROUPED CARDS ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="text-[#14b8a6] animate-spin" />
          <p className="text-xs font-bold text-slate-500">Memuat notulen...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="py-14 sm:py-16 px-4 bg-white rounded-[24px] sm:rounded-[28px] border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
            <FileText size={26} strokeWidth={1.5} />
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">Belum Ada Notulen Acara</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
            {searchQuery
              ? 'Tidak ditemukan notulen yang cocok dengan pencarian.'
              : 'Pilih salah satu acara umum musyawarah untuk mulai membuat kanvas notulen.'}
          </p>
          <button
            onClick={() => {
              setPickerEventId('');
              setShowEventPickerModal(true);
            }}
            className="mt-4 sm:mt-5 py-2.5 px-4 rounded-full bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Pilih Acara Musyawarah</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredNotes.map((note) => {
            const hasContent = !!(note.pembahasan && note.pembahasan.trim());

            return (
              <div
                key={note.id}
                onClick={() => navigate(`/admin/notulen/${note.id}`)}
                className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/70 hover:border-teal-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between overflow-hidden group cursor-pointer active:scale-[0.99] space-y-2.5 sm:space-y-3"
              >
                {/* Metadata Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-100/80 tabular-nums">
                      <Calendar size={11} strokeWidth={2} />
                      <span>{formatShortDate(note.tanggal)}</span>
                    </span>

                    {note.waktu && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 tabular-nums">
                        <Clock size={10} />
                        <span>{note.waktu}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, id: note.id, title: note.judul })}
                      title="Hapus Card"
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer active:scale-90"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Judul Acara */}
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#14b8a6] transition-colors tracking-tight leading-snug">
                    {note.judul}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-[11px] font-medium">
                    {note.lokasi && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400" />
                        <span>{note.lokasi}</span>
                      </span>
                    )}
                    {note.peserta_hadir_count != null && note.peserta_hadir_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-teal-700 font-bold tabular-nums">
                        <Users size={11} />
                        <span>{note.peserta_hadir_count} Hadir</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Cuplikan Teks jika ada */}
                {hasContent && (
                  <div className="pt-0.5">
                    <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 text-xs text-slate-600 leading-relaxed line-clamp-3 whitespace-pre-line font-medium">
                      {note.pembahasan}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ iOS MODAL: PILIH ACARA UMUM ════════════════════════════════════ */}
      <ModalPortal open={showEventPickerModal} onClose={() => setShowEventPickerModal(false)} maxWidth="max-w-md">
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-50 text-[#14b8a6] flex items-center justify-center font-bold">
              <Calendar size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Pilih Acara Musyawarah
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Khusus acara umum desa
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowEventPickerModal(false)}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSavePickedEvent} className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Pilih Acara Umum:
            </label>
            <select
              required
              value={pickerEventId}
              onChange={(e) => setPickerEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/20 focus:border-[#14b8a6] cursor-pointer"
            >
              <option value="">-- Pilih salah satu acara umum --</option>
              {eventsList.map(ev => {
                const alreadyExists = existingEventIds.has(String(ev.id));
                return (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({formatShortDate(ev.event_date)} • {ev.start_time?.substring(0, 5)} WIB)
                    {alreadyExists ? ' [Sudah Ada]' : ''}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-1 font-medium">
              Tanggal dan detail acara akan otomatis digunakan. Setelah disimpan, kanvas catatan langsung terbuka.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setShowEventPickerModal(false)}
              className="w-full sm:w-auto py-2.5 px-4 rounded-full bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer active:scale-95 text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pickerLoading || !pickerEventId}
              className="w-full sm:w-auto py-2.5 px-5 rounded-full bg-[#14b8a6] hover:bg-[#0d9488] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all text-center"
            >
              {pickerLoading ? (
                <><Loader2 size={13} className="animate-spin" /> Menyimpan...</>
              ) : (
                'Simpan & Buka Kanvas'
              )}
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* ══ iOS MODAL: KONFIRMASI HAPUS ════════════════════════════════════ */}
      <ModalPortal open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null, title: '' })} maxWidth="max-w-sm">
        <div className="p-5 sm:p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <Trash2 size={20} />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Hapus Notulen Acara?</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Notulen "<span className="font-bold text-slate-700">{deleteConfirm.title}</span>" beserta catatan di dalamnya akan dihapus.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setDeleteConfirm({ open: false, id: null, title: '' })}
              className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer active:scale-95"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteNote}
              className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer active:scale-95"
            >
              Hapus
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
