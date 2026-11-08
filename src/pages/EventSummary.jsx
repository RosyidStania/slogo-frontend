import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  ChevronLeft, Users, CheckCircle2, XCircle, AlertCircle, Clock,
  Filter, ChevronDown, Download, MapPin, BarChart3, TrendingUp,
  PieChart as PieChartIcon, Coins, Check, Loader2,
  ArrowUpRight, ArrowDownRight, ArrowLeftRight
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell, Sector
} from 'recharts';

// ─── Helpers & Custom Chart Shapes ───────────────────────────────────────────

const renderRoseShape = (props) => {
  const { cx, cy, startAngle, endAngle, fill, percent } = props;
  const dynamicOuterRadius = 38 + (percent * 30);
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={8}
      outerRadius={dynamicOuterRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={4}
    />
  );
};

const renderCustomizedLabel = (props) => {
  const { cx, cy, midAngle, percent } = props;
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const dynamicOuterRadius = 38 + (percent * 30);
  const radius = 8 + (dynamicOuterRadius - 8) * 0.62;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="11"
      fontWeight="800"
      style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.45)' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const AVATAR_PALETTE_MALE = [
  'bg-blue-100 text-blue-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-emerald-100 text-emerald-700',
  'bg-indigo-100 text-indigo-700',
  'bg-cyan-100 text-cyan-700',
];

const AVATAR_PALETTE_FEMALE = [
  'bg-pink-100 text-pink-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-fuchsia-100 text-fuchsia-700',
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

function UserAvatar({ name, gender }) {
  const colorClass = getAvatarColor(name, gender);
  return (
    <div className={`w-8 h-8 sm:w-9 sm:h-9 ${colorClass} rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 select-none shadow-2xs`}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

const getPercentageBadge = (percentage) => {
  if (percentage >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
  if (percentage >= 50) return 'bg-blue-50 text-blue-700 border-blue-200/70';
  if (percentage > 0) return 'bg-amber-50 text-amber-700 border-amber-200/70';
  return 'bg-slate-100 text-slate-500 border-slate-200/70';
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EventSummary() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [targetGenerus, setTargetGenerus] = useState([]);
  const [previousEvent, setPreviousEvent] = useState(null);
  const [previousAttendances, setPreviousAttendances] = useState([]);
  const [previousTargetGenerus, setPreviousTargetGenerus] = useState([]);
  const [infaqAmount, setInfaqAmount] = useState("");
  const [originalInfaqAmount, setOriginalInfaqAmount] = useState("");
  const [isSavingInfaq, setIsSavingInfaq] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filterKelompok, setFilterKelompok] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const kelompokList = ['Semua', 'Slogo', 'Gabugan', 'Jekani', 'Gawan', 'Pengkruk', 'Sidomulyo', 'Karangasem'];
  const statusList = ['Semua', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Terlambat'];

  const [isDropdownKelompokOpen, setIsDropdownKelompokOpen] = useState(false);
  const [isDropdownStatusOpen, setIsDropdownStatusOpen] = useState(false);
  const dropdownKelRef = useRef(null);
  const dropdownStatusRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownKelRef.current && !dropdownKelRef.current.contains(e.target)) {
        setIsDropdownKelompokOpen(false);
      }
      if (dropdownStatusRef.current && !dropdownStatusRef.current.contains(e.target)) {
        setIsDropdownStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async () => {
    try {
      const response = await api.get(`/admin/attendance/export/${eventId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rekapan_absensi_event_${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Gagal export:', error);
      alert('Gagal mengekspor data');
    }
  };

  const fetchSummaryData = async () => {
    try {
      const response = await api.get(`/admin/events/${eventId}/summary`);
      setEvent(response.data.event);
      setAttendances(response.data.attendances || []);
      setTargetGenerus(response.data.target_generus || []);
      setPreviousEvent(response.data.previous_event || null);
      setPreviousAttendances(response.data.previous_attendances || []);
      setPreviousTargetGenerus(response.data.previous_target_generus || []);
      setInfaqAmount(response.data.event.infaq || "");
      setOriginalInfaqAmount(response.data.event.infaq || "");
    } catch (error) {
      console.error('Gagal mengambil data rekapan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummaryData(); }, [eventId]);

  const filteredData = attendances.filter(item => {
    const matchKelompok = filterKelompok === 'Semua' || (item.generus?.kelompok || '').toLowerCase() === filterKelompok.toLowerCase();
    let matchStatus = true;
    if (filterStatus !== 'Semua') {
      if (filterStatus === 'Terlambat') {
        matchStatus = (Number(item.is_late) === 1);
      } else {
        matchStatus = (item.status || '').toLowerCase() === filterStatus.toLowerCase();
      }
    }
    return matchKelompok && matchStatus;
  });

  const groupStats = kelompokList.filter(k => k !== 'Semua').map(kelompok => {
    const targetGroup = targetGenerus.filter(g => (g.kelompok || '').toLowerCase() === kelompok.toLowerCase());
    const targetPutra = targetGroup.filter(g => g.jenis_kelamin === 'L').length;
    const targetPutri = targetGroup.filter(g => g.jenis_kelamin === 'P').length;
    const targetTotal = targetGroup.length;

    const attendGroup = attendances.filter(a => (a.generus?.kelompok || '').toLowerCase() === kelompok.toLowerCase());
    const hadirGroup = attendGroup.filter(a => a.status === 'hadir');

    const hadirPutra = hadirGroup.filter(a => a.generus?.jenis_kelamin === 'L').length;
    const hadirPutri = hadirGroup.filter(a => a.generus?.jenis_kelamin === 'P').length;
    const hadirTotal = hadirGroup.length;

    const izinSakitTotal = attendGroup.filter(a => a.status === 'izin' || a.status === 'sakit').length;
    const alpaTotal = Math.max(0, targetTotal - hadirTotal - izinSakitTotal);

    const percentage = targetTotal > 0 ? Math.round((hadirTotal / targetTotal) * 100) : 0;

    return {
      name: kelompok,
      targetPutra, targetPutri, targetTotal,
      hadirPutra, hadirPutri, hadirTotal,
      izinSakitTotal, alpaTotal,
      percentage
    };
  }).filter(g => g.targetTotal > 0);

  const totalStats = {
    targetPutra: groupStats.reduce((sum, g) => sum + g.targetPutra, 0),
    targetPutri: groupStats.reduce((sum, g) => sum + g.targetPutri, 0),
    targetTotal: groupStats.reduce((sum, g) => sum + g.targetTotal, 0),
    hadirPutra: groupStats.reduce((sum, g) => sum + g.hadirPutra, 0),
    hadirPutri: groupStats.reduce((sum, g) => sum + g.hadirPutri, 0),
    hadirTotal: groupStats.reduce((sum, g) => sum + g.hadirTotal, 0),
    izinSakitTotal: groupStats.reduce((sum, g) => sum + g.izinSakitTotal, 0),
    alpaTotal: groupStats.reduce((sum, g) => sum + g.alpaTotal, 0),
  };
  totalStats.percentage = totalStats.targetTotal > 0 ? Math.round((totalStats.hadirTotal / totalStats.targetTotal) * 100) : 0;

  const globalStats = {
    total: attendances.length,
    hadir: attendances.filter(a => a.status === 'hadir').length,
    terlambat: attendances.filter(a => Number(a.is_late) === 1).length,
    izin: attendances.filter(a => a.status === 'izin' || a.status === 'sakit').length,
    alpa: attendances.filter(a => a.status === 'alpa').length,
  };

  const comparisonData = kelompokList.filter(k => k !== 'Semua').map(kelompok => {
    const currentGroup = groupStats.find(g => g.name === kelompok);
    let currentPercentage = currentGroup ? currentGroup.percentage : 0;

    let previousPercentage = 0;
    if (previousEvent) {
      const prevTargetGroup = previousTargetGenerus.filter(g => (g.kelompok || '').toLowerCase() === kelompok.toLowerCase());
      const prevTargetTotal = prevTargetGroup.length;

      const prevAttendGroup = previousAttendances.filter(a => (a.generus?.kelompok || '').toLowerCase() === kelompok.toLowerCase());
      const prevHadirTotal = prevAttendGroup.filter(a => a.status === 'hadir').length;

      previousPercentage = prevTargetTotal > 0 ? Math.round((prevHadirTotal / prevTargetTotal) * 100) : 0;
    }

    return {
      name: kelompok,
      Sekarang: currentPercentage,
      BulanLalu: previousPercentage,
    };
  }).filter(g => groupStats.some(cg => cg.name === g.name && cg.targetTotal > 0));

  let prevTotalHadir = 0;
  let prevTotalIzin = 0;
  let prevTotalAlpa = 0;
  let prevHadirPutra = 0;
  let prevHadirPutri = 0;

  if (previousEvent) {
    prevTotalHadir = previousAttendances.filter(a => a.status === 'hadir').length;
    prevTotalIzin = previousAttendances.filter(a => a.status === 'izin' || a.status === 'sakit').length;
    prevTotalAlpa = previousAttendances.filter(a => a.status === 'alpa').length;
    prevHadirPutra = previousAttendances.filter(a => a.status === 'hadir' && a.generus?.jenis_kelamin === 'L').length;
    prevHadirPutri = previousAttendances.filter(a => a.status === 'hadir' && a.generus?.jenis_kelamin === 'P').length;
  }

  const currentMonthName = event ? new Date(event.event_date).toLocaleDateString('id-ID', { month: 'long' }) : 'Bulan Ini';
  const prevMonthName = previousEvent ? new Date(previousEvent.event_date).toLocaleDateString('id-ID', { month: 'long' }) : 'Bulan Lalu';

  const globalComparisonData = [
    { name: prevMonthName, Hadir: prevTotalHadir, Izin: prevTotalIzin, Alpa: prevTotalAlpa },
    { name: currentMonthName, Hadir: globalStats.hadir, Izin: globalStats.izin, Alpa: globalStats.alpa },
  ];

  const genderData = [
    { name: 'Putra', value: totalStats.hadirPutra, color: '#3b82f6' },
    { name: 'Putri', value: totalStats.hadirPutri, color: '#ec4899' }
  ].filter(d => d.value > 0);

  const prevGenderData = [
    { name: 'Putra', value: prevHadirPutra, color: '#3b82f6' },
    { name: 'Putri', value: prevHadirPutri, color: '#ec4899' }
  ].filter(d => d.value > 0);

  const getChangeStats = (current, prev, type) => {
    let percent;
    let sign = '';
    let colorClass = 'text-slate-500 bg-slate-100 border-slate-200/80';
    let icon = <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>;

    if (prev === 0) {
      if (current === 0) return { text: '0%', colorClass, icon };
      percent = 100;
    } else {
      percent = Math.round(((current - prev) / prev) * 100);
    }

    if (percent > 0) {
      sign = '+';
      if (type === 'hadir') colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200/60';
      else if (type === 'izin') colorClass = 'text-amber-700 bg-amber-50 border-amber-200/60';
      else colorClass = 'text-rose-700 bg-rose-50 border-rose-200/60';
      icon = <ArrowUpRight className="w-3.5 h-3.5" />;
    } else if (percent < 0) {
      if (type === 'hadir') colorClass = 'text-rose-700 bg-rose-50 border-rose-200/60';
      else colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200/60';
      icon = <ArrowDownRight className="w-3.5 h-3.5" />;
    } else {
      return { text: '0%', colorClass, icon };
    }
    return { text: `${sign}${Math.abs(percent)}%`, colorClass, icon };
  };

  const hadirChange = previousEvent ? getChangeStats(globalStats.hadir, prevTotalHadir, 'hadir') : null;
  const izinChange = previousEvent ? getChangeStats(globalStats.izin, prevTotalIzin, 'izin') : null;
  const alpaChange = previousEvent ? getChangeStats(globalStats.alpa, prevTotalAlpa, 'alpa') : null;

  const handleSaveInfaq = async () => {
    try {
      setIsSavingInfaq(true);
      await api.patch(`/admin/events/${eventId}/infaq`, { infaq: infaqAmount });
      setOriginalInfaqAmount(infaqAmount);
    } catch (error) {
      console.error('Gagal menyimpan infaq:', error);
      alert('Gagal menyimpan infaq');
    } finally {
      setIsSavingInfaq(false);
    }
  };

  // ─── Loading & Error Guards ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-200/80 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-[#168a53] animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-500">Memuat rekapan absensi...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 max-w-md mx-auto my-12 bg-white rounded-3xl border border-rose-200/80 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-base font-extrabold text-slate-900">Acara Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">Data acara yang Anda cari tidak tersedia atau telah dihapus.</p>
        <button
          onClick={() => navigate('/admin/events')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all"
        >
          Kembali ke Daftar Acara
        </button>
      </div>
    );
  }

  const isChangedInfaq = String(infaqAmount) !== String(originalInfaqAmount);

  return (
    <div className="w-full py-4 sm:py-6 space-y-4 sm:space-y-5 animate-in fade-in duration-200 pb-10">

      {/* ── 1. iOS Top Navigation Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Kembali ke Acara"
          >
            <ChevronLeft size={20} strokeWidth={2.4} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Rekapan Absensi
            </h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium truncate">
              <span className="font-semibold text-slate-700 truncate">{event.name}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 shrink-0">
                {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200/90 rounded-full font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer select-none"
          >
            <Download size={15} strokeWidth={2.2} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ── 2. iOS Widget Stat Tiles (5 Summary Cards) ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        
        {/* TOTAL */}
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-[22px] p-3 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users size={15} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
              {globalStats.total}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-0.5">Peserta tercatat</p>
          </div>
        </div>

        {/* HADIR */}
        <div className="bg-white border border-emerald-100/80 rounded-2xl sm:rounded-[22px] p-3 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Hadir</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-[#168a53] flex items-center justify-center border border-emerald-100/60">
              <CheckCircle2 size={15} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-[#168a53] tracking-tight tabular-nums">
              {globalStats.hadir}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-emerald-600/80 mt-0.5">{totalStats.percentage}% dari target</p>
          </div>
        </div>

        {/* TERLAMBAT */}
        <div className="bg-white border border-amber-100/80 rounded-2xl sm:rounded-[22px] p-3 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 uppercase tracking-wider">Terlambat</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/60">
              <Clock size={15} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight tabular-nums">
              {globalStats.terlambat}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-amber-600/80 mt-0.5">Melewati jadwal</p>
          </div>
        </div>

        {/* IZIN/SAKIT */}
        <div className="bg-white border border-blue-100/80 rounded-2xl sm:rounded-[22px] p-3 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-wider">Izin/Sakit</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60">
              <AlertCircle size={15} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight tabular-nums">
              {globalStats.izin}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-blue-500 mt-0.5">Izin atau sakit</p>
          </div>
        </div>

        {/* ALPA */}
        <div className="col-span-2 sm:col-span-1 bg-white border border-rose-100/80 rounded-2xl sm:rounded-[22px] p-3 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 uppercase tracking-wider">Alpa</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/60">
              <XCircle size={15} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight tabular-nums">
              {globalStats.alpa}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-medium text-rose-500 mt-0.5">Tanpa keterangan</p>
          </div>
        </div>

      </div>

      {/* ── 3. iOS Inset Grouped Table: REKAPAN KEHADIRAN & INFAQ ─────────────── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        
        {/* Card Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#168a53] flex items-center justify-center shrink-0 border border-emerald-100/60">
              <MapPin size={17} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight uppercase">
                Rekapan Kehadiran & Infaq
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Distribusi kehadiran per kelompok santri/generus
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-start sm:self-center">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200/70">
              Target: {totalStats.targetTotal} Generus
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-[#168a53] border border-emerald-200/70">
              Hadir: {totalStats.hadirTotal} ({totalStats.percentage}%)
            </span>
            <span className="text-[10px] font-semibold text-slate-400 sm:hidden flex items-center gap-1 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/60 select-none">
              <ArrowLeftRight size={10} /> Geser
            </span>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[620px] sm:min-w-full">
            <thead>
              {/* Header Level 1 */}
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th rowSpan="2" className="px-3.5 py-3 text-center w-12 border-r border-slate-100">No</th>
                <th rowSpan="2" className="px-4 py-3 border-r border-slate-100 min-w-[130px]">Kelompok</th>
                <th colSpan="3" className="px-4 py-2.5 text-center border-r border-slate-100 border-b border-slate-200/60 bg-slate-50/90 text-slate-600">
                  Jumlah Generus
                </th>
                <th colSpan="3" className="px-4 py-2.5 text-center border-r border-slate-100 border-b border-slate-200/60 bg-emerald-50/30 text-emerald-800">
                  Kehadiran {new Date(event.event_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                </th>
                <th rowSpan="2" className="px-4 py-3 text-center min-w-[80px]">Capaian %</th>
              </tr>
              {/* Header Level 2 */}
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="px-3 py-2 text-center border-r border-slate-100">Putra</th>
                <th className="px-3 py-2 text-center border-r border-slate-100">Putri</th>
                <th className="px-3 py-2 text-center font-extrabold text-slate-600 border-r border-slate-100">Total</th>
                <th className="px-3 py-2 text-center text-emerald-700 border-r border-slate-100">Putra</th>
                <th className="px-3 py-2 text-center text-emerald-700 border-r border-slate-100">Putri</th>
                <th className="px-3 py-2 text-center font-extrabold text-emerald-800 border-r border-slate-100">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {groupStats.map((stat, index) => (
                <tr key={stat.name} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3.5 py-3 text-center font-semibold text-slate-400 border-r border-slate-100 tabular-nums">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 font-extrabold text-slate-900 border-r border-slate-100">
                    {stat.name}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600 border-r border-slate-100 tabular-nums">
                    {stat.targetPutra}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600 border-r border-slate-100 tabular-nums">
                    {stat.targetPutri}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-900 bg-slate-50/30 border-r border-slate-100 tabular-nums">
                    {stat.targetTotal}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-700 border-r border-slate-100 tabular-nums">
                    {stat.hadirPutra}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-700 border-r border-slate-100 tabular-nums">
                    {stat.hadirPutri}
                  </td>
                  <td className="px-3 py-3 text-center font-extrabold text-[#168a53] bg-emerald-50/20 border-r border-slate-100 tabular-nums">
                    {stat.hadirTotal}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black tabular-nums ${getPercentageBadge(stat.percentage)}`}>
                      {stat.percentage}%
                    </span>
                  </td>
                </tr>
              ))}

              {/* Total Summary Row */}
              <tr className="bg-slate-100/60 border-t-2 border-slate-200/90 font-extrabold text-slate-900">
                <td colSpan="2" className="px-4 py-3 text-center uppercase tracking-wider text-xs border-r border-slate-200/60">
                  Jumlah Total
                </td>
                <td className="px-3 py-3 text-center border-r border-slate-200/60 tabular-nums">
                  {totalStats.targetPutra}
                </td>
                <td className="px-3 py-3 text-center border-r border-slate-200/60 tabular-nums">
                  {totalStats.targetPutri}
                </td>
                <td className="px-3 py-3 text-center text-slate-900 font-black border-r border-slate-200/60 tabular-nums bg-slate-200/40">
                  {totalStats.targetTotal}
                </td>
                <td className="px-3 py-3 text-center text-[#168a53] border-r border-slate-200/60 tabular-nums">
                  {totalStats.hadirPutra}
                </td>
                <td className="px-3 py-3 text-center text-[#168a53] border-r border-slate-200/60 tabular-nums">
                  {totalStats.hadirPutri}
                </td>
                <td className="px-3 py-3 text-center text-[#168a53] font-black border-r border-slate-200/60 tabular-nums bg-emerald-50/50">
                  {totalStats.hadirTotal}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#168a53] text-white shadow-2xs tabular-nums">
                    {totalStats.percentage}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── iOS Inset Wallet / Infaq Card Section ────────────────────────── */}
        <div className="border-t border-slate-200/80 bg-amber-50/40 p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
              <Coins size={19} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight uppercase">Infaq Acara</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 border border-amber-200/60">
                  Kas Kegiatan
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                Total penerimaan infaq sukarela dari peserta pada kegiatan ini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                value={infaqAmount}
                onChange={(e) => setInfaqAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-3.5 py-2 rounded-full border border-slate-300/80 focus:border-[#168a53] focus:ring-2 focus:ring-[#168a53]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs transition-all"
              />
            </div>

            <button
              onClick={handleSaveInfaq}
              disabled={isSavingInfaq || !isChangedInfaq}
              className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer select-none active:scale-95 ${
                !isChangedInfaq
                  ? 'bg-slate-200/80 text-slate-600 cursor-default opacity-90'
                  : 'bg-[#168a53] hover:bg-[#127344] text-white'
              }`}
            >
              {isSavingInfaq ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : !isChangedInfaq ? (
                <>
                  <Check size={14} strokeWidth={2.5} className="text-[#168a53]" />
                  <span>Tersimpan</span>
                </>
              ) : (
                <span>Simpan Infaq</span>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* ── 4. iOS Comparison Charts ─────────────────────────────────────────── */}
      {previousEvent && comparisonData.length > 0 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
                <BarChart3 size={17} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-base font-extrabold text-slate-900 tracking-tight uppercase truncate sm:whitespace-normal">
                  Perbandingan Kehadiran dengan {new Date(previousEvent.event_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate sm:whitespace-normal">
                  Persentase capaian kehadiran per kelompok dibandingkan bulan sebelumnya
                </p>
              </div>
            </div>

            <span className="text-[10px] font-semibold text-slate-400 sm:hidden flex items-center gap-1 shrink-0 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60 select-none">
              <ArrowLeftRight size={11} className="text-slate-500" />
              <span>Geser</span>
            </span>
          </div>

          <div className="p-3.5 sm:p-6 overflow-x-auto">
            <div className="h-[320px] sm:h-[370px] min-w-[580px] sm:min-w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 25, right: 15, left: -15, bottom: 5 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    dx={-5}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-3 text-xs min-w-[140px]">
                            <p className="font-extrabold text-slate-900 pb-1 mb-1.5 border-b border-slate-100">
                              Kelompok {label}
                            </p>
                            <div className="space-y-1 font-semibold">
                              <p className="text-[#168a53] flex items-center justify-between">
                                <span>{currentMonthName}:</span>
                                <span className="font-black tabular-nums">{payload[0]?.value}%</span>
                              </p>
                              <p className="text-slate-500 flex items-center justify-between">
                                <span>{prevMonthName}:</span>
                                <span className="font-black tabular-nums">{payload[1]?.value}%</span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '15px', fontSize: '12px', fontWeight: 600 }}
                  />
                  <Bar dataKey="Sekarang" name={currentMonthName} fill="#168a53" radius={[5, 5, 0, 0]} maxBarSize={22}>
                    <LabelList
                      dataKey="Sekarang"
                      position="top"
                      formatter={(val) => `${val}%`}
                      style={{ fill: '#168a53', fontSize: 10, fontWeight: '800' }}
                      offset={4}
                    />
                  </Bar>
                  <Bar dataKey="BulanLalu" name={prevMonthName} fill="#cbd5e1" radius={[5, 5, 0, 0]} maxBarSize={22}>
                    <LabelList
                      dataKey="BulanLalu"
                      position="top"
                      formatter={(val) => `${val}%`}
                      style={{ fill: '#64748b', fontSize: 10, fontWeight: '700' }}
                      offset={4}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Trend & Gender Cards (Grid 2 Col) ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        
        {/* Trend Status (Line Chart) */}
        {previousEvent && globalComparisonData.length > 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/60">
                  <TrendingUp size={17} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight uppercase">
                    Perbandingan Total Status
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Tren perubahan jumlah status dibanding bulan lalu
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-5 flex-grow flex flex-col justify-between">
              {/* iOS Trend Badges */}
              <div className="flex gap-2 sm:gap-6 mb-3 sm:mb-4 justify-center flex-wrap pb-3 border-b border-slate-100">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hadir</span>
                  <div className={`flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full mt-1 border ${hadirChange?.colorClass}`}>
                    {hadirChange?.icon}
                    <span>{hadirChange?.text}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Izin/Sakit</span>
                  <div className={`flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full mt-1 border ${izinChange?.colorClass}`}>
                    {izinChange?.icon}
                    <span>{izinChange?.text}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alpa</span>
                  <div className={`flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full mt-1 border ${alpaChange?.colorClass}`}>
                    {alpaChange?.icon}
                    <span>{alpaChange?.text}</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-[200px] sm:h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={globalComparisonData} margin={{ top: 20, right: 15, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      dx={-5}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-3 text-xs min-w-[130px]">
                              <p className="font-extrabold text-slate-900 pb-1 mb-1.5 border-b border-slate-100">
                                {label}
                              </p>
                              <div className="space-y-1 font-semibold">
                                {payload.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1.5" style={{ color: item.color }}>
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                      {item.name}:
                                    </span>
                                    <span className="font-black text-slate-900 tabular-nums">{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '12px', fontWeight: 600 }} />
                    <Line type="monotone" dataKey="Hadir" stroke="#168a53" strokeWidth={3} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Izin" name="Izin/Sakit" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Alpa" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : null}

        {/* Komposisi Gender (Putra vs Putri) */}
        {(genderData.length > 0 || (previousEvent && prevGenderData.length > 0)) ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 border border-pink-100/60">
                  <PieChartIcon size={17} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight uppercase">
                    Komposisi Kehadiran
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Perbandingan santri Putra vs Putri yang hadir
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-5 flex flex-col items-center justify-between flex-grow">
              <div className="w-full min-h-[190px] sm:h-[220px] grid grid-cols-2 gap-2 sm:gap-6 items-center">
                
                {/* Previous Event Donut */}
                {previousEvent && prevGenderData.length > 0 ? (
                  <div className="flex flex-col items-center h-full w-full">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 mb-1">{prevMonthName}</span>
                    <div className="w-full h-[150px] sm:h-[180px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prevGenderData}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={56}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {prevGenderData.map((entry, index) => (
                              <Cell key={`cell-prev-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl p-2 text-xs shadow-md">
                                    <span className="font-bold">{payload[0].name}: {payload[0].value} Santri</span>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg sm:text-xl font-black text-slate-800 tabular-nums">{prevTotalHadir}</span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hadir</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400 italic">
                    Belum ada data bulan lalu
                  </div>
                )}

                {/* Current Event Donut */}
                {genderData.length > 0 ? (
                  <div className="flex flex-col items-center h-full w-full">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 mb-1">{currentMonthName}</span>
                    <div className="w-full h-[150px] sm:h-[180px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={genderData}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={56}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {genderData.map((entry, index) => (
                              <Cell key={`cell-curr-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl p-2 text-xs shadow-md">
                                    <span className="font-bold">{payload[0].name}: {payload[0].value} Santri</span>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg sm:text-xl font-black text-slate-800 tabular-nums">{totalStats.hadirTotal}</span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hadir</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400 italic">
                    Belum ada data hadir
                  </div>
                )}

              </div>

              {/* Shared Legend */}
              <div className="flex items-center justify-center gap-6 mt-2 pt-2.5 border-t border-slate-100 w-full">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-2xs"></span>
                  <span className="text-xs font-bold text-slate-700">Putra</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ec4899] shadow-2xs"></span>
                  <span className="text-xs font-bold text-slate-700">Putri</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

      </div>

      {/* ── 6. Rasio Kehadiran per Kelompok ──────────────────────────────────── */}
      {groupStats.length > 0 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/60">
                <PieChartIcon size={17} strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight uppercase">
                  Rasio Kehadiran per Kelompok
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Rincian perbandingan status kehadiran tiap-tiap kelompok santri
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
            {groupStats.map((stat, idx) => {
              const pieData = [
                { name: 'Hadir', value: stat.hadirTotal, color: '#168a53' },
                { name: 'Izin/Sakit', value: stat.izinSakitTotal, color: '#f59e0b' },
                { name: 'Alpa', value: stat.alpaTotal < 0 ? 0 : stat.alpaTotal, color: '#ef4444' }
              ].filter(d => d.value > 0);

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center bg-slate-50/70 border border-slate-200/70 rounded-2xl p-3.5 sm:p-4 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-tight uppercase">
                      {stat.name}
                    </h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getPercentageBadge(stat.percentage)}`}>
                      {stat.percentage}%
                    </span>
                  </div>

                  <div className="w-full h-[160px] sm:h-[170px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          dataKey="value"
                          stroke="none"
                          activeIndex={pieData.map((_, i) => i)}
                          activeShape={renderRoseShape}
                          labelLine={false}
                          label={renderCustomizedLabel}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-group-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Status Pills */}
                  <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mt-2.5 w-full text-[10px] font-bold">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-[#168a53] rounded-md border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#168a53]"></span>
                      Hadir: {stat.hadirTotal}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Izin: {stat.izinSakitTotal}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      Alpa: {stat.alpaTotal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 7. iOS Inset Grouped Detail Attendee Table & Filters ─────────────── */}
      <div className="space-y-3 sm:space-y-3.5">
        
        {/* iOS Filter Buttons & Result Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Kelompok Dropdown */}
            <div className="relative flex-1 sm:flex-initial min-w-[135px]" ref={dropdownKelRef}>
              <button
                type="button"
                onClick={() => setIsDropdownKelompokOpen(!isDropdownKelompokOpen)}
                className="w-full flex items-center justify-between gap-1.5 px-3.5 py-2 bg-white border border-slate-200/90 rounded-full shadow-2xs text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 active:scale-95 transition-all select-none cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Filter size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{filterKelompok === 'Semua' ? 'Semua Kelompok' : filterKelompok}</span>
                </div>
                <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform ${isDropdownKelompokOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownKelompokOpen && (
                <div className="absolute z-50 left-0 mt-2 w-48 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
                  {kelompokList.map(k => (
                    <button
                      key={k}
                      onClick={() => { setFilterKelompok(k); setIsDropdownKelompokOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                        filterKelompok === k
                          ? 'bg-emerald-50 text-[#168a53] font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{k === 'Semua' ? 'Semua Kelompok' : k}</span>
                      {filterKelompok === k && <Check size={14} className="text-[#168a53]" strokeWidth={2.5} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative flex-1 sm:flex-initial min-w-[125px]" ref={dropdownStatusRef}>
              <button
                type="button"
                onClick={() => setIsDropdownStatusOpen(!isDropdownStatusOpen)}
                className="w-full flex items-center justify-between gap-1.5 px-3.5 py-2 bg-white border border-slate-200/90 rounded-full shadow-2xs text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 active:scale-95 transition-all select-none cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{filterStatus === 'Semua' ? 'Semua Status' : filterStatus}</span>
                </div>
                <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform ${isDropdownStatusOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownStatusOpen && (
                <div className="absolute z-50 left-0 mt-2 w-44 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
                  {statusList.map(s => (
                    <button
                      key={s}
                      onClick={() => { setFilterStatus(s); setIsDropdownStatusOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                        filterStatus === s
                          ? 'bg-emerald-50 text-[#168a53] font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{s === 'Semua' ? 'Semua Status' : s}</span>
                      {filterStatus === s && <Check size={14} className="text-[#168a53]" strokeWidth={2.5} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-400">
              Menampilkan <strong className="text-slate-700 font-bold">{filteredData.length}</strong> peserta
            </span>
            <span className="text-[10px] font-semibold text-slate-400 sm:hidden flex items-center gap-1 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/60 select-none">
              <ArrowLeftRight size={10} /> Geser
            </span>
          </div>
        </div>

        {/* Inset Grouped Detail Table */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-3 sm:px-4 py-3 text-center w-12">No</th>
                  <th className="px-3 sm:px-4 py-3">Biodata Peserta</th>
                  <th className="px-3 sm:px-4 py-3">Status Kehadiran</th>
                  <th className="px-3 sm:px-4 py-3">Waktu Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users size={28} className="text-slate-300 stroke-[1.5]" />
                        <p className="font-semibold text-slate-500 text-xs sm:text-sm">
                          Tidak ada data yang sesuai filter
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-semibold text-slate-400 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <UserAvatar
                            name={item.generus?.nama_lengkap}
                            gender={item.generus?.jenis_kelamin}
                          />
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">
                              {item.generus?.nama_lengkap || '-'}
                            </p>
                            <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-0.5">
                              {item.generus?.kelompok || '-'} • {item.generus?.jenjang || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-extrabold capitalize border ${
                            item.status === 'hadir'
                              ? 'bg-emerald-50 text-[#168a53] border-emerald-200/70'
                              : item.status === 'izin' || item.status === 'sakit'
                              ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                              : 'bg-rose-50 text-rose-700 border-rose-200/70'
                          }`}
                        >
                          {item.status === 'hadir' && <CheckCircle2 size={13} strokeWidth={2.5} />}
                          {item.status === 'alpa' && <XCircle size={13} strokeWidth={2.5} />}
                          {(item.status === 'izin' || item.status === 'sakit') && <AlertCircle size={13} strokeWidth={2.5} />}
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                        {item.status === 'hadir' ? (
                          <div className="flex items-center gap-2">
                            <Clock size={13} className="text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-700 tabular-nums text-xs">
                              {item.time_arrived?.substring(0, 5)} WIB
                            </span>
                            {Number(item.is_late) === 1 && (
                              <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200/70">
                                Terlambat
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold ml-4">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
