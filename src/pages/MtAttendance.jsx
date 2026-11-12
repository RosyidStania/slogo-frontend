import { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import api from '../api/axios';
import {
  Layers, Loader2, Search, AlertCircle, Filter,
  ChevronDown, FileUp, X, Check, Users, Calendar, Activity
} from 'lucide-react';
import { loadExcelJsAndSaver } from '../utils/lazyImports';

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
    <div className="relative w-full sm:w-auto" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full sm:w-auto flex items-center justify-between gap-2.5 px-3.5 py-2 bg-white border border-slate-200/90 rounded-full text-xs font-bold text-slate-700 shadow-2xs hover:border-slate-300 transition-all select-none cursor-pointer min-w-0 sm:min-w-[140px]"
      >
        <span className="truncate">{getLabel()}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 w-max min-w-full max-w-[280px] bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden py-1.5 max-h-64 overflow-y-auto z-[100] animate-in fade-in zoom-in-95 duration-100">
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
                className={`px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors flex justify-between items-center gap-2 ${
                  isSelected ? 'bg-teal-50 text-[#14b8a6] font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {multiple && isSelected && (
                  <Check size={14} className="text-[#14b8a6] shrink-0" strokeWidth={2.5} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MtAttendance() {
  const [loading, setLoading] = useState(false);
  const [headerSlot, setHeaderSlot] = useState(() => document.getElementById('layout-header-actions'));

  const [eventTypes, setEventTypes] = useState([]);
  const [selectedType, setSelectedType] = useState([]);

  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const [reportData, setReportData] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [kelompok, setKelompok] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
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
      'bg-blue-50 text-blue-700 border-blue-200/60',
      'bg-orange-50 text-orange-700 border-orange-200/60',
      'bg-teal-50 text-teal-700 border-teal-200/60',
      'bg-purple-50 text-purple-700 border-purple-200/60',
      'bg-rose-50 text-rose-700 border-rose-200/60',
      'bg-cyan-50 text-cyan-700 border-cyan-200/60',
      'bg-amber-50 text-amber-700 border-amber-200/60',
      'bg-indigo-50 text-indigo-700 border-indigo-200/60',
      'bg-lime-50 text-lime-700 border-lime-200/60',
      'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60',
      'bg-sky-50 text-sky-700 border-sky-200/60',
      'bg-pink-50 text-pink-700 border-pink-200/60',
      'bg-teal-50 text-teal-700 border-teal-200/60',
      'bg-red-50 text-red-700 border-red-200/60',
      'bg-violet-50 text-violet-700 border-violet-200/60',
      'bg-yellow-50 text-yellow-700 border-yellow-200/60'
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

    return mapping[eventTypeId] || 'bg-slate-50 text-slate-600 border-slate-200/60';
  };

  const fetchReportInit = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mt/group-attendance');
      if (res.data.success) {
        setEventTypes(res.data.eventTypes || []);
        if (res.data.eventTypes?.length > 0) {
          setSelectedType([res.data.eventTypes[0].id.toString()]);
        }
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
        params: { event_type_id: selectedType.join(','), year: selectedYear }
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

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setHeaderSlot(document.getElementById('layout-header-actions'));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (selectedType.length > 0 && selectedYear) {
      fetchReport();
    } else {
      if (eventTypes.length === 0) {
        fetchReportInit();
      } else {
        setReportData([]);
        setEventsList([]);
      }
    }
  }, [selectedType, selectedYear]);

  const uniqueJenjang = useMemo(() => {
    const baseJenjang = ['MT', 'USMAN', '3 SMA/SMK', '2 SMA/SMK', '1 SMA/SMK', '3 SMP', '2 SMP', '1 SMP', '6 SD', '5 SD', '4 SD', '3 SD', '2 SD', '1 SD', 'TK', 'PAUD'];
    const jenjangSet = new Set();
    let hasUsman = false;
    let hasMudaMudi = false;
    let hasKetua = false;
    for (const g of reportData) {
      if (g.jenjang) jenjangSet.add(g.jenjang);
      if (g.is_pengurus) hasUsman = true;
      if (g.is_pengurus_muda_mudi) hasMudaMudi = true;
      if (g.is_ketua_wakil_kelompok) hasKetua = true;
    }
    const list = baseJenjang.filter(j => jenjangSet.has(j));
    if (hasUsman) list.push('PENGURUS USMAN');
    if (hasMudaMudi) list.push('PENGURUS MUDA MUDI');
    if (hasKetua) list.push('KETUA/WAKIL KELOMPOK');
    return list;
  }, [reportData]);

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return reportData.filter(g => {
      const matchName = g.nama_lengkap.toLowerCase().includes(q);
      const matchJenjang = filterJenjang.length === 0 ? true : filterJenjang.some(f => {
        if (f === 'PENGURUS USMAN') return !!g.is_pengurus;
        if (f === 'PENGURUS MUDA MUDI') return !!g.is_pengurus_muda_mudi;
        if (f === 'KETUA/WAKIL KELOMPOK') return !!g.is_ketua_wakil_kelompok;
        return g.jenjang === f;
      });
      return matchName && matchJenjang;
    });
  }, [reportData, searchTerm, filterJenjang]);

  const toggleJenjang = (j) => {
    if (j === '') setFilterJenjang([]);
    else setFilterJenjang(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]);
  };

  // Metrics
  const { totalGenerus, totalRecordedCount, avgAttendancePercent } = useMemo(() => {
    let hadirCount = 0;
    let recordedCount = 0;
    for (const g of filteredData) {
      for (const e of eventsList) {
        const stat = g.events_attendance[e.id];
        if (stat && stat !== '-') {
          recordedCount++;
          if (stat === 'H') hadirCount++;
        }
      }
    }
    return {
      totalGenerus: filteredData.length,
      totalRecordedCount: recordedCount,
      avgAttendancePercent: recordedCount > 0 ? Math.round((hadirCount / recordedCount) * 100) : 0,
    };
  }, [filteredData, eventsList]);

  // Export to Excel matching ReportByType
  const exportToExcel = async () => {
    if (!filteredData.length) return;

    const { ExcelJS, saveAs } = await loadExcelJsAndSaver();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekapan Absensi', {
      views: [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2' }]
    });

    const typeName = eventTypes.filter(t => selectedType.includes(t.id.toString())).map(t => t.name).join('_') || 'Kategori';
    const titleText = `Rekapan_${kelompok || 'Kelompok'}_${typeName.replace(/\s+/g, '_')}_Tahun_${selectedYear}.xlsx`;

    const columns = [
      { header: 'NO', key: 'no', width: 5 },
      { header: 'STATUS', key: 'status', width: 8 },
      { header: 'NAMA LENGKAP', key: 'nama', width: 30 },
      { header: 'JENJANG', key: 'jenjang', width: 15 },
      { header: 'RECAP', key: 'recap', width: 10 },
    ];

    eventsList.forEach(e => {
      columns.push({
        header: formatDate(e.event_date).toUpperCase(),
        key: `event_${e.id}`,
        width: 14
      });
    });

    worksheet.columns = columns;

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Poppins', bold: true, color: { argb: 'FF334155' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' }
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
        no: index + 1,
        status: g.status ? g.status.toUpperCase() : '',
        nama: g.nama_lengkap,
        jenjang: (g.is_pengurus ? 'PENGURUS USMAN, ' : '') + 
                 (g.is_pengurus_muda_mudi ? 'PENGURUS MUDA MUDI, ' : '') + 
                 (g.is_ketua_wakil_kelompok ? 'KETUA/WAKIL KELOMPOK, ' : '') + 
                 (g.jenjang || ''),
        recap: totalParticipant === 0 ? '-' : `${present}/${totalParticipant}`
      };

      eventsList.forEach(e => {
        rowData[`event_${e.id}`] = g.events_attendance[e.id] === '-' ? '' : (g.events_attendance[e.id] || '');
      });

      const row = worksheet.addRow(rowData);

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Poppins' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        cell.alignment = { vertical: 'middle' };

        if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        if (colNumber === 2 && cell.value) {
          const val = cell.value.toString().replace(/\s+/g, '');
          if (val === 'AKTIF') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
          } else if (val === 'PASIF') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
          } else if (val === 'NONAKTIF' || val === 'TIDAKAKTIF') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
          }
          cell.value = '';
        }

        if (colNumber > 5 && cell.value) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { name: 'Poppins', bold: true };
          if (cell.value === 'H') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
            cell.font.color = { argb: 'FFFFFFFF' };
          } else if (cell.value === 'A') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
            cell.font.color = { argb: 'FFFFFFFF' };
          } else if (cell.value === 'I') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
            cell.font.color = { argb: 'FFFFFFFF' };
          } else if (cell.value === 'S') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
            cell.font.color = { argb: 'FFFFFFFF' };
          }
        }
      });
    });

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, titleText);
  };

  const getStatusCellClass = (status) => {
    switch(status) {
      case 'H': return 'bg-teal-500 text-white font-black';
      case 'A': return 'bg-red-500 text-white font-black';
      case 'I': return 'bg-amber-400 text-white font-black';
      case 'S': return 'bg-blue-500 text-white font-black';
      default: return 'bg-white text-slate-200';
    }
  };

  // Header top action button portal
  const topActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={exportToExcel}
        disabled={!filteredData.length}
        className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] active:scale-95 disabled:opacity-50 text-white rounded-full font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
      >
        <FileUp size={13} strokeWidth={2.5} />
        <span>Export Excel</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-full font-sans">
      {headerSlot && ReactDOM.createPortal(topActions, headerSlot)}

      <div className="w-full py-4 sm:py-6 space-y-4 sm:space-y-5">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-[26px] sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Rekapan Absensi Kelompok {kelompok && <span className="text-[#14b8a6]">{kelompok}</span>}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Pantau matriks kehadiran generus kelompok Anda berdasarkan kategori kegiatan dan tahun.
            </p>
          </div>

          <div className="flex lg:hidden items-center gap-2 shrink-0">
            {!headerSlot && topActions}
          </div>
        </div>

        {/* 3 Summary Stat Cards matching ReportByType */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2.5 sm:grid sm:grid-cols-3 sm:gap-4 pb-1 sm:pb-0">
          {/* Total Generus */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 min-w-[130px] flex-1 shrink-0 flex flex-col justify-between sm:flex-row sm:items-center gap-2 sm:gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between sm:hidden w-full">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={14} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                Generus
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 truncate">Total Generus</p>
                <p className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {totalGenerus} Orang
                </p>
              </div>
            </div>

            <div className="sm:hidden mt-0.5">
              <p className="text-[11px] font-medium text-slate-400">Total Generus</p>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
                {totalGenerus} <span className="text-xs font-medium text-slate-400">Orang</span>
              </p>
            </div>

            <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 shrink-0">
              Terfilter
            </span>
          </div>

          {/* Rata-rata Kehadiran */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 min-w-[130px] flex-1 shrink-0 flex flex-col justify-between sm:flex-row sm:items-center gap-2 sm:gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between sm:hidden w-full">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#14b8a6] flex items-center justify-center">
                <Activity size={14} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-[#14b8a6] border border-teal-200/60">
                {totalRecordedCount > 0 ? `${avgAttendancePercent}%` : '0%'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#14b8a6] flex items-center justify-center shrink-0">
                <Activity size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 truncate">Rata-rata Hadir</p>
                <p className="text-lg sm:text-xl font-extrabold text-[#14b8a6] tracking-tight leading-snug">
                  {totalRecordedCount > 0 ? `${avgAttendancePercent}%` : '-'}
                </p>
              </div>
            </div>

            <div className="sm:hidden mt-0.5">
              <p className="text-[11px] font-medium text-slate-400">Rata-rata Hadir</p>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
                {totalRecordedCount > 0 ? `${avgAttendancePercent}%` : '-'}
              </p>
            </div>

            <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-[#14b8a6] border border-teal-200/60 shrink-0">
              Akumulasi
            </span>
          </div>

          {/* Total Kegiatan */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 min-w-[130px] flex-1 shrink-0 flex flex-col justify-between sm:flex-row sm:items-center gap-2 sm:gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between sm:hidden w-full">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Calendar size={14} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                {selectedYear}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Calendar size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 truncate">Total Kegiatan</p>
                <p className="text-lg sm:text-xl font-extrabold text-amber-700 tracking-tight leading-snug">
                  {eventsList.length} Kegiatan
                </p>
              </div>
            </div>

            <div className="sm:hidden mt-0.5">
              <p className="text-[11px] font-medium text-slate-400">Kegiatan</p>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
                {eventsList.length} <span className="text-xs font-medium text-slate-400">Acara</span>
              </p>
            </div>

            <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
              Tahun {selectedYear}
            </span>
          </div>
        </div>

        {/* Primary Filters & Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Year Selector */}
            <CustomSelect
              options={availableYears.map(y => ({ value: y.toString(), label: `Tahun ${y}` }))}
              value={selectedYear}
              onChange={setSelectedYear}
              placeholder="Pilih Tahun"
            />

            {/* Event Types Multi Select */}
            <CustomSelect
              multiple
              options={eventTypes.map(t => ({ value: t.id.toString(), label: t.name }))}
              value={selectedType}
              onChange={setSelectedType}
              placeholder="Kategori Acara"
            />
          </div>

          {/* Search & Filter Trigger */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama generus..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-full border border-slate-200/90 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/15 focus:border-[#14b8a6] shadow-2xs transition-all font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2 text-xs font-bold rounded-full border flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap ${
                showFilters || filterJenjang.length > 0
                  ? 'bg-teal-50 border-teal-200 text-[#14b8a6]'
                  : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={13} />
              <span>Filter</span>
              {filterJenjang.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Jenjang Filter Drawer */}
        {showFilters && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] animate-in fade-in slide-in-from-top-2 duration-150">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter size={11} className="text-teal-600" /> Filter Jenjang & Jabatan
                </p>
                {filterJenjang.length > 0 && (
                  <button
                    onClick={() => setFilterJenjang([])}
                    className="text-[10px] font-bold text-[#14b8a6] hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['', ...uniqueJenjang].map(j => {
                  const label = j === '' ? 'Semua' : j;
                  const active = j === '' ? filterJenjang.length === 0 : filterJenjang.includes(j);
                  return (
                    <button
                      key={label}
                      onClick={() => toggleJenjang(j)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#14b8a6] text-white shadow-2xs'
                          : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Keterangan Warna Kategori */}
        {selectedType.length > 0 && eventTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Warna Acara:</span>
            {selectedType.map(id => {
              const type = eventTypes.find(t => t.id.toString() === id);
              if (!type) return null;
              return (
                <div key={id} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getEventTypeColor(type.id)} flex items-center gap-1.5`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  {type.name}
                </div>
              );
            })}
          </div>
        )}

        {/* Main Matrix Table Container */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col" style={{ minHeight: '520px' }}>
          
          <div className="flex-1 overflow-auto thin-scrollbar">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-3">
                <Loader2 size={32} className="animate-spin text-[#14b8a6]" />
                <p className="text-slate-400 font-medium text-xs">Memuat rekapan absensi kelompok...</p>
              </div>
            ) : selectedType.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#14b8a6] flex items-center justify-center">
                  <Layers size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800">Pilih Kategori Acara</h3>
                <p className="text-slate-500 text-xs max-w-sm">
                  Silakan pilih satu atau beberapa kategori kegiatan di atas untuk menampilkan rekapan absensi.
                </p>
              </div>
            ) : eventsList.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800">Tidak Ada Kegiatan</h3>
                <p className="text-slate-500 text-xs max-w-sm">
                  Tidak ditemukan jadwal atau acara yang sesuai pada tahun {selectedYear}.
                </p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
                  <Users size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800">Peserta Tidak Ditemukan</h3>
                <p className="text-slate-500 text-xs max-w-sm">
                  Tidak ada data peserta yang cocok dengan kata kunci pencarian atau filter jenjang yang aktif.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200/80 sticky top-0 z-20">
                    <th className="py-3 px-3.5 text-center w-12 sticky left-0 bg-slate-50 z-30 shadow-[1px_0_0_rgba(0,0,0,0.06)]">
                      #
                    </th>
                    <th className="py-3 px-4 min-w-[200px] sticky left-12 bg-slate-50 z-30 shadow-[1px_0_0_rgba(0,0,0,0.06)]">
                      Nama Peserta
                    </th>
                    <th className="py-3 px-3.5 min-w-[110px] text-center">
                      Jenjang
                    </th>
                    <th className="py-3 px-3 min-w-[85px] text-center bg-slate-100/60 font-black">
                      Rekap
                    </th>
                    {eventsList.map(e => (
                      <th
                        key={e.id}
                        className="py-2.5 px-3 min-w-[95px] text-center border-l border-slate-200/60 whitespace-nowrap"
                        title={e.name}
                      >
                        <div className="font-extrabold text-slate-800 text-[11px]">{formatDate(e.event_date)}</div>
                        <div className={`mt-0.5 inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${getEventTypeColor(e.event_type_id)} truncate max-w-[85px]`}>
                          {e.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((g, idx) => {
                    let hadir = 0;
                    let totalAcara = 0;
                    eventsList.forEach(e => {
                      const stat = g.events_attendance[e.id];
                      if (stat && stat !== '-') {
                        totalAcara++;
                        if (stat === 'H') hadir++;
                      }
                    });

                    const roleBadges = [];
                    if (g.is_pengurus) roleBadges.push('PENGURUS USMAN');
                    if (g.is_pengurus_muda_mudi) roleBadges.push('PENGURUS MUDA MUDI');
                    if (g.is_ketua_wakil_kelompok) roleBadges.push('KETUA/WAKIL KELOMPOK');

                    return (
                      <tr key={g.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Column 1: Index */}
                        <td className="py-3 px-3.5 text-center font-bold text-slate-400 tabular-nums sticky left-0 bg-white group-hover:bg-slate-50/90 z-10 shadow-[1px_0_0_rgba(0,0,0,0.06)]">
                          {idx + 1}
                        </td>

                        {/* Column 2: Nama */}
                        <td className="py-3 px-4 sticky left-12 bg-white group-hover:bg-slate-50/90 z-10 shadow-[1px_0_0_rgba(0,0,0,0.06)]">
                          <p className="font-extrabold text-slate-800 text-xs sm:text-sm leading-tight truncate max-w-[200px]">
                            {g.nama_lengkap}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {g.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </p>
                        </td>

                        {/* Column 3: Jenjang */}
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            {roleBadges.map(rb => (
                              <span key={rb} className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-teal-50 text-teal-700 border border-teal-200/60 rounded">
                                {rb}
                              </span>
                            ))}
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {g.jenjang || '-'}
                            </span>
                          </div>
                        </td>

                        {/* Column 4: Recap */}
                        <td className="py-3 px-3 text-center bg-slate-50/60 font-extrabold text-[#14b8a6] tabular-nums">
                          {totalAcara === 0 ? (
                            <span className="text-slate-300 font-normal">-</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200/60 text-xs">
                              {hadir}/{totalAcara}
                            </span>
                          )}
                        </td>

                        {/* Events Attendance Columns */}
                        {eventsList.map(e => {
                          const status = g.events_attendance[e.id] || '-';
                          return (
                            <td key={e.id} className="py-3 px-3 text-center border-l border-slate-100">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shadow-2xs select-none ${getStatusCellClass(status)}`}>
                                {status === '-' ? '·' : status}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Footer info bar */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-extrabold text-slate-800">{filteredData.length}</span> dari {reportData.length} peserta
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-teal-500" /> Hadir (H)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-400" /> Izin (I)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Sakit (S)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-red-500" /> Alfa (A)
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
