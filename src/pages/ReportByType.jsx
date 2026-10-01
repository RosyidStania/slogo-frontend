import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Layers, Loader2, Download, Search, AlertCircle, MapPin, Filter, ChevronDown, Upload, FileUp, FileDown } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function CustomSelect({ options, value, onChange, placeholder, multiple = false }) {
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

  const getLabel = () => {
    if (multiple) {
      if (!value || value.length === 0) return placeholder;
      if (value.length === 1) {
        const opt = options.find(o => o.value == value[0]);
        return opt ? opt.label : placeholder;
      }
      return `${value.length} Terpilih`;
    }
    const selectedOption = options.find(o => o.value == value) || null;
    return selectedOption ? selectedOption.label : placeholder;
  };

  return (
    <div className="relative w-full md:w-auto" ref={containerRef}>
      <div 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 md:gap-4 pl-3 md:pl-4 pr-2 md:pr-3 py-2.5 bg-white/80 border border-slate-200/80 rounded-xl text-xs md:text-sm font-bold text-slate-700 shadow-sm cursor-pointer hover:bg-white transition-colors select-none min-w-0 md:min-w-[150px]"
      >
        <span className="truncate">{getLabel()}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-50 top-full right-0 md:left-0 md:right-auto mt-1.5 w-max min-w-full bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden py-1.5 max-h-64 overflow-y-auto thin-scrollbar">
          {options.map(opt => {
            const isSelected = multiple ? (value || []).includes(opt.value) : value == opt.value;
            return (
              <div 
                key={opt.value}
                onClick={() => {
                  if (multiple) {
                    const current = value || [];
                    if (current.includes(opt.value)) {
                      onChange(current.filter(v => v !== opt.value));
                    } else {
                      onChange([...current, opt.value]);
                    }
                  } else {
                    onChange(opt.value);
                    setOpen(false);
                  }
                }}
                className={`px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors flex justify-between items-center ${isSelected ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <span>{opt.label}</span>
                {multiple && isSelected && (
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReportByType() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [selectedType, setSelectedType] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);
  
  const [reportData, setReportData] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelompok, setFilterKelompok] = useState([]);
  const [filterJenjang, setFilterJenjang] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('id-ID', { month: 'short' });
    return `${day} ${month}`;
  };

  const getEventTypeColor = (eventTypeId) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-rose-100 text-rose-800 border-rose-200',
      'bg-cyan-100 text-cyan-800 border-cyan-200',
      'bg-amber-100 text-amber-800 border-amber-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-lime-100 text-lime-800 border-lime-200',
      'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      'bg-sky-100 text-sky-800 border-sky-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-red-100 text-red-800 border-red-200',
      'bg-violet-100 text-violet-800 border-violet-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200'
    ];

    const mapping = {};
    let nextColorIdx = 3; 
    const sortedTypes = [...eventTypes].sort((a, b) => a.id - b.id);
    
    sortedTypes.forEach(type => {
      const name = type.name.toLowerCase();
      if (name.includes('bersih') && !Object.values(mapping).includes(colors[0])) {
        mapping[type.id] = colors[0];
      } else if ((name.includes('musyawarah') || name.includes('musyawaroh')) && !Object.values(mapping).includes(colors[1])) {
        mapping[type.id] = colors[1];
      } else if (name.includes('pengajian') && !Object.values(mapping).includes(colors[2])) {
        mapping[type.id] = colors[2];
      } else {
        mapping[type.id] = colors[nextColorIdx % colors.length];
        nextColorIdx++;
      }
    });

    return mapping[eventTypeId] || 'bg-slate-100 text-slate-500 border-slate-200';
  };

  useEffect(() => {
    fetchEventTypes();
    fetchAvailableYears();
  }, []);

  const fetchAvailableYears = async () => {
    try {
      const res = await api.get('/admin/reports/available-years');
      if (res.data.success && res.data.years) {
        setAvailableYears(res.data.years);
        if (res.data.years.length > 0 && !res.data.years.includes(parseInt(selectedYear))) {
          setSelectedYear(res.data.years[0].toString());
        }
      }
    } catch (err) {
      console.error("Gagal mengambil daftar tahun", err);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const res = await api.get('/admin/event-types');
      setEventTypes(res.data.data || []);
      // Auto-select first type if available
      if (res.data.data?.length > 0) {
        setSelectedType([res.data.data[0].id.toString()]);
      }
    } catch (err) {
      console.error("Gagal mengambil kategori acara", err);
    }
  };

  useEffect(() => {
    if (selectedType.length > 0 && selectedYear) {
      fetchReport();
    } else {
      setReportData([]);
      setEventsList([]);
    }
  }, [selectedType, selectedYear]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/attendance-by-type', {
        params: { event_type_id: selectedType.join(','), year: selectedYear }
      });
      setReportData(res.data.data || []);
      setEventsList(res.data.events || []);
    } catch (err) {
      console.error("Gagal mengambil data laporan", err);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique options for filters
  const uniqueKelompok = [...new Set(reportData.map(d => d.kelompok))].filter(Boolean).sort();
  
  const baseJenjang = ['MT', 'USMAN', '3 SMA/SMK', '2 SMA/SMK', '1 SMA/SMK', '3 SMP', '2 SMP', '1 SMP', '6 SD', '5 SD', '4 SD', '3 SD', '2 SD', '1 SD', 'TK', 'PAUD'];
  const uniqueJenjang = baseJenjang.filter(j => reportData.some(g => g.jenjang === j));
  
  if (reportData.some(g => g.is_pengurus)) uniqueJenjang.push('PENGURUS USMAN');
  if (reportData.some(g => g.is_pengurus_muda_mudi)) uniqueJenjang.push('PENGURUS MUDA MUDI');
  if (reportData.some(g => g.is_ketua_wakil_kelompok)) uniqueJenjang.push('KETUA/WAKIL KELOMPOK');

  const filteredData = reportData.filter(g => {
    const matchName = g.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelompok = filterKelompok.length === 0 ? true : filterKelompok.includes(g.kelompok);
    const matchJenjang = filterJenjang.length === 0 ? true : filterJenjang.some(f => {
      if (f === 'PENGURUS USMAN') return !!g.is_pengurus;
      if (f === 'PENGURUS MUDA MUDI') return !!g.is_pengurus_muda_mudi;
      if (f === 'KETUA/WAKIL KELOMPOK') return !!g.is_ketua_wakil_kelompok;
      return g.jenjang === f;
    });
    return matchName && matchKelompok && matchJenjang;
  });

  const toggleKelompok = (k) => {
    if (k === '') setFilterKelompok([]);
    else setFilterKelompok(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  };

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

    const typeName = eventTypes.filter(t => selectedType.includes(t.id.toString())).map(t => t.name).join('_') || 'Kategori';
    const titleText = `Rekapan_${typeName.replace(/\s+/g, '_')}_Tahun_${selectedYear}.xlsx`;

    // Define Columns
    const columns = [
      { header: 'ID GENERUS', key: 'id', width: 10, hidden: true },
      { header: 'NO', key: 'no', width: 5 },
      { header: 'STATUS', key: 'status', width: 8 },
      { header: 'NAMA LENGKAP', key: 'nama', width: 30 },
      { header: 'JENJANG', key: 'jenjang', width: 15 },
      { header: 'KELOMPOK', key: 'kelompok', width: 15 },
      { header: 'RECAP', key: 'recap', width: 10 },
    ];

    eventsList.forEach(e => {
      columns.push({
        header: formatDate(e.event_date).toUpperCase(),
        key: `event_${e.id}`,
        width: 15
      });
    });

    worksheet.columns = columns;

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Poppins', bold: true, color: { argb: 'FF334155' } }; // Slate-700
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' } // Slate-100 (putih keabuan)
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });
    headerRow.height = 30;

    // Add Data
    filteredData.forEach((g, index) => {
      let present = 0;
      let totalParticipant = 0;
      eventsList.forEach(e => {
        const stat = g.events_attendance[e.id];
        if (stat && stat !== '-') {
          totalParticipant++;
          if (stat === 'H') present++;
        }
      });

      const rowData = {
        id: g.id,
        no: index + 1,
        status: g.status ? g.status.toUpperCase() : '',
        nama: g.nama_lengkap,
        jenjang: (g.is_pengurus ? 'PENGURUS USMAN, ' : '') + (g.is_pengurus_muda_mudi ? 'PENGURUS MUDA MUDI, ' : '') + (g.is_ketua_wakil_kelompok ? 'KETUA/WAKIL KELOMPOK, ' : '') + (g.jenjang || ''),
        kelompok: g.kelompok,
        recap: totalParticipant === 0 ? '-' : `${present}/${totalParticipant}`
      };

      eventsList.forEach(e => {
        rowData[`event_${e.id}`] = g.events_attendance[e.id] === '-' ? '' : (g.events_attendance[e.id] || '');
      });

      const row = worksheet.addRow(rowData);
      
      // Styling Data Row
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Poppins' };

        // Default borders
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        cell.alignment = { vertical: 'middle' };

        if (colNumber === 1 || colNumber === 2 || colNumber === 3 || colNumber === 5 || colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        // Color Status
        if (colNumber === 3 && cell.value) {
          const val = cell.value.toString().replace(/\s+/g, '');
          if (val === 'AKTIF') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; // Green
          } else if (val === 'NONAKTIF' || val === 'TIDAKAKTIF') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } }; // Red
          }
          cell.value = ''; // Remove text
        }

        // Color Attendance
        if (colNumber > 6 && cell.value) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { name: 'Poppins', bold: true };
          if (cell.value === 'H') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; // Emerald-500
            cell.font.color = { argb: 'FFFFFFFF' };
          } else if (cell.value === 'A') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } }; // Red-500
            cell.font.color = { argb: 'FFFFFFFF' };
          } else if (cell.value === 'I') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } }; // Amber-500
            cell.font.color = { argb: 'FFFFFFFF' };
          } else if (cell.value === 'S') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }; // Blue-500
            cell.font.color = { argb: 'FFFFFFFF' };
          }
        }
      });
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length }
    };

    // Save
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
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rekapan Kehadiran per Kategori</h1>
            <p className="text-slate-500 text-sm mt-0.5">Pantau absensi bulanan berdasarkan jenis kegiatan.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Filter Year */}
              <CustomSelect 
                options={availableYears.map(y => ({ value: y.toString(), label: y.toString() }))}
                value={selectedYear}
                onChange={setSelectedYear}
                placeholder="Tahun"
              />

              {/* Filter Kategori */}
              <CustomSelect 
                multiple
                options={eventTypes.map(t => ({ value: t.id.toString(), label: t.name }))}
                value={selectedType}
                onChange={setSelectedType}
                placeholder="Pilih Kategori Acara"
              />
            </div>

            {/* Export Button */}
            <button 
              onClick={exportToExcel}
              disabled={!filteredData.length}
              className="shrink-0 w-full md:w-auto justify-center flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <FileUp size={16} className="text-teal-500" /> <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[20px] overflow-hidden flex flex-col h-[calc(100dvh-280px)] md:h-[calc(100vh-180px)]" style={{ minHeight: '750px' }}>
          
          {/* Toolbar Table */}
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
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <span className="text-slate-500 text-xs font-bold">
                  Total: {filteredData.length} Data
                </span>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 shadow-sm transition-colors ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Filter size={14} /> Filter
                  {(filterKelompok.length > 0 || filterJenjang.length > 0) && (
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  )}
                </button>
              </div>
              
              {/* Keterangan Warna Kategori */}
              {selectedType.length > 0 && eventTypes.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Keterangan Warna:</span>
                  {selectedType.map(id => {
                    const type = eventTypes.find(t => t.id.toString() === id);
                    if (!type) return null;
                    return (
                      <div key={id} className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getEventTypeColor(type.id)} flex items-center gap-1.5`}>
                        <div className="w-2 h-2 rounded-full bg-current opacity-70"></div>
                        {type.name}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {showFilters && (
            <div className="flex flex-col xl:flex-row gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Pill filter: Kelompok */}
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1 flex items-center gap-1.5">
                  <MapPin size={11} className="text-teal-500" /> Kelompok
                </p>
                <div className="flex flex-wrap gap-2">
                  {['', ...uniqueKelompok].map(k => {
                    const label = k === '' ? 'Semua' : k;
                    const cnt = k === '' 
                      ? reportData.length 
                      : reportData.filter(g => g.kelompok === k).length;
                    const active = k === '' ? filterKelompok.length === 0 : filterKelompok.includes(k);
                    return (
                      <button key={label} onClick={() => toggleKelompok(k)}
                        className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          active ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}>
                        {label}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${active ? 'bg-teal-500/50 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {cnt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pill filter: Jenjang */}
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
            )}
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto thin-scrollbar">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <Loader2 size={32} className="animate-spin text-teal-500" />
                <p className="text-slate-400 font-medium text-sm">Memuat rekapan absensi...</p>
              </div>
            ) : selectedType.length === 0 ? (
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
              <table className="w-full text-left border-collapse">
                <thead className="lg:sticky top-0 z-40 shadow-sm">
                  <tr>
                    <th className="px-2 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 text-center bg-slate-100 lg:sticky lg:left-0 z-30 w-[40px] min-w-[40px] lg:shadow-[1px_0_0_#e2e8f0]">#</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 bg-slate-100 lg:sticky lg:left-[40px] z-30 w-[180px] min-w-[180px] lg:shadow-[1px_0_0_#e2e8f0]">Nama</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 text-center bg-slate-100 lg:sticky lg:left-[220px] z-30 w-[220px] min-w-[220px] lg:shadow-[1px_0_0_#e2e8f0]">Jenjang</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 text-center bg-slate-100 lg:sticky lg:left-[440px] z-30 w-[100px] min-w-[100px] lg:shadow-[1px_0_0_#e2e8f0]">Kelompok</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 text-center bg-slate-100 lg:sticky lg:left-[540px] z-30 w-[80px] min-w-[80px] lg:shadow-[1px_0_0_#e2e8f0]">Status</th>
                    <th className="px-2 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 text-center bg-slate-100 lg:sticky lg:left-[620px] z-30 w-[70px] min-w-[70px] lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">Recap</th>
                    
                    {/* Kolom Acara Dinamis */}
                    {eventsList.map(e => (
                      <th key={e.id} className={`px-2 py-4 text-[10px] font-black uppercase tracking-widest border text-center min-w-[70px] w-[70px] ${getEventTypeColor(e.event_type_id)}`}>
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
                      <td className="px-2 py-2 text-xs text-slate-400 font-semibold text-center border border-slate-200 bg-white lg:sticky lg:left-0 z-20 lg:shadow-[1px_0_0_#e2e8f0]">{idx + 1}</td>
                      <td className="px-4 py-2 border border-slate-200 bg-white lg:sticky lg:left-[40px] z-20 lg:shadow-[1px_0_0_#e2e8f0]">
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${g.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                            {g.nama_lengkap.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm font-bold text-slate-700 truncate">{g.nama_lengkap}</p>
                            <p className="text-[10px] text-slate-400 truncate">{g.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center border border-slate-200 bg-white lg:sticky lg:left-[220px] z-20 lg:shadow-[1px_0_0_#e2e8f0]">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase">
                          {(g.is_pengurus ? 'PENGURUS USMAN, ' : '')}{(g.is_pengurus_muda_mudi ? 'PENGURUS MUDA MUDI, ' : '')}{(g.is_ketua_wakil_kelompok ? 'KETUA/WAKIL KELOMPOK, ' : '')}{(g.jenjang || '-')}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center text-xs text-slate-500 font-medium border border-slate-200 bg-white lg:sticky lg:left-[440px] z-20 lg:shadow-[1px_0_0_#e2e8f0]">{g.kelompok}</td>
                      <td className="px-2 py-2 text-center border border-slate-200 bg-white lg:sticky lg:left-[540px] z-20 lg:shadow-[1px_0_0_#e2e8f0]">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                          g.status?.toLowerCase() === 'aktif' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {g.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center text-xs font-bold text-slate-700 border border-slate-200 bg-white lg:sticky lg:left-[620px] z-20 lg:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">
                        {(() => {
                          let present = 0;
                          let totalParticipant = 0;
                          eventsList.forEach(e => {
                            const stat = g.events_attendance[e.id];
                            if (stat && stat !== '-') {
                              totalParticipant++;
                              if (stat === 'H') present++;
                            }
                          });
                          return totalParticipant === 0 ? '-' : `${present}/${totalParticipant}`;
                        })()}
                      </td>
                      
                      {/* Sel Acara Dinamis */}
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
