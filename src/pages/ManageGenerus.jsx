import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ReactDOM from 'react-dom';
import api from '../api/axios';
import CustomSelect from '../components/CustomSelect';
import {
  Plus, Edit2, Trash2, X, MapPin, Eye,
  Users, FileUp, FileDown,
  Loader2, TrendingUp, TrendingDown, Search, Filter,
  QrCode, Download, AlertTriangle, Check, ChevronRight, ChevronLeft,
  SlidersHorizontal, RotateCw, Clock, ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import logoImg from '../assets/logo.png';


// Helpers
const KELOMPOK_LIST = ['Semua', 'Slogo', 'Gabugan', 'Jekani', 'Gawan', 'Pengkruk', 'Sidomulyo', 'Karangasem'];
const JENJANG_LIST  = ['Semua', 'MT', 'PAUD', 'TK', '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD', '1 SMP', '2 SMP', '3 SMP', '1 SMA/SMK', '2 SMA/SMK', '3 SMA/SMK', 'USMAN', 'PENGURUS USMAN', 'PENGURUS MUDA MUDI', 'KETUA/WAKIL KELOMPOK'];

const STATUS_META = {
  'aktif':       { label: 'Aktif',       color: 'text-emerald-700 bg-emerald-50/90 border-emerald-200/60',  dot: 'bg-emerald-500' },
  'pasif':       { label: 'Pasif',       color: 'text-amber-700  bg-amber-50/90  border-amber-200/60',   dot: 'bg-amber-500'   },
  'tidak aktif': { label: 'Tidak Aktif', color: 'text-red-700    bg-red-50/90    border-red-200/60',     dot: 'bg-red-500'     },
};

function StatusBadge({ status = 'aktif', size = 'normal' }) {
  const meta = STATUS_META[status?.toLowerCase()] ?? STATUS_META['aktif'];
  const isSm = size === 'sm';
  return (
    <span className={`inline-flex items-center ${isSm ? 'gap-1 px-2 py-0.5 text-[10.5px]' : 'gap-1.5 px-3 py-1 text-xs'} rounded-full font-bold border ${meta.color}`}>
      <span className={`${isSm ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

const AVATAR_PALETTES = [
  'bg-rose-50 text-rose-600 border-rose-100',
  'bg-cyan-50 text-cyan-600 border-cyan-100',
  'bg-indigo-50 text-indigo-600 border-indigo-100',
  'bg-purple-50 text-purple-600 border-purple-100',
  'bg-pink-50 text-pink-600 border-pink-100',
  'bg-sky-50 text-sky-600 border-sky-100',
  'bg-amber-50 text-amber-600 border-amber-100',
  'bg-emerald-50 text-emerald-600 border-emerald-100',
];

function Avatar({ name, size = 'md' }) {
  const sz = size === 'lg' ? 'w-14 h-14 text-xl' : size === 'mob' ? 'w-10 h-10 text-sm' : 'w-10 h-10 text-sm';
  const charCode = name ? name.charCodeAt(0) + (name.charCodeAt(1) || 0) : 0;
  const palette = AVATAR_PALETTES[charCode % AVATAR_PALETTES.length];
  return (
    <div className={`${sz} ${palette} border rounded-full flex items-center justify-center font-extrabold shrink-0`}>
      {name ? name.charAt(0).toUpperCase() : '?'}
    </div>
  );
}

function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        {children}
      </div>
    </div>,
    document.body
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
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
    />
  );
}

function ConfirmDialog({ open, onClose, onConfirm, icon, iconBg, title, description, confirmLabel = 'Konfirmasi', confirmClass = 'bg-emerald-600 hover:bg-emerald-700', loading }) {
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

// Calculate age helper
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
  jenjang: 'PAUD', is_pengurus: false, is_pengurus_muda_mudi: false, is_ketua_wakil_kelompok: false,
  pengurus_type_ids: [],
  keterangan: '', libur: '', nama_ayah: '', nama_ibu: '',
  no_hp: '', akun_media: '', hobi: ''
};

export default function ManageGenerus() {
  const location = useLocation();
  const [generusList, setGenerusList]     = useState(() => {
    const cached = sessionStorage.getItem('generusData_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading]             = useState(() => !sessionStorage.getItem('generusData_cache'));
  const [importing, setImporting]         = useState(false);
  const [exporting, setExporting]         = useState(false);
  const [processing, setProcessing]       = useState(false);
  const [saving, setSaving]               = useState(false);
  const [downloadingQrZip, setDownloadingQrZip] = useState(false);
  const [headerSlot, setHeaderSlot]       = useState(() => document.getElementById('layout-header-actions'));

  // Filters & Pagination
  const [search, setSearch]               = useState('');
  const [statusTab, setStatusTab]         = useState('semua');
  const [filterKelompok, setFilterKelompok] = useState(['Semua']);
  const [filterJenjang, setFilterJenjang]   = useState(['Semua']);
  const [showFilters, setShowFilters]       = useState(false);
  const [currentPage, setCurrentPage]       = useState(1);
  const [rowsPerPage, setRowsPerPage]       = useState(8);

  const handleToggleKelompok = (k) => {
    setCurrentPage(1);
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
    setCurrentPage(1);
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

  const handleToggleQrZipJenjang = (j) => {
    if (j === 'Semua') {
      setSelectedQrZipJenjang(['Semua']);
      return;
    }
    setSelectedQrZipJenjang(prev => {
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
  const [showSettings, setShowSettings]   = useState(() => location.search.includes('openSettings=1'));
  const [showQrZipModal, setShowQrZipModal] = useState(false);
  const [selectedQrZipJenjang, setSelectedQrZipJenjang] = useState(['Semua']);
  const [pengurusTypes, setPengurusTypes] = useState([]);

  const fileInputRef   = useRef(null);
  const idCardRef      = useRef(null);
  const settingsRef    = useRef(null);
  const searchInputRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/generus');
      const data = res.data.data || [];
      setGenerusList(data);
      sessionStorage.setItem('generusData_cache', JSON.stringify(data));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    api.get('/admin/pengurus-types')
      .then(res => setPengurusTypes(res.data.data || []))
      .catch(err => console.error('Gagal mengambil jenis pengurus:', err));

    const id = requestAnimationFrame(() => {
      setHeaderSlot(document.getElementById('layout-header-actions'));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const openSettingsHandler = () => setShowSettings(v => !v);
    window.addEventListener('open-generus-settings', openSettingsHandler);
    return () => window.removeEventListener('open-generus-settings', openSettingsHandler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
    };
    const keyHandler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  const invalidateAndFetch = () => { sessionStorage.removeItem('generusData_cache'); fetchData(); };

  // CRUD
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (modalMode === 'add') await api.post('/admin/generus', formData);
      else await api.put(`/admin/generus/${formData.id}`, formData);
      setShowForm(false);
      invalidateAndFetch();
    } catch (err) {
      const msg = err.response?.data?.message;
      alert(typeof msg === 'object' ? Object.values(msg).flat().join('\n') : (msg || 'Terjadi kesalahan.'));
    } finally {
      setSaving(false);
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
    } catch { alert('Gagal menghapus data.'); }
    finally { setProcessing(false); }
  };

  const handlePromote = async () => {
    setProcessing(true);
    try {
      const res = await api.post('/admin/generus/promote');
      alert(res.data.message);
      setShowPromote(false);
      invalidateAndFetch();
    } catch { alert('Terjadi kesalahan.'); }
    finally { setProcessing(false); }
  };

  const handleDemote = async () => {
    setProcessing(true);
    try {
      const res = await api.post('/admin/generus/demote');
      alert(res.data.message);
      setShowDemote(false);
      invalidateAndFetch();
    } catch { alert('Terjadi kesalahan.'); }
    finally { setProcessing(false); }
  };

  // Import / Export
  const handleExport = async () => {
    setExporting(true);
    try {
      const data = filtered;
      const rows = data.map((item, i) => ({
        'No': i + 1, 'Nama Lengkap': item.nama_lengkap || '',
        'Kelompok': item.kelompok || '', 'Status': item.status || '',
        'Tempat Lahir': item.tempat_lahir || '', 'Tanggal Lahir': item.tanggal_lahir || '',
        'Umur': item.umur || '', 'Jenis Kelamin': item.jenis_kelamin || '',
        'Jenjang': (item.is_pengurus ? 'PENGURUS USMAN, ' : '') + (item.is_pengurus_muda_mudi ? 'PENGURUS MUDA MUDI, ' : '') + (item.is_ketua_wakil_kelompok ? 'KETUA/WAKIL KELOMPOK, ' : '') + (item.jenjang || ''), 'Keterangan': item.keterangan || '',
        'Libur': item.libur || '', 'Nama Ayah': item.nama_ayah || '',
        'Nama Ibu': item.nama_ibu || '', 'No HP': item.no_hp || '',
        'Akun Media': item.akun_media || '', 'Hobi': item.hobi || '',
        'Terdaftar': item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : ''
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Generus");
      XLSX.writeFile(wb, "Data_Generus.xlsx");
    } catch { alert('Gagal mengunduh.'); }
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
      } catch { alert('Gagal memproses file.'); }
      finally { setImporting(false); e.target.value = null; }
    };
    reader.readAsBinaryString(file);
  };

  // QR download
  const downloadQr = async () => {
    if (!idCardRef.current) return;
    try {
      const url = await toPng(idCardRef.current, { cacheBust: true, pixelRatio: 4 });
      const a = document.createElement('a');
      a.download = `IDCard_${selected?.nama_lengkap?.replace(/\s+/g, '_')}.png`;
      a.href = url; a.click();
    } catch (e) { console.error(e); }
  };

  const openQrZipModal = () => {
    setShowSettings(false);
    setSelectedQrZipJenjang(['Semua']);
    setShowQrZipModal(true);
  };

  const executeDownloadQrZip = async () => {
    let activeGenerus = generusList.filter(g => g.status?.toLowerCase() === 'aktif');
    
    if (!selectedQrZipJenjang.includes('Semua')) {
      activeGenerus = activeGenerus.filter(g => selectedQrZipJenjang.some(j => {
        if (j === 'PENGURUS USMAN') return g.is_pengurus === 1 || g.is_pengurus === true;
        if (j === 'PENGURUS MUDA MUDI') return g.is_pengurus_muda_mudi === 1 || g.is_pengurus_muda_mudi === true;
        if (j === 'KETUA/WAKIL KELOMPOK') return g.is_ketua_wakil_kelompok === 1 || g.is_ketua_wakil_kelompok === true;
        return g.jenjang?.toLowerCase() === j.toLowerCase();
      }));
    }

    if (activeGenerus.length === 0) {
      alert('Tidak ada peserta yang aktif pada jenjang ini.');
      return;
    }
    
    setDownloadingQrZip(true);
    setShowQrZipModal(false);
    
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < activeGenerus.length; i++) {
        const g = activeGenerus[i];
        const node = document.getElementById(`bulk-idcard-${g.id}`);
        if (node) {
          const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 4 });
          const base64Data = dataUrl.split(',')[1];
          
          const kelompokName = (g.kelompok || 'Umum').replace(/[^A-Za-z0-9\- ]/g, '_').trim();
          const fileName = `${g.nama_lengkap.replace(/[^A-Za-z0-9\- ]/g, '_').trim()}_${kelompokName}.png`;
          
          zip.folder(kelompokName).file(fileName, base64Data, { base64: true });
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      let fileNameSuffix = 'Semua';
      if (!selectedQrZipJenjang.includes('Semua')) {
        if (selectedQrZipJenjang.length === 1) {
          fileNameSuffix = selectedQrZipJenjang[0].replace(/[^A-Za-z0-9]/g, '_');
        } else {
          fileNameSuffix = 'Beberapa_Jenjang';
        }
      }
      saveAs(content, `IDCard_Generus_${fileNameSuffix}_${new Date().getTime()}.zip`);
    } catch (err) {
      console.error(err);
      alert('Gagal membuat file ZIP ID Card.');
    } finally {
      setDownloadingQrZip(false);
    }
  };

  // Filtered / sorted data (before status tab)
  const baseFiltered = generusList.filter(g => {
    const q = search.toLowerCase().trim();
    const matchQuery = !q ||
      g.nama_lengkap?.toLowerCase().includes(q) ||
      g.kelompok?.toLowerCase().includes(q) ||
      g.jenjang?.toLowerCase().includes(q);
    const matchKelompok = filterKelompok.includes('Semua') || filterKelompok.some(k => g.kelompok?.toLowerCase() === k.toLowerCase());
    const matchJenjang = filterJenjang.includes('Semua') || filterJenjang.some(j => {
      if (j === 'PENGURUS USMAN') return g.is_pengurus === 1 || g.is_pengurus === true;
      if (j === 'PENGURUS MUDA MUDI') return g.is_pengurus_muda_mudi === 1 || g.is_pengurus_muda_mudi === true;
      if (j === 'KETUA/WAKIL KELOMPOK') return g.is_ketua_wakil_kelompok === 1 || g.is_ketua_wakil_kelompok === true;
      return g.jenjang?.toLowerCase() === j.toLowerCase();
    });
    
    return matchQuery && matchKelompok && matchJenjang;
  }).sort((a, b) => {
    const sw = s => s?.toLowerCase() === 'tidak aktif' ? 2 : 1;
    if (sw(a.status) !== sw(b.status)) return sw(a.status) - sw(b.status);
    const ageA = calcAge(a.tanggal_lahir, a.umur) ?? 0;
    const ageB = calcAge(b.tanggal_lahir, b.umur) ?? 0;
    return ageB - ageA;
  });

  // Stats based on baseFiltered
  const totalKelompok = baseFiltered.length;
  const totalAktif    = baseFiltered.filter(g => (g.status?.toLowerCase() || 'aktif') === 'aktif').length;
  const totalPasif    = baseFiltered.filter(g => g.status?.toLowerCase() === 'pasif').length;
  const totalNonaktif = baseFiltered.filter(g => g.status?.toLowerCase() === 'tidak aktif').length;

  // Apply statusTab filter
  const filtered = baseFiltered.filter(g => {
    if (statusTab === 'semua') return true;
    return (g.status?.toLowerCase() || 'aktif') === statusTab;
  });

  // Pagination logic
  const effectiveRowsPerPage = rowsPerPage === 'all' ? (filtered.length || 1) : Number(rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / effectiveRowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * effectiveRowsPerPage;
  const paginatedRows = rowsPerPage === 'all'
    ? filtered
    : filtered.slice(startIndex, startIndex + effectiveRowsPerPage);

  // Open modal helpers
  const openAdd = () => {
    setModalMode('add');
    const nonEnumJenjang = ['Semua', 'PENGURUS USMAN', 'PENGURUS MUDA MUDI', 'KETUA/WAKIL KELOMPOK'];
    const defaultJenjang = (filterJenjang.length === 1 && !nonEnumJenjang.includes(filterJenjang[0])) ? filterJenjang[0] : 'PAUD';
    const isUsman = filterJenjang.length === 1 && filterJenjang[0] === 'PENGURUS USMAN';
    const isMudaMudi = filterJenjang.length === 1 && filterJenjang[0] === 'PENGURUS MUDA MUDI';
    const isKetua = filterJenjang.length === 1 && filterJenjang[0] === 'KETUA/WAKIL KELOMPOK';

    const initialTypeIds = [];
    if (isUsman) {
      const t = pengurusTypes.find(x => x.code === 'PENGURUS_USMAN');
      if (t) initialTypeIds.push(t.id);
    }
    if (isMudaMudi) {
      const t = pengurusTypes.find(x => x.code === 'PENGURUS_MUDA_MUDI');
      if (t) initialTypeIds.push(t.id);
    }
    if (isKetua) {
      const t = pengurusTypes.find(x => x.code === 'KETUA_WAKIL_KELOMPOK');
      if (t) initialTypeIds.push(t.id);
    }

    setFormData({
      ...FORM_DEFAULT,
      kelompok: (filterKelompok.includes('Semua') || filterKelompok.length !== 1) ? 'Slogo' : filterKelompok[0],
      jenjang:  defaultJenjang,
      is_pengurus: isUsman,
      is_pengurus_muda_mudi: isMudaMudi,
      is_ketua_wakil_kelompok: isKetua,
      pengurus_type_ids: initialTypeIds,
    });
    setShowForm(true);
  };
  const openEdit = (item) => {
    setModalMode('edit');
    const pIds = item.pengurus_types && item.pengurus_types.length > 0
      ? item.pengurus_types.map(p => p.id)
      : [
          item.is_pengurus && pengurusTypes.find(t => t.code === 'PENGURUS_USMAN')?.id,
          item.is_pengurus_muda_mudi && pengurusTypes.find(t => t.code === 'PENGURUS_MUDA_MUDI')?.id,
          item.is_ketua_wakil_kelompok && pengurusTypes.find(t => t.code === 'KETUA_WAKIL_KELOMPOK')?.id,
        ].filter(Boolean);

    setFormData({ ...FORM_DEFAULT, ...item, pengurus_type_ids: pIds });
    setShowForm(true);
  };
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

  const pct = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

  // Build pagination page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 3) {
      return [1, 2, 3, '...', totalPages];
    }
    if (safePage >= totalPages - 2) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safePage, '...', totalPages];
  };

  const topHeaderButtons = (
    <div className="flex items-center gap-2">
      {/* Mobile Header Buttons: Filter Circle + Green Tambah Pill */}
      <div className="flex lg:hidden items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFilters(v => !v)}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors shadow-2xs relative ${
            showFilters
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50'
          }`}
          title="Filter"
        >
          <Filter size={15} />
          {((!filterKelompok.includes('Semua') && filterKelompok.length > 0) || (!filterJenjang.includes('Semua') && filterJenjang.length > 0)) && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600" />
          )}
        </button>

        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1 px-4 py-2 bg-[#168a53] hover:bg-[#127344] text-white rounded-full text-xs font-bold transition-colors shadow-xs"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Tambah</span>
        </button>
      </div>

      {/* Desktop Header Buttons: Export, Import, + Tambah Peserta */}
      <div className="hidden lg:flex items-center gap-2">
        <Link
          to="/admin/pengurus"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200/90 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>Kelola Pengurus</span>
        </Link>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200/90 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} className="text-slate-500" />}
          <span>Export</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200/90 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
        >
          {importing ? <Loader2 size={13} className="animate-spin" /> : <FileUp size={13} className="text-slate-500" />}
          <span>Import</span>
        </button>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#168a53] hover:bg-[#127344] text-white rounded-full text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Tambah Peserta</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-full font-sans">
      {headerSlot && ReactDOM.createPortal(topHeaderButtons, headerSlot)}
      <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} className="hidden" onChange={handleImport} />

      <div className="w-full py-4 sm:py-6 space-y-4 sm:space-y-5">

        {/* Page Title & Utility Actions */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Data Generus
            </h1>
            <p className="sm:hidden text-slate-500 text-xs mt-1 font-medium">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })} · Kelola info & sebaran desa
            </p>
            <p className="hidden sm:block text-slate-500 text-sm mt-1">
              Kelola informasi peserta, status keaktifan, dan sebaran kelompok desa.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!headerSlot && topHeaderButtons}

            {/* Settings / Aksi Tahunan dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings(v => !v)}
                className="hidden sm:flex w-9 h-9 items-center justify-center text-slate-500 hover:text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
                title="Pengaturan & Aksi Massal"
              >
                <SlidersHorizontal size={15} />
              </button>
              {showSettings && (
                <div className="fixed sm:absolute right-4 sm:right-0 top-16 sm:top-auto sm:mt-2 w-60 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="lg:hidden border-b border-slate-100 pb-1 mb-1">
                    <p className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Excel</p>
                    <button onClick={() => { setShowSettings(false); handleExport(); }} disabled={exporting}
                      className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3">
                      <FileDown size={15} className="text-emerald-600" /> Export Excel
                    </button>
                    <button onClick={() => { setShowSettings(false); fileInputRef.current?.click(); }} disabled={importing}
                      className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3">
                      <FileUp size={15} className="text-blue-600" /> Import Excel
                    </button>
                  </div>
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
                  <button onClick={openQrZipModal} disabled={downloadingQrZip}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-3">
                    {downloadingQrZip ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    {downloadingQrZip ? 'Menyiapkan ZIP...' : 'Download QR (ZIP)'}
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button onClick={() => { setShowSettings(false); setShowDeleteAll(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3">
                    <Trash2 size={15} /> Hapus Semua Data
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={invalidateAndFetch}
              className="hidden sm:flex w-9 h-9 items-center justify-center text-slate-500 hover:text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
              title="Muat Ulang Data"
            >
              <RotateCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Shown above stat cards on mobile) */}
        <div className="lg:hidden relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama, kelompok, jenjang..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-3 text-xs bg-slate-200/60 rounded-2xl border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Mobile Expandable Kelompok & Jenjang Filter Drawer */}
        {showFilters && (
          <div className="lg:hidden bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-3 shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin size={10} className="text-emerald-600" /> Kelompok
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
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'bg-[#168a53] text-white'
                          : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                      }`}
                    >
                      {k}
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        active ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Filter size={10} className="text-emerald-600" /> Jenjang
              </p>
              <div className="flex flex-wrap gap-1.5">
                {JENJANG_LIST.map(j => {
                  const active = filterJenjang.includes(j);
                  return (
                    <button
                      key={j}
                      onClick={() => handleToggleJenjang(j)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'bg-[#168a53] text-white'
                          : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                      }`}
                    >
                      {j}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4 Summary Stat Cards (2x2 on mobile, 4 cols on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Peserta */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-500 truncate">
                {filterKelompok.includes('Semua') ? 'Total Peserta' : (filterKelompok.length === 1 ? `Kelompok ${filterKelompok[0]}` : 'Multi Kelompok')}
              </span>
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Users size={14} />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-baseline justify-between gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {totalKelompok}
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 whitespace-nowrap">
                100% Total
              </span>
            </div>
          </div>

          {/* Peserta Aktif */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-500 truncate">Peserta Aktif</span>
              <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Check size={14} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-baseline justify-between gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#168a53] tracking-tight tabular-nums">
                {totalAktif}
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 whitespace-nowrap">
                {pct(totalAktif, totalKelompok)}% Rasio
              </span>
            </div>
          </div>

          {/* Peserta Pasif */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-500 truncate">Peserta Pasif</span>
              <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Clock size={14} />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-baseline justify-between gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 tracking-tight tabular-nums">
                {totalPasif}
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-700 whitespace-nowrap">
                {pct(totalPasif, totalKelompok)}% Rasio
              </span>
            </div>
          </div>

          {/* Tidak Aktif */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-500 truncate">Tidak Aktif</span>
              <div className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle size={14} />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-baseline justify-between gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight tabular-nums">
                {totalNonaktif}
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-red-50 text-red-600 whitespace-nowrap">
                {pct(totalNonaktif, totalKelompok)}% Rasio
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Status Segmented Control */}
        <div className="lg:hidden bg-slate-200/60 p-1 rounded-2xl grid grid-cols-4 gap-1 border border-slate-200/60">
          {[
            { id: 'semua', label: `Semua (${totalKelompok})` },
            { id: 'aktif', label: `Aktif (${totalAktif})` },
            { id: 'pasif', label: `Pasif (${totalPasif})` },
            { id: 'tidak aktif', label: `Nonaktif (${totalNonaktif})` },
          ].map(tab => {
            const active = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setStatusTab(tab.id); setCurrentPage(1); }}
                className={`py-2 px-1 rounded-xl text-[11px] text-center truncate transition-all ${
                  active
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 font-semibold'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Info Bar */}
        <div className="lg:hidden flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            Menampilkan <span className="font-bold text-slate-800">{paginatedRows.length}</span> dari {filtered.length} peserta
          </p>
          <span className="text-xs font-semibold text-[#168a53] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#168a53]" />
            Realtime sync
          </span>
        </div>

        {/* Main Card Container (Mobile Card List + Desktop Table) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">

          {/* Desktop Toolbar: Search + Status Tabs + Filter */}
          <div className="hidden lg:flex p-4 border-b border-slate-100 items-center justify-between gap-3">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari nama, kelompok, jenjang..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50/90 rounded-xl border border-slate-200/70 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
            </div>

            {/* Status Segmented Tabs + Filter Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-100/80 p-1 rounded-xl flex items-center gap-0.5 border border-slate-200/50 overflow-x-auto">
                {[
                  { id: 'semua', label: `Semua (${totalKelompok})` },
                  { id: 'aktif', label: `Aktif (${totalAktif})` },
                  { id: 'pasif', label: `Pasif (${totalPasif})` },
                  { id: 'tidak aktif', label: `Tidak Aktif (${totalNonaktif})` },
                ].map(tab => {
                  const active = statusTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => { setStatusTab(tab.id); setCurrentPage(1); }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                        active
                          ? 'bg-white text-slate-900 font-extrabold shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700 font-semibold'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  showFilters
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter size={14} />
                <span>Filter</span>
                {((!filterKelompok.includes('Semua') && filterKelompok.length > 0) || (!filterJenjang.includes('Semua') && filterJenjang.length > 0)) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                )}
              </button>
            </div>
          </div>

          {/* Desktop Expandable Kelompok & Jenjang Filter Drawer */}
          {showFilters && (
            <div className="hidden lg:grid p-4 bg-slate-50/70 border-b border-slate-100 grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Pill filter Kelompok */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin size={10} className="text-emerald-600" /> Kelompok
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
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
                          active
                            ? 'bg-[#168a53] text-white shadow-2xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        {k}
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          active ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pill filter Jenjang */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Filter size={10} className="text-emerald-600" /> Jenjang
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {JENJANG_LIST.map(j => {
                    const active = filterJenjang.includes(j);
                    return (
                      <button
                        key={j}
                        onClick={() => handleToggleJenjang(j)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
                          active
                            ? 'bg-[#168a53] text-white shadow-2xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        {j}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Desktop Sub-header info bar */}
          <div className="hidden lg:flex px-6 py-3 bg-slate-50/50 border-b border-slate-100 items-center justify-between">
            <p className="text-xs sm:text-sm text-slate-600">
              Menampilkan <span className="font-extrabold text-slate-900">{filtered.length}</span> dari {generusList.length} peserta terdaftar
            </p>
            <span className="text-xs text-slate-400">
              Pembaruan otomatis realtime
            </span>
          </div>

          {/* Mobile Participant Card List */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-16 text-center">
                <Loader2 size={26} className="animate-spin text-emerald-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Memuat data peserta...</p>
              </div>
            ) : paginatedRows.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <Users size={30} className="text-slate-300 mx-auto mb-2.5" />
                <p className="text-slate-600 font-semibold text-sm">Tidak ada peserta yang sesuai</p>
                <p className="text-slate-400 text-xs mt-1">Coba ubah kata kunci pencarian atau filter.</p>
              </div>
            ) : paginatedRows.map((item) => {
              const roleBadges = [];
              if (item.pengurus_types && item.pengurus_types.length > 0) {
                item.pengurus_types.forEach(pt => roleBadges.push(pt.name.toUpperCase()));
              } else {
                if (item.is_pengurus) roleBadges.push('PENGURUS USMAN');
                if (item.is_pengurus_muda_mudi) roleBadges.push('PENGURUS MUDA MUDI');
                if (item.is_ketua_wakil_kelompok) roleBadges.push('KETUA/WAKIL KELOMPOK');
              }

              return (
                <div
                  key={item.id}
                  onClick={() => openDetail(item)}
                  className="p-3.5 sm:p-4 flex items-center gap-3 active:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Avatar name={item.nama_lengkap} size="mob" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate max-w-[180px] sm:max-w-none">
                        {item.nama_lengkap}
                      </p>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <p className="text-[11.5px] sm:text-xs text-slate-500 mt-0.5">
                      {item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {calcAge(item.tanggal_lahir, item.umur) ?? '-'} thn
                    </p>

                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 flex-wrap">
                      {roleBadges.map(rb => (
                        <span key={rb} className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded">
                          {rb}
                        </span>
                      ))}
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                        {item.jenjang || '-'}
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        {item.kelompok}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openQr(item); }}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Kartu QR"
                    >
                      <QrCode size={17} />
                    </button>
                    <ChevronRight size={17} className="text-slate-300" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-slate-500 text-xs font-extrabold uppercase tracking-wider border-b border-slate-100 bg-white">
                  <th className="px-6 py-3.5 text-left w-14">#</th>
                  <th className="px-6 py-3.5 text-left">Nama Peserta</th>
                  <th className="px-6 py-3.5 text-left">Jenjang</th>
                  <th className="px-6 py-3.5 text-left">Umur</th>
                  <th className="px-6 py-3.5 text-left">Status</th>
                  <th className="px-6 py-3.5 text-left">Kelompok</th>
                  <th className="px-6 py-3.5 text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <Loader2 size={28} className="animate-spin text-emerald-500 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Memuat data peserta...</p>
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <Users size={32} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-semibold text-sm">Tidak ada peserta yang sesuai dengan pencarian atau filter</p>
                      <p className="text-slate-400 text-xs mt-1">Ubah kata kunci pencarian atau tekan Reset filter untuk melihat seluruh peserta.</p>
                    </td>
                  </tr>
                ) : paginatedRows.map((item, idx) => {
                  const rowNum = startIndex + idx + 1;
                  const roleBadges = [];
                  if (item.pengurus_types && item.pengurus_types.length > 0) {
                    item.pengurus_types.forEach(pt => roleBadges.push(pt.name.toUpperCase()));
                  } else {
                    if (item.is_pengurus) roleBadges.push('PENGURUS USMAN');
                    if (item.is_pengurus_muda_mudi) roleBadges.push('PENGURUS MUDA MUDI');
                    if (item.is_ketua_wakil_kelompok) roleBadges.push('KETUA/WAKIL KELOMPOK');
                  }

                  return (
                    <tr key={item.id} className="border-b border-slate-100/80 hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 text-slate-500 text-sm font-bold tabular-nums">{rowNum}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <Avatar name={item.nama_lengkap} />
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm leading-snug">{item.nama_lengkap}</p>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">{item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          {roleBadges.map(rb => (
                            <span key={rb} className="text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md">
                              {rb}
                            </span>
                          ))}
                          <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {item.jenjang || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-800 tabular-nums">
                          {calcAge(item.tanggal_lahir, item.umur) ?? '-'} <span className="text-slate-400 font-medium text-xs">thn</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                          <MapPin size={14} className="text-slate-400 shrink-0" /> {item.kelompok}
                        </span>
                      </td>
                      <td className="px-6 py-4 pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openQr(item)}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Kartu QR">
                            <QrCode size={16} />
                          </button>
                          <button onClick={() => openDetail(item)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="Lihat detail">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => openEdit(item)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => openDel(item)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
              <span>Baris per halaman:</span>
              <select
                value={rowsPerPage}
                onChange={e => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setRowsPerPage(val);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={8}>8</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value="all">Semua</option>
              </select>
              <span className="text-slate-400 ml-2">
                Menampilkan {filtered.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + effectiveRowsPerPage, filtered.length)} dari {filtered.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>

              {getPageNumbers().map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-slate-400 select-none">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                      safePage === p
                        ? 'bg-[#168a53] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 border border-slate-200/80 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Halaman Berikutnya"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: Form Tambah/Edit */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Jenis Kelamin">
              <CustomSelect name="jenis_kelamin" value={formData.jenis_kelamin} onChange={inp}
                options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} />
            </Field>
            <Field label="Kelompok">
              <CustomSelect name="kelompok" value={formData.kelompok} onChange={inp}
                options={KELOMPOK_LIST.filter(k => k !== 'Semua').map(k => ({ value: k, label: k }))} />
            </Field>
            <Field label="Jenjang">
              <CustomSelect name="jenjang" value={formData.jenjang} onChange={inp}
                options={JENJANG_LIST.filter(j => j !== 'Semua' && j !== 'PENGURUS USMAN' && j !== 'PENGURUS MUDA MUDI' && j !== 'KETUA/WAKIL KELOMPOK').map(j => ({ value: j, label: j }))} />
              <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                  Status Pengurus
                </span>
                {pengurusTypes.length > 0 ? (
                  pengurusTypes.map(pt => {
                    const isChecked = (formData.pengurus_type_ids || []).includes(pt.id);
                    return (
                      <label key={pt.id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => {
                              const currentIds = prev.pengurus_type_ids || [];
                              const newIds = checked
                                ? [...currentIds, pt.id]
                                : currentIds.filter(id => id !== pt.id);

                              return {
                                ...prev,
                                pengurus_type_ids: newIds,
                                is_pengurus: pt.code === 'PENGURUS_USMAN' ? checked : prev.is_pengurus,
                                is_pengurus_muda_mudi: pt.code === 'PENGURUS_MUDA_MUDI' ? checked : prev.is_pengurus_muda_mudi,
                                is_ketua_wakil_kelompok: pt.code === 'KETUA_WAKIL_KELOMPOK' ? checked : prev.is_ketua_wakil_kelompok,
                              };
                            });
                          }}
                          className="rounded-md border-slate-300 text-[#168a53] focus:ring-[#168a53] w-4 h-4"
                        />
                        <span className="text-xs sm:text-sm font-semibold text-slate-800">
                          {pt.name}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <>
                    <label className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition-colors">
                      <input type="checkbox" name="is_pengurus" checked={!!formData.is_pengurus}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_pengurus: e.target.checked }))}
                        className="rounded-md border-slate-300 text-[#168a53] focus:ring-[#168a53] w-4 h-4" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">Pengurus Usman</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition-colors">
                      <input type="checkbox" name="is_pengurus_muda_mudi" checked={!!formData.is_pengurus_muda_mudi}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_pengurus_muda_mudi: e.target.checked }))}
                        className="rounded-md border-slate-300 text-[#168a53] focus:ring-[#168a53] w-4 h-4" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">Pengurus Muda Mudi</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition-colors">
                      <input type="checkbox" name="is_ketua_wakil_kelompok" checked={!!formData.is_ketua_wakil_kelompok}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_ketua_wakil_kelompok: e.target.checked }))}
                        className="rounded-md border-slate-300 text-[#168a53] focus:ring-[#168a53] w-4 h-4" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">Ketua/Wakil Kelompok</span>
                    </label>
                  </>
                )}
              </div>
            </Field>
            <Field label="Status">
              <CustomSelect name="status" value={formData.status} onChange={inp}
                options={[
                  { value: 'aktif', label: 'Aktif' },
                  { value: 'pasif', label: 'Pasif' },
                  { value: 'tidak aktif', label: 'Tidak Aktif' },
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
            <button type="button" onClick={() => setShowForm(false)} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50">
              Batal
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#168a53] hover:bg-[#127344] text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Menyimpan...' : (modalMode === 'add' ? 'Simpan Peserta' : 'Simpan Perubahan')}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Detail */}
      <Modal open={showDetail} onClose={() => setShowDetail(false)} maxWidth="max-w-lg">
        {selected && (
          <>
            <ModalHeader title="Detail Peserta" onClose={() => setShowDetail(false)} />
            <div className="p-6 space-y-5">
              {/* Profile top */}
              <div className="flex items-center gap-4">
                <Avatar name={selected.nama_lengkap} size="lg" />
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selected.nama_lengkap}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">{selected.jenjang || '-'}</span>
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><MapPin size={10} className="text-emerald-600" />{selected.kelompok}</span>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Jenis Kelamin', value: selected.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan' },
                  { label: 'Umur', value: calcAge(selected.tanggal_lahir, selected.umur) ? `${calcAge(selected.tanggal_lahir, selected.umur)} tahun` : '-' },
                  { label: 'Tempat Lahir', value: selected.tempat_lahir || '-' },
                  { label: 'Tanggal Lahir', value: selected.tanggal_lahir || '-' },
                  { label: 'No. HP', value: selected.no_hp || '-' },
                  { label: 'Media Sosial', value: selected.akun_media || '-' },
                  { label: 'Hari Libur', value: selected.libur || '-' },
                  { label: 'Keterangan', value: selected.keterangan || '-' },
                  { label: 'Hobi', value: selected.hobi || '-' },
                ].map(r => (
                  <div key={r.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{r.label}</p>
                    <p className="text-sm font-semibold text-slate-700">{r.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Data Orang Tua</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Ayah</p>
                    <p className="text-sm font-semibold text-slate-700">{selected.nama_ayah || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Ibu</p>
                    <p className="text-sm font-semibold text-slate-700">{selected.nama_ibu || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button onClick={() => { setShowDetail(false); openDel(selected); }}
                  className="px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                  title="Hapus Peserta">
                  <Trash2 size={15} />
                </button>
                <button onClick={() => { setShowDetail(false); openEdit(selected); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <Edit2 size={15} /> Edit Data
                </button>
                <button onClick={() => setShowDetail(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#168a53] text-white font-semibold text-sm hover:bg-[#127344] transition-colors">
                  Tutup
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* MODAL: QR */}
      <Modal open={showQr} onClose={() => setShowQr(false)} maxWidth="max-w-xs">
        {selected && (
          <>
            <ModalHeader title="Kartu QR" subtitle={selected.nama_lengkap} onClose={() => setShowQr(false)} />
            <div className="p-6 flex flex-col items-center gap-4">
              {/* ID Card */}
              <div ref={idCardRef}
                className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-lg flex flex-col max-w-full"
                style={{ width: '54mm', height: '86mm', fontFamily: 'system-ui, sans-serif' }}>
                <div className="bg-[#168a53] px-3 py-2 flex items-center justify-center gap-1.5 text-white shrink-0">
                  <img src={logoImg} alt="Logo" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
                  <span className="font-black text-[10px] tracking-widest">DESA SLOGO</span>
                </div>
                <div className="px-3 py-3 text-center flex-1 flex flex-col items-center justify-center">
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kartu Absensi Generus</p>
                  <p className="font-black text-slate-800 text-sm uppercase leading-tight mb-0.5 max-w-full line-clamp-2 px-1">{selected.nama_lengkap}</p>
                  <p className="text-[9px] font-semibold text-emerald-600 mb-3">{selected.kelompok}</p>
                  <div className="flex justify-center p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <QRCodeCanvas value={`SLOGO-${selected.kode_unik || `GEN-${selected.id}`}`} size={110} level="H" includeMargin={false} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button onClick={() => setShowQr(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Tutup
                </button>
                <button onClick={downloadQr}
                  className="flex-1 py-2.5 rounded-xl bg-[#168a53] hover:bg-[#127344] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                  <Download size={15} /> Unduh
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* CONFIRM: Hapus satu */}
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

      {/* CONFIRM: Naik kelas */}
      <ConfirmDialog
        open={showPromote}
        onClose={() => setShowPromote(false)}
        onConfirm={handlePromote}
        loading={processing}
        icon={<TrendingUp size={26} className="text-emerald-500" />}
        iconBg="bg-emerald-50"
        title="Naik Kelas Massal?"
        description="Semua peserta akan dinaikkan satu tingkat jenjang secara otomatis (contoh: 6 SD ke 1 SMP)."
        confirmLabel="Ya, Naikkan"
        confirmClass="bg-emerald-500 hover:bg-emerald-600"
      />

      {/* CONFIRM: Turun kelas */}
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

      {/* MODAL: Download QR ZIP */}
      <Modal open={showQrZipModal} onClose={() => setShowQrZipModal(false)} maxWidth="max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Download size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Download QR (ZIP)</h3>
              <p className="text-sm text-slate-500">Pilih jenjang yang ingin diunduh</p>
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
              <Filter size={10} className="text-blue-500" /> Pilih Jenjang
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-[35vh] overflow-y-auto pr-1 pb-1">
              {JENJANG_LIST.map(j => {
                const active = selectedQrZipJenjang.includes(j);
                return (
                  <button
                    key={j}
                    onClick={() => handleToggleQrZipJenjang(j)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {j === 'Semua' ? 'Semua Jenjang' : j}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => setShowQrZipModal(false)} disabled={downloadingQrZip}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors">
              Batal
            </button>
            <button onClick={executeDownloadQrZip} disabled={downloadingQrZip}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2">
              {downloadingQrZip ? <Loader2 size={16} className="animate-spin" /> : null}
              {downloadingQrZip ? 'Memproses...' : 'Download'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Hapus semua */}
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
      {/* HIDDEN CONTAINER FOR BULK ID CARD GENERATION */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {generusList.filter(g => g.status?.toLowerCase() === 'aktif').map(g => (
          <div key={g.id} id={`bulk-idcard-${g.id}`}
            className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-lg flex flex-col max-w-full"
            style={{ width: '54mm', height: '86mm', fontFamily: 'system-ui, sans-serif' }}>
            <div className="bg-[#168a53] px-3 py-2 flex items-center justify-center gap-1.5 text-white shrink-0">
              <img src={logoImg} alt="Logo" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              <span className="font-black text-[10px] tracking-widest">DESA SLOGO</span>
            </div>
            <div className="px-3 py-3 text-center flex-1 flex flex-col items-center justify-center">
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kartu Absensi Generus</p>
              <p className="font-black text-slate-800 text-sm uppercase leading-tight mb-0.5 max-w-full line-clamp-2 px-1">{g.nama_lengkap}</p>
              <p className="text-[9px] font-semibold text-emerald-600 mb-3">{g.kelompok}</p>
              <div className="flex justify-center p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                <QRCodeCanvas value={`SLOGO-${g.kode_unik || `GEN-${g.id}`}`} size={110} level="H" includeMargin={false} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}