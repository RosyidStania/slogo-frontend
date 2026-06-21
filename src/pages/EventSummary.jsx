import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Users, CheckCircle, XCircle, AlertCircle, Clock, Filter, ChevronDown, Download, MapPin } from 'lucide-react';

export default function EventSummary() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [attendances, setAttendances] = useState([]);
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

  useEffect(() => { fetchSummaryData(); }, [eventId]);

  const fetchSummaryData = async () => {
    try {
      const response = await api.get(`/admin/events/${eventId}/summary`);
      setEvent(response.data.event);
      setAttendances(response.data.attendances || []);
    } catch (error) {
      console.error('Gagal mengambil data rekapan:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = attendances.filter(item => {
    const matchKelompok = filterKelompok === 'Semua' || item.generus.kelompok.toLowerCase() === filterKelompok.toLowerCase();
    let matchStatus = true;
    if (filterStatus !== 'Semua') {
      if (filterStatus === 'Terlambat') {
        matchStatus = (Number(item.is_late) === 1);
      } else {
        matchStatus = item.status.toLowerCase() === filterStatus.toLowerCase();
      }
    }
    return matchKelompok && matchStatus;
  });

  const globalStats = {
    total: attendances.length,
    hadir: attendances.filter(a => a.status === 'hadir').length,
    terlambat: attendances.filter(a => Number(a.is_late) === 1).length,
    izin: attendances.filter(a => a.status === 'izin' || a.status === 'sakit').length,
    alpa: attendances.filter(a => a.status === 'alpa').length,
  };

  const groupStats = kelompokList.filter(k => k !== 'Semua').map(kelompok => {
    const groupData = attendances.filter(a => a.generus.kelompok.toLowerCase() === kelompok.toLowerCase());
    return {
      name: kelompok,
      total: groupData.length,
      hadir: groupData.filter(a => a.status === 'hadir').length,
      izin: groupData.filter(a => a.status === 'izin' || a.status === 'sakit').length,
      alpa: groupData.filter(a => a.status === 'alpa').length,
    };
  }).filter(g => g.total > 0);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">Memuat rekapan...</p>
      </div>
    </div>
  );
  if (!event) return <div className="p-10 text-center text-red-500">Acara tidak ditemukan.</div>;

  return (
    <div className="animate-in fade-in duration-300 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/events')} className="p-3 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 rounded-xl transition-colors text-slate-500 shadow-sm"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rekapan Absensi</h1>
            <p className="text-slate-400 text-sm mt-0.5">{event.name} • {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <button className="w-full md:w-auto justify-center bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm shadow-sm transition-all active:scale-95"><Download size={16} strokeWidth={2} /> Export Excel</button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-2"><Users size={20} /></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
          <h3 className="text-2xl font-black text-slate-800">{globalStats.total}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-2"><CheckCircle size={20} /></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hadir</p>
          <h3 className="text-2xl font-black text-emerald-600">{globalStats.hadir}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-2"><Clock size={20} /></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terlambat</p>
          <h3 className="text-2xl font-black text-red-600">{globalStats.terlambat}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-2"><AlertCircle size={20} /></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Izin/Sakit</p>
          <h3 className="text-2xl font-black text-amber-600">{globalStats.izin}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-2"><XCircle size={20} /></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alpa</p>
          <h3 className="text-2xl font-black text-rose-600">{globalStats.alpa}</h3>
        </div>
      </div>

      {/* PER KELOMPOK */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} className="text-teal-500" />
          <h2 className="text-base font-bold text-slate-800">Rekapan per Kelompok</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groupStats.map((stat, index) => (
            <div key={index} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-800 text-base">{stat.name}</h4>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">{stat.total} Peserta</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-emerald-50 rounded-xl py-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold uppercase text-emerald-600 mb-0.5">Hadir</span>
                  <span className="text-lg font-black text-emerald-700">{stat.hadir}</span>
                </div>
                <div className="flex-1 bg-amber-50 rounded-xl py-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold uppercase text-amber-600 mb-0.5">Izin</span>
                  <span className="text-lg font-black text-amber-700">{stat.izin}</span>
                </div>
                <div className="flex-1 bg-rose-50 rounded-xl py-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold uppercase text-rose-600 mb-0.5">Alpa</span>
                  <span className="text-lg font-black text-rose-700">{stat.alpa}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative w-full sm:w-56 shrink-0" ref={dropdownKelRef}>
          <button type="button" onClick={() => setIsDropdownKelompokOpen(!isDropdownKelompokOpen)} className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none shadow-sm text-slate-800 font-bold text-sm transition-all text-left flex justify-between items-center hover:bg-slate-50">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Filter className="h-4 w-4 text-slate-400" /></div>
            <span className="truncate">{filterKelompok === 'Semua' ? 'Semua Kelompok' : filterKelompok}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isDropdownKelompokOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownKelompokOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in">
              {kelompokList.map(k => (
                <button key={k} onClick={() => { setFilterKelompok(k); setIsDropdownKelompokOpen(false); }} className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors ${filterKelompok === k ? 'bg-teal-50 text-teal-600' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {k === 'Semua' ? 'Semua Kelompok' : k}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative w-full sm:w-48 shrink-0" ref={dropdownStatusRef}>
          <button type="button" onClick={() => setIsDropdownStatusOpen(!isDropdownStatusOpen)} className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none shadow-sm text-slate-800 font-bold text-sm transition-all text-left flex justify-between items-center hover:bg-slate-50">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><CheckCircle className="h-4 w-4 text-slate-400" /></div>
            <span className="truncate">{filterStatus === 'Semua' ? 'Semua Status' : filterStatus}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isDropdownStatusOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownStatusOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in">
              {statusList.map(s => (
                <button key={s} onClick={() => { setFilterStatus(s); setIsDropdownStatusOpen(false); }} className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors ${filterStatus === s ? 'bg-teal-50 text-teal-600' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {s === 'Semua' ? 'Semua Status' : s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-center w-12">No</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Biodata Peserta</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm">Tidak ada data yang sesuai filter.</td></tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                    <td className="px-6 py-3 text-center font-medium text-slate-500 text-sm">{index + 1}</td>
                    <td className="px-6 py-3">
                      <p className="font-bold text-slate-800 text-sm">{item.generus.nama_lengkap}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{item.generus.kelompok} • {item.generus.kategori}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-lg border flex w-fit items-center gap-1.5 ${
                        item.status === 'hadir' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        item.status === 'izin' || item.status === 'sakit' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {item.status === 'hadir' && <CheckCircle size={14}/>}
                        {item.status === 'alpa' && <XCircle size={14}/>}
                        {(item.status === 'izin' || item.status === 'sakit') && <AlertCircle size={14}/>}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {item.status === 'hadir' ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{item.time_arrived?.substring(0,5)} WIB</span>
                          {Number(item.is_late) === 1 ? <span className="text-[10px] font-bold text-red-500 uppercase mt-0.5">Terlambat</span> : null}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 font-medium">-</span>
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
  );
}