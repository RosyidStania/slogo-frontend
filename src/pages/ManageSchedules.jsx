import { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import api from '../api/axios';
import TimeSelect from '../components/TimeSelect';
import {
  Plus, Pencil, Trash2, X, Calendar, Clock,
  Loader2, HelpCircle,
  ChevronDown, Search, Sparkles
} from 'lucide-react';

const KELOMPOK_OPTIONS = ['Karangasem', 'Gabugan', 'Sidomulyo', 'Pengkruk', 'Slogo', 'Jekani', 'Gawan'];

const DAY_OPTIONS = [
  { value: 1, label: 'Senin', short: 'SEN' },
  { value: 2, label: 'Selasa', short: 'SEL' },
  { value: 3, label: 'Rabu', short: 'RAB' },
  { value: 4, label: 'Kamis', short: 'KAM' },
  { value: 5, label: 'Jumat', short: 'JUM' },
  { value: 6, label: 'Sabtu', short: 'SAB' },
  { value: 0, label: 'Minggu', short: 'MIN' },
];

const getDayInfo = (day) => {
  const num = Number(day);
  const found = DAY_OPTIONS.find(d => d.value === num);
  return found || { value: num, label: `Hari ${day}`, short: `H-${day}` };
};

// ─── Custom Pill Select ────────────────────────────────────────────────────────
function PillSelect({ value, onChange, options, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : 'Pilih...';

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-1.5 bg-white border ${
          isOpen ? 'border-[#168a53] ring-2 ring-[#168a53]/15' : 'border-slate-200/90 hover:border-slate-300'
        } rounded-full text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 w-full min-w-[145px] mt-1 bg-white border border-slate-200/90 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setIsOpen(false);
                onChange({ target: { value: opt.value } });
              }}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors ${
                String(value) === String(opt.value)
                  ? 'bg-emerald-50 text-[#168a53] font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Modal({ open, onClose, children, maxWidth = 'max-w-md' }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${maxWidth} animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ManageSchedules() {
  const role = localStorage.getItem('role');
  const userKelompok = localStorage.getItem('kelompok') || '';

  const [schedules, setSchedules] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterKelompok, setFilterKelompok] = useState('');
  const [search, setSearch] = useState('');
  const [headerSlot, setHeaderSlot] = useState(() => document.getElementById('layout-header-actions'));

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    kelompok: userKelompok || 'Karangasem',
    day_of_week: 2,
    start_time: '19:30',
    end_time: '21:00',
    event_type_id: '',
    name: 'Pengajian Muda Mudi Kelompok',
    lead_minutes: 30,
    auto_close_minutes: 120,
    is_active: true,
  });

  const [confirmDelete, setConfirmDelete] = useState({ open: false, item: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedRes, typesRes] = await Promise.all([
        api.get('/admin/group-schedules'),
        api.get('/admin/event-types'),
      ]);
      setSchedules(schedRes.data.data || []);
      setEventTypes(typesRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = requestAnimationFrame(() => {
      setHeaderSlot(document.getElementById('layout-header-actions'));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const openModal = (mode, item = null) => {
    setModalMode(mode);
    const defaultType =
      eventTypes.find(t => (t.is_group_attendance === true || t.is_group_attendance === 1) && String(t.code) === '8') ||
      eventTypes.find(t => t.is_group_attendance === true || t.is_group_attendance === 1) ||
      eventTypes.find(t => String(t.code) === '8');
    if (item) {
      setFormData({
        id: item.id,
        kelompok: item.kelompok,
        day_of_week: item.day_of_week,
        start_time: item.start_time ? item.start_time.substring(0, 5) : '19:30',
        end_time: item.end_time ? item.end_time.substring(0, 5) : '21:00',
        event_type_id: item.event_type_id || defaultType?.id || '',
        name: item.name || defaultType?.name || 'Pengajian Muda Mudi Kelompok',
        lead_minutes: item.lead_minutes ?? 30,
        auto_close_minutes: item.auto_close_minutes ?? 120,
        is_active: !!item.is_active,
      });
    } else {
      setFormData({
        id: '',
        kelompok: role === 'absen_kelompok' ? userKelompok : (filterKelompok || 'Karangasem'),
        day_of_week: 2,
        start_time: '19:30',
        end_time: '21:00',
        event_type_id: defaultType?.id || '',
        name: defaultType?.name || 'Pengajian Muda Mudi Kelompok',
        lead_minutes: 30,
        auto_close_minutes: 120,
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleToggleActive = async (item) => {
    try {
      const res = await api.patch(`/admin/group-schedules/${item.id}/toggle-active`);
      setSchedules(prev => prev.map(s => s.id === item.id ? { ...s, is_active: res.data.is_active } : s));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status jadwal');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        ...formData,
        day_of_week: Number(formData.day_of_week),
        event_type_id: formData.event_type_id || null,
      };
      if (modalMode === 'add') {
        await api.post('/admin/group-schedules', payload);
      } else {
        await api.put(`/admin/group-schedules/${formData.id}`, payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan acara kelompok');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete.item) return;
    try {
      await api.delete(`/admin/group-schedules/${confirmDelete.item.id}`);
      setConfirmDelete({ open: false, item: null });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus jadwal');
    }
  };

  // Filter schedules
  const filteredSchedules = schedules.filter(s => {
    const matchKelompok = filterKelompok ? s.kelompok.toLowerCase() === filterKelompok.toLowerCase() : true;
    const dayInfo = getDayInfo(s.day_of_week);
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.kelompok.toLowerCase().includes(q) ||
      dayInfo.label.toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q);
    return matchKelompok && matchSearch;
  });

  // Group by kelompok
  const groupedByKelompok = filteredSchedules.reduce((acc, item) => {
    const k = item.kelompok || 'Lainnya';
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});

  const activeCount = schedules.filter(s => s.is_active).length;

  const computeAutoCreateTime = (startTime, leadMinutes = 30) => {
    if (!startTime) return '-';
    const [h, m] = startTime.substring(0, 5).split(':').map(Number);
    const total = (h * 60 + m - leadMinutes + 1440) % 1440;
    const hh = String(Math.floor(total / 60)).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // ─── Portal into mobile top header actions ─────────────────────────────────
  const mobileTopActions = headerSlot && ReactDOM.createPortal(
    <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
      <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200/90 bg-white text-[11px] font-semibold text-slate-600 shadow-2xs">
        <Sparkles size={12} className="text-emerald-600" />
        <span>{activeCount} Aktif</span>
      </div>
      {['admin', 'absen_kelompok'].includes(role) && (
        <button
          type="button"
          onClick={() => openModal('add')}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#168a53] hover:bg-[#127344] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>Jadwal</span>
        </button>
      )}
    </div>,
    headerSlot
  );

  return (
    <div className="w-full py-2 sm:py-3 space-y-3">
      {mobileTopActions}

      {/* ── Header & Inline Controls ─────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-0.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Acara Kelompok</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#168a53] border border-emerald-200/60">
              {schedules.length} Jadwal
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {activeCount} Aktif
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Jadwal rutin mingguan otomatis dibuat 30 menit sebelum mulai &amp; ditutup 2 jam setelah selesai.
          </p>
        </div>

        {/* Right Controls: Search, Kelompok Filter, + Tambah */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-44">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kelompok, hari..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white rounded-full border border-slate-200/90 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168a53]/15 focus:border-[#168a53] shadow-2xs transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {role === 'admin' && (
            <PillSelect
              value={filterKelompok}
              onChange={e => setFilterKelompok(e.target.value)}
              className="flex-1 sm:flex-none sm:w-auto min-w-[130px]"
              options={[
                { value: '', label: 'Semua Kelompok' },
                ...KELOMPOK_OPTIONS.map(k => ({ value: k, label: k })),
              ]}
            />
          )}

          <button
            onClick={() => openModal('add')}
            className="flex items-center justify-center gap-1 px-3.5 py-1.5 bg-[#168a53] hover:bg-[#127344] active:scale-95 text-white rounded-full font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* ── Content: 2-column Compact Responsive iOS Cards ──────────────── */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center py-14 gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <Loader2 size={24} className="animate-spin text-[#168a53]" />
          <p className="text-slate-400 text-xs font-medium">Memuat acara kelompok...</p>
        </div>
      ) : Object.keys(groupedByKelompok).length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center py-14 gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <Calendar size={28} className="text-slate-300" />
          <p className="text-slate-400 font-medium text-xs">
            {search || filterKelompok ? 'Jadwal tidak ditemukan' : 'Belum ada acara kelompok yang terdaftar'}
          </p>
          <button
            onClick={() => openModal('add')}
            className="text-[#168a53] text-xs font-bold hover:underline cursor-pointer"
          >
            + Tambah jadwal baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
          {Object.entries(groupedByKelompok).map(([kelompokName, items]) => (
            <div
              key={kelompokName}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col"
            >
              {/* Inset Header */}
              <div className="px-3.5 sm:px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#168a53]" />
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                    Kelompok {kelompokName}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#168a53] border border-emerald-200/60">
                  {items.length} jadwal / mgg
                </span>
              </div>

              {/* List Items */}
              <div className="divide-y divide-slate-100 flex-1">
                {items.map(item => {
                  const startStr = item.start_time?.substring(0, 5);
                  const endStr = item.end_time?.substring(0, 5);
                  const autoOpenStr = computeAutoCreateTime(startStr, item.lead_minutes ?? 30);
                  const dayInfo = getDayInfo(item.day_of_week);

                  return (
                    <div
                      key={item.id}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 transition-colors ${
                        item.is_active ? 'hover:bg-slate-50/70' : 'bg-slate-50/50 opacity-60'
                      }`}
                    >
                      {/* Left: Day & Timing */}
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        {/* Day Badge */}
                        <span className={`px-2 sm:px-2.5 py-1 rounded-lg text-center text-xs font-bold shrink-0 min-w-[50px] transition-colors ${
                          item.is_active
                            ? 'bg-emerald-50 text-[#168a53] border border-emerald-200/80'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {dayInfo.label}
                        </span>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-amber-800 bg-amber-50/90 border border-amber-200/70 px-2 py-0.5 rounded-md inline-flex items-center gap-1 shrink-0">
                              <Clock size={11} className="text-amber-600 shrink-0" />
                              <span>{startStr} - {endStr} WIB</span>
                            </span>

                            {!item.is_active ? (
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                                Libur
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-[#168a53] border border-emerald-200/60 hidden xs:inline-block sm:inline-block">
                                Aktif
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 truncate">
                            Dibuat <span className="font-semibold text-slate-600">{autoOpenStr} WIB</span> · Ditutup 2 jam selesai
                          </p>
                        </div>
                      </div>

                      {/* Right: iOS Switch & Action Buttons */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* iOS Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          title={item.is_active ? 'Klik untuk meliburkan' : 'Klik untuk mengaktifkan'}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.is_active ? 'bg-[#168a53]' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              item.is_active ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <button
                          onClick={() => openModal('edit', item)}
                          className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ open: true, item })}
                          className="p-1 sm:p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ MODAL: Add / Edit (iOS Rounded Style) ═════════════════════════════ */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Konfigurasi Rutin
              </p>
              <h3 className="text-base font-bold text-slate-800">
                {modalMode === 'add' ? 'Tambah Acara Kelompok' : 'Edit Acara Kelompok'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-5 py-3.5 space-y-3.5">
            {role === 'admin' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Kelompok
                </label>
                <PillSelect
                  value={formData.kelompok}
                  onChange={e => setFormData(prev => ({ ...prev, kelompok: e.target.value }))}
                  options={KELOMPOK_OPTIONS.map(k => ({ value: k, label: `Kelompok ${k}` }))}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hari Pelaksanaan
              </label>
              <PillSelect
                value={formData.day_of_week}
                onChange={e => setFormData(prev => ({ ...prev, day_of_week: Number(e.target.value) }))}
                options={DAY_OPTIONS.map(d => ({ value: d.value, label: `Setiap ${d.label}` }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Jam Mulai
                </label>
                <TimeSelect
                  name="start_time"
                  value={formData.start_time}
                  onChange={e => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Jam Selesai
                </label>
                <TimeSelect
                  name="end_time"
                  value={formData.end_time}
                  onChange={e => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-[#168a53] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Pembuatan Acara Otomatis</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                Acara otomatis dibuat pukul <strong>{computeAutoCreateTime(formData.start_time, 30)} WIB</strong> (30 menit sebelum mulai) dan otomatis ditutup 2 jam setelah selesai.
              </p>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 py-2 rounded-xl bg-[#168a53] hover:bg-[#127344] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              {submitLoading ? (
                <><Loader2 size={13} className="animate-spin" /> Menyimpan...</>
              ) : (
                'Simpan Jadwal'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══ MODAL: Delete Confirmation ═══════════════════════════════════════ */}
      <Modal open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, item: null })} maxWidth="max-w-sm">
        <div className="p-5 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <HelpCircle size={24} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Hapus Acara Kelompok?</h3>
          <p className="text-slate-500 text-xs mb-5 leading-relaxed">
            Jadwal <strong>{confirmDelete.item?.kelompok} ({getDayInfo(confirmDelete.item?.day_of_week).label})</strong> akan dihapus dari sistem pembuatan otomatis mingguan.
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={() => setConfirmDelete({ open: false, item: null })}
              className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
