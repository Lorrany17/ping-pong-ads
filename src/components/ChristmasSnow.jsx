import React from 'react';

export default function ChristmasSnow() {
  if (new Date().getMonth() !== 11) return null;
  
  const snowStyle = `
    @keyframes snowfall {
      0% { transform: translateY(-10px) translateX(0); opacity: 1; }
      100% { transform: translateY(100vh) translateX(20px); opacity: 0; }
    }
    .snowflake { position: fixed; top: -10px; color: #fff; font-size: 1em; opacity: 0.8; pointer-events: none; z-index: 0; animation: snowfall linear infinite; }
  `;
  const snowflakes = Array.from({ length: 30 }).map((_, i) => {
    const left = Math.random() * 100;
    const animDuration = 5 + Math.random() * 10;
    const animDelay = Math.random() * 5;
    const size = 0.5 + Math.random();
    return (
      <div 
        key={i} 
        className="snowflake" 
        style={{ 
          left: `${left}vw`, 
          animationDuration: `${animDuration}s`, 
          animationDelay: `${animDelay}s`, 
          transform: `scale(${size})` 
        }}
      >
        ❄
      </div>
    );
  });
  
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
      <style>{snowStyle}</style>
      {snowflakes}
    </div>
  );
}
