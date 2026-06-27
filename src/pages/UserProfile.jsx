import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Activity, Hash, Camera, Save, RefreshCw, Smartphone, Lock, Key, Edit2, X, Eye, EyeOff, Shield } from 'lucide-react';
import api from '../api/axios';

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profil'); // 'profil' or 'keamanan'

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [passSaving, setPassSaving] = useState(false);
  const [passError, setPassError] = useState(null);
  const [passSuccess, setPassSuccess] = useState(null);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    keterangan: '',
    libur: '',
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
        keterangan: userData.generus?.keterangan || '',
        libur: userData.generus?.libur || '',
      });
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'no_hp') {
      value = value.replace(/\D/g, '');
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setPassError('Konfirmasi password tidak cocok.');
      return;
    }
    
    try {
      setPassSaving(true);
      setPassError(null);
      setPassSuccess(null);
      const res = await api.post('/reset-password', passwordData);
      setPassSuccess('Password berhasil diubah!');
      setPasswordData({ old_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      console.error(err);
      setPassError(err.response?.data?.message || 'Gagal mengubah password.');
    } finally {
      setPassSaving(false);
    }
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
      setIsEditing(false);
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
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative pb-24">
      
      {/* Notifications */}
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center shadow-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-teal-50 text-teal-600 p-4 rounded-xl border border-teal-100 flex items-center shadow-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR (Left Column) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden lg:sticky lg:top-8 relative">
            <div className="h-32 bg-gradient-to-br from-teal-400 to-teal-600 relative">
              <button 
                onClick={() => {
                  if (activeTab !== 'profil') setActiveTab('profil');
                  setIsEditing(!isEditing);
                  if (isEditing) fetchProfile(); // cancel edit
                }}
                className={`absolute top-4 right-4 p-2.5 rounded-full shadow-md transition-colors ${
                  isEditing ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-slate-600 hover:text-teal-600'
                }`}
                title={isEditing ? 'Batal Edit' : 'Edit Profil'}
              >
                {isEditing ? <X size={20} /> : <Edit2 size={20} />}
              </button>
            </div>
            
            <div className="px-8 pb-8 flex flex-col items-center -mt-16">
              <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-lg relative mb-4">
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-5xl font-bold text-teal-600">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800 text-center">{formData.name || 'Nama Lengkap'}</h2>
              <p className="text-slate-500 text-sm mb-6">@{formData.username}</p>

              <div className="w-full space-y-4">
                <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Phone size={18} className="text-teal-500" />
                  <span className="text-sm font-medium">{formData.no_hp || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Activity size={18} className="text-teal-500" />
                  <span className="text-sm font-medium">{formData.keterangan || 'Pelajar/Karyawan'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT (Right Column) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tabs Navigation */}
          <div className="flex gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-200/60 mb-6">
            <button
              onClick={() => setActiveTab('profil')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'profil' 
                  ? 'bg-slate-800 text-white shadow' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <User size={18} />
              Informasi Pribadi
            </button>
            <button
              onClick={() => {
                setActiveTab('keamanan');
                setIsEditing(false); // Disable profile edit if switching to security
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'keamanan' 
                  ? 'bg-slate-800 text-white shadow' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Shield size={18} />
              Keamanan
            </button>
          </div>

          {/* TAB 1: INFORMASI PRIBADI */}
          {activeTab === 'profil' && (
            <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Card: Data Akun */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 transition-all">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Data Akun</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
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
                        disabled={!isEditing}
                        className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2.5 disabled:bg-transparent disabled:border-transparent disabled:font-semibold disabled:text-slate-800 disabled:px-0 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
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
                        disabled={!isEditing}
                        className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2.5 disabled:bg-transparent disabled:border-transparent disabled:font-semibold disabled:text-slate-800 disabled:px-0 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Data Pribadi */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 transition-all">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Data Pribadi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tempat Lahir</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        name="tempat_lahir" 
                        value={formData.tempat_lahir} 
                        onChange={handleChange} 
                        placeholder={isEditing ? "Kota Lahir" : "-"}
                        disabled={!isEditing}
                        className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2.5 disabled:bg-transparent disabled:border-transparent disabled:font-semibold disabled:text-slate-800 disabled:px-0 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Lahir</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="date" 
                        name="tanggal_lahir" 
                        value={formData.tanggal_lahir} 
                        onChange={handleChange}
                        disabled={!isEditing} 
                        className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2.5 disabled:bg-transparent disabled:border-transparent disabled:font-semibold disabled:text-slate-800 disabled:px-0 transition-all"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Kelamin</label>
                    <select 
                      name="jenis_kelamin" 
                      value={formData.jenis_kelamin} 
                      onChange={handleChange} 
                      disabled={!isEditing}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2.5 disabled:bg-transparent disabled:border-transparent disabled:font-semibold disabled:text-slate-800 disabled:appearance-none disabled:px-0 transition-all"
                    >
                      <option value="">- Pilih Jenis Kelamin -</option>
                      <option value="L">Laki-Laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card: Keluarga */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 transition-all">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Keluarga</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nama Ayah</label>
                    <input 
                      type="text" 
                      name="nama_ayah" 
                      value={formData.nama_ayah} 
                      onChange={handleChange} 
                      disabled={!isEditing}
                      placeholder={isEditing ? "Nama Ayah" : "-"}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2.5 disabled:bg-transparent disabled:border-transparent disabled:font-semibold disabled:text-slate-800 disabled:px-0 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nama Ibu</label>
                    <input 
                      type="text" 
                      name="nama_ibu" 
                      value={formData.nama_ibu} 
                      onChange={handleChange} 
                      disabled={!isEditing}
                      placeholder={isEditing ? "Nama Ibu" : "-"}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2.5 disabled:bg-transparent disabled:border-transparent disabled:font-semibold disabled:text-slate-800 disabled:px-0 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Card: Kontak & Lainnya */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 transition-all">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Kontak & Informasi Tambahan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">No. HP / WA</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        name="no_hp" 
                        value={formData.no_hp} 
                        onChange={handleChange} 
                        disabled={!isEditing}
                        placeholder={isEditing ? "Contoh: 0812345678" : "-"}
                        className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2.5 disabled:bg-transparent disabled:border-transparent disabled:font-semibold disabled:text-slate-800 disabled:px-0 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Akun Media Sosial</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Smartphone size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        name="akun_media" 
                        value={formData.akun_media} 
                        onChange={handleChange} 
                        placeholder={isEditing ? "@username atau link profil" : "-"}
                        disabled={!isEditing}
                        className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2.5 disabled:bg-transparent disabled:border-transparent disabled:font-semibold disabled:text-slate-800 disabled:px-0 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Hobi</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Activity size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        name="hobi" 
                        value={formData.hobi} 
                        onChange={handleChange} 
                        disabled={!isEditing}
                        placeholder={isEditing ? "Hobi Anda" : "-"}
                        className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2.5 disabled:bg-transparent disabled:border-transparent disabled:font-semibold disabled:text-slate-800 disabled:px-0 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Keterangan / Pekerjaan</label>
                    <input 
                      type="text" 
                      name="keterangan" 
                      value={formData.keterangan} 
                      onChange={handleChange} 
                      placeholder={isEditing ? "Pelajar / Karyawan..." : "-"}
                      disabled={!isEditing}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2.5 disabled:bg-transparent disabled:border-transparent disabled:font-semibold disabled:text-slate-800 disabled:px-0 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Hari Libur</label>
                    <input 
                      type="text" 
                      name="libur" 
                      value={formData.libur} 
                      onChange={handleChange} 
                      placeholder={isEditing ? "Contoh: Sabtu / Minggu" : "-"}
                      disabled={!isEditing}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-2.5 disabled:bg-transparent disabled:border-transparent disabled:font-semibold disabled:text-slate-800 disabled:px-0 transition-all"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: KEAMANAN (Password) */}
          {activeTab === 'keamanan' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 transition-all animate-in fade-in duration-300">
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Key size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Ganti Password</h3>
                  <p className="text-slate-500 text-sm">Perbarui kata sandi Anda secara berkala untuk menjaga keamanan akun.</p>
                </div>

                {passError && (
                  <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center">
                    {passError}
                  </div>
                )}

                {passSuccess && (
                  <div className="mb-6 bg-teal-50 text-teal-600 p-4 rounded-xl border border-teal-100 flex items-center">
                    {passSuccess}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password Lama</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Key size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type={showOldPassword ? "text" : "password"} 
                        name="old_password" 
                        value={passwordData.old_password} 
                        onChange={handlePasswordChange} 
                        required
                        className="pl-12 pr-12 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-3"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-teal-600 transition-colors"
                      >
                        {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password Baru</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        name="new_password" 
                        value={passwordData.new_password} 
                        onChange={handlePasswordChange} 
                        required
                        minLength={6}
                        className="pl-12 pr-12 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-3"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-teal-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Konfirmasi Password Baru</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        name="new_password_confirmation" 
                        value={passwordData.new_password_confirmation} 
                        onChange={handlePasswordChange} 
                        required
                        minLength={6}
                        className="pl-12 pr-12 w-full rounded-xl border-slate-200 bg-slate-50 border focus:border-teal-500 focus:ring-teal-500 px-4 py-3"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-teal-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      type="submit" 
                      disabled={passSaving}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {passSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                      {passSaving ? 'Memproses...' : 'Ubah Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Floating Action Bar (Only visible when editing) */}
      {isEditing && activeTab === 'profil' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 flex justify-center animate-in slide-in-from-bottom-full duration-300">
          <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-3 px-2 sm:px-8">
            <span className="text-sm font-semibold text-slate-500 hidden sm:inline mr-auto">
              Ada perubahan yang belum disimpan.
            </span>
            <div className="flex w-full sm:w-auto gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(false);
                  fetchProfile();
                }}
                className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <X size={18} />
                Batal
              </button>
              <button 
                type="submit" 
                form="profile-form"
                disabled={saving}
                className="flex-1 sm:flex-none bg-teal-500 hover:bg-teal-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
