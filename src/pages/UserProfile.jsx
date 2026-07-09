import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Activity, Hash, Camera, Save, RefreshCw, Smartphone, Lock, Key, Edit2, X, Eye, EyeOff, Shield, Users, BookOpen } from 'lucide-react';
import api from '../api/axios';
import CustomSelect from '../components/CustomSelect';
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
    kelompok: '',
    jenjang: '',
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
        kelompok: userData.generus?.kelompok || '',
        jenjang: userData.generus?.jenjang || '',
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

  const renderField = ({ label, name, icon: Icon, type = 'text', required = false, options = [], placeholder = '' }) => {
    if (!isEditing) {
      let displayValue = formData[name] || '-';
      if (type === 'select' && displayValue !== '-') {
        const opt = options.find(o => o.value === displayValue);
        if (opt) displayValue = opt.label;
      }
      return (
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-teal-200 hover:shadow-sm transition-all">
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm font-bold text-slate-800 leading-tight truncate">
              {displayValue}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-sm hover:border-teal-300 hover:shadow-md transition-all duration-300 group">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 group-focus-within:text-teal-600 transition-colors">{label}</label>
        {type === 'select' ? (
          <CustomSelect 
            name={name} 
            value={formData[name]} 
            onChange={handleChange} 
            required={required}
            options={options}
          />
        ) : (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icon size={18} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            </div>
            <input 
              type={type} 
              name={name} 
              value={formData[name]} 
              onChange={handleChange} 
              required={required}
              placeholder={placeholder || `Masukkan ${label.toLowerCase()}`}
              className="pl-11 w-full rounded-xl border-slate-200 bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 px-4 py-2.5 transition-all text-sm font-medium text-slate-700"
            />
          </div>
        )}
      </div>
    );
  };

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
          <div className="bg-white rounded-3xl shadow-xl shadow-teal-500/5 border border-slate-100 overflow-hidden lg:sticky lg:top-8 relative group">
            <div className="h-36 bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <button 
                onClick={() => {
                  if (activeTab !== 'profil') setActiveTab('profil');
                  setIsEditing(!isEditing);
                  if (isEditing) fetchProfile(); // cancel edit
                }}
                className={`absolute top-4 right-4 p-2.5 rounded-full shadow-md transition-all duration-300 hover:scale-110 z-10 ${
                  isEditing ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-red-500/30' : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'
                }`}
                title={isEditing ? 'Batal Edit' : 'Edit Profil'}
              >
                {isEditing ? <X size={20} /> : <Edit2 size={20} />}
              </button>
            </div>
            
            <div className="px-8 pb-8 flex flex-col items-center -mt-16">
              <div className="w-32 h-32 bg-white rounded-full p-2 shadow-xl shadow-teal-500/20 relative mb-5 group-hover:scale-105 transition-transform duration-500">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-5xl font-black text-teal-600 border border-slate-100">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 text-center tracking-tight">{formData.name || 'Nama Lengkap'}</h2>
              <p className="text-teal-600 font-bold text-[11px] uppercase tracking-wider mb-6 bg-teal-50 px-4 py-1.5 rounded-full mt-3 border border-teal-100/50">@{formData.username}</p>

              <div className="w-full space-y-3">
                <div className="flex items-center gap-4 text-slate-600 bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors shadow-sm">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                    <Phone size={18} className="text-teal-500" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{formData.no_hp || 'Belum ditambahkan'}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600 bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors shadow-sm">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <Activity size={18} className="text-emerald-500" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{formData.keterangan || 'Pelajar/Karyawan'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT (Right Column) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tabs Navigation */}
          <div className="flex gap-2 p-1.5 bg-slate-100/70 backdrop-blur-md rounded-2xl shadow-inner mb-8">
            <button
              onClick={() => setActiveTab('profil')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2.5 ${
                activeTab === 'profil' 
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <User size={18} />
              Informasi Pribadi
            </button>
            <button
              onClick={() => {
                setActiveTab('keamanan');
                setIsEditing(false);
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2.5 ${
                activeTab === 'keamanan' 
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField({ label: 'Nama Lengkap', name: 'name', icon: User, required: true })}
                  {renderField({ label: 'Username', name: 'username', icon: Hash, required: true })}
                </div>
              </div>

              {/* Card: Organisasi & Pendidikan */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 transition-all">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Kelompok & Jenjang</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField({ label: 'Kelompok', name: 'kelompok', icon: Users, placeholder: 'Contoh: Slogo' })}
                  {renderField({ label: 'Jenjang', name: 'jenjang', icon: BookOpen, placeholder: 'Contoh: USMAN / 6 SD' })}
                </div>
              </div>

              {/* Card: Data Pribadi */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 transition-all">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Data Pribadi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField({ label: 'Tempat Lahir', name: 'tempat_lahir', icon: MapPin, placeholder: 'Kota Lahir' })}
                  {renderField({ label: 'Tanggal Lahir', name: 'tanggal_lahir', icon: Calendar, type: 'date' })}
                  <div className="md:col-span-2">
                    {renderField({ label: 'Jenis Kelamin', name: 'jenis_kelamin', icon: User, type: 'select', options: [
                      { value: '', label: '- Pilih Jenis Kelamin -' },
                      { value: 'L', label: 'Laki-Laki' },
                      { value: 'P', label: 'Perempuan' }
                    ]})}
                  </div>
                </div>
              </div>

              {/* Card: Keluarga */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 transition-all">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Keluarga</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField({ label: 'Nama Ayah', name: 'nama_ayah', icon: User, placeholder: 'Nama Ayah' })}
                  {renderField({ label: 'Nama Ibu', name: 'nama_ibu', icon: User, placeholder: 'Nama Ibu' })}
                </div>
              </div>

              {/* Card: Kontak & Lainnya */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 transition-all">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Kontak & Informasi Tambahan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField({ label: 'No. HP / WA', name: 'no_hp', icon: Phone, placeholder: 'Contoh: 0812345678' })}
                  {renderField({ label: 'Akun Media Sosial', name: 'akun_media', icon: Smartphone, placeholder: '@username atau link profil' })}
                  {renderField({ label: 'Hobi', name: 'hobi', icon: Activity, placeholder: 'Hobi Anda' })}
                  {renderField({ label: 'Keterangan / Pekerjaan', name: 'keterangan', icon: Activity, placeholder: 'Pelajar / Karyawan...' })}
                  <div className="md:col-span-2">
                    {renderField({ label: 'Hari Libur', name: 'libur', icon: Calendar, placeholder: 'Contoh: Sabtu / Minggu' })}
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
