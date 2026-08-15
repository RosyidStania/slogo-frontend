import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, TrendingUp, AlertCircle, MapPin, Loader2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e', '#ec4899', '#10b981'];

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
      <p className="text-teal-400">{payload[0].value}</p>
    </div>
  );
};

export default function MtStatistics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kelompok: '',
    stats: { totalAnggota: 0, anggotaAktif: 0, rataKehadiran: 0 },
    memberStats: [],
    jenjangDistribution: [],
    perTypeStats: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/mt/group-statistics');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 size={32} className="animate-spin text-teal-500" />
      <p className="text-slate-500 text-sm">Menyiapkan statistik...</p>
    </div>
  );

  const statCards = [
    { icon: <Users size={18} />, iconClass: 'bg-teal-50 text-teal-600', label: 'Total Anggota', value: data.stats.totalAnggota, sub: 'Orang', subClass: 'text-slate-400' },
    { icon: <Users size={18} />, iconClass: 'bg-emerald-50 text-emerald-600', label: 'Anggota Aktif', value: data.stats.anggotaAktif, sub: 'Orang', subClass: 'text-emerald-600' },
    { icon: <TrendingUp size={18} />, iconClass: 'bg-blue-50 text-blue-600', label: 'Rata-rata Kehadiran', value: `${data.stats.rataKehadiran}%`, sub: 'Berdasarkan semua acara', subClass: 'text-blue-600' },
  ];

  const topAttendees = [...data.memberStats].sort((a, b) => b.total_hadir - a.total_hadir).slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Statistik Kelompok {data.kelompok}</h1>
          <p className="text-slate-500 text-sm mt-0.5">Pantau statistik dan kehadiran kelompok Anda.</p>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <SectionTitle accent="bg-teal-400">Kehadiran per Anggota (Top 10)</SectionTitle>
            </div>
            <div className="p-4 h-64">
              {topAttendees.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAttendees} margin={{ top: 4, right: 4, left: -20, bottom: 20 }}>
                    <XAxis dataKey="nama_lengkap" axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={6} angle={-45} textAnchor="end" height={40} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20,184,166,0.06)', radius: 6 }} />
                    <Bar dataKey="total_hadir" name="Hadir" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <SectionTitle accent="bg-blue-400">Sebaran Jenjang</SectionTitle>
            </div>
            <div className="p-4">
              <div className="h-48">
                {data.jenjangDistribution.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.jenjangDistribution} cx="50%" cy="50%" innerRadius="42%" outerRadius="72%" paddingAngle={4} dataKey="value" stroke="none">
                        {data.jenjangDistribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3">
                {data.jenjangDistribution.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[9px] font-bold text-slate-500 capitalize">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <SectionTitle accent="bg-amber-400">Kehadiran per Kategori Acara</SectionTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide border-b border-slate-100">
                    <th className="px-4 py-2 text-left">Kategori</th>
                    <th className="px-4 py-2 text-center">Hadir</th>
                    <th className="px-4 py-2 text-center">Alfa</th>
                    <th className="px-4 py-2 text-center">Izin/Sakit</th>
                    <th className="px-4 py-2 text-center">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perTypeStats.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-slate-400">Belum ada data.</td></tr>
                  ) : data.perTypeStats.map((item, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2 font-semibold text-slate-700">{item.name}</td>
                      <td className="px-4 py-2 text-center text-emerald-600 font-bold">{item.total_hadir}</td>
                      <td className="px-4 py-2 text-center text-red-600 font-bold">{item.total_alfa}</td>
                      <td className="px-4 py-2 text-center text-amber-600 font-bold">{item.total_izin}</td>
                      <td className="px-4 py-2 text-center text-blue-600 font-bold">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-96 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <SectionTitle accent="bg-emerald-400">Statistik Kehadiran Anggota Lengkap</SectionTitle>
            </div>
            <div className="overflow-auto flex-1 thin-scrollbar">
              <table className="w-full min-w-[500px] text-sm border-collapse">
                <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                  <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wide border-b border-slate-100">
                    <th className="px-4 py-2 text-left">Nama</th>
                    <th className="px-4 py-2 text-center">Jenjang</th>
                    <th className="px-4 py-2 text-center">Hadir</th>
                    <th className="px-4 py-2 text-center">Absen</th>
                    <th className="px-4 py-2 text-center">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.memberStats.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-slate-400">Belum ada data.</td></tr>
                  ) : data.memberStats.map((item, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2 font-semibold text-slate-700">{item.nama_lengkap}</td>
                      <td className="px-4 py-2 text-center"><span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">{item.jenjang || '—'}</span></td>
                      <td className="px-4 py-2 text-center text-emerald-600 font-bold">{item.total_hadir}</td>
                      <td className="px-4 py-2 text-center text-red-600 font-bold">{item.total_absen}</td>
                      <td className="px-4 py-2 text-center text-blue-600 font-bold">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
