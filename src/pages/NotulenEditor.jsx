import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  ChevronLeft, Calendar, Clock, MapPin, Users,
  Save, Copy, Check, Loader2
} from 'lucide-react';

const FULL_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const FULL_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatFullDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString + 'T00:00:00');
  if (isNaN(d.getTime())) return dateString;
  const dayName = FULL_DAYS[d.getDay()];
  const day = d.getDate();
  const monthName = FULL_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export default function NotulenEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canvasText, setCanvasText] = useState('');
  const [initialText, setInitialText] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef(null);

  // Fetch note by ID
  const fetchNote = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/notulen/${id}`);
      const data = res.data.data;
      setNote(data);
      const text = data.pembahasan || '';
      setCanvasText(text);
      setInitialText(text);
    } catch (err) {
      console.error('Gagal mengambil data notulen:', err);
      alert('Notulen tidak ditemukan atau gagal dimuat.');
      navigate('/admin/notulen');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNote();
  }, [fetchNote]);

  // Focus textarea when loaded
  useEffect(() => {
    if (!loading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [loading]);

  const hasUnsavedChanges = canvasText !== initialText;

  // Save Canvas
  const handleSave = async () => {
    if (!note) return;
    try {
      setSaving(true);
      const res = await api.put(`/admin/notulen/${note.id}`, {
        pembahasan: canvasText
      });
      const updated = res.data.data;
      setNote(updated);
      setInitialText(canvasText);

      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      console.error('Gagal menyimpan catatan:', err);
      alert('Gagal menyimpan catatan ke server.');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  // Salin isi notulen ke clipboard
  const handleCopy = () => {
    if (!note) return;
    const dateStr = formatFullDate(note.tanggal);
    let text = `*NOTULEN MUSYAWARAH*\n`;
    text += `*${(note.judul || '').toUpperCase()}*\n`;
    text += `─────────────────────\n`;
    text += `📅 Hari, Tanggal: ${dateStr}\n`;
    if (note.waktu) text += `⏰ Waktu: ${note.waktu}\n`;
    if (note.lokasi) text += `📍 Tempat: ${note.lokasi}\n`;
    if (note.peserta_hadir_count) text += `👥 Kehadiran: ${note.peserta_hadir_count} Peserta Hadir\n`;
    text += `─────────────────────\n\n`;

    if (canvasText && canvasText.trim()) {
      text += `${canvasText.trim()}\n\n`;
    } else {
      text += `(Belum ada catatan pembahasan)\n\n`;
    }

    text += `─────────────────────\n`;
    text += `Dicatat melalui Aplikasi Notulen Desa Slogo`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const wordCount = canvasText.trim() ? canvasText.trim().split(/\s+/).length : 0;
  const lineCount = canvasText ? canvasText.split('\n').length : 0;

  if (loading) {
    return (
      <div className="w-full py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 size={34} className="text-[#14b8a6] animate-spin" />
        <p className="text-xs font-bold text-slate-500">Membuka lembar notulen...</p>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="w-full py-2.5 sm:py-5 pb-28 sm:pb-12 space-y-3 sm:space-y-4">
      {/* ── iOS NAVIGATION & TOP ACTION BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        {/* Tombol Kembali & Info Acara */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/admin/notulen')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 transition-transform active:scale-90 cursor-pointer"
            title="Kembali ke Daftar Notulen"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                {note.judul}
              </h1>
              {savedNotice && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/70 shrink-0">
                  <Check size={11} strokeWidth={2.5} /> Tersimpan
                </span>
              )}
              {hasUnsavedChanges && !savedNotice && (
                <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Belum Disimpan
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-500 font-medium mt-1 tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Calendar size={11} className="text-slate-400" />
                <span>{formatFullDate(note.tanggal)}</span>
              </span>
              {note.waktu && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} className="text-slate-400" />
                  <span>{note.waktu}</span>
                </span>
              )}
              {note.lokasi && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} className="text-slate-400" />
                  <span>{note.lokasi}</span>
                </span>
              )}
              {note.peserta_hadir_count != null && note.peserta_hadir_count > 0 && (
                <span className="inline-flex items-center gap-1 text-teal-700 font-bold">
                  <Users size={11} />
                  <span>{note.peserta_hadir_count} Hadir</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Group iOS Style (Responsive Grid on Mobile) */}
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className={`py-2 px-3 sm:px-3.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
              copied
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-teal-50 hover:bg-teal-100 text-[#14b8a6] border border-teal-200/60'
            }`}
          >
            {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="py-2 px-4 rounded-full bg-[#14b8a6] hover:bg-[#0d9488] disabled:bg-slate-200 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(20,184,166,0.25)] cursor-pointer active:scale-95 transition-all"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {/* ── iOS NOTES CANVAS PAPER (DOKUMEN LEMBAR TULISAN) ── */}
      <div className="bg-white rounded-[20px] sm:rounded-[28px] border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col min-h-[58vh] sm:min-h-[70vh]">
        {/* Area Kanvas Tulisan Tanpa Border Ganda */}
        <div className="flex-1 p-4 sm:p-8 sm:p-10 flex flex-col">
          <textarea
            ref={textareaRef}
            value={canvasText}
            onChange={(e) => setCanvasText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            className="w-full flex-1 min-h-[380px] sm:min-h-[540px] bg-transparent text-slate-800 text-base leading-relaxed focus:outline-none border-0 resize-none font-sans"
          />
        </div>

        {/* Footer Kanvas: Info Karakter & Tips */}
        <div className="px-4 sm:px-10 py-3 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400 font-medium tabular-nums">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <span>{canvasText.length} Karakter</span>
            <span>•</span>
            <span>{wordCount} Kata</span>
            <span>•</span>
            <span>{lineCount} Baris</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
            <span>Pintasan:</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-[10px] shadow-2xs">
              Ctrl+S
            </kbd>
            <span>untuk menyimpan cepat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
