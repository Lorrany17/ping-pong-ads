import React from 'react';

export default function AvatarDisplay({ avatar, size = "md", className = "" }) {
  const isImage = avatar && (avatar.startsWith('data:image') || avatar.startsWith('http'));
  
  const sizeClasses = { 
    xs: "w-6 h-6 min-w-[1.5rem] text-sm flex-shrink-0", 
    sm: "w-8 h-8 min-w-[2rem] text-lg flex-shrink-0", 
    md: "w-12 h-12 min-w-[3rem] text-2xl flex-shrink-0", 
    lg: "w-16 h-16 min-w-[4rem] text-4xl flex-shrink-0", 
    xl: "w-24 h-24 min-w-[6rem] text-6xl flex-shrink-0" 
  };
  
  const isChristmas = new Date().getMonth() === 11;

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden bg-slate-700 border border-slate-600 ${className} relative z-0`}>
        {isImage ? (
          <img 
            src={avatar} 
            alt="Av" 
            className="w-full h-full object-cover" 
            onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerHTML='❌'; }} 
          />
        ) : (
          <span role="img">{avatar || '👤'}</span>
        )}
      </div>
      
      {isChristmas && (
        <svg 
          viewBox="0 0 100 100" 
          className="absolute -top-5 -right-4 w-9 h-9 z-10 pointer-events-none filter drop-shadow-lg" 
          style={{ transform: 'scaleX(-1) rotate(-25deg)' }}
        >
          <path d="M20,80 Q50,10 80,80" fill="#ef4444" />
          <circle cx="20" cy="80" r="10" fill="white" />
          <path d="M45,80 Q65,90 85,80" stroke="white" strokeWidth="12" strokeLinecap="round" fill="none" />
        </svg>
      )}
    </div>
  );
}
