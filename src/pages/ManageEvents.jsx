import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CustomSelect from '../components/CustomSelect';
import {
  Plus, Edit, Trash2, X, Calendar, Clock, Users,
  BookOpen, Layers, ChevronDown, CopyPlus, AlertTriangle,
  CheckSquare, Square, Search, Filter, HelpCircle,
  Loader2, CalendarDays
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const kategoriList = [
  'PAUD', 'TK',
  '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD',
  '1 SMP', '2 SMP', '3 SMP',
  '1 SMA/SMK', '2 SMA/SMK', '3 SMA/SMK',
  'USMAN', 'MT'
];

const kategoriGroups = [
  { label: 'Usia Dini', items: ['PAUD', 'TK'] },
  { label: 'SD',        items: ['1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD'] },
  { label: 'SMP',       items: ['1 SMP', '2 SMP', '3 SMP'] },
  { label: 'SMA/SMK',   items: ['1 SMA/SMK', '2 SMA/SMK', '3 SMA/SMK'] },
  { label: 'Lainnya',   items: ['USMAN', 'MT'] },
];

const TOTAL_STEPS = 3;
const stepTitles  = ['Pilih Template', 'Isi Detail Acara', 'Pilih Peserta Wajib'];

// ─── Small shared components ──────────────────────────────────────────────────

function KategoriChip({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border bg-teal-50 text-teal-700 border-teal-100">
      {label}
    </span>
  );
}

function Modal({ open, onClose, children, maxWidth = 'max-w-sm' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ManageEvents() {
  const navigate = useNavigate();

  const [events,     setEvents]     = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear,  setFilterYear]  = useState('');

  const [showModal,   setShowModal]   = useState(false);
  const [modalMode,   setModalMode]   = useState('add');
  const [modalStep,   setModalStep]   = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: '', name: '', event_date: '', start_time: '', target_kategori: [], event_type_id: ''
  });

  const [confirm,       setConfirm]       = useState({ open: false, title: '', message: '', action: null });
  const [isTypeOpen,    setIsTypeOpen]    = useState(false);
  const typeDropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (typeDropRef.current && !typeDropRef.current.contains(e.target))
        setIsTypeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, typesRes] = await Promise.all([
        api.get('/admin/events'),
        api.get('/admin/event-types'),
      ]);
      setEvents(eventsRes.data.data || []);
      setEventTypes(typesRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Form helpers ──────────────────────────────────────────────────────────
  const handleInputChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCheckbox = (k) =>
    setFormData(prev => ({
      ...prev,
      target_kategori: prev.target_kategori.includes(k)
        ? prev.target_kategori.filter(x => x !== k)
        : [...prev.target_kategori, k],
    }));

  const handleGroupToggle = (items) => {
    const allOn = items.every(k => formData.target_kategori.includes(k));
    setFormData(prev => ({
      ...prev,
      target_kategori: allOn
        ? prev.target_kategori.filter(k => !items.includes(k))
        : [...new Set([...prev.target_kategori, ...items])],
    }));
  };

  const handleSelectAll = (on) =>
    setFormData(prev => ({ ...prev, target_kategori: on ? [...kategoriList] : [] }));

  const handleSelectTemplate = (type) => {
    const cats = Array.isArray(type.target_kategori)
      ? type.target_kategori
      : type.target_kategori ? JSON.parse(type.target_kategori) : [];
    setFormData(prev => ({
      ...prev,
      event_type_id: type.id,
      name:          type.name,
      start_time:    type.start_time ? type.start_time.substring(0, 5) : '',
      target_kategori: cats,
    }));
    setIsTypeOpen(false);
  };

  const openModal = (mode, event = null) => {
    setModalMode(mode);
    setModalStep(0);
    if (event) {
      const cats = Array.isArray(event.target_kategori)
        ? event.target_kategori
        : event.target_kategori ? JSON.parse(event.target_kategori) : [];
      setFormData({
        id:             mode === 'edit' ? event.id : '',
        name:           event.name,
        event_date:     mode === 'edit' ? event.event_date : '',
        start_time:     event.start_time,
        target_kategori: cats,
        event_type_id:  event.event_type_id || '',
      });
    } else {
      setFormData({ id: '', name: '', event_date: '', start_time: '', target_kategori: [], event_type_id: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.target_kategori.length) return;
    setSubmitLoading(true);
    try {
      const payload = { ...formData, event_type_id: formData.event_type_id || null };
      if (modalMode === 'add') await api.post('/admin/events', payload);
      else                     await api.put(`/admin/events/${formData.id}`, payload);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitLoading(false);
    }
  };

  const execDelete = async (event) => {
    try {
      await api.delete(`/admin/events/${event.id}`);
      setConfirm(c => ({ ...c, open: false }));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Derived ───────────────────────────────────────────────────────────────
  const getTypeName = (id) =>
    id ? (eventTypes.find(t => t.id === parseInt(id))?.name ?? null) : null;

  const filteredEvents = events.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const eventDate = new Date(e.event_date);
    const matchMonth = filterMonth ? (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth : true;
    const matchYear = filterYear ? eventDate.getFullYear().toString() === filterYear : true;
    return matchSearch && matchMonth && matchYear;
  });

  const step2Valid = formData.name.trim() && formData.event_date && formData.start_time;
  const step3Valid = formData.target_kategori.length > 0;

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Jadwal Acara</h1>
            <p className="text-xs text-slate-400 mt-0.5">Kelola agenda dan jadwal kegiatan bulanan.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
            <button
              onClick={() => openModal('add')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white rounded-xl font-semibold text-sm shadow-sm shadow-teal-200 transition-all whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={2.5} />
              Buat Jadwal Baru
            </button>
            <button
              onClick={() => navigate('/admin/event-types')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 active:scale-95 text-slate-700 rounded-xl font-semibold text-sm shadow-sm transition-all whitespace-nowrap"
            >
              <Layers size={16} strokeWidth={2.5} />
              Buat Kategori Baru
            </button>
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama acara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-2xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm"
            />
          </div>
          
          {/* Month & Year Filter */}
          <div className="flex gap-3">
            <CustomSelect
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="min-w-[140px]"
              options={[
                { value: '', label: 'Semua Bulan' },
                { value: '01', label: 'Januari' },
                { value: '02', label: 'Februari' },
                { value: '03', label: 'Maret' },
                { value: '04', label: 'April' },
                { value: '05', label: 'Mei' },
                { value: '06', label: 'Juni' },
                { value: '07', label: 'Juli' },
                { value: '08', label: 'Agustus' },
                { value: '09', label: 'September' },
                { value: '10', label: 'Oktober' },
                { value: '11', label: 'November' },
                { value: '12', label: 'Desember' }
              ]}
            />
            <CustomSelect
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="min-w-[130px]"
              options={[
                { value: '', label: 'Semua Tahun' },
                ...Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => ({ value: y, label: y }))
              ]}
            />
          </div>
        </div>

        {/* ── Events list ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

          {/* Card header */}
          <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm">Daftar Jadwal</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700">
                {filteredEvents.length} acara
              </span>
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <X size={12} /> Hapus filter
              </button>
            )}
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={32} className="animate-spin text-teal-500" />
              <p className="text-slate-400 text-sm">Memuat jadwal acara...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <CalendarDays size={32} className="text-slate-300" />
              <p className="text-slate-400 font-medium text-sm">
                {search ? 'Acara tidak ditemukan' : 'Belum ada acara dijadwalkan'}
              </p>
              {!search && (
                <button
                  onClick={() => openModal('add')}
                  className="mt-1 text-teal-600 text-sm font-semibold hover:underline"
                >
                  + Buat jadwal pertama
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 grid gap-4 bg-slate-50/50">
              {filteredEvents.map((event) => {
                const cats = Array.isArray(event.target_kategori)
                  ? event.target_kategori
                  : event.target_kategori ? JSON.parse(event.target_kategori) : [];
                const typeName    = getTypeName(event.event_type_id);
                const isAllCats   = cats.length === kategoriList.length;

                return (
                  <div
                    key={event.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 bg-white border border-slate-200 rounded-2xl hover:border-teal-300 hover:shadow-md hover:shadow-teal-500/5 transition-all group"
                  >
                    {/* Left: info */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-bold text-slate-800 text-base">{event.name}</p>
                        {typeName && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase border bg-blue-50 text-blue-700 border-blue-100 px-2.5 py-1 rounded-lg">
                            <Layers size={11} /> {typeName}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1.5 text-sm text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          <Calendar size={15} className="text-teal-500 shrink-0" />
                          {new Date(event.event_date).toLocaleDateString('id-ID', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                          <Clock size={13} /> Batas {event.start_time?.substring(0, 5)} WIB
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {isAllCats ? (
                          <KategoriChip label="Semua Umur" />
                        ) : cats.length > 5 ? (
                          <>
                            {cats.slice(0, 4).map(k => <KategoriChip key={k} label={k} />)}
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase border bg-slate-100 text-slate-500 border-slate-200">
                              +{cats.length - 4} lagi
                            </span>
                          </>
                        ) : (
                          cats.map(k => <KategoriChip key={k} label={k} />)
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap lg:justify-end">
                      <button
                        onClick={() => navigate(`/admin/attendance/${event.id}`)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-500 text-sm font-bold transition-all shadow-sm"
                      >
                        <Users size={16} /> Absen
                      </button>
                      <button
                        onClick={() => navigate(`/admin/events/${event.id}/summary`)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-500 text-sm font-bold transition-all shadow-sm"
                      >
                        <BookOpen size={16} /> Rekapan
                      </button>
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm ml-1">
                        <button
                          onClick={() => openModal('add', event)}
                          title="Duplikat"
                          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <CopyPlus size={16} />
                        </button>
                        <button
                          onClick={() => openModal('edit', event)}
                          title="Edit"
                          className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors border-l border-slate-200"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setConfirm({
                            open: true,
                            title: 'Hapus Jadwal Ini?',
                            message: `Jadwal "${event.name}" akan dihapus permanen. Data absensi terkait juga ikut terhapus.`,
                            action: () => execDelete(event),
                          })}
                          title="Hapus"
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border-l border-slate-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ MODAL: Confirm / Delete ════════════════════════════════════════════ */}
      <Modal open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open: false }))}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <HelpCircle size={28} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{confirm.title}</h3>
          <p className="text-slate-500 text-sm mb-7 leading-relaxed">{confirm.message}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirm(c => ({ ...c, open: false }))}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={confirm.action}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>

      {/* ══ MODAL: Form (multi-step) ═══════════════════════════════════════════ */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Langkah {modalStep + 1} dari {TOTAL_STEPS}
            </p>
            <h3 className="text-base font-bold text-slate-800">{stepTitles[modalStep]}</h3>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step progress bar */}
        <div className="flex gap-1.5 px-6 pt-4">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                i < modalStep  ? 'bg-teal-500' :
                i === modalStep ? 'bg-teal-300' :
                'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[58vh]">

          {/* ─── Step 0: Template ─── */}
          {modalStep === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Pilih template untuk mengisi otomatis nama, waktu, dan peserta.
                Atau lewati untuk mengisi secara manual.
              </p>

              <div className="space-y-1.5" ref={typeDropRef}>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Template Acara
                </label>
                <button
                  type="button"
                  onClick={() => setIsTypeOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors"
                >
                  <span className="flex items-center gap-2 text-slate-600">
                    <Layers size={14} className="text-blue-400" />
                    {formData.event_type_id ? getTypeName(formData.event_type_id) : 'Pilih template acara...'}
                  </span>
                  <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${isTypeOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTypeOpen && (
                  <div className="border border-slate-200 rounded-xl shadow-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => { setFormData(f => ({ ...f, event_type_id: '' })); setIsTypeOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-slate-500 hover:bg-slate-50 border-b border-slate-100"
                    >
                      Tanpa template — isi manual
                    </button>
                    {eventTypes.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelectTemplate(type)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between ${
                          formData.event_type_id === type.id
                            ? 'bg-teal-50 text-teal-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{type.name}</span>
                        <span className="text-xs text-slate-400">{type.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {formData.event_type_id && (
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-3.5 space-y-1">
                  <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Template terpilih — data terisi otomatis</p>
                  <p className="text-sm text-teal-700">📝 Nama: <span className="font-semibold">{formData.name}</span></p>
                  <p className="text-sm text-teal-700">⏰ Batas: <span className="font-semibold">{formData.start_time} WIB</span></p>
                  <p className="text-sm text-teal-700">👥 Peserta: <span className="font-semibold">{formData.target_kategori.length} kategori</span></p>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 1: Detail ─── */}
          {modalStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tanggal Pelaksanaan <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nama Acara <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Pengajian Bulanan Maret"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Batas Jam Hadir <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  Peserta yang hadir setelah jam ini akan dicatat terlambat.
                </p>
              </div>
            </div>
          )}

          {/* ─── Step 2: Peserta ─── */}
          {modalStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Pilih kelompok yang <span className="font-semibold text-slate-700">wajib hadir</span>.
                </p>
                <span className="text-sm font-bold text-teal-600">{formData.target_kategori.length} dipilih</span>
              </div>

              {/* Quick-select */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="flex-1 py-2 text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors"
                >
                  ✓ Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  ✕ Hapus Semua
                </button>
              </div>

              {/* Groups */}
              <div className="space-y-2">
                {kategoriGroups.map(group => {
                  const allOn  = group.items.every(k => formData.target_kategori.includes(k));
                  const someOn = group.items.some(k  => formData.target_kategori.includes(k));
                  return (
                    <div key={group.label} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleGroupToggle(group.items)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors ${
                          allOn  ? 'bg-teal-50 text-teal-700'   :
                          someOn ? 'bg-blue-50 text-blue-700'   :
                                   'bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>{group.label}</span>
                        <span className="flex items-center gap-1.5 text-xs font-normal">
                          {group.items.filter(k => formData.target_kategori.includes(k)).length}/{group.items.length}
                          {allOn ? <CheckSquare size={15} /> : <Square size={15} />}
                        </span>
                      </button>
                      <div className="p-3 flex flex-wrap gap-2 border-t border-slate-100">
                        {group.items.map(k => {
                          const on = formData.target_kategori.includes(k);
                          return (
                            <label
                              key={k}
                              className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold select-none transition-all ${
                                on
                                  ? 'bg-teal-500 border-teal-500 text-white'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50'
                              }`}
                            >
                              <input type="checkbox" className="hidden" checked={on} onChange={() => handleCheckbox(k)} />
                              {on && <span>✓</span>}
                              {k}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {formData.target_kategori.length === 0 && (
                <p className="text-xs text-red-500 font-semibold text-center py-1">
                  ⚠ Pilih minimal satu kelompok peserta.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex gap-3">
          {modalStep === 0 ? (
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setModalStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              ← Kembali
            </button>
          )}

          {modalStep < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              disabled={modalStep === 1 && !step2Valid}
              onClick={() => setModalStep(s => s + 1)}
              className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-colors active:scale-95"
            >
              Lanjut →
            </button>
          ) : (
            <button
              type="button"
              disabled={!step3Valid || submitLoading}
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              {submitLoading ? (
                <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
              ) : modalMode === 'add' ? (
                '✓ Jadwalkan Acara'
              ) : (
                '✓ Simpan Perubahan'
              )}
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}