import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import api from '../api/axios';
import TimeSelect from '../components/TimeSelect';
import {
  Plus, Pencil, Trash2, X, Clock, Users, HelpCircle,
  Layers, LayoutGrid, Search, Check, Loader2
} from 'lucide-react';

const kategoriList = [
  'PAUD', 'TK',
  '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD',
  '1 SMP', '2 SMP', '3 SMP',
  '1 SMA/SMK', '2 SMA/SMK', '3 SMA/SMK',
  'USMAN', 'MT', 'PENGURUS USMAN', 'PENGURUS MUDA MUDI', 'KETUA/WAKIL KELOMPOK'
];

function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function ManageEventTypes() {
  const [typesList, setTypesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'umum' | 'kelompok'
  const [headerSlot, setHeaderSlot] = useState(() => document.getElementById('layout-header-actions'));

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '', name: '', code: '', description: '', start_time: '', target_kategori: [], is_group_attendance: false
  });

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: '', name: '' });

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/event-types');
      setTypesList(response.data.data || []);
    } catch (error) {
      console.error('Gagal memuat jenis acara:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
    const id = requestAnimationFrame(() => {
      setHeaderSlot(document.getElementById('layout-header-actions'));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCheckboxChange = (kategori) => {
    setFormData(prev => {
      const isChecked = prev.target_kategori.includes(kategori);
      return {
        ...prev,
        target_kategori: isChecked
          ? prev.target_kategori.filter(k => k !== kategori)
          : [...prev.target_kategori, kategori],
      };
    });
  };

  const handleSelectAllKategori = (selectAll) => {
    setFormData(prev => ({ ...prev, target_kategori: selectAll ? [...kategoriList] : [] }));
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: '', name: '', code: '', description: '', start_time: '19:30', target_kategori: [], is_group_attendance: false });
    setShowModal(true);
  };

  const openEditModal = (data) => {
    setModalMode('edit');
    let parsedKategori = [];
    if (data.target_kategori) {
      parsedKategori = Array.isArray(data.target_kategori)
        ? data.target_kategori
        : JSON.parse(data.target_kategori);
    }
    setFormData({
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description || '',
      start_time: data.start_time?.substring(0, 5) || '',
      target_kategori: parsedKategori,
      is_group_attendance: !!data.is_group_attendance,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.target_kategori.length === 0) {
      alert('Pilih minimal satu target peserta wajib untuk template ini!');
      return;
    }
    setSubmitLoading(true);
    try {
      if (modalMode === 'add') {
        await api.post('/admin/event-types', formData);
      } else {
        await api.put(`/admin/event-types/${formData.id}`, formData);
      }
      setShowModal(false);
      fetchTypes();
    } catch (error) {
      if (error.response?.status === 422) {
        const errorMessages = Object.values(error.response.data.errors).flat().join('\n');
        alert('Penyimpanan Ditolak:\n' + errorMessages);
      } else {
        alert(error.response?.data?.message || 'Terjadi kesalahan server saat menyimpan template.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/event-types/${confirmDialog.id}`);
      setConfirmDialog({ isOpen: false, id: '', name: '' });
      fetchTypes();
    } catch (error) {
      console.error(error);
      alert('Gagal menghapus template acara.');
    }
  };

  const umumCount = typesList.filter(t => !t.is_group_attendance).length;
  const kelompokCount = typesList.filter(t => !!t.is_group_attendance).length;

  const filteredTypes = typesList.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q);

    const matchType =
      typeFilter === 'all' ? true :
      typeFilter === 'kelompok' ? !!item.is_group_attendance :
      !item.is_group_attendance;

    return matchSearch && matchType;
  });

  // ─── Portal into mobile header actions ──────────────────────────────────────
  const mobileTopActions = headerSlot && ReactDOM.createPortal(
    <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={openAddModal}
        className="flex items-center gap-1 px-3 py-1.5 bg-[#168a53] hover:bg-[#127344] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
      >
        <Plus size={13} strokeWidth={2.5} />
        <span>Template</span>
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kategori Acara</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Kelola aturan bawaan nama, jam hadir, dan target peserta per jenis acara rutin.
          </p>
        </div>

        {/* Desktop Add Button */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#168a53] hover:bg-[#127344] active:scale-95 text-white rounded-full font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Buat Template Baru</span>
          </button>
        </div>
      </div>

      {/* ── 3 Summary Stat Cards ────────────────────────────────────────── */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2.5 sm:grid sm:grid-cols-3 sm:gap-4 pb-1 sm:pb-0">
        {/* Total Template */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 min-w-[130px] flex-1 shrink-0 flex flex-col justify-between sm:flex-row sm:items-center gap-2 sm:gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between sm:hidden w-full">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers size={14} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
              Template
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Layers size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 truncate">Total Template</p>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {typesList.length} Template
              </p>
            </div>
          </div>

          <div className="sm:hidden mt-0.5">
            <p className="text-[11px] font-medium text-slate-400">Total Template</p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {typesList.length} <span className="text-xs font-medium text-slate-400">Template</span>
            </p>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 shrink-0">
            Bawaan Sistem
          </span>
        </div>

        {/* Acara Umum */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 min-w-[130px] flex-1 shrink-0 flex flex-col justify-between sm:flex-row sm:items-center gap-2 sm:gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between sm:hidden w-full">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#168a53] flex items-center justify-center">
              <Users size={14} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-[#168a53] border border-emerald-200/60">
              Desa
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#168a53] flex items-center justify-center shrink-0">
              <Users size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 truncate">Acara Umum</p>
              <p className="text-lg sm:text-xl font-extrabold text-[#168a53] tracking-tight leading-snug">
                {umumCount} Template
              </p>
            </div>
          </div>

          <div className="sm:hidden mt-0.5">
            <p className="text-[11px] font-medium text-slate-400">Acara Umum</p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {umumCount} <span className="text-xs font-medium text-slate-400">Umum</span>
            </p>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-[#168a53] border border-emerald-200/60 shrink-0">
            Tingkat Desa
          </span>
        </div>

        {/* Acara Kelompok */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 min-w-[130px] flex-1 shrink-0 flex flex-col justify-between sm:flex-row sm:items-center gap-2 sm:gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between sm:hidden w-full">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <LayoutGrid size={14} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
              Kelompok
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <LayoutGrid size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 truncate">Acara Perkelompok</p>
              <p className="text-lg sm:text-xl font-extrabold text-amber-700 tracking-tight leading-snug">
                {kelompokCount} Template
              </p>
            </div>
          </div>

          <div className="sm:hidden mt-0.5">
            <p className="text-[11px] font-medium text-slate-400">Perkelompok</p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {kelompokCount} <span className="text-xs font-medium text-slate-400">Kelompok</span>
            </p>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
            Absen Kelompok
          </span>
        </div>
      </div>

      {/* ── Search & Filter Tabs Row ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama template, kode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-full border border-slate-200/90 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168a53]/15 focus:border-[#168a53] shadow-2xs transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Segmented Filter Pills */}
        <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-full shrink-0 self-start sm:self-auto overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Semua ({typesList.length})
          </button>
          <button
            onClick={() => setTypeFilter('umum')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'umum'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Umum ({umumCount})
          </button>
          <button
            onClick={() => setTypeFilter('kelompok')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'kelompok'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Kelompok ({kelompokCount})
          </button>
        </div>
      </div>

      {/* ── Content: iOS Card Table ─────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Table Top Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">Daftar Template Acara</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#168a53] border border-emerald-200/60">
              {filteredTypes.length} ditampilkan
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={30} className="animate-spin text-[#168a53]" />
            <p className="text-slate-400 text-xs font-medium">Memuat template acara...</p>
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Layers size={32} className="text-slate-300" />
            <p className="text-slate-400 font-medium text-sm">
              {search ? 'Template tidak ditemukan' : 'Belum ada template terdaftar'}
            </p>
            {!search && (
              <button
                onClick={openAddModal}
                className="mt-1 text-[#168a53] text-xs font-bold hover:underline cursor-pointer"
              >
                + Buat template pertama
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 text-slate-400 border-b border-slate-100">
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-center w-12">#</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider w-28">Kode</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider">Nama Template</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider w-36">Cakupan</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider w-36">Batas Jam</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider max-w-xs">Target Peserta Wajib</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTypes.map((item, index) => {
                    const parsedKategori = Array.isArray(item.target_kategori)
                      ? item.target_kategori
                      : (item.target_kategori ? JSON.parse(item.target_kategori) : []);
                    const isAll = parsedKategori.length === kategoriList.length;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="px-5 py-3.5 text-center font-bold text-slate-400 text-xs">{index + 1}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wide">
                            {item.code}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-extrabold text-slate-800 text-sm leading-snug">{item.name}</p>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">{item.description}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {item.is_group_attendance ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                              <LayoutGrid size={11} /> Kelompok
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-[#168a53] border border-emerald-200/60">
                              <Users size={11} /> Umum Desa
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">
                            <Clock size={11} className="text-amber-600" />
                            <span>{item.start_time?.substring(0, 5)} WIB</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {isAll ? (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                                Semua Umur
                              </span>
                            ) : parsedKategori.length > 3 ? (
                              <>
                                {parsedKategori.slice(0, 3).map(k => (
                                  <span key={k} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                                    {k}
                                  </span>
                                ))}
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
                                  +{parsedKategori.length - 3}
                                </span>
                              </>
                            ) : (
                              parsedKategori.map(k => (
                                <span key={k} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                                  {k}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end items-center gap-0.5">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Edit Template"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setConfirmDialog({ isOpen: true, id: item.id, name: item.name })}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredTypes.map((item) => {
                const parsedKategori = Array.isArray(item.target_kategori)
                  ? item.target_kategori
                  : (item.target_kategori ? JSON.parse(item.target_kategori) : []);
                const isAll = parsedKategori.length === kategoriList.length;

                return (
                  <div key={item.id} className="p-4 space-y-2.5">
                    {/* Top Row: Code + Coverage + Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
                          {item.code}
                        </span>

                        {item.is_group_attendance ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                            <LayoutGrid size={10} /> Kelompok
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-[#168a53] border border-emerald-200/60">
                            <Users size={10} /> Umum
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md cursor-pointer"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDialog({ isOpen: true, id: item.id, name: item.name })}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Template Name & Description */}
                    <div>
                      <p className="font-extrabold text-slate-800 text-sm">{item.name}</p>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.description}</p>
                      )}
                    </div>

                    {/* Time & Target Chips */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">
                        <Clock size={11} className="text-amber-600" />
                        <span>{item.start_time?.substring(0, 5)} WIB</span>
                      </span>

                      <div className="flex flex-wrap gap-1">
                        {isAll ? (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Semua Umur
                          </span>
                        ) : (
                          parsedKategori.slice(0, 3).map(k => (
                            <span key={k} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {k}
                            </span>
                          ))
                        )}
                        {parsedKategori.length > 3 && !isAll && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                            +{parsedKategori.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ══ MODAL: Form Add / Edit (iOS Rounded Style) ════════════════════════ */}
      <Modal open={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 pt-5 pb-3.5 border-b border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Konfigurasi Template
              </p>
              <h3 className="text-base font-bold text-slate-800">
                {modalMode === 'add' ? 'Buat Aturan Template' : 'Edit Template Acara'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Kode Singkat <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="SEMALAMAN, KEAKRABAN"
                  required
                  disabled={modalMode === 'edit'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#168a53]/20 focus:border-[#168a53] text-slate-800 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Batas Jam Hadir Default <span className="text-red-400">*</span>
                </label>
                <TimeSelect
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Nama Acara Default <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Contoh: Pengajian Semalaman Rutin"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#168a53]/20 focus:border-[#168a53] text-slate-800"
              />
            </div>

            {/* Target Peserta */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Peserta Wajib ({formData.target_kategori.length} Dipilih)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllKategori(true)}
                    className="text-[10px] font-bold text-[#168a53] hover:underline cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllKategori(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                {kategoriList.map(kategori => {
                  const isChecked = formData.target_kategori.includes(kategori);
                  return (
                    <label
                      key={kategori}
                      className={`cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider select-none transition-all ${
                        isChecked
                          ? 'bg-[#168a53] border-[#168a53] text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(kategori)}
                      />
                      {isChecked && <Check size={11} strokeWidth={2.5} />}
                      {kategori}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Checkbox Absensi Perkelompok */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_group_attendance}
                  onChange={(e) => setFormData({ ...formData, is_group_attendance: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#168a53] focus:ring-[#168a53] cursor-pointer shrink-0"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    Gunakan untuk Absensi Perkelompok
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Template ini akan otomatis muncul saat Operator Kelompok membuat jadwal untuk kelompoknya.
                  </span>
                </div>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Keterangan Tambahan
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Opsional..."
                rows="2"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#168a53]/20 focus:border-[#168a53] text-slate-800 resize-none"
              />
            </div>
          </div>

          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex gap-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 py-2.5 rounded-xl bg-[#168a53] hover:bg-[#127344] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              {submitLoading ? (
                <><Loader2 size={13} className="animate-spin" /> Menyimpan...</>
              ) : (
                'Simpan Template'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══ MODAL: Confirm Delete ════════════════════════════════════════════ */}
      <Modal open={confirmDialog.isOpen} onClose={() => setConfirmDialog({ isOpen: false, id: '', name: '' })} maxWidth="max-w-sm">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <HelpCircle size={26} strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Hapus Template?</h3>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            Menghapus template <span className="font-bold text-slate-800">"{confirmDialog.name}"</span> tidak akan menghapus acara yang sudah terlanjur dibuat dengan template ini.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDialog({ isOpen: false, id: '', name: '' })}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
