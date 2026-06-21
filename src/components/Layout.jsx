import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  Users, 
  Database, 
  LogOut, 
  LayoutDashboard, 
  Calendar,
  Layers,
  Menu,
  X,
  ChevronRight,
  BookOpen,
  QrCode
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  const role = localStorage.getItem('role');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error("Gagal logout dari server:", error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/login');
    }
  };

  const menuItems = role === 'admin' 
    ? [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} strokeWidth={2} /> },
        { name: 'Acara', path: '/admin/events', icon: <Calendar size={18} strokeWidth={2} /> },
        { name: 'Generus', path: '/admin/generus', icon: <Database size={18} strokeWidth={2} /> },
        { name: 'Kategori Acara', path: '/admin/event-types', icon: <Layers size={18} strokeWidth={2} /> },
        { name: 'Rekapan Absensi', path: '/admin/reports', icon: <BookOpen size={18} strokeWidth={2} /> },
        { name: 'Users', path: '/admin/users', icon: <Users size={18} strokeWidth={2} /> },
      ]
    : [
        { name: 'Dashboard', path: '/users', icon: <LayoutDashboard size={18} strokeWidth={2} /> },
        { name: 'QR Absen', path: '/users/qr', icon: <QrCode size={18} strokeWidth={2} /> },
      ];

  const pageTitle = (() => {
    if (location.pathname.includes('/attendance')) return 'Live Absensi';
    const seg = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
    const map = { admin: 'Dashboard', events: 'Acara', generus: 'Data Generus', 'event-types': 'Kategori Acara', users: 'Users' };
    return map[seg] || seg.replace(/-/g, ' ');
  })();

  return (
    <div className="flex h-screen w-full bg-[#f5f5f7] text-slate-800 overflow-hidden">
      
      {/* ============================= */}
      {/* SIDEBAR – Navy Dark           */}
      {/* ============================= */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 shrink-0 transition-all duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 w-[72px]'}
        `}
        style={{ background: 'linear-gradient(160deg, #1e2d45 0%, #162032 100%)' }}
      >
        {/* Logo */}
        <div className={`h-20 flex items-center shrink-0 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'px-6 justify-between' : 'justify-center px-0'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 bg-teal-400 rounded-[10px] flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(45,212,191,0.4)]">
              <span className="text-white font-black text-sm tracking-tight">DS</span>
            </div>
            {isSidebarOpen && (
              <span className="font-extrabold text-white tracking-tight text-base whitespace-nowrap animate-in fade-in duration-200">
                DesaSlogo
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className={`lg:hidden text-white/40 hover:text-white transition-colors shrink-0 ${!isSidebarOpen && 'hidden'}`}
          >
            <X size={18} strokeWidth={2.5}/>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/10 shrink-0 mb-3"></div>

        {/* Nav label */}
        {isSidebarOpen && (
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-6 mb-2 shrink-0">Menu Utama</p>
        )}

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto thin-scrollbar space-y-1 flex flex-col ${isSidebarOpen ? 'px-3' : 'px-2.5 items-center'}`}>
          {menuItems.map((menu) => {
            const isActive = location.pathname === menu.path || 
              (menu.path !== '/admin' && menu.path !== '/users' && location.pathname.startsWith(menu.path));
            return (
              <Link
                key={menu.name}
                to={menu.path}
                title={!isSidebarOpen ? menu.name : ""}
                onClick={() => { if(window.innerWidth < 1024) setIsSidebarOpen(false) }}
                className={`flex items-center rounded-xl transition-all duration-200 group relative overflow-hidden
                  ${isSidebarOpen ? 'gap-3 px-3 py-3 w-full' : 'justify-center w-11 h-11'}
                  ${isActive 
                    ? 'bg-teal-400/15 text-teal-300' 
                    : 'text-white/50 hover:bg-white/8 hover:text-white/90'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-400 rounded-r-full"></div>
                )}
                <div className={`shrink-0 ${isActive ? 'text-teal-400' : ''}`}>
                  {menu.icon}
                </div>
                {isSidebarOpen && (
                  <span className="font-semibold text-sm whitespace-nowrap animate-in fade-in duration-200">
                    {menu.name}
                  </span>
                )}
                {isSidebarOpen && isActive && (
                  <ChevronRight size={14} className="ml-auto text-teal-400/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Spacer + Logout */}
        <div className="shrink-0 mt-auto">
          <div className="mx-4 h-px bg-white/10 mb-3"></div>
          
          {/* User info */}
          {isSidebarOpen && (
            <div className="mx-3 mb-2 p-3 rounded-xl bg-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {role?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-bold capitalize truncate">{role}</p>
                <p className="text-white/40 text-[10px]">Online</p>
              </div>
            </div>
          )}
          
          <div className={`pb-4 ${isSidebarOpen ? 'px-3' : 'px-2.5 flex justify-center'}`}>
            <button 
              onClick={() => setShowLogoutModal(true)}
              title={!isSidebarOpen ? "Logout" : ""}
              className={`flex items-center rounded-xl text-white/40 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200 font-semibold text-sm
                ${isSidebarOpen ? 'gap-3 px-3 py-3 w-full' : 'justify-center w-11 h-11'}
              `}
            >
              <LogOut size={18} strokeWidth={2} />
              {isSidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* ============================= */}
      {/* MAIN CONTENT                  */}
      {/* ============================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP NAVBAR */}
        <header className="h-16 px-6 lg:px-8 flex items-center justify-between shrink-0 bg-[#f5f5f7]/80 backdrop-blur-xl border-b border-slate-200/50 z-10">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-white text-slate-500 hover:text-teal-600 hover:bg-teal-50 shadow-sm border border-slate-200/80 transition-all"
            >
              <Menu size={18} strokeWidth={2.5} />
            </button>
            
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight capitalize">{pageTitle}</h1>
              <p className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-slate-200/80 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-500 capitalize">{role}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-teal-500/20">
              {role?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 px-6 lg:px-8 pb-6 overflow-y-auto hide-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={() => setShowLogoutModal(false)}></div>
          <div className="relative bg-white/85 backdrop-blur-xl rounded-[20px] p-8 max-w-sm w-full shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-white/60 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-5 mx-auto">
              <LogOut className="text-red-500" size={26} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Keluar Sekarang?</h3>
            <p className="text-center text-slate-500 text-sm mb-7">Sesi Anda akan berakhir dan perlu masuk kembali.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">Batal</button>
              <button onClick={handleLogout} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}