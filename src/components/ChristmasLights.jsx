import React from 'react';

export default function ChristmasLights() {
  if (new Date().getMonth() !== 11) return null;
  return (
    <div className="fixed top-0 left-0 w-full h-3 z-[60] flex justify-between px-2 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => {
        const colors = ['bg-red-500', 'bg-emerald-500', 'bg-yellow-400', 'bg-blue-500'];
        const color = colors[i % 4];
        return (
          <div 
            key={i} 
            className={`w-2 h-2 rounded-full ${color} shadow-[0_0_10px_2px_rgba(255,255,255,0.3)] animate-pulse`} 
            style={{ animationDuration: `${1 + Math.random()}s` }}
          ></div>
        );
      })}
    </div>
  );
}
