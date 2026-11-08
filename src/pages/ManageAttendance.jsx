import { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Clock, ChevronLeft, CheckCircle, XCircle, AlertCircle, Users, Search,
  CalendarDays, Filter, Trash2, HelpCircle, MapPin,
  X, UserCheck, UserX, AlertTriangle, Loader2, QrCode, Plus, Check, ListChecks, History
} from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

// ─── Constants & Color Palettes ───────────────────────────────────────────────

const KELOMPOK_LIST = ['Semua', 'Slogo', 'Gabugan', 'Jekani', 'Gawan', 'Pengkruk', 'Sidomulyo', 'Karangasem'];
const JENJANG_LIST  = [
  'Semua', 'MT', 'PAUD', 'TK', '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD',
  '1 SMP', '2 SMP', '3 SMP', '1 SMA/SMK', '2 SMA/SMK', '3 SMA/SMK',
  'USMAN', 'PENGURUS USMAN', 'PENGURUS MUDA MUDI', 'KETUA/WAKIL KELOMPOK'
];

const AVATAR_PALETTE_MALE = [
  'bg-blue-100 text-blue-600',
  'bg-sky-100 text-sky-600',
  'bg-teal-100 text-teal-600',
  'bg-emerald-100 text-emerald-600',
  'bg-indigo-100 text-indigo-600',
  'bg-cyan-100 text-cyan-600',
];

const AVATAR_PALETTE_FEMALE = [
  'bg-pink-100 text-pink-600',
  'bg-purple-100 text-purple-600',
  'bg-rose-100 text-rose-600',
  'bg-fuchsia-100 text-fuchsia-600',
];

function getAvatarColor(name = '', gender = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const isFemale = gender?.toUpperCase() === 'P';
  const palette = isFemale ? AVATAR_PALETTE_FEMALE : AVATAR_PALETTE_MALE;
  return palette[Math.abs(hash) % palette.length];
}

function UserAvatar({ name, gender, size = 'md' }) {
  const colorClass = getAvatarColor(name, gender);
  const sizeClass = size === 'lg'
    ? 'w-10 h-10 sm:w-11 sm:h-11 text-sm sm:text-base'
    : size === 'sm'
      ? 'w-8 h-8 text-xs'
      : 'w-8 h-8 sm:w-9 sm:h-9 text-xs';
  return (
    <div className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-bold shrink-0 select-none shadow-2xs`}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

function Modal({ open, onClose, children, maxWidth = 'max-w-sm' }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full ${maxWidth} animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ManageAttendance() {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  const [event, setEvent]                 = useState(null);
  const [generusList, setGenerusList]     = useState([]);
  const [attendedList, setAttendedList]   = useState([]);
  const [allGenerusList, setAllGenerusList] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [currentTime, setCurrentTime]     = useState(new Date());

  // Filters & Tabs
  const [search, setSearch]                 = useState('');
  const [filterKelompok, setFilterKelompok] = useState('Semua');
  const [filterJenjang, setFilterJenjang]   = useState('Semua');
  const [activeMobileTab, setActiveMobileTab] = useState('panggilan'); // 'panggilan' | 'riwayat'
  const searchInputRef = useRef(null);

  // Modals & Scanner
  const [confirm, setConfirm]         = useState({ open: false, title: '', message: '', action: null, type: 'danger', loading: false });
  const [showScanner, setShowScanner] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualSearch, setManualSearch]   = useState('');
  const [scanStatus, setScanStatus]   = useState(null);
  const [scanMessage, setScanMessage] = useState('');

  // Refs for scanner callbacks
  const attendedRef    = useRef([]);
  const generusRef     = useRef([]);
  const allGenerusRef  = useRef([]);

  useEffect(() => { attendedRef.current   = attendedList; },    [attendedList]);
  useEffect(() => { generusRef.current    = generusList; },     [generusList]);
  useEffect(() => { allGenerusRef.current = allGenerusList; },  [allGenerusList]);

  // Live ticking clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventRes, generusRes, summaryRes] = await Promise.all([
        api.get('/admin/events'),
        api.get('/admin/generus'),
        api.get(`/admin/events/${eventId}/summary`),
      ]);

      const currentEvent = eventRes.data.data.find(e => e.id.toString() === eventId);
      setEvent(currentEvent);
      if (currentEvent?.kelompok) setFilterKelompok('Semua');

      let targetKategori = [];
      if (currentEvent?.target_kategori) {
        targetKategori = Array.isArray(currentEvent.target_kategori)
          ? currentEvent.target_kategori
          : (typeof currentEvent.target_kategori === 'string' && currentEvent.target_kategori.startsWith('[')
              ? JSON.parse(currentEvent.target_kategori)
              : [currentEvent.target_kategori]);
      }

      const existing    = summaryRes.data.attendances || [];
      const attendedIds = existing.map(a => a.generus_id);

      const formatted = existing.map(a => ({
        ...a.generus,
        status_absen: a.status,
        is_late: a.is_late,
        time_arrived: a.time_arrived,
      }));
      setAttendedList(formatted);

      const allG = generusRes.data.data || [];
      setAllGenerusList(allG);

      const filtered = allG.filter(g => {
        if (currentEvent?.kelompok && (g.kelompok || '').toLowerCase() !== currentEvent?.kelompok.toLowerCase()) return false;
        const j = (g.jenjang || '').toLowerCase();
        return (
          (targetKategori.length === 0 || targetKategori.some(t => {
            const tLower = t.toLowerCase();
            if (tLower === 'pengurus' || tLower === 'pengurus usman') return !!g.is_pengurus;
            if (tLower === 'pengurus muda mudi') return !!g.is_pengurus_muda_mudi;
            if (tLower === 'ketua/wakil kelompok') return !!g.is_ketua_wakil_kelompok;
            return j.includes(tLower);
          })) &&
          !attendedIds.includes(g.id) &&
          ['aktif', 'pasif'].includes(g.status?.toLowerCase())
        );
      });
      setGenerusList(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const isLate = (batas, customNow = null) => {
    if (!batas || !event?.event_date) return false;
    const now = customNow || new Date();
    const eventDateTime = new Date(event.event_date);
    const [h, m] = batas.split(':').map(Number);
    eventDateTime.setHours(h, m, 59, 999);
    return now > eventDateTime;
  };

  const handleAbsen = async (generus, status) => {
    const now = new Date();
    const late = status === 'hadir' ? isLate(event?.start_time, now) : false;
    const timeStr = status === 'hadir'
      ? now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : null;
    const record = { ...generus, status_absen: status, is_late: late, time_arrived: timeStr || '-' };
    setGenerusList(prev => prev.filter(g => g.id !== generus.id));
    setAttendedList(prev => [record, ...prev]);
    try {
      await api.post('/admin/attendance', {
        event_id: event.id,
        generus_id: generus.id,
        status,
        is_late: late,
        time_arrived: timeStr,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const execHadirSemua = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    const now = new Date();
    const late = isLate(event?.start_time, now);
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    try {
      await api.post('/admin/attendance/bulk', {
        attendances: displayed.map(g => ({
          event_id: event.id,
          generus_id: g.id,
          status: 'hadir',
          is_late: late,
          time_arrived: timeStr,
        })),
      });
      const records = displayed.map(g => ({ ...g, status_absen: 'hadir', is_late: late, time_arrived: timeStr }));
      const ids     = displayed.map(g => g.id);
      setGenerusList(prev => prev.filter(g => !ids.includes(g.id)));
      setAttendedList(prev => [...records, ...prev]);
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menyimpan data absensi massal.');
      console.error(e);
    } finally {
      setConfirm(c => ({ ...c, open: false, loading: false }));
    }
  };

  const execAlpaSemua = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    try {
      await api.post('/admin/attendance/bulk', {
        attendances: displayed.map(g => ({
          event_id: event.id,
          generus_id: g.id,
          status: 'alpa',
          is_late: false,
          time_arrived: null,
        })),
      });
      const records = displayed.map(g => ({ ...g, status_absen: 'alpa', is_late: false, time_arrived: '-' }));
      const ids     = displayed.map(g => g.id);
      setGenerusList(prev => prev.filter(g => !ids.includes(g.id)));
      setAttendedList(prev => [...records, ...prev]);
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menyimpan data absensi massal.');
      console.error(e);
    } finally {
      setConfirm(c => ({ ...c, open: false, loading: false }));
    }
  };

  const execHapus = async (item) => {
    setAttendedList(prev => prev.filter(g => g.id !== item.id));
    setGenerusList(prev => {
      if (prev.some(g => g.id === item.id)) return prev;
      const gData = { ...item };
      delete gData.status_absen;
      delete gData.is_late;
      delete gData.time_arrived;
      return [...prev, gData];
    });
    setConfirm(c => ({ ...c, open: false }));
    try {
      await api.delete(`/admin/attendance/${event.id}/${item.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleScan = useCallback((result) => {
    if (!result?.[0]) return;
    const raw = result[0].rawValue;
    if (!raw.startsWith('SLOGO-')) return;

    const payload = raw.replace('SLOGO-', '');
    let target = null;

    if (payload.startsWith('GEN-') && !isNaN(payload.replace('GEN-', ''))) {
      const id = parseInt(payload.replace('GEN-', ''));
      target = generusRef.current.find(g => g.id === id) || allGenerusRef.current.find(g => g.id === id);
    }

    if (!target) {
      target = generusRef.current.find(g => g.kode_unik === payload) || allGenerusRef.current.find(g => g.kode_unik === payload);
    }

    if (!target) {
      setScanStatus('error');
      setScanMessage('QR tidak dikenali');
      setTimeout(() => setScanStatus(null), 1500);
      return;
    }

    if (attendedRef.current.some(a => a.id === target.id)) {
      setScanStatus('already');
      setScanMessage('Sudah diabsen!');
      setTimeout(() => setScanStatus(null), 1200);
      return;
    }

    const isTarget = generusRef.current.some(g => g.id === target.id);
    const allowOutside = !!event?.allow_other_participants;

    if (!isTarget && !allowOutside) {
      setScanStatus('error');
      setScanMessage(`${target.nama_lengkap} bukan target acara`);
      setTimeout(() => setScanStatus(null), 1500);
      return;
    }

    handleAbsen(target, 'hadir');
    setScanStatus('success');
    setScanMessage(target.nama_lengkap);
    setTimeout(() => setScanStatus(null), 1200);
  }, [event]);

  // ─── Filtered Data ──────────────────────────────────────────────────────────

  const displayed = generusList.filter(g => {
    const q = search.toLowerCase();
    const matchName = (g.nama_lengkap || '').toLowerCase().includes(q);
    const matchKelompok = filterKelompok === 'Semua' || (g.kelompok || '').toLowerCase() === filterKelompok.toLowerCase();
    let matchJenjang = true;
    if (filterJenjang !== 'Semua') {
      if (filterJenjang === 'PENGURUS USMAN') matchJenjang = !!g.is_pengurus;
      else if (filterJenjang === 'PENGURUS MUDA MUDI') matchJenjang = !!g.is_pengurus_muda_mudi;
      else if (filterJenjang === 'KETUA/WAKIL KELOMPOK') matchJenjang = !!g.is_ketua_wakil_kelompok;
      else matchJenjang = (g.jenjang || '').toLowerCase() === filterJenjang.toLowerCase();
    }
    return matchName && matchKelompok && matchJenjang;
  });

  const currentlyLate = isLate(event?.start_time);
  const totalHadir    = attendedList.filter(a => a.status_absen === 'hadir').length;
  const totalIzin     = attendedList.filter(a => a.status_absen === 'izin').length;
  const totalAlpa     = attendedList.filter(a => a.status_absen === 'alpa').length;
  const totalTarget   = attendedList.length + generusList.length;

  const targetKategori = Array.isArray(event?.target_kategori)
    ? event.target_kategori
    : (typeof event?.target_kategori === 'string' && event.target_kategori.startsWith('[')
        ? JSON.parse(event.target_kategori)
        : (event?.target_kategori ? [event.target_kategori] : []));

  const displayCategories = targetKategori.length > 0 ? targetKategori : ['SEMUA UMUR'];

  // ─── Guards ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 size={32} className="animate-spin text-teal-600" />
      <p className="text-slate-500 text-sm font-medium">Memuat sistem absensi...</p>
    </div>
  );

  if (!event) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertTriangle size={32} className="text-red-400" />
      <p className="text-slate-500 font-medium">Acara tidak ditemukan.</p>
    </div>
  );

  if (event.is_closed) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertTriangle size={32} className="text-amber-500" />
      <p className="text-slate-700 font-semibold">Acara ini sudah ditutup.</p>
      <button
        onClick={() => navigate('/admin/events')}
        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
      >
        Kembali ke Daftar Acara
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div className="py-2 space-y-4 sm:space-y-6">

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start sm:items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/events')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shrink-0 cursor-pointer mt-0.5 sm:mt-0"
          title="Kembali"
        >
          <ChevronLeft className="w-[18px] h-[18px] sm:w-5 sm:h-5" strokeWidth={2.4} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {event.name}
            </h1>
            {displayCategories.map(cat => (
              <span
                key={cat}
                className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] uppercase tracking-wider"
              >
                {cat}
              </span>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal line-clamp-2 sm:line-clamp-none">
            {event.description || (event.kelompok ? `Pencatatan presensi kehadiran gotong royong warga dan remaja masjid (${event.kelompok})` : 'Pencatatan presensi kehadiran gotong royong warga dan remaja masjid')}
          </p>
        </div>
      </div>

      {/* ── Top 3 Info Cards (Mobile Compact Responsive Grid) ───────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* Card 1: Tanggal Acara */}
        <div className="col-span-2 md:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center shrink-0">
            <CalendarDays className="w-[18px] h-[18px] sm:w-5 sm:h-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TANGGAL ACARA</p>
            <p className="text-xs sm:text-sm md:text-base font-bold text-slate-800 leading-tight truncate mt-0.5">
              {new Date(event.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Card 2: Jam Sekarang */}
        <div className="col-span-1 bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">JAM SEKARANG</p>
            <p className="text-lg sm:text-xl md:text-2xl font-black font-sans text-slate-800 tabular-nums leading-tight tracking-tight mt-0.5 truncate">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.')}
            </p>
          </div>
          <div className="hidden sm:flex w-9 h-9 rounded-full bg-slate-50 border border-slate-100 items-center justify-center text-slate-400 shrink-0">
            <Clock size={16} strokeWidth={2} />
          </div>
        </div>

        {/* Card 3: Batas Hadir */}
        <div className="col-span-1 bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${currentlyLate ? 'text-rose-500' : 'text-emerald-600'}`}>
              BATAS HADIR
            </p>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 mt-0.5">
              <span className={`text-lg sm:text-xl md:text-2xl font-black tabular-nums leading-tight ${currentlyLate ? 'text-rose-600' : 'text-emerald-700'}`}>
                {event.start_time?.substring(0, 5) || '--:--'}
              </span>
              <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${currentlyLate ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                {currentlyLate ? 'Lewat' : 'Dibuka'}
              </span>
            </div>
          </div>
          <div className={`hidden sm:flex w-9 h-9 rounded-full items-center justify-center shrink-0 ${currentlyLate ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
            {currentlyLate ? <AlertTriangle size={18} strokeWidth={2} /> : <CheckCircle size={18} strokeWidth={2} />}
          </div>
        </div>
      </div>

      {/* ── Stats 4 Cards (Responsive 2x2 on Mobile, 4x1 on Desktop) ────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* TOTAL TARGET */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL TARGET</span>
            <Users size={15} className="text-slate-400" />
          </div>
          <div className="mt-1.5 sm:mt-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight tabular-nums leading-none">{totalTarget}</p>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 font-normal truncate">Target seluruh peserta</p>
          </div>
        </div>

        {/* HADIR */}
        <div className="bg-[#f0fdf4]/60 border border-emerald-100/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 uppercase tracking-wider">HADIR</span>
            <UserCheck size={15} className="text-emerald-500" />
          </div>
          <div className="mt-1.5 sm:mt-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight tabular-nums leading-none">{totalHadir}</p>
            <p className="text-[11px] sm:text-xs text-emerald-600/80 mt-1 font-normal truncate">
              {totalTarget > 0 ? ((totalHadir / totalTarget) * 100).toFixed(1) : 0}% terverifikasi
            </p>
          </div>
        </div>

        {/* IZIN */}
        <div className="bg-[#fffbeb]/60 border border-amber-100/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-500 uppercase tracking-wider">IZIN</span>
            <AlertCircle size={15} className="text-amber-500" />
          </div>
          <div className="mt-1.5 sm:mt-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-500 tracking-tight tabular-nums leading-none">{totalIzin}</p>
            <p className="text-[11px] sm:text-xs text-amber-600/80 mt-1 font-normal truncate">Konfirmasi via panitia</p>
          </div>
        </div>

        {/* ALPA */}
        <div className="bg-[#fff1f2]/60 border border-rose-100/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-500 uppercase tracking-wider">ALPA</span>
            <UserX size={15} className="text-rose-400" />
          </div>
          <div className="mt-1.5 sm:mt-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-500 tracking-tight tabular-nums leading-none">{totalAlpa}</p>
            <p className="text-[11px] sm:text-xs text-rose-400/90 mt-1 font-normal truncate">Tidak ada keterangan</p>
          </div>
        </div>
      </div>

      {/* ── Progress Absensi ────────────────────────────────────────────────── */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-bold text-slate-800">Progress Absensi</span>
          <span className="font-bold text-[#0d9488] tabular-nums">
            {attendedList.length} / {totalTarget} selesai ({totalTarget > 0 ? ((attendedList.length / totalTarget) * 100).toFixed(1) : 0}%)
          </span>
        </div>
        <div className="h-2 sm:h-2.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0d9488] rounded-full transition-all duration-500"
            style={{ width: `${totalTarget > 0 ? (attendedList.length / totalTarget) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* ── MOBILE TAB SWITCHER (Hanya tampil di Mobile untuk navigasi instan) ── */}
      <div className="lg:hidden flex bg-slate-200/70 p-1 rounded-2xl select-none">
        <button
          type="button"
          onClick={() => setActiveMobileTab('panggilan')}
          className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMobileTab === 'panggilan'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListChecks size={15} className={activeMobileTab === 'panggilan' ? 'text-teal-600' : 'text-slate-400'} />
          <span>Daftar Panggilan</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeMobileTab === 'panggilan' ? 'bg-blue-100 text-blue-700' : 'bg-slate-300 text-slate-600'
          }`}>
            {displayed.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab('riwayat')}
          className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMobileTab === 'riwayat'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History size={15} className={activeMobileTab === 'riwayat' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>Riwayat Absensi</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeMobileTab === 'riwayat' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-300 text-slate-600'
          }`}>
            {attendedList.length}
          </span>
        </button>
      </div>

      {/* ── Main 2 Column Content (Desktop Side-by-Side, Mobile Tab Controlled) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ── LEFT COLUMN: Filter & Daftar Panggilan (7/12) ────────────────── */}
        <div className={`lg:col-span-7 xl:col-span-7 space-y-3.5 sm:space-y-4 ${activeMobileTab !== 'panggilan' ? 'hidden lg:block' : ''}`}>

          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari nama peserta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 sm:pl-11 pr-10 sm:pr-14 py-2.5 sm:py-3 bg-white rounded-2xl border border-slate-200/80 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => searchInputRef.current?.focus()}
                className="hidden sm:block absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-400 select-none hover:bg-slate-100 cursor-pointer"
              >
                ⌘K
              </button>
            )}
          </div>

          {/* Filter 1: KELOMPOK (Horizontal scroll on mobile, wrap on desktop) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f766e] uppercase tracking-wider mb-2.5 sm:mb-3">
              <MapPin size={14} className="text-[#0f766e]" />
              <span>KELOMPOK</span>
            </div>
            <div className="flex sm:flex-wrap gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar -mx-0.5 px-0.5">
              {KELOMPOK_LIST.map((k) => {
                const active = filterKelompok === k;
                const count = k === 'Semua'
                  ? generusList.length
                  : generusList.filter(g => (g.kelompok || '').toLowerCase() === k.toLowerCase()).length;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFilterKelompok(k)}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#0f766e] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span>{k}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        active ? 'bg-[#115e59] text-white' : 'text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter 2: JENJANG (Horizontal scroll on mobile, wrap on desktop) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f766e] uppercase tracking-wider mb-2.5 sm:mb-3">
              <Filter size={14} className="text-[#0f766e]" />
              <span>JENJANG</span>
            </div>
            <div className="flex sm:flex-wrap gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar -mx-0.5 px-0.5">
              {JENJANG_LIST.map((j) => {
                const active = filterJenjang === j;
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setFilterJenjang(j)}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#0f766e] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {j}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daftar Panggilan Card Section */}
          <div className="space-y-3 pt-1">
            {/* Header row + Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">Daftar Panggilan</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                  {displayed.length} orang
                </span>
              </div>

              {/* Action buttons (Scrollable on mobile) */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar -mx-1 px-1">
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 sm:w-[15px] sm:h-[15px]" strokeWidth={2.2} />
                  <span>Scan QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualAdd(true)}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#0d9488] hover:bg-teal-700 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-[15px] sm:h-[15px]" strokeWidth={2.2} />
                  <span>Tambah Manual</span>
                </button>

                {displayed.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirm({
                          open: true,
                          title: 'Hadirkan Semua?',
                          message: `Tandai HADIR untuk ${displayed.length} peserta yang tampil?`,
                          type: 'success',
                          action: execHadirSemua,
                        })
                      }
                      className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 sm:w-[15px] sm:h-[15px]" strokeWidth={2.5} />
                      <span>Hadir Semua</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirm({
                          open: true,
                          title: 'Alpakan Sisa?',
                          message: `Tandai ALPA untuk sisa ${displayed.length} peserta?`,
                          type: 'danger',
                          action: execAlpaSemua,
                        })
                      }
                      className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#e11d48] hover:bg-rose-700 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 sm:w-[15px] sm:h-[15px]" strokeWidth={2.5} />
                      <span>Alpa Semua</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Calling list cards */}
            <div className="space-y-2 sm:space-y-2.5">
              {displayed.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl py-10 sm:py-12 px-4 text-center shadow-2xs">
                  <CheckCircle className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-500 mx-auto mb-2" />
                  <p className="text-slate-800 font-bold text-xs sm:text-sm">Semua sudah diabsen</p>
                  <p className="text-slate-400 text-[11px] sm:text-xs mt-0.5">Tidak ada peserta yang tersisa dalam panggilan</p>
                </div>
              ) : (
                displayed.map((g) => (
                  <div
                    key={g.id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-2.5 sm:gap-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      <UserAvatar name={g.nama_lengkap} gender={g.jenis_kelamin} size="lg" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-snug">
                          {g.nama_lengkap}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                          <span>{g.kelompok || '—'}</span>
                          <span>•</span>
                          <span>{g.jenjang || '—'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAbsen(g, 'hadir')}
                        className="px-2.5 sm:px-4 py-1.5 rounded-xl bg-[#f0fdf4] hover:bg-[#059669] text-[#059669] hover:text-white border border-[#bbf7d0] hover:border-[#059669] text-[11px] sm:text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer min-h-[30px] flex items-center justify-center"
                      >
                        Hadir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAbsen(g, 'izin')}
                        className="px-2.5 sm:px-4 py-1.5 rounded-xl bg-[#fffbeb] hover:bg-[#d97706] text-[#d97706] hover:text-white border border-[#fde68a] hover:border-[#d97706] text-[11px] sm:text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer min-h-[30px] flex items-center justify-center"
                      >
                        Izin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAbsen(g, 'alpa')}
                        className="px-2.5 sm:px-4 py-1.5 rounded-xl bg-[#fff1f2] hover:bg-[#e11d48] text-[#e11d48] hover:text-white border border-[#fecdd3] hover:border-[#e11d48] text-[11px] sm:text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer min-h-[30px] flex items-center justify-center"
                      >
                        Alpa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN: Riwayat Absensi (5/12) ─────────────────────────── */}
        <div className={`lg:col-span-5 xl:col-span-5 ${activeMobileTab !== 'riwayat' ? 'hidden lg:block' : ''}`}>
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden lg:sticky lg:top-4">
            {/* Header */}
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Riwayat Absensi</h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {attendedList.length} selesai
              </span>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 max-h-[65vh] lg:max-h-[calc(100vh-270px)] overflow-y-auto px-4 sm:px-5">
              {attendedList.length === 0 ? (
                <div className="py-14 sm:py-16 text-center">
                  <Users size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium text-xs sm:text-sm">Belum ada absensi</p>
                  <p className="text-slate-400 text-[11px] sm:text-xs mt-0.5">Peserta yang diabsen akan muncul di sini</p>
                </div>
              ) : (
                attendedList.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 sm:py-3.5 flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <UserAvatar name={item.nama_lengkap} gender={item.jenis_kelamin} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                          {item.nama_lengkap}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5">
                          {item.kelompok || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        {item.status_absen === 'hadir' && (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#f0fdf4] text-[#059669] border border-[#bbf7d0]/60">
                            HADIR
                          </span>
                        )}
                        {item.status_absen === 'izin' && (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#fffbeb] text-[#d97706] border border-[#fde68a]/60">
                            IZIN
                          </span>
                        )}
                        {item.status_absen === 'alpa' && (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3]/60">
                            ALPA
                          </span>
                        )}

                        {item.status_absen === 'hadir' && (
                          <p className="text-[10px] text-emerald-600 font-medium text-right mt-0.5">
                            {item.time_arrived?.replace(':', '.') || '-'}{Number(item.is_late) === 1 ? ' • Telat' : ''}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setConfirm({
                            open: true,
                            title: 'Hapus Absensi?',
                            message: `Hapus absensi ${item.nama_lengkap}? Dia akan kembali ke daftar panggilan.`,
                            type: 'danger',
                            action: () => execHapus(item),
                          })
                        }
                        title="Batalkan absensi"
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-70 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Footer Note */}
            <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-slate-100 text-center">
              <p className="text-[11px] sm:text-xs text-slate-400">
                Menampilkan riwayat presensi yang telah dicatat
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ══ MODAL: Confirm ════════════════════════════════════════════════════ */}
      <Modal open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open: false }))}>
        <div className="p-5 sm:p-7 text-center">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 ${confirm.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
            <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5 sm:mb-2">{confirm.title}</h3>
          <p className="text-slate-500 text-xs sm:text-sm mb-5 sm:mb-6 leading-relaxed">{confirm.message}</p>
          <div className="flex gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setConfirm(c => ({ ...c, open: false }))}
              disabled={confirm.loading}
              className="flex-1 py-2 sm:py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirm.action}
              disabled={confirm.loading}
              className={`flex-1 py-2 sm:py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm transition-colors disabled:opacity-50 cursor-pointer ${
                confirm.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {confirm.loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Ya, Lanjutkan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══ MODAL: QR Scanner ════════════════════════════════════════════════ */}
      <Modal open={showScanner} onClose={() => setShowScanner(false)} maxWidth="max-w-sm">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3.5 sm:mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs sm:text-sm">
              <QrCode size={16} className="text-blue-600" />
              <span>Scan QR Absensi</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowScanner(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square shadow-inner">
            <Scanner
              onScan={handleScan}
              formats={['qr_code']}
              allowMultiple
              scanDelay={1200}
              components={{ audio: false, onOff: true, torch: true, zoom: false, tracker: () => {} }}
            />

            {/* Overlay messages */}
            {scanStatus === 'success' && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-emerald-600/85 backdrop-blur-xs">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <CheckCircle className="text-emerald-600 w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <p className="text-white font-bold text-sm sm:text-base drop-shadow">Berhasil!</p>
                <p className="text-emerald-100 text-xs mt-0.5 text-center px-4">{scanMessage}</p>
              </div>
            )}
            {scanStatus === 'already' && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-amber-500/90 backdrop-blur-xs">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <AlertCircle className="text-amber-500 w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <p className="text-white font-bold text-sm sm:text-base drop-shadow text-center px-4">{scanMessage}</p>
              </div>
            )}
            {scanStatus === 'error' && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-600/90 backdrop-blur-xs">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <XCircle className="text-red-600 w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <p className="text-white font-bold text-sm sm:text-base drop-shadow">Ditolak</p>
                <p className="text-red-100 text-xs mt-0.5 text-center px-4">{scanMessage}</p>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] sm:text-xs text-slate-400 mt-3">
            Arahkan kamera ke QR Code peserta untuk mendeteksi secara otomatis.
          </p>
        </div>
      </Modal>

      {/* ══ MODAL: Tambah Peserta Manual ══════════════════════════════════════ */}
      <Modal open={showManualAdd} onClose={() => { setShowManualAdd(false); setManualSearch(''); }} maxWidth="max-w-md">
        <div className="p-4 sm:p-6 flex flex-col h-[75vh] sm:h-auto sm:max-h-[85vh]">
          <div className="flex items-center justify-between mb-3.5 sm:mb-4 shrink-0">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs sm:text-sm">
                <UserCheck size={16} className="text-teal-600" />
                <span>Tambah Peserta Manual</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Cari dan tambahkan peserta dari data seluruh anggota.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setShowManualAdd(false); setManualSearch(''); }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative shrink-0 mb-3">
            <Search size={16} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Ketik nama untuk mencari..."
              value={manualSearch}
              onChange={e => setManualSearch(e.target.value)}
              className="w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 pr-1">
            {manualSearch.length < 2 ? (
              <div className="py-10 sm:py-12 text-center text-slate-400 text-xs sm:text-sm">
                Ketik minimal 2 huruf untuk mencari
              </div>
            ) : (() => {
              const q = manualSearch.toLowerCase();
              const results = allGenerusList.filter(g =>
                g.nama_lengkap?.toLowerCase().includes(q) &&
                !attendedList.some(a => a.id === g.id) &&
                !generusList.some(gen => gen.id === g.id)
              ).slice(0, 15);

              if (results.length === 0) return (
                <div className="py-10 sm:py-12 text-center text-slate-400 text-xs sm:text-sm">
                  Tidak ditemukan peserta yang belum diabsen
                </div>
              );

              return results.map(g => (
                <div key={g.id} className="flex items-center justify-between py-2 sm:py-2.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                    <UserAvatar name={g.nama_lengkap} gender={g.jenis_kelamin} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">{g.nama_lengkap}</p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                        {g.kelompok || '—'} · {g.jenjang || '—'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAbsen(g, 'hadir')}
                    className="px-2.5 sm:px-3 py-1.5 shrink-0 rounded-xl bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white border border-teal-200 hover:border-teal-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    + Hadir
                  </button>
                </div>
              ));
            })()}
          </div>
        </div>
      </Modal>

    </div>
  );
}
