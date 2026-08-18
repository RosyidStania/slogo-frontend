import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Layers, Loader2, Download, Search, AlertCircle, Filter, ChevronDown, FileUp } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function CustomSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedOption = options.find(o => o.value == value) || null;

  return (
    <div className="relative w-full md:w-auto" ref={containerRef}>
      <div 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-4 pl-4 pr-3 py-2.5 bg-white/80 border border-slate-200/80 rounded-xl text-sm font-bold text-slate-700 shadow-sm cursor-pointer hover:bg-white transition-colors select-none min-w-[150px]"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-50 top-full right-0 md:left-0 md:right-auto mt-1.5 w-max min-w-full bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden py-1.5 max-h-64 overflow-y-auto thin-scrollbar">
          {options.map(opt => (
            <div 
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors ${value == opt.value ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MtAttendance() {
  const [loading, setLoading] = useState(false);
  
  const [eventTypes, setEventTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const [reportData, setReportData] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [kelompok, setKelompok] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenjang, setFilterJenjang] = useState([]);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('id-ID', { month: 'short' });
    return `${day} ${month}`;
  };

  useEffect(() => {
    if (selectedType && selectedYear) {
      fetchReport();
    } else {
      // First load, let's fetch to get event types and years
      fetchReportInit();
    }
  }, [selectedType, selectedYear]);

  const fetchReportInit = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mt/group-attendance');
      if (res.data.success) {
        setEventTypes(res.data.eventTypes || []);
        if (res.data.eventTypes?.length > 0) setSelectedType(res.data.eventTypes[0].id.toString());
        
        setAvailableYears(res.data.availableYears || [new Date().getFullYear()]);
        if (res.data.year) setSelectedYear(res.data.year.toString());
        
        setReportData(res.data.data || []);
        setEventsList(res.data.events || []);
        setKelompok(res.data.kelompok || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mt/group-attendance', {
        params: { event_type_id: selectedType, year: selectedYear }
      });
      if (res.data.success) {
        setEventTypes(res.data.eventTypes || []);
        setAvailableYears(res.data.availableYears || [new Date().getFullYear()]);
        setReportData(res.data.data || []);
        setEventsList(res.data.events || []);
        setKelompok(res.data.kelompok || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hasPengurus = reportData.some(d => d.is_pengurus);
  const uniqueJenjang = [...new Set(reportData.map(d => d.jenjang))].filter(Boolean);
  if (hasPengurus && !uniqueJenjang.includes('PENGURUS')) {
    uniqueJenjang.push('PENGURUS');
  }

  const filteredData = reportData.filter(g => {
    const matchName = g.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJenjang = filterJenjang.length === 0 ? true : filterJenjang.some(j => {
      if (j === 'PENGURUS') return !!g.is_pengurus;
      return g.jenjang === j;
    });
    return matchName && matchJenjang;
  });

  const toggleJenjang = (j) => {
    if (j === '') setFilterJenjang([]);
    else setFilterJenjang(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]);
  };

  const exportToExcel = async () => {
    if (!filteredData.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekapan Absensi', {
      views: [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2' }]
    });

    const typeName = eventTypes.find(t => t.id.toString() === selectedType)?.name || 'Kategori';
    const titleText = `Rekapan_${kelompok}_${typeName.replace(/\s+/g, '_')}_Tahun_${selectedYear}.xlsx`;

    const columns = [
      { header: 'NO', key: 'no', width: 5 },
      { header: 'NAMA LENGKAP', key: 'nama', width: 30 },
      { header: 'JENJANG', key: 'jenjang', width: 15 },
      { header: 'STATUS', key: 'status', width: 12 },
    ];

    eventsList.forEach(e => {
      columns.push({ header: formatDate(e.event_date).toUpperCase(), key: `event_${e.id}`, width: 12 });
    });

    worksheet.columns = columns;

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Poppins', bold: true, color: { argb: 'FF334155' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    });
    headerRow.height = 30;

    filteredData.forEach((g, index) => {
      const rowData = {
        no: index + 1,
        nama: g.nama_lengkap,
        jenjang: g.is_pengurus ? `${g.jenjang || ''}, PENGURUS` : (g.jenjang || ''),
        status: g.status ? g.status.toUpperCase() : '',
      };

      eventsList.forEach(e => {
        rowData[`event_${e.id}`] = g.events_attendance[e.id] === '-' ? '' : (g.events_attendance[e.id] || '');
      });

      const row = worksheet.addRow(rowData);
      
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Poppins' };
        cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
        cell.alignment = { vertical: 'middle' };

        if (colNumber === 1 || colNumber === 3 || colNumber === 4) cell.alignment = { vertical: 'middle', horizontal: 'center' };

        if (colNumber === 4 && cell.value) {
          const val = cell.value.toString().replace(/\s+/g, '');
          if (val === 'AKTIF') cell.font = { name: 'Poppins', color: { argb: 'FF10B981' }, bold: true };
          else if (val === 'NONAKTIF' || val === 'TIDAKAKTIF') cell.font = { name: 'Poppins', color: { argb: 'FFEF4444' }, bold: true };
        }

        if (colNumber > 4 && cell.value) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { name: 'Poppins', bold: true };
          if (cell.value === 'H') { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; cell.font.color = { argb: 'FFFFFFFF' }; }
          else if (cell.value === 'A') { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } }; cell.font.color = { argb: 'FFFFFFFF' }; }
          else if (cell.value === 'I') { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } }; cell.font.color = { argb: 'FFFFFFFF' }; }
          else if (cell.value === 'S') { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }; cell.font.color = { argb: 'FFFFFFFF' }; }
        }
      });
    });

    worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, titleText);
  };

  const getStatusCellClass = (status) => {
    switch(status) {
      case 'H': return 'bg-emerald-500 text-white font-black';
      case 'A': return 'bg-red-500 text-white font-black';
      case 'I': return 'bg-amber-400 text-white font-black';
      case 'S': return 'bg-blue-500 text-white font-black';
      default: return 'bg-white text-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="relative z-20 bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[20px] p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Rekapan Absensi Kelompok {kelompok}</h1>
            <p className="text-sm text-slate-500 mt-1">Pantau absensi bulanan berdasarkan jenis kegiatan.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <CustomSelect 
              options={availableYears.map(y => ({ value: y.toString(), label: y.toString() }))}
              value={selectedYear}
              onChange={setSelectedYear}
              placeholder="Tahun"
            />

            <CustomSelect 
              options={eventTypes.map(t => ({ value: t.id.toString(), label: t.name }))}
              value={selectedType ? selectedType.toString() : ''}
              onChange={setSelectedType}
              placeholder="Pilih Kategori Acara"
            />

            <button 
              onClick={exportToExcel}
              disabled={!filteredData.length}
              className="w-full md:w-auto justify-center flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <FileUp size={16} className="text-teal-500" /> Export
            </button>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[20px] overflow-hidden flex flex-col h-auto md:h-[calc(100vh-180px)]">
          
          <div className="bg-slate-50/50 p-4 border-b border-slate-100 shrink-0 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
              <div className="relative w-full sm:max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama generus..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 text-sm bg-white rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm transition-all"
                />
              </div>
              <div className="px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 flex items-center shrink-0 shadow-sm">
                Total: {filteredData.length} Data
              </div>
            </div>
            
            <div className="flex flex-col xl:flex-row gap-4">
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1 flex items-center gap-1.5">
                  <Filter size={11} className="text-emerald-500" /> Jenjang
                </p>
                <div className="flex flex-wrap gap-2">
                  {['', ...uniqueJenjang].map(j => {
                    const label = j === '' ? 'Semua' : j;
                    const active = j === '' ? filterJenjang.length === 0 : filterJenjang.includes(j);
                    return (
                      <button key={label} onClick={() => toggleJenjang(j)}
                        className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto thin-scrollbar h-[500px] md:h-auto">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <Loader2 size={32} className="animate-spin text-teal-500" />
                <p className="text-slate-400 font-medium text-sm">Memuat rekapan absensi...</p>
              </div>
            ) : !selectedType ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <Layers size={32} className="text-slate-300" />
                <p className="text-slate-400 font-medium text-sm">Pilih kategori acara terlebih dahulu.</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <AlertCircle size={32} className="text-slate-300" />
                <p className="text-slate-400 font-medium text-sm">Tidak ada data ditemukan.</p>
              </div>
            ) : (
              <div className="w-max min-w-full pb-4">
              <table className="text-left border-collapse">
                <thead className="md:sticky top-0 z-40 shadow-sm">
                  <tr>
                    <th className="px-2 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 text-center bg-slate-100 md:sticky md:left-0 z-30 w-[50px] min-w-[50px] md:shadow-[1px_0_0_#e2e8f0]">#</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 bg-slate-100 md:sticky md:left-[50px] z-30 w-[220px] min-w-[220px] md:shadow-[1px_0_0_#e2e8f0]">Nama</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 text-center bg-slate-100 md:sticky md:left-[270px] z-30 w-[100px] min-w-[100px] md:shadow-[1px_0_0_#e2e8f0]">Jenjang</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 text-center bg-slate-100 md:sticky md:left-[370px] z-30 w-[100px] min-w-[100px] md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">Status</th>
                    
                    {eventsList.map(e => (
                      <th key={e.id} className="px-2 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 text-center bg-slate-50 min-w-[70px] w-[70px]">
                        <div className="flex flex-col items-center gap-1">
                          <span>{formatDate(e.event_date)}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((g, idx) => (
                    <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-2 py-2 text-xs text-slate-400 font-semibold text-center border border-slate-200 bg-white md:sticky md:left-0 z-20 md:shadow-[1px_0_0_#e2e8f0]">{idx + 1}</td>
                      <td className="px-4 py-2 border border-slate-200 bg-white md:sticky md:left-[50px] z-20 md:shadow-[1px_0_0_#e2e8f0]">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${g.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                            {g.nama_lengkap.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate w-[150px]">
                            <p className="text-sm font-bold text-slate-700 truncate">{g.nama_lengkap}</p>
                            <p className="text-[10px] text-slate-400">{g.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center border border-slate-200 bg-white md:sticky md:left-[270px] z-20 md:shadow-[1px_0_0_#e2e8f0]">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase">
                          {g.is_pengurus ? `${g.jenjang || ''}, PENGURUS` : (g.jenjang || '-')}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center border border-slate-200 bg-white md:sticky md:left-[370px] z-20 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                          g.status?.toLowerCase() === 'aktif' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {g.status}
                        </span>
                      </td>
                      
                      {eventsList.map(e => {
                        const mStatus = g.events_attendance[e.id];
                        const cellClass = mStatus && mStatus !== '-' ? getStatusCellClass(mStatus) : 'bg-white text-slate-200';
                        return (
                          <td key={e.id} className={`p-0 text-center border border-slate-200 align-middle w-[70px] min-w-[70px] text-xs transition-colors ${cellClass}`}>
                            {mStatus && mStatus !== '-' ? mStatus : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
