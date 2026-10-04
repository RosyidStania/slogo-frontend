import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, BookOpen, Heart, Shield, Star, Users, Briefcase, RefreshCw, CheckCircle2 } from 'lucide-react';
import bgImage from '../assets/Generus2.jpg';
export default function LandingPage() {
  // Scroll ke atas saat halaman dimuat
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // State untuk wheel/lingkaran 29 Karakter Luhur
  const [selected, setSelected] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);

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

  const karakterData = [
    {
      color: "amber",
      icon: <Star className="text-amber-500 w-8 h-8 mb-4" />,
      title: "Tri Sukses",
      subtitle: "Fondasi utama pembentukan generasi",
      items: [
        { name: "Akhlaqul Karimah", desc: "Berperilaku mulia dalam ucapan dan perbuatan." },
        { name: "Alim dan Faqih", desc: "Menguasai ilmu agama dan memahaminya secara mendalam." },
        { name: "Mandiri", desc: "Mampu berdiri sendiri secara ekonomi, spiritual, dan sosial." }
      ]
    },
    {
      color: "rose",
      icon: <Heart className="text-rose-500 w-8 h-8 mb-4" />,
      title: "6 Tobi'at Luhur",
      subtitle: "Watak mulia dalam interaksi sosial",
      items: [
        { name: "Rukun", desc: "Mewujudkan kedamaian dan keharmonisan." },
        { name: "Kompak", desc: "Bergerak bersama dalam satu tujuan." },
        { name: "Kerjasama", desc: "Saling membantu dalam kebaikan." },
        { name: "Jujur", desc: "Berkata dan bersikap sesuai kenyataan." },
        { name: "Amanah", desc: "Bertanggung jawab atas kepercayaan yang diberikan." },
        { name: "Mujhid Muzhid", desc: "Hidup hemat, bersungguh-sungguh, dan tidak boros." }
      ]
    },
    {
      color: "blue",
      icon: <BookOpen className="text-blue-500 w-8 h-8 mb-4" />,
      title: "4 Tali Keimanan",
      subtitle: "Penguatan hubungan dengan Allah",
      items: [
        { name: "Bersyukur", desc: "Selalu berterima kasih atas nikmat Allah." },
        { name: "Mempersungguh", desc: "Bersungguh-sungguh dalam ibadah dan amal." },
        { name: "Mengagungkan", desc: "Menjunjung tinggi perintah Allah dan Rasul." },
        { name: "Berdoa", desc: "Selalu memohon kepada Allah dalam setiap keadaan." }
      ]
    },
    {
      color: "emerald",
      icon: <Briefcase className="text-emerald-500 w-8 h-8 mb-4" />,
      title: "3 Prinsip Kerja",
      subtitle: "Pedoman etika kerja",
      items: [
        { name: "Benar", desc: "Sesuai aturan dan syariat." },
        { name: "Kurup", desc: "Tepat waktu dan tepat sasaran." },
        { name: "Janji", desc: "Menepati apa yang telah disepakati." }
      ]
    },
    {
      color: "indigo",
      icon: <Shield className="text-indigo-500 w-8 h-8 mb-4" />,
      title: "4 Maqodirulloh",
      subtitle: "Sikap terhadap qodar atau ketentuan Allah",
      items: [
        { name: "Bersyukur", desc: "Saat mendapat nikmat." },
        { name: "Istirja'", desc: "Saat tertimpa musibah." },
        { name: "Sabar", desc: "Saat mendapat cobaan." },
        { name: "Taubat", desc: "Saat melakukan kesalahan." }
      ]
    },
    {
      color: "teal",
      icon: <RefreshCw className="text-teal-500 w-8 h-8 mb-4" />,
      title: "4 Roda Berputar",
      subtitle: "Prinsip saling tolong-menolong",
      items: [
        { name: "Kuat & Lemah", desc: "Yang kuat membantu yang lemah." },
        { name: "Bisa & Tidak", desc: "Yang bisa membantu yang tidak bisa." },
        { name: "Ingat & Lupa", desc: "Yang ingat mengingatkan yang lupa." },
        { name: "Saling Menasehati", desc: "Yang salah dinasehati agar mau bertaubat." }
      ]
    },
    {
      color: "orange",
      icon: <Users className="text-orange-500 w-8 h-8 mb-4" />,
      title: "5 Syarat Kerukunan",
      subtitle: "Pedoman hubungan sosial",
      items: [
        { name: "Berbicara Baik", desc: "Berbicara yang baik dan benar." },
        { name: "Jujur & Percaya", desc: "Jujur, dapat dipercaya dan mempercayai." },
        { name: "Sabar & Ngalah", desc: "Sabar, sanggup ngalah demi kebaikan bersama." },
        { name: "Tidak Merusak", desc: "Tidak merusak diri sendiri maupun sesama." },
        { name: "Menjaga Perasaan", desc: "Saling memperhatikan dan menjaga perasaan." }
      ]
    }
  ];

  const colorStyles = {
    amber: { grad: "from-amber-400 to-amber-600" },
    rose: { grad: "from-rose-400 to-rose-600" },
    blue: { grad: "from-blue-400 to-blue-600" },
    emerald: { grad: "from-emerald-400 to-emerald-600" },
    indigo: { grad: "from-indigo-400 to-indigo-600" },
    teal: { grad: "from-teal-400 to-teal-600" },
    orange: { grad: "from-orange-400 to-orange-600" }
  };

  // Ukuran wheel (lingkaran besar) & posisi tiap bubble mengelilingi lingkaran tengah
  const wheelSize = 750;
  const center = wheelSize / 2;
  const centerCircleSize = 460;
  const orbitRadius = 280;
  const totalBubbles = karakterData.length;

  const getBubblePos = (idx, size) => {
    const angle = (-90 + idx * (360 / totalBubbles)) * (Math.PI / 180);
    const cx = center + orbitRadius * Math.cos(angle);
    const cy = center + orbitRadius * Math.sin(angle);
    return { left: cx - size / 2, top: cy - size / 2 };
  };

  const penerapanData = [
    { title: "Keluarga", desc: "Mengajarkan disiplin ibadah, menghormati orang tua, menjaga kebersihan, dan menghargai saudara." },
    { title: "Sekolah dan Masjid", desc: "Membiasakan ketertiban waktu, salam dan jabat tangan, berpakaian rapi, serta aktif dalam kegiatan sosial dan pengajian." },
    { title: "Komunitas", desc: "Mengamalkan nilai-nilai kerukunan, kerja sama, dan saling menolong dalam kehidupan sosial." }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-teal-500 selection:text-white">

      {/* Keyframes untuk animasi pergantian keterangan */}
      <style>{`
        @keyframes smoothReveal {
          0% { opacity: 0; transform: translateY(15px) scale(0.96); filter: blur(5px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
        }
        .smooth-reveal { animation: smoothReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 px-6 md:px-12 py-4 flex justify-between items-center backdrop-blur-xl bg-teal-900/40 border-b border-teal-700/40 shadow-sm transition-all">
        <div className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
          DesaSlogo.
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[100dvh] flex items-center justify-center pt-20 px-4">
        {/* Background Image & Global Overlay */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat z-[0]"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          {/* Dark overlay fixed across all sections */}
          <div className="absolute inset-0 bg-slate-900/50"></div>
        </div>

        {/* Ambient background glow (iOS/macOS modern aesthetic) */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/40 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-500/40 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Glassmorphism Card */}
        <div className="relative z-10 text-center px-6 sm:px-10 py-12 md:py-16 max-w-4xl w-full mx-auto rounded-[2.5rem] backdrop-blur-2xl bg-gradient-to-b from-teal-900/50 to-teal-950/50 border border-teal-700/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom-8 duration-1000">

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.15] mb-6 drop-shadow-lg">
            Membangun Generasi <br className="hidden md:block"/> 29 Karakter Luhur
          </h1>
          
          
          <Link
            to="/login"
            className="inline-flex items-center gap-3 bg-white/90 hover:bg-white text-slate-900 px-8 py-4 rounded-2xl font-semibold text-lg shadow-[0_4px_20px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all duration-300 active:scale-95 backdrop-blur-sm"
          >
            Login <LogIn size={20} className="text-slate-700" />
          </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center gap-2">
            <span className="text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase">Scroll</span>
            <ChevronDownIcon className="text-white/70 w-5 h-5" />
        </div>
      </section>

      {/* ABOUT / 29 KARAKTER LUHUR SECTION */}
      <section className="py-12 sm:py-16 md:py-24 px-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-4 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">29 Karakter Luhur</h2>
            <p className="text-slate-200 text-lg leading-relaxed drop-shadow-md">
              Karakter luhur adalah pedoman nilai-nilai akhlak mulia yang membentuk generasi muda menjadi pribadi berintegritas, mandiri, dan beriman.
            </p>
          </div>

          {/* DESKTOP: WHEEL / LINGKARAN BERPUTAR */}
          <div className="hidden lg:flex justify-center mb-16 mt-8">
            <div className="relative" style={{ width: wheelSize, height: wheelSize }}>

              {/* BUBBLES CONTAINER */}
              <div 
                className="absolute inset-0 transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `rotate(${wheelRotation}deg)` }}
              >
                {karakterData.map((item, idx) => {
                  const size = 96 + Math.min(item.items.length, 6) * 8;
                  const pos = getBubblePos(idx, size);
                  const isActive = selected === idx;
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
                        transitionDelay: mounted ? "0ms" : `${idx * 90}ms`
                      }}
                    >
                      <div 
                        className="w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ transform: `rotate(${-wheelRotation}deg)` }}
                      >
                        <button
                          onClick={() => handleSelectBubble(idx)}
                          className={`w-full h-full rounded-full flex flex-col items-center justify-center text-center transition-all duration-500 ease-out bg-gradient-to-br ${colorStyles[item.color].grad} ${
                            isActive
                              ? "scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)] ring-4 ring-white/80"
                              : "scale-100 shadow-lg hover:scale-105"
                          }`}
                        >
                          {React.cloneElement(item.icon, { className: "text-white w-5 h-5 mb-1" })}
                          <span className="text-white font-bold text-[11px] leading-tight px-2 drop-shadow-md">{item.title}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LINGKARAN TENGAH - menampilkan keterangan dengan animasi berputar */}
              <div
                className="absolute rounded-full backdrop-blur-2xl bg-gradient-to-b from-teal-900/50 to-teal-950/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-teal-700/40 flex items-center justify-center overflow-hidden z-30"
                style={{
                  width: centerCircleSize,
                  height: centerCircleSize,
                  left: center - centerCircleSize / 2,
                  top: center - centerCircleSize / 2
                }}
              >
                <div key={selected} className="smooth-reveal text-center px-4 py-2 w-[360px]">
                  <div className="flex flex-col items-center drop-shadow-md">
                    {karakterData[selected].icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">{karakterData[selected].title}</h3>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 pb-3 border-b border-white/20 drop-shadow-sm">
                    {karakterData[selected].subtitle}
                  </p>
                  <ul className="space-y-3 inline-block text-left mt-2">
                    {karakterData[selected].items.map((it, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="text-teal-400 w-4 h-4 shrink-0 drop-shadow-sm" />
                        <strong className="text-sm text-slate-200 drop-shadow-sm">{it.name}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE & TABLET: ACCORDION (fallback agar tetap nyaman di layar kecil) */}
          <div className="lg:hidden space-y-4 mb-16">
            {karakterData.map((kategori, idx) => {
              const isOpen = mobileOpen === idx;
              return (
                <div
                  key={kategori.title}
                  className="backdrop-blur-xl bg-gradient-to-b from-teal-900/50 to-teal-950/50 rounded-2xl border border-teal-700/40 shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => setMobileOpen(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br ${colorStyles[kategori.color].grad} shadow-inner`}>
                        {React.cloneElement(kategori.icon, { className: "text-white w-5 h-5 mb-0" })}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white drop-shadow-sm">{kategori.title}</h3>
                        <p className="text-[11px] text-slate-300 drop-shadow-sm">{kategori.subtitle}</p>
                      </div>
                    </div>
                    <ChevronDownIcon
                      className={`w-5 h-5 text-white/60 shrink-0 transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-500 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden text-center">
                      <ul className="space-y-3 px-5 pb-5 inline-block text-left">
                        {kategori.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-center gap-3">
                            <CheckCircle2 className="text-teal-400 w-4 h-4 shrink-0 drop-shadow-sm" />
                            <strong className="text-sm text-slate-200 drop-shadow-sm">{item.name}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SECTION PENERAPAN */}
          <div className="backdrop-blur-2xl bg-gradient-to-b from-teal-900/50 to-teal-950/50 rounded-2xl sm:rounded-3xl md:rounded-[3rem] p-6 sm:p-10 md:p-16 text-white relative overflow-hidden border border-teal-700/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

            <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center drop-shadow-md">Penerapan dalam Kehidupan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {penerapanData.map((item, idx) => (
                  <div key={idx} className="bg-teal-900/40 backdrop-blur-md rounded-2xl p-6 border border-teal-700/40 shadow-inner">
                    <h4 className="text-lg font-bold mb-3 text-white drop-shadow-sm">{item.title}</h4>
                    <p className="text-sm text-slate-200 leading-relaxed drop-shadow-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-center mt-12 text-slate-200 font-medium leading-relaxed max-w-3xl mx-auto border-t border-white/20 pt-8 drop-shadow-sm">
                29 Karakter luhur ini menjadi fondasi moral, spiritual, dan sosial bagi generasi muda, membentuk pribadi yang tangguh, berakhlak mulia, dan siap berkontribusi bagi masyarakat dan agama.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 backdrop-blur-lg bg-black/40 border-t border-white/10 text-slate-300 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} DesaSlogo. Sistem Manajemen Generus.</p>
      </footer>
    </div>
  );
}

// Icon ringan pembantu
function ChevronDownIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}