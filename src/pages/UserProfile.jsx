import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Activity, Hash, Camera, Save, RefreshCw, Smartphone } from 'lucide-react';
import api from '../api/axios';

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    nama_ayah: '',
    nama_ibu: '',
    no_hp: '',
    akun_media: '',
    hobi: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/user/profile');
      const userData = res.data.user;
      setProfile(userData);
      
      setFormData({
        name: userData.name || '',
        username: userData.username || '',
        tempat_lahir: userData.generus?.tempat_lahir || '',
        tanggal_lahir: userData.generus?.tanggal_lahir || '',
        jenis_kelamin: userData.generus?.jenis_kelamin || '',
        nama_ayah: userData.generus?.nama_ayah || '',
        nama_ibu: userData.generus?.nama_ibu || '',
        no_hp: userData.generus?.no_hp || '',
        akun_media: userData.generus?.akun_media || '',
        hobi: userData.generus?.hobi || '',
      });
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const res = await api.put('/user/profile', formData);
      setSuccess('Profil berhasil diperbarui!');
      setProfile(res.data.user);
      
      // Update local storage if username changes (optional, usually token is still valid if username changes unless used in payload validation)
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Profil Saya</h1>
        <p className="text-slate-500 mt-1">Kelola informasi data diri Anda.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-teal-50 text-teal-600 p-4 rounded-xl border border-teal-100 flex items-center">
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {/* Header Banner */}
        <div className="h-32 bg-gradient-to-r from-teal-400 to-teal-600 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
              <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-teal-600">
                {formData.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-16 px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Akun Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Data Akun</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required
                      className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash size={18} className="text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      name="username" 
                      value={formData.username} 
                      onChange={handleChange} 
                      required
                      className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2"
                    />
                  </div>
                </div>

              </div>

              {/* Personal Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Data Pribadi</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tempat Lahir</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        name="tempat_lahir" 
                        value={formData.tempat_lahir} 
                        onChange={handleChange} 
                        className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="date" 
                        name="tanggal_lahir" 
                        value={formData.tanggal_lahir} 
                        onChange={handleChange} 
                        className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label>
                  <select 
                    name="jenis_kelamin" 
                    value={formData.jenis_kelamin} 
                    onChange={handleChange} 
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Keluarga Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Keluarga</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ayah</label>
                  <input 
                    type="text" 
                    name="nama_ayah" 
                    value={formData.nama_ayah} 
                    onChange={handleChange} 
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ibu</label>
                  <input 
                    type="text" 
                    name="nama_ibu" 
                    value={formData.nama_ibu} 
                    onChange={handleChange} 
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2"
                  />
                </div>
              </div>

              {/* Kontak & Tambahan Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Kontak & Lainnya</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">No. HP / WA</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={18} className="text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      name="no_hp" 
                      value={formData.no_hp} 
                      onChange={handleChange} 
                      className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Akun Media Sosial</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Smartphone size={18} className="text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      name="akun_media" 
                      value={formData.akun_media} 
                      onChange={handleChange} 
                      placeholder="@username atau link profil"
                      className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hobi</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Activity size={18} className="text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      name="hobi" 
                      value={formData.hobi} 
                      onChange={handleChange} 
                      className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-6 border-t mt-8 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {saving ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
