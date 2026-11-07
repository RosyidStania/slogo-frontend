import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import api from '../api/axios';
import CustomSelect from '../components/CustomSelect';
import TimeSelect from '../components/TimeSelect';
import {
  Plus, Edit, Trash2, X, Calendar, Clock,
  Loader2, HelpCircle
} from 'lucide-react';

const KELOMPOK_OPTIONS = ['Karangasem', 'Gabugan', 'Sidomulyo', 'Pengkruk', 'Slogo', 'Jekani', 'Gawan'];

const DAY_OPTIONS = [
  { value: 1, label: 'Senin', short: 'Senin' },
  { value: 2, label: 'Selasa', short: 'Selasa' },
  { value: 3, label: 'Rabu', short: 'Rabu' },
  { value: 4, label: 'Kamis', short: 'Kamis' },
  { value: 5, label: 'Jumat', short: 'Jumat' },
  { value: 6, label: 'Sabtu', short: 'Sabtu' },
  { value: 0, label: 'Minggu', short: 'Minggu' },
];

const getDayShort = (day) => DAY_OPTIONS.find(d => d.value === Number(day))?.short || `Hari ${day}`;

function Modal({ open, onClose, children, maxWidth = 'max-w-md' }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function ManageSchedules() {
  const role = localStorage.getItem('role');
  const userKelompok = localStorage.getItem('kelompok') || '';

  const [schedules, setSchedules] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterKelompok, setFilterKelompok] = useState('');

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

  useEffect(() => {
    fetchData();
  }, []);

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

  const filteredSchedules = schedules.filter(s =>
    filterKelompok ? s.kelompok.toLowerCase() === filterKelompok.toLowerCase() : true
  );

  // Group by kelompok for neat display
  const groupedByKelompok = filteredSchedules.reduce((acc, item) => {
    const k = item.kelompok || 'Lainnya';
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});

  // Helper to compute auto-create time string (e.g. 18:30 - 30m = 18:00)
  const computeAutoCreateTime = (startTime, leadMinutes = 30) => {
    if (!startTime) return '-';
    const [h, m] = startTime.substring(0, 5).split(':').map(Number);
    const total = (h * 60 + m - leadMinutes + 1440) % 1440;
    const hh = String(Math.floor(total / 60)).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Acara Kelompok</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Acara otomatis dibuat <strong>30 menit sebelum mulai</strong> dan otomatis ditutup <strong>2 jam setelah selesai</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {role === 'admin' && (
              <CustomSelect
                value={filterKelompok}
                onChange={e => setFilterKelompok(e.target.value)}
                className="min-w-[160px]"
                options={[
                  { value: '', label: 'Semua Kelompok' },
                  ...KELOMPOK_OPTIONS.map(k => ({ value: k, label: k })),
                ]}
              />
            )}
            <button
              onClick={() => openModal('add')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white rounded-xl font-semibold text-sm shadow-sm shadow-teal-200 transition-all whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Tambah Jadwal</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-teal-500" />
            <p className="text-slate-400 text-sm">Memuat acara kelompok...</p>
          </div>
        ) : Object.keys(groupedByKelompok).length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
            <Calendar size={32} className="text-slate-300" />
            <p className="text-slate-400 font-medium text-sm">Belum ada acara kelompok yang terdaftar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(groupedByKelompok).map(([kelompokName, items]) => (
              <div key={kelompokName} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                    <h3 className="font-bold text-slate-800 text-base">Kelompok {kelompokName}</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                    {items.length} jadwal / minggu
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {items.map(item => {
                    const startStr = item.start_time?.substring(0, 5);
                    const endStr = item.end_time?.substring(0, 5);
                    const autoOpenStr = computeAutoCreateTime(startStr, item.lead_minutes ?? 30);

                    return (
                      <div
                        key={item.id}
                        className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                          item.is_active ? 'hover:bg-slate-50/70' : 'bg-slate-50/60 opacity-60'
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-800">
                              {getDayShort(item.day_of_week)}
                            </span>
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock size={11} /> {startStr} – {endStr} WIB
                            </span>
                            {!item.is_active && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                                Diliburkan
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Otomatis dibuat pukul <span className="font-semibold text-teal-700">{autoOpenStr} WIB</span> • Ditutup 2 jam setelah selesai
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Toggle Switch ON/OFF */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(item)}
                            title={item.is_active ? 'Klik untuk meliburkan jadwal ini' : 'Klik untuk mengaktifkan jadwal ini'}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              item.is_active ? 'bg-teal-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                item.is_active ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                            <button
                              onClick={() => openModal('edit', item)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                              title="Edit Jam / Hari"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ open: true, item })}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border-l border-slate-200"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">
              {modalMode === 'add' ? 'Tambah Acara Kelompok' : 'Edit Acara Kelompok'}
            </h3>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {role === 'admin' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelompok</label>
                <CustomSelect
                  value={formData.kelompok}
                  onChange={e => setFormData(prev => ({ ...prev, kelompok: e.target.value }))}
                  options={KELOMPOK_OPTIONS.map(k => ({ value: k, label: k }))}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hari Pelaksanaan</label>
              <CustomSelect
                value={formData.day_of_week}
                onChange={e => setFormData(prev => ({ ...prev, day_of_week: Number(e.target.value) }))}
                options={DAY_OPTIONS.map(d => ({ value: d.value, label: d.label }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jam Mulai</label>
                <TimeSelect
                  name="start_time"
                  value={formData.start_time}
                  onChange={e => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jam Selesai</label>
                <TimeSelect
                  name="end_time"
                  value={formData.end_time}
                  onChange={e => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl text-xs text-teal-800 space-y-1">
              <p>⏰ Acara otomatis dibuat pukul <strong>{computeAutoCreateTime(formData.start_time, 30)} WIB</strong> (30 menit sebelum mulai).</p>
              <p>🔒 Acara otomatis ditutup <strong>2 jam setelah {formData.end_time} WIB</strong>.</p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              {submitLoading ? <Loader2 size={15} className="animate-spin" /> : 'Simpan Jadwal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, item: null })} maxWidth="max-w-sm">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle size={26} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Hapus Acara Kelompok?</h3>
          <p className="text-slate-500 text-xs mb-6">
            Jadwal <strong>{confirmDelete.item?.kelompok} ({getDayShort(confirmDelete.item?.day_of_week)})</strong> akan dihapus dari pembuatan otomatis.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete({ open: false, item: null })}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
