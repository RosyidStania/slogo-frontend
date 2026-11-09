import { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import api from '../api/axios';
import {
  Plus, Pencil, Trash2, X, Search, Check,
  Users, UserPlus, UserMinus, Loader2, AlertCircle,
  Filter, CheckSquare, Square, ChevronRight, CheckCircle2
} from 'lucide-react';

const COLOR_OPTIONS = [
  { key: 'emerald', label: 'Hijau',   badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  { key: 'blue',    label: 'Biru',    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',          dot: 'bg-blue-500' },
  { key: 'amber',   label: 'Amber',   badge: 'bg-amber-50 text-amber-700 border-amber-200/80',       dot: 'bg-amber-500' },
  { key: 'purple',  label: 'Ungu',    badge: 'bg-purple-50 text-purple-700 border-purple-200/80',    dot: 'bg-purple-500' },
  { key: 'rose',    label: 'Merah',   badge: 'bg-rose-50 text-rose-700 border-rose-200/80',          dot: 'bg-rose-500' },
  { key: 'indigo',  label: 'Indigo',  badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',    dot: 'bg-indigo-500' },
  { key: 'teal',    label: 'Teal',    badge: 'bg-teal-50 text-teal-700 border-teal-200/80',          dot: 'bg-teal-500' },
];

function getColorClass(colorKey) {
  const found = COLOR_OPTIONS.find(c => c.key === colorKey);
  return found ? found.badge : 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
}

function getColorDot(colorKey) {
  const found = COLOR_OPTIONS.find(c => c.key === colorKey);
  return found ? found.dot : 'bg-emerald-500';
}

// ─── User Avatar (iOS Pastel Theme) ──────────────────────────────────────────
const AVATAR_PALETTE_MALE = [
  'bg-blue-100 text-blue-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-emerald-100 text-emerald-700',
  'bg-indigo-100 text-indigo-700',
  'bg-cyan-100 text-cyan-700',
];

const AVATAR_PALETTE_FEMALE = [
  'bg-pink-100 text-pink-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-fuchsia-100 text-fuchsia-700',
];

function getAvatarColor(name = '', gender = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const isFemale = gender?.toUpperCase() === 'P';
  const palette = isFemale ? AVATAR_PALETTE_FEMALE : AVATAR_PALETTE_MALE;
  return palette[Math.abs(hash) % palette.length];
}

function UserAvatar({ name, gender, size = 'md' }) {
  const colorClass = getAvatarColor(name, gender);
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-extrabold shrink-0 select-none shadow-2xs`}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

// ─── iOS Sheet / Modal Component (Bottom Sheet on Mobile, Centered on Tablet/Desktop) ─────
function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <div className={`relative bg-white rounded-t-[28px] sm:rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full ${maxWidth} max-h-[90vh] flex flex-col border-t sm:border border-slate-200/80 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 overflow-hidden`}>
        {/* iOS Handle Bar for mobile */}
        <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto my-3 sm:hidden shrink-0" />
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ManagePengurus() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState(null);

  // Detail anggota dari pengurus yang dipilih
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // Modal CRUD Jenis Pengurus
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeModalMode, setTypeModalMode] = useState('add'); // 'add' | 'edit'
  const [typeForm, setTypeForm] = useState({ id: '', name: '', badge_color: 'emerald', description: '', order: 0 });
  const [typeSubmitting, setTypeSubmitting] = useState(false);

  // Modal Quick Assign (Penambahan Anggota Cepat)
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateKelompok, setCandidateKelompok] = useState('Semua');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [quickAssigning, setQuickAssigning] = useState(false);

  // Dialog Konfirmasi Hapus Jenis Pengurus / Anggota
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', title: '', message: '', id: null, generusId: null });

  // Notification Toast (iOS Pill Style)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Fetch semua jenis pengurus
  const fetchTypes = async (autoSelectId = null) => {
    try {
      setLoading(true);
      const res = await api.get('/admin/pengurus-types');
      const list = res.data.data || [];
      setTypes(list);

      if (list.length > 0) {
        if (autoSelectId && list.some(t => t.id === autoSelectId)) {
          setSelectedTypeId(autoSelectId);
        } else if (!selectedTypeId || !list.some(t => t.id === selectedTypeId)) {
          setSelectedTypeId(list[0].id);
        }
      } else {
        setSelectedTypeId(null);
      }
    } catch (err) {
      console.error('Gagal mengambil jenis pengurus:', err);
      showToast('Gagal mengambil data jenis pengurus', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch anggota dari pengurus yang sedang aktif
  const fetchMembers = async (typeId) => {
    if (!typeId) {
      setMembers([]);
      return;
    }
    try {
      setMembersLoading(true);
      const res = await api.get(`/admin/pengurus-types/${typeId}/members`);
      setMembers(res.data.data?.members || []);
    } catch (err) {
      console.error('Gagal mengambil anggota pengurus:', err);
      showToast('Gagal memuat anggota pengurus', 'error');
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  useEffect(() => {
    if (selectedTypeId) {
      fetchMembers(selectedTypeId);
    }
  }, [selectedTypeId]);

  const activeType = useMemo(() => {
    return types.find(t => t.id === selectedTypeId) || null;
  }, [types, selectedTypeId]);

  // Filter anggota aktif
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const q = memberSearch.toLowerCase();
    return members.filter(m =>
      (m.nama_lengkap || '').toLowerCase().includes(q) ||
      (m.kelompok || '').toLowerCase().includes(q) ||
      (m.jenjang || '').toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  // Simpan / Update Jenis Pengurus
  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) return;

    try {
      setTypeSubmitting(true);
      if (typeModalMode === 'add') {
        const res = await api.post('/admin/pengurus-types', typeForm);
        showToast(res.data.message || 'Jenis pengurus berhasil ditambahkan');
        setShowTypeModal(false);
        sessionStorage.removeItem('generusData_cache');
        fetchTypes(res.data.data?.id);
      } else {
        const res = await api.put(`/admin/pengurus-types/${typeForm.id}`, typeForm);
        showToast(res.data.message || 'Jenis pengurus berhasil diperbarui');
        setShowTypeModal(false);
        sessionStorage.removeItem('generusData_cache');
        fetchTypes(typeForm.id);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan jenis pengurus';
      showToast(msg, 'error');
    } finally {
      setTypeSubmitting(false);
    }
  };

  // Konfirmasi hapus jenis pengurus
  const handleConfirmDeleteType = async () => {
    if (!confirmDialog.id) return;
    try {
      await api.delete(`/admin/pengurus-types/${confirmDialog.id}`);
      showToast('Jenis pengurus berhasil dihapus');
      sessionStorage.removeItem('generusData_cache');
      setConfirmDialog({ open: false, type: '', title: '', message: '', id: null, generusId: null });
      fetchTypes();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus jenis pengurus', 'error');
    }
  };

  // Buka Modal Quick Assign
  const handleOpenQuickModal = async () => {
    if (!activeType) return;
    setSelectedCandidateIds([]);
    setCandidateSearch('');
    setCandidateKelompok('Semua');
    setShowQuickModal(true);

    try {
      setCandidatesLoading(true);
      const res = await api.get(`/admin/pengurus-types/${activeType.id}/candidates`);
      setCandidates(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil calon anggota pengurus:', err);
      showToast('Gagal memuat daftar calon anggota', 'error');
    } finally {
      setCandidatesLoading(false);
    }
  };

  // Filter calon anggota di Quick Modal
  const filteredCandidates = useMemo(() => {
    let list = candidates;
    if (candidateKelompok !== 'Semua') {
      list = list.filter(c => c.kelompok === candidateKelompok);
    }
    if (candidateSearch.trim()) {
      const q = candidateSearch.toLowerCase();
      list = list.filter(c => (c.nama_lengkap || '').toLowerCase().includes(q));
    }
    return list;
  }, [candidates, candidateKelompok, candidateSearch]);

  // Daftar kelompok unik dari calon
  const availableKelompokList = useMemo(() => {
    const setK = new Set(candidates.map(c => c.kelompok).filter(Boolean));
    return ['Semua', ...Array.from(setK).sort()];
  }, [candidates]);

  // Toggle kandidat
  const toggleCandidate = (id) => {
    setSelectedCandidateIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Pilih semua yang tampil
  const handleSelectAllVisible = () => {
    const visibleIds = filteredCandidates.map(c => c.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedCandidateIds.includes(id));
    if (allSelected) {
      setSelectedCandidateIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedCandidateIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Submit Bulk Assign (Quick Add)
  const handleSaveQuickAssign = async () => {
    if (!activeType || selectedCandidateIds.length === 0) return;

    try {
      setQuickAssigning(true);
      const res = await api.post(`/admin/pengurus-types/${activeType.id}/bulk-assign`, {
        generus_ids: selectedCandidateIds
      });
      showToast(res.data.message || 'Anggota pengurus berhasil ditambahkan');
      setShowQuickModal(false);
      sessionStorage.removeItem('generusData_cache');
      fetchMembers(activeType.id);
      fetchTypes(activeType.id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menambahkan anggota pengurus', 'error');
    } finally {
      setQuickAssigning(false);
    }
  };

  // Lepas satu anggota dari pengurus
  const handleRemoveMember = async () => {
    if (!confirmDialog.id || !confirmDialog.generusId) return;

    try {
      await api.post(`/admin/pengurus-types/${confirmDialog.id}/remove-members`, {
        generus_ids: [confirmDialog.generusId]
      });
      showToast('Anggota berhasil dilepas dari pengurus');
      sessionStorage.removeItem('generusData_cache');
      setConfirmDialog({ open: false, type: '', title: '', message: '', id: null, generusId: null });
      fetchMembers(confirmDialog.id);
      fetchTypes(confirmDialog.id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal melepas anggota', 'error');
    }
  };

  return (
    <div className="w-full py-3 sm:py-6 space-y-3.5 sm:space-y-6">
      {/* ── iOS Toast Notification Pill ────────────────────────────────────── */}
      {toast.show && (
        <div className="fixed top-4 inset-x-0 z-[300] flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200 px-4">
          <div className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border text-xs sm:text-sm font-semibold backdrop-blur-md ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-white text-emerald-800 border-emerald-200/80 shadow-md'
          }`}>
            {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} className="text-[#168a53]" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ── iOS Navigation Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Data Pengurus
          </h1>
          <p className="text-[10.5px] sm:text-xs font-medium text-slate-400">
            Kelola struktur pengurus dan penugasan anggota.
          </p>
        </div>

        <button
          onClick={() => {
            setTypeModalMode('add');
            setTypeForm({ id: '', name: '', badge_color: 'emerald', description: '', order: types.length + 1 });
            setShowTypeModal(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 hover:border-slate-300 text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} className="text-[#168a53]" />
          <span>Tambah Jenis Pengurus</span>
        </button>
      </div>

      {/* ── Mobile iOS Horizontal Segmented Pill Carousel (< lg) ─────────────── */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          {types.map(t => {
            const isSelected = t.id === selectedTypeId;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTypeId(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold shrink-0 transition-all active:scale-95 border min-h-[38px] ${
                  isSelected
                    ? 'bg-[#168a53] text-white border-[#168a53] shadow-sm shadow-[#168a53]/25'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : getColorDot(t.badge_color)} shrink-0`} />
                <span>{t.name}</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full tabular-nums ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {t.generus_count || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Master-Detail Layout (Desktop Side-by-Side, Mobile Focused Detail) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* Kolom Kiri: Inset Grouped Table View (Desktop Only, >= lg) */}
        <div className="hidden lg:block lg:col-span-4 bg-white rounded-2xl sm:rounded-[24px] border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-3.5 sm:p-4 space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Daftar Pengurus
            </span>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 tabular-nums">
              {types.length}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs sm:text-sm flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#168a53]" />
              <span>Memuat data pengurus...</span>
            </div>
          ) : types.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs sm:text-sm">
              Belum ada jenis pengurus.
            </div>
          ) : (
            <div className="space-y-1.5">
              {types.map(t => {
                const isSelected = t.id === selectedTypeId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTypeId(t.id)}
                    className={`group relative p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-emerald-500/80 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/20'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getColorDot(t.badge_color)} shrink-0`} />
                        <p className={`text-xs sm:text-sm font-bold truncate ${
                          isSelected ? 'text-slate-900' : 'text-slate-800'
                        }`}>
                          {t.name}
                        </p>
                      </div>
                      {t.description && (
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5 line-clamp-1 pl-4">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5 pl-4">
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200/70 text-slate-600 tabular-nums shadow-2xs">
                          {t.generus_count || 0} anggota
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        title="Edit Jenis Pengurus"
                        onClick={() => {
                          setTypeModalMode('edit');
                          setTypeForm({
                            id: t.id,
                            name: t.name,
                            badge_color: t.badge_color || 'emerald',
                            description: t.description || '',
                            order: t.order || 0
                          });
                          setShowTypeModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors active:scale-95"
                      >
                        <Pencil size={13} />
                      </button>
                      {!['PENGURUS_USMAN', 'PENGURUS_MUDA_MUDI', 'KETUA_WAKIL_KELOMPOK'].includes(t.code) && (
                        <button
                          title="Hapus Jenis Pengurus"
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              type: 'delete_type',
                              title: `Hapus ${t.name}?`,
                              message: `Menghapus jenis pengurus ini akan melepas seluruh ${t.generus_count || 0} anggota dari status pengurus ini. Yakin ingin melanjutkan?`,
                              id: t.id,
                              generusId: null
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors active:scale-95"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Inset Grouped Detail & Quick Add Panel */}
        <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-[24px] border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
          {activeType ? (
            <>
              {/* Card Header dengan Apple Inset Tint & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between sm:block">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${getColorClass(activeType.badge_color)} shadow-2xs`}>
                        {activeType.name}
                      </span>
                      <span className="text-xs font-bold text-slate-500 tabular-nums">
                        {members.length} Anggota
                      </span>
                    </div>
                    {activeType.description && (
                      <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-1">
                        {activeType.description}
                      </p>
                    )}
                  </div>

                  {/* Mobile Quick Action for Active Type (Edit / Hapus) */}
                  <div className="flex lg:hidden items-center gap-1">
                    <button
                      title="Edit Jenis Pengurus"
                      onClick={() => {
                        setTypeModalMode('edit');
                        setTypeForm({
                          id: activeType.id,
                          name: activeType.name,
                          badge_color: activeType.badge_color || 'emerald',
                          description: activeType.description || '',
                          order: activeType.order || 0
                        });
                        setShowTypeModal(true);
                      }}
                      className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-full active:scale-95 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    {!['PENGURUS_USMAN', 'PENGURUS_MUDA_MUDI', 'KETUA_WAKIL_KELOMPOK'].includes(activeType.code) && (
                      <button
                        title="Hapus Jenis Pengurus"
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            type: 'delete_type',
                            title: `Hapus ${activeType.name}?`,
                            message: `Menghapus jenis pengurus ini akan melepas seluruh ${activeType.generus_count || 0} anggota dari status pengurus ini. Yakin ingin melanjutkan?`,
                            id: activeType.id,
                            generusId: null
                          });
                        }}
                        className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 rounded-full active:scale-95 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* HERO QUICK ADD BUTTON (Full Width on Mobile) */}
                <button
                  onClick={handleOpenQuickModal}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#168a53] hover:bg-[#127344] text-white text-xs sm:text-sm font-bold shadow-sm shadow-[#168a53]/25 transition-all active:scale-95 shrink-0"
                >
                  <UserPlus size={16} strokeWidth={2.3} />
                  <span>Tambah Anggota Pengurus</span>
                </button>
              </div>

              {/* iOS Style Search Input */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder={`Cari nama anggota di ${activeType.name}...`}
                  className="w-full pl-9 pr-8 py-2.5 sm:py-2 rounded-xl bg-slate-100/70 border border-slate-200/60 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#168a53]/20 focus:border-[#168a53] transition-all"
                />
                {memberSearch && (
                  <button
                    onClick={() => setMemberSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Member List / Table Container */}
              {membersLoading ? (
                <div className="py-16 text-center text-slate-400 text-xs sm:text-sm flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-[#168a53]" />
                  <span>Memuat anggota {activeType.name}...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="py-12 sm:py-14 text-center border border-dashed border-slate-200 rounded-2xl p-4 sm:p-6 bg-slate-50/40">
                  <Users size={32} className="mx-auto text-slate-300 mb-2.5" />
                  <p className="text-sm font-bold text-slate-700">
                    {memberSearch ? 'Tidak ada anggota yang cocok dengan pencarian.' : 'Belum ada anggota di pengurus ini.'}
                  </p>
                  <p className="text-xs font-medium text-slate-400 mt-1 max-w-sm mx-auto">
                    Gunakan tombol "Tambah Anggota Pengurus" untuk menetapkan anggota sekaligus.
                  </p>
                  <button
                    onClick={handleOpenQuickModal}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-50 text-[#168a53] hover:bg-emerald-100 text-xs font-bold transition-all active:scale-95 border border-emerald-200/60"
                  >
                    <UserPlus size={14} />
                    <span>Mulai Tambah Anggota</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* ── Mobile Inset Cell List (< sm) ── */}
                  <div className="sm:hidden divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                    {filteredMembers.map((m, idx) => (
                      <div
                        key={m.id}
                        className="p-3 flex items-center justify-between gap-2.5 active:bg-slate-50 transition-colors bg-white"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar name={m.nama_lengkap} gender={m.jenis_kelamin} size="sm" />
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                              {m.nama_lengkap}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {m.kelompok || '-'}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {m.jenjang || '-'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({m.jenis_kelamin || '-'})
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          title={`Lepas ${m.nama_lengkap} dari ${activeType.name}`}
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              type: 'remove_member',
                              title: `Lepas Status Pengurus?`,
                              message: `Apakah Anda yakin ingin melepas ${m.nama_lengkap} dari ${activeType.name}?`,
                              id: activeType.id,
                              generusId: m.id
                            });
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-full text-rose-600 hover:bg-rose-50 transition-colors active:scale-95 border border-rose-200/60 shrink-0"
                        >
                          <UserMinus size={13} />
                          <span>Lepas</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* ── Desktop Tabular Inset View (>= sm) ── */}
                  <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50/80 text-slate-400 font-bold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-3.5 w-12 text-center">No</th>
                          <th className="py-3 px-3.5">Nama Anggota</th>
                          <th className="py-3 px-3.5">Kelompok</th>
                          <th className="py-3 px-3.5">Jenjang</th>
                          <th className="py-3 px-3.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredMembers.map((m, idx) => (
                          <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-xs tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar name={m.nama_lengkap} gender={m.jenis_kelamin} size="sm" />
                                <div>
                                  <span className="font-extrabold text-slate-900 block leading-snug">
                                    {m.nama_lengkap}
                                  </span>
                                  <span className="text-[10.5px] font-medium text-slate-400">
                                    {m.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3.5 text-slate-600 font-medium">
                              {m.kelompok || '-'}
                            </td>
                            <td className="py-3 px-3.5">
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                                {m.jenjang || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-right">
                              <button
                                title={`Lepas ${m.nama_lengkap} dari ${activeType.name}`}
                                onClick={() => {
                                  setConfirmDialog({
                                    open: true,
                                    type: 'remove_member',
                                    title: `Lepas Status Pengurus?`,
                                    message: `Apakah Anda yakin ingin melepas ${m.nama_lengkap} dari ${activeType.name}?`,
                                    id: activeType.id,
                                    generusId: m.id
                                  });
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full text-rose-600 hover:bg-rose-50 transition-colors active:scale-95 border border-transparent hover:border-rose-200/60"
                              >
                                <UserMinus size={13} />
                                <span>Lepas</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="py-14 text-center text-slate-400 text-sm">
              Pilih salah satu jenis pengurus untuk melihat dan mengelola anggotanya.
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL 1: Tambah / Edit Jenis Pengurus (iOS Form Sheet) ──────────── */}
      <Modal open={showTypeModal} onClose={() => setShowTypeModal(false)}>
        <form onSubmit={handleSaveType} className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {typeModalMode === 'add' ? 'Tambah Jenis Pengurus' : 'Edit Jenis Pengurus'}
              </h2>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                Konfigurasi nama dan warna identitas pengurus.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTypeModal(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors active:scale-95"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nama Pengurus <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={typeForm.name}
                onChange={e => setTypeForm({ ...typeForm, name: e.target.value })}
                placeholder="Contoh: Pengurus Usman, Pengurus Desa, dll."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#168a53]/20 focus:border-[#168a53] font-semibold text-slate-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Warna Badge Identitas
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => {
                  const isChecked = typeForm.badge_color === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setTypeForm({ ...typeForm, badge_color: c.key })}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 min-h-[36px] ${c.badge} ${
                        isChecked ? 'ring-2 ring-[#168a53] shadow-xs scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {isChecked && <Check size={12} className="inline mr-1 -mt-0.5" />}
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Keterangan / Deskripsi
              </label>
              <textarea
                rows={2}
                value={typeForm.description}
                onChange={e => setTypeForm({ ...typeForm, description: e.target.value })}
                placeholder="Opsional: penjelasan tentang tugas/cakupan pengurus ini..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#168a53]/20 focus:border-[#168a53] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowTypeModal(false)}
              className="px-4 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={typeSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#168a53] hover:bg-[#127344] text-white text-xs sm:text-sm font-bold shadow-xs disabled:opacity-50 active:scale-95"
            >
              {typeSubmitting && <Loader2 size={14} className="animate-spin" />}
              <span>{typeModalMode === 'add' ? 'Simpan Pengurus' : 'Update Pengurus'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 2: QUICK ASSIGN (PENAMBAHAN CEPAT ANGGOTA - HERO MODAL) ───── */}
      <Modal open={showQuickModal} onClose={() => setShowQuickModal(false)} maxWidth="max-w-2xl">
        <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <UserPlus size={19} className="text-[#168a53]" />
                <span>Tambah Anggota Pengurus</span>
              </h2>
              <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-0.5">
                Tandai orang-orang yang ditugaskan ke <strong className="text-slate-800">{activeType?.name}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickModal(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors active:scale-95 shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={candidateSearch}
                onChange={e => setCandidateSearch(e.target.value)}
                placeholder="Cari nama calon anggota..."
                className="w-full pl-9 pr-3.5 py-2.5 sm:py-2 rounded-xl bg-slate-100/70 border border-slate-200/60 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#168a53]/20 focus:border-[#168a53] transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400 shrink-0" />
              <select
                value={candidateKelompok}
                onChange={e => setCandidateKelompok(e.target.value)}
                className="w-full py-2.5 sm:py-2 px-3 rounded-xl bg-slate-100/70 border border-slate-200/60 text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#168a53]/20 focus:border-[#168a53] transition-all"
              >
                {availableKelompokList.map(k => (
                  <option key={k} value={k}>
                    {k === 'Semua' ? 'Semua Kelompok' : `Kelompok: ${k}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selection Bar & Quick Toggle */}
          <div className="flex items-center justify-between px-1 py-0.5 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[#168a53] bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full font-bold tabular-nums">
                {selectedCandidateIds.length} dipilih
              </span>
              <span className="text-slate-400 text-[11px] font-medium hidden xs:inline">
                dari {filteredCandidates.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="text-xs font-bold text-[#168a53] hover:text-[#127344] flex items-center gap-1.5 cursor-pointer select-none active:scale-95 transition-all p-1"
            >
              {filteredCandidates.length > 0 && filteredCandidates.every(c => selectedCandidateIds.includes(c.id)) ? (
                <>
                  <CheckSquare size={14} />
                  <span>Batal Pilih Semua</span>
                </>
              ) : (
                <>
                  <Square size={14} />
                  <span>Pilih Semua Tampil</span>
                </>
              )}
            </button>
          </div>

          {/* List Calon Anggota (iOS Inset List with Touch Targets) */}
          <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[360px] divide-y divide-slate-100 border border-slate-200/80 rounded-2xl shadow-2xs">
            {candidatesLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs sm:text-sm flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin text-[#168a53]" />
                <span>Memuat calon anggota...</span>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs sm:text-sm bg-slate-50/50">
                Tidak ada calon anggota yang sesuai dengan filter.
              </div>
            ) : (
              filteredCandidates.map(c => {
                const isChecked = selectedCandidateIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleCandidate(c.id)}
                    className={`p-3 sm:p-2.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors active:bg-slate-100/80 min-h-[52px] ${
                      isChecked ? 'bg-emerald-50/60' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Apple-style circular checkbox */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                        isChecked
                          ? 'bg-[#168a53] border-[#168a53] text-white shadow-2xs'
                          : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}>
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>

                      <UserAvatar name={c.nama_lengkap} gender={c.jenis_kelamin} size="sm" />

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {c.nama_lengkap}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {c.kelompok || '-'}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {c.jenjang || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 transition-all ${
                      isChecked ? 'bg-[#168a53] text-white shadow-2xs' : 'text-slate-400 bg-slate-100'
                    }`}>
                      {isChecked ? 'Terpilih' : '+ Pilih'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Sticky Action */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100 shrink-0">
            <span className="text-[10.5px] font-medium text-slate-400 text-center sm:text-left">
              * Anggota langsung tercatat aktif dalam {activeType?.name}.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowQuickModal(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold active:scale-95 text-center"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={selectedCandidateIds.length === 0 || quickAssigning}
                onClick={handleSaveQuickAssign}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#168a53] hover:bg-[#127344] text-white text-xs sm:text-sm font-bold shadow-sm shadow-[#168a53]/25 disabled:opacity-50 transition-all active:scale-95 text-center"
              >
                {quickAssigning && <Loader2 size={14} className="animate-spin" />}
                <span>Tambahkan {selectedCandidateIds.length} Anggota</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── MODAL 3: Konfirmasi Hapus / Lepas (iOS Alert Style) ──────────────── */}
      <Modal open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })} maxWidth="max-w-sm">
        <div className="p-5 sm:p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100/70">
            <AlertCircle size={24} strokeWidth={2.2} />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {confirmDialog.message}
            </p>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              className="flex-1 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold active:scale-95"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmDialog.type === 'delete_type' ? handleConfirmDeleteType : handleRemoveMember}
              className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95"
            >
              {confirmDialog.type === 'delete_type' ? 'Ya, Hapus' : 'Ya, Lepas'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
