import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import bgImage from '../assets/Generus.jpeg';
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
    try {
      const response = await api.post('/login', { username, password });
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('role', response.data.role);
        
        setTimeout(() => {
          const role = response.data.role;
          if (role === 'admin') {
            navigate('/admin');
          } else if (role === 'mt') {
            navigate('/mt');
          } else {
            navigate('/users');
          }
        }, 500); // Small delay for smooth button animation
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali username & password.');
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-slate-50 text-slate-800">
      {/* Left section: Visuals & Branding using Teal theme and Background Image */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Background Image with Teal Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
        <div className="absolute inset-0 bg-teal-900/80 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-900/80 to-transparent opacity-90"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-400 rounded-full mix-blend-overlay filter blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-300 rounded-full mix-blend-overlay filter blur-[100px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 flex items-center space-x-3 text-white">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 flex items-center justify-center shadow-xl p-1.5">
            <img src={logoImg} alt="Logo Desa Slogo" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Desa Slogo</span>
        </div>

        <div className="relative z-10 mb-20">

          <h1 className="text-5xl font-extrabold text-white leading-[1.15] tracking-tight mb-6">
            Sistem Pendataan <br />
            <span className="text-teal-300">
              Modern & Akurat
            </span>
          </h1>
          <p className="text-teal-50 text-lg max-w-md leading-relaxed font-light">
            Kelola dan pantau data Anda dengan efisien. Platform Slogo dirancang untuk memberikan wawasan terbaik bagi produktivitas tim Anda.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-teal-200/80 text-sm font-medium">
          <span>&copy; {new Date().getFullYear()} Desa Slogo Data System.</span>

        </div>
      </div>

      {/* Right section: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white">
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wMykiLz48L3N2Zz4=')]"></div>
        
        <div className="w-full max-w-[420px] relative z-10">
          
          <div className="lg:hidden flex items-center justify-center space-x-3 text-slate-900 mb-10">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/10 border border-slate-100 p-1.5">
              <img src={logoImg} alt="Logo Desa Slogo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">Desa Slogo</span>
          </div>

          <div className="mb-10 lg:text-left text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-3">
              Selamat Datang
            </h2>
            <p className="text-slate-500 font-medium">
              Silakan masukkan kredensial Anda untuk masuk.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50/80 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl mb-8 text-sm font-medium flex items-start shadow-sm">
              <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all duration-300 outline-none text-slate-800 hover:border-slate-300 shadow-sm"
                  placeholder="Masukkan username"
                  required 
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all duration-300 outline-none text-slate-800 pr-12 hover:border-slate-300 shadow-sm"
                  placeholder="••••••••"
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-teal-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full group relative flex justify-center items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 active:scale-[0.98] mt-6 shadow-lg shadow-teal-600/20 ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="text-[15px]">Masuk ke Sistem</span>
                  <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}