import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import api from '../api/axios';
import CustomSelect from '../components/CustomSelect';
import {
  User as UserIcon,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  RotateCw,
  Copy,
  Check,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  MapPin
} from 'lucide-react';

function Modal({ open, onClose, children, maxWidth = 'max-w-md' }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className={`relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full ${maxWidth} animate-in slide-in-from-bottom sm:zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto border-t sm:border border-slate-100`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

const DEFAULT_KELOMPOK = ['Slogo', 'Gabugan', 'Jekani', 'Gawan', 'Pengkruk', 'Sidomulyo', 'Karangasem'];

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [generusList, setGenerusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headerSlot, setHeaderSlot] = useState(() => document.getElementById('layout-header-actions'));

  // Filters & Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [roleTab, setRoleTab] = useState('semua');
  const [selectedKelompok, setSelectedKelompok] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    username: '',
    role: 'user',
    password: '',
    generus_id: '',
    kelompok: 'Slogo'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);

  const [copiedId, setCopiedId] = useState(null);

  const kelompokOptions = [...new Set([...DEFAULT_KELOMPOK, ...generusList.map(g => g.kelompok).filter(Boolean)])].sort();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil data user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenerus = async () => {
    try {
      const response = await api.get('/admin/generus');
      setGenerusList(response.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil data generus:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGenerus();
    const id = requestAnimationFrame(() => {
      setHeaderSlot(document.getElementById('layout-header-actions'));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: '', name: '', username: '', role: 'user', password: '', generus_id: '', kelompok: 'Slogo' });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setFormData({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      password: user.plain_password || '',
      generus_id: user.generus?.id || '',
      kelompok: user.kelompok || user.generus?.kelompok || 'Slogo'
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((formData.role === 'user' || formData.role === 'mt') && !formData.generus_id) {
      alert('Silakan pilih Generus terlebih dahulu.');
      return;
    }
    setSubmitLoading(true);
    try {
      if (modalMode === 'add') {
        await api.post('/admin/users', formData);
      } else {
        await api.put(`/admin/users/${formData.id}`, formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message;
      if (typeof msg === 'object') {
        alert(Object.values(msg).flat().join('\n'));
      } else {
        alert(msg || 'Terjadi kesalahan saat menyimpan data.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setShowDeleteModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Gagal menghapus user:', error);
      alert(error.response?.data?.message || 'Gagal menghapus user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleteAllLoading(true);
    try {
      await api.delete('/admin/users/destroy-all');
      setShowDeleteAllModal(false);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus semua user.');
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const handleGenerateUsers = async () => {
    setGenerateLoading(true);
    try {
      const res = await api.post('/admin/users/generate-from-generus');
      setShowGenerateModal(false);
      alert(res.data.message);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal generate akun generus.');
    } finally {
      setGenerateLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Metrics
  const totalAdmin = users.filter(u => u.role === 'admin').length;
  const totalOperator = users.filter(u => ['operator_absensi', 'absen_kelompok'].includes(u.role)).length;
  const totalMt = users.filter(u => u.role === 'mt').length;
  const totalUser = users.filter(u => u.role === 'user').length;
  const totalOpAndMt = totalOperator + totalMt;

  // Filter logic
  const filteredUsers = users.filter(user => {
    if (roleTab === 'admin' && user.role !== 'admin') return false;
    if (roleTab === 'operator' && !['operator_absensi', 'absen_kelompok'].includes(user.role)) return false;
    if (roleTab === 'mt' && user.role !== 'mt') return false;
    if (roleTab === 'user' && user.role !== 'user') return false;

    const userKelompok = user.kelompok || user.generus?.kelompok || '';
    if (selectedKelompok && userKelompok !== selectedKelompok) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = user.name?.toLowerCase().includes(q);
      const matchUsername = user.username?.toLowerCase().includes(q);
      const matchRole = user.role?.toLowerCase().includes(q);
      const matchKelompok = userKelompok.toLowerCase().includes(q);
      if (!matchName && !matchUsername && !matchRole && !matchKelompok) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Helper for role badge
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-[#168a53] border border-emerald-200/60 shadow-2xs">
            <Shield size={13} strokeWidth={2.4} />
            Admin
          </span>
        );
      case 'operator_absensi':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
            <ShieldCheck size={13} strokeWidth={2.4} />
            Operator Desa
          </span>
        );
      case 'absen_kelompok':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs">
            <ShieldCheck size={13} strokeWidth={2.4} />
            Op. Kelompok
          </span>
        );
      case 'mt':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs">
            <GraduationCap size={13} strokeWidth={2.4} />
            MT Pengajar
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200/70 shadow-2xs">
            <UserIcon size={13} strokeWidth={2} />
            Anggota
          </span>
        );
    }
  };

  // Helper for role avatar styling
  const getRoleAvatarClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-emerald-50 text-[#168a53] border-emerald-200/60';
      case 'operator_absensi':
        return 'bg-blue-50 text-blue-600 border-blue-200/60';
      case 'absen_kelompok':
        return 'bg-indigo-50 text-indigo-600 border-indigo-200/60';
      case 'mt':
        return 'bg-amber-50 text-amber-600 border-amber-200/60';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200/70';
    }
  };

  // Mobile Header Action Button
  const mobileTopActions = headerSlot && ReactDOM.createPortal(
    <div className="flex lg:hidden items-center gap-1.5">
      <button
        type="button"
        onClick={openAddModal}
        className="flex items-center gap-1 px-3 py-1.5 bg-[#168a53] hover:bg-[#127344] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
      >
        <Plus size={14} strokeWidth={2.5} />
        <span>Tambah</span>
      </button>
    </div>,
    headerSlot
  );

  return (
    <div className="w-full py-4 sm:py-6 space-y-4 sm:space-y-5 font-sans">
      {mobileTopActions}

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Manajemen Akun
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Kelola akun login, penetapan role, dan akses keamanan sistem.
          </p>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowDeleteAllModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-full text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Hapus Semua User</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 rounded-full text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles size={13} className="text-blue-600" />
            <span>Generate Akun Generus</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#168a53] hover:bg-[#127344] text-white rounded-full text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {/* ── 4 Summary Stat Cards (iOS Inset 2x2 on Mobile, 4 Cols on Desktop) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Akun */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 truncate">Total Akun</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Users size={14} />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {users.length}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-600 whitespace-nowrap">
              Terdaftar
            </span>
          </div>
        </div>

        {/* Admin */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 truncate">Admin Pusat</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 text-[#168a53] flex items-center justify-center shrink-0">
              <Shield size={14} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#168a53] tracking-tight tabular-nums">
              {totalAdmin}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 whitespace-nowrap">
              Full Akses
            </span>
          </div>
        </div>

        {/* Operator & MT */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 truncate">Operator & MT</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={14} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight tabular-nums">
              {totalOpAndMt}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-50 text-blue-700 whitespace-nowrap">
              Petugas
            </span>
          </div>
        </div>

        {/* User Biasa */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 truncate">Akun Anggota</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
              <UserIcon size={14} strokeWidth={2} />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-700 tracking-tight tabular-nums">
              {totalUser}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-600 whitespace-nowrap">
              Generus
            </span>
          </div>
        </div>
      </div>

      {/* ── Mobile Action Bar (Generate & Hapus Semua: 2 Kolom Rapi) ── */}
      <div className="grid grid-cols-2 gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 text-blue-700 rounded-2xl text-xs font-bold transition-all shadow-xs active:scale-95"
        >
          <Sparkles size={14} className="shrink-0 text-blue-600" />
          <span className="truncate">Generate Akun</span>
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteAllModal(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100/80 border border-red-200/80 text-red-600 rounded-2xl text-xs font-bold transition-all shadow-xs active:scale-95"
        >
          <Trash2 size={14} className="shrink-0 text-red-500" />
          <span className="truncate">Hapus User Biasa</span>
        </button>
      </div>

      {/* ── iOS Segmented Control for Roles (Scrollable on Mobile, Grid on Tablet/Desktop) ── */}
      <div className="bg-slate-200/60 p-1 sm:p-1.5 rounded-2xl flex overflow-x-auto hide-scrollbar sm:grid sm:grid-cols-5 gap-1 sm:gap-1.5 border border-slate-200/60">
        {[
          { id: 'semua', label: 'Semua', count: users.length },
          { id: 'admin', label: 'Admin', count: totalAdmin },
          { id: 'operator', label: 'Operator', count: totalOperator },
          { id: 'mt', label: 'MT', count: totalMt },
          { id: 'user', label: 'Anggota', count: totalUser },
        ].map(tab => {
          const active = roleTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setRoleTab(tab.id); setCurrentPage(1); }}
              className={`py-2 sm:py-2.5 px-3 sm:px-2 rounded-xl text-xs sm:text-sm text-center whitespace-nowrap shrink-0 sm:shrink transition-all cursor-pointer ${
                active
                  ? 'bg-white text-slate-900 font-extrabold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 font-semibold'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`ml-1 text-xs ${active ? 'text-[#168a53] font-bold' : 'text-slate-400'}`}>
                ({tab.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Main Container (Search, Filters, Mobile Card List & Desktop Table) ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        
        {/* Toolbar: Search & Kelompok Filter */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-md">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, username, kelompok..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50/90 rounded-xl border border-slate-200/70 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-[#168a53] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Kelompok Filter Dropdown & Reload */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-52">
              <CustomSelect
                value={selectedKelompok}
                onChange={(e) => { setSelectedKelompok(e.target.value); setCurrentPage(1); }}
                options={[
                  { value: '', label: 'Semua Kelompok' },
                  ...kelompokOptions.map(k => ({ value: k, label: k }))
                ]}
              />
            </div>

            <button
              type="button"
              onClick={fetchUsers}
              title="Segarkan Data"
              className="w-10 h-10 rounded-xl border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors shrink-0 shadow-2xs cursor-pointer active:scale-95"
            >
              <RotateCw size={16} className={loading ? 'animate-spin text-[#168a53]' : ''} />
            </button>
          </div>
        </div>

        {/* Sub-header info bar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-600">
          <p>
            Menampilkan <span className="font-extrabold text-slate-900">{filteredUsers.length}</span> akun
            {searchQuery || selectedKelompok || roleTab !== 'semua' ? ' (terfilter)' : ''}
          </p>
          <span className="text-[11px] sm:text-xs text-[#168a53] font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#168a53]" />
            Realtime sync
          </span>
        </div>

        {/* ── Mobile Inset Grouped List (iOS 2-Row Clean Card Layout) ─────────────── */}
        <div className="lg:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center">
              <RotateCw size={26} className="animate-spin text-[#168a53] mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Memuat data akun...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center px-4">
              <Users size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-bold text-base">Tidak ada user ditemukan</p>
              <p className="text-slate-400 text-sm mt-1">Coba sesuaikan kata kunci pencarian atau filter kelompok.</p>
            </div>
          ) : (
            paginatedUsers.map(user => {
              const kelompok = user.kelompok || user.generus?.kelompok;
              const isCopied = copiedId === user.id;

              return (
                <div key={user.id} className="p-3.5 sm:p-4 space-y-2.5 hover:bg-slate-50/70 transition-colors">
                  {/* Top Row: Avatar + Name & Username + Role Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Squircle Avatar */}
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-extrabold text-sm shrink-0 shadow-2xs ${getRoleAvatarClass(user.role)}`}>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>

                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-[15px] truncate leading-tight">
                          {user.name}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate flex items-center gap-1">
                          <span>@{user.username}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-400 font-normal">#{user.id}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {renderRoleBadge(user.role)}
                    </div>
                  </div>

                  {/* Bottom Row: Kelompok Badge + Password Chip + Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/90">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      {kelompok && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-lg">
                          <MapPin size={10} className="text-[#168a53]" />
                          {kelompok}
                        </span>
                      )}

                      {user.plain_password && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(user.plain_password, user.id)}
                          className="text-[11px] font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                          title="Klik untuk menyalin password"
                        >
                          <KeyRound size={11} className="text-slate-400" />
                          <span>{user.plain_password}</span>
                          {isCopied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-slate-400" />}
                        </button>
                      )}
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-[#168a53] border border-slate-200/80 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
                        title="Edit User"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(user)}
                        className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-500 border border-slate-200/80 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
                        title="Hapus User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Desktop Modern Table (iOS Style) ───────────────────── */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100 font-extrabold uppercase text-xs tracking-wider">
                <th className="px-6 py-4">Informasi Pengguna</th>
                <th className="px-6 py-4">Username & Kredensial</th>
                <th className="px-6 py-4">Kelompok</th>
                <th className="px-6 py-4 text-center">Hak Akses / Role</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                    <RotateCw size={26} className="animate-spin text-[#168a53] mx-auto mb-2" />
                    <p className="text-sm font-medium">Memuat data akun...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <Users size={36} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-700 font-bold text-base">Tidak ada user ditemukan</p>
                    <p className="text-slate-400 text-sm mt-1">Coba sesuaikan kata kunci pencarian atau filter kelompok.</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map(user => {
                  const kelompok = user.kelompok || user.generus?.kelompok;
                  const isCopied = copiedId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-extrabold text-sm shrink-0 shadow-2xs ${getRoleAvatarClass(user.role)}`}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-[15px] sm:text-base leading-snug group-hover:text-[#168a53] transition-colors">
                              {user.name}
                            </p>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">
                              ID: #{user.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Username & Password */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200/60">
                            @{user.username}
                          </span>
                          {user.plain_password && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(user.plain_password, user.id)}
                              className="text-xs font-mono text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Salin password"
                            >
                              <KeyRound size={12} className="text-slate-400" />
                              <span>{user.plain_password}</span>
                              {isCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} className="text-slate-400" />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Kelompok */}
                      <td className="px-6 py-4">
                        {kelompok ? (
                          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50/80 border border-emerald-200/70 px-3 py-1.5 rounded-xl shadow-2xs">
                            <MapPin size={13} className="text-[#168a53]" />
                            {kelompok}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4 text-center">
                        {renderRoleBadge(user.role)}
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-2 rounded-xl text-slate-400 hover:text-[#168a53] hover:bg-emerald-50 border border-transparent hover:border-emerald-200/60 transition-colors cursor-pointer shadow-2xs"
                            title="Edit User"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(user)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200/60 transition-colors cursor-pointer shadow-2xs"
                            title="Hapus User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination (iOS Style) ─────────────────────────────── */}
        {totalPages > 1 && (
          <div className="p-3.5 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-600">
            <p className="order-2 sm:order-1 text-center sm:text-left">
              Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari {totalPages}
            </p>
            <div className="order-1 sm:order-2 flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-2xs active:scale-95"
              >
                <ChevronLeft size={15} />
                <span>Sebelumnya</span>
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-2xs active:scale-95"
              >
                <span>Selanjutnya</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAL: Form Add/Edit (iOS Modal) ══════════════════════ */}
      <Modal open={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {modalMode === 'add' ? 'Tambah User Baru' : 'Edit Pengguna'}
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {modalMode === 'add' ? 'Buat kredensial login dan tentukan hak akses.' : 'Perbarui data akun dan peran.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Peran / Hak Akses
              </label>
              <CustomSelect
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                options={[
                  { value: 'user', label: 'User Biasa (Generus)' },
                  { value: 'admin', label: 'Admin Pusat' },
                  { value: 'operator_absensi', label: 'Operator Absensi Desa' },
                  { value: 'absen_kelompok', label: 'Operator Absensi Kelompok' },
                  { value: 'mt', label: 'MT (Pengajar)' }
                ]}
              />
            </div>

            {/* Nama Lengkap / Generus Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              {['admin', 'operator_absensi', 'absen_kelompok'].includes(formData.role) ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#168a53] text-slate-800 transition-all"
                />
              ) : (
                <div>
                  <CustomSelect
                    name="generus_id"
                    value={formData.generus_id}
                    onChange={(e) => {
                      const selectedGenerus = generusList.find(g => g.id.toString() === e.target.value);
                      setFormData({
                        ...formData,
                        generus_id: e.target.value,
                        name: selectedGenerus ? selectedGenerus.nama_lengkap : '',
                        kelompok: selectedGenerus?.kelompok || formData.kelompok
                      });
                    }}
                    required
                    placeholder="Pilih dari Data Generus"
                    options={[
                      { value: '', label: '-- Pilih Data Generus --', disabled: true },
                      ...generusList.map(g => {
                        const isAssignedToOther = g.user_id && g.user_id !== formData.id;
                        return {
                          value: g.id,
                          label: `${g.nama_lengkap} (${g.kelompok || 'Slogo'})${isAssignedToOther ? ' - Sudah Ada Akun' : ''}`,
                          disabled: !!isAssignedToOther
                        };
                      })
                    ]}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Akun anggota ditautkan langsung ke data Generus.
                  </p>
                </div>
              )}
            </div>

            {/* Kelompok (Khusus absen_kelompok atau jika bisa diatur) */}
            {formData.role === 'absen_kelompok' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tugaskan ke Kelompok
                </label>
                <CustomSelect
                  name="kelompok"
                  value={formData.kelompok}
                  onChange={handleInputChange}
                  options={kelompokOptions.map(k => ({ value: k, label: k }))}
                />
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="username_pengguna"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#168a53] text-slate-800 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password{' '}
                {modalMode === 'edit' && (
                  <span className="text-slate-400 font-normal text-[10px] normal-case">
                    (Kosongkan jika tidak diubah)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={modalMode === 'add'}
                  minLength="6"
                  placeholder={modalMode === 'add' ? 'Minimal 6 karakter' : 'Ketik password baru'}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#168a53] text-slate-800 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="flex-1 py-2.5 rounded-full bg-[#168a53] hover:bg-[#127344] text-white font-bold text-xs transition-all shadow-xs active:scale-95 disabled:opacity-50"
              >
                {submitLoading ? 'Menyimpan...' : (modalMode === 'add' ? 'Simpan Akun' : 'Perbarui Akun')}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ══ MODAL: Confirm Delete (iOS Alert Dialog) ══════════════ */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="max-w-sm">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <Trash2 size={24} strokeWidth={2} />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-1.5">
            Hapus Pengguna?
          </h3>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            Yakin ingin menghapus akun <span className="font-bold text-slate-800">@{selectedUser?.username}</span>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleDelete}
              className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══ MODAL: Confirm Generate All Accounts (iOS Dialog) ═════ */}
      <Modal open={showGenerateModal} onClose={() => setShowGenerateModal(false)} maxWidth="max-w-sm">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <Sparkles size={26} strokeWidth={2} />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-1.5">
            Generate Akun Generus?
          </h3>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            Sistem akan secara otomatis membuat akun login (username & password bawaan) untuk semua data Generus yang belum memiliki akun.
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowGenerateModal(false)}
              className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={generateLoading}
              onClick={handleGenerateUsers}
              className="flex-1 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {generateLoading ? 'Memproses...' : 'Ya, Buat Akun'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══ MODAL: Confirm Delete All (iOS Alert Dialog) ═══════════ */}
      <Modal open={showDeleteAllModal} onClose={() => setShowDeleteAllModal(false)} maxWidth="max-w-sm">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle size={24} strokeWidth={2} />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-1.5">
            Hapus Semua Akun Biasa?
          </h3>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            Yakin ingin menghapus <span className="font-bold text-slate-800">seluruh akun user biasa & MT</span>? Akun Admin dan Operator Absensi akan tetap aman.
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowDeleteAllModal(false)}
              className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={deleteAllLoading}
              onClick={handleDeleteAll}
              className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {deleteAllLoading ? 'Menghapus...' : 'Ya, Hapus Semua'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
