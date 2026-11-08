import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  LogIn, 
  Eye, 
  EyeOff, 
  User, 
  Lock, 
  ChevronLeft, 
  AlertCircle, 
  Loader2
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/login', { username, password });
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('kelompok', response.data.user?.kelompok || response.data.user?.generus?.kelompok || '');
        localStorage.setItem('name', response.data.user?.name || '');
        
        setTimeout(() => {
          const role = response.data.role;
          if (role === 'admin') {
            navigate('/admin');
          } else if (role === 'operator_absensi' || role === 'absen_kelompok') {
            navigate('/admin/events');
          } else if (role === 'mt') {
            navigate('/mt');
          } else {
            navigate('/users');
          }
        }, 400); // Small delay for smooth button animation
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali username & password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col justify-between selection:bg-[#168a53] selection:text-white relative overflow-hidden">
      
      {/* iOS Soft Ambient Gradient Orbs */}
      <div className="fixed top-[-100px] left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-b from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[450px] h-[450px] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Bar Navigation */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent hover:border-slate-200/80 transition-all duration-200 active:scale-95 shadow-2xs"
        >
          <ChevronLeft size={16} strokeWidth={2.4} className="text-slate-500" />
          <span>Kembali ke Beranda</span>
        </Link>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 z-10">
        <div className="w-full max-w-[420px]">
          
          {/* iOS Card */}
          <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-[28px] sm:rounded-[36px] p-6 sm:p-9 shadow-[0_12px_40px_rgba(0,0,0,0.04)] animate-in fade-in zoom-in-95 duration-400">
            
            {/* iOS App Icon */}
            <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-[22px] bg-white p-3 shadow-md shadow-slate-200/50 border border-slate-200/80 flex items-center justify-center mb-3.5 group hover:scale-105 transition-transform duration-300">
                <img 
                  src={logoImg} 
                  alt="Logo Desa Slogo" 
                  className="w-full h-full object-contain drop-shadow-2xs" 
                />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Selamat Datang
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 font-normal">
                Masuk untuk mengelola data & presensi generus
              </p>
            </div>

            {/* Error Notification (Apple Alert Callout) */}
            {error && (
              <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs sm:text-sm font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
                <AlertCircle size={18} className="shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Field: Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={17} strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-[#168a53] focus:ring-4 focus:ring-emerald-500/15 transition-all shadow-2xs font-medium"
                    placeholder="Masukkan username Anda"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Field: Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={17} strokeWidth={2} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 bg-[#f8fafc] border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-[#168a53] focus:ring-4 focus:ring-emerald-500/15 transition-all shadow-2xs font-medium"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer active:scale-90"
                    title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#168a53] hover:bg-[#137747] text-white font-bold text-sm sm:text-base rounded-2xl shadow-sm shadow-emerald-700/25 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <LogIn size={17} strokeWidth={2.4} />
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>

          {/* Quick Help Card */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              Belum memiliki akun atau lupa password? Hubungi <span className="text-slate-600 font-semibold">Admin Desa Slogo</span>.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 py-6 text-center text-xs text-slate-400 z-10">
        <p>&copy; {new Date().getFullYear()} DesaSlogo. Sistem Manajemen Generus.</p>
      </footer>

    </div>
  );
}
