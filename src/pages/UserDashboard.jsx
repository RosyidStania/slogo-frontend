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
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shrink-0">
          <Star size={40} strokeWidth={1.5} />
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-slate-800 mb-1">{generus.nama_lengkap}</h1>
          <p className="text-slate-500 mb-4">{generus.kelompok} • {generus.jenjang}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium">
              ID: {generus.id}
            </span>
            <span className="bg-teal-50 border border-teal-100 text-teal-700 px-4 py-1.5 rounded-full text-sm font-medium">
              Persentase Hadir: {summary.percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Statistik Keseluruhan */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">Rapor Kehadiran Global</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-slate-400 mb-2"><CheckCircle size={24} className="text-teal-500" /></div>
            <p className="text-3xl font-black text-slate-800 mb-1">{summary.hadir}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hadir</p>
          </div>
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-slate-400 mb-2"><XCircle size={24} className="text-red-500" /></div>
            <p className="text-3xl font-black text-slate-800 mb-1">{summary.alfa}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alfa</p>
          </div>
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-slate-400 mb-2"><Clock size={24} className="text-blue-500" /></div>
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
              <div key={idx} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800">{item.event_type}</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-teal-50 text-teal-700 rounded-lg">
                    {item.percentage}% Hadir
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full mb-4 overflow-hidden">
                  <div 
                    className="bg-teal-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-slate-400 mb-1">Hadir</p>
                    <p className="font-bold text-slate-700">{item.hadir}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Alfa</p>
                    <p className="font-bold text-slate-700">{item.alfa}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Izin</p>
                    <p className="font-bold text-slate-700">{item.izin}</p>
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
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
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