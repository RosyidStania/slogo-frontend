import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Pastikan halaman login selalu dalam mode terang saat dimuat
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', { username, password });
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('role', response.data.role);
        
        const role = response.data.role;
            if (role === 'admin') {
            navigate('/admin');
            } else {
            navigate('/users'); // Ubah dari '/user' menjadi '/users'
            }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali username & password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] font-sans">
      <div className="w-full max-w-[400px] bg-white/70 backdrop-blur-xl p-10 rounded-[20px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/60 mx-4">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
            <LogIn size={32} strokeWidth={1.5} />
          </div>
        </div>
        
        <h2 className="text-2xl font-extrabold text-center text-slate-800 tracking-tight mb-2">
          Selamat Datang
        </h2>
        <p className="text-center text-slate-500 text-sm mb-8">
          Masuk ke sistem pendataan Slogo.
        </p>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:bg-white transition-all outline-none text-slate-800"
              placeholder="Masukkan username"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:bg-white transition-all outline-none text-slate-800"
              placeholder="••••••••"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98] mt-2"
          >
            Masuk Sekarang
          </button>
        </form>

      </div>
    </div>
  );
}