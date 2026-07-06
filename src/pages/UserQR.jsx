import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import { QrCode, AlertCircle, Download } from 'lucide-react';

export default function UserQR() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/user/report');
      setReport(res.data.data);
    } catch (error) {
      console.error("Gagal mengambil data report:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!report || !report.generus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-6">
          <AlertCircle size={40} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Akun Belum Tertaut
        </h1>
        <p className="text-slate-500 max-w-sm">
          Akun Anda belum dihubungkan dengan data Generus. Silakan hubungi admin.
        </p>
      </div>
    );
  }

  const { generus } = report;
  // Harus sama persis dengan yang ada di ManageGenerus agar bisa di-scan oleh Admin
  const qrValue = `SLOGO-GEN-${generus.id}`;

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_Absen_${generus.nama_lengkap.replace(/\s+/g, '_')}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 flex justify-center animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="w-full relative group">
        {/* Glow behind the card */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
        
        {/* The Card */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100/50 flex flex-col items-center">
          
          {/* Top Header part of the card */}
          <div className="w-full bg-gradient-to-br from-teal-500 to-teal-700 p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-white/20">
              <QrCode size={28} />
            </div>
            <h1 className="text-xl font-bold text-white mb-1 drop-shadow-sm">ID Card Digital</h1>
            <p className="text-teal-50 text-xs font-medium opacity-90 text-center">
              Scan untuk Presensi Kehadiran
            </p>
          </div>

          {/* QR Code Area */}
          <div className="w-full bg-slate-50 relative pt-10 pb-8 px-8 flex flex-col items-center">
            {/* Cutout circles for ticket effect */}
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-slate-50 rounded-full shadow-inner"></div>
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-slate-50 rounded-full shadow-inner"></div>
            
            <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200/60 mb-6 group-hover:scale-105 transition-transform duration-500 relative">
              {/* Scan animation line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-teal-400 opacity-0 group-hover:opacity-100 group-hover:animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(45,212,191,0.8)] z-10"></div>
              <QRCodeSVG 
                id="qr-code-svg"
                value={qrValue} 
                size={200}
                level="H"
                includeMargin={true}
                fgColor="#0f172a"
              />
            </div>

            <div className="text-center w-full">
              <h2 className="text-xl font-black text-slate-800 mb-1 truncate px-2">{generus.nama_lengkap}</h2>
              <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
                <span>{generus.kelompok}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="text-teal-600">ID: {generus.id}</span>
              </div>

              <button 
                onClick={handleDownloadQR}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Download size={18} />
                Simpan ke Galeri
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
