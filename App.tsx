
import React, { useState, useEffect, useRef } from 'react';
import { Message, Goal, MoodEntry, UserProfile, Sender, MoodType, ChatSession } from './types';
import { StorageService } from './services/storageService';
import { generateResponse } from './services/geminiService';
import { NotificationService } from './services/notificationService';
import ChatInterface from './components/ChatInterface';
import MoodTracker from './components/MoodTracker';
import GoalBoard from './components/GoalBoard';
import AuthScreen from './components/AuthScreen';
import ChatHistorySidebar from './components/ChatHistorySidebar';
import { Menu, MessageSquare, LayoutDashboard } from 'lucide-react';

// Web Speech API type augmentation
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

function App() {
  // --- Auth State ---
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // --- App Data State ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  
  // UI States
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'chat' | 'dashboard'>('chat');
  
  // Multilingual Support
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US'); // 'en-US', 'hi-IN', 'kn-IN'

  const handleSendMessageRef = useRef<(text: string) => void>(() => {});

  // --- Initialization ---

  // Check for last logged in user
  useEffect(() => {
    const lastUserId = StorageService.getLastUserId();
    if (lastUserId) {
      const savedProfile = StorageService.getProfile(lastUserId);
      if (savedProfile) {
        handleLogin(savedProfile);
      }
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      // Set language dynamically
      recognitionInstance.lang = selectedLanguage;
      
      recognitionInstance.onstart = () => setIsListening(true);
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) handleSendMessageRef.current(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.warn("Speech Recognition Error:", event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => setIsListening(false);
      
      setRecognition(recognitionInstance);

      // Cleanup function to abort listening if language changes or component unmounts
      return () => {
        recognitionInstance.abort();
      };
    }
  }, [selectedLanguage]); // Re-initialize when language changes

  // Initialize Notifications
  useEffect(() => {
    NotificationService.requestPermission();
  }, []);

  const handleLogin = (userProfile: UserProfile) => {
    setProfile(userProfile);
    StorageService.setLastUserId(userProfile.id);
    
    // Load User Data
    setGoals(StorageService.getGoals(userProfile.id));
    setMoods(StorageService.getMoods(userProfile.id));
    
    // Load Sessions
    const userSessions = StorageService.getSessions(userProfile.id);
    setSessions(userSessions);
    
    if (userSessions.length > 0) {
      selectSession(userSessions[0].id, userProfile.id);
    } else {
      createNewSession(userProfile.id);
    }
  };

  const handleLogout = () => {
    setProfile(null);
    setMessages([]);
    setGoals([]);
    setMoods([]);
    setSessions([]);
    setCurrentSessionId(null);
    localStorage.removeItem('lumi_last_user_id'); 
  };

  const createNewSession = (userId: string = profile!.id) => {
    const newSession = StorageService.createSession(userId);
    setSessions(StorageService.getSessions(userId)); 
    setCurrentSessionId(newSession.id);
    setMessages([]); 
    setIsSidebarOpen(false); 
    setMobileView('chat'); // Switch to chat when new session starts
  };

  const selectSession = (sessionId: string, userId: string = profile!.id) => {
    const msgs = StorageService.getMessages(userId, sessionId);
    setCurrentSessionId(sessionId);
    setMessages(msgs);
    setIsSidebarOpen(false);
    setMobileView('chat'); // Switch to chat when session selected
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) return;
    
    StorageService.deleteSession(profile.id, sessionId);
    const remaining = StorageService.getSessions(profile.id);
    setSessions(remaining);
    
    if (currentSessionId === sessionId) {
      if (remaining.length > 0) {
        selectSession(remaining[0].id);
      } else {
        createNewSession();
      }
    }
  };

  // --- Data Handlers (Defined early for use in handleSendMessage) ---
  const addGoal = (text: string) => {
    if (!profile) return;
    const newGoal: Goal = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: Date.now()
    };
    const updated = [newGoal, ...goals];
    setGoals(updated);
    StorageService.saveGoals(profile.id, updated);
  };

  const toggleGoal = (id: string) => {
    if (!profile) return;
    const updated = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    setGoals(updated);
    StorageService.saveGoals(profile.id, updated);
  };

  const deleteGoal = (id: string) => {
    if (!profile) return;
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    StorageService.saveGoals(profile.id, updated);
  };

  const handleMoodSelect = (mood: MoodType) => {
    if (!profile) return;
    const entry: MoodEntry = {
      id: Date.now().toString(),
      mood,
      timestamp: Date.now()
    };
    const updated = [entry, ...moods];
    setMoods(updated);
    StorageService.saveMood(profile.id, entry);
    
    // Send a natural conversational trigger to the AI
    handleSendMessage(`I'm feeling ${mood} right now.`);
    
    // On mobile, automatically switch to chat to see the supportive response
    if (window.innerWidth < 768) {
      setMobileView('chat');
    }
  };

  // --- Interaction Handlers ---

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Wait for voices to load if needed (though usually cached)
    let voices = window.speechSynthesis.getVoices();

    // Helper to normalize locale codes (e.g. 'en_US' -> 'en-US')
    const normalize = (l: string) => l.replace('_', '-').toLowerCase();
    const target = normalize(selectedLanguage);

    // 1. Filter voices for the selected language
    const langVoices = voices.filter(v => {
      const vLang = normalize(v.lang);
      return vLang === target || vLang.startsWith(target.split('-')[0]);
    });

    // 2. Find preferred voice (Female/Google/Zira/Samantha) within that language
    let selectedVoice = langVoices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.includes('Google') || 
      v.name.includes('Samantha') || 
      v.name.includes('Zira')
    );

    // 3. Fallback to any voice in that language
    if (!selectedVoice && langVoices.length > 0) {
      selectedVoice = langVoices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = selectedLanguage;
    }

    // Tone tuning: slightly higher pitch and slower rate for a "caring" effect
    utterance.pitch = 1.05; 
    utterance.rate = 0.95;
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (text: string) => {
    if (!profile || !currentSessionId) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: Sender.USER,
      timestamp: Date.now()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    StorageService.saveMessages(profile.id, currentSessionId, newHistory);
    
    // Update session preview text in sidebar
    StorageService.updateSessionPreview(profile.id, currentSessionId, text);
    setSessions(StorageService.getSessions(profile.id));

    setIsTyping(true);

    try {
      // 2. Fetch Global Memory (past sessions context)
      const globalMemory = StorageService.getGlobalMemory(profile.id, currentSessionId);

      // 3. Get AI Response with global context and language preference
      const response = await generateResponse(
        messages, 
        text, 
        profile, 
        goals, 
        moods, 
        globalMemory, 
        selectedLanguage // Pass selected language
      );
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        image: response.image, // Handle generated image
        detectedMood: response.detectedMood, // Handle detected mood
        sender: Sender.AI,
        timestamp: Date.now()
      };

      const updatedHistory = [...newHistory, aiMsg];
      setMessages(updatedHistory);
      StorageService.saveMessages(profile.id, currentSessionId, updatedHistory);
      
      // Handle Goal Addition from AI
      if (response.goalToAdd) {
        addGoal(response.goalToAdd);
      }

      speak(response.text);

    } catch (error) {
      console.error("Interaction failed", error);
    } finally {
      setIsTyping(false);
    }
  };

  // Keep ref updated
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage, currentSessionId]);

  const handleVoiceInput = () => {
    if (recognition) {
      if (isListening) recognition.stop();
      else recognition.start();
    } else {
      alert("Voice input is not supported in this browser. Try Chrome or Edge.");
    }
  };

  // --- Render ---

  if (!profile) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* Sidebar - Chat History */}
      <ChatHistorySidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => selectSession(id)}
        onNewChat={() => createNewSession()}
        onDeleteSession={deleteSession}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
             <Menu className="w-6 h-6" />
           </button>
           <span className="font-bold text-slate-700">Lumi</span>
           <div className="w-8"></div> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-hidden p-0 md:p-6 relative">
          <div className="max-w-6xl mx-auto h-full flex flex-col md:flex-row md:gap-6">
            
            {/* Left Column: Context & Utilities (Dashboard) */}
            <div className={`
              ${mobileView === 'dashboard' ? 'flex' : 'hidden'} 
              md:flex flex-col w-full md:w-1/3 gap-6 h-full overflow-y-auto pb-20 md:pb-4 p-4 md:p-0 custom-scrollbar
            `}>
              
              {/* Header Card */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/50 flex items-center gap-4 shrink-0">
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xl">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h1 className="font-bold text-lg text-slate-700 truncate">{profile.name}</h1>
                  <p className="text-xs text-slate-500 truncate">{profile.bio || "Let's achieve your goals."}</p>
                </div>
              </div>

              <MoodTracker 
                onSelectMood={handleMoodSelect} 
                recentMood={moods[0]} 
              />
              
              <div className="flex-1 min-h-[300px]">
                <GoalBoard 
                  goals={goals} 
                  onAddGoal={addGoal} 
                  onToggleGoal={toggleGoal} 
                  onDeleteGoal={deleteGoal}
                />
              </div>
            </div>

            {/* Right Column: Chat Interface */}
            <div className={`
              ${mobileView === 'chat' ? 'flex' : 'hidden'}
              md:flex w-full md:w-2/3 h-full pb-16 md:pb-0
            `}>
              <ChatInterface 
                messages={messages} 
                isTyping={isTyping} 
                onSendMessage={handleSendMessage} 
                onVoiceInput={handleVoiceInput}
                isListening={isListening}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
              />
            </div>

          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden absolute bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 z-10">
          <button 
            onClick={() => setMobileView('chat')}
            className={`flex flex-col items-center gap-1 ${mobileView === 'chat' ? 'text-violet-600' : 'text-slate-400'}`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs font-medium">Chat</span>
          </button>
          
          <button 
            onClick={() => setMobileView('dashboard')}
            className={`flex flex-col items-center gap-1 ${mobileView === 'dashboard' ? 'text-violet-600' : 'text-slate-400'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;
