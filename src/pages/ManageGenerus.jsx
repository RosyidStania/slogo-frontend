import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import {
  Plus, Edit, Trash2, X, MapPin, Eye, User, CalendarDays,
  Users, ShieldAlert, ChevronDown, Phone, Info, FileUp, FileDown,
  Loader2, TrendingUp, TrendingDown, Settings, Search, Filter,
  QrCode, Download, Target, AlertTriangle, CheckCircle2, ChevronRight,
  MoreVertical, ArrowUpDown, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';
import { toPng } from 'html-to-image';

// ─── Tiny helpers ────────────────────────────────────────────────────────────
const KELOMPOK_LIST = ['Semua', 'Slogo', 'Gabugan', 'Jekani', 'Gawan', 'Pengkruk', 'Sidomulyo', 'Karangasem'];
const JENJANG_LIST  = ['Semua', 'PAUD', 'TK', '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD', '1 SMP', '2 SMP', '3 SMP', '1 SMA/SMK', '2 SMA/SMK', '3 SMA/SMK', 'USMAN'];

const STATUS_META = {
  'aktif':       { label: 'Aktif',       color: 'text-emerald-700 bg-emerald-50 border-emerald-200',  dot: 'bg-emerald-500' },
  'pasif':       { label: 'Pasif',       color: 'text-amber-700  bg-amber-50  border-amber-200',   dot: 'bg-amber-400'   },
  'tidak aktif': { label: 'Tidak Aktif', color: 'text-red-700    bg-red-50    border-red-200',     dot: 'bg-red-500'     },
};

function StatusBadge({ status = 'aktif' }) {
  const meta = STATUS_META[status?.toLowerCase()] ?? STATUS_META['aktif'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function Avatar({ name, gender, size = 'md' }) {
  const sz = size === 'lg' ? 'w-14 h-14 text-xl' : 'w-9 h-9 text-sm';
  const bg = gender === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600';
  return (
    <div className={`${sz} ${bg} rounded-xl flex items-center justify-center font-bold shrink-0`}>
      {name ? name.charAt(0).toUpperCase() : '?'}
    </div>
  );
}

function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-start justify-between p-6 border-b border-slate-100">
      <div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors ml-4 shrink-0">
        <X size={18} />
      </button>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ name, value, onChange, placeholder = '', type = 'text', required }) {
  return (
    <input
      type={type} name={name} value={value} onChange={onChange}
      placeholder={placeholder} required={required}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
    />
  );
}

function SelectInput({ name, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        name={name} value={value} onChange={onChange}
        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all appearance-none cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, icon, iconBg, title, description, confirmLabel = 'Konfirmasi', confirmClass = 'bg-teal-500 hover:bg-teal-600', loading }) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-8 text-center">
        <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-5`}>{icon}</div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-7 leading-relaxed">{description}</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 ${confirmClass}`}>
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Calculate age helper ─────────────────────────────────────────────────────
function calcAge(birthDate, dbUmur) {
  if (dbUmur) return dbUmur;
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const FORM_DEFAULT = {
  id: '', nama_lengkap: '', kelompok: 'Slogo', status: 'aktif',
  tempat_lahir: '', tanggal_lahir: '', umur: '', jenis_kelamin: 'L',
  jenjang: 'PAUD', keterangan: '', libur: '', nama_ayah: '', nama_ibu: '',
  no_hp: '', akun_media: '', hobi: ''
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function ManageGenerus() {
  const [generusList, setGenerusList]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [importing, setImporting]         = useState(false);
  const [exporting, setExporting]         = useState(false);
  const [processing, setProcessing]       = useState(false);

  // Filters
  const [search, setSearch]               = useState('');
  const [filterKelompok, setFilterKelompok] = useState(['Semua']);
  const [filterJenjang, setFilterJenjang]   = useState(['Semua']);

  const handleToggleKelompok = (k) => {
    if (k === 'Semua') {
      setFilterKelompok(['Semua']);
      return;
    }
    setFilterKelompok(prev => {
      let newFilters = prev.filter(item => item !== 'Semua');
      if (newFilters.includes(k)) {
        newFilters = newFilters.filter(item => item !== k);
      } else {
        newFilters.push(k);
      }
      if (newFilters.length === 0) return ['Semua'];
      return newFilters;
    });
  };

  const handleToggleJenjang = (j) => {
    if (j === 'Semua') {
      setFilterJenjang(['Semua']);
      return;
    }
    setFilterJenjang(prev => {
      let newFilters = prev.filter(item => item !== 'Semua');
      if (newFilters.includes(j)) {
        newFilters = newFilters.filter(item => item !== j);
      } else {
        newFilters.push(j);
      }
      if (newFilters.length === 0) return ['Semua'];
      return newFilters;
    });
  };

  // Modals
  const [showForm, setShowForm]           = useState(false);
  const [modalMode, setModalMode]         = useState('add');
  const [formData, setFormData]           = useState(FORM_DEFAULT);
  const [selected, setSelected]           = useState(null);
  const [showDetail, setShowDetail]       = useState(false);
  const [showDelete, setShowDelete]       = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showPromote, setShowPromote]     = useState(false);
  const [showDemote, setShowDemote]       = useState(false);
  const [showQr, setShowQr]               = useState(false);
  const [showSettings, setShowSettings]   = useState(false);

  const fileInputRef   = useRef(null);
  const idCardRef      = useRef(null);
  const settingsRef    = useRef(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchData = async () => {
    const cached = sessionStorage.getItem('generusData_cache');
    if (cached) { setGenerusList(JSON.parse(cached)); setLoading(false); }
    else setLoading(true);
    try {
      const res = await api.get('/admin/generus');
      const data = res.data.data || [];
      setGenerusList(data);
      sessionStorage.setItem('generusData_cache', JSON.stringify(data));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const invalidateAndFetch = () => { sessionStorage.removeItem('generusData_cache'); fetchData(); };

  // ─── CRUD ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') await api.post('/admin/generus', formData);
      else await api.put(`/admin/generus/${formData.id}`, formData);
      setShowForm(false);
      invalidateAndFetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/generus/${selected.id}`);
      setShowDelete(false);
      invalidateAndFetch();
    } catch (e) { console.error(e); }
  };

  const handleDeleteAll = async () => {
    if (deleteConfirm !== 'HAPUS SEMUA') return;
    setProcessing(true);
    try {
      const res = await api.delete('/admin/generus/destroy-all');
      alert(res.data.message);
      setShowDeleteAll(false);
      setDeleteConfirm('');
      invalidateAndFetch();
    } catch (e) { alert('Gagal menghapus data.'); }
    finally { setProcessing(false); }
  };

  const handlePromote = async () => {
    setProcessing(true);
    try {
      const res = await api.post('/admin/generus/promote');
      alert(res.data.message);
      setShowPromote(false);
      invalidateAndFetch();
    } catch (e) { alert('Terjadi kesalahan.'); }
    finally { setProcessing(false); }
  };

  const handleDemote = async () => {
    setProcessing(true);
    try {
      const res = await api.post('/admin/generus/demote');
      alert(res.data.message);
      setShowDemote(false);
      invalidateAndFetch();
    } catch (e) { alert('Terjadi kesalahan.'); }
    finally { setProcessing(false); }
  };

  // ─── Import / Export ───────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const data = filtered; // Gunakan data yang sudah difilter
      const rows = data.map((item, i) => ({
        'No': i + 1, 'Nama Lengkap': item.nama_lengkap || '',
        'Kelompok': item.kelompok || '', 'Status': item.status || '',
        'Tempat Lahir': item.tempat_lahir || '', 'Tanggal Lahir': item.tanggal_lahir || '',
        'Umur': item.umur || '', 'Jenis Kelamin': item.jenis_kelamin || '',
        'Jenjang': item.jenjang || '', 'Keterangan': item.keterangan || '',
        'Libur': item.libur || '', 'Nama Ayah': item.nama_ayah || '',
        'Nama Ibu': item.nama_ibu || '', 'No HP': item.no_hp || '',
        'Akun Media': item.akun_media || '', 'Hobi': item.hobi || '',
        'Terdaftar': item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : ''
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Generus");
      XLSX.writeFile(wb, "Data_Generus.xlsx");
    } catch (e) { alert('Gagal mengunduh.'); }
    finally { setExporting(false); }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb   = XLSX.read(evt.target.result, { type: 'binary', cellDates: true });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const formatted = data.map(row => {
          let tgl = row['tanggal_lahir'];
          if (tgl instanceof Date) {
            tgl = `${tgl.getFullYear()}-${String(tgl.getMonth()+1).padStart(2,'0')}-${String(tgl.getDate()).padStart(2,'0')}`;
          } else if (typeof tgl === 'string' && tgl.trim()) {
            const p = new Date(tgl);
            tgl = isNaN(p) ? null : `${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,'0')}-${String(p.getDate()).padStart(2,'0')}`;
          } else { tgl = null; }
          let statusRaw = String(row['status'] || 'aktif').toLowerCase().trim();
          if (['nonaktif', 'tidakaktif'].includes(statusRaw)) statusRaw = 'tidak aktif';
          if (!['aktif', 'tidak aktif', 'pasif'].includes(statusRaw)) statusRaw = 'aktif';
          return {
            nama_lengkap: row['nama_lengkap'] || row['NAMA LENGKAP'] || '',
            kelompok: row['kelompok'] || 'Slogo', status: statusRaw,
            tempat_lahir: row['tempat_lahir'] || null, tanggal_lahir: tgl,
            umur: row['umur'] ? parseInt(row['umur']) : null,
            jenis_kelamin: String(row['jenis_kelamin'] || 'L').toUpperCase().trim(),
            jenjang: row['jenjang'] || row['JENJANG'] || null,
            keterangan: row['keterangan'] || null, libur: row['libur'] || null,
            nama_ayah: row['nama_ayah'] || row['nama_bapak'] || null,
            nama_ibu: row['nama_ibu'] || null, no_hp: row['no_hp'] || null,
            akun_media: row['akun_media'] || null, hobi: row['hobi'] || null,
          };
        }).filter(r => r.nama_lengkap);
        const res = await api.post('/admin/generus/import', formatted);
        alert(res.data.message);
        invalidateAndFetch();
      } catch (err) { alert('Gagal memproses file.'); }
      finally { setImporting(false); e.target.value = null; }
    };
    reader.readAsBinaryString(file);
  };

  // ─── QR download ──────────────────────────────────────────────────────────
  const downloadQr = async () => {
    if (!idCardRef.current) return;
    try {
      const url = await toPng(idCardRef.current, { cacheBust: true, pixelRatio: 4 });
      const a = document.createElement('a');
      a.download = `IDCard_${selected?.nama_lengkap?.replace(/\s+/g, '_')}.png`;
      a.href = url; a.click();
    } catch (e) { console.error(e); }
  };

  // ─── Filtered / sorted data ────────────────────────────────────────────────
  const filtered = generusList.filter(g => {
    const q = search.toLowerCase();
    const matchKelompok = filterKelompok.includes('Semua') || filterKelompok.some(k => g.kelompok?.toLowerCase() === k.toLowerCase());
    const matchJenjang = filterJenjang.includes('Semua') || filterJenjang.some(j => g.jenjang?.toLowerCase() === j.toLowerCase());
    
    return (
      g.nama_lengkap?.toLowerCase().includes(q) &&
      matchKelompok &&
      matchJenjang
    );
  }).sort((a, b) => {
    const sw = s => s?.toLowerCase() === 'tidak aktif' ? 2 : 1;
    if (sw(a.status) !== sw(b.status)) return sw(a.status) - sw(b.status);
    const ageA = calcAge(a.tanggal_lahir, a.umur) ?? 0;
    const ageB = calcAge(b.tanggal_lahir, b.umur) ?? 0;
    return ageB - ageA;
  });

  // ─── Open modal helpers ───────────────────────────────────────────────────
  const openAdd = () => {
    setModalMode('add');
    setFormData({
      ...FORM_DEFAULT,
      kelompok: (filterKelompok.includes('Semua') || filterKelompok.length !== 1) ? 'Slogo' : filterKelompok[0],
      jenjang:  (filterJenjang.includes('Semua') || filterJenjang.length !== 1) ? 'PAUD'  : filterJenjang[0],
    });
    setShowForm(true);
  };
  const openEdit = (item) => { setModalMode('edit'); setFormData({ ...FORM_DEFAULT, ...item }); setShowForm(true); };
  const openDetail = (item) => { setSelected(item); setShowDetail(true); };
  const openQr = (item) => { setSelected(item); setShowQr(true); };
  const openDel = (item) => { setSelected(item); setShowDelete(true); };

  const inp = (e) => {
    let { name, value } = e.target;
    if (name === 'no_hp' || name === 'umur') {
      value = value.replace(/\D/g, '');
    }
    setFormData(p => ({ ...p, [name]: value }));
  };

  // ─── Stats — ikut semua filter ──────────
  const totalAktif    = filtered.filter(g => g.status?.toLowerCase() === 'aktif').length;
  const totalPasif    = filtered.filter(g => g.status?.toLowerCase() === 'pasif').length;
  const totalNonaktif = filtered.filter(g => g.status?.toLowerCase() === 'tidak aktif').length;
  const totalKelompok = filtered.length;

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Generus</h1>
            <p className="text-slate-500 text-sm mt-0.5">Kelola peserta dan keaktifan tiap kelompok</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
            {/* Settings dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings(v => !v)}
                className="p-2.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                title="Pengaturan tahunan"
              >
                <Settings size={18} />
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <p className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aksi Tahunan</p>
                  <button onClick={() => { setShowSettings(false); setShowPromote(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-3">
                    <TrendingUp size={15} /> Naik Kelas Massal
                  </button>
                  <button onClick={() => { setShowSettings(false); setShowDemote(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors flex items-center gap-3">
                    <TrendingDown size={15} /> Turun Kelas Massal
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button onClick={() => { setShowSettings(false); setShowDeleteAll(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3">
                    <Trash2 size={15} /> Hapus Semua Data
                  </button>
                </div>
              )}
            </div>

            <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} className="hidden" onChange={handleImport} />

            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} className="text-teal-500" />}
              <span className="hidden sm:inline">Export</span>
            </button>

            <button onClick={() => fileInputRef.current?.click()} disabled={importing}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
              {importing ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} className="text-emerald-500" />}
              <span className="hidden sm:inline">Import</span>
            </button>

            <button onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
              <Plus size={16} />
              <span className="hidden sm:inline">Tambah</span>
            </button>
          </div>
        </div>

        {/* ── Stats cards — berubah sesuai kelompok aktif ──────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: filterKelompok.includes('Semua') ? 'Total Peserta' : (filterKelompok.length === 1 ? `Kelompok ${filterKelompok[0]}` : 'Multi Kelompok'), value: totalKelompok, color: 'text-slate-700', bg: 'bg-white', border: 'border-slate-200', icon: <Users size={18} className="text-slate-400" /> },
            { label: 'Aktif', value: totalAktif, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <CheckCircle2 size={18} className="text-emerald-500" /> },
            { label: 'Pasif', value: totalPasif, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100', icon: <RefreshCw size={18} className="text-amber-500" /> },
            { label: 'Tidak Aktif', value: totalNonaktif, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100', icon: <AlertTriangle size={18} className="text-red-500" /> },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-4 py-4 flex items-center justify-between transition-all duration-300`}>
              <div>
                <p className="text-xs text-slate-500 font-medium truncate max-w-[110px]">{s.label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${s.color} tabular-nums`}>{s.value}</p>
              </div>
              {s.icon}
            </div>
          ))}
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="space-y-2 sticky top-0 z-20 bg-slate-50 pt-2 pb-4 -mt-2">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama peserta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-2xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm"
            />
          </div>

          {/* Pill filter — Kelompok */}
          <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
              <MapPin size={10} className="text-teal-500" /> Kelompok
            </p>
            <div className="flex flex-wrap gap-1.5">
              {KELOMPOK_LIST.map(k => {
                const count = k === 'Semua'
                  ? generusList.length
                  : generusList.filter(g => g.kelompok?.toLowerCase() === k.toLowerCase()).length;
                const active = filterKelompok.includes(k);
                return (
                  <button
                    key={k}
                    onClick={() => handleToggleKelompok(k)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      active
                        ? 'bg-teal-600 text-white shadow-sm shadow-teal-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {k === 'Semua' ? 'Semua' : k}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      active ? 'bg-teal-500/50 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pill filter — Jenjang */}
          <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
              <Filter size={10} className="text-emerald-500" /> Jenjang
            </p>
            <div className="flex flex-wrap gap-1.5">
              {JENJANG_LIST.map(j => {
                const active = filterJenjang.includes(j);
                return (
                  <button
                    key={j}
                    onClick={() => handleToggleJenjang(j)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {j === 'Semua' ? 'Semua' : j}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

          {/* result count */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-semibold text-slate-700">{filtered.length}</span> dari {generusList.length} peserta
            </p>
            {(search || !filterKelompok.includes('Semua') || !filterJenjang.includes('Semua')) && (
              <button onClick={() => { setSearch(''); setFilterKelompok(['Semua']); setFilterJenjang(['Semua']); }}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                Reset filter
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide border-b border-slate-100">
                  <th className="px-5 py-3 text-left w-8">#</th>
                  <th className="px-5 py-3 text-left">Nama</th>
                  <th className="px-5 py-3 text-left hidden md:table-cell">Jenjang</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Umur</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  {(filterKelompok.includes('Semua') || filterKelompok.length > 1) && <th className="px-5 py-3 text-left hidden lg:table-cell">Kelompok</th>}
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <Loader2 size={28} className="animate-spin text-teal-400 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Memuat data...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <Users size={32} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400 font-medium">Tidak ada data yang sesuai</p>
                      <p className="text-slate-400 text-xs mt-1">Coba ubah filter pencarian</p>
                    </td>
                  </tr>
                ) : filtered.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={item.nama_lengkap} gender={item.jenis_kelamin} />
                        <div>
                          <p className="font-semibold text-slate-800 leading-tight">{item.nama_lengkap}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                        {item.jenjang || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-sm font-medium text-slate-600">
                        {calcAge(item.tanggal_lahir, item.umur) ?? '—'} <span className="text-slate-400 text-xs">thn</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    {(filterKelompok.includes('Semua') || filterKelompok.length > 1) && (
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                          <MapPin size={11} className="text-teal-500" /> {item.kelompok}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openQr(item)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="QR Code">
                          <QrCode size={15} />
                        </button>
                        <button onClick={() => openDetail(item)}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Lihat detail">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => openEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => openDel(item)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══ MODAL: Form Tambah/Edit ══════════════════════════════════════════ */}
      <Modal open={showForm} onClose={() => setShowForm(false)} maxWidth="max-w-2xl">
        <ModalHeader
          title={modalMode === 'add' ? 'Tambah Peserta Baru' : 'Edit Data Peserta'}
          subtitle={modalMode === 'add' ? 'Isi informasi peserta baru' : `Mengedit data ${formData.nama_lengkap}`}
          onClose={() => setShowForm(false)}
        />
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Nama */}
          <Field label="Nama Lengkap *">
            <TextInput name="nama_lengkap" value={formData.nama_lengkap} onChange={inp} required placeholder="Masukkan nama lengkap" />
          </Field>

          {/* Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Jenis Kelamin">
              <SelectInput name="jenis_kelamin" value={formData.jenis_kelamin} onChange={inp}
                options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} />
            </Field>
            <Field label="Kelompok">
              <SelectInput name="kelompok" value={formData.kelompok} onChange={inp}
                options={KELOMPOK_LIST.filter(k => k !== 'Semua').map(k => ({ value: k, label: k }))} />
            </Field>
            <Field label="Jenjang">
              <SelectInput name="jenjang" value={formData.jenjang} onChange={inp}
                options={JENJANG_LIST.filter(j => j !== 'Semua').map(j => ({ value: j, label: j }))} />
            </Field>
            <Field label="Status">
              <SelectInput name="status" value={formData.status} onChange={inp}
                options={[
                  { value: 'aktif', label: '🟢 Aktif' },
                  { value: 'pasif', label: '🟡 Pasif' },
                  { value: 'tidak aktif', label: '🔴 Tidak Aktif' },
                ]} />
            </Field>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Tempat Lahir">
              <TextInput name="tempat_lahir" value={formData.tempat_lahir} onChange={inp} placeholder="Kota / Desa" />
            </Field>
            <Field label="Tanggal Lahir">
              <TextInput name="tanggal_lahir" value={formData.tanggal_lahir} onChange={inp} type="date" />
            </Field>
            <Field label="Umur (isi jika tidak ada tgl lahir)">
              <TextInput name="umur" value={formData.umur} onChange={inp} type="number" placeholder="Otomatis jika ada tgl lahir" />
            </Field>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="No. HP">
              <TextInput name="no_hp" value={formData.no_hp} onChange={inp} placeholder="08123456789" />
            </Field>
            <Field label="Akun Media Sosial">
              <TextInput name="akun_media" value={formData.akun_media} onChange={inp} placeholder="@username" />
            </Field>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Keterangan / Pekerjaan">
              <TextInput name="keterangan" value={formData.keterangan} onChange={inp} placeholder="Pelajar / Karyawan..." />
            </Field>
            <Field label="Hari Libur">
              <TextInput name="libur" value={formData.libur} onChange={inp} placeholder="Sabtu / Minggu" />
            </Field>
            <Field label="Hobi">
              <TextInput name="hobi" value={formData.hobi} onChange={inp} />
            </Field>
          </div>

          {/* Row orang tua */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-3">Data Orang Tua</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nama Ayah">
                <TextInput name="nama_ayah" value={formData.nama_ayah} onChange={inp} />
              </Field>
              <Field label="Nama Ibu">
                <TextInput name="nama_ibu" value={formData.nama_ibu} onChange={inp} />
              </Field>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors">
              Batal
            </button>
            <button type="submit"
              className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm">
              {modalMode === 'add' ? 'Simpan Peserta' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══ MODAL: Detail ════════════════════════════════════════════════════ */}
      <Modal open={showDetail} onClose={() => setShowDetail(false)} maxWidth="max-w-lg">
        {selected && (
          <>
            <ModalHeader title="Detail Peserta" onClose={() => setShowDetail(false)} />
            <div className="p-6 space-y-5">
              {/* Profile top */}
              <div className="flex items-center gap-4">
                <Avatar name={selected.nama_lengkap} gender={selected.jenis_kelamin} size="lg" />
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selected.nama_lengkap}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">{selected.jenjang || '—'}</span>
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><MapPin size={10} className="text-teal-500" />{selected.kelompok}</span>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Jenis Kelamin', value: selected.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' },
                  { label: 'Umur', value: calcAge(selected.tanggal_lahir, selected.umur) ? `${calcAge(selected.tanggal_lahir, selected.umur)} tahun` : '—' },
                  { label: 'Tempat Lahir', value: selected.tempat_lahir || '—' },
                  { label: 'Tanggal Lahir', value: selected.tanggal_lahir || '—' },
                  { label: 'No. HP', value: selected.no_hp || '—' },
                  { label: 'Media Sosial', value: selected.akun_media || '—' },
                  { label: 'Hari Libur', value: selected.libur || '—' },
                  { label: 'Keterangan', value: selected.keterangan || '—' },
                  { label: 'Hobi', value: selected.hobi || '—' },
                ].map(r => (
                  <div key={r.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{r.label}</p>
                    <p className="text-sm font-semibold text-slate-700">{r.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Data Orang Tua</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Ayah</p>
                    <p className="text-sm font-semibold text-slate-700">{selected.nama_ayah || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Ibu</p>
                    <p className="text-sm font-semibold text-slate-700">{selected.nama_ibu || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => { setShowDetail(false); openEdit(selected); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <Edit size={15} /> Edit Data
                </button>
                <button onClick={() => setShowDetail(false)}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition-colors">
                  Tutup
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ══ MODAL: QR ════════════════════════════════════════════════════════ */}
      <Modal open={showQr} onClose={() => setShowQr(false)} maxWidth="max-w-xs">
        {selected && (
          <>
            <ModalHeader title="Kartu QR" subtitle={selected.nama_lengkap} onClose={() => setShowQr(false)} />
            <div className="p-6 flex flex-col items-center gap-4">
              {/* ID Card */}
              <div ref={idCardRef}
                className="bg-white w-64 rounded-2xl overflow-hidden border border-slate-200 shadow-lg"
                style={{ fontFamily: 'system-ui, sans-serif' }}>
                <div className="bg-teal-600 px-5 py-4 flex items-center gap-2 text-white">
                  <Target size={16} strokeWidth={2.5} />
                  <span className="font-black text-xs tracking-widest">DESA SLOGO</span>
                </div>
                <div className="px-5 py-4 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kartu Absensi Generus</p>
                  <p className="font-black text-slate-800 text-base uppercase leading-tight mb-1">{selected.nama_lengkap}</p>
                  <p className="text-xs font-semibold text-teal-600 mb-4">{selected.kelompok}</p>
                  <div className="flex justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <QRCodeCanvas value={`SLOGO-GEN-${selected.id}`} size={120} level="H" includeMargin={false} />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3">{selected.jenjang || 'UMUM'}</p>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button onClick={() => setShowQr(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Tutup
                </button>
                <button onClick={downloadQr}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                  <Download size={15} /> Unduh
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ══ CONFIRM: Hapus satu ══════════════════════════════════════════════ */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        icon={<Trash2 size={26} className="text-red-500" />}
        iconBg="bg-red-50"
        title="Hapus Peserta?"
        description={<>Yakin ingin menghapus <strong>{selected?.nama_lengkap}</strong>? Data tidak bisa dikembalikan.</>}
        confirmLabel="Ya, Hapus"
        confirmClass="bg-red-500 hover:bg-red-600"
      />

      {/* ══ CONFIRM: Naik kelas ══════════════════════════════════════════════ */}
      <ConfirmDialog
        open={showPromote}
        onClose={() => setShowPromote(false)}
        onConfirm={handlePromote}
        loading={processing}
        icon={<TrendingUp size={26} className="text-emerald-500" />}
        iconBg="bg-emerald-50"
        title="Naik Kelas Massal?"
        description="Semua peserta akan dinaikkan satu tingkat jenjang secara otomatis (contoh: 6 SD → 1 SMP)."
        confirmLabel="Ya, Naikkan"
        confirmClass="bg-emerald-500 hover:bg-emerald-600"
      />

      {/* ══ CONFIRM: Turun kelas ═════════════════════════════════════════════ */}
      <ConfirmDialog
        open={showDemote}
        onClose={() => setShowDemote(false)}
        onConfirm={handleDemote}
        loading={processing}
        icon={<TrendingDown size={26} className="text-amber-500" />}
        iconBg="bg-amber-50"
        title="Turun Kelas Massal?"
        description="Semua peserta akan diturunkan satu tingkat jenjang. Gunakan ini jika naik kelas dilakukan tidak sengaja."
        confirmLabel="Ya, Turunkan"
        confirmClass="bg-amber-500 hover:bg-amber-600"
      />

      {/* ══ MODAL: Hapus semua ═══════════════════════════════════════════════ */}
      <Modal open={showDeleteAll} onClose={() => { setShowDeleteAll(false); setDeleteConfirm(''); }} maxWidth="max-w-md">
        <div className="p-8">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Hapus Semua Data?</h3>
          <p className="text-center text-slate-500 text-sm mb-6 leading-relaxed">
            Tindakan ini akan <strong>menghapus seluruh data peserta</strong> secara permanen dan tidak bisa dibatalkan.
          </p>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-red-700 mb-2 text-center">Ketik <strong>HAPUS SEMUA</strong> untuk melanjutkan</p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="HAPUS SEMUA"
              className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-xl text-center font-bold text-red-600 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowDeleteAll(false); setDeleteConfirm(''); }} disabled={processing}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors">
              Batal
            </button>
            <button onClick={handleDeleteAll} disabled={processing || deleteConfirm !== 'HAPUS SEMUA'}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {processing ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Hapus Semua'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}