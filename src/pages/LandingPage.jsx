import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Heart, 
  Shield, 
  Star, 
  Users, 
  Briefcase, 
  RefreshCw, 
  CheckCircle2, 
  ChevronDown,
  ArrowRight,
  School,
  Home
} from 'lucide-react';
import bgImage from '../assets/Generus2.jpg';
import logoImg from '../assets/logo.png';

export default function LandingPage() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // State untuk wheel/lingkaran 29 Karakter Luhur
  const [selected, setSelected] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(0);
  const [wheelRotation, setWheelRotation] = useState(0);

  const karakterData = [
    {
      id: "tri-sukses",
      color: "amber",
      icon: <Star className="w-5 h-5" strokeWidth={2.2} />,
      title: "Tri Sukses",
      badge: "3 Pokok",
      subtitle: "Fondasi utama pembentukan generasi",
      items: [
        { name: "Akhlaqul Karimah", desc: "Berperilaku mulia dalam ucapan, sikap, dan perbuatan sehari-hari." },
        { name: "Alim dan Faqih", desc: "Menguasai ilmu agama dan memahaminya secara mendalam untuk diamalkan." },
        { name: "Mandiri", desc: "Mampu berdiri sendiri secara ekonomi, spiritual, dan sosial tanpa bergantung." }
      ]
    },
    {
      id: "tobiat-luhur",
      color: "rose",
      icon: <Heart className="w-5 h-5" strokeWidth={2.2} />,
      title: "6 Tobi'at Luhur",
      badge: "6 Sifat",
      subtitle: "Watak mulia dalam interaksi sosial",
      items: [
        { name: "Rukun", desc: "Mewujudkan kedamaian, keselarasan, dan keharmonisan bersama sesama." },
        { name: "Kompak", desc: "Bergerak bersama secara serentak dalam satu visi dan tujuan mulia." },
        { name: "Kerjasama", desc: "Saling bahu-membahu dan tolong-menolong dalam kebajikan." },
        { name: "Jujur", desc: "Selalu berkata dan bersikap lurus sesuai fakta dan kebenaran." },
        { name: "Amanah", desc: "Bertanggung jawab penuh atas setiap kepercayaan dan tugas yang diemban." },
        { name: "Mujhid Muzhid", desc: "Bersungguh-sungguh dalam ikhtiar, hidup hemat, dan tidak berlebihan." }
      ]
    },
    {
      id: "tali-keimanan",
      color: "blue",
      icon: <BookOpen className="w-5 h-5" strokeWidth={2.2} />,
      title: "4 Tali Keimanan",
      badge: "4 Pilar",
      subtitle: "Penguatan hubungan hamba dengan Sang Pencipta",
      items: [
        { name: "Bersyukur", desc: "Senantiasa berterima kasih dan menghargai segala nikmat Allah." },
        { name: "Mempersungguh", desc: "Mencurahkan kesungguhan terbaik dalam setiap ibadah dan amal saleh." },
        { name: "Mengagungkan", desc: "Menjunjung tinggi keagungan perintah Allah dan sunnah Rasul-Nya." },
        { name: "Berdoa", desc: "Rendah hati selalu memohon pertolongan dan hidayah kepada Allah." }
      ]
    },
    {
      id: "prinsip-kerja",
      color: "emerald",
      icon: <Briefcase className="w-5 h-5" strokeWidth={2.2} />,
      title: "3 Prinsip Kerja",
      badge: "3 Etika",
      subtitle: "Pedoman profesionalitas dan etika berkarya",
      items: [
        { name: "Benar", desc: "Bekerja sesuai tuntunan syariat, aturan resmi, dan norma kebaikan." },
        { name: "Kurup", desc: "Disiplin tepat waktu, hemat anggaran, dan tepat sasaran hasil." },
        { name: "Janji", desc: "Konsisten menepati komitmen dan kesepakatan yang telah dibuat." }
      ]
    },
    {
      id: "maqodirulloh",
      color: "indigo",
      icon: <Shield className="w-5 h-5" strokeWidth={2.2} />,
      title: "4 Maqodirulloh",
      badge: "4 Sikap",
      subtitle: "Sikap bijak menghadapi segala ketentuan takdir Allah",
      items: [
        { name: "Bersyukur", desc: "Bersyukur dan tidak sombong saat dilimpahi nikmat serta kemudahan." },
        { name: "Istirja'", desc: "Mengembalikan segala urusan kepada Allah ketika menghadapi musibah." },
        { name: "Sabar", desc: "Berjiwa besar, tabah, dan tidak putus asa dalam menghadapi cobaan." },
        { name: "Taubat", desc: "Segera introspeksi, menyesali, dan memperbaiki diri dari kekhilafan." }
      ]
    },
    {
      id: "roda-berputar",
      color: "teal",
      icon: <RefreshCw className="w-5 h-5" strokeWidth={2.2} />,
      title: "4 Roda Berputar",
      badge: "4 Sinergi",
      subtitle: "Prinsip sinergi dan saling tolong-menolong",
      items: [
        { name: "Kuat & Lemah", desc: "Yang memiliki kekuatan menopang dan menguatkan yang sedang lemah." },
        { name: "Bisa & Tidak", desc: "Yang memiliki keahlian membimbing dan mendampingi yang belum bisa." },
        { name: "Ingat & Lupa", desc: "Yang senantiasa ingat dengan santun mengingatkan yang lupa." },
        { name: "Saling Menasehati", desc: "Saling menasihati dalam kebenaran dan kesabaran demi kebaikan bersama." }
      ]
    },
    {
      id: "syarat-kerukunan",
      color: "orange",
      icon: <Users className="w-5 h-5" strokeWidth={2.2} />,
      title: "5 Syarat Kerukunan",
      badge: "5 Kunci",
      subtitle: "Pedoman menjaga keharmonisan sosial kemasyarakatan",
      items: [
        { name: "Berbicara Baik", desc: "Menjaga lisan dengan bertutur kata sopan, santun, dan bermanfaat." },
        { name: "Jujur & Percaya", desc: "Membangun rasa saling percaya dengan keterbukaan dan kejujuran." },
        { name: "Sabar & Ngalah", desc: "Mampu mengendalikan ego dan bersedia mengalah demi keutuhan bersama." },
        { name: "Tidak Merusak", desc: "Menghindari segala hal yang berpotensi merusak hubungan persaudaraan." },
        { name: "Menjaga Perasaan", desc: "Memiliki kepekaan empati tinggi untuk senantiasa menjaga hati sesama." }
      ]
    }
  ];

  // Visual styling variants per category matching Apple iOS palette
  const categoryStyles = {
    amber: {
      bg: "bg-amber-500",
      lightBg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      ring: "ring-amber-500/20",
      badgeBg: "bg-amber-100 text-amber-800",
      iconBg: "bg-amber-500 text-white",
      pillActive: "bg-amber-500 text-white shadow-sm shadow-amber-500/25",
      orbitActive: "ring-4 ring-amber-500/30 scale-110 shadow-lg shadow-amber-500/20"
    },
    rose: {
      bg: "bg-rose-500",
      lightBg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      ring: "ring-rose-500/20",
      badgeBg: "bg-rose-100 text-rose-800",
      iconBg: "bg-rose-500 text-white",
      pillActive: "bg-rose-500 text-white shadow-sm shadow-rose-500/25",
      orbitActive: "ring-4 ring-rose-500/30 scale-110 shadow-lg shadow-rose-500/20"
    },
    blue: {
      bg: "bg-sky-500",
      lightBg: "bg-sky-50",
      text: "text-sky-700",
      border: "border-sky-200",
      ring: "ring-sky-500/20",
      badgeBg: "bg-sky-100 text-sky-800",
      iconBg: "bg-sky-500 text-white",
      pillActive: "bg-sky-500 text-white shadow-sm shadow-sky-500/25",
      orbitActive: "ring-4 ring-sky-500/30 scale-110 shadow-lg shadow-sky-500/20"
    },
    emerald: {
      bg: "bg-teal-600",
      lightBg: "bg-teal-50",
      text: "text-[#14b8a6]",
      border: "border-teal-200",
      ring: "ring-teal-500/20",
      badgeBg: "bg-teal-100 text-teal-800",
      iconBg: "bg-teal-600 text-white",
      pillActive: "bg-[#14b8a6] text-white shadow-sm shadow-teal-700/25",
      orbitActive: "ring-4 ring-teal-500/30 scale-110 shadow-lg shadow-teal-600/20"
    },
    indigo: {
      bg: "bg-indigo-600",
      lightBg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
      ring: "ring-indigo-500/20",
      badgeBg: "bg-indigo-100 text-indigo-800",
      iconBg: "bg-indigo-600 text-white",
      pillActive: "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25",
      orbitActive: "ring-4 ring-indigo-500/30 scale-110 shadow-lg shadow-indigo-600/20"
    },
    teal: {
      bg: "bg-teal-600",
      lightBg: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-200",
      ring: "ring-teal-500/20",
      badgeBg: "bg-teal-100 text-teal-800",
      iconBg: "bg-teal-600 text-white",
      pillActive: "bg-teal-600 text-white shadow-sm shadow-teal-600/25",
      orbitActive: "ring-4 ring-teal-500/30 scale-110 shadow-lg shadow-teal-600/20"
    },
    orange: {
      bg: "bg-orange-500",
      lightBg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      ring: "ring-orange-500/20",
      badgeBg: "bg-orange-100 text-orange-800",
      iconBg: "bg-orange-500 text-white",
      pillActive: "bg-orange-500 text-white shadow-sm shadow-orange-500/25",
      orbitActive: "ring-4 ring-orange-500/30 scale-110 shadow-lg shadow-orange-500/20"
    }
  };

  const handleSelectBubble = (idx) => {
    setSelected(idx);
    const step = 360 / karakterData.length;
    const targetAngle = -idx * step;
    const currentMod = ((wheelRotation % 360) + 360) % 360;
    const targetMod = ((targetAngle % 360) + 360) % 360;
    
    let diff = targetMod - currentMod;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    setWheelRotation(prev => prev + diff);
  };

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Dimensi orbit wheel
  const wheelSize = 720;
  const center = wheelSize / 2;
  const centerCircleSize = 440;
  const orbitRadius = 265;
  const totalBubbles = karakterData.length;

  const getBubblePos = (idx, size) => {
    const angle = (-90 + idx * (360 / totalBubbles)) * (Math.PI / 180);
    const cx = center + orbitRadius * Math.cos(angle);
    const cy = center + orbitRadius * Math.sin(angle);
    return { left: cx - size / 2, top: cy - size / 2 };
  };

  const currentCategory = karakterData[selected];
  const currentStyle = categoryStyles[currentCategory.color];

  const penerapanData = [
    {
      title: "Keluarga Harmonis",
      desc: "Membiasakan etika sopan santun kepada orang tua, ketertiban shalat lima waktu, serta saling menyayangi antar anggota keluarga di rumah.",
      icon: <Home className="w-6 h-6 text-[#14b8a6]" strokeWidth={2} />,
      tag: "Fondasi Rumah Tangga"
    },
    {
      title: "Masjid & Pembinaan",
      desc: "Menghidupkan budaya salam, ketertiban majelis ilmu, kebersihan tempat ibadah, dan keaktifan menghadiri musyawarah serta halaqah pemuda.",
      icon: <School className="w-6 h-6 text-sky-600" strokeWidth={2} />,
      tag: "Pusat Pembinaan Generus"
    },
    {
      title: "Masyarakat & Sosial",
      desc: "Menghadirkan teladan di tengah warga dengan tolong-menolong, kejujuran bermuamalah, dan kerukunan tanpa membedakan latar belakang.",
      icon: <Users className="w-6 h-6 text-amber-600" strokeWidth={2} />,
      tag: "Pengabdian Sosial"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#14b8a6] selection:text-white relative overflow-hidden">

      {/* iOS Soft Ambient Gradient Orbs */}
      <div className="fixed top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-gradient-to-b from-teal-100/40 via-teal-50/20 to-transparent rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="fixed top-[20%] right-[-100px] w-[450px] h-[450px] bg-sky-100/30 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[10%] left-[-100px] w-[450px] h-[450px] bg-teal-50/50 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* ============================================================== */}
      {/* 1. iOS Translucent Frosted Glass Navbar                        */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/75 border-b border-slate-200/70 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[70px] flex items-center justify-between">
          
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group active:scale-[0.98] transition-all">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-1.5 flex items-center justify-center shrink-0 group-hover:border-teal-300 transition-colors">
              <img src={logoImg} alt="DesaSlogo" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight flex items-center gap-1.5">
                DesaSlogo
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#14b8a6]" />
              </span>
              <p className="text-[11px] font-medium text-slate-400">
                Sistem Generus
              </p>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60 shadow-2xs">
            <a 
              href="#karakter" 
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/70 transition-all"
            >
              29 Karakter Luhur
            </a>
            <a 
              href="#penerapan" 
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/70 transition-all"
            >
              Penerapan
            </a>
          </nav>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. Hero Section (iOS Clean Style - Full First Screen View)     */}
      {/* ============================================================== */}
      <section className="relative min-h-[calc(100dvh-64px)] sm:min-h-[calc(100dvh-70px)] flex flex-col justify-between items-center pt-6 sm:pt-10 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto w-full text-center flex-1 flex flex-col justify-center items-center my-auto">

          {/* Main Display Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 sm:mb-8">
            Membangun Generasi <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#14b8a6] via-teal-600 to-teal-600 bg-clip-text text-transparent">
              29 Karakter Luhur
            </span>
          </h1>

          {/* CTA: Single Primary Button */}
          <div className="flex items-center justify-center mb-8 sm:mb-12">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base shadow-sm shadow-teal-700/25 active:scale-[0.97] transition-all cursor-pointer"
            >
              <span>Login</span>
              <ArrowRight size={17} strokeWidth={2.4} />
            </Link>
          </div>

          {/* iOS Clean Photo Card */}
          <div className="relative max-w-4xl mx-auto w-full">
            <div className="bg-white/80 backdrop-blur-xl p-2 sm:p-3 rounded-[28px] sm:rounded-[36px] border border-slate-200/80 shadow-[0_16px_50px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="relative rounded-[22px] sm:rounded-[28px] overflow-hidden aspect-[4/3] sm:aspect-[21/10] bg-slate-900">
                <img 
                  src={bgImage} 
                  alt="Generasi Luhur DesaSlogo" 
                  className="w-full h-full object-cover object-center brightness-95 contrast-105"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Scroll Indicator at bottom of first screen */}
        <a 
          href="#karakter"
          className="mt-6 sm:mt-8 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer group"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600">
            Scroll ke Bawah
          </span>
          <ChevronDown size={16} className="animate-bounce text-[#14b8a6]" strokeWidth={2.2} />
        </a>
      </section>

      {/* ============================================================== */}
      {/* 3. Section 29 Karakter Luhur (iOS Interactive - Halaman Kedua)  */}
      {/* ============================================================== */}
      <section id="karakter" className="min-h-screen pt-24 sm:pt-32 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 relative border-t border-slate-200/60 scroll-mt-16 sm:scroll-mt-20 flex flex-col justify-center">
        <div className="max-w-6xl mx-auto w-full">

          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              29 Karakter Luhur
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Karakter luhur adalah pedoman nilai-nilai akhlak mulia yang membentuk generasi muda menjadi pribadi berintegritas, mandiri, dan beriman.
            </p>
          </div>

          {/* iOS Segmented Pill Filter Bar (Rapid Selection) */}
          <div className="flex items-center justify-start sm:justify-center overflow-x-auto hide-scrollbar gap-2 mb-10 pb-2 px-1">
            {karakterData.map((cat, idx) => {
              const isActive = selected === idx;
              const catStyle = categoryStyles[cat.color];
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectBubble(idx)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-2 active:scale-95 ${
                    isActive
                      ? catStyle.pillActive
                      : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 shadow-2xs"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : catStyle.bg}`} />
                  <span>{cat.title}</span>
                </button>
              );
            })}
          </div>

          {/* DESKTOP INTERACTIVE WHEEL (LIGHT iOS STYLE) */}
          <div className="hidden lg:flex justify-center mb-16 mt-4">
            <div className="relative" style={{ width: wheelSize, height: wheelSize }}>

              {/* Orbiting Ring Guide */}
              <div 
                className="absolute rounded-full border border-dashed border-slate-300/80 pointer-events-none"
                style={{
                  width: orbitRadius * 2,
                  height: orbitRadius * 2,
                  left: center - orbitRadius,
                  top: center - orbitRadius
                }}
              />

              {/* BUBBLES CONTAINER */}
              <div 
                className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `rotate(${wheelRotation}deg)` }}
              >
                {karakterData.map((item, idx) => {
                  const size = 96 + Math.min(item.items.length, 6) * 6;
                  const pos = getBubblePos(idx, size);
                  const isActive = selected === idx;
                  const itemStyle = categoryStyles[item.color];

                  return (
                    <div
                      key={item.title}
                      className={`absolute transition-all duration-500 ease-out ${isActive ? "z-20" : "z-10"}`}
                      style={{
                        left: pos.left,
                        top: pos.top,
                        width: size,
                        height: size,
                        opacity: mounted ? 1 : 0,
                        transitionDelay: mounted ? "0ms" : `${idx * 80}ms`
                      }}
                    >
                      <div 
                        className="w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ transform: `rotate(${-wheelRotation}deg)` }}
                      >
                        <button
                          onClick={() => handleSelectBubble(idx)}
                          className={`w-full h-full rounded-full flex flex-col items-center justify-center text-center p-2 transition-all duration-300 ease-out cursor-pointer active:scale-95 ${
                            isActive
                              ? `bg-white ${itemStyle.text} ${itemStyle.orbitActive} border-2 ${itemStyle.border}`
                              : `bg-white text-slate-700 border border-slate-200/90 shadow-md hover:scale-105 hover:border-slate-300`
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${isActive ? itemStyle.iconBg : 'bg-slate-100 text-slate-600'}`}>
                            {React.cloneElement(item.icon, { className: "w-4 h-4" })}
                          </div>
                          <span className="font-extrabold text-[11px] leading-tight px-2">
                            {item.title}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CENTER DISPLAY CARD (iOS Cupertino Frosted Panel) */}
              <div
                className="absolute rounded-[36px] bg-white/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-200/90 flex items-center justify-center overflow-hidden z-30"
                style={{
                  width: centerCircleSize,
                  height: centerCircleSize,
                  left: center - centerCircleSize / 2,
                  top: center - centerCircleSize / 2
                }}
              >
                <div key={selected} className="text-center px-6 py-4 w-[380px] animate-in fade-in zoom-in-95 duration-300">
                  
                  {/* Category Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 shadow-2xs border border-slate-200/60 bg-slate-50">
                    <span className={`w-2 h-2 rounded-full ${currentStyle.bg}`} />
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {currentCategory.badge}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                    {currentCategory.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mb-4 pb-3 border-b border-slate-100">
                    {currentCategory.subtitle}
                  </p>

                  {/* List of Character Points */}
                  <div className="text-left space-y-2.5 max-h-[220px] overflow-y-auto thin-scrollbar pr-1">
                    {currentCategory.items.map((it, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${currentStyle.text}`} strokeWidth={2.4} />
                        <div>
                          <p className="text-xs font-extrabold text-slate-800 leading-tight">
                            {it.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-normal leading-normal mt-0.5">
                            {it.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* MOBILE & TABLET: iOS INSET GROUPED ACCORDION */}
          <div className="lg:hidden space-y-3 mb-16">
            {karakterData.map((kategori, idx) => {
              const isOpen = mobileOpen === idx;
              const catStyle = categoryStyles[kategori.color];

              return (
                <div
                  key={kategori.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setMobileOpen(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 p-4 text-left active:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${catStyle.lightBg} ${catStyle.text} border ${catStyle.border}`}>
                        {React.cloneElement(kategori.icon, { className: "w-5 h-5" })}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                            {kategori.title}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${catStyle.badgeBg}`}>
                            {kategori.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">{kategori.subtitle}</p>
                      </div>
                    </div>
                    
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-slate-700" : ""}`}
                    />
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-[#fbfcfd]">
                      <div className="space-y-2 mt-2">
                        {kategori.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="p-3 rounded-xl bg-white border border-slate-200/60 shadow-2xs flex items-start gap-3">
                            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${catStyle.text}`} strokeWidth={2.4} />
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-snug">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ============================================================== */}
          {/* 4. Section Penerapan dalam Kehidupan                           */}
          {/* ============================================================== */}
          <div id="penerapan" className="bg-white border border-slate-200/90 rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 md:p-12 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden">
            
            <div className="relative z-10 max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-[11px] font-bold text-[#14b8a6] uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                  Implementasi Nyata
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3 mb-2">
                  Penerapan dalam Kehidupan Sehari-hari
                </h3>
                <p className="text-slate-500 text-sm max-w-xl mx-auto">
                  Nilai 29 Karakter Luhur tidak sekadar dihafal, melainkan diwujudkan dalam setiap sendi pergaulan dan rutinitas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {penerapanData.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center mb-4">
                        {item.icon}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {item.tag}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mb-2">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-normal">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl mx-auto">
                  Melalui sinergi orang tua, dewan guru, dan pengurus kelompok, 29 karakter luhur membentuk pribadi yang tangguh, berbudi pekerti luhur, dan siap bermanfaat bagi bangsa serta agama.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. Footer (iOS Clean Footnote)                                 */}
      {/* ============================================================== */}
      <footer className="border-t border-slate-200/80 bg-white py-8 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-slate-700">DesaSlogo</span>
            <span className="text-slate-300">•</span>
            <span>Sistem Manajemen Generus</span>
          </div>

          <p className="text-slate-400">
            &copy; {new Date().getFullYear()} DesaSlogo. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <a href="#karakter" className="hover:text-slate-800 transition-colors">29 Karakter</a>
            <Link to="/login" className="hover:text-[#14b8a6] transition-colors">Login</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
