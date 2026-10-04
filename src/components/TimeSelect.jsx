import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const DEFAULT_SHORTCUTS = ['18:15', '18:30', '19:30'];

export default function TimeSelect({ name, value, onChange, placeholder = 'Pilih Jam...', shortcuts = DEFAULT_SHORTCUTS }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const hourListRef = useRef(null);

  const [hour, minute] = (value || '').split(':');

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  // Auto scroll to selected hour when opened
  useEffect(() => {
    if (open && hourListRef.current && hour) {
      const idx = HOURS.indexOf(hour);
      if (idx >= 0) {
        const el = hourListRef.current.children[idx];
        if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }
  }, [open]);

  const handleSelect = (h, m) => {
    const newValue = `${h}:${m}`;
    if (onChange) {
      onChange({ target: { name, value: newValue } });
    }
    setOpen(false);
  };

  const handleHourClick = (h) => {
    const m = minute || '00';
    handleSelect(h, m);
  };

  const handleMinuteClick = (m) => {
    const h = hour || '18';
    handleSelect(h, m);
  };

  const displayValue = value ? `${value} WIB` : placeholder;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Clock size={14} className="text-slate-400" />
          <span className={value ? 'text-slate-800 font-semibold' : 'text-slate-400'}>{displayValue}</span>
        </span>
        <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Shortcut buttons */}
      {shortcuts.length > 0 && (
        <div className="flex gap-1.5 mt-1.5">
          {shortcuts.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => {
                if (onChange) onChange({ target: { name, value: t } });
                setOpen(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                value === t
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 border border-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1.5 w-[180px] bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="flex">
            {/* Kolom Jam */}
            <div className="flex-1 border-r border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5 bg-slate-50 border-b border-slate-100 text-center">Jam</p>
              <div ref={hourListRef} className="max-h-40 overflow-y-auto thin-scrollbar">
                {HOURS.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourClick(h)}
                    className={`w-full px-2 py-1.5 text-xs font-semibold text-center transition-colors ${
                      h === hour
                        ? 'bg-teal-500 text-white'
                        : 'text-slate-700 hover:bg-teal-50'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Kolom Menit */}
            <div className="flex-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5 bg-slate-50 border-b border-slate-100 text-center">Menit</p>
              <div className="max-h-40 overflow-y-auto">
                {MINUTES.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteClick(m)}
                    className={`w-full px-2 py-1.5 text-xs font-semibold text-center transition-colors ${
                      m === minute
                        ? 'bg-teal-500 text-white'
                        : 'text-slate-700 hover:bg-teal-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
