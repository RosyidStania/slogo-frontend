import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Clock, ArrowLeft, CheckCircle, XCircle, AlertCircle, Users, Search,
  CalendarDays, Filter, CheckCheck, Trash2, HelpCircle, MapPin, Camera,
  X, UserCheck, UserX, AlertTriangle, Loader2, RefreshCw
} from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

// ─── Shared small components ──────────────────────────────────────────────────

const KELOMPOK_LIST = ['Semua', 'Slogo', 'Gabugan', 'Jekani', 'Gawan', 'Pengkruk', 'Sidomulyo', 'Karangasem'];
const JENJANG_LIST  = ['Semua', 'MT', 'PAUD', 'TK', '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD', '1 SMP', '2 SMP', '3 SMP', '1 SMA/SMK', '2 SMA/SMK', '3 SMA/SMK', 'USMAN'];

function Avatar({ name, gender, size = 'md' }) {
  const sz = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm';
  const bg = gender === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600';
  return (
    <div className={`${sz} ${bg} rounded-xl flex items-center justify-center font-bold shrink-0`}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

function StatusChip({ status }) {
  const map = {
    hadir: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    izin:  'bg-amber-50  text-amber-700  border-amber-200',
    alpa:  'bg-red-50    text-red-700    border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status}
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
export default function ManageAttendance() {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  const [event, setEvent]           = useState(null);
  const [generusList, setGenerusList] = useState([]);
  const [attendedList, setAttendedList] = useState([]);
  const [allGenerusList, setAllGenerusList] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filters
  const [search, setSearch]               = useState('');
  const [filterKelompok, setFilterKelompok] = useState('Semua');
  const [filterJenjang, setFilterJenjang]   = useState('Semua');

  // Modals
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', action: null, type: 'danger' });
  const [showScanner, setShowScanner] = useState(false);
  const [scanStatus, setScanStatus]   = useState(null);
  const [scanMessage, setScanMessage] = useState('');

  // Refs for scanner stale-closure avoidance
  const attendedRef    = useRef([]);
  const generusRef     = useRef([]);
  const allGenerusRef  = useRef([]);
  const scanStatusRef  = useRef(null);

  useEffect(() => { attendedRef.current   = attendedList; },    [attendedList]);
  useEffect(() => { generusRef.current    = generusList; },     [generusList]);
  useEffect(() => { allGenerusRef.current = allGenerusList; },  [allGenerusList]);
  useEffect(() => { scanStatusRef.current = scanStatus; },      [scanStatus]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { fetchData(); }, [eventId]);

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

      let targetKategori = [];
      if (currentEvent?.target_kategori) {
        targetKategori = Array.isArray(currentEvent.target_kategori)
          ? currentEvent.target_kategori
          : JSON.parse(currentEvent.target_kategori);
      }

      const existing    = summaryRes.data.attendances || [];
      const attendedIds = existing.map(a => a.generus_id);

      const formatted = existing.map(a => ({
        ...a.generus, status_absen: a.status, is_late: a.is_late, time_arrived: a.time_arrived,
      }));
      setAttendedList(formatted);

      const allG = generusRes.data.data || [];
      setAllGenerusList(allG);

      const filtered = allG.filter(g => {
        const j = (g.jenjang || '').toLowerCase();
        return (
          (targetKategori.length === 0 || targetKategori.some(t => j.includes(t.toLowerCase()))) &&
          !attendedIds.includes(g.id) &&
          ['aktif', 'pasif'].includes(g.status?.toLowerCase())
        );
      });
      setGenerusList(filtered);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const isLate = (batas) => {
    if (!batas) return false;
    const now = new Date();
    const [h, m] = batas.split(':').map(Number);
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m);
  };

  const handleAbsen = async (generus, status) => {
    const late    = status === 'hadir' ? isLate(event?.start_time) : false;
    const timeStr = status === 'hadir'
      ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : null;
    const record = { ...generus, status_absen: status, is_late: late, time_arrived: timeStr || '-' };
    setGenerusList(prev => prev.filter(g => g.id !== generus.id));
    setAttendedList(prev => [record, ...prev]);
    try {
      await api.post('/admin/attendance', {
        event_id: event.id, generus_id: generus.id, status, is_late: late, time_arrived: timeStr,
      });
    } catch (e) { console.error(e); }
  };

  const execHadirSemua = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    const late    = isLate(event?.start_time);
    const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    try {
      await api.post('/admin/attendance/bulk', {
        attendances: displayed.map(g => ({ event_id: event.id, generus_id: g.id, status: 'hadir', is_late: late, time_arrived: timeStr })),
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
        attendances: displayed.map(g => ({ event_id: event.id, generus_id: g.id, status: 'alpa', is_late: false, time_arrived: null })),
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
      const { status_absen, is_late, time_arrived, ...gData } = item;
      return [...prev, gData];
    });
    setConfirm(c => ({ ...c, open: false }));
    try { await api.delete(`/admin/attendance/${event.id}/${item.id}`); }
    catch (e) { console.error(e); }
  };

  const handleScan = useCallback((result) => {
    if (!result?.[0]) return;
    const raw = result[0].rawValue;
    if (!raw.startsWith('SLOGO-GEN-')) return;
    const id = parseInt(raw.replace('SLOGO-GEN-', ''));
    if (isNaN(id)) return;

    if (attendedRef.current.some(a => a.id === id)) {
      setScanStatus('already'); setScanMessage('Sudah diabsen!');
      setTimeout(() => setScanStatus(null), 1200);
      return;
    }
    const target = generusRef.current.find(g => g.id === id);
    if (target) {
      handleAbsen(target, 'hadir');
      setScanStatus('success'); setScanMessage(target.nama_lengkap);
      setTimeout(() => setScanStatus(null), 1200);
    } else {
      const known = allGenerusRef.current.find(g => g.id === id);
      setScanStatus('error');
      setScanMessage(known ? `${known.nama_lengkap} bukan target acara ini` : 'QR tidak dikenali');
      setTimeout(() => setScanStatus(null), 1500);
    }
  }, [event]);

  // ─── Derived data ─────────────────────────────────────────────────────────
  const displayed = generusList.filter(g => {
    const q = search.toLowerCase();
    return (
      g.nama_lengkap?.toLowerCase().includes(q) &&
      (filterKelompok === 'Semua' || g.kelompok?.toLowerCase() === filterKelompok.toLowerCase()) &&
      (filterJenjang  === 'Semua' || g.jenjang?.toLowerCase()  === filterJenjang.toLowerCase())
    );
  });

  const currentlyLate = isLate(event?.start_time);
  const totalHadir    = attendedList.filter(a => a.status_absen === 'hadir').length;
  const totalIzin     = attendedList.filter(a => a.status_absen === 'izin').length;
  const totalAlpa     = attendedList.filter(a => a.status_absen === 'alpa').length;
  const totalTarget   = attendedList.length + generusList.length;

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 size={32} className="animate-spin text-teal-500" />
      <p className="text-slate-500 text-sm">Memuat sistem absensi...</p>
    </div>
  );
  if (!event) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertTriangle size={32} className="text-red-400" />
      <p className="text-slate-500">Acara tidak ditemukan.</p>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/events')}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {(Array.isArray(event.target_kategori) && event.target_kategori.length > 0
                ? event.target_kategori
                : ['Semua Umur']
              ).map(k => (
                <span key={k} className="text-[10px] font-bold uppercase bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-md">{k}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Info + clock strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
              <CalendarDays size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Acara</p>
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {new Date(event.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jam Sekarang</p>
            <p className="text-xl font-black font-mono text-slate-800 tabular-nums leading-none">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>

          <div className={`rounded-2xl px-4 py-3 border ${currentlyLate ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${currentlyLate ? 'text-red-400' : 'text-emerald-500'}`}>Batas Hadir</p>
            <p className={`text-xl font-black font-mono leading-none flex items-center gap-1.5 ${currentlyLate ? 'text-red-600' : 'text-emerald-700'}`}>
              <Clock size={16} strokeWidth={2.5} />
              {event.start_time?.substring(0, 5)}
              {currentlyLate && <span className="text-[10px] font-bold normal-case ml-1">(Sudah lewat)</span>}
            </p>
          </div>
        </div>

        {/* ── Progress stats ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Target', value: totalTarget, color: 'text-slate-700', bg: 'bg-white border-slate-200', icon: <Users size={16} className="text-slate-400" /> },
            { label: 'Hadir', value: totalHadir, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', icon: <UserCheck size={16} className="text-emerald-500" /> },
            { label: 'Izin', value: totalIzin, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100', icon: <AlertCircle size={16} className="text-amber-500" /> },
            { label: 'Alpa', value: totalAlpa, color: 'text-red-700', bg: 'bg-red-50 border-red-100', icon: <UserX size={16} className="text-red-500" /> },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-2xl px-4 py-3 flex items-center justify-between`}>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-bold mt-0.5 tabular-nums ${s.color}`}>{s.value}</p>
              </div>
              {s.icon}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {totalTarget > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-slate-600">Progress Absensi</p>
              <p className="text-xs font-bold text-teal-600">{attendedList.length} / {totalTarget} selesai</p>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${(attendedList.length / totalTarget) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Main content: 2 col ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── LEFT: Daftar panggilan (3/5) ────────────────────────────── */}
          <div className="lg:col-span-3 space-y-3">

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama peserta..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-2xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm"
              />
            </div>

            {/* Pill filter: Kelompok */}
            <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2.5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <MapPin size={10} className="text-teal-500" /> Kelompok
              </p>
              <div className="flex flex-wrap gap-1.5">
                {KELOMPOK_LIST.map(k => {
                  const cnt = k === 'Semua'
                    ? generusList.length
                    : generusList.filter(g => g.kelompok?.toLowerCase() === k.toLowerCase()).length;
                  const active = filterKelompok === k;
                  return (
                    <button key={k} onClick={() => setFilterKelompok(k)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        active ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}>
                      {k === 'Semua' ? 'Semua' : k}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${active ? 'bg-teal-500/50 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {cnt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pill filter: Jenjang */}
            <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2.5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <Filter size={10} className="text-emerald-500" /> Jenjang
              </p>
              <div className="flex flex-wrap gap-1.5">
                {JENJANG_LIST.map(j => {
                  const active = filterJenjang === j;
                  return (
                    <button key={j} onClick={() => setFilterJenjang(j)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}>
                      {j === 'Semua' ? 'Semua' : j}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daftar panggilan card */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Card header */}
              <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">Daftar Panggilan</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700">
                    {displayed.length} orang
                  </span>
                </div>
                {displayed.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <button onClick={() => setShowScanner(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors">
                      <Camera size={13} /> Scan QR
                    </button>
                    <button onClick={() => setConfirm({ open: true, title: 'Hadirkan Semua?', message: `Tandai HADIR untuk ${displayed.length} peserta yang tampil?`, type: 'success', action: execHadirSemua })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors">
                      <CheckCheck size={13} /> Hadir Semua
                    </button>
                    <button onClick={() => setConfirm({ open: true, title: 'Alpakan Sisa?', message: `Tandai ALPA untuk sisa ${displayed.length} peserta?`, type: 'danger', action: execAlpaSemua })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors">
                      <XCircle size={13} /> Alpa Semua
                    </button>
                  </div>
                )}
              </div>

              {/* List */}
              <div className="divide-y divide-slate-50 max-h-[52vh] overflow-y-auto">
                {displayed.length === 0 ? (
                  <div className="py-16 text-center">
                    <CheckCircle size={32} className="text-emerald-300 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium text-sm">Semua sudah diabsen</p>
                    <p className="text-slate-400 text-xs mt-1">Tidak ada peserta yang tersisa</p>
                  </div>
                ) : displayed.map(g => (
                  <div key={g.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={g.nama_lengkap} gender={g.jenis_kelamin} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{g.nama_lengkap}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {g.kelompok} · {g.jenjang || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleAbsen(g, 'hadir')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-500 text-xs font-bold transition-all">
                        Hadir
                      </button>
                      <button onClick={() => handleAbsen(g, 'izin')}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white border border-amber-200 hover:border-amber-500 text-xs font-bold transition-all">
                        Izin
                      </button>
                      <button onClick={() => handleAbsen(g, 'alpa')}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-500 text-red-700 hover:text-white border border-red-200 hover:border-red-500 text-xs font-bold transition-all">
                        Alpa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Riwayat (2/5) ────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm sticky top-4">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Riwayat Absensi</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-200 text-slate-600">
                  {attendedList.length} selesai
                </span>
              </div>

              <div className="divide-y divide-slate-50 max-h-[72vh] overflow-y-auto">
                {attendedList.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users size={28} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Belum ada absensi</p>
                  </div>
                ) : attendedList.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group animate-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={item.nama_lengkap} gender={item.jenis_kelamin} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-xs truncate">{item.nama_lengkap}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.kelompok}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <div className="text-right">
                        <StatusChip status={item.status_absen} />
                        {item.status_absen === 'hadir' && (
                          <p className={`text-[10px] font-semibold mt-0.5 ${Number(item.is_late) === 1 ? 'text-red-500' : 'text-slate-400'}`}>
                            {item.time_arrived}{Number(item.is_late) === 1 ? ' · Telat' : ''}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setConfirm({ open: true, title: 'Hapus Absensi?', message: `Hapus absensi ${item.nama_lengkap}? Dia kembali ke daftar panggilan.`, type: 'danger', action: () => execHapus(item) })}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MODAL: Confirm ════════════════════════════════════════════════════ */}
      <Modal open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open: false }))}>
        <div className="p-8 text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${confirm.type === 'success' ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <HelpCircle size={28} className={confirm.type === 'success' ? 'text-emerald-500' : 'text-red-500'} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{confirm.title}</h3>
          <p className="text-slate-500 text-sm mb-7 leading-relaxed">{confirm.message}</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirm(c => ({ ...c, open: false }))} disabled={confirm.loading}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50">
              Batal
            </button>
            <button onClick={confirm.action} disabled={confirm.loading}
              className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-50 ${confirm.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
              {confirm.loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Ya, Lanjutkan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══ MODAL: QR Scanner ════════════════════════════════════════════════ */}
      <Modal open={showScanner} onClose={() => setShowScanner(false)} maxWidth="max-w-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Camera size={16} className="text-blue-500" /> Scan QR Absensi
            </h3>
            <button onClick={() => setShowScanner(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
            <Scanner
              onScan={handleScan}
              formats={['qr_code']}
              allowMultiple
              scanDelay={1200}
              components={{ audio: false, onOff: true, torch: true, zoom: false, tracker: () => {} }}
            />

            {/* Scan result overlays */}
            {scanStatus === 'success' && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-emerald-500/85 backdrop-blur-sm">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-xl">
                  <CheckCircle className="text-emerald-500 w-9 h-9" />
                </div>
                <p className="text-white font-bold text-lg drop-shadow">Berhasil!</p>
                <p className="text-emerald-100 text-sm mt-0.5">{scanMessage}</p>
              </div>
            )}
            {scanStatus === 'already' && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-amber-500/90 backdrop-blur-sm">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-xl">
                  <AlertCircle className="text-amber-500 w-9 h-9" />
                </div>
                <p className="text-white font-bold text-lg drop-shadow text-center px-4">{scanMessage}</p>
              </div>
            )}
            {scanStatus === 'error' && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-500/90 backdrop-blur-sm">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-xl">
                  <XCircle className="text-red-500 w-9 h-9" />
                </div>
                <p className="text-white font-bold text-lg drop-shadow">Ditolak</p>
                <p className="text-red-100 text-sm mt-0.5 text-center px-4">{scanMessage}</p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-3">
            Arahkan kamera ke QR Code peserta. Layar otomatis mendeteksi.
          </p>
        </div>
      </Modal>
    </div>
  );
}