
import React from 'react';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  state: 'idle' | 'listening' | 'thinking';
  className?: string;
}

// Updated to a Pink Robot avatar (Bottts style) to match the user's provided image
const LUMI_IMG_URL = "https://api.dicebear.com/9.x/bottts/svg?seed=Lumi&backgroundColor=ec4899";

const Avatar: React.FC<AvatarProps> = ({ size = 'md', state, className = '' }) => {
  // Size mapping
  const sizeClasses = {
    sm: 'w-10 h-10',       // Header icon
    md: 'w-20 h-20',
    lg: 'w-32 h-32',       // Chat empty state
    xl: 'w-40 h-40'        // Auth screen
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      
      {/* --- BACKGROUND EFFECTS (Auras) --- */}
      
      {/* Idle Glow */}
      {state === 'idle' && (
        <div className="absolute inset-0 bg-violet-400/30 blur-2xl rounded-full animate-pulse"></div>
      )}

      {/* Listening Ripple */}
      {state === 'listening' && (
        <>
          <div className="absolute inset-[-20%] bg-rose-400/20 rounded-full animate-ping"></div>
          <div className="absolute inset-[-10%] border-2 border-rose-300/50 rounded-full animate-pulse"></div>
        </>
      )}

      {/* Thinking Spinners */}
      {state === 'thinking' && (
        <>
          <div className="absolute inset-[-10%] border-t-2 border-r-2 border-violet-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 border-b-2 border-l-2 border-fuchsia-400 rounded-full animate-spin-reverse opacity-70"></div>
          <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse"></div>
        </>
      )}

      {/* --- CHARACTER IMAGE --- */}
      <div className={`
        relative z-10 w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-white/50
        ${state === 'idle' ? 'animate-breathe' : ''}
        ${state === 'listening' ? 'scale-105 transition-transform duration-300' : ''}
      `}>
        <img 
          src={LUMI_IMG_URL} 
          alt="Lumi Avatar" 
          className="w-full h-full object-cover bg-pink-500"
        />
        
        {/* Glossy Overlay */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-transparent to-white/30 pointer-events-none"></div>
      </div>

      {/* State Badge (Optional small indicator) */}
      {state === 'thinking' && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-violet-500 border-2 border-white rounded-full animate-bounce z-20"></div>
      )}
      {state === 'listening' && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full animate-pulse z-20"></div>
      )}

    </div>
  );
};

export default Avatar;
