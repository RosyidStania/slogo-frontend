import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Search, Loader2, Edit, X, Users, User, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const JENJANG_LIST  = ['PAUD', 'TK', '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD', '1 SMP', '2 SMP', '3 SMP', '1 SMA/SMK', '2 SMA/SMK', '3 SMA/SMK', 'USMAN', 'MT'];

function Avatar({ name, gender }) {
  const bg = gender === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600';
  return (
    <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center font-bold shrink-0`}>
      {name ? name.charAt(0).toUpperCase() : '?'}
    </div>
  );
}

function StatusBadge({ status = 'aktif' }) {
  const meta = {
    'aktif': { label: 'Aktif', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
    'pasif': { label: 'Pasif', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
    'tidak aktif': { label: 'Tidak Aktif', color: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' },
  }[status?.toLowerCase()] ?? { label: 'Aktif', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
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

export default function MtMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mt/group-members');
      setMembers(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = members.filter(g => g.nama_lengkap?.toLowerCase().includes(search.toLowerCase()));
  
  const totalAktif = members.filter(g => g.status?.toLowerCase() === 'aktif').length;
  const totalPasif = members.filter(g => g.status?.toLowerCase() === 'pasif').length;
  const totalNonaktif = members.filter(g => g.status?.toLowerCase() === 'tidak aktif').length;

  const openEdit = (item) => {
    setFormData({ ...item });
    setShowForm(true);
  };

  const inp = (e) => {
    let { name, value } = e.target;
    if (name === 'no_hp') value = value.replace(/\D/g, '');
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/mt/group-members/${formData.id}`, formData);
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Anggota Kelompok</h1>
          <p className="text-slate-500 text-sm mt-0.5">Kelola data peserta generus kelompok Anda</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Peserta', value: members.length, color: 'text-slate-700', bg: 'bg-white', border: 'border-slate-200', icon: <Users size={18} className="text-slate-400" /> },
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

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-semibold text-slate-700">{filtered.length}</span> dari {members.length} peserta
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide border-b border-slate-100">
                  <th className="px-5 py-3 text-left w-8">#</th>
                  <th className="px-5 py-3 text-left">Nama</th>
                  <th className="px-5 py-3 text-left">Jenjang</th>
                  <th className="px-5 py-3 text-left">L/P</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">No HP</th>
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
                    </td>
                  </tr>
                ) : filtered.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={item.nama_lengkap} gender={item.jenis_kelamin} />
                        <p className="font-semibold text-slate-800 leading-tight">{item.nama_lengkap}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">{item.jenjang || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{item.jenis_kelamin}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{item.no_hp || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit size={15} />
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

      {showForm && formData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Edit Data Peserta</h3>
                <p className="text-sm text-slate-500 mt-0.5">Mengedit data {formData.nama_lengkap}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <Field label="Nama Lengkap *">
                <TextInput name="nama_lengkap" value={formData.nama_lengkap} onChange={inp} required placeholder="Masukkan nama lengkap" />
              </Field>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Jenis Kelamin">
                  <CustomSelect name="jenis_kelamin" value={formData.jenis_kelamin} onChange={inp} options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} />
                </Field>
                <Field label="Jenjang">
                  <CustomSelect name="jenjang" value={formData.jenjang} onChange={inp} options={JENJANG_LIST.map(j => ({ value: j, label: j }))} />
                </Field>
                <Field label="Status">
                  <CustomSelect name="status" value={formData.status} onChange={inp} options={[{ value: 'aktif', label: '🟢 Aktif' }, { value: 'pasif', label: '🟡 Pasif' }, { value: 'tidak aktif', label: '🔴 Tidak Aktif' }]} />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Tempat Lahir"><TextInput name="tempat_lahir" value={formData.tempat_lahir || ''} onChange={inp} /></Field>
                <Field label="Tanggal Lahir"><TextInput name="tanggal_lahir" value={formData.tanggal_lahir || ''} onChange={inp} type="date" /></Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="No. HP"><TextInput name="no_hp" value={formData.no_hp || ''} onChange={inp} /></Field>
                <Field label="Akun Media Sosial"><TextInput name="akun_media" value={formData.akun_media || ''} onChange={inp} /></Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Keterangan"><TextInput name="keterangan" value={formData.keterangan || ''} onChange={inp} /></Field>
                <Field label="Hari Libur"><TextInput name="libur" value={formData.libur || ''} onChange={inp} /></Field>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-3">Data Orang Tua</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nama Ayah"><TextInput name="nama_ayah" value={formData.nama_ayah || ''} onChange={inp} /></Field>
                  <Field label="Nama Ibu"><TextInput name="nama_ibu" value={formData.nama_ibu || ''} onChange={inp} /></Field>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
