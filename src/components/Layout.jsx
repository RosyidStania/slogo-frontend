import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import logoImg from '../assets/logo.png';
import { 
  LogOut, 
  Calendar,
  ChevronRight,
  QrCode,
  LayoutGrid,
  CalendarDays,
  UsersRound,
  Activity,
  UserRound,
  PanelLeft,
  Tag,
  ClipboardCheck,
  Settings,
  UserPlus,
  ShieldCheck,
  FileText,
  X
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMobileMenuSheet, setShowMobileMenuSheet] = useState(false);
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
      localStorage.removeItem('name');
      localStorage.removeItem('kelompok');
      sessionStorage.removeItem('generusData_cache');
      navigate('/login');
    }
  };

  const mainMenuItems = role === 'admin' 
    ? [
        { name: 'Dashboard', path: '/admin', icon: <LayoutGrid size={19} strokeWidth={1.9} /> },
        { name: 'Acara', path: '/admin/events', icon: <Calendar size={19} strokeWidth={1.9} /> },
        { name: 'Notulen', path: '/admin/notulen', icon: <FileText size={19} strokeWidth={1.9} /> },
        { name: 'Acara Kelompok', path: '/admin/schedules', icon: <UsersRound size={19} strokeWidth={1.9} /> },
        { name: 'Generus', path: '/admin/generus', icon: <UserPlus size={19} strokeWidth={1.9} /> },
        { name: 'Pengurus', path: '/admin/pengurus', icon: <ShieldCheck size={19} strokeWidth={1.9} /> },
        { name: 'Kategori Acara', path: '/admin/event-types', icon: <Tag size={19} strokeWidth={1.9} /> },
        { name: 'Rekapan Absensi', path: '/admin/reports', icon: <ClipboardCheck size={19} strokeWidth={1.9} /> },
      ]
    : role === 'operator_absensi'
    ? [
        { name: 'Acara', path: '/admin/events', icon: <Calendar size={19} strokeWidth={1.9} /> },
      ]
    : role === 'absen_kelompok'
    ? [
        { name: 'Acara', path: '/admin/events', icon: <Calendar size={19} strokeWidth={1.9} /> },
        { name: 'Acara Kelompok', path: '/admin/schedules', icon: <CalendarDays size={19} strokeWidth={1.9} /> },
        { name: 'Data Anggota', path: '/mt/members', icon: <UsersRound size={19} strokeWidth={1.9} /> },
        { name: 'Statistik', path: '/mt/statistics', icon: <Activity size={19} strokeWidth={1.9} /> },
        { name: 'Rekapan Absensi', path: '/mt/attendance', icon: <ClipboardCheck size={19} strokeWidth={1.9} /> },
      ]
    : role === 'mt'
    ? [
        { name: 'Dashboard', path: '/mt', icon: <LayoutGrid size={19} strokeWidth={1.9} /> },
        { name: 'Data Anggota', path: '/mt/members', icon: <UsersRound size={19} strokeWidth={1.9} /> },
        { name: 'Statistik', path: '/mt/statistics', icon: <Activity size={19} strokeWidth={1.9} /> },
        { name: 'Rekapan Absensi', path: '/mt/attendance', icon: <ClipboardCheck size={19} strokeWidth={1.9} /> },
        { name: 'QR Absen', path: '/mt/qr', icon: <QrCode size={19} strokeWidth={1.9} /> },
        { name: 'Profil', path: '/mt/profile', icon: <UserRound size={19} strokeWidth={1.9} /> },
      ]
    : [
        { name: 'Dashboard', path: '/users', icon: <LayoutGrid size={19} strokeWidth={1.9} /> },
        { name: 'QR Absen', path: '/users/qr', icon: <QrCode size={19} strokeWidth={1.9} /> },
        { name: 'Profil', path: '/users/profile', icon: <UserRound size={19} strokeWidth={1.9} /> },
      ];

  const managementMenuItems = role === 'admin'
    ? [
        { name: 'Users', path: '/admin/users', icon: <UsersRound size={19} strokeWidth={1.9} /> },
      ]
    : [];

  const menuItems = [...mainMenuItems, ...managementMenuItems];

  const pageTitle = (() => {
    if (location.pathname.match(/\/admin\/attendance\//)) return 'Live Absensi';
    if (location.pathname.match(/\/admin\/notulen\/\d+/)) return 'Kanvas Notulen';
    const seg = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
    const map = { admin: 'Dashboard', mt: 'Dashboard', events: 'Acara', notulen: 'Notulen Musyawarah', schedules: 'Acara Kelompok', generus: 'Data Generus', pengurus: 'Data Pengurus', 'event-types': 'Kategori Acara', reports: 'Rekapan Absensi', users: 'Users', members: 'Data Anggota', statistics: 'Statistik Kelompok', attendance: 'Rekapan Absensi' };
    return map[seg] || seg.replace(/-/g, ' ');
  })();

  const userDisplayName = localStorage.getItem('name') || (
    role === 'admin' ? 'Admin Pusat' :
    role === 'absen_kelompok' ? 'Operator Kelompok' :
    role === 'operator_absensi' ? 'Operator Absensi' :
    role || 'Pengguna'
  );

  const renderNavItem = (menu) => {
    const isActive = 
      location.pathname === menu.path || 
      (menu.path !== '/admin' && menu.path !== '/users' && menu.path !== '/mt' && location.pathname.startsWith(menu.path));

    return (
      <Link
        key={menu.name}
        to={menu.path}
        title={!isSidebarOpen ? menu.name : ""}
        onClick={() => { if(window.innerWidth < 1024) setIsSidebarOpen(false) }}
        className={`flex items-center rounded-xl transition-all duration-200 group relative
          ${isSidebarOpen ? 'gap-3.5 px-3.5 py-3 w-full' : 'justify-center w-11 h-11'}
          ${isActive 
            ? 'bg-white text-emerald-700 shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-slate-200/80 font-semibold' 
            : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 font-medium'
          }
        `}
      >
        <div className={`shrink-0 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-500 group-hover:text-slate-700'}`}>
          {menu.icon}
        </div>
        {isSidebarOpen && (
          <span className="text-[15px] whitespace-nowrap">
            {menu.name}
          </span>
        )}
      </Link>
    );
  };

  // Bottom bar items for mobile matching screenshot: Acara, Generus, Presensi, Pengaturan
  const mobileBottomItems = role === 'admin'
    ? [
        { name: 'Acara', path: '/admin/events', icon: <Calendar size={20} /> },
        { name: 'Generus', path: '/admin/generus', icon: <UserRound size={20} /> },
        { name: 'Presensi', path: '/admin/reports', icon: <ClipboardCheck size={20} /> },
        { name: 'Pengaturan', isSheet: true, icon: <Settings size={20} /> },
      ]
    : role === 'absen_kelompok'
    ? [
        { name: 'Acara', path: '/admin/events', icon: <Calendar size={20} /> },
        { name: 'Data Anggota', path: '/mt/members', icon: <UsersRound size={20} /> },
        { name: 'Presensi', path: '/mt/attendance', icon: <ClipboardCheck size={20} /> },
        { name: 'Pengaturan', isSheet: true, icon: <Settings size={20} /> },
      ]
    : role === 'mt'
    ? [
        { name: 'Dashboard', path: '/mt', icon: <LayoutGrid size={20} /> },
        { name: 'Data Anggota', path: '/mt/members', icon: <UsersRound size={20} /> },
        { name: 'Presensi', path: '/mt/attendance', icon: <ClipboardCheck size={20} /> },
        { name: 'Pengaturan', isSheet: true, icon: <Settings size={20} /> },
      ]
    : [
        ...menuItems.slice(0, 3),
        { name: 'Pengaturan', isSheet: true, icon: <Settings size={20} /> },
      ];

  return (
    <div className="flex h-[100dvh] w-full bg-[#f8f9fa] text-slate-800 overflow-hidden">
      
      {/* ============================= */}
      {/* SIDEBAR – Tema Terang Modern  */}
      {/* ============================= */}
      <aside 
        className={`hidden lg:flex inset-y-0 left-0 z-50 shrink-0 transition-all duration-300 ease-in-out flex-col bg-[#f3f4f6] border-r border-slate-200/80
          ${isSidebarOpen ? 'w-[310px]' : 'w-[76px]'}
        `}
      >
        {/* Top Brand Header */}
        <div className={`h-20 flex items-center shrink-0 transition-all duration-300 ${isSidebarOpen ? 'px-5 justify-between' : 'justify-center px-0'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              type="button"
              onClick={() => !isSidebarOpen && setIsSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center shrink-0 cursor-pointer"
              title={!isSidebarOpen ? "Buka Sidebar" : "DesaSlogo"}
            >
              <img src={logoImg} alt="DesaSlogo Logo" className="h-10 w-auto object-contain drop-shadow-2xs" />
            </button>
            {isSidebarOpen && (
              <div className="leading-tight overflow-hidden">
                <p className="font-bold text-slate-800 text-base tracking-tight truncate">
                  DesaSlogo
                </p>
                <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                  Sistem Generus
                </p>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-2 rounded-lg transition-colors shrink-0"
              title="Tutup Sidebar"
            >
              <PanelLeft size={18} strokeWidth={1.8} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className={`flex-1 overflow-y-auto thin-scrollbar pt-2 flex flex-col ${isSidebarOpen ? 'px-4' : 'px-2 items-center'}`}>
          {isSidebarOpen && (
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3.5 mb-2 shrink-0">
              Menu Utama
            </p>
          )}
          <nav className={`space-y-1 flex flex-col ${isSidebarOpen ? 'w-full' : 'items-center'}`}>
            {mainMenuItems.map(renderNavItem)}
          </nav>

          {managementMenuItems.length > 0 && (
            <>
              {isSidebarOpen ? (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3.5 mt-7 mb-2 shrink-0">
                  Manajemen
                </p>
              ) : (
                <div className="w-6 h-px bg-slate-200 my-3 shrink-0" />
              )}
              <nav className={`space-y-1 flex flex-col ${isSidebarOpen ? 'w-full' : 'items-center'}`}>
                {managementMenuItems.map(renderNavItem)}
              </nav>
            </>
          )}
        </div>

        {/* Bottom User Profile Card */}
        <div className="shrink-0 mt-auto p-4">
          {isSidebarOpen ? (
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#168a53] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-slate-800 text-sm font-bold truncate leading-tight">
                  {userDisplayName}
                </p>
                <p className="text-emerald-600 text-xs font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
                </p>
              </div>
              <button 
                onClick={() => setShowLogoutModal(true)}
                title="Keluar"
                className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
              >
                <LogOut size={17} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button 
                onClick={() => setShowLogoutModal(true)}
                title="Keluar"
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors shadow-2xs"
              >
                <LogOut size={18} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ============================= */}
      {/* MAIN CONTENT                  */}
      {/* ============================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8f9fa]">
        
        {/* TOP NAVBAR */}
        <header className="h-14 px-4 lg:px-6 flex items-center justify-between shrink-0 bg-white border-b border-slate-200/70 z-10">

          {/* Mobile Left: Brand logo + name */}
          <div className="flex lg:hidden items-center gap-2.5 min-w-0">
            <img src={logoImg} alt="DesaSlogo Logo" className="h-8 w-auto object-contain shrink-0" />
            <div className="leading-tight min-w-0">
              <p className="font-bold text-slate-800 text-sm tracking-tight truncate">
                DesaSlogo
              </p>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Sistem Generus
              </p>
            </div>
          </div>

          {/* Desktop Left: Breadcrumb + Date Pill */}
          <div className="hidden lg:flex items-center gap-2.5 min-w-0">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors mr-1"
                title="Buka Sidebar"
              >
                <PanelLeft size={17} strokeWidth={2} />
              </button>
            )}
            
            <div className="flex items-center gap-2 min-w-0 text-xs">
              <span className="text-slate-400 font-medium">DesaSlogo</span>
              <ChevronRight size={13} className="text-slate-300 shrink-0" />
              <span className="font-bold text-slate-800 truncate">{pageTitle}</span>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1.5" />

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/60 text-[11px] font-medium text-slate-500">
              <Calendar size={12} className="text-slate-400" />
              <span>
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Portal slot for page-specific top header buttons */}
            <div id="layout-header-actions" className="flex items-center gap-2" />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 px-4 lg:px-6 pb-24 lg:pb-8 overflow-y-auto hide-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* MOBILE MENU / PENGATURAN SHEET */}
      {showMobileMenuSheet && (
        <div className="lg:hidden fixed inset-0 z-[150] flex items-end justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowMobileMenuSheet(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 shadow-2xl border-t border-slate-100 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#168a53] flex items-center justify-center text-white font-bold text-sm">
                  {userDisplayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm leading-tight">{userDisplayName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileMenuSheet(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Navigasi Semua Halaman</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {menuItems.map((m) => {
                const active = location.pathname === m.path;
                return (
                  <Link
                    key={m.name}
                    to={m.path}
                    onClick={() => setShowMobileMenuSheet(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-50 border-slate-200/70 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className={active ? 'text-emerald-600' : 'text-slate-500'}>{m.icon}</span>
                    <span className="truncate">{m.name}</span>
                  </Link>
                );
              })}
            </div>

            {role === 'admin' && location.pathname === '/admin/generus' && (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Aksi Data Generus</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenuSheet(false);
                    window.dispatchEvent(new CustomEvent('open-generus-settings'));
                  }}
                  className="w-full py-2.5 px-4 mb-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Settings size={15} /> Buka Menu Aksi Tahunan / Export / Import
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setShowMobileMenuSheet(false);
                setShowLogoutModal(true);
              }}
              className="w-full py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut size={15} /> Keluar dari Akun
            </button>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={() => setShowLogoutModal(false)}></div>
          <div className="relative bg-white/95 backdrop-blur-xl rounded-[20px] p-8 max-w-sm w-full shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-white/60 animate-in fade-in zoom-in duration-200">
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

      {/* ============================= */}
      {/* BOTTOM NAVIGATION (MOBILE)    */}
      {/* ============================= */}
      <nav 
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200/80 px-2 pt-2 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
        style={{ paddingBottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))' }}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mobileBottomItems.map((item) => {
            const isActive = !item.isSheet && (
              location.pathname === item.path ||
              (item.path !== '/admin' && item.path !== '/users' && item.path !== '/mt' && location.pathname.startsWith(item.path))
            );

            if (item.isSheet) {
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setShowMobileMenuSheet(true)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <div className="relative flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-medium">{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
                  isActive ? 'text-[#168a53] font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {React.cloneElement(item.icon, {
                    strokeWidth: isActive ? 2.4 : 1.8
                  })}
                </div>
                <span className="text-[11px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
