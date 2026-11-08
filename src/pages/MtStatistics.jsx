import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../api/axios';
import {
  Users, TrendingUp, Calendar, Award, RotateCw, Loader2,
  CheckCircle2, Clock, Activity, AlertCircle, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

const PIE_COLORS = [
  '#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#3b82f6', '#d97706', '#14b8a6', '#6366f1',
  '#ec4899', '#64748b', '#eab308', '#a855f7', '#f97316'
];

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="relative bg-slate-900 text-white px-3 py-2 rounded-xl text-center shadow-2xl text-xs font-bold leading-tight pointer-events-none">
      <p className="text-[11px] text-slate-300 capitalize">{label}</p>
      <p className="text-white text-xs font-extrabold mt-0.5">{payload[0].value}% Hadir</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl">
      <span className="capitalize">{item.name}: </span>
      <span className="text-emerald-400 font-extrabold">{item.value} Generus</span>
    </div>
  );
};

function EmptyState({ message = 'Belum ada data statistik.' }) {
  return (
    <div className="h-full min-h-[140px] flex items-center justify-center text-slate-400 text-xs py-8">
      {message}
    </div>
  );
}

export default function MtStatistics() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);
  const [headerSlot, setHeaderSlot] = useState(() => document.getElementById('layout-header-actions'));

  const [data, setData] = useState({
    kelompok: '',
    stats: { totalAnggota: 0, anggotaAktif: 0, rataKehadiran: 0, totalAcara: 0 },
    memberStats: [],
    jenjangDistribution: [],
    perTypeStats: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mt/group-statistics', {
        params: { year: selectedYear }
      });
      if (res.data.success) {
        setData(res.data);
        if (res.data.availableYears?.length) {
          setAvailableYears(res.data.availableYears);
        }
      }
    } catch (e) {
      console.error(e);
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
  }, [selectedYear]);

  const topAttendees = [...data.memberStats].sort((a, b) => b.total_hadir - a.total_hadir).slice(0, 10);
  const persenAktif = data.stats.totalAnggota > 0
    ? Math.round((data.stats.anggotaAktif / data.stats.totalAnggota) * 100)
    : 0;

  const barChartData = data.perTypeStats.map(t => ({
    name: t.name,
    kehadiran: t.percentage || 0,
    totalHadir: t.total_hadir || 0,
  }));

  const getRankBadgeClass = (idx) => {
    if (idx === 0) return 'bg-amber-50 text-amber-700 border-amber-200/80';
    if (idx === 1) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (idx === 2) return 'bg-amber-50/60 text-amber-600 border-amber-200/60';
    return 'bg-emerald-50 text-[#168a53] border-emerald-200/80';
  };

  // Header top action buttons portal
  const topActions = (
    <div className="flex items-center gap-2">
      {/* Year Selector */}
      <div className="relative">
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          className="appearance-none flex items-center gap-2 pl-3.5 pr-8 py-1.5 bg-white border border-slate-200/90 rounded-full text-xs font-bold text-slate-700 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer focus:outline-none"
        >
          {availableYears.map(y => (
            <option key={y} value={y.toString()}>Tahun {y}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {/* Reload Button */}
      <button
        type="button"
        onClick={fetchData}
        disabled={loading}
        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-700 bg-white border border-slate-200/80 rounded-full hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        title="Muat Ulang Statistik"
      >
        <RotateCw size={13} className={loading ? 'animate-spin text-emerald-600' : ''} />
      </button>
    </div>
  );

  return (
    <div className="min-h-full font-sans">
      {headerSlot && ReactDOM.createPortal(topActions, headerSlot)}

      <div className="w-full py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Statistik Kelompok {data.kelompok && <span className="text-[#168a53]">{data.kelompok}</span>}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
              Pantau performa kehadiran dan sebaran data generus kelompok Anda secara realtime.
            </p>
          </div>

          <div className="flex lg:hidden items-center gap-2 shrink-0">
            {!headerSlot && topActions}
          </div>
        </div>

        {/* 3 Summary Stat Cards matching Dashboard.jsx */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2.5 sm:grid sm:grid-cols-3 sm:gap-5 pb-1 sm:pb-0">
          {/* Card 1: TOTAL ANGGOTA */}
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
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none tabular-nums">
                {data.stats.totalAnggota}
              </p>
              <p className="text-[11px] sm:text-xs font-bold text-[#168a53] mt-1.5 sm:mt-2 truncate">
                {data.stats.anggotaAktif} aktif ({persenAktif}%)
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
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none tabular-nums">
                {data.stats.rataKehadiran}%
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-1.5 sm:mt-2 truncate">
                Tahun {selectedYear}
              </p>
            </div>
          </div>

          {/* Card 3: TOTAL ACARA */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 min-w-[145px] sm:min-w-0 flex-1 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                TOTAL ACARA
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-amber-500">
                <Calendar size={18} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2.2} />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none tabular-nums">
                {data.stats.totalAcara || 0}
              </p>
              <p className="text-[11px] sm:text-xs font-bold text-amber-600 mt-1.5 sm:mt-2 truncate">
                Acara terjadwal kelompok & desa
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

          {/* Bar Chart — Kehadiran per Kategori Acara */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-1.5 h-4.5 bg-[#168a53] rounded-full" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Rata-rata Kehadiran per Kategori (%)
              </h3>
            </div>

            <div className="w-full overflow-x-auto hide-scrollbar">
              <div className="h-56 sm:h-64 min-w-[300px] sm:min-w-0 w-full">
                {barChartData.length === 0 ? (
                  <EmptyState message="Belum ada data kehadiran kegiatan." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                        domain={[0, 100]}
                      />
                      <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(20,184,166,0.05)', radius: 6 }} />
                      <Bar dataKey="kehadiran" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Donut Chart — Sebaran Jenjang Kelompok */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-4.5 bg-blue-500 rounded-full" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Sebaran Jenjang
              </h3>
            </div>

            <div className="relative h-40 sm:h-48 flex items-center justify-center my-auto">
              {data.jenjangDistribution.length === 0 ? (
                <EmptyState message="Belum ada data jenjang." />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.jenjangDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={72}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {data.jenjangDistribution.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-extrabold text-slate-800 leading-none">
                      {data.jenjangDistribution.reduce((acc, c) => acc + (Number(c.value) || 0), 0)}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">Total</span>
                  </div>
                </>
              )}
            </div>

            {/* Donut Legend */}
            {data.jenjangDistribution.length > 0 && (
              <div className="flex flex-wrap justify-center gap-x-2.5 sm:gap-x-3 gap-y-1 sm:gap-y-1.5 mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 max-h-24 sm:max-h-none overflow-y-auto hide-scrollbar">
                {data.jenjangDistribution.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase">
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Peringkat Kehadiran & Ringkasan Acara */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

          {/* Top 10 Attendees Leaderboard */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award size={13} strokeWidth={2.4} />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">Peringkat Kehadiran (Top 10)</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">Tahun {selectedYear}</span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto hide-scrollbar pr-1">
              {topAttendees.length === 0 ? (
                <EmptyState message="Belum ada riwayat kehadiran generus." />
              ) : (
                topAttendees.map((member, index) => {
                  const maxHadir = topAttendees[0]?.total_hadir || 1;
                  const ratio = Math.min(100, Math.round((member.total_hadir / maxHadir) * 100));

                  return (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold border ${getRankBadgeClass(index)}`}>
                        #{index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-end mb-1 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover:text-[#168a53] transition-colors">
                              {member.nama_lengkap}
                            </p>
                            {member.jenjang && (
                              <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                {member.jenjang}
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 text-[11px] font-extrabold text-[#168a53] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 tabular-nums">
                            {member.total_hadir} Hadir ({member.percentage}%)
                          </span>
                        </div>

                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              index === 0 ? 'bg-amber-400' :
                              index === 1 ? 'bg-slate-400' :
                              index === 2 ? 'bg-amber-500' :
                              'bg-[#168a53]'
                            }`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Ringkasan Kehadiran Kategori Acara */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#168a53] flex items-center justify-center">
                  <Activity size={13} strokeWidth={2.4} />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">Ringkasan Kategori Acara</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">{data.perTypeStats.length} Kategori</span>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto hide-scrollbar">
              {data.perTypeStats.length === 0 ? (
                <EmptyState message="Belum ada kegiatan pada tahun ini." />
              ) : (
                data.perTypeStats.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className="text-emerald-700 font-bold">{item.total_hadir} Hadir</span> · {item.total_izin} Izin · {item.total_alfa} Alfa
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-[#168a53] border border-emerald-200/60 tabular-nums">
                      {item.percentage}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
