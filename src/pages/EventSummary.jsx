import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Users, CheckCircle, XCircle, AlertCircle, Clock, Filter, ChevronDown, Download, MapPin, Upload } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell, Sector } from 'recharts';
import { read, utils } from 'xlsx';

const renderRoseShape = (props) => {
  const { cx, cy, startAngle, endAngle, fill, percent } = props;
  const dynamicOuterRadius = 45 + (percent * 35);
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={10}
      outerRadius={dynamicOuterRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={3}
    />
  );
};

const renderCustomizedLabel = (props) => {
  const { cx, cy, midAngle, percent } = props;
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const dynamicOuterRadius = 45 + (percent * 35);
  const radius = 10 + (dynamicOuterRadius - 10) * 0.65; 
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="900" style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.5)' }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function EventSummary() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [targetGenerus, setTargetGenerus] = useState([]);
  const [infaqAmount, setInfaqAmount] = useState("");
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

  const fileInputRef = useRef(null);

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

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target.result;
        const wb = read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const data = utils.sheet_to_json(ws);
        
        const mappedAttendances = data.map(row => {
            const eventIdRow = row['ID Acara'] || row.event_id || eventId;
            const kodeUnik = row['Kode Unik Peserta'] || row.kode_unik;
            const generusId = row['ID Peserta'] || row.generus_id || row['ID Peserta (Abaikan saat import)'];
            const status = row['Status Kehadiran'] || row.status || 'hadir';
            const timeArrived = row['Waktu Datang'] || row.time_arrived || null;
            const isLate = row['Terlambat'] === 'Ya' || row.is_late === 1 || row.is_late === 'true' ? 1 : 0;
            
            return {
                event_id: eventIdRow,
                kode_unik: kodeUnik,
                generus_id: generusId,
                status: status.toLowerCase(),
                time_arrived: timeArrived,
                is_late: isLate
            };
        }).filter(a => a.kode_unik || a.generus_id);

        if (mappedAttendances.length === 0) {
            alert('Data kosong atau format tidak sesuai. Pastikan kolom Kode Unik Peserta tersedia.');
            setLoading(false);
            return;
        }

        try {
            await api.post('/admin/attendance/bulk', { attendances: mappedAttendances });
            alert('Berhasil mengimpor data absensi');
            fetchSummaryData(); // refresh data
        } catch (err) {
            alert('Gagal menyimpan data absensi ke server');
            console.error(err);
            setLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Gagal import:', error);
      alert('Gagal membaca file excel/csv');
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummaryData(); }, [eventId]);

  const fetchSummaryData = async () => {
    try {
      const response = await api.get(`/admin/events/${eventId}/summary`);
      setEvent(response.data.event);
      setAttendances(response.data.attendances || []);
      setTargetGenerus(response.data.target_generus || []);
      setInfaqAmount(response.data.event.infaq || "");
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
      const alpaTotal = targetTotal - hadirTotal - izinSakitTotal;

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
  };
  totalStats.percentage = totalStats.targetTotal > 0 ? Math.round((totalStats.hadirTotal / totalStats.targetTotal) * 100) : 0;

  const handleSaveInfaq = async () => {
    try {
      setIsSavingInfaq(true);
      await api.patch(`/admin/events/${eventId}/infaq`, { infaq: infaqAmount });
      alert('Infaq berhasil disimpan');
    } catch (error) {
      console.error('Gagal menyimpan infaq:', error);
      alert('Gagal menyimpan infaq');
    } finally {
      setIsSavingInfaq(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rekapan Absensi</h1>
            <p className="text-slate-500 text-sm mt-0.5">{event.name} • {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} /> Export
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-teal-600 border border-teal-500 text-white font-bold text-sm rounded-xl hover:bg-teal-700 transition-all shadow-sm">
            <Upload size={18} /> Import
          </button>
          <input type="file" ref={fileInputRef} accept=".xlsx, .xls, .csv" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-2"><Users size={20} /></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
          <h3 className="text-2xl font-black text-slate-800">{globalStats.total}</h3>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-2"><CheckCircle size={20} /></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hadir</p>
          <h3 className="text-2xl font-black text-emerald-600">{globalStats.hadir}</h3>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-2"><Clock size={20} /></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terlambat</p>
          <h3 className="text-2xl font-black text-red-600">{globalStats.terlambat}</h3>
        </div>
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-2"><AlertCircle size={20} /></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Izin/Sakit</p>
          <h3 className="text-2xl font-black text-amber-600">{globalStats.izin}</h3>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white p-3.5 sm:p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-2"><XCircle size={20} /></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alpa</p>
          <h3 className="text-2xl font-black text-rose-600">{globalStats.alpa}</h3>
        </div>
      </div>

      {/* REKAPAN KEHADIRAN & INFAQ */}
      <div className="mb-8 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-teal-500" />
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">Rekapan Kehadiran & Infaq</h2>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th rowSpan="2" className="px-4 py-3 font-bold uppercase text-center border-r border-slate-200">No</th>
                <th rowSpan="2" className="px-4 py-3 font-bold uppercase text-center border-r border-slate-200">Kelompok</th>
                <th colSpan="3" className="px-4 py-2 font-bold uppercase text-center border-r border-slate-200 border-b border-slate-200">Jumlah Jamaah</th>
                <th colSpan="3" className="px-4 py-2 font-bold uppercase text-center border-r border-slate-200 border-b border-slate-200">Kehadiran {new Date(event.event_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</th>
                <th rowSpan="2" className="px-4 py-3 font-bold uppercase text-center">%</th>
              </tr>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2 font-bold text-center border-r border-slate-200">Putra</th>
                <th className="px-4 py-2 font-bold text-center border-r border-slate-200">Putri</th>
                <th className="px-4 py-2 font-bold text-center border-r border-slate-200">Jumlah</th>
                <th className="px-4 py-2 font-bold text-center border-r border-slate-200">Putra</th>
                <th className="px-4 py-2 font-bold text-center border-r border-slate-200">Putri</th>
                <th className="px-4 py-2 font-bold text-center border-r border-slate-200">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {groupStats.map((stat, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-center border-r border-slate-100">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700 uppercase border-r border-slate-100">{stat.name}</td>
                  <td className="px-4 py-3 text-center border-r border-slate-100">{stat.targetPutra}</td>
                  <td className="px-4 py-3 text-center border-r border-slate-100">{stat.targetPutri}</td>
                  <td className="px-4 py-3 font-bold text-center border-r border-slate-100">{stat.targetTotal}</td>
                  <td className="px-4 py-3 text-center border-r border-slate-100">{stat.hadirPutra}</td>
                  <td className="px-4 py-3 text-center border-r border-slate-100">{stat.hadirPutri}</td>
                  <td className="px-4 py-3 font-bold text-center border-r border-slate-100">{stat.hadirTotal}</td>
                  <td className="px-4 py-3 font-bold text-center">{stat.percentage}%</td>
                </tr>
              ))}
              
              {/* Total Row */}
              <tr className="bg-slate-50 border-b border-slate-200">
                <td colSpan="2" className="px-4 py-3 font-black text-center text-slate-800 uppercase border-r border-slate-200">Jumlah</td>
                <td className="px-4 py-3 font-bold text-center text-slate-800 border-r border-slate-200">{totalStats.targetPutra}</td>
                <td className="px-4 py-3 font-bold text-center text-slate-800 border-r border-slate-200">{totalStats.targetPutri}</td>
                <td className="px-4 py-3 font-black text-center text-slate-800 border-r border-slate-200">{totalStats.targetTotal}</td>
                <td className="px-4 py-3 font-bold text-center text-slate-800 border-r border-slate-200">{totalStats.hadirPutra}</td>
                <td className="px-4 py-3 font-bold text-center text-slate-800 border-r border-slate-200">{totalStats.hadirPutri}</td>
                <td className="px-4 py-3 font-black text-center text-slate-800 border-r border-slate-200">{totalStats.hadirTotal}</td>
                <td className="px-4 py-3 font-black text-center text-slate-800">{totalStats.percentage}%</td>
              </tr>

              {/* Infaq Row */}
              <tr className="bg-amber-50">
                <td colSpan="2" className="px-4 py-3 font-black text-slate-800 uppercase flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-slate-800 flex items-center justify-center text-[10px] font-bold">R</div>
                  INFAQ
                </td>
                <td colSpan="7" className="px-4 py-3 font-black text-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-xs relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
                      <input 
                        type="number" 
                        value={infaqAmount} 
                        onChange={(e) => setInfaqAmount(e.target.value)} 
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                        placeholder="0"
                      />
                    </div>
                    <button 
                      onClick={handleSaveInfaq}
                      disabled={isSavingInfaq}
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSavingInfaq ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        

        {/* GRAFIK PIE PER KELOMPOK */}
        {groupStats.length > 0 && (
          <div className="mb-8 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
              <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">Rasio Kehadiran per Kelompok</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groupStats.map((stat, idx) => {
                const pieData = [
                  { name: 'Hadir', value: stat.hadirTotal, color: '#14b8a6' },
                  { name: 'Izin/Sakit', value: stat.izinSakitTotal, color: '#f59e0b' },
                  { name: 'Alpa', value: stat.alpaTotal < 0 ? 0 : stat.alpaTotal, color: '#ef4444' }
                ].filter(d => d.value > 0);

                return (
                  <div key={idx} className="flex flex-col items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-extrabold text-slate-700 mb-2 uppercase tracking-wide">{stat.name}</h3>
                    <div className="w-full h-[180px]">
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
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ fontWeight: 'bold' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-4 w-full text-[10px] font-bold">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-teal-50 text-teal-700 rounded-lg"><div className="w-2 h-2 rounded-full bg-teal-500"></div>Hadir: {stat.hadirTotal}</div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Izin: {stat.izinSakitTotal}</div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-700 rounded-lg"><div className="w-2 h-2 rounded-full bg-red-500"></div>Alpa: {stat.alpaTotal}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* FILTERS */}
      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 mb-4">
        <div className="relative w-full sm:w-56 shrink-0" ref={dropdownKelRef}>
          <button type="button" onClick={() => setIsDropdownKelompokOpen(!isDropdownKelompokOpen)} className="w-full pl-8 sm:pl-12 pr-2 sm:pr-4 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-xl outline-none shadow-sm text-slate-800 font-bold text-xs sm:text-sm transition-all text-left flex justify-between items-center hover:bg-slate-50">
            <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-4 flex items-center pointer-events-none"><Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" /></div>
            <span className="truncate">{filterKelompok === 'Semua' ? 'Kelompok' : filterKelompok}</span>
            <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 transition-transform ${isDropdownKelompokOpen ? 'rotate-180' : ''} shrink-0 ml-1`} />
          </button>
          {isDropdownKelompokOpen && (
            <div className="absolute z-50 w-[200px] sm:w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in">
              {kelompokList.map(k => (
                <button key={k} onClick={() => { setFilterKelompok(k); setIsDropdownKelompokOpen(false); }} className={`w-full text-left px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${filterKelompok === k ? 'bg-teal-50 text-teal-600' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {k === 'Semua' ? 'Semua Kelompok' : k}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative w-full sm:w-48 shrink-0" ref={dropdownStatusRef}>
          <button type="button" onClick={() => setIsDropdownStatusOpen(!isDropdownStatusOpen)} className="w-full pl-8 sm:pl-12 pr-2 sm:pr-4 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-xl outline-none shadow-sm text-slate-800 font-bold text-xs sm:text-sm transition-all text-left flex justify-between items-center hover:bg-slate-50">
            <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-4 flex items-center pointer-events-none"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" /></div>
            <span className="truncate">{filterStatus === 'Semua' ? 'Status' : filterStatus}</span>
            <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 transition-transform ${isDropdownStatusOpen ? 'rotate-180' : ''} shrink-0 ml-1`} />
          </button>
          {isDropdownStatusOpen && (
            <div className="absolute z-50 w-[200px] sm:w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in right-0 sm:right-auto">
              {statusList.map(s => (
                <button key={s} onClick={() => { setFilterStatus(s); setIsDropdownStatusOpen(false); }} className={`w-full text-left px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${filterStatus === s ? 'bg-teal-50 text-teal-600' : 'text-slate-700 hover:bg-slate-50'}`}>
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
                <th className="px-3 py-2.5 sm:px-6 sm:py-3.5 text-xs font-bold uppercase tracking-wider text-center w-12">No</th>
                <th className="px-3 py-2.5 sm:px-6 sm:py-3.5 text-xs font-bold uppercase tracking-wider">Biodata Peserta</th>
                <th className="px-3 py-2.5 sm:px-6 sm:py-3.5 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-3 py-2.5 sm:px-6 sm:py-3.5 text-xs font-bold uppercase tracking-wider">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm">Tidak ada data yang sesuai filter.</td></tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2.5 sm:px-6 sm:py-3.5 text-center font-medium text-slate-500 text-sm">{index + 1}</td>
                    <td className="px-3 py-2.5 sm:px-6 sm:py-3.5">
                      <p className="font-bold text-slate-800 text-sm">{item.generus.nama_lengkap}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{item.generus.kelompok} • {item.generus.kategori}</p>
                    </td>
                    <td className="px-3 py-2.5 sm:px-6 sm:py-3.5">
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
                    <td className="px-3 py-2.5 sm:px-6 sm:py-3.5">
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