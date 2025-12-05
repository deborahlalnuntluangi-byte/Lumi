
import React, { useState, useEffect, useRef } from 'react';
import { Goal } from '../types';
import { CheckCircle2, Circle, Plus, Trash2, Play, Pause, Bell, X, BellRing, Coffee, Brain, Armchair } from 'lucide-react';
import { NotificationService } from '../services/notificationService';

interface GoalBoardProps {
  goals: Goal[];
  onToggleGoal: (id: string) => void;
  onAddGoal: (text: string) => void;
  onDeleteGoal: (id: string) => void;
}

const GoalBoard: React.FC<GoalBoardProps> = ({ goals, onToggleGoal, onAddGoal, onDeleteGoal }) => {
  const [newGoalText, setNewGoalText] = useState('');
  
  // --- Smart Timer State ---
  // Configuration State (The Picker)
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(25);
  const [inputSeconds, setInputSeconds] = useState(0);

  // Running State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(true); // True = Picker Mode, False = Countdown Mode

  // Alarm State
  const [isRinging, setIsRinging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    // A standard alarm beep sound
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audioRef.current.loop = true; // Enable looping
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Request notification permission
  useEffect(() => {
    NotificationService.requestPermission();
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer Finished
            setIsRunning(false);
            setIsRinging(true); // Enable ringing state
            
            NotificationService.sendNotification("Lumi Timer", "Time's up! Great focus session.");
            
            // Play Looping Audio
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(e => console.log("Audio play failed", e));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // --- Handlers ---

  const handleStart = () => {
    if (isConfiguring) {
      // Convert inputs to total seconds
      const total = (inputHours * 3600) + (inputMinutes * 60) + inputSeconds;
      if (total === 0) return; // Don't start 0 timer
      
      setTotalDuration(total);
      setTimeLeft(total);
      setIsConfiguring(false);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsConfiguring(true); // Go back to picker
  };

  const handleStopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsRinging(false);
    setIsConfiguring(true); // Reset to setup
  };

  // --- Smart Goal Time Parsing ---
  const parseAndSetTimer = (text: string) => {
    const lower = text.toLowerCase();
    let h = 0, m = 0, s = 0;
    let found = false;

    // Extract Hours (e.g. 1h, 2 hours)
    const hMatch = lower.match(/(\d+)\s*(?:h|hr|hours?)/);
    if (hMatch) { h = parseInt(hMatch[1]); found = true; }
    
    // Extract Minutes (e.g. 30m, 20 mins)
    const mMatch = lower.match(/(\d+)\s*(?:m|min|mins|minutes?)/);
    if (mMatch) { m = parseInt(mMatch[1]); found = true; }
    
    // Extract Seconds (e.g. 30s)
    const sMatch = lower.match(/(\d+)\s*(?:s|sec|secs|seconds?)/);
    if (sMatch) { s = parseInt(sMatch[1]); found = true; }

    if (found) {
      // Normalize time
      if (s >= 60) { m += Math.floor(s / 60); s %= 60; }
      if (m >= 60) { h += Math.floor(m / 60); m %= 60; }

      // Update State
      setInputHours(h);
      setInputMinutes(m);
      setInputSeconds(s);

      // Reset timer UI to show the new config
      setIsConfiguring(true);
      setIsRunning(false);
      setIsRinging(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalText.trim()) {
      const text = newGoalText.trim();
      onAddGoal(text);
      // Automatically parse the time from the goal text and update the timer
      parseAndSetTimer(text);
      setNewGoalText('');
    }
  };

  // --- Pomodoro Presets ---
  const setPomodoroPreset = (minutes: number) => {
    setInputHours(0);
    setInputMinutes(minutes);
    setInputSeconds(0);
  };

  // --- Render Helpers ---

  // Format seconds into HH:MM:SS for the countdown display
  const formatCountdown = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Input change handler ensuring positive numbers
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number>>, val: string, max: number = 99) => {
    let num = parseInt(val);
    if (isNaN(num)) num = 0;
    num = Math.max(0, Math.min(max, num)); // Clamp
    setter(num);
  };

  // SVG Circle Logic
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalDuration) * circumference;

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/50 h-full flex flex-col">
      {/* --- Goals Section --- */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-600 font-semibold text-sm uppercase tracking-wide">
          Daily Goals
        </h3>
        <div className="text-xs text-slate-400 font-medium">
          {goals.filter(g => g.completed).length}/{goals.length} Done
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar min-h-[150px]">
        {goals.length === 0 && (
          <p className="text-center text-slate-400 text-sm mt-8 italic">
            No goals yet. Add one below.
          </p>
        )}
        
        {goals.map(goal => (
          <div 
            key={goal.id} 
            className={`group flex items-center justify-between p-3 rounded-xl transition-all ${goal.completed ? 'bg-emerald-50/50' : 'bg-white hover:bg-slate-50'}`}
          >
            {/* Goal Content Wrapper */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              
              {/* Toggle Completion Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleGoal(goal.id); }}
                className="flex-shrink-0 focus:outline-none"
              >
                {goal.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 hover:text-violet-400 transition-colors" />
                )}
              </button>
              
              {/* Click Text to Set Timer */}
              <button 
                onClick={() => parseAndSetTimer(goal.text)}
                className={`flex-1 text-left truncate text-sm focus:outline-none transition-colors ${goal.completed ? 'text-emerald-700 line-through' : 'text-slate-700 hover:text-violet-600'}`}
                title="Click text to auto-set timer (e.g. 'Read for 20 mins')"
              >
                {goal.text}
              </button>
            </div>

            {/* Delete Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteGoal(goal.id); }}
              className="text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddGoal} className="relative mb-6">
        <input
          type="text"
          value={newGoalText}
          onChange={(e) => setNewGoalText(e.target.value)}
          placeholder="New goal... (e.g. Read 20 mins)"
          className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-violet-200 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all"
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-violet-500 hover:bg-violet-600 rounded-lg text-white transition-colors disabled:opacity-50"
          disabled={!newGoalText.trim()}
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* --- Smart Phone Style Timer Section --- */}
      <div className="pt-4 border-t border-slate-100 mt-auto">
        <div className={`bg-slate-900 rounded-2xl p-4 text-white relative overflow-hidden shadow-lg shadow-slate-300 transition-colors duration-500 ${isRinging ? 'ring-4 ring-rose-500 ring-opacity-50' : ''}`}>
          
          <div className="flex items-center gap-2 mb-4 justify-between">
            <div className="flex items-center gap-2">
              {isRinging ? (
                <BellRing className="w-4 h-4 text-rose-400 animate-bounce" />
              ) : (
                <Bell className="w-4 h-4 text-violet-400" />
              )}
              <span className={`text-xs font-semibold uppercase tracking-wider ${isRinging ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                {isRinging ? "Alarm Ringing" : "Timer"}
              </span>
            </div>
            {/* Show total time preset if running */}
            {!isConfiguring && !isRinging && (
               <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                 {Math.floor(totalDuration/60)}m Session
               </span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center min-h-[160px]">
            
            {/* Mode 1: Configuration (Picker) */}
            {isConfiguring && !isRinging && (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full">
                
                {/* Time Picker */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="flex flex-col items-center">
                    <input 
                      type="number" 
                      value={inputHours.toString()}
                      onChange={(e) => handleInputChange(setInputHours, e.target.value, 23)}
                      className="w-16 h-16 bg-slate-800 rounded-xl text-3xl font-mono text-center focus:outline-none focus:ring-2 focus:ring-violet-500 text-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 uppercase">Hours</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-600 pb-4">:</span>
                  <div className="flex flex-col items-center">
                    <input 
                      type="number" 
                      value={inputMinutes.toString()}
                      onChange={(e) => handleInputChange(setInputMinutes, e.target.value, 59)}
                      className="w-16 h-16 bg-slate-800 rounded-xl text-3xl font-mono text-center focus:outline-none focus:ring-2 focus:ring-violet-500 text-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 uppercase">Mins</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-600 pb-4">:</span>
                  <div className="flex flex-col items-center">
                    <input 
                      type="number" 
                      value={inputSeconds.toString()}
                      onChange={(e) => handleInputChange(setInputSeconds, e.target.value, 59)}
                      className="w-16 h-16 bg-slate-800 rounded-xl text-3xl font-mono text-center focus:outline-none focus:ring-2 focus:ring-violet-500 text-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 uppercase">Secs</span>
                  </div>
                </div>

                {/* Pomodoro Presets */}
                <div className="flex gap-2 w-full justify-center">
                   <button 
                     onClick={() => setPomodoroPreset(25)}
                     className="flex-1 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 py-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center gap-1 border border-violet-500/30"
                   >
                     <Brain className="w-3 h-3" />
                     Focus (25m)
                   </button>
                   <button 
                     onClick={() => setPomodoroPreset(5)}
                     className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 py-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center gap-1 border border-emerald-500/30"
                   >
                     <Coffee className="w-3 h-3" />
                     Short (5m)
                   </button>
                   <button 
                     onClick={() => setPomodoroPreset(15)}
                     className="flex-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 py-2 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center gap-1 border border-blue-500/30"
                   >
                     <Armchair className="w-3 h-3" />
                     Long (15m)
                   </button>
                </div>
              </div>
            )}

            {/* Mode 2: Running/Paused or Ringing (Progress Circle) */}
            {(!isConfiguring || isRinging) && (
              <div className="relative flex items-center justify-center animate-in fade-in zoom-in duration-300">
                {/* SVG Ring */}
                <svg width="140" height="140" className={`transform -rotate-90 ${isRinging ? 'animate-pulse' : ''}`}>
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="#1e293b" // slate-800
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={isRinging ? "#f43f5e" : "#8b5cf6"} // rose-500 if ringing, else violet-500
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                {/* Digital Time */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-mono font-bold tracking-wider tabular-nums ${isRinging ? 'text-rose-400 animate-bounce' : 'text-white'}`}>
                    {formatCountdown(timeLeft)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            {isRinging ? (
              <button 
                onClick={handleStopAlarm}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 animate-pulse shadow-lg shadow-rose-900/50"
              >
                <BellRing className="w-5 h-5 animate-bounce" />
                Stop Alarm
              </button>
            ) : !isConfiguring ? (
               <>
                 <button 
                   onClick={handleReset}
                   className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                   title="Cancel / Reset"
                 >
                   <X className="w-5 h-5" />
                 </button>
                 
                 <button 
                   onClick={isRunning ? handlePause : handleStart}
                   className={`w-16 h-16 flex items-center justify-center rounded-full transition-all shadow-lg shadow-violet-900/50 ${
                     isRunning 
                       ? 'bg-amber-500 hover:bg-amber-400 text-white' 
                       : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                   }`}
                 >
                   {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                 </button>
               </>
            ) : (
              <button 
                onClick={handleStart}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Start Focus
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default GoalBoard;
