import React, { useState } from 'react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storageService';
import { ArrowRight, Mail, Lock, User, Briefcase, Heart, Calendar } from 'lucide-react';
import Avatar from './Avatar';

interface AuthScreenProps {
  onLogin: (profile: UserProfile) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register State
  const [regStep, setRegStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    occupation: '',
    bio: ''
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = StorageService.loginUser(loginEmail, loginPassword);
    if (profile) {
      onLogin(profile);
    } else {
      setLoginError("Invalid email or password");
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const profile = StorageService.registerUser(formData);
      onLogin(profile);
    } catch (err) {
      setLoginError("Account already exists with this email.");
    }
  };

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background blobs */}
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 text-center mb-8 flex flex-col items-center">
          <div className="mb-4 shadow-lg shadow-violet-500/30 rounded-full">
            <Avatar size="xl" state="idle" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Lumi</h1>
          <p className="text-slate-300 text-sm">Your intelligent companion for a balanced life.</p>
        </div>

        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  required
                />
              </div>
            </div>

            {loginError && <p className="text-rose-400 text-xs text-center">{loginError}</p>}

            <button type="submit" className="w-full py-3 bg-white text-violet-900 font-bold rounded-xl hover:bg-slate-100 transition-all shadow-lg">
              Sign In
            </button>
            
            <p className="text-center text-slate-400 text-sm mt-4">
              Don't have an account? <button type="button" onClick={() => { setView('register'); setRegStep(1); }} className="text-white hover:underline">Create Profile</button>
            </p>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Progress Bar */}
            <div className="flex gap-2 mb-6 justify-center">
              {[1, 2].map(step => (
                <div key={step} className={`h-1 w-12 rounded-full transition-colors ${regStep >= step ? 'bg-violet-400' : 'bg-slate-700'}`} />
              ))}
            </div>

            {regStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-white font-semibold text-center mb-4">Account Basics</h3>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="Email Address"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateForm('password', e.target.value)}
                    placeholder="Create Password"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    if (formData.name && formData.email && formData.password) setRegStep(2);
                  }}
                  className="w-full py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-all flex items-center justify-center gap-2"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {regStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-white font-semibold text-center mb-4">Personalize Lumi</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => updateForm('age', e.target.value)}
                      placeholder="Age"
                      className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => updateForm('occupation', e.target.value)}
                      placeholder="Job/Student"
                      className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <Heart className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <textarea
                    value={formData.bio}
                    onChange={(e) => updateForm('bio', e.target.value)}
                    placeholder="What is your main goal right now? (e.g., 'To handle exam stress', 'To get fit')"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px]"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setRegStep(1)}
                    className="w-1/3 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-3 bg-white text-violet-900 font-bold rounded-xl hover:bg-slate-100 transition-all shadow-lg"
                  >
                    Complete Setup
                  </button>
                </div>
              </div>
            )}
            
            <p className="text-center text-slate-400 text-sm mt-4">
              Already have an account? <button type="button" onClick={() => setView('login')} className="text-white hover:underline">Log In</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;