import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { getSeasonOptions } from '../utils';

export default function SeasonSelector({ current, onChange }) {
  const options = getSeasonOptions();
  return (
    <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700 mb-4 shadow-sm relative">
      <Calendar className="text-emerald-400 w-5 h-5 absolute left-3 pointer-events-none" />
      <select 
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-white text-sm font-bold outline-none w-full cursor-pointer pl-8 appearance-none py-1 relative z-10"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="text-slate-500 w-4 h-4 absolute right-3 pointer-events-none" />
    </div>
  );
}
