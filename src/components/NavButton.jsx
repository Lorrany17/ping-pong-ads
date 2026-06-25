import React from 'react';

export default function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center w-16 md:w-full transition-colors ${
        active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon className={`w-6 h-6 mb-1 ${active ? 'fill-emerald-400/20' : ''}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
