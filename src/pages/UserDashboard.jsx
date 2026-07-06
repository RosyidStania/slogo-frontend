import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Star, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function UserDashboard() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/user/report');
      setReport(res.data.data);
    } catch (error) {
      console.error("Gagal mengambil data report:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!report || !report.generus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-6">
          <AlertCircle size={40} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Akun Belum Tertaut
        </h1>
        <p className="text-slate-500 max-w-sm">
          Akun Anda belum dihubungkan dengan data Generus. Silakan hubungi admin.
        </p>
      </div>
    );
  }

  const { generus, summary, details, history } = report;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Profile */}
      <div className="relative rounded-3xl p-8 shadow-xl shadow-teal-500/10 overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6 border border-white/50 bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 text-white group">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative w-24 h-24 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center shrink-0 border border-white/30 shadow-inner group-hover:scale-105 transition-transform duration-500">
          <Star size={40} strokeWidth={1.5} className="drop-shadow-md" />
        </div>
        <div className="relative text-center md:text-left flex-1 z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 drop-shadow-sm">{generus.nama_lengkap}</h1>
          <p className="text-teal-50 font-medium mb-5 text-sm md:text-base opacity-90">{generus.kelompok} • {generus.jenjang}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-2 rounded-full text-sm font-semibold shadow-sm hover:bg-white/20 transition-colors">
              ID: {generus.id}
            </span>
            <span className="bg-white text-teal-700 px-5 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-shadow">
              Hadir: {summary.percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Statistik Keseluruhan */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">Rapor Kehadiran Global</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center group">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300"><CheckCircle size={24} className="text-teal-500" /></div>
            <p className="text-3xl font-black text-slate-800 mb-1">{summary.hadir}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hadir</p>
          </div>
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center group">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300"><XCircle size={24} className="text-red-500" /></div>
            <p className="text-3xl font-black text-slate-800 mb-1">{summary.alfa}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alfa</p>
          </div>
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300"><Clock size={24} className="text-blue-500" /></div>
            <p className="text-3xl font-black text-slate-800 mb-1">{summary.izin}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Izin</p>
          </div>
        </div>
      </div>

      {/* Rincian per Kegiatan */}
      {details.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">Rincian Per Kegiatan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {details.map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:border-teal-200 hover:shadow-md transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-teal-50 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-150"></div>
                <div className="flex justify-between items-start mb-5 relative z-10">
                  <h3 className="font-bold text-slate-800">{item.event_type}</h3>
                  <span className="text-[10px] font-black px-2.5 py-1.5 bg-teal-50 text-teal-700 rounded-lg uppercase tracking-wider border border-teal-100/50">
                    {item.percentage}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full mb-5 overflow-hidden shadow-inner relative z-10">
                  <div 
                    className="bg-gradient-to-r from-teal-400 to-teal-500 h-full rounded-full transition-all duration-1000 relative" 
                    style={{ width: `${item.percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 translate-x-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 relative z-10">
                  <div>
                    <p className="text-slate-400 mb-0.5 text-[10px] uppercase font-bold tracking-wider">Hadir</p>
                    <p className="font-black text-teal-600 text-sm">{item.hadir}</p>
                  </div>
                  <div className="border-l border-r border-slate-200">
                    <p className="text-slate-400 mb-0.5 text-[10px] uppercase font-bold tracking-wider">Alfa</p>
                    <p className="font-black text-red-500 text-sm">{item.alfa}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-0.5 text-[10px] uppercase font-bold tracking-wider">Izin</p>
                    <p className="font-black text-blue-500 text-sm">{item.izin}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Riwayat Absensi */}
      {history && history.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">Riwayat Kehadiran Terbaru</h2>
          <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Tanggal</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Kegiatan</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-center">Status</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Waktu Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {history.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-slate-700 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('id-ID', {
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-slate-800">{item.event_name}</p>
                        <p className="text-xs text-slate-400">{item.event_type}</p>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                          item.status === 'hadir' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                          item.status === 'alpa' ? 'bg-red-50 text-red-700 border-red-100' :
                          item.status === 'izin' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-500 italic">
                        {item.status === 'hadir' && item.time_arrived && item.time_arrived !== '-' ? (
                          <span className={item.is_late ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                            {item.is_late ? `Terlambat (Tiba ${item.time_arrived})` : `Tiba jam ${item.time_arrived}`}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}