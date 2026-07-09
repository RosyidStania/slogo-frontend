import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, X, Clock, Users, HelpCircle, Layers, LayoutGrid } from 'lucide-react';

const kategoriList = [
  'PAUD', 'TK',
  '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD',
  '1 SMP', '2 SMP', '3 SMP',
  '1 SMA/SMK', '2 SMA/SMK', '3 SMA/SMK',
  'USMAN', 'MT'
];

function Modal({ open, onClose, children, maxWidth = 'max-w-xl' }) {
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

export default function ManageEventTypes() {
  const [typesList, setTypesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({ id: '', name: '', code: '', description: '', start_time: '', target_kategori: [] });

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: '', name: '' });

  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = async () => {
    try {
      const response = await api.get('/admin/event-types');
      setTypesList(response.data.data || []);
    } catch (error) {
      console.error('Gagal memuat jenis acara:', error);
    } finally {
      setLoading(false);
    }
  };

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
    setFormData({ id: '', name: '', code: '', description: '', start_time: '', target_kategori: [] });
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
      id: data.id, name: data.name, code: data.code,
      description: data.description || '',
      start_time: data.start_time?.substring(0, 5) || '',
      target_kategori: parsedKategori,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.target_kategori.length === 0) {
      alert('Pilih minimal satu target peserta wajib untuk template ini!');
      return;
    }
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
        alert('Penyimpanan Ditolak Laravel:\n' + errorMessages);
      } else {
        alert(error.response?.data?.message || 'Terjadi kesalahan server (Error 500). Cek terminal Laravel.');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/event-types/${confirmDialog.id}`);
      setConfirmDialog({ isOpen: false, id: '', name: '' });
      fetchTypes();
    } catch (error) {
      console.error(error);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* ── Top bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Template Kategori Acara</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola aturan bawaan nama, jam hadir, dan target peserta per jenis acara rutin.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="shrink-0 flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus size={15} /> Buat Template Baru
          </button>
        </div>


        {/* ── Main table card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

          {/* Card header */}
          <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm">Daftar Template</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700">
                {typesList.length} template
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-center w-10">No</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Kode</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Nama Acara (Template)</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Jam Bawaan</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider max-w-xs">Target Peserta Wajib</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-slate-400 text-sm">
                      Memuat template...
                    </td>
                  </tr>
                ) : typesList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-16 text-center">
                      <Layers size={28} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-medium">Belum ada template</p>
                      <p className="text-slate-400 text-xs mt-1">Buat satu untuk mempermudah penjadwalan.</p>
                    </td>
                  </tr>
                ) : (
                  typesList.map((item, index) => {
                    let parsedKategori = [];
                    if (item.target_kategori) {
                      parsedKategori = Array.isArray(item.target_kategori)
                        ? item.target_kategori
                        : JSON.parse(item.target_kategori);
                    }
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-3 text-center font-semibold text-slate-400 text-sm">{index + 1}</td>
                        <td className="px-5 py-3">
                          <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 uppercase tracking-wider">
                            {item.code}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-800 text-sm">{item.name}</td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-1 text-xs font-bold text-slate-600">
                            <Clock size={12} /> {item.start_time?.substring(0, 5)} WIB
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {parsedKategori.length === kategoriList.length ? (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                SEMUA UMUR
                              </span>
                            ) : (
                              parsedKategori.map(kat => (
                                <span key={kat} className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  {kat}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => setConfirmDialog({ isOpen: true, id: item.id, name: item.name })}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
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
        </div>
      </div>

      {/* ══ MODAL: Form Add/Edit ══ */}
      <Modal open={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-800">
              {modalMode === 'add' ? 'Buat Aturan Template' : 'Edit Template'}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Kode Singkat
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="SEMALAMAN, KEAKRABAN"
                  required
                  disabled={modalMode === 'edit'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Batas Jam Hadir Default
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nama Acara Default
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Contoh: Pengajian Semalaman Rutin"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 font-semibold"
              />
            </div>

            {/* Target Peserta */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Peserta Wajib
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllKategori(true)}
                    className="text-[10px] font-bold text-teal-500 hover:text-teal-600 transition-colors"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllKategori(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {kategoriList.map(kategori => {
                  const isChecked = formData.target_kategori.includes(kategori);
                  return (
                    <label
                      key={kategori}
                      className={`cursor-pointer flex items-center px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider select-none transition-all ${
                        isChecked
                          ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(kategori)}
                      />
                      {kategori}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Keterangan Tambahan
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Opsional..."
                rows="2"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 resize-none"
              />
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
                Simpan Template
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ══ MODAL: Confirm Delete ══ */}
      <Modal open={confirmDialog.isOpen} onClose={() => setConfirmDialog({ isOpen: false, id: '', name: '' })}>
        <div className="p-8 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-5 mx-auto">
            <HelpCircle size={26} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Template?</h3>
          <p className="text-slate-500 text-sm mb-7 leading-relaxed">
            Menghapus <span className="font-bold text-slate-800">{confirmDialog.name}</span> tidak
            menghapus acara yang sudah terlanjur dijadwalkan.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDialog({ isOpen: false, id: '', name: '' })}
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
    </div>
  );
}