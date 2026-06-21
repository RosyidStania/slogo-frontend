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
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 shadow-lg shadow-teal-500/10 border border-slate-100 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6">
          <QrCode size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Kode QR Absensi</h1>
        <p className="text-slate-500 text-sm mb-8">
          Tunjukkan kode QR ini kepada petugas absen saat mengikuti kegiatan.
        </p>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <QRCodeSVG 
            id="qr-code-svg"
            value={qrValue} 
            size={200}
            level="H"
            includeMargin={true}
            fgColor="#0f172a"
          />
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-1">{generus.nama_lengkap}</h2>
        <p className="text-teal-600 font-medium text-sm mb-6">ID: {generus.id} • {generus.kelompok}</p>

        <button 
          onClick={handleDownloadQR}
          className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-teal-500/20"
        >
          <Download size={18} />
          Simpan Kode QR
        </button>
      </div>
    </div>
  );
}
