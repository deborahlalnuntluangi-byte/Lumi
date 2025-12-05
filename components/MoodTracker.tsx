
import React from 'react';
import { MoodType, MoodEntry } from '../types';
import { Smile, Frown, Meh, Heart, CloudRain } from 'lucide-react';

interface MoodTrackerProps {
  onSelectMood: (mood: MoodType) => void;
  recentMood: MoodEntry | undefined;
}

const MoodTracker: React.FC<MoodTrackerProps> = ({ onSelectMood, recentMood }) => {
  
  const moodOptions = [
    { type: MoodType.GREAT, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', ring: 'ring-rose-400', label: 'Great' },
    { type: MoodType.GOOD, icon: Smile, color: 'text-amber-500', bg: 'bg-amber-50', ring: 'ring-amber-400', label: 'Good' },
    { type: MoodType.OKAY, icon: Meh, color: 'text-blue-400', bg: 'bg-blue-50', ring: 'ring-blue-400', label: 'Okay' },
    { type: MoodType.BAD, icon: Frown, color: 'text-indigo-500', bg: 'bg-indigo-50', ring: 'ring-indigo-400', label: 'Bad' },
    { type: MoodType.TERRIBLE, icon: CloudRain, color: 'text-slate-500', bg: 'bg-slate-100', ring: 'ring-slate-400', label: 'Rough' },
  ];

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/50 mb-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-600 font-semibold text-sm uppercase tracking-wide">
          How are you feeling?
        </h3>
        {recentMood && (
          <span className="text-[10px] text-slate-400 bg-white px-2 py-1 rounded-full shadow-sm">
            Recorded
          </span>
        )}
      </div>
      
      <div className="flex justify-between items-center relative z-10">
        {moodOptions.map((option) => {
          const isSelected = recentMood?.mood === option.type;
          
          return (
            <button
              key={option.type}
              onClick={() => onSelectMood(option.type)}
              className={`
                relative flex flex-col items-center gap-2 transition-all duration-300 group outline-none
                ${isSelected ? 'scale-110 -translate-y-1' : 'hover:scale-110 hover:-translate-y-1'}
              `}
            >
              <div 
                className={`
                  p-3 rounded-2xl transition-all duration-300 shadow-sm relative overflow-hidden
                  ${isSelected ? `${option.bg} ring-2 ${option.ring} shadow-md` : 'bg-slate-50 hover:bg-white'}
                `}
              >
                {/* Ping animation when selected */}
                {isSelected && (
                  <span className={`absolute inset-0 rounded-2xl animate-ping opacity-20 ${option.bg}`}></span>
                )}
                
                <option.icon 
                  className={`
                    w-7 h-7 transition-colors duration-300
                    ${isSelected ? option.color : 'text-slate-400 group-hover:' + option.color.split('-')[1] + '-400'}
                  `} 
                />
              </div>
              
              <span 
                className={`
                  text-xs font-medium transition-colors duration-300
                  ${isSelected ? 'text-slate-700 font-bold' : 'text-slate-400'}
                `}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MoodTracker;
