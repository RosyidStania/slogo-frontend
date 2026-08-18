import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

export default function CustomMultiSelect({ name, value = [], onChange, options, placeholder, className = "", disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [wrapperRef]);

  const toggleOption = (optionValue) => {
    let newValue = [...value];
    if (newValue.includes(optionValue)) {
      newValue = newValue.filter(v => v !== optionValue);
    } else {
      newValue.push(optionValue);
    }
    if (onChange) {
      onChange(newValue);
    }
  };

  const removeOption = (e, optionValue) => {
    e.stopPropagation();
    const newValue = value.filter(v => v !== optionValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      <div
        className={`w-full min-h-[42px] flex items-center justify-between pl-2 pr-4 py-1.5 bg-white border ${isOpen ? "border-teal-400 ring-2 ring-teal-400" : "border-slate-200"} rounded-xl text-sm text-slate-800 transition-all cursor-pointer outline-none ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-teal-400"}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1 pr-2">
          {value.length === 0 ? (
            <span className="text-slate-400 pl-1.5 py-1">{placeholder || "Pilih..."}</span>
          ) : (
            value.map(val => {
              const opt = options.find(o => o.value === val);
              return (
                <span key={val} className="flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-1 rounded-lg text-xs font-semibold">
                  {opt ? opt.label : val}
                  <button type="button" onClick={(e) => removeOption(e, val)} className="hover:bg-teal-100 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 focus:outline-none py-1.5">
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-slate-400">Tidak ada opsi</div>
          ) : (
            options.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!opt.disabled) toggleOption(opt.value);
                  }}
                  className={`w-full flex items-center justify-between text-left px-4 py-2.5 text-sm font-medium transition-colors ${isSelected ? "bg-teal-50 text-teal-700" : (opt.disabled ? "text-slate-400 cursor-not-allowed" : "text-slate-700 hover:bg-slate-50 hover:text-teal-600")}`}
                >
                  {opt.label}
                  {isSelected && <Check size={16} className="text-teal-600" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
