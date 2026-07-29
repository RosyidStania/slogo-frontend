import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Users, TrendingUp, Calendar, AlertCircle, ChevronRight,
  MapPin, Award, Medal, Loader2, CheckCircle2, UserCheck,
  ArrowUpRight, Clock, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e'];

// ─── Reusable small components ────────────────────────────────────────────────

function SectionTitle({ accent = 'bg-teal-400', children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-1 h-4 ${accent} rounded-full`} />
      <h3 className="font-bold text-sm text-slate-800">{children}</h3>
    </div>
  );
}

function EmptyState({ message = 'Belum ada data.' }) {
  return (
    <div className="h-full flex items-center justify-center text-slate-400 text-xs py-8">
      {message}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl">
      <p className="mb-0.5 text-slate-300 capitalize">{label}</p>
      <p className="text-teal-400">{payload[0].value} Orang</p>
    </div>
  );
};

const RankBadge = ({ rank }) => {
  const styles = [
    'bg-amber-50 text-amber-600 border border-amber-200',
    'bg-slate-100 text-slate-600 border border-slate-200',
    'bg-orange-50 text-orange-600 border border-orange-200',
  ];
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${styles[rank] ?? 'bg-teal-50 text-teal-600 border border-teal-100'}`}>
      #{rank + 1}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats]             = useState({ totalGenerus: 0, aktifGenerus: 0, rataKehadiran: 0, acaraBulanIni: 0 });
  const [demografiData, setDemografiData] = useState([]);
  const [kategoriData, setKategoriData]   = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [topAttendees, setTopAttendees]   = useState([]);
  const [topGroups, setTopGroups]         = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/dashboard-stats');
      setStats(res.data.stats          ?? { totalGenerus: 0, aktifGenerus: 0, rataKehadiran: 0, acaraBulanIni: 0 });
      setDemografiData(res.data.demografi     ?? []);
      setKategoriData(res.data.kategori       ?? []);
      setUpcomingEvents(res.data.upcomingEvents ?? []);
      setTopAttendees(res.data.topAttendees   ?? []);
      setTopGroups(res.data.topGroups         ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ─── Guards (matches ManageAttendance loading/error states) ────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 size={32} className="animate-spin text-teal-500" />
      <p className="text-slate-500 text-sm">Menyiapkan dashboard...</p>
    </div>
  );

  const persenAktif = stats.totalGenerus > 0
    ? Math.round((stats.aktifGenerus / stats.totalGenerus) * 100)
    : 0;

  // ── Stat cards data ────────────────────────────────────────────────────────
  const statCards = [
    {
      icon: <Users size={18} />,
      iconClass: 'bg-teal-50 text-teal-600',
      label: 'Total Generus',
      value: stats.totalGenerus,
      sub: `${stats.aktifGenerus} aktif (${persenAktif}%)`,
      subClass: 'text-teal-600',
    },
    {
      icon: <TrendingUp size={18} />,
      iconClass: 'bg-blue-50 text-blue-600',
      label: 'Rata-rata Kehadiran',
      value: `${stats.rataKehadiran}%`,
      sub: 'Dari total absensi',
      subClass: 'text-slate-400',
    },
    {
      icon: <Calendar size={18} />,
      iconClass: 'bg-amber-50 text-amber-600',
      label: 'Agenda Bulan Ini',
      value: stats.acaraBulanIni,
      sub: 'Acara terjadwal',
      subClass: 'text-amber-600',
    },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* ── Page header (mirrors ManageAttendance top bar spacing) ───────── */}
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Selamat Datang 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">Pantau statistik dan perkembangan ke-Generus-an.</p>
        </div>

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className={`w-10 h-10 ${s.iconClass} rounded-xl flex items-center justify-center shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold mt-0.5 tabular-nums text-slate-800 leading-tight">{s.value}</p>
                <p className={`text-[10px] font-semibold mt-0.5 ${s.subClass}`}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Bar chart — 2/3 */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <SectionTitle accent="bg-teal-400">Demografi per Kelompok (Aktif)</SectionTitle>
            </div>
            <div className="p-4 h-56">
              {demografiData.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demografiData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20,184,166,0.06)', radius: 6 }} />
                    <Bar dataKey="jumlah" fill="#14b8a6" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pie chart — 1/3 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <SectionTitle accent="bg-blue-400">Sebaran Kategori</SectionTitle>
            </div>
            <div className="p-4">
              <div className="h-40">
                {kategoriData.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={kategoriData} cx="50%" cy="50%"
                        innerRadius="42%" outerRadius="72%"
                        paddingAngle={4} dataKey="value" stroke="none">
                        {kategoriData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3">
                {kategoriData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[9px] font-bold text-slate-500 capitalize">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Upcoming events + leaderboards ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Upcoming events — 1/3 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-500" />
                <h3 className="font-bold text-sm text-slate-800">Acara Terdekat</h3>
              </div>
              {upcomingEvents.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700">
                  {upcomingEvents.length}
                </span>
              )}
            </div>
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {upcomingEvents.length === 0 ? (
                <EmptyState message="Belum ada agenda." />
              ) : upcomingEvents.map(ev => {
                const targets = Array.isArray(ev.target_kategori)
                  ? ev.target_kategori
                  : (ev.target_kategori ? JSON.parse(ev.target_kategori) : []);
                return (
                  <div key={ev.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                    <p className="font-semibold text-slate-800 text-xs leading-tight mb-1">{ev.name}</p>
                    <p className="text-[10px] font-bold text-teal-600 mb-2 flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(ev.event_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' · '}{ev.start_time?.substring(0, 5)} WIB
                    </p>
                    {targets.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {targets.map(t => (
                          <span key={t} className="text-[8px] font-bold uppercase bg-teal-50 text-teal-700 border border-teal-100 px-1.5 py-0.5 rounded-md">{t}</span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/admin/attendance/${ev.id}`)}
                      className="w-full bg-slate-50 hover:bg-teal-500 text-teal-600 hover:text-white border border-teal-100 hover:border-teal-500 transition-all py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 group">
                      Buka Absensi
                      <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top attendees — 1/3 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Award size={15} className="text-amber-500" />
              <h3 className="font-bold text-sm text-slate-800">Peringkat Kehadiran</h3>
              <span className="ml-auto text-[10px] text-slate-400 font-semibold">Tahun ini</span>
            </div>
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {topAttendees.length === 0 ? (
                <EmptyState message="Belum ada data absensi." />
              ) : topAttendees.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <RankBadge rank={idx} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-xs truncate">{item.nama_lengkap}</p>
                    <div className="flex gap-1 mt-1">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold text-slate-500">{item.kelompok}</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold text-slate-500">{item.jenjang}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-teal-600 text-base tabular-nums leading-none">{item.total_hadir}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">hadir</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top groups — 1/3 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Medal size={15} className="text-teal-500" />
              <h3 className="font-bold text-sm text-slate-800">Kelompok Paling Rajin</h3>
              <span className="ml-auto text-[10px] text-slate-400 font-semibold">Tahun ini</span>
            </div>
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {topGroups.length === 0 ? (
                <EmptyState message="Belum ada data absensi." />
              ) : topGroups.map((group, idx) => {
                const isFirst = idx === 0;
                return (
                  <div key={idx} className={`flex items-center gap-3 px-4 py-3 transition-colors ${isFirst ? 'bg-teal-50/60' : 'hover:bg-slate-50'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${isFirst ? 'bg-teal-500 border-teal-500 text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm uppercase truncate ${isFirst ? 'text-teal-700' : 'text-slate-700'}`}>
                        {group.kelompok}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">Akumulasi kehadiran</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-black text-base tabular-nums leading-none ${isFirst ? 'text-teal-600' : 'text-slate-700'}`}>
                        {group.total_hadir}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">hadir</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}