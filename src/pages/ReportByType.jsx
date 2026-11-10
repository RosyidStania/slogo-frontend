import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import api from '../api/axios';
import {
  Layers, Loader2, Search, AlertCircle, MapPin, Filter,
  ChevronDown, FileUp, X, Check, Users, Calendar, Activity
} from 'lucide-react';
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

export default function ReportByType() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [headerSlot, setHeaderSlot] = useState(() => document.getElementById('layout-header-actions'));

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
  const [mainKelompok, setMainKelompok] = useState('');

  const hasGroupCategory = eventTypes.some(
    t => selectedType.includes(t.id.toString()) && (t.is_group_attendance === 1 || t.is_group_attendance === true)
  );

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
      console.error('Gagal mengambil daftar tahun', err);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const res = await api.get('/admin/event-types');
      setEventTypes(res.data.data || []);
      if (res.data.data?.length > 0) {
        setSelectedType([res.data.data[0].id.toString()]);
      }
    } catch (err) {
      console.error('Gagal mengambil kategori acara', err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/attendance-by-type', {
        params: { event_type_id: selectedType.join(','), year: selectedYear }
      });
      setReportData(res.data.data || []);
      setEventsList(res.data.events || []);
    } catch (err) {
      console.error('Gagal mengambil data laporan', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
    fetchAvailableYears();
    const id = requestAnimationFrame(() => {
      setHeaderSlot(document.getElementById('layout-header-actions'));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (selectedType.length > 0 && selectedYear) {
      fetchReport();
    } else {
      const id = requestAnimationFrame(() => {
        setReportData([]);
        setEventsList([]);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [selectedType, selectedYear]);

  const uniqueKelompok = [...new Set(reportData.map(d => d.kelompok))].filter(Boolean).sort();

  const baseJenjang = ['MT', 'USMAN', '3 SMA/SMK', '2 SMA/SMK', '1 SMA/SMK', '3 SMP', '2 SMP', '1 SMP', '6 SD', '5 SD', '4 SD', '3 SD', '2 SD', '1 SD', 'TK', 'PAUD'];
  const uniqueJenjang = baseJenjang.filter(j => reportData.some(g => g.jenjang === j));

  if (reportData.some(g => g.is_pengurus)) uniqueJenjang.push('PENGURUS USMAN');
  if (reportData.some(g => g.is_pengurus_muda_mudi)) uniqueJenjang.push('PENGURUS MUDA MUDI');
  if (reportData.some(g => g.is_ketua_wakil_kelompok)) uniqueJenjang.push('KETUA/WAKIL KELOMPOK');

  const filteredEventsList = eventsList.filter(e => {
    if (mainKelompok && e.kelompok) return e.kelompok === mainKelompok;
    return true;
  });

  const filteredData = reportData.filter(g => {
    const matchName = g.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelompok = filterKelompok.length === 0 ? true : filterKelompok.includes(g.kelompok);
    const matchMainKelompok = mainKelompok ? g.kelompok === mainKelompok : true;
    const matchJenjang = filterJenjang.length === 0 ? true : filterJenjang.some(f => {
      if (f === 'PENGURUS USMAN') return !!g.is_pengurus;
      if (f === 'PENGURUS MUDA MUDI') return !!g.is_pengurus_muda_mudi;
      if (f === 'KETUA/WAKIL KELOMPOK') return !!g.is_ketua_wakil_kelompok;
      return g.jenjang === f;
    });
    return matchName && matchKelompok && matchMainKelompok && matchJenjang;
  });

  const toggleKelompok = (k) => {
    if (k === '') setFilterKelompok([]);
    else setFilterKelompok(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  };

  const toggleJenjang = (j) => {
    if (j === '') setFilterJenjang([]);
    else setFilterJenjang(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]);
  };

  // Calculation of Summary Metrics
  const totalGenerus = filteredData.length;
  let totalHadirCount = 0;
  let totalRecordedCount = 0;

  filteredData.forEach(g => {
    filteredEventsList.forEach(e => {
      const stat = g.events_attendance[e.id];
      if (stat && stat !== '-') {
        totalRecordedCount++;
        if (stat === 'H') totalHadirCount++;
      }
    });
  });

  const avgAttendancePercent = totalRecordedCount > 0
    ? Math.round((totalHadirCount / totalRecordedCount) * 100)
    : 0;

  const exportToExcel = async () => {
    if (!filteredData.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekapan Absensi', {
      views: [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2' }]
    });

    const typeName = eventTypes.filter(t => selectedType.includes(t.id.toString())).map(t => t.name).join('_') || 'Kategori';
    const titleText = `Rekapan_${typeName.replace(/\s+/g, '_')}_Tahun_${selectedYear}.xlsx`;

    const columns = [
      { header: 'ID GENERUS', key: 'id', width: 10, hidden: true },
      { header: 'NO', key: 'no', width: 5 },
      { header: 'STATUS', key: 'status', width: 8 },
      { header: 'NAMA LENGKAP', key: 'nama', width: 30 },
      { header: 'JENJANG', key: 'jenjang', width: 15 },
      { header: 'KELOMPOK', key: 'kelompok', width: 15 },
      { header: 'RECAP', key: 'recap', width: 10 },
    ];

    filteredEventsList.forEach(e => {
      columns.push({
        header: formatDate(e.event_date).toUpperCase(),
        key: `event_${e.id}`,
        width: 15
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
      filteredEventsList.forEach(e => {
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

      filteredEventsList.forEach(e => {
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

        if (colNumber === 1 || colNumber === 2 || colNumber === 3 || colNumber === 5 || colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        if (colNumber === 3 && cell.value) {
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

        if (colNumber > 6 && cell.value) {
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

  // Full solid colored square for Hadir (Green), Alpa (Red), Izin (Amber), Sakit (Blue)
  const getStatusCellClass = (status) => {
    switch(status) {
      case 'H': return 'bg-teal-500 text-white font-black';
      case 'A': return 'bg-red-500 text-white font-black';
      case 'I': return 'bg-amber-400 text-white font-black';
      case 'S': return 'bg-blue-500 text-white font-black';
      default: return 'bg-white text-slate-200';
    }
  };

  // Mobile Top Action Portal
  const mobileTopActions = headerSlot && ReactDOM.createPortal(
    <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={exportToExcel}
        disabled={!filteredData.length}
        className="flex items-center gap-1 px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] disabled:opacity-50 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
      >
        <FileUp size={13} strokeWidth={2.5} />
        <span>Export</span>
      </button>
    </div>,
    headerSlot
  );

  return (
    <div className="w-full py-4 sm:py-6 space-y-4 sm:space-y-5">
      {mobileTopActions}

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rekapan Absensi</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Pantau matriks kehadiran generus berdasarkan kategori kegiatan dan tahun.
          </p>
        </div>

        {/* Desktop Export Button */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={exportToExcel}
            disabled={!filteredData.length}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#14b8a6] hover:bg-[#0d9488] active:scale-95 disabled:opacity-50 text-white rounded-full font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <FileUp size={14} strokeWidth={2.5} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* ── 3 Summary Stat Cards (iOS Inset Style) ───────────────────────── */}
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
                {filteredEventsList.length} Kegiatan
              </p>
            </div>
          </div>

          <div className="sm:hidden mt-0.5">
            <p className="text-[11px] font-medium text-slate-400">Kegiatan</p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {filteredEventsList.length} <span className="text-xs font-medium text-slate-400">Acara</span>
            </p>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
            Tahun {selectedYear}
          </span>
        </div>
      </div>

      {/* ── Primary Filters & Dropdowns Row ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Year Filter */}
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

          {/* Group Scope Selector */}
          {hasGroupCategory && (
            <CustomSelect
              options={[
                { value: '', label: 'Semua Kelompok' },
                ...uniqueKelompok.map(k => ({ value: k, label: `Kel. ${k}` }))
              ]}
              value={mainKelompok}
              onChange={setMainKelompok}
              placeholder="Pilih Kelompok"
            />
          )}
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
              className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-full border border-slate-200/90 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/15 focus:border-[#14b8a6] shadow-2xs transition-all"
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
              showFilters || filterKelompok.length > 0 || filterJenjang.length > 0
                ? 'bg-teal-50 border-teal-200 text-[#14b8a6]'
                : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={13} />
            <span>Filter</span>
            {(filterKelompok.length > 0 || filterJenjang.length > 0) && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]" />
            )}
          </button>
        </div>
      </div>

      {/* ── Collapsible Secondary Filter Inset ───────────────────────────── */}
      {showFilters && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Kelompok Pills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={11} className="text-teal-600" /> Filter Kelompok
              </p>
              {filterKelompok.length > 0 && (
                <button
                  onClick={() => setFilterKelompok([])}
                  className="text-[10px] font-bold text-[#14b8a6] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['', ...uniqueKelompok].map(k => {
                const label = k === '' ? 'Semua' : k;
                const cnt = k === ''
                  ? reportData.length
                  : reportData.filter(g => g.kelompok === k).length;
                const active = k === '' ? filterKelompok.length === 0 : filterKelompok.includes(k);
                return (
                  <button
                    key={label}
                    onClick={() => toggleKelompok(k)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#14b8a6] text-white shadow-2xs'
                        : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {cnt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jenjang Pills */}
          <div className="pt-2 border-t border-slate-100">
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
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
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

      {/* ── Matrix Table Container (iOS Inset Grouped) ───────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Table Top Toolbar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base tracking-tight">Matriks Kehadiran</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#14b8a6] border border-teal-200/60">
              {filteredData.length} generus
            </span>
          </div>

          {/* Color Legends */}
          {selectedType.length > 0 && eventTypes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedType.map(id => {
                const type = eventTypes.find(t => t.id.toString() === id);
                if (!type) return null;
                return (
                  <div key={id} className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getEventTypeColor(type.id)} flex items-center gap-1.5`}>
                    <div className="w-2 h-2 rounded-full bg-current opacity-80" />
                    <span>{type.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={34} className="animate-spin text-[#14b8a6]" />
            <p className="text-slate-400 font-medium text-sm">Memuat rekapan absensi...</p>
          </div>
        ) : selectedType.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Layers size={36} className="text-slate-300" />
            <p className="text-slate-500 font-semibold text-base">Pilih kategori acara terlebih dahulu.</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle size={36} className="text-slate-300" />
            <p className="text-slate-500 font-semibold text-base">Tidak ada data ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto hide-scrollbar sm:thin-scrollbar max-h-[calc(100vh-320px)] min-h-[380px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200/80 shadow-2xs">
                <tr>
                  <th className="px-3 py-3.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-center lg:sticky lg:left-0 z-30 bg-slate-50 w-12 min-w-12 border-r border-slate-200/60">
                    #
                  </th>
                  <th className="px-4 py-3.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider lg:sticky lg:left-12 z-30 bg-slate-50 w-60 min-w-60 border-r border-slate-200/60 lg:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                    Nama Generus
                  </th>
                  <th className="px-3 py-3.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-center w-40 min-w-40 border-r border-slate-100">
                    Jenjang
                  </th>
                  <th className="px-3 py-3.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-center w-32 min-w-32 border-r border-slate-100">
                    Kelompok
                  </th>
                  <th className="px-3 py-3.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-center w-28 min-w-28 border-r border-slate-100">
                    Status
                  </th>
                  <th className="px-3 py-3.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-center w-24 min-w-24 border-r border-slate-200/60">
                    Rasio
                  </th>

                  {/* Dynamic Event Columns */}
                  {filteredEventsList.map(e => (
                    <th
                      key={e.id}
                      className={`px-1.5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-center min-w-[62px] w-[62px] border-r border-slate-200/80 ${getEventTypeColor(e.event_type_id)}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-black">{formatDate(e.event_date)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-3 py-2.5 text-center font-bold text-slate-500 text-sm lg:sticky lg:left-0 z-20 bg-white group-hover:bg-slate-50/70 border-r border-slate-100">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-2.5 lg:sticky lg:left-12 z-20 bg-white group-hover:bg-slate-50/70 border-r border-slate-100 lg:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg font-extrabold text-sm flex items-center justify-center shrink-0 ${
                          g.jenis_kelamin === 'L' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                        }`}>
                          {g.nama_lengkap.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 pr-1">
                          <p className="text-sm font-extrabold text-slate-900 truncate leading-snug">{g.nama_lengkap}</p>
                          <p className="text-xs font-medium text-slate-400 truncate mt-0.5">{g.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-center border-r border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md uppercase inline-block leading-tight">
                        {(g.is_pengurus ? 'PENGURUS USMAN, ' : '')}{(g.is_pengurus_muda_mudi ? 'PENGURUS MUDA MUDI, ' : '')}{(g.is_ketua_wakil_kelompok ? 'KETUA/WAKIL KELOMPOK, ' : '')}{(g.jenjang || '-')}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-center text-sm font-bold text-slate-700 border-r border-slate-100">
                      {g.kelompok}
                    </td>

                    <td className="px-3 py-2.5 text-center border-r border-slate-100">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        g.status?.toLowerCase() === 'aktif'
                          ? 'bg-teal-50 text-[#14b8a6] border border-teal-200/60'
                          : g.status?.toLowerCase() === 'pasif'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-red-50 text-red-600 border border-red-200/60'
                      }`}>
                        {g.status}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-center text-sm font-mono font-black text-slate-800 border-r border-slate-100">
                      {(() => {
                        let present = 0;
                        let totalParticipant = 0;
                        filteredEventsList.forEach(e => {
                          const stat = g.events_attendance[e.id];
                          if (stat && stat !== '-') {
                            totalParticipant++;
                            if (stat === 'H') present++;
                          }
                        });
                        return totalParticipant === 0 ? '-' : `${present}/${totalParticipant}`;
                      })()}
                    </td>

                    {/* Dynamic Event Status Cells: 1 Kotak Penuh Solid dengan Huruf Jauh Lebih Besar */}
                    {filteredEventsList.map(e => {
                      const mStatus = g.events_attendance[e.id];
                      const cellClass = mStatus && mStatus !== '-' ? getStatusCellClass(mStatus) : 'bg-white text-slate-300';
                      return (
                        <td
                          key={e.id}
                          className={`p-0 text-center border-r border-b border-slate-200/80 align-middle w-[62px] min-w-[62px] h-10 sm:h-11 text-sm sm:text-base font-black transition-colors select-none ${cellClass}`}
                        >
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
  );
}
