import { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import TimeSelect from '../components/TimeSelect';
import {
  Plus, Pencil, Trash2, X, Calendar, Clock, Users,
  BookOpen, Layers, ChevronDown, ChevronLeft, ChevronRight,
  CheckSquare, Square, Search, HelpCircle,
  Loader2, CalendarDays, Lock, Unlock, Check, CheckCircle2, List,
  MoreVertical, FileText
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const ageKategoriList = [
  'PAUD', 'TK',
  '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD',
  '1 SMP', '2 SMP', '3 SMP',
  '1 SMA/SMK', '2 SMA/SMK', '3 SMA/SMK',
  'USMAN', 'MT'
];

const kategoriList = [
  ...ageKategoriList,
  'PENGURUS USMAN', 'PENGURUS MUDA MUDI', 'KETUA/WAKIL KELOMPOK'
];

const kategoriGroups = [
  { label: 'Usia Dini', items: ['PAUD', 'TK'] },
  { label: 'SD',        items: ['1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD'] },
  { label: 'SMP',       items: ['1 SMP', '2 SMP', '3 SMP'] },
  { label: 'SMA/SMK',   items: ['1 SMA/SMK', '2 SMA/SMK', '3 SMA/SMK'] },
  { label: 'Lainnya',   items: ['USMAN', 'MT', 'PENGURUS USMAN', 'PENGURUS MUDA MUDI', 'KETUA/WAKIL KELOMPOK'] },
];

const SHORT_DAYS = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const SHORT_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const FULL_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const FULL_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const TOTAL_STEPS = 3;
const stepTitles  = ['Pilih Template', 'Isi Detail Acara', 'Pilih Peserta Wajib'];

// ─── Small shared components ──────────────────────────────────────────────────

function KategoriChip({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200/70">
      {label}
    </span>
  );
}

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
        className={`w-full flex items-center justify-between gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white border ${
          isOpen ? 'border-[#168a53] ring-2 ring-[#168a53]/15' : 'border-slate-200/90 hover:border-slate-300'
        } rounded-full text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 w-full min-w-[150px] mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-lg max-h-60 overflow-y-auto py-1.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setIsOpen(false);
                onChange({ target: { value: opt.value } });
              }}
              className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${
                String(value) === String(opt.value)
                  ? 'bg-emerald-50 text-[#168a53]'
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

function Modal({ open, onClose, children, maxWidth = 'max-w-sm' }) {
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function ManageEvents() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const [events,     setEvents]     = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(role === 'absen_kelompok' ? 'kelompok' : 'umum');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear,  setFilterYear]  = useState('');
  const [filterKelompok, setFilterKelompok] = useState('');

  // Mobile more menu state
  const [mobileMenuId, setMobileMenuId] = useState(null);
  const [headerSlot, setHeaderSlot] = useState(() => document.getElementById('layout-header-actions'));

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [showModal,   setShowModal]   = useState(false);
  const [modalMode,   setModalMode]   = useState('add');
  const [modalStep,   setModalStep]   = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: '', name: '', event_date: '', start_time: '', target_kategori: [], event_type_id: '', allow_other_participants: false
  });

  const [confirm,       setConfirm]       = useState({ open: false, title: '', message: '', action: null });
  const [deleteInput,   setDeleteInput]   = useState('');
  const [isTypeOpen,    setIsTypeOpen]    = useState(false);
  const typeDropRef = useRef(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (typeDropRef.current && !typeDropRef.current.contains(e.target))
        setIsTypeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const id = requestAnimationFrame(() => {
      setHeaderSlot(document.getElementById('layout-header-actions'));
    });
    return () => cancelAnimationFrame(id);
  }, []);

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
        allow_other_participants: !!event.allow_other_participants,
      });
    } else {
      setFormData({ id: '', name: '', event_date: '', start_time: '', target_kategori: [], event_type_id: '', allow_other_participants: false });
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

  const handleToggleStatus = async (event) => {
    try {
      await api.patch(`/admin/events/${event.id}/toggle-status`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah status acara');
    }
  };

  // ─── Derived ───────────────────────────────────────────────────────────────
  const getTypeName = (id) =>
    id ? (eventTypes.find(t => t.id === parseInt(id))?.name ?? null) : null;

  const isGroupEvent = (id, eventObj = null) => {
    if (eventObj && (eventObj.group_schedule_id || eventObj.kelompok)) return true;
    if (!id) return false;
    const t = eventTypes.find(t => t.id === parseInt(id));
    return t ? (t.is_group_attendance === 1 || t.is_group_attendance === true) : false;
  };

  const umumEvents = events.filter(e => !isGroupEvent(e.event_type_id, e));
  const kelompokEvents = events.filter(e => isGroupEvent(e.event_type_id, e));
  const tabBaseEvents = activeTab === 'kelompok' ? kelompokEvents : umumEvents;

  const filteredEvents = tabBaseEvents.filter(e => {
    const q = search.toLowerCase();
    const typeName = getTypeName(e.event_type_id) || '';
    const matchSearch =
      e.name.toLowerCase().includes(q) ||
      typeName.toLowerCase().includes(q) ||
      (e.kelompok || '').toLowerCase().includes(q);
    const eventDate = new Date(e.event_date);
    const matchMonth = filterMonth ? (eventDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth : true;
    const matchYear = filterYear ? eventDate.getFullYear().toString() === filterYear : true;
    const matchKelompok = (activeTab === 'kelompok' && filterKelompok) ? (e.kelompok === filterKelompok) : true;
    return matchSearch && matchMonth && matchYear && matchKelompok;
  });

  // Summary card stats
  const now = new Date();
  const activeMonthIndex = filterMonth ? parseInt(filterMonth, 10) - 1 : now.getMonth();
  const activeMonthName = FULL_MONTHS[activeMonthIndex] || FULL_MONTHS[now.getMonth()];
  const activeYearLabel = filterYear || now.getFullYear();

  const totalAcaraCount = tabBaseEvents.filter(e => {
    if (!filterYear) return true;
    return new Date(e.event_date).getFullYear().toString() === String(filterYear);
  }).length;

  const bulanIniCount = tabBaseEvents.filter(e => {
    const d = new Date(e.event_date);
    const mMatch = d.getMonth() === activeMonthIndex;
    const yMatch = filterYear ? d.getFullYear().toString() === String(filterYear) : d.getFullYear() === now.getFullYear();
    return mMatch && yMatch;
  }).length;

  const selesaiCount = tabBaseEvents.filter(e => {
    const yMatch = filterYear ? new Date(e.event_date).getFullYear().toString() === String(filterYear) : true;
    return yMatch && (e.is_completed || e.is_closed);
  }).length;

  const selesaiPct = totalAcaraCount > 0 ? Math.round((selesaiCount / totalAcaraCount) * 100) : 0;

  // Pagination calculations
  const effectivePerPage = itemsPerPage === 'all' ? (filteredEvents.length || 1) : Number(itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / effectivePerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * effectivePerPage;
  const paginatedEvents = itemsPerPage === 'all'
    ? filteredEvents
    : filteredEvents.slice(startIdx, startIdx + effectivePerPage);

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 3) return [1, 2, 3, '...', totalPages];
    if (safePage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', safePage, '...', totalPages];
  };

  const formatCardDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { dayName: '---', dayNum: '--', monthShort: '---', fullText: dateStr };
    }
    const dayName = SHORT_DAYS[d.getDay()];
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthShort = SHORT_MONTHS[d.getMonth()];
    const fullDayName = FULL_DAYS[d.getDay()];
    const monthTitle = monthShort.charAt(0) + monthShort.slice(1).toLowerCase();
    const fullText = `${fullDayName}, ${d.getDate()} ${monthTitle} ${d.getFullYear()}`;
    return { dayName, dayNum, monthShort, fullText };
  };

  const monthOptions = [
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
  ];

  const yearOptions = [
    { value: '', label: 'Semua Tahun' },
    ...Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => ({ value: y, label: `Tahun ${y}` }))
  ];

  const kelompokOptions = [
    { value: '', label: 'Semua Kelompok' },
    ...[...new Set(events.filter(e => isGroupEvent(e.event_type_id, e)).map(e => e.kelompok).filter(Boolean))].map(k => ({ value: k, label: k }))
  ];

  const step2Valid = formData.name.trim() && formData.event_date && formData.start_time;
  const step3Valid = formData.target_kategori.length > 0;

  // ─── Portal into mobile header actions ──────────────────────────────────────
  const mobileTopActions = headerSlot && ReactDOM.createPortal(
    <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/90 bg-white text-[11px] font-semibold text-slate-600 shadow-2xs">
        <Calendar size={12} className="text-emerald-600" />
        <span>{new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
      </div>
      {['admin', 'absen_kelompok'].includes(role) && (
        <button
          type="button"
          onClick={() => openModal('add')}
          className="flex items-center gap-1 px-3.5 py-1.5 bg-[#168a53] hover:bg-[#127344] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Jadwal</span>
        </button>
      )}
    </div>,
    headerSlot
  );

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full py-4 sm:py-6 space-y-4 sm:space-y-5">
      {mobileTopActions}

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Jadwal Acara</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Kelola agenda kegiatan desa &amp; generasi muda.
          </p>
        </div>

        {/* Desktop Buttons: + Buat Jadwal Baru & Buat Kategori Baru */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {['admin', 'absen_kelompok'].includes(role) && (
            <button
              onClick={() => openModal('add')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#168a53] hover:bg-[#127344] active:scale-95 text-white rounded-full font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Buat Jadwal Baru</span>
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={() => navigate('/admin/event-types')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 active:scale-95 text-slate-700 rounded-full font-bold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Layers size={14} strokeWidth={2.2} className="text-slate-500" />
              <span>Buat Kategori Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3 Summary Stat Cards (Mobile horizontal scroll + Desktop 3-col grid) */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2.5 sm:grid sm:grid-cols-3 sm:gap-4 pb-1 sm:pb-0">
        {/* Total Acara */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 min-w-[125px] flex-1 shrink-0 flex flex-col justify-between sm:flex-row sm:items-center gap-2 sm:gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Mobile Top Row: Icon on left, Badge on right */}
          <div className="flex items-center justify-between sm:hidden w-full">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={14} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
              {activeYearLabel}
            </span>
          </div>

          {/* Desktop Left: Icon + Label & Value */}
          <div className="hidden sm:flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 truncate">Total Acara</p>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {totalAcaraCount} Acara
              </p>
            </div>
          </div>

          {/* Mobile Content: Label + Value */}
          <div className="sm:hidden mt-0.5">
            <p className="text-[11px] font-medium text-slate-400">Total Acara</p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {totalAcaraCount} <span className="text-xs font-medium text-slate-400">Acara</span>
            </p>
          </div>

          {/* Desktop Right Badge */}
          <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 shrink-0">
            Tahun {activeYearLabel}
          </span>
        </div>

        {/* Bulan Ini */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 min-w-[125px] flex-1 shrink-0 flex flex-col justify-between sm:flex-row sm:items-center gap-2 sm:gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Mobile Top Row: Icon on left, Badge on right */}
          <div className="flex items-center justify-between sm:hidden w-full">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={14} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-[#168a53] border border-emerald-200/60">
              Aktif
            </span>
          </div>

          {/* Desktop Left: Icon + Label & Value */}
          <div className="hidden sm:flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 truncate">Bulan Ini ({activeMonthName})</p>
              <p className="text-lg sm:text-xl font-extrabold text-amber-700 tracking-tight leading-snug">
                {bulanIniCount} Acara
              </p>
            </div>
          </div>

          {/* Mobile Content: Label + Value */}
          <div className="sm:hidden mt-0.5">
            <p className="text-[11px] font-medium text-slate-400 truncate">Bulan Ini ({SHORT_MONTHS[activeMonthIndex] || 'Bln'})</p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {bulanIniCount} <span className="text-xs font-medium text-slate-400">Acara</span>
            </p>
          </div>

          {/* Desktop Right Badge */}
          <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
            Aktif
          </span>
        </div>

        {/* Selesai Diabsen / Absen */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 min-w-[125px] flex-1 shrink-0 flex flex-col justify-between sm:flex-row sm:items-center gap-2 sm:gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Mobile Top Row: Icon on left, Badge on right */}
          <div className="flex items-center justify-between sm:hidden w-full">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#168a53] flex items-center justify-center">
              <CheckCircle2 size={14} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-[#168a53] border border-emerald-200/60">
              {selesaiPct}%
            </span>
          </div>

          {/* Desktop Left: Icon + Label & Value */}
          <div className="hidden sm:flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 truncate">Selesai Diabsen</p>
              <p className="text-lg sm:text-xl font-extrabold text-[#168a53] tracking-tight leading-snug">
                {selesaiCount} Acara
              </p>
            </div>
          </div>

          {/* Mobile Content: Label + Value */}
          <div className="sm:hidden mt-0.5">
            <p className="text-[11px] font-medium text-slate-400">Selesai Absen</p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {selesaiCount} <span className="text-xs font-medium text-slate-400">Acara</span>
            </p>
          </div>

          {/* Desktop Right Badge */}
          <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
            {selesaiPct}%
          </span>
        </div>
      </div>

      {/* ── DESKTOP Search & Filters Row (hidden on mobile) ──────────────── */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama acara, kelompok..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-white rounded-full border border-slate-200/90 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168a53]/15 focus:border-[#168a53] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Hapus pencarian"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <PillSelect
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="min-w-[140px]"
            options={monthOptions}
          />
          <PillSelect
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="min-w-[135px]"
            options={yearOptions}
          />
          {activeTab === 'kelompok' && role !== 'absen_kelompok' && (
            <PillSelect
              value={filterKelompok}
              onChange={e => setFilterKelompok(e.target.value)}
              className="min-w-[145px]"
              options={kelompokOptions}
            />
          )}
        </div>
      </div>

      {/* ── MOBILE Search & Filters Row (lg:hidden) ─────────────────────── */}
      <div className="flex lg:hidden flex-col gap-2.5">
        {/* Search bar */}
        <div className="relative w-full">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama acara, kelompok..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-white rounded-full border border-slate-200/90 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168a53]/15 focus:border-[#168a53] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Hapus pencarian"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Row 2: Tabs on Left + Month Filter on Right */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar pb-0.5">
          {role !== 'absen_kelompok' ? (
            <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-full shrink-0">
              <button
                onClick={() => setActiveTab('umum')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'umum'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>Acara Umum</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                  activeTab === 'umum'
                    ? 'bg-emerald-100 text-[#168a53]'
                    : 'bg-slate-200/80 text-slate-500'
                }`}>
                  {umumEvents.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('kelompok')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'kelompok'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>Acara Perkelompok</span>
                {kelompokEvents.length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                    activeTab === 'kelompok'
                      ? 'bg-emerald-100 text-[#168a53]'
                      : 'bg-slate-200/80 text-slate-500'
                  }`}>
                    {kelompokEvents.length}
                  </span>
                )}
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-700">Daftar Jadwal Kelompok</span>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <PillSelect
              value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setCurrentPage(1); }}
              className="w-auto min-w-[125px]"
              options={monthOptions}
            />
            <PillSelect
              value={filterYear}
              onChange={e => { setFilterYear(e.target.value); setCurrentPage(1); }}
              className="w-auto min-w-[120px]"
              options={yearOptions}
            />
            {activeTab === 'kelompok' && role !== 'absen_kelompok' && (
              <PillSelect
                value={filterKelompok}
                onChange={e => { setFilterKelompok(e.target.value); setCurrentPage(1); }}
                className="w-auto min-w-[135px]"
                options={kelompokOptions}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Events Card Container ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

        {/* Top bar: Segmented Tabs + View Toggle (Desktop Only) */}
        <div className="hidden lg:flex px-5 py-3.5 border-b border-slate-100 items-center justify-between gap-3">
          <div>
            {role !== 'absen_kelompok' ? (
              <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-full">
                <button
                  onClick={() => setActiveTab('umum')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'umum'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>Acara Umum</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                    activeTab === 'umum'
                      ? 'bg-emerald-100 text-[#168a53]'
                      : 'bg-slate-200/80 text-slate-500'
                  }`}>
                    {umumEvents.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('kelompok')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'kelompok'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>Acara Perkelompok</span>
                  {kelompokEvents.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                      activeTab === 'kelompok'
                        ? 'bg-emerald-100 text-[#168a53]'
                        : 'bg-slate-200/80 text-slate-500'
                    }`}>
                      {kelompokEvents.length}
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm">Daftar Jadwal Kelompok</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#168a53]">
                  {filteredEvents.length}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Tampilan:</span>
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Tampilan Daftar"
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Tampilan Grid Kalender"
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Calendar size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={30} className="animate-spin text-[#168a53]" />
            <p className="text-slate-400 text-xs font-medium">Memuat jadwal acara...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <CalendarDays size={32} className="text-slate-300" />
            <p className="text-slate-400 font-medium text-sm">
              {search ? 'Acara tidak ditemukan' : 'Belum ada acara dijadwalkan'}
            </p>
            {!search && role !== 'operator_absensi' && (
              <button
                onClick={() => openModal('add')}
                className="mt-1 text-[#168a53] text-xs font-bold hover:underline cursor-pointer"
              >
                + Buat jadwal pertama
              </button>
            )}
          </div>
        ) : (
          <div className={`p-3.5 sm:p-5 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5' : 'space-y-3 sm:space-y-3.5'}`}>
            {paginatedEvents.map((event) => {
              const cats = Array.isArray(event.target_kategori)
                ? event.target_kategori
                : event.target_kategori ? JSON.parse(event.target_kategori) : [];
              const typeName  = getTypeName(event.event_type_id);
              const isAllCats = cats.length >= ageKategoriList.length && ageKategoriList.every(k => cats.includes(k));
              const isActive  = !event.is_closed && !event.is_completed;
              const { dayName, dayNum, monthShort, fullText } = formatCardDate(event.event_date);
              const displayTitle = event.name || typeName || 'ACARA DESA';

              return (
                <div
                  key={event.id}
                  className={`relative flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 pl-4 sm:pl-5 bg-white border rounded-2xl transition-all overflow-hidden ${
                    isActive
                      ? 'border-slate-200/90 hover:border-emerald-300 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Active green left bar */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#168a53]" />
                  )}

                  {/* Left: Calendar Date Box + Event Details */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Calendar Badge */}
                    <div className={`w-12 h-14 sm:w-13 sm:h-15 rounded-xl border bg-white flex flex-col items-center justify-between overflow-hidden shrink-0 shadow-2xs ${
                      isActive ? 'border-emerald-200/80' : 'border-slate-200/80'
                    }`}>
                      <div className={`w-full py-0.5 text-center text-[9px] font-extrabold uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-50 text-[#168a53] border-b border-emerald-100/80 sm:bg-[#168a53] sm:text-white sm:border-0'
                          : 'bg-slate-100 text-slate-600 sm:bg-slate-700 sm:text-white'
                      }`}>
                        {dayName}
                      </div>
                      <span className="text-base sm:text-lg font-extrabold text-slate-800 leading-none">
                        {dayNum}
                      </span>
                      <span className={`text-[8px] sm:text-[9px] font-bold uppercase pb-1 ${
                        isActive ? 'text-[#168a53] sm:text-slate-400' : 'text-slate-400'
                      }`}>
                        {monthShort}
                      </span>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                      {/* Title & Status Row */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-md text-[11px] sm:text-xs font-extrabold uppercase tracking-wide border ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                            : 'bg-slate-100 text-slate-700 border-slate-200/60'
                        }`}>
                          <Layers size={11} className={isActive ? 'text-blue-600' : 'text-slate-500'} />
                          <span className="truncate max-w-[200px] sm:max-w-none">{displayTitle}</span>
                        </span>

                        {event.kelompok && (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase border bg-teal-50 text-teal-700 border-teal-200 px-2 py-0.5 rounded-md">
                            Kelompok {event.kelompok}
                          </span>
                        )}

                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-[#168a53] border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#168a53]" />
                            Sedang Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50/70 text-[#168a53] border border-emerald-200/50">
                            <Check size={11} strokeWidth={2.5} />
                            Selesai Diabsen
                          </span>
                        )}
                      </div>

                      {/* Date & Time Row */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 sm:gap-1.5 text-slate-600 font-medium sm:bg-slate-50 sm:px-2.5 sm:py-1 sm:rounded-lg sm:border sm:border-slate-200/60">
                          <Calendar size={12} className="text-slate-400 shrink-0" />
                          <span>{fullText}</span>
                        </span>
                        <span className={`inline-flex items-center gap-1 sm:gap-1.5 text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border ${
                          isActive
                            ? 'text-amber-800 bg-amber-50 border-amber-200/60'
                            : 'text-slate-600 sm:bg-slate-50 sm:border-slate-200/60 border-transparent'
                        }`}>
                          <Clock size={12} className={isActive ? 'text-amber-600' : 'text-slate-400'} />
                          <span>{event.start_time?.substring(0, 5)}{event.end_time ? ` - ${event.end_time.substring(0, 5)}` : ''} WIB</span>
                        </span>
                      </div>

                      {/* Target Kategori Chips */}
                      {cats.length > 0 && (
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-0.5">
                          {isAllCats ? (
                            <KategoriChip label="Semua Umur" />
                          ) : cats.length > 4 ? (
                            <>
                              {cats.slice(0, 3).map(k => <KategoriChip key={k} label={k} />)}
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border bg-slate-100 text-slate-500 border-slate-200">
                                +{cats.length - 3}
                              </span>
                            </>
                          ) : (
                            cats.map(k => <KategoriChip key={k} label={k} />)
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── MOBILE ACTIONS (lg:hidden) ── */}
                  <div className="flex lg:hidden items-center gap-2 pt-2.5 border-t border-slate-100">
                    {isActive ? (
                      <>
                        <button
                          onClick={() => navigate(`/admin/attendance/${event.id}`)}
                          className="flex-1 py-2 px-3 bg-[#168a53] hover:bg-[#127344] text-white rounded-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Users size={13} />
                          <span>Absen</span>
                        </button>
                        {['admin', 'absen_kelompok'].includes(role) && (
                          <button
                            onClick={() => handleToggleStatus(event)}
                            className="py-2 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full font-bold text-xs flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-colors"
                          >
                            <Lock size={13} className="text-slate-500" />
                            <span>Tutup</span>
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/admin/events/${event.id}/summary`)}
                          className="py-2 px-3.5 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/60 text-blue-600 rounded-full font-bold text-xs flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-colors"
                        >
                          <BookOpen size={13} />
                          <span>Rekapan</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {['admin', 'absen_kelompok'].includes(role) && (
                          <button
                            onClick={() => handleToggleStatus(event)}
                            className="py-2 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                          >
                            <Unlock size={13} className="text-slate-500" />
                            <span>Buka Absen</span>
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/admin/events/${event.id}/summary`)}
                          className="py-2 px-4 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/60 text-blue-600 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                        >
                          <BookOpen size={13} />
                          <span>Rekapan</span>
                        </button>
                      </>
                    )}

                    {['admin', 'absen_kelompok'].includes(role) && (
                      <div className="relative ml-auto">
                        <button
                          type="button"
                          onClick={() => setMobileMenuId(mobileMenuId === event.id ? null : event.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Aksi Lainnya"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {mobileMenuId === event.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMobileMenuId(null)} />
                            <div className="absolute right-0 bottom-full mb-1 z-50 w-36 bg-white border border-slate-200/90 rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
                              {role === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMobileMenuId(null);
                                    navigate(`/admin/notulen?eventId=${event.id}`);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <FileText size={13} className="text-[#168a53]" />
                                  <span>Notulen</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setMobileMenuId(null);
                                  openModal('edit', event);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Pencil size={13} className="text-slate-400" />
                                <span>Edit Acara</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMobileMenuId(null);
                                  setDeleteInput('');
                                  setConfirm({
                                    open: true,
                                    title: 'Hapus Jadwal Ini?',
                                    message: `Jadwal "${event.name}" akan dihapus permanen. Data absensi terkait juga ikut terhapus.`,
                                    action: () => execDelete(event),
                                  });
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={13} className="text-red-500" />
                                <span>Hapus Acara</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── DESKTOP ACTIONS (hidden lg:flex) ── */}
                  <div className="hidden lg:flex flex-wrap items-center gap-2 shrink-0 justify-end">
                    <button
                      onClick={() => navigate(`/admin/attendance/${event.id}`)}
                      disabled={event.is_closed}
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        event.is_closed
                          ? 'bg-slate-50 text-slate-300 border border-slate-200/60 cursor-not-allowed'
                          : 'bg-[#168a53] hover:bg-[#127344] text-white shadow-xs cursor-pointer'
                      }`}
                    >
                      <Users size={13} />
                      <span>Absen</span>
                    </button>

                    {['admin', 'absen_kelompok'].includes(role) && (
                      <>
                        <button
                          onClick={() => handleToggleStatus(event)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                          title={event.is_closed ? 'Buka kembali absen acara ini' : 'Tutup absen acara ini'}
                        >
                          {event.is_closed ? <Unlock size={13} className="text-slate-500" /> : <Lock size={13} className="text-slate-500" />}
                          <span>{event.is_closed ? 'Buka Absen' : 'Tutup'}</span>
                        </button>

                        <button
                          onClick={() => navigate(`/admin/events/${event.id}/summary`)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50/80 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs font-bold transition-all cursor-pointer"
                        >
                          <BookOpen size={13} />
                          <span>Rekapan</span>
                        </button>

                        {role === 'admin' && (
                          <button
                            onClick={() => navigate(`/admin/notulen?eventId=${event.id}`)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50/80 hover:bg-emerald-100 text-[#168a53] border border-emerald-200/60 text-xs font-bold transition-all cursor-pointer"
                            title="Notulen Musyawarah"
                          >
                            <FileText size={13} />
                            <span>Notulen</span>
                          </button>
                        )}

                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            onClick={() => openModal('edit', event)}
                            title="Edit"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteInput('');
                              setConfirm({
                                open: true,
                                title: 'Hapus Jadwal Ini?',
                                message: `Jadwal "${event.name}" akan dihapus permanen. Data absensi terkait juga ikut terhapus.`,
                                action: () => execDelete(event),
                              });
                            }}
                            title="Hapus"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && filteredEvents.length > 0 && (
          <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="hidden sm:inline">Baris per halaman:</span>
              <span className="sm:hidden">Baris:</span>
              <select
                value={itemsPerPage}
                onChange={e => setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#168a53] cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value="all">Semua</option>
              </select>
              <span className="text-slate-400 ml-1">
                {startIdx + 1}-{Math.min(startIdx + effectivePerPage, filteredEvents.length)} dari {filteredEvents.length} acara
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-slate-400">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      safePage === page
                        ? 'bg-[#168a53] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAL: Confirm / Delete ════════════════════════════════════════════ */}
      <Modal open={confirm.open} onClose={() => { setConfirm(c => ({ ...c, open: false })); setDeleteInput(''); }}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <HelpCircle size={28} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{confirm.title}</h3>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed">{confirm.message}</p>

          <div className="text-left mb-7">
            <label className="text-xs font-bold text-slate-500 mb-2 block">
              Ketik <span className="text-red-500 select-all font-mono bg-red-50 px-1 rounded">hapus acara</span> untuk konfirmasi
            </label>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-colors"
              placeholder="hapus acara"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setConfirm(c => ({ ...c, open: false })); setDeleteInput(''); }}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => {
                confirm.action();
                setDeleteInput('');
              }}
              disabled={deleteInput.toLowerCase() !== 'hapus acara'}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-colors"
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
                i < modalStep   ? 'bg-[#168a53]' :
                i === modalStep ? 'bg-emerald-300' :
                'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* ─── Step 0: Template ─── */}
          {modalStep === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Pilih template untuk mengisi otomatis nama, waktu, dan peserta.
              </p>

              <div className="space-y-1.5" ref={typeDropRef}>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Template Acara
                </label>
                <button
                  type="button"
                  onClick={() => setIsTypeOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-[#168a53] focus:outline-none focus:ring-2 focus:ring-[#168a53]/20 transition-colors"
                >
                  <span className="flex items-center gap-2 text-slate-600">
                    <Layers size={14} className="text-blue-400" />
                    {formData.event_type_id ? getTypeName(formData.event_type_id) : 'Pilih template acara...'}
                  </span>
                  <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${isTypeOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTypeOpen && (
                  <div className="border border-slate-200 rounded-xl shadow-lg overflow-hidden bg-white">
                    {eventTypes.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelectTemplate(type)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between ${
                          formData.event_type_id === type.id
                            ? 'bg-emerald-50 text-[#168a53]'
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
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 space-y-1">
                  <p className="text-xs font-bold text-[#168a53] uppercase tracking-wider">Template terpilih - data terisi otomatis</p>
                  <p className="text-sm text-[#168a53]">Nama: <span className="font-semibold">{formData.name}</span></p>
                  <p className="text-sm text-[#168a53]">Batas: <span className="font-semibold">{formData.start_time} WIB</span></p>
                  <p className="text-sm text-[#168a53]">Peserta: <span className="font-semibold">{formData.target_kategori.length} kategori</span></p>
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
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#168a53]/20 focus:border-[#168a53] transition-colors cursor-pointer [color-scheme:light]"
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168a53]/20 focus:border-[#168a53] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Batas Jam Hadir <span className="text-red-400">*</span>
                </label>
                <TimeSelect
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
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
                  Pilih kategori / jenjang yang <span className="font-semibold text-slate-700">wajib hadir</span>.
                </p>
                <span className="text-sm font-bold text-[#168a53]">{formData.target_kategori.length} dipilih</span>
              </div>

              {/* Quick-select */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="flex-1 py-2 text-xs font-semibold text-[#168a53] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  Hapus Semua
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
                          allOn  ? 'bg-emerald-50 text-[#168a53]' :
                          someOn ? 'bg-blue-50 text-blue-700'     :
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
                                  ? 'bg-[#168a53] border-[#168a53] text-white'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                              }`}
                            >
                              <input type="checkbox" className="hidden" checked={on} onChange={() => handleCheckbox(k)} />
                              {on && <Check size={12} strokeWidth={2.5} />}
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
                  Pilih minimal satu kategori peserta.
                </p>
              )}

              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      name="allow_other_participants"
                      checked={formData.allow_other_participants}
                      onChange={(e) => setFormData(prev => ({ ...prev, allow_other_participants: e.target.checked }))}
                      className="w-4 h-4 text-[#168a53] rounded border-slate-300 focus:ring-[#168a53]"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Izinkan Tambah Peserta Lain (Luar Target)</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Centang ini jika acara ini dihadiri perwakilan/tamu di luar kategori wajib di atas. Anda akan bisa mengabsen nama siapapun saat acara berlangsung.
                    </p>
                  </div>
                </label>
              </div>
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
              Kembali
            </button>
          )}

          {modalStep < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              disabled={(modalStep === 0 && !formData.event_type_id) || (modalStep === 1 && !step2Valid)}
              onClick={() => setModalStep(s => s + 1)}
              className="flex-1 py-3 rounded-xl bg-[#168a53] hover:bg-[#127344] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-colors active:scale-95"
            >
              Lanjut
            </button>
          ) : (
            <button
              type="button"
              disabled={!step3Valid || submitLoading}
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl bg-[#168a53] hover:bg-[#127344] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              {submitLoading ? (
                <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
              ) : modalMode === 'add' ? (
                'Jadwalkan Acara'
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}
