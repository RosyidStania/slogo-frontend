import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { User as UserIcon, ShieldCheck, UserCircle, Plus, Edit, Trash2, X, HelpCircle, Users, Shield, AlertTriangle, ChevronDown, Eye, EyeOff, Search } from 'lucide-react';

function Modal({ open, onClose, children, maxWidth = 'max-w-md' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({ id: '', name: '', username: '', role: 'user', password: '', generus_id: '' });
  const [generusList, setGenerusList] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelompok, setSelectedKelompok] = useState('');

  const kelompokOptions = [...new Set(generusList.map(g => g.kelompok).filter(Boolean))].sort();

  useEffect(() => { 
    fetchUsers(); 
    fetchGenerus();
  }, []);

  const fetchUsers = async () => {
    try {
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

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: '', name: '', username: '', role: 'user', password: '', generus_id: '' });
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
      generus_id: user.generus?.id || '' 
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await api.post('/admin/users', formData);
      } else {
        await api.put(`/admin/users/${formData.id}`, formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setShowDeleteModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Gagal menghapus user:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.delete('/admin/users/destroy-all');
      setShowDeleteAllModal(false);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus semua user.');
    }
  };

  const handleGenerateUsers = async () => {
    if (!window.confirm('Apakah Anda yakin ingin men-generate akun untuk semua data Generus yang belum punya akun?')) return;
    try {
      const res = await api.post('/admin/users/generate-from-generus');
      alert(res.data.message);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal generate akun generus.');
    }
  };

  const totalAdmin = users.filter(u => u.role === 'admin').length;
  const totalUser  = users.filter(u => u.role === 'user').length;

  const filteredUsers = users.filter(user => {
    const matchSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const userKelompok = user.generus?.kelompok || '';
    const matchKelompok = selectedKelompok ? userKelompok === selectedKelompok : true;

    return matchSearch && matchKelompok;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* ── Top bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Manajemen Akun</h1>
            <p className="text-xs text-slate-400 mt-0.5">Kelola akses dan keamanan user.</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="shrink-0 flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              <Trash2 size={15} /> Hapus Semua
            </button>
            <button
              onClick={handleGenerateUsers}
              className="shrink-0 flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              <Users size={15} /> Generate Akun Generus
            </button>
            <button
              onClick={openAddModal}
              className="shrink-0 flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus size={15} /> Tambah User
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Akun',  value: users.length,  color: 'text-slate-700',  bg: 'bg-white border-slate-200',    icon: <Users size={16} className="text-slate-400" /> },
            { label: 'Admin',       value: totalAdmin,     color: 'text-teal-700',   bg: 'bg-teal-50 border-teal-100',   icon: <Shield size={16} className="text-teal-400" /> },
            { label: 'User Biasa',  value: totalUser,      color: 'text-slate-700',  bg: 'bg-white border-slate-200',    icon: <UserIcon size={16} className="text-slate-400" /> },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-2xl px-4 py-3 flex items-center justify-between`}>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-bold mt-0.5 tabular-nums ${s.color}`}>{s.value}</p>
              </div>
              {s.icon}
            </div>
          ))}
        </div>

        {/* ── Table card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

          {/* Card header */}
          <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 gap-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm">Daftar Akun</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700">
                {filteredUsers.length} akun
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <select
                  value={selectedKelompok}
                  onChange={(e) => setSelectedKelompok(e.target.value)}
                  className="w-full sm:w-40 pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 appearance-none shadow-sm"
                >
                  <option value="">Semua Kelompok</option>
                  {kelompokOptions.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative w-full sm:w-64 shrink-0">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 transition-shadow shadow-sm hover:shadow-md"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Info User</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Username</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-center">Role</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-10 text-center text-slate-400 text-sm">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-16 text-center">
                      <Users size={28} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-medium">
                        {searchQuery ? 'Tidak ada user yang cocok dengan pencarian' : 'Belum ada akun terdaftar'}
                      </p>
                      {!searchQuery && (
                        <p className="text-slate-400 text-xs mt-1">Tambahkan user untuk mulai mengelola akses.</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                            <UserCircle size={20} strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                              ID: {user.id} {user.generus?.kelompok ? `• ${user.generus.kelompok}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                            @{user.username}
                          </span>
                          {user.plain_password && (
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                              Pwd: {user.plain_password}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          user.role === 'admin'
                            ? 'bg-teal-50 text-teal-700 border-teal-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {user.role === 'admin' ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══ MODAL: Form Add/Edit ══ */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-800">
              {modalMode === 'add' ? 'Tambah User Baru' : 'Edit User'}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              {formData.role === 'admin' ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800"
                />
              ) : (
                <div className="relative">
                  <select
                    name="generus_id"
                    value={formData.generus_id}
                    onChange={(e) => {
                      const selectedGenerus = generusList.find(g => g.id.toString() === e.target.value);
                      setFormData({ 
                        ...formData, 
                        generus_id: e.target.value, 
                        name: selectedGenerus ? selectedGenerus.nama_lengkap : '' 
                      });
                    }}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 appearance-none pr-10"
                  >
                    <option value="" disabled>-- Pilih Data Generus --</option>
                    {generusList.map(g => {
                      const isAssignedToOther = g.user_id && g.user_id !== formData.id;
                      return (
                        <option key={g.id} value={g.id} disabled={isAssignedToOther}>
                          {g.nama_lengkap} {isAssignedToOther ? '(Sudah punya akun)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Role
              </label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 appearance-none cursor-pointer"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password{' '}
                {modalMode === 'edit' && (
                  <span className="text-slate-400 font-normal text-[10px] normal-case">
                    (Kosongkan jika tidak diubah)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={modalMode === 'add'}
                  minLength="6"
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-teal-600 transition-colors rounded-lg"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                {modalMode === 'add' ? 'Simpan User' : 'Update Data'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ══ MODAL: Confirm Delete ══ */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="max-w-sm">
        <div className="p-8 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-5 mx-auto">
            <HelpCircle size={26} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus User?</h3>
          <p className="text-slate-500 text-sm mb-7 leading-relaxed">
            Yakin ingin menghapus{' '}
            <span className="font-bold text-slate-800">@{selectedUser?.username}</span>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>

      {/* ══ MODAL: Confirm Delete All ══ */}
      <Modal open={showDeleteAllModal} onClose={() => setShowDeleteAllModal(false)} maxWidth="max-w-sm">
        <div className="p-8 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-5 mx-auto">
            <AlertTriangle size={26} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Semua User Biasa?</h3>
          <p className="text-slate-500 text-sm mb-7 leading-relaxed">
            Yakin ingin menghapus <span className="font-bold text-slate-800">seluruh akun user biasa</span>?
            Akun admin tidak akan terhapus. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteAllModal(false)}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteAll}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
            >
              Ya, Hapus Semua
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}