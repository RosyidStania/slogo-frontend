import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Users, TrendingUp, Calendar, Clock, Award, Medal,
  Loader2, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import CustomMultiSelect from '../components/CustomMultiSelect';

const PIE_COLORS = [
  '#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#3b82f6', '#d97706', '#14b8a6', '#6366f1',
  '#ec4899', '#64748b', '#eab308', '#a855f7', '#f97316'
];

// ─── Custom Bar Tooltip ─────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="relative bg-slate-900 text-white px-3 py-2 rounded-xl text-center shadow-2xl text-xs font-bold leading-tight pointer-events-none">
      <p className="text-[11px] text-slate-300 capitalize">{label}</p>
      <p className="text-white text-xs font-extrabold mt-0.5">{payload[0].value} Orang</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
    </div>
  );
};

// ─── Custom Pie Tooltip ────────────────────────────────────────────────────────
const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl">
      <span className="capitalize">{data.name}: </span>
      <span className="text-emerald-400 font-extrabold">{data.value} Generus</span>
    </div>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ message = 'Belum ada data.' }) {
  return (
    <div className="h-full min-h-[140px] flex items-center justify-center text-slate-400 text-xs py-8">
      {message}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalGenerus: 0, aktifGenerus: 0, rataKehadiran: 0, acaraBulanIni: 0 });
  const [demografiData, setDemografiData] = useState([]);
  const [kategoriData, setKategoriData] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [topAttendees, setTopAttendees] = useState([]);
  const [topGroups, setTopGroups] = useState([]);

  const [eventTypes, setEventTypes] = useState([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState([]);
  const [excludeMT, setExcludeMT] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [headerSlot, setHeaderSlot] = useState(() => document.getElementById('layout-header-actions'));

  const fetchEventTypes = async () => {
    try {
      const res = await api.get('/admin/event-types');
      const formatted = (res.data.data || []).map(et => ({ value: et.id, label: et.name }));
      setEventTypes(formatted);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard-stats', {
        params: {
          event_type_ids: selectedEventTypes,
          exclude_mt: excludeMT ? 1 : 0
        }
      });
      setStats(res.data.stats ?? { totalGenerus: 0, aktifGenerus: 0, rataKehadiran: 0, acaraBulanIni: 0 });
      setDemografiData(res.data.demografi ?? []);
      setKategoriData(res.data.kategori ?? []);
      setUpcomingEvents(res.data.upcomingEvents ?? []);
      setTopAttendees(res.data.topAttendees ?? []);
      setTopGroups(res.data.topGroups ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
    const id = requestAnimationFrame(() => {
      setHeaderSlot(document.getElementById('layout-header-actions'));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedEventTypes, excludeMT]);

  // ─── Portal into mobile top header actions ─────────────────────────────────
  const mobileTopActions = headerSlot && ReactDOM.createPortal(
    <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
      <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200/90 bg-white text-[11px] font-semibold text-slate-600 shadow-2xs">
        <Calendar size={12} className="text-emerald-600" />
        <span>{new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
      </div>
      <button
        type="button"
        onClick={() => setShowFilterDrawer(v => !v)}
        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors shadow-2xs relative cursor-pointer active:scale-95 ${
          showFilterDrawer || selectedEventTypes.length > 0 || excludeMT
            ? 'bg-emerald-50 border-emerald-200 text-[#168a53]'
            : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50'
        }`}
        title="Filter Statistik"
      >
        <Filter size={13} />
        {(selectedEventTypes.length > 0 || excludeMT) && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#168a53]" />
        )}
      </button>
    </div>,
    headerSlot
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={32} className="animate-spin text-[#168a53]" />
        <p className="text-slate-400 text-xs font-medium">Memuat statistik dashboard...</p>
      </div>
    );
  }

  const persenAktif = stats.totalGenerus > 0
    ? Math.round((stats.aktifGenerus / stats.totalGenerus) * 100)
    : 0;

  const firstEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
  const firstEventTargets = firstEvent
    ? (Array.isArray(firstEvent.target_kategori)
        ? firstEvent.target_kategori
        : (firstEvent.target_kategori ? JSON.parse(firstEvent.target_kategori) : []))
    : [];

  const getRankBadgeClass = (idx) => {
    if (idx === 0) return 'bg-amber-50 text-amber-700 border-amber-200/80';
    if (idx === 1) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (idx === 2) return 'bg-amber-50/60 text-amber-600 border-amber-200/60';
    return 'bg-emerald-50 text-[#168a53] border-emerald-200/80';
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full py-4 sm:py-6 space-y-4 sm:space-y-6">
      {mobileTopActions}

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Selamat Datang <span className="inline-block">👋</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
            Pantau statistik dan perkembangan ke-Generus-an secara realtime.
          </p>
        </div>

        {/* Filter Toggle Button (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowFilterDrawer(v => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              showFilterDrawer || selectedEventTypes.length > 0 || excludeMT
                ? 'bg-emerald-50 border-emerald-200 text-[#168a53]'
                : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={13} />
            <span>Filter Statistik</span>
            {(selectedEventTypes.length > 0 || excludeMT) && (
              <span className="w-2 h-2 rounded-full bg-[#168a53]" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilterDrawer && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={excludeMT}
              onChange={(e) => setExcludeMT(e.target.checked)}
              className="w-4 h-4 text-[#168a53] rounded border-slate-300 focus:ring-[#168a53]"
            />
            <span className="text-xs font-bold text-slate-700">
              Kecualikan MT dari Peringkat Kehadiran
            </span>
          </label>

          <div className="w-full sm:w-72">
            <CustomMultiSelect
              options={eventTypes}
              value={selectedEventTypes}
              onChange={setSelectedEventTypes}
              placeholder="Semua Template Acara"
            />
          </div>
        </div>
      )}

      {/* ── 3 Stat Cards Row (Horizontal swipe on mobile, 3-col grid on desktop) */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2.5 sm:grid sm:grid-cols-3 sm:gap-5 pb-1 sm:pb-0">
        {/* Card 1: TOTAL GENERUS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 min-w-[145px] sm:min-w-0 flex-1 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              TOTAL GENERUS
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[#168a53]">
              <Users size={18} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {stats.totalGenerus}
            </p>
            <p className="text-[11px] sm:text-xs font-bold text-[#168a53] mt-1.5 sm:mt-2 truncate">
              {stats.aktifGenerus} aktif ({persenAktif}%)
            </p>
          </div>
        </div>

        {/* Card 2: RATA-RATA KEHADIRAN */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 min-w-[145px] sm:min-w-0 flex-1 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              RATA-RATA KEHADIRAN
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.4} />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {stats.rataKehadiran}%
            </p>
            <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-1.5 sm:mt-2 truncate">
              Selama tahun ini {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Card 3: AGENDA BULAN INI */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 min-w-[145px] sm:min-w-0 flex-1 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              AGENDA BULAN INI
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-amber-500">
              <Calendar size={18} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {stats.acaraBulanIni}
            </p>
            <p className="text-[11px] sm:text-xs font-bold text-amber-600 mt-1.5 sm:mt-2 truncate">
              Acara terjadwal
            </p>
          </div>
        </div>
      </div>

      {/* ── Middle Row: Charts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

        {/* Bar Chart — Demografi per Kelompok (Aktif) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-1.5 h-4.5 bg-[#168a53] rounded-full" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Demografi per Kelompok (Aktif)
            </h3>
          </div>

          <div className="w-full overflow-x-auto hide-scrollbar">
            <div className="h-56 sm:h-64 min-w-[320px] sm:min-w-0 w-full">
              {demografiData.length === 0 ? (
                <EmptyState message="Belum ada data demografi kelompok." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demografiData} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                      dy={6}
                      interval={0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: '#94a3b8' }}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(20,184,166,0.05)', radius: 6 }} />
                    <Bar dataKey="jumlah" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Donut Chart — Sebaran Kategori */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4.5 bg-blue-500 rounded-full" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Sebaran Kategori
            </h3>
          </div>

          <div className="relative h-40 sm:h-48 flex items-center justify-center my-auto">
            {kategoriData.length === 0 ? (
              <EmptyState message="Belum ada data kategori." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kategoriData}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {kategoriData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Donut Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-extrabold text-slate-800 leading-none">
                    {kategoriData.reduce((acc, c) => acc + (Number(c.value) || 0), 0)}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 mt-0.5">Total</span>
                </div>
              </>
            )}
          </div>

          {/* Donut Legend */}
          {kategoriData.length > 0 && (
            <div className="flex flex-wrap justify-center gap-x-2.5 sm:gap-x-3 gap-y-1 sm:gap-y-1.5 mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 max-h-24 sm:max-h-none overflow-y-auto hide-scrollbar">
              {kategoriData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row: 3 Detail Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Card 1: Acara Terdekat */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={13} strokeWidth={2.4} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Acara Terdekat</h3>
            </div>
            {upcomingEvents.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 font-extrabold text-xs flex items-center justify-center">
                {upcomingEvents.length}
              </span>
            )}
          </div>

          <div className="my-3 sm:my-4 flex-1">
            {firstEvent ? (
              <div className="space-y-2">
                <p className="font-extrabold text-slate-900 text-sm leading-snug">
                  {firstEvent.name}
                </p>
                <p className="text-xs font-bold text-[#168a53] flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>
                    {new Date(firstEvent.event_date).toLocaleDateString('id-ID', {
                      weekday: 'short', day: 'numeric', month: 'short'
                    })}
                  </span>
                  <span>·</span>
                  <span>{firstEvent.start_time?.substring(0, 5)} WIB</span>
                </p>

                {firstEventTargets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5 sm:pt-2">
                    {firstEventTargets.map(t => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-[#168a53] border border-emerald-200/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="Belum ada agenda terdekat." />
            )}
          </div>

          <div className="pt-2 mt-auto">
            {firstEvent ? (
              <button
                disabled={firstEvent.is_closed}
                onClick={() => !firstEvent.is_closed && navigate(`/admin/attendance/${firstEvent.id}`)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                  firstEvent.is_closed
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#168a53] hover:bg-[#127344] text-white shadow-xs cursor-pointer active:scale-95'
                }`}
              >
                {firstEvent.is_closed ? 'Acara Ditutup' : 'Buka Absensi'}
              </button>
            ) : null}
          </div>
        </div>

        {/* Card 2: Peringkat Kehadiran */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award size={14} strokeWidth={2.4} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Peringkat Kehadiran</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Tahun Ini</span>
          </div>

          <div className="divide-y divide-slate-100/80 flex-1 my-1">
            {topAttendees.length === 0 ? (
              <EmptyState message="Belum ada data absensi." />
            ) : (
              topAttendees.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 sm:gap-3 py-2 sm:py-2.5">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border ${getRankBadgeClass(idx)}`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-xs truncate">{item.nama_lengkap}</p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase">
                        {item.kelompok}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        item.is_pengurus ? 'bg-emerald-50 text-[#168a53]' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.is_pengurus ? `${item.jenjang || ''}, PENGURUS` : item.jenjang}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-sm sm:text-base text-[#168a53] leading-none">{item.total_hadir}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">HADIR</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Kelompok Paling Rajin */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#168a53] flex items-center justify-center">
                <Medal size={14} strokeWidth={2.4} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Kelompok Paling Rajin</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Tahun Ini</span>
          </div>

          <div className="divide-y divide-slate-100/80 flex-1 my-1">
            {topGroups.length === 0 ? (
              <EmptyState message="Belum ada data absensi." />
            ) : (
              topGroups.slice(0, 5).map((group, idx) => (
                <div key={idx} className="flex items-center gap-2.5 sm:gap-3 py-2 sm:py-2.5">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 ${
                    idx === 0
                      ? 'bg-[#168a53] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-xs text-slate-800 uppercase tracking-wide truncate">
                      {group.kelompok}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 truncate">
                      Akumulasi kehadiran
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-extrabold text-sm sm:text-base leading-none ${idx === 0 ? 'text-[#168a53]' : 'text-slate-800'}`}>
                      {group.total_hadir}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">HADIR</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
