import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ name, value, onChange, options, required, placeholder, className = '', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelect = (selectedValue) => {
    setIsOpen(false);
    if (onChange) {
      onChange({
        target: { name, value: selectedValue }
      });
    }
  };

  const selectedOption = options.find(o => String(o.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : (placeholder || 'Pilih...');

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      {required && <input type="hidden" name={name} value={value} required={required} />}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left pl-3.5 pr-4 py-2.5 bg-white border ${isOpen ? 'border-teal-400 ring-2 ring-teal-400' : 'border-slate-200'} rounded-xl text-sm text-slate-800 transition-all cursor-pointer outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-teal-400'}`}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400' : ''}`}>{displayLabel}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 focus:outline-none py-1.5">
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-slate-400">Tidak ada opsi</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={(e) => {
                  e.preventDefault();
                  if (!opt.disabled) handleSelect(opt.value);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${String(value) === String(opt.value) ? 'bg-teal-50 text-teal-700' : (opt.disabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-50 hover:text-teal-600')}`}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
